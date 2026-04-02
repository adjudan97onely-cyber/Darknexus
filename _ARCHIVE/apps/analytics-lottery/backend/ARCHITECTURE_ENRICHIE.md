# 🎯 Architecture Temps Réel Enrichie

## 📋 Vue d'ensemble

L'application utilise maintenant une architecture complète temps réel:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  HubPage → /api/predictions/with-ia                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  A. Routes Football                                        │
│     └─ /api/football/matches (temps réel)                 │
│     └─ /api/football/matches/live                         │
│     └─ /api/football/matches/today                        │
│                                                             │
│  B. Routes Cotes                                           │
│     └─ Enrichissement automatique                          │
│     └─ Fusion match + odds                                │
│                                                             │
│  C. Routes Prédictions IA                                 │
│     └─ /api/predictions/with-ia ⭐ (complet)             │
│     └─ /api/predictions/enriched (données brutes)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
           ↓                           ↓
    ┌──────────────┐        ┌─────────────────┐
    │ Football     │        │  The-Odds API   │
    │ Data.org     │        │  (EN TEMPS      │
    │ (matchs)     │        │   RÉEL)         │
    └──────────────┘        └─────────────────┘
```

---

## 🔑 Configuration Requise

### Variables d'environnement (.env)

```bash
# Football Data API
FOOTBALL_DATA_KEY=YOUR_KEY_HERE

# The Odds API
ODDS_API_KEY=YOUR_KEY_HERE

# Backend
BACKEND_URL=http://localhost:5000
VITE_BACKEND_URL=http://localhost:5000/api
```

### Obtenir les clés

**Football-Data.org** (matchs temps réel):
```
https://www.football-data.org/
→ S'inscrire
→ Copier clé
→ Gratuit: 10 appels/minute, ~3000/mois
```

**The-Odds-API** (cotes temps réel):
```
https://www.the-odds-api.com/
→ S'inscrire
→ Copier clé
→ Gratuit: 500 appels/jour
```

---

## 📊 Endpoints Principaux

### 1️⃣ Prédictions Complètes (RECOMMANDÉ)

```bash
GET /api/predictions/with-ia
GET /api/predictions/with-ia?league=ligue1
GET /api/predictions/with-ia?country=France
```

**Retourne:**
- ✅ Matchs (équipes, date, ligue)
- ✅ Cotes (bookmakers, probabilités)
- ✅ Prédictions IA enrichies (outcome, confiance, signaux)
- ✅ Métriques de qualité

**Réponse exemple:**
```json
{
  "count": 5,
  "type": "predictions_with_ia",
  "timestamp": "2026-03-26T15:30:00",
  "data": {
    "predictions": [
      {
        "homeTeam": "PSG",
        "awayTeam": "Marseille",
        "league": "Ligue 1",
        "prediction": {
          "outcome": "HOME",
          "confidence": 0.78,
          "score": 0.56
        },
        "signals": {
          "team_form_signal": 0.25,
          "market_signal": 0.60,
          "market_confidence": 0.75
        }
      }
    ],
    "metrics": {
      "total_predictions": 5,
      "high_confidence_pct": 60.0,
      "average_confidence": 0.71
    }
  }
}
```

### 2️⃣ Matchs Enrichis (données brutes)

```bash
GET /api/predictions/enriched
GET /api/predictions/enriched?league=premier
GET /api/predictions/enriched?country=England
```

**Retourne:**
- ✅ Matchs football-data
- ✅ Cotes the-odds-api
- ✅ Signaux odds bruts (pas d'IA)

### 3️⃣ Matchs en Temps Réel

```bash
GET /api/football/matches/live          → EN COURS
GET /api/football/matches/today         → AUJOURD'HUI
GET /api/football/matches/upcoming?days=7  → FUTURS
```

### 4️⃣ Cotes Brutes

Intégrées automatiquement dans `/api/predictions/enriched`

---

## 🧠 Modèle Prédictif

Les prédictions IA combinent 3 signaux:

### Signal 1: Forme des Équipes (30%)
- Matchs récents
- Buts marqués/encaissés
- Attaque/Défense

### Signal 2: Marché/Cotes (50%) ⭐ Principal
- Cotes des bookmakers
- Probabilités implicites
- Volume de paris

### Signal 3: Tendances (20%)
- Historique H2H
- Saison
- Contexte

**Résultat:**
```
Score = Form(0.3) + Odds(0.5) + Trends(0.2)
Outcome = HOME / DRAW / AWAY
Confiance = 0% à 95%
```

---

## 🎯 Filtres

### Par Ligue

```
bundesliga  → Bundesliga (Germany)
ligue1      → Ligue 1 (France)
premier     → Premier League (England)
serie-a     → Serie A (Italy)
la-liga     → La Liga (Spain)
```

**Exemple:**
```bash
GET /api/predictions/with-ia?league=ligue1
```

### Par Pays

```
Germany
France
England
Italy
Spain
```

**Exemple:**
```bash
GET /api/predictions/with-ia?country=France
```

---

## 📁 Architecture Backend

```
backend/
├── services/
│   ├── football_api_service.py      ← Matchs temps réel
│   ├── odds_api_service.py          ← Cotes temps réel
│   ├── enrichment_service.py        ← Fusion données
│   ├── enriched_ia_service.py       ← Prédictions IA
│   └── ...
├── routes/
│   ├── football_real.py             ← Endpoints matchs
│   ├── predictions_enriched.py      ← Endpoints prédictions
│   └── ...
├── models/
│   └── predictions_model.py         ← ORM SQLAlchemy
├── server.py                        ← FastAPI principal
└── database_sqlite.py               ← SQLite config
```

---

## ⚙️ Installation & Démarrage

### 1. Installer dépendances

```bash
pip install -r requirements.txt
```

Vérifie que tu as:
- `httpx==0.28.1` (HTTP async)
- `fastapi==0.110.1` (API framework)
- `sqlalchemy==2.0.25` (ORM)

### 2. Configurer .env

```bash
cp .env.example .env
# Remplacer FOOTBALL_DATA_KEY et ODDS_API_KEY
```

### 3. Initialiser DB

```bash
python database_sqlite.py
```

### 4. Démarrer backend

```PowerShell
python server.py
```

Vérifie:
```bash
curl http://localhost:5000/api/predictions/with-ia/health
```

---

## 🧪 Tests

### Test 1: Santé du service

```bash
curl http://localhost:5000/api/predictions/enriched/health
```

### Test 2: Matchs du jour avec prédictions

```bash
curl "http://localhost:5000/api/predictions/with-ia?league=ligue1"
```

### Test 3: Matchs EN COURS

```bash
curl http://localhost:5000/api/football/matches/live
```

### Test 4: Filtrer par pays

```bash
curl "http://localhost:5000/api/predictions/with-ia?country=France"
```

---

## ✅ Architecture Propre

- ✅ **Temps réel**: Pas de saisons figées
- ✅ **Non-destructif**: Aucune route supprimée
- ✅ **Modulaire**: Services découplés
- ✅ **Extensible**: Ajouter nouvelles données facile
- ✅ **Filtres**: Pays + Ligue fonctionne parfaitement
- ✅ **IA enrichie**: Utilise odds comme signal

---

## 📝 Prochaines étapes

1. ✅ Tester tous les endpoints
2. ✅ Vérifier filtres pays/ligue
3. ⬜ Enrichir modèle IA avec stats équipes
4. ⬜ Ajouter historique H2H
5. ⬜ Tracker résultats → Évaluation prédictions
6. ⬜ Dashboard d'accuracy

---

## 🚨 Troubleshooting

### "API Key invalid"
→ Vérifie la clé dans .env
→ Regex: La clé n'a pas d'espace/tiret invisible

### "No matches returned"
→ Vérifier que la ligue est valide
→ Les matchs futurs doivent être < 14 jours
→ Le-odds-api peut avoir un délai de sync

### "Timeout 429"
→ Rate limit atteint
→ Attendre 5 min avant nouvelle requête

