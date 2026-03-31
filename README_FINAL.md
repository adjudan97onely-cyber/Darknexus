# 🎯 DARKNEXUS - STRUCTURE FINALE (NETTOYÉE 30 MARS)

## ⚠️ RÈGLES D'OR - À LIRE ABSOLUMENT

### 1️⃣ KILLAGAIN-FOOD: UN SEUL ENDROIT

```
✅ VRAI KILLAGAIN-FOOD PREMIUM:
c:\Darknexus-main\killagain-food\
   ├── src/                (React code PREMIUM)
   ├── package.json
   └── .git/               (repo indépendant)

❌ PAS ICI:
   - apps/killagain-food/        (SUPPRIMÉ - n'existe PLUS)
   - projects/killagain-food/    (SUPPRIMÉ - n'existe PLUS)
   - killagain-food/killagain-food/ (SUPPRIMÉ - était doublon)
```

**Pour développer killagain-food:**
```bash
cd c:\Darknexus-main\killagain-food
npm run dev
# C'EST TOUT!
```

### 2️⃣ WARZONE: GPC SCRIPTS (pas une web app)

```
✅ WARZONE:
c:\Darknexus-main\projects\warzone\
   ├── LANCER_WARZONE.bat       (Menu)
   ├── MASTER_SCRIPT_*.gpc      (Scripts pour manettes)
   ├── README.md
   └── ...
```

**Pour lancer warzone:**
```bash
# Depuis racine:
.\LANCER_WARZONE.bat

# Ou directement:
.\LANCER_ZEN_HUB_PRO_WARZONE.bat
```

### 3️⃣ ANALYTICS/LOTTERY: Web App complète

```
✅ ANALYTICS:
c:\Darknexus-main\projects\analytics-lottery\
   ├── frontend/          (React - Port 5174)
   ├── backend/           (Python/Node)
   ├── LANCER_ANALYTICS.bat
   └── ...
```

**Note:** Sur le screenshot tu vois une erreur "recharts not found" → faut faire:
```bash
cd projects/analytics-lottery
npm install     # Install missing deps
npm run dev     # Run frontend
```

## 🚀 COMMENT LANCER LES PROJETS

### Depuis la Racine (Darknexus-main):

```bash
# Warzone - Menu interactif des scripts GPC
.\LANCER_WARZONE.bat

# Warzone Pro - Alternative Zen Hub
.\LANCER_ZEN_HUB_PRO_WARZONE.bat

# Killagain Food PREMIUM - Dev server React
.\LANCER_KILLAGAIN_FOOD.bat
URL: http://127.0.0.1:5180/

# Analytics/Lottery - Dashboard + Backend
.\LANCER_ANALYTICS.bat

# Alias (même que LANCER_WARZONE.bat)
.\OUVRIR_WARZONE.bat
```

### Depuis le Dossier du Projet:

```bash
# Warzone
cd projects/warzone
.\LANCER_WARZONE.bat

# Killagain Food
cd killagain-food
npm run dev

# Analytics
cd projects/analytics-lottery
npm run dev
```

## 📁 Structure Complète

```
Darknexus-main/
│
├── 🔴 killagain-food/                 ← VRAI KILLAGAIN-FOOD PREMIUM (submodule)
│   ├── src/
│   ├── package.json
│   └── .git/
│
├── 🎮 projects/                       ← Autres projets autonomes
│   ├── warzone/                       ← Scripts GPC pour manettes
│   │   ├── LANCER_WARZONE.bat
│   │   ├── MASTER_SCRIPT_*.gpc
│   │   └── ...
│   ├── analytics-lottery/             ← Dashboard analytics
│   │   ├── LANCER_ANALYTICS.bat
│   │   ├── frontend/
│   │   ├── backend/
│   │   └── ...
│   └── chef-ia/                       ← Chef IA (en dev)
│
├── 📚 docs/                           ← Documentation (27 fichiers .md)
│   ├── README_STRUCTURE.md
│   ├── INSTALL_GUIDE.md
│   └── ...
│
├── 🛠️ tools/                          ← Scripts redirecteurs
│   ├── LANCER_WARZONE.bat             ← Redirige vers projects/
│   ├── LANCER_KILLAGAIN_FOOD.bat      ← Redirige vers racine/
│   ├── LANCER_ANALYTICS.bat
│   └── ...
│
├── ⚙️ Launchers Racine (redirecteurs)
│   ├── LANCER_WARZONE.bat             ← cd projects/warzone → lance
│   ├── LANCER_KILLAGAIN_FOOD.bat      ← cd killagain-food → lance
│   ├── LANCER_ANALYTICS.bat           ← cd projects/analytics → lance
│   ├── LANCER_ZEN_HUB_PRO_WARZONE.bat ← Warzone Pro mode
│   └── OUVRIR_WARZONE.bat             ← Alias
│
└── [Docker, config, build artifacts...]
```

## ✅ Vérification Rapide

```bash
# Pour vérifier que tout existe:
.\TEST_LAUNCHERS.bat
```

## 🚨 ATTENTION: Choses QUI NE DOIVENT PAS EXISTER

❌ **NE PAS CRÉER:**
- `apps/killagain-food/` — Supprimé, n'existe PLUS
- `projects/killagain-food/` — Supprimé, n'existe PLUS
- `killagain-food/killagain-food/` — Supprimé, c'était un doublon

❌ **NE PAS ÉDITER:**
- Rien dans `apps/` (le dossier est pour la structure repo uniquement)
- Ne crée pas de copies de projets

## 💻 Workflow Propre

### Pour Warzone:
```bash
cd projects/warzone
# Éditer les scripts .gpc
git add .
git commit -m "..."
git push
```

### Pour Killagain-Food (PREMIUM):
```bash
cd killagain-food         # ← En RACINE, pas dans projects/!
npm run dev               # Test
# Éditer src/ ou composants
git add .
git commit -m "..."
git push
```

### Pour Analytics:
```bash
cd projects/analytics-lottery
npm install   # Si deps manquent
npm run dev
# Code...
git add .
git commit -m "..."
git push
```

## 🆘 Troubleshooting

### "Je ne trouve pas mes fichiers killagain-food"
→ Check `c:\Darknexus-main\killagain-food\` UNIQUEMENT

### "LANCER_WARZONE.bat ne marche pas"
**Warzone c'est juste des scripts GPC, pas une app.**
→ Le launcher ouvre VS Code ou l'explorateur
→ Tu peux éditer les .gpc files directement

### "Analytics affiche une erreur"
→ Faut installer les dépendances:
```bash
cd projects/analytics-lottery
npm install recharts   # Manque recharts
npm run dev
```

### "C'est encore le bordel"
→ Git status dans chaque projet:
```bash
cd killagain-food && git status
cd ..\projects\warzone && git status
cd ..\projects\analytics-lottery && git status
```

## ✨ RÉSUMÉ

| Projet | Localisation | Lancer Avec | Type |
|--------|--------------|-------------|------|
| **Killagain-Food** | `killagain-food/` | `.\LANCER_KILLAGAIN_FOOD.bat` | React App |
| **Warzone** | `projects/warzone/` | `.\LANCER_WARZONE.bat` | GPC Scripts |
| **Analytics** | `projects/analytics-lottery/` | `.\LANCER_ANALYTICS.bat` | React App |
| **Chef-IA** | `projects/chef-ia/` | N/A | Dev |

---

**Commit:** `77f374d`  
**Date:** 30 mars 2026

**C'EST PROPRE MAINTENANT!** 🎉
