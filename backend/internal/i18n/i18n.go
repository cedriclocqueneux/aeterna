package i18n

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"sync"
)

//go:embed locales/fr.json
var frJSON []byte

//go:embed locales/en.json
var enJSON []byte

//go:embed locales/de.json
var deJSON []byte

//go:embed locales/es.json
var esJSON []byte

//go:embed locales/pt.json
var ptJSON []byte

//go:embed locales/it.json
var itJSON []byte

//go:embed locales/nl.json
var nlJSON []byte

//go:embed locales/pl.json
var plJSON []byte

var (
	translations map[string]map[string]string
	once         sync.Once
)

// DefaultLang est la langue par défaut de l'application
const DefaultLang = "fr"

func init() {
	once.Do(func() {
		langs := map[string][]byte{
			"fr": frJSON,
			"en": enJSON,
			"de": deJSON,
			"es": esJSON,
			"pt": ptJSON,
			"it": itJSON,
			"nl": nlJSON,
			"pl": plJSON,
		}

		translations = make(map[string]map[string]string, len(langs))
		for code, data := range langs {
			m := make(map[string]string)
			if err := json.Unmarshal(data, &m); err != nil {
				panic(fmt.Sprintf("i18n: failed to parse %s.json: %v", code, err))
			}
			translations[code] = m
		}
	})
}

// T retourne la traduction d'une clé dans la langue donnée.
// Si la clé n'existe pas dans la langue demandée, elle essaie le français,
// puis retourne la clé elle-même en dernier recours.
func T(lang, key string) string {
	if lang == "" {
		lang = DefaultLang
	}
	if langMap, ok := translations[lang]; ok {
		if val, ok := langMap[key]; ok {
			return val
		}
	}
	// Fallback sur le français
	if val, ok := translations[DefaultLang][key]; ok {
		return val
	}
	return key
}

// Tf retourne la traduction formatée avec des arguments (comme fmt.Sprintf)
func Tf(lang, key string, args ...any) string {
	return fmt.Sprintf(T(lang, key), args...)
}
