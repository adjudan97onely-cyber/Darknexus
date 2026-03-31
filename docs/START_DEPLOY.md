# ✅ DÉPLOIEMENT EN 3 ÉTAPES - Analytics Lottery

## 🎯 Objectif
Avoir ton app accessible sur **Vercel** en production, 24/7, depuis n'importe où (même avec données mobiles).

---

## 📋 ÉTAPE 1: Preparer le code (fait ✅)

J'ai déjà:
- ✅ Créé `.env.production` avec l'URL du backend Render
- ✅ Mis à jour l'API service pour utiliser Render en production
- ✅ Configuré CORS du backend pour Vercel
- ✅ Créé `render.yaml` pour le déploiement automatique

---

## 🚀 ÉTAPE 2: Déployer sur GitHub

```bash
cd c:\Darknexus-main

# Commit les changements
git add -A
git commit -m "🚀 Deploy to Vercel + Render - Production config"

# Push vers GitHub
git push origin main
```

**Ou clique sur le script:**
```bash
c:\Darknexus-main\deploy_production.ps1
```

---

## 🌐 ÉTAPE 3: Configurer les services

### A) VERCEL (Frontend)

1. Va à **https://vercel.com/dashboard**
2. Clique **"Add New"** → **"Project"**
3. Sélectionne le repo **Darknexus** (depuis GitHub)
4. Configure:

```
Root Directory:   ./analytics-lottery/lottery/frontend
Build Command:    npm run build
Output Directory: dist
```

5. **Before Deploy**, va à "Environment Variables":

```
VITE_API_URL = https://analytics-lottery-backend.onrender.com
```

6. Clique **"Deploy"** ✅

**Attends 2 min...**

Tu auras: **https://analytics-lottery.vercel.app**

---

### B) RENDER (Backend)

1. Va à **https://dashboard.render.com**
2. Clique **"New +"** → **"Web Service"**
3. Sélectionne le repo **Darknexus** (depuis GitHub)
4. Configure:

```
Name:          analytics-lottery-backend
Environment:   Python 3.11
Root Directory: ./analytics-lottery/lottery/backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port 8080
```

5. Clique **"Deploy"** ✅

**Attends 2-3 min...**

Tu auras: **https://analytics-lottery-backend.onrender.com**

---

## 📱 TEST FINAL

### Depuis ton TÉLÉPHONE (sur 4/5G):

```
https://analytics-lottery.vercel.app
```

✅ **Ça devrait marcher!** 🎉

---

## ⏱️ TIMING

| Étape | Temps |
|-------|-------|
| Préparer code | ✅ Fait |
| Git push | 1-2 min |
| Vercel deploy | 2 min |
| Render deploy | 2-3 min |
| **TOTAL** | **~5-7 min** |

---

## 🆘 TROUBLESHOOTING

| Problème | Solution |
|----------|----------|
| **"Cannot reach"** | Attends 30s, Render startup est lent (free tier) |
| **CORS error** | Vérifie que la variable env `VITE_API_URL` est setée |
| **Frontend erreur** | Ouvre F12, onglet "Network", vérife les appels API |
| **Backend erreur** | Va dans Render Dashboard → Logs, cherche l'erreur |

---

## 📊 MONITORING

### Vercel:
- Dashboard: https://vercel.com/dashboard
- Logs: Deployments → Production → View Logs

### Render:
- Dashboard: https://dashboard.render.com
- Logs: Sélectionne ton service → Logs

---

## 🎯 CHECKLIST FINAL

- [ ] Code pushé sur GitHub
- [ ] Frontend déployé sur Vercel
- [ ] Backend déployé sur Render
- [ ] Env var setée (Vercel)
- [ ] CORS configuré (Backend)
- [ ] Test depuis téléphone ✅
- [ ] Bookmark l'URL Vercel ⭐

---

## 🔄 MISES À JOUR FUTURES

Une fois déployé, chaque fois que tu fais un **push sur GitHub**:

1. Vercel re-déploie **automatiquement** (30 sec)
2. Render re-déploie **automatiquement** (2-3 min)

Pas besoin de reconfigurer! 🚀

---

## 💡 NOTES

- **Vercel** héberge le frontend (React/Vite) sur CDN global (super rapide)
- **Render** héberge l'API FastAPI (gratuit, mais ralentit après 15min inactivité)
- **Fonction** combine les deux en temps réel via CORS

---

**Besoin d'aide?** Voir les loges (F12 sur navigateur ou Dashboard) ou demande-moi!

**Prêt? C'est parti! 🚀**
