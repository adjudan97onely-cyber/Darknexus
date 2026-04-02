# 🎮 WARZONE - Versions & Organisation

## 📋 Vue d'ensemble

Tu as **2 versions** de Warzone pour 2 usages différents :

| Version | Chemin | Usage | Lanceur |
|---------|--------|-------|---------|
| **UTILISATEUR** | `projects/warzone/` | Pour les utilisateurs finaux | `LANCER_WARZONE.bat` |
| **DEV/ADMIN** | `projects/warzone-DEV/` | Pour ton développement personnel | `LANCER_WARZONE_DEV.bat` |

---

## 🎯 Utilisation

### Pour TESTER ton DEV personnel
```powershell
cd C:\Darknexus-main
LANCER_WARZONE_DEV.bat
```

### Pour LANCER la version UTILISATEUR
```powershell
cd C:\Darknexus-main
LANCER_WARZONE.bat
```

---

## 📂 Structure Darknexus

```
C:\Darknexus-main/
├── projects/
│   ├── warzone/              ← Version UTILISATEUR (stable)
│   ├── warzone-DEV/          ← Version DEV/ADMIN (expérimental)
│   ├── analytics-lottery/
│   └── chef-ia/
│
├── LANCER_WARZONE.bat        ← Lance version UTILISATEUR
├── LANCER_WARZONE_DEV.bat    ← Lance version DEV ⚙️
├── LANCER_ANALYTICS.bat
└── ...
```

---

## ⚙️ Développement

### Modifier la version DEV
1. Ouvre `projects/warzone-DEV/` dans VS Code
2. Modifie tes scripts/code
3. Teste avec `LANCER_WARZONE_DEV.bat`
4. Quand c'est stable → copie vers `projects/warzone/` pour les users

### Workflow recommandé
```
1. Code dans warzone-DEV/
2. Test complet dans warzone-DEV/
3. Valide que tout fonctionne
4. Sync vers warzone/ pour production
5. Push GitHub
```

---

## 🔄 Synchronisation

### Après une amélioration dans DEV
```powershell
# Copie la version DEV stable vers UTILISATEUR
Copy-Item -Path "C:\Darknexus-main\projects\warzone-DEV\*" `
          -Destination "C:\Darknexus-main\projects\warzone\" `
          -Recurse -Force

# Commit et push
cd C:\Darknexus-main
git add .
git commit -m "Update: Warzone DEV → Production"
git push origin main
```

---

## 💡 Conseils

- ✅ Garde `warzone/` stable pour les utilisateurs
- ✅ Utilise `warzone-DEV/` pour tester des nouvelles features
- ✅ Ne force pas les users à utiliser une version instable
- ✅ Documente les changements majeurs

---

## 📌 À retenir

**warzone-DEV** = C'est POUR TOI (admin/développement)
**warzone** = C'est POUR LES UTILISATEURS (stable)

Pas de confusion ! 🎉
