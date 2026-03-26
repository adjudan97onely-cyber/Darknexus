# 📱 ACCÈS MOBILE - Analytics Lottery & KillAgain Food

## ⚠️ IMPORTANT: Avant tout

Les applications tournent actuellement en **LOCAL** sur ton ordinateur:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001

Pour accéder depuis ton **téléphone**, tu dois:
1. ✅ Être sur le **même réseau WiFi**
2. ✅ Connaître l'**IP locale** de ton ordinateur
3. ✅ Ouvrir les ports appropriés (pare-feu)

---

## 🔧 ÉTAPE 1: Obtenir ton IP locale

### Sur Windows (ton ordinateur)

Ouvre PowerShell et tape:
```powershell
ipconfig
```

Cherche la section `IPv4 Address` sous `Ethernet` ou `Wireless LAN adapter WiFi`:
```
IPv4 Address . . . . . . . . . . . : 192.168.x.x  ← C'EST ÇA!
```

**Exemple**: `192.168.1.100`

---

## 🌐 ÉTAPE 2: Accéder depuis le téléphone

### Sur ton téléphone (même WiFi):

Ouvre le navigateur (Chrome, Firefox, Safari, etc.) et va à:

```
http://192.168.x.x:5173
```

**Remplace `192.168.x.x` par ton IP!**

**Exemple réel**:
```
http://192.168.1.100:5173
```

---

## ✅ SI TU VOIS LA PAGE

Tu es connecté! 🎉

- La page Analytics Lottery doit charger
- Tu peux naviguer dans les 3 modes (Jouer/Résultats/Analyse)
- Les widgets utilisent les données locales

---

## ❌ SI RIEN NE S'AFFICHE

### Problème #1: "Connection refused"

**Cause**: Pare-feu Windows bloque les ports

**Solution**:
1. Ouvre "Windows Defender Firewall"
2. → "Allow an app through firewall"
3. Ajoute `node.exe` ou ton navigateur
4. ✅ Coche les 2 colonnes

### Problème #2: "Cannot reach 192.168..."

**Cause**: Pas sur le même WiFi

**Solution**:
1. Téléphone: WiFi → Sélectionne le MÊME réseau que l'ordi
2. Vérife la connexion WiFi est active sur ton PC

### Problème #3: Données ne chargent pas

**Cause**: Backend ne tourne pas

**Solution**:
```powershell
# Sur ton ordinateur:
cd c:\Darknexus-main\analytics-lottery\lottery\backend
python main.py
```

Vérifie que tu vois:
```
INFO:     Uvicorn running on http://0.0.0.0:5001 (Press CTRL+C to quit)
```

---

## 🎯 PAGES DISPONIBLES (depuis mobile)

Une fois connecté:

### Mode "Je Veux Jouer" 🎲
```
http://192.168.1.100:5173/hub?mode=play

Tu vois:
✓ 3 grilles Keno/Loto proposées
✓ Top 10 matchs football
✓ Boutons pour sauvegarder
```

### Mode "Mes Résultats" 📊
```
http://192.168.1.100:5173/hub?mode=results

Tu vois:
✓ Prédictions vs résultats réels
✓ Score automatique
✓ Précision %
```

### Mode "Analyse IA" 🧠
```
http://192.168.1.100:5173/hub?mode=analysis

Tu vois:
✓ Numéros chauds/froids
✓ Tendances
✓ Alertes IA
```

### Pages Spécifiques:

- **Keno**: `http://192.168.1.100:5173/keno`
- **Loto**: `http://192.168.1.100:5173/loto`
- **EuroMillions**: `http://192.168.1.100:5173/euromillions`
- **Football**: `http://192.168.1.100:5173/sports`
- **Dashboard**: `http://192.168.1.100:5173/` (page d'accueil)

---

## 🔌 ENDPOINTS API (pour développeurs)

Si tu veux tester les API directement:

### Learning Loop (Feedback & Amélioration)

**Enregistrer une prédiction**:
```
POST http://192.168.1.100:5001/api/learning/predict

Body:
{
  "type": "keno",
  "values": [5, 12, 18, 27, 33],
  "confidence": 78
}
```

**Enregistrer un résultat**:
```
POST http://192.168.1.100:5001/api/learning/result/PREDICTION_ID

Body:
{
  "values": [5, 18, 42, 60, 70]
}
```

**Voir performance**:
```
GET http://192.168.1.100:5001/api/learning/performance?days=7
```

**Voir tendances**:
```
GET http://192.168.1.100:5001/api/learning/trends?window_days=30
```

---

## 📲 CONSEIL: Ajoute en favori

Sur ton téléphone:
1. Va à `http://192.168.1.100:5173`
2. ⋮ (menu) → "Add to Home Screen" ou "Add Bookmark"
3. Nomme-le "Analytics"
4. Prochaine fois: accès en 1 clic! ✨

---

## 🚀 PROCHAINES ÉTAPES

### Pour vraiment tester:

1. **Laisse le backend tourner** en background
2. **Laisse le frontend en dev** en background
3. **Depuis téléphone**: Va à `http://192.168.1.100:5173/hub?mode=play`
4. **Clique "Jouer Maintenant"** et regarde les grilles générées
5. **Navigue les 3 modes** et teste les widgets

---

## 🔐 NOTES DE SÉCURITÉ

⚠️ **IMPORTANT**: Cette config est **LOCAL ONLY** (pas internet)

Ne donne **JAMAIS** ton IP à quelqu'un d'autre!

---

## 💬 TROUBLESHOOTING RAPIDE

| Problème | Solution |
|----------|----------|
| "ERR_CONNECTION_REFUSED" | Backend pas lancé → `python main.py` |
| Page blanche | Frontend pas lancé → `npm run dev` |
| "Cannot reach" | Pas sur le même WiFi |
| Port déjà utilisé | `netstat -ano \| grep 5173` ou `5001` |
| CORS error | Vérife `/api/` headers dans console |

---

**Questions?** Laisse les détails de l'erreur dans la console (F12) et décris le problème!

Bon test! 🎯
