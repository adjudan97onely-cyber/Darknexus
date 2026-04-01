# Setup Darknexus Complet - PC Portable

**Objectif** : Cloner depuis GitHub et avoir exactement la même setup que le PC bureau avec toutes les apps (Warzone, Lotteries, KillaFood).

---

## Prérequis (avant de commencer)

- ✅ **Git** installé : [https://git-scm.com/download/win](https://git-scm.com/download/win)
- ✅ **Python 3.11+** installé : [https://www.python.org/downloads/](https://www.python.org/downloads/)
- ✅ **Node.js 18+** installé : [https://nodejs.org/](https://nodejs.org/)

Vérifie dans PowerShell/Terminal :
```powershell
git --version
python --version
node --version
npm --version
```

---

## Étape 1 : Cloner le Repo Complet

Ouvre PowerShell et exécute :

```powershell
# Navigue vers où tu veux le cloner (ex: C:\, D:\, etc.)
cd C:\

# Clone le repo complet
git clone https://github.com/adjudan97onely-cyber/Darknexus.git
cd Darknexus
```

---

## Étape 2 : Setup Backend (Python)

### Backend Principal (Lottery/Sports/KillaFood)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1

pip install --upgrade pip
pip install -r requirements.txt
```

**Si erreur importlib/grpc** : C'est normal sur Python 3.14, utilise Python 3.11 ou 3.12 à la place.

### Backend Warzone (local mode)

```powershell
# Depuis Darknexus root
cd warzone/backend
python -m venv venv
.\venv\Scripts\Activate.ps1

pip install fastapi uvicorn motor python-dotenv openai
```

---

## Étape 3 : Setup Frontend (Node.js)

### Frontend Principal (Lottery/Sports/KillaFood)

```powershell
# Depuis Darknexus root
cd frontend
npm install
npm run build  # ou npm run dev pour dev local
```

### Frontend Warzone

```powershell
# Depuis Darknexus root
cd warzone/frontend
npm install
npm run build  # ou npm run dev
```

---

## Étape 4 : Configuration .env

**Copie depuis ton PC bureau** ou crée manuellement :

### `backend/.env`
```
MONGODB_URI=mongodb://localhost:27017/darknexus
OPENAI_API_KEY=<ta-clé-openai>
JWT_SECRET=<random-secret>
ENV=development
```

### `warzone/backend/.env`
```
MONGODB_URI=mongodb://localhost:27017/warzone
OPENAI_API_KEY=<ta-clé-openai>
PORT=5001
```

### `frontend/.env.local`
```
VITE_API_URL=http://localhost:5000
```

### `warzone/frontend/.env.local`
```
VITE_API_URL=http://localhost:5001
```

---

## Étape 5 : Démarrer les Apps

### Option A : Batch Scripts (recommandé pour Windows)

Copie ces fichiers du PC bureau vers PC portable :
- `LANCER_WARZONE.bat`
- `LANCER_LOTTERY.bat` (ou `LANCER_KILLAGAIN_FOOD.bat`)

Puis double-click sur le `.bat` dans l'explorateur.

### Option B : Démarrage Manual

#### Terminal 1 - Backend Principal
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python server.py
# Écoute sur http://localhost:5000
```

#### Terminal 2 - Frontend Principal
```powershell
cd frontend
npm run dev
# Écoute sur http://localhost:5173
```

#### Terminal 3 - Warzone Backend
```powershell
cd warzone/backend
.\venv\Scripts\Activate.ps1
python server.py
# Écoute sur http://localhost:5001
```

#### Terminal 4 - Warzone Frontend
```powershell
cd warzone/frontend
npm run dev
# Écoute sur http://localhost:3000
```

---

## Étape 6 : Vérifier que tout fonctionne

- ✅ Lottery : http://localhost:5173
- ✅ Warzone : http://localhost:3000
- ✅ KillaFood : http://localhost:5173/killagain

Test rapide API :
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method Get
```

---

## Troubleshooting

| Problème | Solution |
|----------|----------|
| Python/venv error | Utilise Python 3.11 ou 3.12 (pas 3.14) |
| `npm ERR!` | Efface `node_modules/` + `package-lock.json` + `npm install` |
| Port en utilisation | Ferme autre app, ou change PORT dans `.env` |
| Blank frontend page | Vérifie `VITE_API_URL` et console browser (F12) |
| Backend 404 | Vérifie que backend tourne sur le bon port |

---

## Sync avec PC Bureau

Pour rester synchronisé entre PC bureau et portable :

```powershell
# Sur portable, récupère les dernières modifs du bureau
git pull origin main

# Après avoir codé sur portable, push vers GitHub
git add .
git commit -m "Update: description"
git push origin main

# Reviens au bureau et pull
git pull origin main
```

---

## Pour Aller Plus Loin

- Docs complets : `docs/START_HERE.md`
- API ref : `docs/API_INTEGRATION_COMPLETE.md`
- Troubleshoot : `docs/INSTALL_GUIDE.md`

---

**Besoin d'aide ?** Ouvre une issue ou contacte via le repo GitHub.
