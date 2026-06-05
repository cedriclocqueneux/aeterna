package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"
)

const brevoAPIURL = "https://api.brevo.com/v3/contacts"

// BrevoService ajoute des contacts à une liste Brevo (optionnel).
// Si APIKey ou ListID ne sont pas configurés, toutes les opérations sont silencieusement ignorées.
type BrevoService struct {
	apiKey string
	listID int
	client *http.Client
}

// NewBrevoService crée un BrevoService à partir de la clé API et de l'ID de liste (sous forme de chaîne).
// Retourne nil si l'un ou l'autre est vide — le service est alors désactivé.
func NewBrevoService(apiKey, listIDStr string) *BrevoService {
	if apiKey == "" || listIDStr == "" {
		return nil
	}
	listID, err := strconv.Atoi(listIDStr)
	if err != nil || listID <= 0 {
		slog.Warn("BREVO_LIST_ID invalide — Brevo désactivé", "value", listIDStr)
		return nil
	}
	return &BrevoService{
		apiKey: apiKey,
		listID: listID,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// AddContact ajoute un email à la liste Brevo de façon asynchrone.
// Les erreurs sont uniquement loguées — elles n'impactent pas l'utilisateur.
func (s *BrevoService) AddContact(email string) {
	if s == nil {
		return
	}
	go func() {
		if err := s.addContact(email); err != nil {
			slog.Warn("Brevo : impossible d'ajouter le contact", "email", email, "list_id", s.listID, "error", err)
		}
	}()
}

func (s *BrevoService) addContact(email string) error {
	payload := map[string]any{
		"email":         email,
		"listIds":       []int{s.listID},
		"updateEnabled": true,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("encodage JSON : %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, brevoAPIURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("création requête : %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("api-key", s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("envoi requête : %w", err)
	}
	defer resp.Body.Close()

	// 201 Created = nouveau contact, 204 No Content = contact mis à jour
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("réponse inattendue de Brevo : %s", resp.Status)
	}
	return nil
}
