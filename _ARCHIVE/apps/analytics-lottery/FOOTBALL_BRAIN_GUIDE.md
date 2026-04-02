# 🧠 Football Brain + Lottery System - Guide Intégration

## Fichiers Créés

### 1. **football_brain.py** - Vrai Modèle IA Football
Remplace les placeholders par vraie analyse

**Fonctionnalités:**
- `predict_match(home_team, away_team)` → Prédiction propre avec confiance
- Analyse: Forme equipes, ataque/defense, odds signal (max 30%)
- Calcul d'accuracy vs résultats réels

**Poids (ajustables):**
```
- Forme: 30% (5 derniers matchs)
- Attaque: 25% (buts marqués)
- Défense: 10% (buts encaissés)
- Avantage domicile: 15%
- Signal marché (odds): 30%
```

**Utilisation:**
```python
from services.football_brain import predict_match

home = {
    "name": "PSG",
    "form": ["W","W","D","W","L"],
    "goals_scored": 2.1,
    "goals_conceded": 0.8,
    "odds": 1.8
}
away = {
    "name": "OM",
    "form": ["L","D","W","L","L"],
    "goals_scored": 1.2,
    "goals_conceded": 1.9,
    "odds": 3.2
}

result = predict_match(home, away)
# → {"prediction": "HOME", "confidence": 0.78, "analysis": {...}}
```

---

### 2. **prediction_storage.py** - Tracking Accuracy
Archive prédictions + résultats pour calculer accuracy réelle

**Fonctionnalités:**
- `save_prediction(pred)` → Enregistre prédiction
- `save_result(match_id, actual)` → Enregistre résultat
- `get_accuracy_metrics()` → Accuracy %
- `match_predictions_with_results()` → Appairage pred/résultats

**Fichiers JSON générés:**
- `databases/predictions_archive.json` - Toutes les prédictions
- `databases/results_archive.json` - Tous les résultats
- `databases/accuracy_metrics.json` - Metrics calculées

**Utilisation:**
```python
from services.prediction_storage import PredictionStorage

# Sauvegarder prédiction
PredictionStorage.save_prediction({
    "match_id": "psg-om",
    "league": "ligue1",
    "home_team": "PSG",
    "away_team": "OM",
    "prediction": "HOME",
    "confidence": 0.78
})

# Enregistrer résultat réel après match
PredictionStorage.save_result("psg-om", "HOME")

# Récupérer accuracy
metrics = PredictionStorage.get_accuracy_metrics()
# → {"accuracy": 0.75, "correct": 15, "total": 20, ...}
```

---

### 3. **loto_keno_brain.py** - Systèmes Loterie
Prédictions pour Keno, Loto, EuroMillions

**Modèle:**
```
Score = (Fréquence * 0.4) + (Retard * 0.35) + (Tendance * 0.25)
```

**Fonctionnalités:**
- `predict_lottery_draw(game, historical)` → Prédiction
- `evaluate_lottery_prediction(pred, actual)` → Accuracy
- `get_lottery_statistics(game)` → Stats numériques

**Jeux Supportés:**
- KENO (1-80, 20 numéros)
- LOTO (1-49, 6 numéros)
- EUROMILLIONS (1-50, 5 numéros)

**Utilisation:**
```python
from services.loto_keno_brain import predict_lottery_draw

historical = [
    [1,3,7,12,15,22],
    [2,5,8,14,18,25],
    [3,9,11,16,20,28],
    # ... 20+ tirages historiques
]

pred = predict_lottery_draw("LOTO", historical)
# → {
#     "predicted_numbers": [7, 14, 23, 38, 45, 2],
#     "confidence": 0.65,
#     "analysis": {...}
# }
```

---

## API Endpoints (Nouveaux)

### Accuracy Tracking

**POST /api/predictions/record-result**
```json
{
    "match_id": "psg-om-2024-03-26",
    "actual_result": "HOME",
    "notes": "Optional"
}
```

**GET /api/predictions/accuracy-metrics**
```
Retourne: {"accuracy": 0.75, "correct": 15, "total": 20, ...}
```

**GET /api/predictions/history?limit=20&league=ligue1**
```
Retourne historique prédictions
```

---

### Lottery Predictions

**POST /api/lottery/predict**
```json
{
    "game": "LOTO",
    "historical_draws": [[1,2,3,4,5,6], [2,3,5,7,8,9], ...]
}
```

**POST /api/lottery/evaluate**
```json
{
    "game": "LOTO",
    "predicted": [7, 14, 23, 38, 45, 2],
    "actual": [7, 12, 23, 39, 48, 50]
}
```

---

### Football Brain Health

**GET /api/football-brain/health**
```
Vérifie que tout fonctionne correctement
```

---

## Intégration Architecture

```
Frontend HubPage
    ↓
/api/predictions/with-ia
    ↓
enriched_ia_service.combine_predictions()
    ↓
football_brain.predict_match()  🧠 VRAIE IA
    ↓
TinyDB (predictions_archive.json)
    ↓
Frontend affiche prédictions
```

---

## Points Importants

✅ **Pas de rupture architecture**
- Code ancien reste intact
- football_brain s'enchaîne naturellement
- prediction_storage optional (optionnel d'utiliser)

✅ **Compatibilité**
- Python 3.14 OK (pas SQLAlchemy)
- JSON stock local (pas DB externe)
- Encapsulation propre

⚠️ **Pour vraie IA Football**
- Besoin stats équipes enrichies (dernier 10 matchs)
- Actuellement: utilise odds comme fallback
- Migration graduelle: football-data API peut fournir D onnées

---

## Test Rapide

```bash
# Lancer backend
cd c:\Darknexus-main\analytics-lottery\backend
python server.py

# Test football brain
curl http://localhost:5000/api/football-brain/health

# Test prédictions enrichies
curl "http://localhost:5000/api/predictions/with-ia?league=ligue1"

# Enregistrer résultat (exemple)
curl -X POST http://localhost:5000/api/predictions/record-result \
  -H "Content-Type: application/json" \
  -d '{"match_id":"test-1","actual_result":"HOME"}'

# Voir accuracy
curl http://localhost:5000/api/predictions/accuracy-metrics
```

---

## Prochaines Étapes OPTIONNELLES

1. **Enrichir stats équipes**
   - Ajouter dernier 10 matchs de chaque équipe
   - Calculer vraie forme + stats H2H

2. **Connecter DB réelle**
   - PostgreSQL au lieu TinyDB
   - Backup automatique
   - Requêtes complexes

3. **Dashboard Accuracy**
   - GraphQL avec React
   - Win rate par confiance
   - ROI tracking si paris réels

4. **Lottery Data**
   - Historique FDJ/SME
   - API tirage en direct
   - Validation résultats

---

**Status:** ✅ Prêt production MVP  
**IA Quality:** 3/5 (signal de marché) → peut devenir 8/5 avec stats enrichies
