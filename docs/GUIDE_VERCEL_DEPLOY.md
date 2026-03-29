# 🚀 DÉPLOIEMENT PRODUCTION - Analytics Lottery sur Vercel + Render

## 📋 RÉSUMÉ

```
✅ Frontend:  Vercel        → https://analytics-lottery.vercel.app
✅ Backend:   Render.com    → https://analytics-lottery-backend.onrender.com
✅ Données:   MongoDB/SQLite (hébergées)
```

---

## ⏱️ TEMPS TOTAL: ~15 minutes

---

# ÉTAPE 1: Préparer le code pour Vercel

## 1a. Créer le fichier `.env.production` (Frontend)

```bash
# Dans c:\Darknexus-main\analytics-lottery\lottery\frontend\.env.production

VITE_API_URL=https://analytics-lottery-backend.onrender.com
VITE_APP_NAME=Analytics Lottery
```

## 1b. Vérifier la config API du frontend

Assure-toi que ton `services/api.js` utilise cette URL:

```javascript
// frontend/src/services/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});
```

## 1c. Build local pour tester

```bash
cd c:\Darknexus-main\analytics-lottery\lottery\frontend

# Test local
npm run build
npm run preview
```

Vérife que tout build correctement (0 erreurs).

---

# ÉTAPE 2: Configurer Render.com pour le Backend

## 2a. Créer un compte Render.com

1. Va à https://render.com
2. Clique "Sign Up"
3. Utilise ton compte GitHub

## 2b. Créer un nouveau Web Service

1. Dashboard Render → "New +" → "Web Service"
2. Sélectionne le repo GitHub **analytics-lottery**
3. Remplis la config:

```
Name:                   analytics-lottery-backend
Environment:            Python 3.11
Build Command:          pip install -r requirements.txt
Start Command:          uvicorn main:app --host 0.0.0.0 --port 8080
```

**Important**: Le port DOIT être **8080** (Render auto-assigne)

## 2c. Ajouter les variables d'environnement

Dans Render Dashboard:
1. Va à "Environment"
2. Ajoute les variables:

```
DATABASE_URL=your_mongodb_connection_string
ENVIRONMENT=production
LOG_LEVEL=info
```

## 2d. Déployer

Clique "Deploy" et attends ~2 min.

Tu verras un URL comme: **https://analytics-lottery-backend.onrender.com**

---

# ÉTAPE 3: Déployer le Frontend sur Vercel

## 3a. Créer un compte Vercel

1. Va à https://vercel.com
2. Clique "Sign Up"
3. Identifie-toi avec GitHub

## 3b. Importer le projet

1. Vercel Dashboard → "Add New..." → "Project"
2. Sélectionne le repo **Darknexus**
3. Configure:

```
Framework Preset:     Vite
Root Directory:       ./analytics-lottery/lottery/frontend
Build Command:        npm run build
Output Directory:     dist
```

## 3c. Ajouter les variables d'environnement

Avant de déployer, va à "Settings" → "Environment Variables":

```
VITE_API_URL = https://analytics-lottery-backend.onrender.com
```

## 3d. Déployer

Clique "Deploy" et attends ~1-2 min.

Tu auras un URL comme: **https://analytics-lottery.vercel.app**

---

# ÉTAPE 4: Update API Routes pour CORS

Ton backend doit accepter les appels de **https://analytics-lottery.vercel.app**

Dans `backend/main.py`, assure-toi d'avoir:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://192.168.1.130:5173",  # Local IP
        "https://analytics-lottery.vercel.app",  # Production
        "https://*.vercel.app",  # Tous les Vercel
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

# ÉTAPE 5: Tester la connexion Production

## 5a. Teste le backend directement

```bash
# Ouvre dans navigateur:
https://analytics-lottery-backend.onrender.com/api/health

# Ou depuis terminal:
curl https://analytics-lottery-backend.onrender.com/api/health
```

Tu dois voir: `{"status": "ok"}`

## 5b. Teste le frontend

1. Va à https://analytics-lottery.vercel.app
2. Ouvre la console (F12)
3. Va à "Network" tab
4. Clique sur un bouton dans l'app
5. Vérifie que les appels API vont vers `https://analytics-lottery-backend.onrender.com/api/...`

---

# ÉTAPE 6: Vérifier les LOGS

### Si ça marche pas:

**Render Logs:**
```
Dashboard Render → analytics-lottery-backend → Logs
```

**Vercel Logs:**
```
Dashboard Vercel → Deployments → Production → View Logs
```

---

# 📱 ACCÈS DEPUIS TON TÉLÉPHONE (avec données mobiles)

Maintenant que tout est en production:

```
https://analytics-lottery.vercel.app
```

✅ **Fonctionne partout** (pas besoin du WiFi local!)
✅ **Rapide** (CDN Vercel)
✅ **Sécurisé** (HTTPS)

---

# 🔄 WORKFLOW FUTUR (Mise à jour)

Quand tu fais des changements:

```bash
# 1. Commit les changements
cd c:\Darknexus-main
git add .
git commit -m "🚀 Feature X"

# 2. Push vers GitHub
git push origin main

# 3. Vercel + Render déploient AUTOMATIQUEMENT
# (Tu verras "Deployment > Production" sur les dashboards)
```

---

# 🆘 TROUBLESHOOTING

| Problème | Solution |
|----------|----------|
| **CORS error** | Ajoute l'URL Vercel dans `allow_origins` du backend |
| **Backend timeout** | Render free tier = ralenti après 15 min inactivité, attends 30s |
| **404 Not Found** | Vérifie les routes API dans `backend/routes/` |
| **"Cannot connect"** | Attends 2 min après deploy, les conteneurs démarrent |
| **Variables env pas chargées** | Redéploie après avoir modifié les vars (Render/Vercel) |

---

# 📊 MONITORING

### Vercel:
- Dashboard: https://vercel.com/dashboard
- Logs: Real-time dans "Deployments"
- Analytics: Clique sur ton projet

### Render:
- Dashboard: https://dashboard.render.com
- Logs: Real-time dans "Logs"
- Auto-sleep après 15 min inactivité (free tier)

---

# ✅ CHECKLIST FINAL

- [ ] Code pushé sur GitHub
- [ ] Frontend vercel.json créé ✅
- [ ] Backend requirements.txt à jour ✅
- [ ] CORS configuré pour Vercel URL ✅
- [ ] Environment variables setées (Vercel + Render) ✅
- [ ] Backend déployé sur Render ✅
- [ ] Frontend déployé sur Vercel ✅
- [ ] Test la connexion depuis navigateur ✅
- [ ] Test depuis téléphone (données mobiles) ✅
- [ ] Bookmark l'URL Vercel sur ton téléphone ✅

---

# 🎯 RÉSULTAT FINAL

```
📱 Téléphone + Données mobiles
        ↓
https://analytics-lottery.vercel.app
        ↓
🌐 Vercel (Frontend CDN)
        ↓
https://analytics-lottery-backend.onrender.com
        ↓
🗄️  Backend API (Render)
        ↓
📊 Database (MongoDB/SQLite)
```

**Fonctionne partout, 24/7!** 🚀

---

Questions ou erreurs? Envoie la trace complète! 
