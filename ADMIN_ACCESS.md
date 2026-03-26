# 🔐 ACCÈS ADMIN - Analytics Lottery

## 📍 URL d'accès

```
http://localhost:5173/admin
```

Ou en production:
```
https://analytics-lottery.vercel.app/admin
```

---

## 🔑 Identifiants Admin

### Par défaut:
```
Email: admin@analytics-lottery.com
Mot de passe: admin123
```

### À CHANGER EN PRODUCTION!

1. Dans ton `.env` du backend, modifie:
```
ADMIN_PASSWORD=votre-mot-de-passe-super-secure
SECRET_KEY=votre-cle-secrete-longue-et-aleatoire
```

2. Redéploie le backend (Render)

---

## ✨ FONCTIONNALITÉS ADMIN

### 📊 Dashboard Stats
- **Total Prédictions**: Nombre total généré
- **Prédictions Gagnantes**: Combien ont réussi
- **Taux de Précision**: Pourcentage de succès
- **Modèles Entraînés**: Nombre de modèles IA

### 🎯 Prédictions
- Voir les **20 dernières prédictions**
- Filtrer par type (Keno/Loto/EuroMillions/Sports)
- Voir le statut (gagnante/perdante/pending)

### 📈 Performance
- **Performance 7 jours**: Statistiques des derniers jours
- Total, Gagnantes, Perdantes, Accuracy

### 🗄️ Base de Données
- Compter les documents par collection
- Voir l'état de connexion
- Total documents globaux

### ⚙️ Outils

#### 📥 Exporter les données
```json
{
  "draws": [...],
  "predictions": [...],
  "models": [...]
}
```

#### 🔄 Réinitialiser les modèles
- Supprime tous les modèles IA
- ⚠️ **Action irréversible!**
- Recommencera l'apprentissage de 0

---

## 🔐 SÉCURITÉ

### Accès protégé par Token JWT

Tous les endpoints admin demandent:
```
Authorization: Bearer <token>
```

### Endpoints Admin disponibles

```bash
# Login
POST /api/admin/login
{
  "password": "admin123",
  "email": "admin@analytics-lottery.com"
}

# Récupérer les stats
GET /api/admin/stats
Authorization: Bearer <token>

# Lister les prédictions
GET /api/admin/predictions?limit=50&offset=0
Authorization: Bearer <token>

# Performance
GET /api/admin/performance?days=7
Authorization: Bearer <token>

# Info base de données
GET /api/admin/database-info
Authorization: Bearer <token>

# Exporter les données
POST /api/admin/export-data
Authorization: Bearer <token>

# Réinitialiser modèles
POST /api/admin/reset-models
Authorization: Bearer <token>
```

---

## 🚀 DÉPLOIEMENT

### Sur Render (Backend)

Dans **Environment Variables**, ajoute:

```
ADMIN_PASSWORD=ton-mot-de-passe-securise
SECRET_KEY=ta-cle-secrete-longue-aleatoire
FRONTEND_URL=https://analytics-lottery.vercel.app
```

### Sur Vercel (Frontend)

Les variables de frontend `.env.production` sont déjà configurées. L'app appelle automatiquement:
```
POST https://analytics-lottery-backend.onrender.com/api/admin/login
```

---

## ⚙️ CONFIGURATION AVANCÉE

### Changer le mot de passe admin

**Local:**
1. Modifie `.env` dans `backend/config/.env`
```
ADMIN_PASSWORD=nouveau-mot-de-passe
```
2. Redémarrer le backend

**Production:**
1. Va dans Render Dashboard
2. Settings → Environment Variables
3. Modifie `ADMIN_PASSWORD`
4. Render redéploie automatiquement

### Changer la clé secrète JWT

**Important**: LA CLEF SECRÈTE DOIT RESTER SECRÈTE!

```
SECRET_KEY=une-clef-super-longue-et-aleatoire-min-32-caracteres
```

Si tu la changes, **tous les tokens existants seront invalidés**.

---

## 🆘 DÉPANNAGE

### "Mot de passe incorrect"
- ✅ Vérifie que tu utilis le bon mot de passe
- ✅ Regarde dans `.env` ou Render Environment Variables
- ✅ Assure-toi que le backend a redémarré après changement

### "Token expiré"
- Les tokens expirent après **30 jours**
- Reconnecte-toi pour en obtenir un nouveau

### "401 Non authentifié"
- ✅ Le token n'est pas envoyé
- ✅ Format invalide: doit être `Bearer <token>`
- ✅ Réessaie la connexion

### "500 Erreur serveur"
- ✅ Vérifie les logs du backend (Render Dashboard → Logs)
- ✅ La base de données est peut-être déconnectée
- ✅ Redéploie le backend

---

## 🎯 TOP USECASES

### Cas 1: Vérifier les prédictions
```
1. Va à /admin
2. Connecte-toi
3. Onglet "Prédictions"
4. Voir les 20 dernières
```

### Cas 2: Analyser la performance
```
1. Va à /admin
2. Onglet "Stats"
3. Vois le taux de précision exactement
4. Onglet "Stats" → Performance 7j
```

### Cas 3: Réinitialiser l'IA
```
1. Va à /admin
2. Onglet "Outils"
3. Clique "Réinitialiser modèles"
4. ✅ L'IA recommencera à apprendre de 0
```

### Cas 4: Exporter toutes les données
```
1. Va à /admin
2. Onglet "Outils"
3. Clique "Exporter les données"
4. ✅ File JSON téléchargée automatiquement
```

---

## 📱 ACCÈS DEPUIS LE TÉLÉPHONE

Depuis l'admin frontend:

```
https://analytics-lottery.vercel.app/admin
```

Fonctionne sur mobile! ✅

---

**Questions?** Consulte les logs ou relance le backend! 🚀
