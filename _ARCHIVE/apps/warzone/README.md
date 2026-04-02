# 🎰 Analyseur Intelligent Multi-Loteries & Paris Sportifs

Application complète d'analyse statistique intelligente pour les loteries (Kéno, Euromillions, Loto) et les paris sportifs (Football).

## 🎯 Objectifs

- **Analyse Statistique Avancée**: Détection d'anomalies dans les tirages, identification de nos chauds/froids
- **Recommandations Intelligentes**: Génération de numéros et grilles basées sur l'analyse statistique
- **Prédictions Sportives**: Analyse des formes d'équipes et prédictions de matchs
- **Interface Utilisateur Intuitive**: Dashboard complet avec visualisations interactives

## 🏗️ Architecture

### Backend (FastAPI)
```
backend/
├── main.py                      # Application FastAPI
├── database.py                  # Configuration MongoDB asynchrone
├── models.py                    # Modèles Pydantic
├── requirements.txt             # Dépendances Python
├── algorithms/
│   ├── statistical_analyzer.py # Analyse statistique (LotteryAnalyzer, SportsAnalyzer)
│   └── __init__.py
├── services/
│   ├── data_service.py         # Gestion des données de sample
│   ├── lottery_service.py      # Service d'analyse de loteries
│   ├── sports_service.py       # Service d'analyse sportive
│   └── __init__.py
└── routes/
    ├── lotteries.py            # Routes API /api/lotteries/
    ├── sports.py               # Routes API /api/sports/
    └── __init__.py
```

### Frontend (React + Vite)
```
frontend/
├── package.json
├── vite.config.js
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx       # Accueil et overview
│   │   ├── KenoAnalyzer.jsx    # Analyse détaillée Kéno
│   │   ├── EuroAnalyzer.jsx    # Analyse Euromillions
│   │   ├── LotoAnalyzer.jsx    # Analyse Loto
│   │   └── SportsAnalyzer.jsx  # Analyse sportive
│   └── services/
│       └── api.js              # Client API centralisé
```

## 🔧 Installation

### Prérequis
- Python 3.8+
- Node.js 16+
- MongoDB 4.5+

### Backend Setup

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Créer .env
cp .env.example .env

# Lancer le serveur
python main.py
# Serveur actif sur http://localhost:5001
```

### Frontend Setup

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev
# Interface accessible sur http://localhost:5173
```

## 📊 API Endpoints

### Loteries

#### Analyse
- `GET /api/lotteries/analyze/{lottery_type}` - Analyse complète
- `GET /api/lotteries/keno/analysis` - Analyse Kéno
- `GET /api/lotteries/euromillions/analysis` - Analyse Euromillions
- `GET /api/lotteries/loto/analysis` - Analyse Loto

#### Statistiques & Recommandations
- `GET /api/lotteries/statistics/{lottery_type}` - Statistiques globales
- `GET /api/lotteries/recommendations/{lottery_type}?top_n=10` - Top N recommandations
- `GET /api/lotteries/grids/{lottery_type}?num_grids=5` - Grilles générées

### Sports

#### Prédictions
- `GET /api/sports/matches` - Matchs prochains avec recommandations
- `GET /api/sports/matches/{home}/vs/{away}/prediction` - Prédiction spécifique
- `POST /api/sports/matches/predict` - Batch de prédictions

#### Analyses
- `GET /api/sports/team/{team}/form` - Forme d'une équipe
- `GET /api/sports/statistics` - Statistiques globales
- `GET /api/sports/recommendations` - Recommandations de matchs
- `GET /api/sports/football/analysis` - Analyse complète

## 📈 Algorithmes Implémentés

### Analyse de Loteries

**LotteryAnalyzer:**
1. **calculate_frequency()** - % apparition de chaque numéro
2. **calculate_mean_appearance()** - Moyenne théorique
3. **detect_anomalies()** - Numéros chauds/froids (Z-score > 1.5)
4. **calculate_time_since_appearance()** - Tirages depuis dernière apparition
5. **generate_score()** - Score pondéré (Freq 40% + Absence 30% + Récence 30%)
6. **analyze_balance()** - Distribution pair/impair et bas/haut
7. **chi_square_test()** - Test de distribution statistique

### Analyse Sportive

**SportsAnalyzer:**
1. **calculate_form()** - Score de forme (W=1, D=0.5, L=0)
2. **calculate_goal_probability()** - Approximation Poisson pour Over/Under 2.5
3. **generate_prediction()** - Prédiction multi-facteurs (Forme 40% + H2H 30% + Statique 30%)

## 🗄️ Modèles de Données

### Loteries
- **DrawNumber**: Tirage (numéros, date, type)
- **LotteryAnalysis**: Résultats d'analyse (fréquences, anomalies, scores)
- **Recommendation**: Recommandation de numéros (score, confiance)
- **GridGenerated**: Grille de jeu générée

### Sports
- **SportsMatch**: Match avec historique
- **SportsPrediction**: Prédiction de match (probabilités, score attendu)

## 🔄 Flux de Données

```
MongoDB (adj_killagain_db)
    ↓
Backend FastAPI
    ├── Récupère données
    ├── Analyse algorithmiques
    └── Retourne JSON
         ↓
Frontend React
    └── Affiche visualisations (Recharts)
```

## 🚀 Fonctionnalités

### Phase 1 (Current)
✅ Analyse statistique complète des loteries
✅ Détection d'anomalies (hot/cold numbers)
✅ Recommandations basées sur scores pondérés
✅ Génération de grilles intelligentes
✅ Tests chi-square pour normalité
✅ Prédictions sportives basées sur forme
✅ Dashboard avec 5+ visualisations

### Phase 2 (Futur)
⏳ WebSockets pour mises à jour en temps réel
⏳ Machine Learning pour patterns
⏳ Intégration données réelles (FDJ, sites de paris)
⏳ Historique de prédictions
⏳ Gestion utilisateurs avec OAuth

## 📝 Notes Importantes

⚠️ **Avertissement Légal**: Cette application est à but éducatif. Les jeux de hasard sont imprévisibles par nature. Aucune analyse statistique ne peut garantir les résultats.

### Base de Données
- Utilise `adj_killagain_db` (configurable via `.env`)
- Données de sample générées automatiquement au démarrage
- Collections: draws, analysis, recommendations, matches, predictions

### Environnement Variables
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=adj_killagain_db
PORT=5001
DEBUG=True
```

## 🧪 Tester l'Application

1. **Démarrer MongoDB**
   ```bash
   mongod
   ```

2. **Lancer le backend**
   ```bash
   cd backend && python main.py
   ```

3. **Lancer le frontend** (autre terminal)
   ```bash
   cd frontend && npm run dev
   ```

4. **Accéder à http://localhost:5173**

## 📊 Exemple de Réponse API

```json
{
  "lottery_type": "keno",
  "total_draws": 100,
  "frequency": {
    "1": 0.23,
    "2": 0.19,
    ...
  },
  "hot_numbers": [1, 5, 12, 34],
  "cold_numbers": [67, 68, 69, 70],
  "scores": {
    "1": 75.5,
    "2": 62.3,
    ...
  },
  "balance": {
    "even_percentage": 48.5,
    "low_percentage": 51.2
  },
  "chi_square": 45.23,
  "p_value": 0.0234,
  "is_normal_distribution": false,
  "std_dev": 2.34
}
```

## 🤝 Contribution

Code suivant les standards Python (PEP 8) et React (ES6+).

## 📄 License

Projet à usage personnel/éducatif.

---

**Construit avec**: FastAPI + React + MongoDB + Recharts
**Version**: 1.0.0
**Date**: 2024
