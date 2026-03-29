"""
Routes API - Prédictions Enrichies + Accuracy Tracking + Lotto/Keno
Matchs temps réel + cotes + prédictions IA RÉELLE + lottery
"""

from fastapi import APIRouter, Query, Body
from datetime import datetime
from typing import Optional, List
from services.enrichment_service import (
    get_enriched_matches,
    search_enriched_match,
    extract_odds_signal
)
from services.enriched_ia_service import (
    combine_predictions,
    batch_predictions,
    get_prediction_quality_metrics
)
from services.prediction_storage import (
    PredictionStorage,
    save_match_prediction,
    record_match_result
)
from services.loto_keno_brain import (
    predict_lottery_draw,
    get_lottery_statistics,
    evaluate_lottery_prediction
)

router = APIRouter()


@router.get("/api/predictions/enriched")
async def get_enriched_predictions(
    league: str = Query(None),
    country: str = Query(None)
):
    """
    Retourne les matchs enrichis:
    - Données matchs (football-data)
    - Cotes (the-odds-api)
    - Probabilités implicites
    - Signaux pour IA
    
    Filtres:
    - league: bundesliga, ligue1, premier, serie-a, la-liga
    - country: Germany, France, England, Italy, Spain
    """
    
    matches = await get_enriched_matches(league=league, country=country)
    
    # Extraire les signaux odds pour chaque match
    for match in matches:
        match['odds_signal'] = extract_odds_signal(match)
    
    return {
        "count": len(matches),
        "type": "enriched_predictions",
        "filters": {
            "league": league,
            "country": country
        },
        "data": {
            "timestamp": datetime.now().isoformat(),
            "matches": matches,
            "data_sources": [
                "football-data.org (matchs temps réel)",
                "the-odds-api.com (cotes actuelles)"
            ]
        }
    }


@router.get("/api/predictions/with-ia")
async def get_predictions_with_ia(
    league: str = Query(None),
    country: str = Query(None)
):
    """
    Retourne prédictions COMPLÈTES:
    - Matchs (football-data)
    - Cotes (the-odds-api)
    - Prédictions IA combinées
    
    Prédictions basées sur:
    1. Forme des équipes (30%)
    2. Signal marché/odds (50%)
    3. Tendances (20%)
    """
    
    # Étape 1: Récupérer matchs enrichis
    matches = await get_enriched_matches(league=league, country=country)
    
    # Étape 2: Ajouter signaux odds
    for match in matches:
        match['odds_signal'] = extract_odds_signal(match)
    
    # Étape 3: Générer prédictions IA
    predictions = batch_predictions(matches)
    
    # Étape 4: Calculer métriques
    metrics = get_prediction_quality_metrics(predictions)
    
    return {
        "count": len(predictions),
        "type": "predictions_with_ia",
        "filters": {
            "league": league,
            "country": country
        },
        "timestamp": datetime.now().isoformat(),
        "data": {
            "predictions": predictions,
            "metrics": metrics,
            "data_sources": [
                "football-data.org",
                "the-odds-api.com",
                "IA combinée"
            ],
            "model": {
                "type": "combined_signals",
                "weights": {
                    "team_form": 0.3,
                    "market_odds": 0.5,
                    "trends": 0.2
                }
            }
        }
    }


# =========================
# ACCURACY TRACKING (NEW)
# =========================

@router.post("/api/predictions/record-result")
async def record_match_result_endpoint(
    match_id: str = Body(...),
    actual_result: str = Body(...),
    notes: Optional[str] = Body(None)
):
    """
    Enregistre le résultat réel d'un match pour tracking accuracy
    
    Body:
    {
        "match_id": "home-away",
        "actual_result": "HOME|DRAW|AWAY",
        "notes": "Optional notes"
    }
    """
    
    result = PredictionStorage.save_result(match_id, actual_result, notes)
    
    return {
        "success": bool(result),
        "result": result,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/api/predictions/accuracy-metrics")
async def get_accuracy():
    """
    Récupère les métriques d'accuracy actuelles
    
    Retourne:
    {
        "accuracy": 0.72,
        "correct": 18,
        "total": 25,
        "high_confidence_accuracy": 0.85,
        "low_confidence_accuracy": 0.58
    }
    """
    
    matched = PredictionStorage.match_predictions_with_results()
    
    if not matched:
        return {
            "accuracy": 0,
            "correct": 0,
            "total": 0,
            "message": "Pas encore de résultats enregistrés"
        }
    
    correct = sum(1 for m in matched if m["correct"])
    accuracy_metrics = PredictionStorage.recalculate_accuracy()
    
    return {
        "accuracy_metrics": accuracy_metrics,
        "matched_count": len(matched),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/api/predictions/history")
async def get_predictions_history(
    limit: int = Query(20),
    league: Optional[str] = Query(None)
):
    """
    Récupère l'historique des prédictions
    """
    
    predictions = PredictionStorage.get_predictions(league=league, limit=limit)
    
    return {
        "count": len(predictions),
        "predictions": predictions,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/api/predictions/results-history")
async def get_results_history(limit: int = Query(20)):
    """
    Récupère l'historique des résultats enregistrés
    """
    
    results = PredictionStorage.get_results(limit=limit)
    
    return {
        "count": len(results),
        "results": results,
        "timestamp": datetime.now().isoformat()
    }


# =========================
# LOTTERY PREDICTIONS (NEW)
# =========================

@router.post("/api/lottery/predict")
async def predict_lottery(
    game: str = Body(...),
    historical_draws: List[List[int]] = Body([])
):
    """
    Prédire les numéros du prochain tirage
    
    Body:
    {
        "game": "KENO|LOTO|EUROMILLIONS",
        "historical_draws": [[1,2,3,4,5,6], [2,3,5,7,8,9], ...]
    }
    
    Retourne prédiction avec scores de confiance
    """
    
    if not historical_draws:
        return {
            "error": "Historique vide",
            "message": "Fournir au moins 10-20 tirages précédents"
        }
    
    prediction = predict_lottery_draw(game, historical_draws)
    
    return {
        "prediction": prediction,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/api/lottery/statistics/{game}")
async def get_lottery_stats(game: str):
    """
    Statistiques générales sur un jeu de loterie
    (À enrichir avec vraies données)
    """
    
    # Pour l'instant, data placeholder
    # En production: récupérer depuis DB réelle
    stats = {
        "game": game,
        "message": "Connecter à source de données réelle (SME/FDJ API)"
    }
    
    return stats


@router.post("/api/lottery/evaluate")
async def evaluate_prediction(
    game: str = Body(...),
    predicted: List[int] = Body(...),
    actual: List[int] = Body(...)
):
    """
    Évalue précision d'une prédiction
    
    Body:
    {
        "game": "LOTO",
        "predicted": [7, 14, 23, 38, 45, 2],
        "actual": [7, 12, 23, 39, 48, 50]
    }
    """
    
    evaluation = evaluate_lottery_prediction(predicted, actual, game)
    
    return {
        "evaluation": evaluation,
        "timestamp": datetime.now().isoformat()
    }


# =========================
# FOOTBALL BRAIN ENDPOINTS
# =========================

@router.get("/api/football-brain/health")
async def football_brain_health():
    """
    Vérification santé du système IA Football
    """
    
    return {
        "status": "operational",
        "modules": {
            "football_brain": "✅ Chargé",
            "prediction_storage": "✅ Actif",
            "enrichment_service": "✅ OK"
        },
        "features": {
            "real_form_calculation": "✅ Implémenté",
            "odds_signal": "✅ Intégré (max 30%)",
            "accuracy_tracking": "✅ Actif",
            "lottery": "✅ Disponible"
        },
        "timestamp": datetime.now().isoformat()
    }


@router.get("/api/predictions/with-ia/by-league/{league}")
async def get_ia_predictions_by_league(league: str):
    """Prédictions IA pour une ligue spécifique"""
    
    matches = await get_enriched_matches(league=league)
    
    for match in matches:
        match['odds_signal'] = extract_odds_signal(match)
    
    predictions = batch_predictions(matches)
    metrics = get_prediction_quality_metrics(predictions)
    
    return {
        "count": len(predictions),
        "type": "ia_predictions_by_league",
        "league": league,
        "timestamp": datetime.now().isoformat(),
        "predictions": predictions,
        "metrics": metrics
    }


@router.get("/api/predictions/with-ia/by-country/{country}")
async def get_ia_predictions_by_country(country: str):
    """Prédictions IA pour un pays spécifique"""
    
    matches = await get_enriched_matches(country=country)
    
    for match in matches:
        match['odds_signal'] = extract_odds_signal(match)
    
    predictions = batch_predictions(matches)
    metrics = get_prediction_quality_metrics(predictions)
    
    return {
        "count": len(predictions),
        "type": "ia_predictions_by_country",
        "country": country,
        "timestamp": datetime.now().isoformat(),
        "predictions": predictions,
        "metrics": metrics
    }


@router.get("/api/predictions/enriched/by-league/{league}")
async def get_enriched_by_league(league: str):
    """Prédictions enrichies pour une ligue spécifique"""
    
    matches = await get_enriched_matches(league=league)
    
    for match in matches:
        match['odds_signal'] = extract_odds_signal(match)
    
    return {
        "count": len(matches),
        "type": "enriched_by_league",
        "league": league,
        "matches": matches
    }


@router.get("/api/predictions/enriched/by-country/{country}")
async def get_enriched_by_country(country: str):
    """Prédictions enrichies pour un pays spécifique"""
    
    matches = await get_enriched_matches(country=country)
    
    for match in matches:
        match['odds_signal'] = extract_odds_signal(match)
    
    return {
        "count": len(matches),
        "type": "enriched_by_country",
        "country": country,
        "matches": matches
    }


@router.get("/api/predictions/enriched/match")
async def get_specific_enriched_match(
    home: str = Query(...),
    away: str = Query(...)
):
    """Prédiction enrichie pour un match spécifique"""
    
    match = await search_enriched_match(home, away)
    
    if match:
        match['odds_signal'] = extract_odds_signal(match)
    
    return {
        "type": "enriched_match",
        "homeTeam": home,
        "awayTeam": away,
        "match": match
    }


@router.get("/api/predictions/enriched/health")
async def health_check():
    """Health check pour prédictions enrichies"""
    return {
        "status": "ok",
        "service": "predictions-enriched",
        "data_sources": [
            "football-data.org",
            "the-odds-api.com"
        ],
        "features": [
            "real-time matches",
            "live odds",
            "implied probabilities",
            "ia signals"
        ]
    }
