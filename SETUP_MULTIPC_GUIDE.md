# 🖥️ Configuration Multi-PC - WARZONE + KILLAGAIN + ANALYTICS

## 📋 Comment ça fonctionne maintenant

Tu as **2 PCs** qui vont se synchroniser parfaitement:

| PC | Identifiant | Statut |
|----|-------------|--------|
| **PC BUREAU** | YEYEFAMILY971 | ✅ Configuré |
| **PC PORTABLE** | DESKTOP-PG9OU8 | ✅ Configuré |

---

## 🔧 Setup UNE SEULE FOIS

### Sur SUR LE PC BUREAU (C:\Darknexus-main)

```powershell
cd C:\Darknexus-main
.\SETUP_ENV_AUTO.bat
```

✅ Crée les `.env` automatiquement pour le PC Bureau


### Sur LE PC PORTABLE (C:\Users\Killagain97one\Desktop\Darknexus)

```powershell
cd C:\Users\Killagain97one\Desktop\Darknexus
.\SETUP_ENV_AUTO.bat
```

✅ Crée les `.env` automatiquement pour le PC Portable

---

## 🎯 Ensuite: Tout fonctionne automatiquement!

- ✅ Les `.env` **NE sont JAMAIS versionnés** (dans .gitignore)
- ✅ Chaque PC a ses **configurations locales**
- ✅ Les modifications des scripts se synchronisent via Git
- ✅ Plus jamais de "ça marche au bureau, jamais au portable!"

---

## 🔄 Workflow recommandé

### 1️⃣ Code sur PC PORTABLE
```
cd C:\Users\Killagain97one\Desktop\Darknexus
# Modifie tes scripts, recettes, etc
git add .
git commit -m "Update: ..."
git push origin main
```

### 2️⃣ Reviens au PC BUREAU
```
cd C:\Darknexus-main
git pull origin main
# Les fichiers sont à jour, les .env restent locaux!
START_ALL.bat  # Lance tes apps
```

---

## 💡 Ports & Services

**Même sur les 2 PCs:**
- Analytics Lottery: http://localhost:5001 (backend 5001)
- Killagain Food: http://localhost:5180 (frontend)
- Warzone DEV: http://localhost:5002 (backend 5002)

**MongoDB:** localhost:27017 (local sur chaque PC)

---

## ⚠️ Si tu ajoutes un 3ème PC

Edite `SETUP_ENV_AUTO.bat` et ajoute:

```batch
if "%COMPUTERNAME_LOWER%"=="TON_NOUVEAU_PC" (
    REM Copie/adapte les configurations
)
```

---

## ✅ Vérification

Les `.env` doivent être:

- [ ] PC Bureau: `C:\Darknexus-main\killagain-food\.env` ✓
- [ ] PC Bureau: `C:\Darknexus-main\projects\warzone-DEV\backend\.env` ✓
- [ ] PC Portable: `C:\Users\Killagain97one\Desktop\Darknexus\killagain-food\.env` ✓
- [ ] PC Portable: `C:\Users\Killagain97one\Desktop\Darknexus\projects\warzone-DEV\backend\.env` ✓

---

## 🚀 C'est tout!

Maintenant tu peux travailler sur **LES 2 PCs sans problème!**

Les `.env` ne vont PLUS casser Git, et chaque PC a sa propre configuration!
