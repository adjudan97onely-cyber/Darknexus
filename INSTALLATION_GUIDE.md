# 🚀 Guide Complet - Analyseur Intelligent Multi-Loteries & Paris Sportifs

## 📋 Prérequis Système

- **Python**: 3.8 ou supérieur
- **Node.js**: 16 ou supérieur
- **MongoDB**: 4.5 ou supérieur (local ou cloud)
- **Systèmes**: Windows, macOS, Linux

## 🔧 Installation Étape par Étape

### 1️⃣ Préparation MongoDB

#### Option A: MongoDB Local
```bash
# Windows
# Télécharger depuis https://www.mongodb.com/try/download/community
# Installer et faire tourner mongod

# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install -y mongodb
sudo systemctl start mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un cluster gratuit
3. Copier la URI de connexion
4. L'utiliser dans le fichier `.env` du backend

### 2️⃣ Configuration Backend

```bash
# Naviguer au dossier backend
cd analytics-lottery/backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cp .env.example .env

# Éditer .env avec vos configurations
# Exemple pour MongoDB local:
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=adj_killagain_db
# PORT=5001
```

### 3️⃣ Configuration Frontend

```bash
# Naviguer au dossier frontend
cd analytics-lottery/frontend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Vérifier que VITE_API_URL pointe vers le backend
# Par défaut: http://localhost:5001
```

## ▶️ Lancer l'Application

### Terminal 1: Démarrer MongoDB (si local)
```bash
mongod
```

### Terminal 2: Lancer le Backend
```bash
cd analytics-lottery/backend

# Activer l'environnement virtuel (si pas déjà actif)
source venv/bin/activate  # macOS/Linux
# ou
venv\Scripts\activate     # Windows

# Démarrer le serveur FastAPI
python main.py

# Vous devriez voir:
# ✅ Application démarrée avec succès
# 📊 Données de sample initialisées (ou détectées)
# Serveur actif sur http://localhost:5001
```

### Terminal 3: Lancer le Frontend
```bash
cd analytics-lottery/frontend

# Démarrer le serveur de développement Vite
npm run dev

# Vous devriez voir:
# VITE v... ready in XXX ms ⚡
# ➜  Local:   http://localhost:5173
```

## 🌐 Accéder à l'Application

Ouvrir votre navigateur à: **http://localhost:5173**

## 📊 Vérifier que tout fonctionne

### 1. Dashboard
- Devrait afficher les 3 loteries (Kéno, Euromillions, Loto)
- Afficher les stats globales des sports

### 2. Analyser Kéno
- Cliquer sur "Keno" dans la barre latérale
- Voir les fréquences, numéros chauds/froids
- Consulter les recommandations

### 3. Vérifier l'API
```bash
# Dans un terminal/PowerShell
curl http://localhost:5001/health

# Réponse attendue:
# {"status":"healthy","database":"connected"}
```

## 🐛 Dépannage

### Erreur: "Impossible de se connecter à MongoDB"
```python
# Vérifier que mongod tourne
# Vérifier MONGO_URL dans .env

# Si MongoDB n'est pas là, télécharger depuis:
# https://www.mongodb.com/try/download/community
```

### Erreur: "Port 5001 déjà utilisé"
```bash
# Changer le port dans backend/.env
PORT=5002

# Ou tuer le processus existant
# Windows:
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5001 | xargs kill -9
```

### Erreur: "Port 5173 déjà utilisé"
```bash
# Vite trouvera automatiquement un autre port
# Généralement 5174, 5175, etc.
```

### Erreur: "Module not found" (Python)
```bash
# S'assurer que l'environnement virtuel est actif
# Réinstaller les dépendances
pip install -r requirements.txt --upgrade
```

### Erreur: "Module not found" (Node.js)
```bash
# Réinstaller node_modules
rm -rf node_modules
npm cache clean --force
npm install
```

### API retourne 404
- Vérifier que le backend tourne sur le bon port
- Vérifier que VITE_API_URL dans frontend/.env est correct
- Vérifier la console navigateur (F12) pour les erreurs

## 📈 Utiliser l'Application

### Dashboard
- Vue d'ensemble de toutes les analyses
- Cartes récapitulatives avec stats clés
- Onglets pour chaque section

### Kéno
- **Analyse Détaillée**: Graphiques de distribution, top numéros
- **Recommandations**: Numéros recommandés avec scores
- **Grilles Générées**: Grilles complètes prêtes à jouer

### Euromillions
- Même structure que Kéno
- Focus sur les 5 numéros principaux
- Bonus tracké séparément

### Loto
- Analyse des 49 numéros
- Visualisation pair/impair et bas/haut
- Tests statistiques chi-square

### Football (Sports)
- Recommandations de matchs
- Prédictions avec probabilités
- Analyse de forme d'équipe

## 🔄 Workflow Typique

1. **Lancer l'app** → Voir le Dashboard
2. **Choisir une loterie** → Analyser les données
3. **Consulter les recommandations** → Voir les numéros conseillés
4. **Générer une grille** → Obtenir une grille complète
5. **Pour les sports** → Prédire les matchs prochains

## 💾 Données et Persistance

### Données de Sample
- Générées automatiquement au 1er démarrage
- Sauvegardées dans MongoDB
- 100+ tirages simulés par loterie
- 50+ matchs simulés

### Collections MongoDB
```
adj_killagain_db/
├── draws              # Tous les tirages de loterie
├── analysis           # Résultats d'analyse mis en cache
├── recommendations    # Recommandations générées
├── matches            # Données des matchs
└── predictions        # Prédictions sportives
```

## 🚀 Déploiement (Production)

### Backend (Heroku/Render/etc)
```bash
# Créer un Procfile
echo "web: gunicorn main:app" > Procfile

# Ajouter gunicorn à requirements.txt
pip freeze | grep -v venv > requirements.txt
echo "gunicorn" >> requirements.txt
```

### Frontend (Vercel/Netlify)
```bash
# Build
npm run build

# Output dans le dossier dist/
# Déployer ce dossier
```

## 📞 Support et Questions

- Consulter les logs (voir terminal où tourne l'app)
- Vérifier la console navigateur (F12)
- Vérifier que tous les services tournent

## 🎯 Prochaines Étapes

✅ **Phase 1 Complète:**
- ✓ Architecture complète
- ✓ Algorithmes d'analyse
- ✓ API fonctionnelle
- ✓ Interface grafique

🔜 **Phase 2 (Futur):**
- WebSockets pour temps réel
- Machine Learning
- Données réelles
- Persistance utilisateur

---

**Bon analyse! 🎰**
