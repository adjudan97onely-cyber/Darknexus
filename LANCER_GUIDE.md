## 🚀 DARKNEXUS - Nouvelle Structure de Lancement

### ⭐ Utilisation Rapide

**Pour lancer TOUS les services d'un coup:**

```powershell
cd C:\Darknexus-main
.\START_ALL_CLEAN.bat
```

C'est tout! 7 fenêtres cmd vont s'ouvrir, une pour chaque service.

---

### 📊 Services Disponibles

| # | Service | Backend | Frontend | Port Frontend | Status |
|----|---------|---------|----------|---------------|---------|
| 1️⃣ | Analytics Lottery | Python (5001) | Node (5173) | http://localhost:5173 | ✅ |
| 2️⃣ | Warzone | Python (5002) | Node (5174) | http://localhost:5174 | ✅ |
| 3️⃣ | Darknexus Platform | Python (5000) | Node (3000) | http://localhost:3000 | ✅ |
| 4️⃣ | KillaGain Food | - | Node (5180) | http://localhost:5180 | ✅ **Fonctionne** |

---

### 🛠️ Lancer UN SERVICE SEUL

**Analytics Lottery Backend:**
```powershell
cd C:\Darknexus-main\apps\analytics-lottery\backend
python main.py
```

**Analytics Lottery Frontend:**
```powershell
cd C:\Darknexus-main\apps\analytics-lottery\frontend
npm run dev
```

**Warzone Backend:**
```powershell
cd C:\Darknexus-main\apps\warzone\backend
python main.py
```

**KillaGain Food:**
```powershell
cd C:\Darknexus-main\killagain-food
npm run dev
```

---

### 📝 Avant de Lancer

**1. Générer les fichiers `.env`:**
```powershell
cd C:\Darknexus-main
.\SETUP_ENV_AUTO.bat
```

**2. Installer les dépendances (première fois seulement):**
```powershell
# Chaque backend
cd apps\analytics-lottery\backend && pip install -r requirements.txt
cd apps\warzone\backend && pip install -r requirements.txt
cd apps\darknexus\backend && pip install -r requirements.txt

# Chaque frontend
cd apps\analytics-lottery\frontend && npm install
cd apps\warzone\frontend && npm install
cd apps\darknexus\frontend && npm install
cd killagain-food && npm install
```

**3. S'assurer que MongoDB tourne:**
```powershell
# Vérifier que MongoDB écoute
netstat -ano | findstr :27017
```

---

### 🎯 Accès aux Applications

Après avoir lancé `START_ALL_CLEAN.bat`, accède à:

- **Analytics Lottery Frontend**: http://localhost:5173
- **Analytics Lottery API**: http://localhost:5001/docs
- **Warzone Frontend**: http://localhost:5174
- **Warzone API**: http://localhost:5002/docs
- **Darknexus Frontend**: http://localhost:3000
- **Darknexus API**: http://localhost:5000/docs
- **KillaGain Food**: http://localhost:5180

---

### ⚠️ Dépannage

**Un service ne démarre pas?**
1. Regarde le message dans la fenêtre cmd correspondante
2. Vérifie que les dépendances sont installées (`pip install -r requirements.txt` ou `npm install`)
3. Vérifie que le port est libre: `netstat -ano | findstr :XXXX` (remplace XXXX par le numéro du port)
4. Même au besoin, lance le service individuellement pour voir l'erreur complète

**MongoDB ne tourne pas?**
```powershell
# Si tu utilises MongoDB local
# S'assurer qu'il tourne sur port 27017
mongod --dbpath C:\data\db
```

**Les ports sont occupés?**
```powershell
# Trouver et tuer le processus qui occupe un port
Get-NetTCPConnection -LocalPort 5173 | Select-Object @{N='PID';E={$_.OwningProcess}}
Get-Process -Id <PID> | Stop-Process -Force
```

---

### 📋 Anciennes Commandes (Archivées)

Les anciens fichiers `.bat` sont maintenant archivés dans `scripts/old/`:
- `LANCER_ANALYTICS.bat`
- `LANCER_WARZONE.bat`
- `LANCER_WARZONE_DEV.bat`
- `LANCER_ZEN_HUB_PRO_WARZONE.bat`
- etc.

**Ne plus les utiliser**, préfère `START_ALL_CLEAN.bat` qui est plus robuste et à jour.

---

### 🎨 Structure Propre

```
C:\Darknexus-main\
├── START_ALL_CLEAN.bat            ← **UTILISE CELUI-CI**
├── SETUP_ENV_AUTO.bat             ← Configure les .env
├── RESTRUCTURATION_ANALYSIS.md    ← Documentation complète
├── README.md                       ← Ce fichier
├── apps/
│   ├── analytics-lottery/         ✅ Testé
│   ├── warzone/                   ✅ Testé
│   └── darknexus/                 ✅ Testé
├── killagain-food/                ✅ **Fonctionnant**
├── projects/
│   ├── warzone-DEV/               ← Ta version DEV
│   └── warzone/                   ← Version Stable
└── scripts/old/                   ← Anciens fichiers (référence)
```

---

### 💡 Tips

- Les fenêtres cmd qui s'ouvrent affichent les logs en direct
- Les ports sont configurés dans les `package.json` et `.env`
- Les backends FastAPI exposent des docs Swagger sur `/docs`
- KillaGain Food marche actuellement ✅ (utilise-le comme référence)

---

### 📖 Pour Plus d'Info

Voir: `RESTRUCTURATION_ANALYSIS.md` pour l'analyse complète

**Créé le**: 1 avril 2026
