# 🏗️ Darknexus - Structure Organisée (v2)

## 📍 Hiérarchie des Dossiers

```
Darknexus-main/
├── 🎮 projects/                     ← TOUS LES PROJETS ISOLÉS
│   ├── warzone/                     ← Jeu Warzone (Scripts V7/V8)
│   │   ├── LANCER_WARZONE.bat      ← Lance le jeu
│   │   ├── LANCER_ZEN_HUB_PRO_WARZONE.bat
│   │   ├── interface.ps1 / warzone.ps1
│   │   └── ...                      (autres fichiers du projet)
│   ├── killagain-food/             ← App Premium Food (React/Vite)
│   │   ├── LANCER_KILLAGAIN_FOOD.bat ← Lance le dev server
│   │   └── ...
│   ├── analytics-lottery/          ← Système Lottery 
│   │   └── ...
│   ├── chef-ia/                    ← Chef IA Assistant
│   │   └── ...
│   └── [autres projets]            ← Ajouter ici
│
├── 📚 docs/                         ← TOUTE LA DOCUMENTATION
│   ├── ADMIN_ACCESS.md
│   ├── API_INTEGRATION_COMPLETE.md
│   ├── DARKNEXUS_PROJECT_SPEC.md
│   ├── INSTALL_GUIDE.md
│   ├── README.md
│   └── ...
│
├── 🛠️ tools/                        ← SCRIPTS GLOBAUX DE LANCEMENT
│   ├── LANCER_WARZONE.bat          ← Pointe vers projects/warzone/
│   ├── LANCER_ZEN_HUB_PRO_WARZONE.bat
│   ├── LANCER_KILLAGAIN_FOOD.bat
│   ├── OUVRIR_WARZONE.bat          ← Alias
│   └── ...
│
├── ⚙️ config/                       ← CONFIGURATIONS GLOBALES
│   ├── vercel.json
│   ├── .gitignore (global)
│   └── ...
│
├── 🏭 infrastructure/              ← SERVICES PARTAGÉS (Si utilisés par plusieurs projets)
│   ├── api/                        ← Backend API global
│   ├── frontend/                   ← Frontend global
│   ├── backend/                    ← Backend services
│   ├── mobile-app/                 ← App mobile
│   └── ...
│
└── killagain-food/                 ← ⚠️ SUBMODULE GIT (reste en racine!)
    └── (Independent git repo - travail ici pour PREMIUM)

```

## 🚀 Comment Lancer les Projets

### Lancer Warzone
```bash
# Depuis la racine
.\LANCER_WARZONE.bat
ou
.\LANCER_ZEN_HUB_PRO_WARZONE.bat

# Ou directement depuis son folder
cd projects/warzone
.\LANCER_WARZONE.bat
```

### Lancer Killagain Food (PREMIUM)
```bash
# Depuis la racine
.\LANCER_KILLAGAIN_FOOD.bat

# Ou directement
cd projects/killagain-food
.\LANCER_KILLAGAIN_FOOD.bat
```

### Lancer Analytics-Lottery
```bash
cd projects/analytics-lottery
# (Ajouter launcher si nécessaire)
```

## ✨ Règles Importantes

### 1. Chaque Projet Est Autonome
- **Warzone** → Travaille DANS `projects/warzone/`
- **Killagain-Food** → Travaille en racine `killagain-food/` (submodule)
- **Analytics-Lottery** → Travaille DANS `projects/analytics-lottery/`
- Chacun a son `package.json`, son `.git`, etc.

### 2. Ne Pas Mélanger les Projets
```
❌ MAUVAIS:
projects/warzone/  +  killagain-food/  →  CONFUSION

✅ BON:
projects/warzone/              ← VER 8 scripts
projects/killagain-food/       ← Lien vers racine
killagain-food/                ← Vraie submodule
```

### 3. Commits Séparés par Projet
```bash
# Warzone change
cd projects/warzone
git add .
git commit -m "feat: rapid fire improved"
git push

# Killagain-Food change
cd killagain-food
git add .
git commit -m "fix: nutrition plan UI"
git push
```

### 4. Launchers à la Racine Pointent Vers projects/
- Les `.bat` à la racine = **redirections**
- Les vrais lanceurs = DANS chaque dossier `projects/{name}/`
- Cela permet: `.\LANCER_WARZONE.bat` depuis n'importe où dans Darknexus

## 📋 Fichiers Importants

| File | Purpose | Location |
|------|---------|----------|
| LANCER_WARZONE.bat | Lancer Warzone | `./` + `projects/warzone/` |
| LANCER_KILLAGAIN_FOOD.bat | Lancer Killagain | `./` + `projects/killagain-food/` |
| README.md | Cette doc | `docs/` |
| DARKNEXUS_PROJECT_SPEC.md | Specs du projet | `docs/` |
| INSTALL_GUIDE.md | Guide installation | `docs/` |

## 🔚 Résumé

- ✅ **projects/** = Tous les applis isolées et fonctionnelles
- ✅ **docs/** = Toute la documentation centralisée
- ✅ **tools/** = Launchers qui redirigent vers projects/
- ✅ **killagain-food/** = Reste en racine (submodule important)
- ✅ Chaque projet peut se lancer de manière autonome

**Enjoy the clean structure! 🎉**
