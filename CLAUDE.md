# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vue d'ensemble

**Darknexus** est une plateforme multi-applications composée de :
1. **Main App** — gestionnaire de projets IA (React + FastAPI, ports 3000/5000)
2. **Killagain-Food** — app de recettes indépendante (React + Vite, port 5180)
3. **Analytics** — dashboard de prédictions/loterie (React + FastAPI séparés)
4. **Warzone** — scripts GPC pour manettes (pas d'interface web)

## Commandes de développement

### Backend principal (`/backend`)
```bash
pip install -r requirements.txt
python server.py          # http://localhost:5000 — Swagger: /docs
```

### Frontend principal (`/frontend`)
```bash
npm install
npm start                 # http://localhost:3000
npm run build
```

### Killagain-Food (`/killagain-food`)
```bash
npm install
npm run dev               # http://localhost:5180
npm run build
```

### Analytics (`/analytics`)
```bash
# Backend
cd analytics/backend && pip install -r requirements.txt && python server.py

# Frontend
cd analytics/frontend && npm install && npm run dev
```

### Tests backend
```bash
cd backend
python backend_test.py
python quick_backend_test.py
python test_ai_service.js   # pour les services AI
```

## Architecture backend (`/backend`)

- **`server.py`** — point d'entrée FastAPI, enregistre tous les routers
- **`database.py`** — client MongoDB async (Motor)
- **`routes/`** — handlers HTTP : `projects.py` (34KB), `assistant.py` (32KB), `chat.py`, `auth.py`, `copilot.py`, `scraper.py`, `whisper.py`, `streaming.py`, `admin.py`
- **`services/`** — logique métier (28 modules) : `ai_service.py` (orchestration LLM), `intelligent_agent.py`, `agent_controller.py`, `vercel_deployer.py`, `auto_deploy.py`, `code_executor.py`, `user_memory.py`, `web_scraper.py`, `pwa_generator.py`
- **`models/`** — modèles Pydantic : `project.py`, `user.py`

Stack backend : FastAPI, MongoDB/Motor, JWT (python-jose), OpenAI + Google GenAI + Anthropic + LiteLLM, BeautifulSoup, Stripe, Whisper.

## Architecture frontend (`/frontend`)

- **`src/App.js`** — router React avec routes protégées (ProtectedRoute)
- **`src/pages/`** — HomePage, ProjectsPage, CreateProjectPage, AIAssistantPage, WebScraperPage, VoiceAssistantPage, LoginPage, AdminSettingsPage
- **`src/services/api.js`** — client Axios avec intercepteur JWT
- **`src/components/`** — composants Radix UI

Stack frontend : React 18 + CRA/Craco, Radix UI, Tailwind CSS, Recharts, React Hook Form + Zod, Axios.

## Connexion Frontend ↔ Backend

- Le frontend appelle le backend via `REACT_APP_BACKEND_URL` (défaut : `http://localhost:5000`)
- Toutes les routes sauf `/login` nécessitent un JWT stocké dans `localStorage`
- Le token est injecté automatiquement dans chaque requête Axios

## Variables d'environnement

**`backend/.env`**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=darknexus
JWT_SECRET_KEY=<secret>
OPENAI_API_KEY=<clé>
CORS_ORIGINS=*
```

**`frontend/.env`**
```
REACT_APP_BACKEND_URL=http://localhost:5000
WDS_SOCKET_PORT=3000
ENABLE_HEALTH_CHECK=false
```

## Déploiement

- **`vercel.json`** — config Vercel (build : `npm install && npm run build`, output : `dist`)
- **`services/vercel_deployer.py`** — déploiement automatique via API Vercel depuis le backend
- **`services/auto_deploy.py`** — pipeline de déploiement continu
