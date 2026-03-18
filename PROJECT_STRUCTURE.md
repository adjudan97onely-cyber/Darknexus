# 📁 Structure du Projet - Analyseur Intelligent Multi-Loteries

## Vue d'ensemble complète

```
analytics-lottery/                          # Racine du projet
│
├── 📋 FICHIERS RACINE
│   ├── README.md                           # Documentation principale
│   ├── INSTALLATION_GUIDE.md               # Guide installation complet
│   ├── PROJECT_STRUCTURE.md                # Ce fichier
│   └── .gitignore                          # Exclusions Git
│
├── 🔙 BACKEND (FastAPI)
│   └── backend/
│       ├── 🚀 main.py                      # Application FastAPI principale
│       │   ├── @app.on_event("startup")    ├─ Connexion DB + Initialisation data
│       │   ├── @app.on_event("shutdown")   ├─ Cleanup DB
│       │   └── Routes incluses              ├─ /api/lotteries/*
│       │                                    └─ /api/sports/*
│       │
│       ├── 🗄️ database.py
│       │   ├── MONGO_URL: str               ├─ URI MongoDB
│       │   ├── DB_NAME: str                 ├─ Nom de la DB
│       │   ├── async def connect_db()       ├─ Connexion asynchrone
│       │   ├── async def close_db()         ├─ Fermeture
│       │   ├── async def get_db()           ├─ Get DB instance
│       │   └── Collections:
│       │       ├── draws                    ├─ Tirages de loterie
│       │       ├── analysis                 ├─ Résultats d'analyse
│       │       ├── recommendations          ├─ Recommandations
│       │       ├── matches                  ├─ Matchs sportifs
│       │       └── predictions              └─ Prédictions
│       │
│       ├── 📊 models.py
│       │   ├── DrawNumber                   ├─ Tirage individual
│       │   │   ├── draw_id: str
│       │   │   ├── lottery_type: str        (keno|euromillions|loto)
│       │   │   ├── datetime: date
│       │   │   ├── numbers: List[int]       (1-70 / 1-50 / 1-49)
│       │   │   └── bonus: Optional[int]
│       │   │
│       │   ├── LotteryAnalysis              ├─ Résultats d'analyse complets
│       │   │   ├── lottery_type: str
│       │   │   ├── total_draws: int
│       │   │   ├── frequency: Dict          (numéro -> pourcentage)
│       │   │   ├── hot_numbers: List[int]   (Z-score > 1.5)
│       │   │   ├── cold_numbers: List[int]  (Z-score < -1.5)
│       │   │   ├── scores: Dict             (0-100)
│       │   │   ├── balance: Dict            (pair/impair, bas/haut)
│       │   │   ├── chi_square: float
│       │   │   ├── p_value: float
│       │   │   ├── is_normal_distribution: bool
│       │   │   └── std_dev: float
│       │   │
│       │   ├── Recommendation               ├─ Recommandation de numéro
│       │   │   ├── lottery_type: str
│       │   │   ├── numbers: List[int]
│       │   │   ├── score: int (0-100)
│       │   │   ├── confidence: int (0-100)
│       │   │   └── reason: str
│       │   │
│       │   ├── GridGenerated                ├─ Grille générée
│       │   │   ├── lottery_type: str
│       │   │   ├── numbers: List[int]       (6/5/20 selon type)
│       │   │   ├── reasoning: str
│       │   │   └── score: int (0-100)
│       │   │
│       │   ├── SportsMatch                  ├─ Match sportif
│       │   │   ├── match_id: str
│       │   │   ├── home_team: str
│       │   │   ├── away_team: str
│       │   │   ├── date: date
│       │   │   ├── goals_home: int
│       │   │   ├── goals_away: int
│       │   │   └── result: str (H|A|D)
│       │   │
│       │   ├── SportsPrediction             ├─ Prédiction match
│       │   │   ├── match_id: str
│       │   │   ├── home_team: str
│       │   │   ├── away_team: str
│       │   │   ├── home_probability: float  (0-1)
│       │   │   ├── draw_probability: float  (0-1)
│       │   │   ├── away_probability: float  (0-1)
│       │   │   ├── expected_score_home: float
│       │   │   ├── expected_score_away: float
│       │   │   ├── over_2_5: float
│       │   │   ├── confidence: int (0-100)
│       │   │   └── recommendation: str
│       │   │
│       │   └── UserProfile                  ├─ Profil utilisateur (Phase 2)
│       │
│       ├── 🧮 algorithms/
│       │   ├── __init__.py
│       │   └── statistical_analyzer.py      ├─ Tous les algorithmes
│       │       │
│       │       ├── class LotteryAnalyzer
│       │       │   ├── @staticmethod
│       │       │   ├── calculate_frequency() ├─ % apparition par numéro
│       │       │   ├── calculate_mean_appearance() ├─ Moyenne théorique
│       │       │   ├── detect_anomalies()   ├─ Hot/Cold (Z-score)
│       │       │   ├── calculate_time_since_appearance()
│       │       │   ├── generate_score()     ├─ Score pondéré
│       │       │   ├── get_top_numbers()    ├─ Top N
│       │       │   ├── analyze_balance()    ├─ Pair/Impair, Bas/Haut
│       │       │   └── chi_square_test()    ├─ Test distribution
│       │       │
│       │       └── class SportsAnalyzer
│       │           ├── @staticmethod
│       │           ├── calculate_form()     ├─ Score forme
│       │           ├── calculate_goal_probability() ├─ Poisson
│       │           └── generate_prediction() ├─ Prédiction multi-facteurs
│       │
│       ├── 🔧 services/
│       │   ├── __init__.py
│       │   ├── data_service.py              ├─ Gestion des sample data
│       │   │   ├── class SampleDataGenerator
│       │   │   │   ├── generate_lottery_history()
│       │   │   │   └── generate_sports_history()
│       │   │   └── class DataService
│       │   │       └── initialize_sample_data()
│       │   │
│       │   ├── lottery_service.py           ├─ Orchestration loteries
│       │   │   └── class LotteryService
│       │   │       ├── analyze_lottery()
│       │   │       ├── get_recommendations()
│       │   │       ├── generate_grid()
│       │   │       ├── get_statistics()
│       │   │       └── + logique métier
│       │   │
│       │   └── sports_service.py            ├─ Orchestration sports
│       │       └── class SportsService
│       │           ├── get_team_form()
│       │           ├── predict_match()
│       │           ├── predict_matches_batch()
│       │           ├── get_live_recommendations()
│       │           └── + logique métier
│       │
│       ├── 🛣️ routes/
│       │   ├── __init__.py
│       │   ├── lotteries.py                 ├─ Routes /api/lotteries/
│       │   │   ├── GET /analyze/{type}
│       │   │   ├── GET /statistics/{type}
│       │   │   ├── GET /recommendations/{type}
│       │   │   ├── GET /grids/{type}
│       │   │   ├── GET /keno/analysis
│       │   │   ├── GET /euromillions/analysis
│       │   │   └── GET /loto/analysis
│       │   │
│       │   └── sports.py                    ├─ Routes /api/sports/
│       │       ├── GET /matches
│       │       ├── GET /matches/{h}/vs/{a}/prediction
│       │       ├── POST /matches/predict
│       │       ├── GET /team/{name}/form
│       │       ├── GET /statistics
│       │       ├── GET /recommendations
│       │       └── GET /football/analysis
│       │
│       ├── 📦 requirements.txt              ├─ Dépendances Python
│       │   ├── fastapi==0.110.1
│       │   ├── uvicorn==0.27.0
│       │   ├── motor==3.3.1              (Async MongoDB)
│       │   ├── pymongo==4.5.0
│       │   ├── pydantic==2.0.3
│       │   ├── numpy==1.24.3
│       │   ├── scipy==1.11.0
│       │   ├── python-dotenv==1.0.0
│       │   └── aiohttp==3.8.5
│       │
│       ├── ⚙️ .env.example                  ├─ Template de config
│       │   ├── MONGO_URL
│       │   ├── DB_NAME
│       │   ├── PORT
│       │   └── DEBUG
│       │
│       └── .env                             (⚠️ À ignorer dans Git)
│
├── 🎨 FRONTEND (React + Vite)
│   └── frontend/
│       ├── 🚀 main.jsx                      ├─ Point d'entrée
│       │   └── Render App dans <root>
│       │
│       ├── 🎯 App.jsx                       ├─ Router principal
│       │   ├── <Router>
│       │   └── Sidebar + Routes
│       │
│       ├── 📄 public/
│       │   ├── index.html                   ├─ Fichier HTML racine
│       │   └── favicon.ico
│       │
│       ├── 🎨 src/
│       │   ├── index.css                    ├─ Styles Tailwind
│       │   │
│       │   ├── pages/
│       │   │   ├── Dashboard.jsx            ├─ Accueil / Overview
│       │   │   │   ├── 3 cartes loteries
│       │   │   │   ├── Onglets [Overview|Keno|Euro|Loto|Sports]
│       │   │   │   └── Divers graphiques
│       │   │   │
│       │   │   ├── KenoAnalyzer.jsx         ├─ Analyse Kéno détaillée
│       │   │   │   ├── Onglets [Analysis|Recommendations|Grids]
│       │   │   │   ├── Distribution Keno (20 numéros)
│       │   │   │   ├── Hot/Cold numbers
│       │   │   │   └── Chi-square test
│       │   │   │
│       │   │   ├── EuroMillionsAnalyzer.jsx ├─ Analyse Euromillions
│       │   │   │   ├── Focus 5 numéros
│       │   │   │   ├── Bonus tracké séparément
│       │   │   │   └── Même UI que Keno
│       │   │   │
│       │   │   ├── LotoAnalyzer.jsx         ├─ Analyse Loto
│       │   │   │   ├── 49 numéros
│       │   │   │   ├── Pair/Impair visualisation
│       │   │   │   ├── Bas/Haut ratio
│       │   │   │   └── Grilles 7x7
│       │   │   │
│       │   │   └── SportsAnalyzer.jsx       ├─ Analyse Football
│       │   │       ├── Recommandations matchs
│       │   │       ├── Prédictions détaillées
│       │   │       ├── Forme d'équipe
│       │   │       ├── Stats globales (H/D/A)
│       │   │       └── Over/Under 2.5
│       │   │
│       │   └── services/
│       │       └── api.js                   ├─ Client API centralisé
│       │           ├── axios instance (http://localhost:5001)
│       │           ├── lotteryAPI{}
│       │           │   ├── analyzeLottery()
│       │           │   ├── getRecommendations()
│       │           │   └── generateGrids()
│       │           ├── sportsAPI{}
│       │           │   ├── getUpcomingMatches()
│       │           │   ├── predictMatch()
│       │           │   └── getTeamForm()
│       │           └── healthAPI{}
│       │
│       ├── 📦 package.json
│       │   ├── react@18.3
│       │   ├── react-router-dom@7.5
│       │   ├── axios@1.6
│       │   ├── recharts@2.10 (Diagrammes)
│       │   ├── tailwindcss@3.3 (Styles)
│       │   └── vite@5.0 (Builder)
│       │
│       ├── ⚙️ vite.config.js
│       │   ├── React plugin
│       │   ├── Proxy /api vers localhost:5001
│       │   └── Port 5173
│       │
│       ├── 🎨 tailwind.config.js            ├─ Configuration Tailwind
│       ├── 📄 postcss.config.js             ├─ PostCSS + Autoprefixer
│       ├── ⚙️ .env.example
│       │   └── VITE_API_URL=http://localhost:5001
│       │
│       └── .env
```

## 🔄 Flux de Données

```
┌─────────────────┐
│  MongoDB        │  ← Données persistantes
│ (adj_killagain) │    (draws, analysis, etc)
└────────┬────────┘
         │
┌────────▼────────────────────────────────────┐
│  Backend FastAPI                            │
│  ─────────────────────────────────────────  │
│  • Connexion MongoDB async (Motor)          │
│  • LotteryAnalyzer (8 méthodes)             │
│  • SportsAnalyzer (3 méthodes)              │
│  • Routes API REST                          │
│  → Écoute sur :5001                         │
└────────┬────────────────────────────────────┘
         │ JSON/HTTP
┌────────▼────────────────────────────────────┐
│  Frontend React + Vite                      │
│  ─────────────────────────────────────────  │
│  • Pages React (Dashboard, Analyzers)       │
│  • Axios client → appels API                │
│  • Recharts pour visualisations             │
│  • Tailwind pour styles                     │
│  → Écoute sur :5173                         │
└────────┬────────────────────────────────────┘
         │
    ┌────▼─────┐
    │ Navigateur│ ← User
    └──────────┘
```

## 📊 Algorithmes Implémentés

### LotteryAnalyzer (8 features)
```
Data: 100+ tirages par loterie
├─ calculate_frequency()        → Dict[num -> %apparition]
├─ calculate_mean_appearance()  → float théorique
├─ detect_anomalies()           → {hot_numbers, cold_numbers, z_scores, std_dev}
├─ calculate_time_since_appearance() → Dict[num -> draws_since]
├─ generate_score()             → Freq(40%) + Absence(30%) + Recency(30%)
├─ get_top_numbers()            → List[top_n] sorted by score
├─ analyze_balance()            → {even_%, low_%}
└─ chi_square_test()            → {chi_square, p_value}
```

### SportsAnalyzer (3 features)
```
Data: 50+ matchs simulés
├─ calculate_form()             → W=1, D=0.5, L=0 (recent matches)
├─ calculate_goal_probability() → Poisson approx (over/under 2.5)
└─ generate_prediction()         → {H_prob, D_prob, A_prob, score, confidence}
```

## 🗄️ Collections MongoDB

```javascript
db.draws {
  _id: ObjectId(),
  draw_id: "keno_0",
  lottery_type: "keno",        // "keno" | "euromillions" | "loto"
  date: ISODate("2024-01-15"),
  numbers: [1, 5, 12, 23, ...],  // 20 (keno) | 5 (euro) | 6 (loto)
  bonus: 45                       // Optional (euromillions)
}

db.analysis {
  _id: ObjectId(),
  lottery_type: "keno",
  total_draws: 100,
  frequency: { "1": 0.23, "2": 0.19, ... },
  hot_numbers: [1, 5, 12, 34],
  cold_numbers: [67, 68, 69, 70],
  scores: { "1": 75.5, "2": 62.3, ... },
  balance: { even_percentage: 48.5, low_percentage: 51.2 },
  chi_square: 45.23,
  p_value: 0.0234,
  is_normal_distribution: false,
  std_dev: 2.34
}

db.recommendations {
  _id: ObjectId(),
  lottery_type: "keno",
  numbers: [1],
  score: 75,
  confidence: 95,
  reason: "Numéro chaud - apparaît 23% du temps"
}

db.matches {
  _id: ObjectId(),
  match_id: "match_0",
  home_team: "PSG",
  away_team: "OM",
  date: ISODate("2024-02-01"),
  goals_home: 2,
  goals_away: 1,
  result: "H"
}

db.predictions {
  _id: ObjectId(),
  match_id: "psg_vs_om",
  home_team: "PSG",
  away_team: "OM",
  home_probability: 0.55,
  draw_probability: 0.25,
  away_probability: 0.20,
  expected_score_home: 2.1,
  expected_score_away: 1.2,
  over_2_5: 0.62,
  confidence: 78,
  recommendation: "Victoire locale probable"
}
```

## 📈 Endpoints API

### Loteries (12 endpoints)
- `GET /api/lotteries/analyze/{type}`
- `GET /api/lotteries/statistics/{type}`
- `GET /api/lotteries/recommendations/{type}`
- `GET /api/lotteries/grids/{type}`
- `GET /api/lotteries/keno/analysis`
- `GET /api/lotteries/euromillions/analysis`
- `GET /api/lotteries/loto/analysis`

### Sports (7 endpoints)
- `GET /api/sports/matches`
- `GET /api/sports/matches/{h}/vs/{a}/prediction`
- `POST /api/sports/matches/predict`
- `GET /api/sports/team/{team}/form`
- `GET /api/sports/statistics`
- `GET /api/sports/recommendations`
- `GET /api/sports/football/analysis`

### Health & Root (2 endpoints)
- `GET /` - Infos API
- `GET /health` - Status

## 🎯 Statut de Completion

✅ **Phase 1 - MVP Complet:**
- ✓ Architecture backend
- ✓ Algorithmes d'analyse
- ✓ API REST complète
- ✓ Frontend React
- ✓ Visualisations (Recharts)
- ✓ Documentation

🔜 **Phase 2 - Futur:**
- WebSockets (mises à jour temps réel)
- Machine Learning
- Données réelles (FDJ APIs)
- OAuth/Auth utilisateur
- Historique de prédictions

---

**Total: ~300 lignes Backend + 500 lignes Frontend**
