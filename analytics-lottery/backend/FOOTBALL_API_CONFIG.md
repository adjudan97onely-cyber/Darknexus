# Configuration Football-Data.org

## 📋 Objectif
Service temps réel pour récupérer **matchs actuels, LIVE et futurs** (14 jours max).

## 🔑 Clé API

### Obtenir votre clé:
1. Aller sur: https://www.football-data.org/
2. S'inscrire (gratuit)
3. Copier la clé API dans le dashboard

### Configurer la clé:

**Option 1: Variable d'environnement (RECOMMANDÉ)**
```bash
# Windows
set FOOTBALL_DATA_KEY=YOUR_API_KEY_HERE

# Linux/Mac
export FOOTBALL_DATA_KEY=YOUR_API_KEY_HERE

# PowerShell Windows
$env:FOOTBALL_DATA_KEY="YOUR_API_KEY_HERE"
```

**Option 2: Fichier .env (backend)**
```
# backend/.env
FOOTBALL_DATA_KEY=YOUR_API_KEY_HERE
```

**Option 3: Modifier dans le code (DÉCONSEILLÉ)**
Dans `backend/services/football_api_service.py`:
```python
FOOTBALL_DATA_KEY = "YOUR_API_KEY_HERE"
```

## 📊 Endpoints disponibles

### Matchs EN COURS (LIVE)
```bash
GET /api/football/matches/live
```

### Matchs d'AUJOURD'HUI
```bash
GET /api/football/matches/today
```

### Prochains matchs (7 jours par défaut)
```bash
GET /api/football/matches/upcoming?days=14
```

### Tous les matchs actuels/futurs
```bash
GET /api/football/matches
GET /api/football/matches?league=ligue1
GET /api/football/matches?country=France
```

### Par ligue spécifique
```bash
GET /api/football/matches/by-league/ligue1
GET /api/football/matches/by-league/premier
GET /api/football/matches/by-league/bundesliga
GET /api/football/matches/by-league/serie-a
GET /api/football/matches/by-league/la-liga
```

## ✅ Statuts de match

- **LIVE**: Match en cours
- **SCHEDULED**: Match à venir
- **FINISHED**: Match terminé (NON retourné par défaut)

## 📍 Filtres disponibles

### Par Ligue:
- `bundesliga` (Germany)
- `ligue1` (France)
- `premier` (England)
- `serie-a` (Italy)
- `la-liga` (Spain)

### Par Pays:
- `Germany`
- `France`
- `England`
- `Italy`
- `Spain`

## ⚠️ Limitations API

- **Appels gratuits**: 10/min, ~3000/mois
- **Timeout**: 10 secondes par requête
- **Cache**: Recommandé 5-10 min entre appels identiques

## 🧪 Test

```bash
# Vérifier la santé du service
curl http://localhost:5000/api/football/health

# Matchs du jour
curl http://localhost:5000/api/football/matches/today

# Matchs Ligue 1
curl http://localhost:5000/api/football/matches?league=ligue1

# Matchs France
curl http://localhost:5000/api/football/matches?country=France
```

## 🚀 Démarrage

```bash
# 1. Installer les dépendances
pip install -r requirements.txt

# 2. Configurer la clé API
$env:FOOTBALL_DATA_KEY="YOUR_KEY"

# 3. Démarrer le backend
python server.py
```

## 📝 Notes importantes

✅ **L'app est TEMPS RÉEL**  
✅ **Retourne UNIQUEMENT matchs actuels/futurs**  
✅ **Pas de données historiques**  
✅ **Filtre par ligue/pays fonctionne parfaitement**  
❌ **JAMAIS de saison fixe (2024/2025)**  
❌ **JAMAIS d'archive historique**  

