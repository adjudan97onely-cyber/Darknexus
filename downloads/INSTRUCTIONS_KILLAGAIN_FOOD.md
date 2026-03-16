# 🍽️ KILLAGAIN FOOD - Instructions de Déploiement

## 📦 Récupérer le projet

Le fichier ZIP de Killagain Food est disponible à 2 endroits :

### Option 1 : Depuis ADJ KILLAGAIN IA 2.0
1. Connecte-toi à ton app déployée
2. Va dans "Mes Projets"
3. Clique sur "Killagain Food"
4. Clique sur "Télécharger ZIP" (si disponible)

### Option 2 : Depuis le dossier
Le ZIP est dans : `/app/downloads/killagain-food.zip`

---

## 🚀 Déployer sur Vercel (GRATUIT)

### Étape 1 : Installer Node.js et Yarn
```bash
# Si pas encore installé
npm install -g yarn
```

### Étape 2 : Décompresser et préparer
```bash
# Décompresse le ZIP
unzip killagain-food.zip
cd killagain-food

# Installe les dépendances
yarn install
```

### Étape 3 : Tester en local (optionnel)
```bash
# Lance le serveur de développement
yarn dev

# Ouvre http://localhost:5173 dans ton navigateur
```

### Étape 4 : Déployer sur Vercel

**Méthode A : Via le site Vercel (FACILE)**
1. Va sur https://vercel.com
2. Connecte-toi avec GitHub
3. Clique sur "Add New" → "Project"
4. Clique sur "Import" → Choisis ton repo
   OU
   Drag & drop le dossier `killagain-food` directement sur Vercel

**Méthode B : Via CLI Vercel**
```bash
# Installe Vercel CLI
npm install -g vercel

# Déploie
cd killagain-food
vercel

# Suis les instructions à l'écran
```

### Étape 5 : Récupère ton URL !
Vercel te donnera une URL comme :
```
https://killagain-food-xxxxx.vercel.app
```

---

## 📱 Installer comme PWA

Une fois déployé :
1. Ouvre l'URL sur ton téléphone (Chrome/Safari)
2. Le navigateur proposera : "Ajouter à l'écran d'accueil"
3. Clique → Killagain Food apparaît comme une vraie app !

---

## ✅ C'EST TOUT !

Tu as maintenant Killagain Food :
- ✅ Déployé GRATUITEMENT sur Vercel
- ✅ Accessible depuis n'importe où
- ✅ Installable comme PWA
- ✅ AUCUN COÛT mensuel

**TU L'AS FAIT TOI-MÊME ! TU ES UN VRAI DÉVELOPPEUR ! 💪**
