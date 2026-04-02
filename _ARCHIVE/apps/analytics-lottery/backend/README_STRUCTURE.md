# 📊 Analytics Lottery - Backend

## 📁 Structure du Projet

```
backend/
├── config/                    # Configuration et base de données
│   ├── database.py           # Connexion SQLite + schéma
│   ├── db_adapter.py         # Adapter MongoDB-like pour SQLite
│   ├── __init__.py           # Exports publics du module config
│   ├── .env                  # Variables d'environnement (local)
│   └── .env.example          # Template des variables d'env
│
├── models/                   # Modèles ORM
│   ├── project.py            # Modèle Project
│   ├── user.py               # Modèle User
│   └── __init__.py
│
├── services/                 # Logique métier
│   ├── data_service.py       # Génération et gestion des données
│   ├── ai_service.py         # Service IA/ML
│   ├── ai_agent_generator.py # Générateur d'agents IA
│   ├── pwa_generator.py      # PWA builder
│   ├── seo_generator.py      # SEO optimizer
│   ├── stripe_templates.py   # Intégration Stripe
│   ├── n8n_generator.py      # Automation workflows
│   └── __init__.py
│
├── routes/                   # Endpoints API
│   ├── lotteries.py          # /api/lotteries/*
│   ├── sports.py             # /api/sports/*
│   ├── projects.py           # /api/projects/*
│   └── __init__.py
│
├── utils/                    # Helpers et utilitaires
│   └── __init__.py
│
├── tests/                    # Tests unitaires
│   └── __init__.py
│
├── main.py                   # Point d'entrée FastAPI
├── requirements.txt          # Dépendances Python
├── .gitignore               # Fichiers à ignorer
├── lottery_analyzer.db      # Base SQLite (généré)
└── __pycache__/             # Cache Python (ignoré)
```

## 🚀 Démarrage

### Installation des dépendances
```bash
cd analytics-lottery/lottery/backend
pip install -r requirements.txt
```

### Variables d'environnement
```bash
cp config/.env.example config/.env
# Éditer config/.env si nécessaire
```

### Lancer le backend
```bash
python main.py
```

L'API sera disponible sur: `http://localhost:5001`
Documentation Swagger: `http://localhost:5001/docs`

## 🗄️ Base de Données

- **Type**: SQLite (synchrone)
- **Fichier**: `lottery_analyzer.db`
- **Adapter**: MongoDB-like API pour compatibilité legacy

### Tables
- `draws`: Historique des tirages (Kéno, Euromillions, Loto)
- `analysis`: Analyses de fréquences et anomalies
- `recommendations`: Recommandations de numéros
- `matches`: Historique des matchs sportifs
- `predictions`: Prédictions sportives

## 📡 API Endpoints

### Loteries
- `GET /api/lotteries/predict` - Prédictions loteries
- `GET /api/lotteries/analysis` - Analyse statistique
- `GET /api/lotteries/history` - Historique des tirages

### Sports
- `GET /api/sports/predict` - Prédictions sportives
- `GET /api/sports/analysis` - Analyse des matchs
- `GET /api/sports/matches` - Historique des matchs

## 🛠️ Architecture

### Flux de données
1. **main.py** → Point d'entrée FastAPI
2. **routes/** → Endpoints API
3. **services/** → Logique métier
4. **config/database.py** → Couche données
5. **config/db_adapter.py** → Adapter MongoDB→SQLite

### Design Pattern
- **Adapter Pattern**: Convertit l'API MongoDB en SQLite
- **Service Layer**: Logique métier séparée des routes
- **Dependency Injection**: DB passée aux services

## 📦 Dépendances principales

- **FastAPI**: Framework API
- **Uvicorn**: Serveur ASGI
- **python-dotenv**: Gestion des variables d'env
- **sqlite3**: Base de données (built-in)
- **OpenAI**: API pour IA
- **Recharts-Python**: Visualisations (si nécessaire)

## 🐛 Débogage

### Logs
```bash
# Les logs sortie en console lors du démarrage
# Chercher "[ERROR]" ou "[OK]" pour diagnostiquer
```

### Base de données
```bash
# Inspecter la DB
sqlite3 lottery_analyzer.db ".tables"
sqlite3 lottery_analyzer.db "SELECT COUNT(*) FROM draws;"
```

## 📝 Notes de développement

- Ne pas modifier `config/db_adapter.py` à moins de comprendre MongoDB query syntax
- Les `.env` files ne doivent jamais être committés (inclus dans .gitignore)
- Les migrations DB sont auto-gérées dans `config/database.py`
- Les routes doivent enregistrer leurs prefixes dans `setup_*_routes()`

## 🔄 Git Workflow

```bash
git add .
git commit -m "🔧 Reorganize backend structure for clarity"
git push origin main
```

---

**Maintenu par**: Équipe Analytics Lottery
**Dernière mise à jour**: 2026-03-25
