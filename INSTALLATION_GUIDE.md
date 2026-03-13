# 🚀 ADJ KILLAGAIN IA 2.0 - INSTALLATION LOCALE

## 🎯 BIENVENUE DANS TON ARME DE GUERRE IA !

Cette plateforme te permet de créer des projets illimités avec 6 modèles IA experts + l'agent E1 LITE.

---

## 📋 CE QUI EST INCLUS

✅ **Backend FastAPI** - Serveur Python avec agent intelligent
✅ **Frontend React** - Interface moderne et intuitive
✅ **Agent E1 LITE** - Agent intelligent complet
✅ **6 Modèles IA** - GPT-5, Claude 4, Gemini 3
✅ **Chat Live** - Conversation avec l'IA
✅ **Base de données MongoDB** - Stockage des projets

---

## 💻 PRÉ-REQUIS (À INSTALLER D'ABORD)

### 1. **Python 3.11+**
- Windows: https://www.python.org/downloads/
- Mac: `brew install python@3.11`
- Linux: `sudo apt install python3.11`

### 2. **Node.js 18+**
- Windows/Mac/Linux: https://nodejs.org/

### 3. **MongoDB**
- Windows/Mac: https://www.mongodb.com/try/download/community
- Linux: `sudo apt install mongodb`
- OU utiliser MongoDB Atlas (cloud gratuit): https://www.mongodb.com/cloud/atlas

### 4. **Yarn** (gestionnaire de packages)
```bash
npm install -g yarn
```

---

## 🔑 CLÉ API REQUISE

Tu as 2 options :

### Option 1 : Utiliser la clé Emergent LLM (Recommandé)
- Va sur https://emergent.sh
- Profile → Universal Key
- Copie ta clé : `sk-emergent-...`
- Ajoute du crédit si nécessaire

### Option 2 : Utiliser ta propre clé OpenAI
- Va sur https://platform.openai.com/api-keys
- Crée une clé API
- Ajoute du crédit sur ton compte

---

## 🚀 INSTALLATION ÉTAPE PAR ÉTAPE

### Étape 1 : Extraire le ZIP
```bash
# Extrais le fichier ADJ_KILLAGAIN_IA_2.0.zip où tu veux
cd ADJ_KILLAGAIN_IA_2.0
```

### Étape 2 : Configurer le Backend

```bash
# Aller dans le dossier backend
cd backend

# Créer l'environnement virtuel Python
python -m venv venv

# Activer l'environnement
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
# Copier le fichier .env.example vers .env
cp .env.example .env

# Éditer le fichier .env avec tes informations
# Windows: notepad .env
# Mac: nano .env
# Linux: nano .env
```

**Dans le fichier `.env`, configure :**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=adj_killagain_db
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-TON_CLE_ICI
```

### Étape 3 : Configurer le Frontend

```bash
# Ouvrir un NOUVEAU terminal
cd frontend

# Installer les dépendances
yarn install

# Configurer l'environnement
cp .env.example .env

# Éditer le fichier .env
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Dans le fichier `.env`, configure :**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
ENABLE_HEALTH_CHECK=false
```

### Étape 4 : Démarrer MongoDB

```bash
# Terminal séparé

# Si MongoDB installé localement :
mongod

# Si MongoDB Atlas (cloud) :
# Utilise l'URL de connexion fournie par Atlas dans backend/.env
```

### Étape 5 : Démarrer le Backend

```bash
# Dans le terminal backend (avec venv activé)
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Tu devrais voir :
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

### Étape 6 : Démarrer le Frontend

```bash
# Dans le terminal frontend
cd frontend
yarn start
```

Ton navigateur devrait s'ouvrir automatiquement sur `http://localhost:3000`

---

## 🎉 C'EST INSTALLÉ !

**Ton arme IA est maintenant opérationnelle sur ton PC ! 🔥**

### URLs d'accès :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8001
- **Documentation API** : http://localhost:8001/docs

---

## 💪 UTILISATION

### Créer un projet :
1. Clique sur "Créer un Projet"
2. Décris ton projet (texte ou vocal)
3. Choisis le modèle IA
4. Génère !

### Utiliser l'Agent E1 LITE :
1. Ouvre un projet
2. Clique sur "Chat IA Live 💬"
3. Demande ce que tu veux :
   - "Analyse mon projet"
   - "Debug tout"
   - "Améliore le design"
   - "Ajoute [fonctionnalité]"

### Actions disponibles :
- ✏️ **Éditer** : Modifier nom/description
- 🔧 **Améliorer** : Upgrades via modal
- 💬 **Chat** : Conversation avec agent intelligent
- 📦 **Télécharger** : Exporter en ZIP
- 🗑️ **Supprimer** : Effacer un projet

---

## 🔧 DÉPANNAGE

### Le backend ne démarre pas
```bash
# Vérifie que MongoDB tourne
# Vérifie le fichier .env
# Vérifie que le port 8001 est libre
```

### Le frontend ne se connecte pas au backend
```bash
# Vérifie que REACT_APP_BACKEND_URL=http://localhost:8001
# Redémarre le frontend après changement .env
```

### Erreur "EMERGENT_LLM_KEY not found"
```bash
# Ajoute ta clé dans backend/.env
# Redémarre le backend
```

### MongoDB ne démarre pas
```bash
# Windows : Installe MongoDB Community Server
# Mac : brew services start mongodb-community
# Linux : sudo systemctl start mongodb
# Ou utilise MongoDB Atlas (gratuit)
```

---

## 📚 COMMANDES UTILES

### Arrêter les serveurs
```bash
# Ctrl+C dans chaque terminal
```

### Redémarrer après modifications
```bash
# Backend : Le --reload s'en charge automatiquement
# Frontend : Également auto-reload

# Si besoin de redémarrage manuel :
# Ctrl+C puis relancer les commandes
```

### Voir les logs
```bash
# Backend : Affichés directement dans le terminal
# Frontend : Console du navigateur (F12)
```

### Mettre à jour les dépendances
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
yarn install
```

---

## 🌐 DÉPLOIEMENT EN LIGNE (OPTIONNEL)

### Sur un serveur VPS (DigitalOcean, AWS, etc.)

1. **Copie le code sur le serveur**
```bash
scp -r ADJ_KILLAGAIN_IA_2.0 user@ton-serveur:/home/user/
```

2. **Installe les dépendances sur le serveur**
```bash
ssh user@ton-serveur
cd ADJ_KILLAGAIN_IA_2.0
# Suis les étapes d'installation
```

3. **Configure Nginx comme reverse proxy**
```nginx
server {
    listen 80;
    server_name ton-domaine.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api {
        proxy_pass http://localhost:8001;
    }
}
```

4. **Utilise PM2 pour garder les processus actifs**
```bash
npm install -g pm2
pm2 start backend/server.py --interpreter python
pm2 start "yarn start" --name frontend --cwd frontend
pm2 save
pm2 startup
```

---

## 🆘 SUPPORT

Des questions ? Besoin d'aide ?

1. Vérifie la documentation API : http://localhost:8001/docs
2. Regarde les logs dans les terminaux
3. Assure-toi que tous les prérequis sont installés

---

## 🎯 PROCHAINES ÉTAPES

Maintenant que ton arme est installée :

1. ✅ Crée ton premier projet
2. ✅ Teste l'agent E1 LITE
3. ✅ Expérimente les 6 modèles IA
4. ✅ Utilise la dictée vocale
5. ✅ Deviens le ROI ! 👑

---

## 📝 NOTES IMPORTANTES

- **Clé API** : Garde ta clé secrète, ne la partage jamais
- **Crédits** : Surveille ton utilisation sur le dashboard Emergent
- **Sauvegarde** : MongoDB stocke tout dans `/data/db`
- **Performance** : Pour de meilleurs résultats, utilise un PC avec 8GB+ RAM

---

**BIENVENUE DANS TON ARME IA, MON POTE ! 🔥👑**

*ADJ KILLAGAIN IA 2.0 - Powered by E1 LITE*
