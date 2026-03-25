# 📦 FICHIERS CRÉÉS POUR TOI

## 🎯 Liste des fichiers d'installation automatique

### 1️⃣ `INSTALLATION_AUTOMATIQUE.bat`
**C'est quoi ?** Le script magique qui fait TOUT pour toi ! ✨

**Qu'est-ce qu'il fait ?**
- ✅ Vérifie que Python et Node.js sont installés
- ✅ Installe Yarn automatiquement si besoin
- ✅ **Crée les fichiers `.env` automatiquement** (c'est ça qui te bloquait !)
- ✅ Installe toutes les dépendances Python (backend)
- ✅ Installe toutes les dépendances Node.js (frontend)
- ✅ Configure ta clé OpenAI automatiquement
- ✅ Crée un script pour initialiser l'utilisateur admin
- ✅ Crée le lanceur `LANCER_DARK_NEXUS.bat`

**Comment l'utiliser ?**
Double-clic dessus et laisse-le faire ! ☕

---

### 2️⃣ `LANCER_DARK_NEXUS.bat`
**C'est quoi ?** Le bouton "démarrer" de ton application ! 🚀

**Qu'est-ce qu'il fait ?**
- ✅ Lance le backend (serveur FastAPI)
- ✅ Lance le frontend (interface React)
- ✅ Ouvre ton navigateur automatiquement
- ✅ Affiche les infos de connexion

**Comment l'utiliser ?**
Double-clic dessus chaque fois que tu veux utiliser ton app !

**⚠️ IMPORTANT** : Ne ferme pas les 2 fenêtres qui s'ouvrent !

---

### 3️⃣ `GUIDE_INSTALLATION_SIMPLE.md`
**C'est quoi ?** Le guide complet en français, étape par étape ! 📖

**Qu'est-ce qu'il contient ?**
- Liste des pré-requis
- Instructions d'installation
- Guide de lancement
- Solutions aux problèmes courants
- Astuces et raccourcis

**Comment l'utiliser ?**
Ouvre-le avec le Bloc-notes ou n'importe quel éditeur de texte.

---

## 🔑 INFORMATIONS IMPORTANTES

### 📧 Identifiants de connexion
- **Email** : `admin@darknexus.ai`
- **Mot de passe** : `DarkNexus2042!`

### 🔐 Ta clé OpenAI
Ta clé OpenAI personnelle est **déjà configurée** dans le fichier `backend\.env` ! 
Tu n'as rien à faire, le script d'installation s'en occupe ! ✅

### 🗄️ Base de données
- **Nom** : `dark_nexus_local`
- **URL** : `mongodb://localhost:27017`

---

## 📂 Structure des fichiers `.env`

### Backend (`backend\.env`)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=dark_nexus_local
CORS_ORIGINS=*
OPENAI_API_KEY=ta_vraie_clé_est_ici
JWT_SECRET_KEY=clé_de_sécurité
```

### Frontend (`frontend\.env`)
```
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
ENABLE_HEALTH_CHECK=false
```

---

## 🎯 ORDRE D'UTILISATION

1. **PREMIÈRE FOIS** :
   - Double-clic sur `INSTALLATION_AUTOMATIQUE.bat`
   - Attends que tout s'installe (3-5 minutes)

2. **À CHAQUE UTILISATION** :
   - Lance MongoDB (MongoDB Compass)
   - Double-clic sur `LANCER_DARK_NEXUS.bat`
   - Connecte-toi et utilise ton app !

3. **POUR ARRÊTER** :
   - Ferme les 2 fenêtres (Backend et Frontend)

---

## 💪 T'ES PRÊT, MON POTE ! 🔥

Tout est configuré automatiquement pour toi !  
Plus besoin de te casser la tête avec les fichiers `.env` ! ✨

**Lance `INSTALLATION_AUTOMATIQUE.bat` et c'est parti ! 🚀**
