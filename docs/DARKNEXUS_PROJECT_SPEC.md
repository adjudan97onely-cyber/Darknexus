# 🎰 Spécification Projet - Analyseur Intelligent Multi-Loteries & Paris Sportifs

## 📋 Informations Générales

**Nom du Projet:** Analyseur Intelligent Multi-Loteries & Paris Sportifs
**Type:** Full-Stack Web Application
**Objectif:** Application d'analyse statistique intelligente pour loteries (Kéno, Euromillions, Loto) et prédictions de matchs de football
**Base de Données:** MongoDB (adj_killagain_db)

---

## 🏗️ Architecture Complète

### Stack Technologique
- **Frontend:** React 18.3 + React Router 7.5 + Vite 5
- **Backend:** FastAPI 0.110.1 + Uvicorn + Motor (async MongoDB)
- **Database:** MongoDB 4.5+ (async via Motor 3.3.1)
- **Visualisations:** Recharts 2.10.3
- **Styles:** Tailwind CSS 3.3

---

## 📊 Fonctionnalités Principales

### 1. Analyse de Loteries
**Trois loteries supportées:**
- **Kéno** (70 numéros, 20 tirés)
- **Euromillions** (50 numéros + 1 bonus)
- **Loto** (49 numéros, 6 tirés)

**Fonctionnalités pour chaque loterie:**
- Analyse de fréquence (% apparition de chaque numéro)
- Détection automatique de numéros chauds/froids (Z-score > ±1.5)
- Scoring pondéré (40% fréquence + 30% absence + 30% récence)
- Test chi-square pour normalité de distribution
- Analyse de balance (pair/impair, bas/haut)
- Génération de recommandations de numéros
- Génération de grilles de jeu optimisées

### 2. Prédictions Sportives (Football)
**Fonctionnalités:**
- Calcul de forme d'équipe (récents matchs: W=1, D=0.5, L=0)
- Prédiction de probabilités (Victoire maison / Nul / Victoire extérieure)
- Approximation Poisson pour Over/Under 2.5 buts
- Analyse historique tête-à-tête (h2h)
- Score attendu du match
- Niveau de confiance

### 3. Dashboard Interactif
- Vue d'ensemble toutes loteries
- Statistiques globales sports
- Navigation par onglets
- Graphiques interactifs (Recharts)
- Sidebar navigation

---

## 🗄️ Modèles de Données (Pydantic)

### Loteries

#### DrawNumber
```python
{
  draw_id: str,
  lottery_type: str,  # "keno"|"euromillions"|"loto"
  date: datetime,
  numbers: List[int],
  bonus: Optional[int]  # Pour Euromillions
}
```

#### LotteryAnalysis
```python
{
  lottery_type: str,
  total_draws: int,
  frequency: Dict[int, float],  # numéro -> % apparition
  hot_numbers: List[int],       # Z-score > 1.5
  cold_numbers: List[int],      # Z-score < -1.5
  scores: Dict[int, float],     # Scoring 0-100
  balance: {
    even_percentage: float,
    low_percentage: float
  },
  chi_square: float,
  p_value: float,
  is_normal_distribution: bool,
  std_dev: float
}
```

#### Recommendation
```python
{
  lottery_type: str,
  numbers: List[int],
  score: int,         # 0-100
  confidence: int,    # 0-100%
  reason: str
}
```

#### GridGenerated
```python
{
  lottery_type: str,
  numbers: List[int],  # 6 (loto) | 5 (euro) | 20 (keno)
  reasoning: str,
  score: int           # 0-100
}
```

### Sports

#### SportsMatch
```python
{
  match_id: str,
  home_team: str,
  away_team: str,
  date: datetime,
  goals_home: int,
  goals_away: int,
  result: str         # "H"|"A"|"D"
}
```

#### SportsPrediction
```python
{
  match_id: str,
  home_team: str,
  away_team: str,
  home_probability: float,      # 0-1
  draw_probability: float,       # 0-1
  away_probability: float,       # 0-1
  expected_score_home: float,
  expected_score_away: float,
  over_2_5: float,
  confidence: int,     # 0-100%
  recommendation: str
}
```

---

## 🔙 Backend - API Endpoints (19 total)

### Configuration MongoDB
```
Database: adj_killagain_db
Collections:
  - draws (tirages de loterie)
  - analysis (résultats d'analyse)
  - recommendations (recommandations)
  - matches (matchs sportifs)
  - predictions (prédictions)
```

### Routes Loteries (/api/lotteries/*)

#### Analyse
- `GET /api/lotteries/analyze/{lottery_type}`
  - Paramètres: keno | euromillions | loto
  - Retourne: LotteryAnalysis complète

- `GET /api/lotteries/keno/analysis` - Alias Kéno
- `GET /api/lotteries/euromillions/analysis` - Alias Euromillions
- `GET /api/lotteries/loto/analysis` - Alias Loto

#### Statistiques
- `GET /api/lotteries/statistics/{lottery_type}`
  - Retourne: stats globales (total_draws, distribution_normal, hot_count, cold_count)

#### Recommandations
- `GET /api/lotteries/recommendations/{lottery_type}?top_n=10`
  - Paramètres: top_n (1-50, défaut 10)
  - Retourne: List[Recommendation]

#### Génération Grilles
- `GET /api/lotteries/grids/{lottery_type}?num_grids=5`
  - Paramètres: num_grids (1-20, défaut 5)
  - Retourne: List[GridGenerated]

### Routes Sports (/api/sports/*)

#### Matchs
- `GET /api/sports/matches`
  - Retourne: matchs prochains avec recommandations

- `GET /api/sports/matches/{home_team}/vs/{away_team}/prediction`
  - Retourne: SportsPrediction détaillée

- `POST /api/sports/matches/predict`
  - Body: List[{home: str, away: str}]
  - Retourne: List[SportsPrediction]

#### Équipes
- `GET /api/sports/team/{team_name}/form`
  - Retourne: forme de l'équipe avec résultats récents

#### Statistiques
- `GET /api/sports/statistics`
  - Retourne: stats globales (home_win_rate, away_win_rate, draw_rate, avg_goals, over_2_5_rate)

- `GET /api/sports/recommendations`
  - Retourne: matchs recommandés

#### Analyse Complète
- `GET /api/sports/football/analysis`
  - Retourne: stats + recommandations combinées

### Health & Info
- `GET /` - Infos API
- `GET /health` - Status {status, database}

---

## 🔧 Algorithmes Implémentés

### LotteryAnalyzer (8 méthodes statiques)

```python
class LotteryAnalyzer:
  
  @staticmethod
  def calculate_frequency(all_numbers, max_number):
    """Retourne Dict[numéro -> % apparition] basé sur tous les tirages"""
    # count_per_number / total_appearances * 100
  
  @staticmethod
  def calculate_mean_appearance(total_draws, max_number):
    """Moyenne théorique: 100 / max_number"""
    # Chaque numéro devrait apparaître en moyenne ce % de fois
  
  @staticmethod
  def detect_anomalies(frequency, mean_appearance):
    """Détecte hot/cold numbers via Z-score"""
    # hot: Z-score > 1.5
    # cold: Z-score < -1.5
    # Retourne {hot_numbers, cold_numbers, std_dev, z_scores}
  
  @staticmethod
  def calculate_time_since_appearance(all_numbers, draws):
    """Nombre de tirages depuis dernière apparition de chaque numéro"""
    # Retourne Dict[numéro -> draws_elapsed]
  
  @staticmethod
  def generate_score(frequency, absence_days, anomalies):
    """Score pondéré: 40% fréquence + 30% absence + 30% récence"""
    # Retourne 0-100
  
  @staticmethod
  def get_top_numbers(scores, n):
    """Retourne top N numéros triés par score"""
  
  @staticmethod
  def analyze_balance(all_numbers, max_number):
    """Analyse pair/impair et bas/haut"""
    # Retourne {even_percentage, low_percentage}
  
  @staticmethod
  def chi_square_test(frequency, mean_appearance):
    """Test chi-square pour normalité de distribution"""
    # Retourne {chi_square, p_value}
```

### SportsAnalyzer (3 méthodes statiques)

```python
class SportsAnalyzer:
  
  @staticmethod
  def calculate_form(results):
    """Calcule forme équipe: W=1, D=0.5, L=0 sur derniers matchs"""
    # Retourne score 0-1
  
  @staticmethod
  def calculate_goal_probability(home_avg_goals, away_avg_goals):
    """Approximation Poisson pour Over/Under 2.5 buts"""
    # Retourne probabilité 0-1
  
  @staticmethod
  def generate_prediction(home_form, away_form, head_to_head_advantage):
    """Combine form(40%) + h2h(30%) + probabilités(30%)"""
    # Retourne {home_win, draw, away_win, expected_score, over_2_5, confidence}
```

---

## 🎨 Frontend - Pages & Composants

### Structure Fichiers
```
frontend/
├── src/
│   ├── App.jsx              # Router principal + Sidebar
│   ├── main.jsx             # Point d'entrée
│   ├── index.css            # Tailwind + custom styles
│   ├── pages/
│   │   ├── Dashboard.jsx    # Accueil (5 onglets)
│   │   ├── KenoAnalyzer.jsx
│   │   ├── EuroMillionsAnalyzer.jsx
│   │   ├── LotoAnalyzer.jsx
│   │   └── SportsAnalyzer.jsx
│   └── services/
│       └── api.js           # Client Axios
├── public/
│   └── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

### Pages Détails

#### Dashboard.jsx
- Vue d'ensemble 3 loteries
- Onglets: Overview | Keno | Euromillions | Loto | Sports
- Cartes statistiques
- Graphiques par loterie
- Diagrammes distribution

#### KenoAnalyzer.jsx
- Onglets: Analyse Détaillée | Recommandations | Grilles Générées
- Graphique BarChart fréquences
- Liste numéros chauds/froids
- Test chi-square
- Recommandations scorées
- Grilles 20 numéros avec scores

#### EuroMillionsAnalyzer.jsx
- Même structure que Kéno
- Focus sur 5 numéros
- Bonus tracké séparément

#### LotoAnalyzer.jsx
- Analyse 49 numéros
- PieChart pair/impair
- Visualisation bas/haut
- Grilles 7x7 (6 numéros)

#### SportsAnalyzer.jsx
- Recommandations matchs
- Prédictions détaillées (H/D/A probabilities)
- Score attendu
- Forme d'équipe
- Stats globales

### Navigation
- Sidebar avec 5 links (Dashboard, Keno, Euro, Loto, Sports)
- Responsive (mobile-friendly)
- Dark theme / Modern design

---

## 📦 Dépendances Requises

### Backend (requirements.txt)
```
fastapi==0.110.1
uvicorn==0.27.0
motor==3.3.1
pymongo==4.5.0
pydantic==2.0.3
python-dotenv==1.0.0
numpy==1.24.3
scipy==1.11.0
aiohttp==3.8.5
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.5.0",
    "axios": "^1.6.0",
    "recharts": "^2.10.3",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }
}
```

---

## ⚙️ Configuration Environnement

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=adj_killagain_db
PORT=5001
DEBUG=True
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5001
```

---

## 🚀 Démarrage

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
# Écoute http://localhost:5001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Écoute http://localhost:5173
```

---

## 📊 Données Sample

### Initialisation Auto
Au démarrage du backend:
- ✅ Génère 100 tirages par loterie (Kéno, Euro, Loto)
- ✅ Génère 50 matchs simulés
- ✅ Insère dans MongoDB (adj_killagain_db)
- ✅ Prêt pour analyse immédiate

### Algorithmes Sample Data
- Numéros: aléatoires mais réalistes
- Matchs: résultats simulations football
- Structure: compatible avec analyses statistiques

---

## ✨ Fonctionnalités Attendues

✅ Analyse statistique complète (8 analyses par loterie)
✅ Anomalies détectées automatiquement
✅ Recommandations intelligentes (scores + confiance)
✅ Génération de grilles optimisées
✅ Prédictions de matchs fiables
✅ Interface React moderne et responsive
✅ 5+ pages avec graphiques interactifs
✅ Documentation complète
✅ Code production-ready
✅ Gestion d'erreurs robuste

---

## 🎯 Objectif du Test

**Comparer:**
1. Version créée manuellement (référence)
2. Version générée par Darknexus (test)

**Critères de comparaison:**
- Structure/organisation du code
- Qualité de l'implémentation
- Complétude des fonctionnalités
- Performance
- Documentations
- Sériosité du code

---

**À utiliser comme prompt pour Darknexus Generator!**
