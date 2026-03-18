# 🚀 Analytics Lottery - Guide Rapide d'Utilisation

## ✅ État Actuel
- **Backend:** ✅ Actif sur `http://localhost:5001`
- **Frontend:** ✅ Actif sur `http://localhost:5173`
- **Database:** SQLite (`lottery_analyzer.db`)

## 🎯 Accès Rapide

### 🌐 Ouvrir l'Application
```
http://localhost:5173
```

### 🔗 Vérifier l'API Backend
```bash
# Option 1: Vérifier la santé
curl http://localhost:5001/health

# Option 2: Infos API
curl http://localhost:5001/

# Réponse attendue:
# {"status":"✅ API fonctionnelle"}
```

---

## 🛠️ Démarrer/Arrêter les Services

### Option 1: Batch File (Simple)
```bash
# Démarrer tout
C:\Darknexus-main\analytics-lottery\START_ALL.bat

# Arrêter
# - Fermer les deux fenêtres CMD
# - Ou: taskkill /F /IM python.exe /F & taskkill /F /IM node.exe
```

### Option 2: PowerShell (Avancé)
```powershell
# Démarrer tout
pwsh C:\Darknexus-main\analytics-lottery\START_ALL.ps1

# Démarrer uniquement le backend
pwsh -Command "cd C:\Darknexus-main\analytics-lottery\backend; .\venv\Scripts\python.exe start_simple.py"

# Démarrer uniquement le frontend
pwsh -Command "cd C:\Darknexus-main\analytics-lottery\frontend; npm run dev"
```

### Option 3: Manuel (Terminal Séparé)

**Terminal 1 - Backend:**
```bash
cd C:\Darknexus-main\analytics-lottery\backend
.\venv\Scripts\python.exe start_simple.py
```

**Terminal 2 - Frontend:**
```bash
cd C:\Darknexus-main\analytics-lottery\frontend
npm run dev
```

---

## 📂 Structure du Projet

```
analytics-lottery/
├── backend/                 # API FastAPI
│   ├── start_simple.py      # 🆕 Serveur simplifié (recommandé)
│   ├── main.py              # App principale
│   ├── database.py          # SQLite connection
│   ├── requirements.txt      # Dépendances Python
│   └── venv/                # Virtual environment
│
├── frontend/                # React + Vite
│   ├── src/                 # Code source React
│   ├── public/              # Assets statiques
│   ├── package.json         # Dépendances Node
│   └── vite.config.js       # Config Vite
│
├── START_ALL.bat            # 🆕 Démarrage automatique (Windows)
├── START_ALL.ps1            # 🆕 Démarrage PowerShell
├── DEPLOYMENT_SUCCESS.md    # 🆕 Info déploiement
└── lottery_analyzer.db      # Base de données SQLite
```

---

## 🐛 Dépannage

### ❌ "Port 5001 déjà utilisé"
```powershell
# Trouver le processus
netstat -ano | findstr :5001

# Tuer par PID
taskkill /PID <PID> /F

# Ou tout Python
taskkill /F /IM python.exe
```

### ❌ "Port 5173 déjà utilisé"
```powershell
# Tuer tout Node
taskkill /F /IM node.exe
```

### ❌ "npm: commande non trouvée"
```bash
# Installer Node.js depuis:
# https://nodejs.org/

# Vérifier après installation:
node --version
npm --version
```

### ❌ "Python venv ne fonctionne pas"
```bash
cd C:\Darknexus-main\analytics-lottery\backend

# Créer un nouveau venv
python -m venv venv

# Installer dépendances
.\venv\Scripts\pip install -r requirements.txt
```

### ❌ "Le frontend ne charge pas"
```bash
# Effacer cache et relancer
cd frontend
rm -r node_modules
npm install
npm run dev
```

---

## 📚 Architecture Technique

### Backend (FastAPI/Python)
- **Port:** 5001
- **Framework:** FastAPI 0.135.1
- **Database:** SQLite 3
- **Algorithmes:** LotteryAnalyzer, SportsAnalyzer
- **Endpoints:** /health, /api/lotteries/*, /api/sports/*

### Frontend (React/Vite)
- **Port:** 5173
- **Framework:** React 18.3 + Vite 5.4
- **Styling:** Tailwind CSS 3.4
- **Charts:** Recharts 2.10
- **API Client:** Axios

### Communication
- **CORS:** Configuré pour localhost:5173 → localhost:5001
- **Format:** JSON REST API
- **Requêtes async:** Basées sur Promises

---

## 🎯 Cas d'Usage

### Vérification Basique
```bash
# 1. Vérifier backend
curl http://localhost:5001/health

# 2. Vérifier frontend disponible
curl http://localhost:5173/index.html

# 3. Ouvrir l'app
# Navigateur: http://localhost:5173
```

### Test API
```bash
# Test endpoint Keno
curl http://localhost:5001/api/lotteries/keno/analyze

# Réponse:
# {"lottery":"keno","analysis":"Simulation de données d'analyse"}
```

### Redémarrage Complet
```bash
# 1. Arrêter tous les services
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# 2. Relancer
C:\Darknexus-main\analytics-lottery\START_ALL.bat
```

---

## 💾 Base de Données

### Localisation
```
C:\Darknexus-main\analytics-lottery\backend\lottery_analyzer.db
```

### Réinitialiser
```bash
# Supprimer et relancer (crée une DB vierge)
rm C:\Darknexus-main\analytics-lottery\backend\lottery_analyzer.db
python start_simple.py
```

### Tables
- `draws` - Données de tirages
- `analysis` - Analyses statistiques
- `recommendations` - Recommandations
- `matches` - Données de matchs
- `predictions` - Prédictions sportives

---

## 🚀 Prochaines Étapes

1. **Tester l'application:**
   - Ouvrir http://localhost:5173
   - Naviguer entre les onglets
   - Vérifier que les données se chargent

2. **Créer dans Darknexus:**
   - Utiliser `DARKNEXUS_PROJECT_SPEC.md`
   - Comparer la version générée

3. **Personnalisation:**
   - Modifier `backend/start_simple.py` pour ajouter des endpoints
   - Éditer `frontend/src/` pour changer l'UI

---

**Version:** 1.0.0 (SQLite)  
**Dernière mise à jour:** 13 Mars 2026  
**Status:** ✅ Production Ready (Prototype)
