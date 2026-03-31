# 📦 Darknexus - Multi-Apps Suite

Bienvenue dans **Darknexus**, la suite complète d'applications antillaises et de gaming !

## 🎯 Structure du Projet

```
Darknexus-main/
├── 📁 apps/                         ← Toutes les applications
│   ├── 🍽️  killagain-food/          ← App recettes antillaises
│   │   ├── LANCER_KILLAGAIN_FOOD.bat
│   │   ├── LANCER_ADJ_KILLAGAIN.bat
│   │   └── src/
│   │
│   ├── ⚔️  warzone/                  ← App script gaming Warzone
│   │   ├── LANCER_ZEN_HUB_PRO_WARZONE.bat
│   │   ├── OUVRIR_WARZONE.bat
│   │   └── src/
│   │
│   ├── 🎰 analytics-lottery/        ← App analyse loteries & sports
│   │   ├── LANCER_ANALYTICS_LOTTERY.bat
│   │   └── src/
│   │
│   └── 👨‍🍳 chef-ia/                  ← App assistant culinaire IA
│       ├── LANCER_CHEF_IA.bat
│       └── src/
│
├── 📚 docs/                         ← Documentation complète
│   ├── GUIDE_*.md
│   ├── INSTALLATION_*.md
│   └── README*.md
│
├── ⚙️  config/                       ← Configuration partagée
│   ├── vercel.json
│   ├── vite.config.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── ...
│
└── 🔧 scripts/                      ← Utilitaires & scripts

```

## 🚀 Démarrage Rapide

### **1️⃣ Killagain Food** (Recettes Antillaises)
```bash
# Windows - Double-clic sur:
apps/killagain-food/LANCER_KILLAGAIN_FOOD.bat

# Ou Terminal:
cd apps/killagain-food && npm run dev
```

### **2️⃣ Warzone Script** (Gaming Assistant)
```bash
# Windows - Double-clic sur:
apps/warzone/LANCER_ZEN_HUB_PRO_WARZONE.bat

# Ou Terminal:
cd apps/warzone && npm run dev
```

### **3️⃣ Analytics Lottery** (Prédictions & Sports)
```bash
# Windows - Double-clic sur:
apps/analytics-lottery/LANCER_ANALYTICS_LOTTERY.bat

# Ou Terminal:
cd apps/analytics-lottery && npm run dev
```

### **4️⃣ Chef IA** (Assistant Culinaire)
```bash
# Windows - Double-clic sur:
apps/chef-ia/LANCER_CHEF_IA.bat

# Ou Terminal:
cd apps/chef-ia && npm run dev
```

---

## 📖 Documentation

Tous les guides sont dans le dossier **`docs/`**:

- 🔧 **GUIDE_INSTALLATION_SIMPLE.md** - Installation rapide
- 📱 **GUIDE_UTILISATION_LOCAL.md** - Utilisation locale
- 🚀 **GUIDE_DEPLOIEMENT.md** - Déploiement Vercel
- 🎮 **Guides spécifiques** par application

---

## 💾 Configuration Partagée

Les fichiers de configuration sont centralisés dans **`config/`**:

- `vercel.json` - Config Vercel pour deploy
- `vite.config.js` - Config bundler
- `tailwind.config.js` - Design system
- `package.json` - Dépendances globales (si multimonorepo)

---

## 🌐 URLs

- **Local Dev:** `http://localhost:5173`
- **Killagain Food:** `http://localhost:5173/killagain-food`
- **Warzone:** `http://localhost:5173/warzone`
- **Analytics Lottery:** `http://localhost:5173/analytics`
- **Chef IA:** `http://localhost:5173/chef-ia`

---

## 📋 Stack Technologique

### Frontend
- ⚛️ React 18
- 🎨 Tailwind CSS
- 🛠️ Vite
- 📱 Responsive Design

### Backend
- 🐍 Python/FastAPI
- 🗄️ MongoDB
- 🔐 JWT Auth
- 🚀 Deployed on Vercel

### DevOps
- 📦 Git + GitHub
- ☁️ Vercel CI/CD
- 🐳 Docker (optionnel)

---

## 🤝 Contribution

Pour contribuer aux apps:

1. **Branch:** `feature/nom-feature`
2. **Commit:** `feat: description courte`
3. **Push:** vers origin
4. **PR:** Décris tes changements

---

## 🐛 Troubleshooting

**Node.js non détecté?**
```bash
node --version
npm --version
```

**Dépendances manquantes?**
```bash
cd apps/[app-name]
npm install
npm run dev
```

**Port 5173 déjà utilisé?**
```bash
# Changer le port dans vite.config.js
```

---

## ✨ Chaque app a ses spécialités:

| App | Focus | Version |
|-----|-------|---------|
| 🍽️ **Killagain Food** | Recettes antillaises | v1.2 |
| ⚔️ **Warzone** | Script gaming | v2.0 |
| 🎰 **Analytics** | Loteries & prédictions | v1.0 |
| 👨‍🍳 **Chef IA** | Assistant culinaire IA | v0.9 |

---

## 📞 Support

- 📘 Consulte la doc dans `docs/`
- 🐛 Ouvre une issue sur GitHub
- 💬 Contacte l'équipe dev

---

**Version:** 3.0 (Multi-Apps Restructured)  
**Dernière mise à jour:** 29/03/2026  
**Maintaineur:** adjudan97onely-cyber

🚀 **Bienvenue dans Darknexus!**
