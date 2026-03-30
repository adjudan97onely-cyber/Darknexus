# 🚀 ADJ KILLAGAIN IA 2.0 - Installation Locale Windows

## 📋 Guide d'Installation Rapide

### ✅ Prérequis
- Windows 10/11
- Connexion Internet
- 2 GB d'espace disque

---

## 🎯 MÉTHODE 1 : Installation Automatique (RECOMMANDÉ)

### **Étape 1 : Télécharge le Script**
Sauvegarde le fichier `INSTALL_WINDOWS.ps1` sur ton PC

### **Étape 2 : Exécute le Script**
1. **Clic droit** sur `INSTALL_WINDOWS.ps1`
2. Sélectionne **"Exécuter avec PowerShell"**
3. Si Windows bloque, fais :
   - Clic droit > **Propriétés**
   - Coche **"Débloquer"**
   - Clique **OK**
   - Réessaie

### **Étape 3 : Laisse le Script Faire le Travail**
Le script va automatiquement :
- ✅ Installer Python 3.11
- ✅ Installer Node.js 20
- ✅ Installer Yarn
- ✅ Configurer MongoDB
- ✅ Installer toutes les dépendances
- ✅ Créer les fichiers de configuration
- ✅ Créer les scripts de lancement

⏱️ **Temps : 10-15 minutes**

### **Étape 4 : Lance l'Application**
1. Va dans `C:\ADJ_KILLAGAIN_IA`
2. **Double-clic** sur `START.bat`
3. Attends que les 2 fenêtres s'ouvrent (Backend + Frontend)
4. Ouvre ton navigateur sur **http://localhost:3000**

🎉 **C'EST PRÊT !**

---

## 🛠️ MÉTHODE 2 : Installation Manuelle

Si le script automatique ne fonctionne pas, suis ces étapes :

### **1. Installer Python**
1. Va sur https://www.python.org/downloads/
2. Télécharge **Python 3.11**
3. **IMPORTANT** : Coche **"Add Python to PATH"** pendant l'installation
4. Installe avec les options par défaut

**Test :**
```cmd
python --version
```
Tu dois voir : `Python 3.11.x`

### **2. Installer Node.js**
1. Va sur https://nodejs.org/
2. Télécharge la version **LTS** (20.x)
3. Installe avec les options par défaut

**Test :**
```cmd
node --version
npm --version
```

**Installer Yarn :**
```cmd
npm install -g yarn
```

### **3. Installer MongoDB**

**Option A : MongoDB Local (Recommandé pour débutants)**
1. Va sur https://www.mongodb.com/try/download/community
2. Télécharge **MongoDB Community Server**
3. Installe avec les options par défaut
4. Coche **"Install MongoDB as a Service"**

**Démarre MongoDB :**
```cmd
net start MongoDB
```

**Option B : MongoDB Atlas (Cloud Gratuit)**
1. Crée un compte sur https://www.mongodb.com/cloud/atlas
2. Crée un cluster gratuit (M0)
3. Crée un utilisateur de base de données
4. Récupère l'URL de connexion : `mongodb+srv://...`

### **4. Télécharger le Code**

**Option A : Avec Git**
```cmd
cd C:\
git clone [URL_DU_REPO] ADJ_KILLAGAIN_IA
cd ADJ_KILLAGAIN_IA
```

**Option B : Sans Git**
1. Télécharge le ZIP du code
2. Extrais dans `C:\ADJ_KILLAGAIN_IA`

### **5. Configuration Backend**

```cmd
cd C:\ADJ_KILLAGAIN_IA\backend
```

**Créer `.env` :**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=adj_killagain_ia
EMERGENT_LLM_KEY=votre-clé-api-ici
```

**Installer les dépendances :**
```cmd
pip install -r requirements.txt
```

### **6. Configuration Frontend**

```cmd
cd C:\ADJ_KILLAGAIN_IA\frontend
```

**Créer `.env` :**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
```

**Installer les dépendances :**
```cmd
yarn install
```

### **7. Lancer l'Application**

**Terminal 1 - Backend :**
```cmd
cd C:\ADJ_KILLAGAIN_IA\backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend :**
```cmd
cd C:\ADJ_KILLAGAIN_IA\frontend
yarn start
```

**Ouvre ton navigateur :**
http://localhost:3000

🎉 **C'EST PRÊT !**

---

## ❌ DÉPANNAGE : Erreurs Courantes

### **1. "Python n'est pas reconnu"**
**Problème :** Python pas dans le PATH

**Solution :**
1. Cherche où Python est installé : `C:\Users\[TON_NOM]\AppData\Local\Programs\Python\Python311`
2. Ajoute au PATH :
   - Clic droit sur **Ce PC** > **Propriétés**
   - **Paramètres système avancés**
   - **Variables d'environnement**
   - Dans **Path**, ajoute le chemin Python
   - **OK** et redémarre CMD

### **2. "node n'est pas reconnu"**
**Solution :** Même chose que Python, ajoute Node au PATH

### **3. "Cannot connect to MongoDB"**
**Solutions :**
- Vérifie que MongoDB est lancé : `net start MongoDB`
- Vérifie l'URL dans `backend/.env`
- Si MongoDB Atlas, vérifie que ton IP est autorisée

### **4. "Port 3000 already in use"**
**Solution :** Un autre programme utilise le port 3000
```cmd
netstat -ano | findstr :3000
taskkill /PID [NUMERO_PID] /F
```

### **5. "Port 8001 already in use"**
**Solution :** Même chose pour le port 8001

### **6. "yarn : command not found"**
**Solution :**
```cmd
npm install -g yarn
```
Redémarre CMD

### **7. "Module not found" (Python)**
**Solution :**
```cmd
cd backend
pip install -r requirements.txt --force-reinstall
```

### **8. "Module not found" (Node)**
**Solution :**
```cmd
cd frontend
rm -rf node_modules
yarn install
```

### **9. "CORS Error" dans le navigateur**
**Solution :** Vérifie que `REACT_APP_BACKEND_URL` dans `frontend/.env` est correct : `http://localhost:8001`

### **10. Page blanche / Erreur 404**
**Solutions :**
- Vérifie que le backend tourne (http://localhost:8001/docs)
- Vérifie que le frontend tourne (http://localhost:3000)
- Vide le cache du navigateur (Ctrl+Shift+Delete)

---

## 🔑 IMPORTANT : Clés API

### **Emergent LLM Key**
Pour utiliser les fonctionnalités IA, tu dois avoir une clé API.

**Où la mettre :**
`backend/.env` → `EMERGENT_LLM_KEY=ta-clé-ici`

**Si tu n'as pas de clé :**
- L'app fonctionnera mais sans génération de code IA
- Tu peux utiliser les autres fonctionnalités (scraping, PWA, etc.)

---

## 📝 COMMANDES UTILES

### **Arrêter les serveurs**
Appuie sur **Ctrl+C** dans chaque terminal

### **Redémarrer**
1. Arrête les serveurs (Ctrl+C)
2. Relance `START.bat` ou les commandes manuellement

### **Vider la base de données**
```cmd
mongo
use adj_killagain_ia
db.dropDatabase()
```

### **Voir les logs Backend**
Les logs s'affichent dans le terminal backend

### **Voir les logs Frontend**
Les logs s'affichent dans le terminal frontend et la console du navigateur (F12)

---

## 🚀 APRÈS L'INSTALLATION

### **Créer un compte**
1. Va sur http://localhost:3000
2. Clique sur **S'inscrire**
3. Entre ton email et mot de passe
4. Connecte-toi !

### **Créer ton premier projet**
1. Clique sur **"Créer un Projet"**
2. Remplis le formulaire
3. Clique sur **"Générer le Code"**
4. Attends la génération (30-60s)
5. Télécharge ton code !

### **Créer ton premier Agent IA**
1. Clique sur **"Créer un Projet"**
2. Sélectionne **"🤖 Agent IA Autonome"**
3. Décris ce que tu veux que l'agent fasse
4. Génère !
5. Télécharge et lance sur ton PC !

---

## 💡 CONSEILS

- **Garde les terminaux ouverts** pendant que tu utilises l'app
- **Ne ferme pas les fenêtres CMD** sinon l'app s'arrête
- **Sauvegarde tes projets** régulièrement
- **Backup tes .env** pour ne pas perdre tes configs

---

## 🆘 BESOIN D'AIDE ?

Si rien ne fonctionne :
1. Vérifie que Python, Node et MongoDB sont installés
2. Vérifie les fichiers `.env`
3. Lance backend et frontend séparément pour voir les erreurs
4. Regarde les logs dans les terminaux

---

## 🎉 FÉLICITATIONS !

Tu as installé **ADJ KILLAGAIN IA 2.0** en local !

Tu peux maintenant :
- ✅ Créer des applications web/mobile
- ✅ Générer des PWA installables
- ✅ Scraper des sites web
- ✅ **Créer des agents IA autonomes**
- ✅ Et bien plus !

**PROFITE DE TON APP ! 💪🚀**
