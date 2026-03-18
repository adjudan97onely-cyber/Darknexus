# ⚡ Démarrage Rapide - 5 Minutes

Lancer l'application **Analyseur Intelligent Multi-Loteries & Paris Sportifs** en 5 minutes!

## 📋 Pré-requis (5 min de setup)

### Installation Unique (première fois)

**1. Backend Setup (2 min)**
```bash
cd analytics-lottery/backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

**2. Frontend Setup (2 min)**
```bash
cd ../frontend
npm install
cp .env.example .env
```

**3. MongoDB**
- Si local: Télécharger et lancer [MongoDB Community](https://www.mongodb.com/try/download/community)
- Si cloud: Utiliser [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratuit)

---

## 🚀 Lancer l'App (chaque fois)

### Trois Terminaux Ouverts

**Terminal 1 - MongoDB (optionnel si cloud)**
```bash
mongod
# Sortie: listening on port 27017
```

**Terminal 2 - Backend**
```bash
cd analytics-lottery/backend
source venv/bin/activate  # ou venv\Scripts\activate sur Windows
python main.py

# Sortie attendue:
# ✅ Application démarrée avec succès
# 🚀 Serveur actif sur http://localhost:5001
```

**Terminal 3 - Frontend**
```bash
cd analytics-lottery/frontend
npm run dev

# Sortie attendue:
# ➜  Local:   http://localhost:5173
```

### 🌐 Accéder

Ouvrir navigateur: **http://localhost:5173**

---

## ✅ Vérifier que tout fonctionne

### 1️⃣ Dashboard charge
- Voir 3 cartes de loteries
- Voir stats sports

### 2️⃣ Cliquer sur "Keno"
- Voir graphiques
- Voir numéros recommandés

### 3️⃣ API Health Check
```bash
curl http://localhost:5001/health
# {"status":"healthy","database":"connected"}
```

---

## 🐛 Troubleshooting Rapide

| Problème | Solution |
|----------|----------|
| Port 5001 occupé | `PORT=5002` dans .env backend |
| Port 5173 occupé | npm trouvera le prochain port |
| MongoDB connexion échouée | `mongod` en Terminal 1 |
| "Module not found" | `pip install -r requirements.txt` |
| "Cannot find module" | `npm install` dans frontend/ |
| Données n'apparaissent pas | Actualiser page / Vérifier console |

---

## 📊 Que regarder

### Dashboard
- Vue d'ensemble toutes loteries
- Stats globales sports

### Keno
- Top numéros (chauds)
- Grilles générées

### Euromillions
- Focus 5 numéros
- Bonus tracké

### Loto
- 49 numéros
- Distribution pair/impair

### Football
- Prédictions matchs
- Forme équipes

---

## 💾 Données

**Automatiquement créées au démarrage:**
- 100 tirages par loterie (sample data fictive)
- 50 matchs simulés
- Sauvegardées dans MongoDB

**Collections:**
```
adj_killagain_db/
├── draws          (tirages)
├── analysis       (résultats)
├── recommendations (recommandations)
├── matches        (matchs)
└── predictions    (prédictions)
```

---

## 📱 Points d'accès

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | 🟢 React + Vite |
| Backend | http://localhost:5001 | 🟢 FastAPI |
| Backend Health | http://localhost:5001/health | 📊 JSON |
| API Docs | http://localhost:5001/docs | 📖 Swagger |
| MongoDB | mongodb://localhost:27017 | 🗄️ Si local |

---

## 🎯 Affichage Attendu

```
Terminal 1 (Backend):
✅ Données de sample initialisées
🚀 Application démarrée avec succès
INFO:     Uvicorn running on http://0.0.0.0:5001

Terminal 2 (Frontend):
VITE v5.0.0  ready in 234 ms ⚡
➜  Local:   http://localhost:5173
➜  press h to show help

Navigateur:
[Logo Analytics Lottery]
Dashboard
├─ 3 Lotaries (Keno, Euro, Loto)
├─ Stats Sports
├─ Navigation Sidebar
└─ [Graphs & Charts]
```

---

## 🚫 Erreurs Communes & Fixes

### "Connection refused" sur le backend
```bash
# S'assurer que le backend tourne en Terminal 2
# Vérifier port 5001 est libre
python main.py
```

### "Cannot GET /api/lotteries/analyze/keno"
```bash
# Vérifier que VITE_API_URL=http://localhost:5001 dans frontend/.env
# Vérifier que backend répond sur 5001
curl http://localhost:5001/health
```

### "Cannot connect to MongoDB"
```bash
# MongoDB doit tourner
mongod

# OU changer MONGO_URL dans backend/.env vers Atlas URI
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net
```

### Dépendances manquantes
```bash
# Backend
pip install -r requirements.txt --upgrade

# Frontend
npm install --save
```

---

## 🎓 Comprendre la Stack

```
Frontend (React 18)
    ↓ (appels API)
Backend (FastAPI)
    ↓ (Algorithmiques)
Algorithms (LotteryAnalyzer, SportsAnalyzer)
    ↓ (Requête)
MongoDB (Base de données)
```

**Votre Workflow:**
1. Cliquer sur "Keno" 🎲
2. Frontend appelle `GET /api/lotteries/keno/analysis`
3. Backend récupère données MongoDB
4. LotteryAnalyzer traite les données
5. Résultats envoyés au frontend
6. React + Recharts affiche graphiques 📊

---

## ✨ Prochaines Étapes

✅ **Fait (Phase 1):**
- Architecture complète
- Algorithmes d'analyse
- UI avec 5+ pages
- Visualisations interactives

🔜 **Futur (Phase 2):**
- Real-time WebSockets
- Machine Learning
- Vraies données (FDJ)
- Historique utilisateur

---

## 📞 Support Rapide

**Consoles à vérifier:**
- Terminal Backend (logs API)
- Console Navigateur (F12 → Console)
- Terminal Frontend (build errors)

**Fichiers importants:**
- `backend/.env` - Config MongoDB/Port
- `frontend/.env` - Config API URL
- `backend/main.py` - Entrée API

---

**C'est pret! 🚀**

```bash
# One-liner complet:
# Terminal 1: mongod
# Terminal 2: cd backend && source venv/bin/activate && python main.py
# Terminal 3: cd frontend && npm run dev
# Browser: http://localhost:5173
```

**Happy Analyzing! 🎰📊**
