# 🚀 Darknexus - Projects Management Hub

**Version:** 2.0 (Réorganisée - 30 mars 2026)

## 🎯 C'est Quoi?

Darknexus est ton **écosystème de projets** centralisé. Chaque projet (Warzone, Killagain-Food, Analytics-Lottery, etc.) vit dans son propre monde **autonome et fonctionnel**.

```
Darknexus-main/
├── projects/          ← TOUS tes projets indépendants
├── docs/              ← TOUTE ta documentation
├── tools/             ← Scripts de lancement
├── config/            ← Configs globales
└── Launchers (.bat)   ← Raccourcis pour lancer depuis la racine
```

## 🎮 Lancer tes Projets

### ⚡ Quick Launch (depuis la racine)

```bash
# Warzone
.\LANCER_WARZONE.bat

# Warzone (Zen Hub Pro mode)
.\LANCER_ZEN_HUB_PRO_WARZONE.bat

# Killagain Food (PREMIUM)
.\LANCER_KILLAGAIN_FOOD.bat
```

### 📍 Ou Directement Depuis le Dossier

```bash
# Warzone
cd projects/warzone
.\LANCER_WARZONE.bat

# Killagain Food
cd projects/killagain-food
.\LANCER_KILLAGAIN_FOOD.bat
```

## 📋 Projets Disponibles

| Project | Location | Purpose | Status |
|---------|----------|---------|--------|
| **Warzone** | `projects/warzone/` | Jeu Warzone - Scripts Rapid Fire V7/V8 | ✅ WORKING |
| **Killagain Food (PREMIUM)** | `projects/killagain-food/` | App Recettes - React + Claude Vision IA | ✅ PREMIUM |
| **Analytics Lottery** | `projects/analytics-lottery/` | Système Lottery - Analytics & Tracking | ✅ ACTIVE |
| **Chef IA** | `projects/chef-ia/` | Assistant IA Cuisine | ⏳ DEV |

**Note:** Killagain-Food est un **submodule git** en racine (`killagain-food/`), mais accessible via `projects/killagain-food/` pour la cohérence.

## 📂 Structure Détaillée

```
Darknexus-main/
│
├── 🎯 projects/                          ← DOSSIER MAÎTRE DES PROJETS
│   ├── warzone/                          ← Jeu Warzone
│   │   ├── LANCER_WARZONE.bat           ← Lance le jeu
│   │   ├── LANCER_ZEN_HUB_PRO_WARZONE.bat
│   │   ├── interface.ps1 / warzone.ps1   ← Scripts PowerShell
│   │   ├── .git/                         ← Repo indépendant (optionnel)
│   │   └── [autres fichiers du projet]
│   │
│   ├── killagain-food/                   ← Raccourci vers le vraI (racine)
│   │   └── LANCER_KILLAGAIN_FOOD.bat    ← Redirige vers racine
│   │
│   ├── analytics-lottery/                ← Analytics & Lottery
│   │   ├── LANCER_ANALYTICS.bat
│   │   ├── backend/                      ← Python backend
│   │   ├── frontend/                     ← React frontend
│   │   └── [configs, data, etc.]
│   │
│   └── chef-ia/                          ← Chef IA Assistant
│       └── [en développement]
│
├── 📚 docs/                              ← DOCUMENTATION CENTRALISÉE
│   ├── README.md                         ← Doc générale
│   ├── STRUCTURE.md                      ← Explication structure
│   ├── INSTALL_GUIDE.md                  ← Guide installation
│   ├── API_INTEGRATION_COMPLETE.md
│   ├── DARKNEXUS_PROJECT_SPEC.md
│   └── [+23 autres .md]
│
├── 🛠️ tools/                             ← SCRIPTS GLOBAUX
│   ├── LANCER_WARZONE.bat                ← Pointeur vers projects/warzone/
│   ├── LANCER_KILLAGAIN_FOOD.bat         ← Pointeur vers projects/killagain-food/
│   ├── LANCER_ZEN_HUB_PRO_WARZONE.bat
│   ├── OUVRIR_WARZONE.bat
│   ├── START_ALL.bat                     ← Démarre tous les services
│   ├── INSTALLATION_AUTOMATIQUE.bat
│   ├── install_windows.bat
│   └── [autres scripts]
│
├── ⚙️ config/                            ← CONFIGURATIONS
│   └── [vercel, git configs, etc.]
│
├── killagain-food/                       ← ⚠️ SUBMODULE (reste en racine)
│   ├── src/                              ← Code React PREMIUM
│   ├── package.json
│   ├── vite.config.js
│   └── [projet complet indépendant]
│
└── [Build artifacts]
    ├── dist/                             ← Builds compilés
    ├── _publish/                         ← Déploiements
    └── downloads/                        ← Fichiers téléchargés
```

## ✨ Workflow de Travail

### 1. Modifier un Projet

```bash
# Warzone
cd projects/warzone
# Editer, tester, committer
git add .
git commit -m "feat: new rapid fire"
git push

# Killagain Food (le vrai code)
cd killagain-food  # ← En racine, not in projects/
npm run dev
# Editer, tester
git add .
git commit -m "fix: nutrition plan"
git push
```

### 2. Lancer les Services

```bash
# Depuis la racine, n'importe où
.\LANCER_WARZONE.bat                 # Lance Warzone
.\LANCER_KILLAGAIN_FOOD.bat          # Lance Killagain Food
```

### 3. Commit & Push

**IMPORTANT:** Chaque projet gère son propre git:
- Changes in `projects/warzone/` → commit à `projects/warzone/`
- Changes in `killagain-food/` → commit à `killagain-food/` (submodule)
- Changes in `tools/`, `docs/` → commit au repo principal Darknexus

## 🚨 Règles d'Or

### ✅ À FAIRE

- ✅ Travailler DANS le dossier de son projet (`projects/{name}/` ou `killagain-food/`)
- ✅ Commit chaque heure minimum
- ✅ Push avant de fermer
- ✅ Utiliser les launchers `.bat` pour tester rapidement
- ✅ Garder la structure: chaque projet autonome

### ❌ À NE PAS FAIRE

- ❌ **Ne PAS mélanger les projets** → pas de fichiers d'un projet dans un autre
- ❌ **Ne PAS éditer `apps/` ou autres dossiers confus** → tout est en `projects/` maintenant
- ❌ **Ne PAS oublier de git push** → chaque projet peut avoir des commits non synchronisés
- ❌ **Ne PAS créer de launchers au dossier racine sauf redirecteurs** → les vrais launchers sont DANS projects/

## 📖 Documentation

- **[STRUCTURE.md](docs/STRUCTURE.md)** - Explication détaillée de l'arborescence
- **[INSTALL_GUIDE.md](docs/INSTALL_GUIDE.md)** - Comment installer/setup
- **[DARKNEXUS_PROJECT_SPEC.md](docs/DARKNEXUS_PROJECT_SPEC.md)** - Specs du projet
- **[API_INTEGRATION_COMPLETE.md](docs/API_INTEGRATION_COMPLETE.md)** - Intégrations API

## 🔧 Troubleshooting

### "LANCER_WARZONE.bat ne fonctionne pas"
```bash
# Vérifier les chemins
if (Test-Path projects/warzone/LANCER_WARZONE.bat) { "✓" } else { "✗" }

# Tester directement
cd projects/warzone
.\LANCER_WARZONE.bat
```

### "Je ne trouve pas mon fichier"
```bash
# Chercher dans projects/
Get-ChildItem projects/ -Recurse -Filter "*mon_fichier*"

# Chercher dans docs/
Get-ChildItem docs/ -Recurse -Filter "*mon_fichier*"
```

### "Merger les projets disparates"
Chaque projet vit seul. Pour partager du code:
- Créer une `shared/` folder dans `infrastructure/`
- Ou utiliser des imports/dépendances npm

## 🎉 Résumé

Tu as maintenant:
- ✅ **Une structure claire** - Chaque projet = son dossier
- ✅ **Des launchers faciles** - `.\LANCER_XXX.bat` depuis n'importe où
- ✅ **Documentation centralisée** - Tous les `.md` en `docs/`
- ✅ **Des redirecteurs intelligents** - Racine pointe vers `tools/` qui pointe vers `projects/`
- ✅ **Autonomie des projets** - Chacun peut se développer indépendamment

**Happy coding! 🚀**

---

*Last updated: 30 mars 2026*
*Commit: e840f72*
