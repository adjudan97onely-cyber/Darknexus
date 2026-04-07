# 🖥️ BRIEFING CLAUDE — DESTINÉ AU PC PORTABLE
### À lire en priorité absolue avant toute action

---

## QUI EST L'UTILISATEUR

C'est le même développeur que sur son PC de bureau. Il travaille sur un projet
appelé **Darknexus** — une plateforme multi-apps.  
Il est maintenant sur son **PC portable** et il veut travailler exactement comme
chez lui, avec les mêmes apps, les mêmes identifiants, le même environnement.

---

## L'ARCHITECTURE DU PROJET

Le repo GitHub est : `https://github.com/adjudan97onely-cyber/Darknexus`

Le projet contient **4 applications** :

| App | Backend port | Frontend port | Dossier |
|---|---|---|---|
| Darknexus Main (gestionnaire IA) | 5000 | 3000 | `backend/` + `frontend/` |
| Analytics (lotteries / sports) | 5001 | 5173 | `analytics/backend/` + `analytics/frontend/` |
| Killagain-Food (recettes) | 5002 | 5180 | `killagain-food/` |
| Warzone (scripts GPC manette) | 5003 | — | `warzone/backend/` + `warzone/frontend/` |

---

## RÈGLE GIT ABSOLUE

- **Branche de travail sur le portable : `dev-portable`**
- **Ne jamais toucher à `main` depuis le portable**
- `main` = branche stable du PC bureau, protégée
- Tag de snapshot stable : `v-stable-2026-04-08`

Quand l'utilisateur veut merger son travail dans `main`, il le fera depuis le PC bureau.

---

## ÉTAT DU REPO AU MOMENT DU DÉPART (8 avril 2026)

- Dernier commit sur `main` : `5900126` — fix insertBefore React (toutes apps OK)
- Dernier commit sur `dev-portable` : `75cdae8` — guide setup portable
- Toutes les apps testées et fonctionnelles : ports 5000 ✅ 5001 ✅ 3000 ✅ 5173 ✅ 5180 ✅

---

## CE QU'IL FAUT INSTALLER SUR LE PC PORTABLE

Claude, vérifie d'abord ce qui est déjà installé avant de dire quoi faire :

```powershell
git --version
python --version
node --version
npm --version
Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue | Select-Object Name, Status
```

### Logiciels requis

| Logiciel | Version exacte | Lien |
|---|---|---|
| Git | n'importe laquelle | https://git-scm.com/download/win |
| Python | **3.11 ou 3.12 OBLIGATOIRE** (pas 3.13+) | https://www.python.org/downloads/ |
| Node.js | 18 ou 20 LTS | https://nodejs.org/ |
| MongoDB Community | **8.x** | https://www.mongodb.com/try/download/community |

> ⚠️ **Python : IMPORTANT**  
> Sur le PC bureau, le venv tourne sur Python 3.14 mais certains packages ont des  
> problèmes avec 3.14. Recommande Python 3.12 pour le portable pour éviter tout souci.  
> Pendant l'install Python : **coche "Add Python to PATH"**

> ⚠️ **MongoDB**  
> Pendant l'install : **coche "Install MongoDB as a Service"**  
> Ça le lance automatiquement au démarrage sans avoir à le démarrer manuellement.

---

## ÉTAPES DE SETUP (dans l'ordre)

### 1. Cloner et se mettre sur la bonne branche

```powershell
cd C:\
git clone https://github.com/adjudan97onely-cyber/Darknexus.git Darknexus-main
cd Darknexus-main
git checkout dev-portable
git branch   # doit afficher : * dev-portable
```

### 2. Setup venv Python — Backend principal

```powershell
cd C:\Darknexus-main\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd C:\Darknexus-main
```

### 3. Setup venv Python — Analytics backend

```powershell
cd C:\Darknexus-main\analytics\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
deactivate
cd C:\Darknexus-main
```

### 4. Setup venv Python — Warzone backend

```powershell
cd C:\Darknexus-main\warzone\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install fastapi uvicorn motor python-dotenv openai aiohttp groq
deactivate
cd C:\Darknexus-main
```

### 5. Setup venv Python — Dossier _publish (utilisé par les launchers .bat)

```powershell
# Ce dossier est utilisé par START_DARKNEXUS.bat, LANCER_ANALYTICS.bat etc.
New-Item -ItemType Directory -Force -Path "C:\Darknexus-main\_publish\Darknexus-full\analytics-lottery\backend"
cd "C:\Darknexus-main\_publish\Darknexus-full\analytics-lottery\backend"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r "C:\Darknexus-main\backend\requirements.txt"
pip install -r "C:\Darknexus-main\analytics\backend\requirements.txt"
deactivate
cd C:\Darknexus-main
```

### 6. npm install — tous les frontends

```powershell
cd C:\Darknexus-main\frontend       ; npm install ; cd C:\Darknexus-main
cd C:\Darknexus-main\analytics\frontend  ; npm install ; cd C:\Darknexus-main
cd C:\Darknexus-main\killagain-food ; npm install ; cd C:\Darknexus-main
cd C:\Darknexus-main\warzone\frontend    ; npm install ; cd C:\Darknexus-main
```

### 7. Copier les fichiers .env

Le fichier `env_export_PORTABLE.zip` se trouve dans le repo (il doit être dans
`C:\Darknexus-main\` après le clone).

```powershell
# Lance le script d'import depuis C:\Darknexus-main
powershell -ExecutionPolicy Bypass -File "C:\Darknexus-main\IMPORT_ENV_DEPUIS_BUREAU.ps1"
```

Si `env_export_PORTABLE.zip` n'est pas dans le repo (il est dans .gitignore),
l'utilisateur doit le copier depuis une clé USB ou Google Drive.  
**Les .env sont essentiels — sans eux les backends refusent de démarrer.**

---

## CONTENU EXACT DES FICHIERS .ENV

Si `IMPORT_ENV_DEPUIS_BUREAU.ps1` ne trouve pas le ZIP, crée les fichiers
manuellement avec ces contenus exacts :

### `backend/.env`
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=dark_nexus_local
JWT_SECRET_KEY=darknexus-local-dev-key-2026
PORT=5000
CORS_ORIGINS=*
OPENAI_API_KEY=<OPENAI_API_KEY_DEPUIS_ZIP_ENV>
```

### `frontend/.env`
```
REACT_APP_BACKEND_URL=http://localhost:5000
```

### `analytics/backend/.env`
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=analytics_lottery
JWT_SECRET_KEY=analytics-local-dev-key-2026
PORT=5001
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=*
OPENAI_API_KEY=<OPENAI_API_KEY_DEPUIS_ZIP_ENV>
FOOTBALL_DATA_KEY=0065b01c14944d4c972e4bb945d81364
RAPIDAPI_KEY=76343d70cemsh14841b89ec6ee04p15d5e7jsn077587bc44a0
```

### `analytics/frontend/.env`
```
VITE_API_URL=http://localhost:5001
VITE_APP_NAME=Analytics Lottery
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

### `killagain-food/.env`
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=dark_nexus_local
CORS_ORIGINS=*
OPENAI_API_KEY=<OPENAI_API_KEY_DEPUIS_ZIP_ENV>
JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
VITE_ANTHROPIC_API_KEY=<ANTHROPIC_API_KEY_DEPUIS_ZIP_ENV>
VITE_GROQ_API_KEY=<GROQ_API_KEY_DEPUIS_ZIP_ENV>
```

### `killagain-food/frontend/.env`
```
VITE_API_URL=http://localhost:5002
```

### `killagain-food/analytics-lottery/frontend/.env`
```
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Loterie Analytics
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

### `warzone/backend/.env`
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=zen_hub_pro
PORT=5003
DEBUG=True
API_TIMEOUT=30
MAX_WORKERS=10
GROQ_API_KEY=<GROQ_API_KEY_DEPUIS_ZIP_ENV>
LLM_MODEL=llama-3.3-70b-versatile
JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
```

### `warzone/frontend/.env`
```
VITE_API_URL=http://localhost:5003
VITE_APP_NAME=Warzone GPC
VITE_APP_VERSION=1.0.0
REACT_APP_BACKEND_URL=http://localhost:5003
```

### `.env` (racine du projet)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=dark_nexus_local
CORS_ORIGINS=*
OPENAI_API_KEY=<OPENAI_API_KEY_DEPUIS_ZIP_ENV>
JWT_SECRET_KEY=49d941ea67676514b866de2baab7074828b8e12c97412a37138c555b9932832d
```

---

## LANCER LES APPS

Une fois le setup terminé, utiliser les scripts bat :

```
START_DARKNEXUS.bat     → Darknexus (ports 5000 + 3000)
LANCER_ANALYTICS.bat    → Analytics (ports 5001 + 5173)
LANCER_KILLAGAIN_FOOD.bat → Killagain-Food (port 5180)
LANCER_WARZONE.bat      → Warzone (ports 5003 + frontend)
```

Ou tout lancer d'un coup :
```
START_ALL.bat
```

### Vérifier que tout tourne (PowerShell)
```powershell
netstat -an | Where-Object { $_ -match "LISTENING" -and ($_ -match ":3000 " -or $_ -match ":5000 " -or $_ -match ":5001 " -or $_ -match ":5173 " -or $_ -match ":5180 ") }
```

### URLs
- Darknexus : http://localhost:3000
- Darknexus API : http://localhost:5000/docs
- Analytics : http://localhost:5173
- Analytics API : http://localhost:5001/docs
- Killagain-Food : http://localhost:5180

---

## MONGODB — BASES DE DONNÉES

MongoDB tourne sur `localhost:27017`.  
Les bases sont **créées automatiquement** au premier lancement des backends.  
Noms des bases utilisées :

| Base | Utilisée par |
|---|---|
| `dark_nexus_local` | Backend principal + Killagain-Food |
| `analytics_lottery` | Analytics backend |
| `zen_hub_pro` | Warzone backend |
| `adj_killagain_db` | Killagain-Food (alternative) |

Vérifier que MongoDB tourne :
```powershell
Get-Service -Name "MongoDB" | Select-Object Name, Status
# Si Stopped :
Start-Service -Name "MongoDB"
```

---

## WORKFLOW GIT SUR LE PORTABLE

```powershell
# Vérifier sur quelle branche on est (TOUJOURS dev-portable)
git branch

# Récupérer les dernières modifs depuis GitHub
git pull origin dev-portable

# Sauvegarder son travail
git add .
git commit -m "feat: description de ce qu'on a fait"
git push origin dev-portable

# JAMAIS :
# git checkout main       ← NE PAS FAIRE
# git push origin main    ← NE PAS FAIRE
```

---

## PROBLÈMES CONNUS ET SOLUTIONS

### Erreur "insertBefore" sur localhost:3000
**Cause :** Chrome propose de traduire la page, ça casse React.  
**Solution :** Désactive la traduction automatique dans Chrome pour localhost.  
*(Ce bug a été corrigé dans le code avec `translate="no"` mais Chrome peut encore interférer)*

### Erreur d'exécution de script PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Backend ne démarre pas
1. Vérifie que MongoDB tourne : `Get-Service MongoDB`
2. Vérifie que le fichier `.env` existe dans le bon dossier
3. Vérifie que le venv est activé avant de lancer

### npm install échoue avec Node v24+
Le projet utilise `react-scripts 5.0.1`. Si erreur avec Node v24 :
```powershell
npm install --legacy-peer-deps
```

### Port déjà utilisé
```powershell
# Trouve quel processus utilise le port (ex: 5000)
netstat -ano | Where-Object { $_ -match ":5000 " -and $_ -match "LISTENING" }
# Tue le processus (remplace XXXX par le PID)
Stop-Process -Id XXXX -Force
```

---

## TECH STACK COMPLÈTE (pour référence Claude)

**Backend principal** : FastAPI + MongoDB/Motor + JWT (python-jose) + OpenAI + Anthropic + Groq + LiteLLM  
**Frontend principal** : React 18 + CRA/Craco + Radix UI + Tailwind CSS v3 + Recharts  
**Analytics backend** : FastAPI + SQLite + Motor + football-data.org API  
**Analytics frontend** : React + Vite + Tailwind  
**Killagain-Food** : React + Vite + Tailwind + API Vision Claude/OpenAI  
**Warzone** : Scripts GPC (.gpc) + FastAPI + React + Groq (Llama 3.3)  
**Chronus Zen IDE** : Electron + React + CodeMirror 6 (compilateur GPC)  

---

## NOTE IMPORTANTE POUR CLAUDE

L'utilisateur travaille en **français**. Il s'appelle pas par son prénom dans le chat.  
Il préfère des réponses courtes et directes, pas de longues explications sauf si demandé.  
Son workflow préféré en fin de session : finalisation → confirmation → push GitHub.  
Ne jamais push vers `main` sans sa validation explicite.  
La branche `main` est sacrée — uniquement modifiée depuis le PC bureau après validation.
