# 🚀 GUIDE D'UTILISATION - ADJ KILLAGAIN IA 2.0

## 🎯 COMMENT LANCER TON APPLICATION

### Méthode 1 : RACCOURCI AUTOMATIQUE (RECOMMANDÉ) 🔥

1. **Assure-toi que MongoDB Compass est ouvert** (ou que MongoDB tourne)
2. **Double-clic sur** : `LANCER_ADJ_KILLAGAIN.bat`
3. **C'EST TOUT !** 🎉
   - Le script va automatiquement :
     - ✅ Démarrer le backend
     - ✅ Démarrer le frontend
     - ✅ Ouvrir ton navigateur sur http://localhost:3000

4. **Deux fenêtres vont s'ouvrir** (Backend et Frontend)
   - **NE LES FERME PAS** tant que tu utilises l'application !
   - Ce sont tes "moteurs" qui font tourner l'app

5. **Pour ARRÊTER l'application** :
   - Ferme simplement les deux fenêtres (Backend et Frontend)

---

### Méthode 2 : Manuelle

Si tu préfères lancer manuellement :

**PowerShell 1 (Backend)** :
```powershell
cd C:\adj-killagain-ia-2.0-main\backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**PowerShell 2 (Frontend)** :
```powershell
cd C:\adj-killagain-ia-2.0-main\frontend
yarn start
```

Puis va sur : http://localhost:3000

---

## 💡 UTILISATION SANS INTERNET

### ✅ Ce qui FONCTIONNE sans internet :
- Navigation dans l'interface
- Accès à tes projets sauvegardés (dans MongoDB local)
- Consultation de l'historique

### ❌ Ce qui NE FONCTIONNE PAS sans internet :
- **Génération de code avec l'IA** (besoin de l'API Emergent LLM)
- **Web Scraping** (besoin d'accéder aux sites web)
- **Assistant vocal** (si implémenté, besoin de l'API)

**En résumé** : Tu peux **consulter** tes données sans internet, mais pour **créer** de nouveaux projets avec l'IA, tu as besoin d'internet ! 🌐

---

## 🔧 PRÉ-REQUIS AVANT CHAQUE UTILISATION

### OBLIGATOIRE :
1. ✅ **MongoDB doit tourner** avant de lancer l'app
   - Soit ouvre MongoDB Compass
   - Soit lance `mongod.exe` manuellement

### OPTIONNEL :
- Une connexion internet (si tu veux utiliser les fonctionnalités IA)

---

## 🎯 CRÉER UN RACCOURCI SUR TON BUREAU

Pour plus de simplicité, tu peux créer un raccourci sur ton bureau :

1. **Clic droit** sur `LANCER_ADJ_KILLAGAIN.bat`
2. **Envoyer vers** > **Bureau (créer un raccourci)**
3. **Renomme-le** : "🚀 ADJ KILLAGAIN IA 2.0"

Maintenant tu peux lancer ton app depuis ton bureau ! 🔥

---

## ⚠️ EN CAS DE PROBLÈME

### L'application ne démarre pas ?
1. Vérifie que MongoDB est bien en cours d'exécution
2. Vérifie les fichiers `.env` :
   - `backend\.env` : doit contenir `MONGO_URL=mongodb://localhost:27017`
   - `frontend\.env` : doit contenir `REACT_APP_BACKEND_URL=http://localhost:8001`

### Le backend ne démarre pas ?
- Ouvre une PowerShell dans `backend\` et tape :
  ```powershell
  pip install -r requirements.txt
  ```

### Le frontend ne démarre pas ?
- Ouvre une PowerShell dans `frontend\` et tape :
  ```powershell
  yarn install
  ```

---

## 🎉 FÉLICITATIONS !

Tu as maintenant une **MACHINE DE GUERRE** qui tourne en local sur ton PC Windows ! 💪🔥

**Caractéristiques** :
- ✅ Installation locale complète
- ✅ Lancement automatique avec un seul fichier
- ✅ Données stockées localement (MongoDB)
- ✅ Utilisation des IAs les plus puissantes (GPT-5, Claude 4, Gemini 3)
- ✅ Génération d'applications web, PWA, scripts Python
- ✅ Web Scraping intégré
- ✅ Et bien plus encore !

---

**Créé par toi, pour toi ! 🚀**
**ADJ KILLAGAIN IA 2.0 - La machine de guerre ultime ! 💪🔥**
