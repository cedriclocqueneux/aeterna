# Un Dernier Message

<p align="center">
  <img src="assets/hero.png" alt="Un Dernier Message" width="600">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square" alt="GPL-3.0 License">
  <img src="https://img.shields.io/badge/i18n-8%20langues-green?style=flat-square" alt="8 langues">
</p>

---

## 🇫🇷 Présentation

**Un Dernier Message** est un fork du projet open source [Aeterna](https://github.com/alpyxn/aeterna), réalisé par [Cédric Locqueneux](https://github.com/cedriclocqueneux) pour ajouter le support multilingue (notamment le français), un thème clair/sombre, et adapter le projet à un usage grand public francophone.

Il s'agit d'un *dead man's switch* — un interrupteur d'homme mort numérique : vous rédigez des messages importants (accès à des comptes, cryptos, instructions, lettres d'adieu…), et si vous cessez de vous signaler régulièrement, ces messages sont automatiquement envoyés à vos proches.

Ce fork est hébergé sur [un-dernier-message.fr](https://un-dernier-message.fr) en version gratuite pour les utilisateurs. Pour ceux qui souhaitent maîtriser totalement leurs données, l'auto-hébergement est entièrement documenté ci-dessous.

---

> Fork of [Aeterna](https://github.com/alpyxn/aeterna) — Self-hosted dead man's switch, multilingual, with light/dark theme.

**Un Dernier Message** is a dead man's switch application: write your messages, check in regularly, and if you stop, your messages are automatically delivered to your loved ones.

---

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Langues supportées](#langues-supportées)
- [Installation rapide](#installation-rapide)
- [Installation manuelle](#installation-manuelle)
- [Configuration](#configuration)
- [Gestion](#gestion)
- [Sécurité](#sécurité)
- [Différences avec Aeterna](#différences-avec-aeterna)
- [Licence](#licence)

---

## Fonctionnalités

### Dead man's switch
- ✉️ **Envoi automatique** — Si vous ne signalez plus votre présence, vos messages partent
- 💓 **Heartbeat par lien email** — Un simple clic dans l'email de rappel suffit, sans connexion au site
- ⏱️ **Délais configurables** — De 1 minute (test) à 1 an
- 🔔 **Rappels avant déclenchement** — Plusieurs niveaux d'alerte (12h, 1 jour, 3 jours…)
- 📎 **Pièces jointes chiffrées** — Supprimées automatiquement après livraison
- 💌 **Lettres d'adieu** — Messages personnalisés avec délai d'envoi après déclenchement
- 🔗 **Webhooks** — Déclenchez des actions externes (scripts, domotique, API…)

### Interface
- 🌍 **Multilingue** — Interface et emails disponibles en 8 langues
- 🌓 **Thème clair/sombre/auto** — Suit la préférence système ou l'heure de la journée
- 📱 **Responsive** — Fonctionne sur mobile et desktop

### Sécurité & confidentialité
- 🔒 **Chiffrement AES-256-GCM** — Messages et pièces jointes chiffrés au repos
- 🏠 **Auto-hébergé** — Vos données ne quittent pas votre serveur
- 🐳 **Docker** — Déploiement simple et reproductible

---

## Langues supportées

| Langue | Interface | Emails |
|--------|-----------|--------|
| 🇫🇷 Français | ✅ | ✅ |
| 🇬🇧 English | ✅ | ✅ |
| 🇩🇪 Deutsch | ✅ | ✅ |
| 🇪🇸 Español | ✅ | ✅ |
| 🇵🇹 Português | ✅ | ✅ |
| 🇮🇹 Italiano | ✅ | ✅ |
| 🇳🇱 Nederlands | ✅ | ✅ |
| 🇵🇱 Polski | ✅ | ✅ |

La langue des emails est configurable par utilisateur dans **Paramètres → Langue des emails**. La langue de l'interface suit la préférence du navigateur ou le sélecteur en haut à droite.

---

## Installation rapide

```bash
git clone https://github.com/cedriclocqueneux/aeterna.git
cd aeterna
./install.sh
```

L'assistant configure automatiquement les clés de chiffrement, le reverse proxy et Docker.

---

## Installation manuelle

### 1. Cloner le dépôt

```bash
git clone https://github.com/cedriclocqueneux/aeterna.git
cd aeterna
```

### 2. Générer la clé de chiffrement

```bash
mkdir -p data secrets
openssl rand -base64 32 | tr -d '\n' > secrets/encryption_key
chmod 600 secrets/encryption_key
```

### 3. Créer le fichier `.env`

```env
ENV=production
DATABASE_PATH=./data/aeterna.db
DB_ENCRYPTION_ENABLED=false
DB_ENCRYPTION_AUTO_MIGRATE=true
DB_ENCRYPTION_KDF_CONTEXT_FILE=./secrets/db_kdf_context
ALLOWED_ORIGINS=https://votre-domaine.fr
BASE_URL=https://votre-domaine.fr
AUTH_SESSION_TTL_HOURS=12
ALLOW_REGISTRATION=false
PROXY_MODE=simple
DOMAIN=votre-domaine.fr
VITE_API_URL=/api
```

### 4. Lancer les conteneurs

```bash
docker compose -f docker-compose.simple.yml up -d --build
```

L'application est accessible sur le **port 5000**.

### 5. Configurer le SMTP

Après le premier lancement, connectez-vous et allez dans **Paramètres** pour configurer votre serveur SMTP. Des guides préconfigurés sont disponibles pour Gmail, Brevo, Mailgun, SendGrid, Outlook, Yandex et Zoho.

---

## Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `ENV` | `production` ou `development` | `development` |
| `DATABASE_PATH` | Chemin vers la base SQLite | `./data/aeterna.db` |
| `ALLOWED_ORIGINS` | Origines CORS autorisées | `*` |
| `BASE_URL` | URL publique de l'application | — |
| `AUTH_SESSION_TTL_HOURS` | Durée de session en heures | `12` |
| `ALLOW_REGISTRATION` | Autoriser les nouvelles inscriptions | `true` |
| `DB_ENCRYPTION_ENABLED` | Chiffrement de la base SQLite | `false` |
| `WEBHOOK_ALLOWLIST_HOSTS` | Hosts autorisés pour les webhooks | — |

### Langue des emails

Chaque utilisateur peut choisir sa langue dans **Paramètres → Langue des emails**. Les emails de rappel (heartbeat) et de livraison sont envoyés dans la langue choisie.

---

## Gestion

```bash
# Voir les logs
docker compose -f docker-compose.simple.yml logs -f

# Mettre à jour (rebuild)
docker compose -f docker-compose.simple.yml up -d --build

# Arrêter
docker compose -f docker-compose.simple.yml down

# Sauvegarder les données
cp -r data/ backup/
cp secrets/encryption_key backup/
```

> ⚠️ **Important** : Sauvegardez `secrets/encryption_key` séparément. Sans cette clé, les messages chiffrés sont irrécupérables.

---

## Développement local

```bash
# Frontend (React + Vite) — avec proxy vers le backend Docker
cd frontend
npm install
npm run dev
# Accessible sur http://localhost:5173
```

Le serveur de développement proxifie automatiquement les appels `/api` vers le backend (port 5000).

---

## Sécurité

- Messages chiffrés avec **AES-256-GCM** avant stockage
- Clé de chiffrement stockée dans `secrets/encryption_key`, jamais en variable d'environnement
- Pièces jointes supprimées du serveur après livraison réussie
- Chiffrement de la base SQLite optionnel (`DB_ENCRYPTION_ENABLED=true`)
- Token de heartbeat permet le check-in sans authentification complète

---

## Différences avec Aeterna

Ce fork a été réalisé par [Cédric Locqueneux](https://github.com/cedriclocqueneux) et apporte les modifications suivantes par rapport au projet original :

| Fonctionnalité | Aeterna original | Ce fork |
|---|---|---|
| Langue interface | Anglais uniquement | 🌍 8 langues |
| Langue des emails | Anglais uniquement | 🌍 8 langues (par utilisateur) |
| Thème | Sombre uniquement | 🌓 Clair / Sombre / Auto |
| i18n backend | ❌ | ✅ Go embed + JSON |
| i18n frontend | ❌ | ✅ react-i18next |

---

## Licence

GPL-3.0 — voir [LICENSE](LICENSE)

Ce projet est un fork d'[Aeterna](https://github.com/alpyxn/aeterna) créé par [alpyxn](https://github.com/alpyxn), modifié et maintenu par [Cédric Locqueneux](https://github.com/cedriclocqueneux).
