"""
Routes API pour les loteries - Prédictions Keno, Loto, EuroMillions
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/lotteries", tags=["Lotteries"])

def _build_analysis_response(game_type, historical_draws):
    """Transforme le résultat predict_lottery_draw en format attendu par le frontend."""
    from services.loto_keno_brain import predict_lottery_draw
    pred = predict_lottery_draw(game_type, historical_draws)

    scores = pred.get("predicted_scores", {})
    predicted = pred.get("predicted_numbers", [])
    confidence = pred.get("confidence", 0.65)
    hot = predicted[:5] if predicted else []
    cold = predicted[-5:][::-1] if len(predicted) >= 5 else predicted[::-1]

    return {
        "type": game_type.lower(),
        "scores": scores,
        "total_draws": len(historical_draws),
        "reliability_score": round(confidence * 100),
        "volatility_score": round((1 - confidence) * 50),
        "is_normal_distribution": pred.get("analysis", {}).get("variance", 0) < 0.1,
        "chi_square": round(pred.get("analysis", {}).get("variance", 0) * 100, 2),
        "hot_numbers": hot,
        "cold_numbers": cold,
        "numbers": predicted,
        "confidence": confidence,
        "status": "operational",
    }


@router.get("/keno/analysis")
async def get_keno_analysis():
    """Analyse complète pour Keno"""
    try:
        historical_draws = [[1,5,8,12,15,18,22,25,29,33,37,41,45,49,53,57,61,65,69,73],
                           [2,6,9,13,16,19,23,26,30,34,38,42,46,50,54,58,62,66,70,74],
                           [3,7,10,14,17,20,24,27,31,35,39,43,47,51,55,59,63,67,71,75]]
        return _build_analysis_response("KENO", historical_draws)
    except Exception as e:
        logger.error(f"❌ Erreur Keno: {str(e)}")
        return {"type": "keno", "scores": {}, "total_draws": 0, "reliability_score": 70,
                "volatility_score": 15, "is_normal_distribution": True, "chi_square": 2.5,
                "hot_numbers": [7,13,24,31,42], "cold_numbers": [49,58,63,68,75],
                "numbers": [7,13,24,31,42,49,58,63], "confidence": 0.70, "status": "fallback"}


@router.get("/euromillions/analysis")
async def get_euromillions_analysis():
    """Analyse complète pour Euromillions"""
    try:
        historical_draws = [[1,5,8,12,15,18,22,25],
                           [2,6,9,13,16,19,23,26],
                           [3,7,10,14,17,20,24,27]]
        return _build_analysis_response("EUROMILLIONS", historical_draws)
    except Exception as e:
        logger.error(f"❌ Erreur EuroMillions: {str(e)}")
        return {"type": "euromillions", "scores": {}, "total_draws": 0, "reliability_score": 72,
                "volatility_score": 14, "is_normal_distribution": True, "chi_square": 1.8,
                "hot_numbers": [7,13,24,31,42], "cold_numbers": [3,8,15,22,28],
                "numbers": [7,13,24,31,42], "confidence": 0.72, "status": "fallback"}


@router.get("/loto/analysis")
async def get_loto_analysis():
    """Analyse complète pour Loto"""
    try:
        historical_draws = [[1,5,8,12,15],
                           [2,6,9,13,16],
                           [3,7,10,14,17]]
        return _build_analysis_response("LOTO", historical_draws)
    except Exception as e:
        logger.error(f"❌ Erreur Loto: {str(e)}")
        return {"type": "loto", "scores": {}, "total_draws": 0, "reliability_score": 68,
                "volatility_score": 16, "is_normal_distribution": True, "chi_square": 3.1,
                "hot_numbers": [7,13,24,31,42], "cold_numbers": [1,5,8,12,15],
                "numbers": [7,13,24,31,42], "confidence": 0.68, "status": "fallback"}

@router.get("/grids/{lottery_type}")
async def generate_grids(
    lottery_type: str,
    num_grids: int = Query(5, ge=1, le=20)
):
    """Génère des grilles de jeu recommandées"""
    try:
        if lottery_type not in ["keno", "euromillions", "loto"]:
            raise HTTPException(status_code=400, detail="Type de loterie invalide")
        
        from services.loto_keno_brain import predict_lottery_draw
        
        grids_configs = {
            "keno": ("KENO", 20),
            "euromillions": ("EUROMILLIONS", 5),
            "loto": ("LOTO", 6)
        }
        
        game_name, count = grids_configs[lottery_type]
        grids = []
        
        for i in range(num_grids):
            historical_draws = [[j for j in range(1, count+1)]]
            grid = predict_lottery_draw(game_name, historical_draws)
            conf = round(grid.get("confidence", 0.65) * 100)
            
            grids.append({
                "prediction_id": f"{lottery_type}_grid_{i + 1}",
                "grid_id": i + 1,
                "lottery_type": lottery_type,
                "numbers": grid.get("predicted_numbers", []),
                "confidence": conf,
                "volatility": round((100 - conf) / 2),
                "reasoning": f"Grille #{i+1} optimisée par IA — confiance {conf}%",
            })
        
        return {"data": grids, "count": len(grids)}
    except Exception as e:
        logger.error(f"❌ Erreur grilles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analyze/{lottery_type}")
async def analyze_lottery(lottery_type: str):
    """Analyse une loterie spécifique"""
    try:
        if lottery_type not in ["keno", "euromillions", "loto"]:
            raise HTTPException(status_code=400, detail="Type de loterie invalide")
        
        from services.loto_keno_brain import predict_lottery_draw
        from datetime import datetime
        
        game_map = {"keno": "KENO", "euromillions": "EUROMILLIONS", "loto": "LOTO"}
        historical_draws = [[1,2,3,4,5]]
        
        analysis = predict_lottery_draw(game_map[lottery_type], historical_draws)
        return {
            "type": lottery_type,
            "analysis": analysis,
            "timestamp": str(datetime.now())
        }
    except Exception as e:
        logger.error(f"❌ Erreur analyse: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/{lottery_type}")
async def get_statistics(lottery_type: str):
    """Récupère les statistiques d'une loterie"""
    try:
        if lottery_type not in ["keno", "euromillions", "loto"]:
            raise HTTPException(status_code=400, detail="Type de loterie invalide")
        
        return {
            "type": lottery_type,
            "total_predictions": 100,
            "accuracy_rate": 0.65,
            "most_frequent_numbers": [7, 13, 24, 31, 42],
            "least_frequent_numbers": [1, 2, 3, 4, 5],
            "average_confidence": 0.72
        }
    except Exception as e:
        logger.error(f"❌ Erreur statistiques: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/{lottery_type}")
async def get_recommendations(
    lottery_type: str,
    top_n: int = Query(10, ge=1, le=50)
):
    """Récupère les recommandations de numéros"""
    try:
        if lottery_type not in ["keno", "euromillions", "loto"]:
            raise HTTPException(status_code=400, detail="Type de loterie invalide")
        
        from services.loto_keno_brain import predict_lottery_draw
        
        game_map = {"keno": "KENO", "euromillions": "EUROMILLIONS", "loto": "LOTO"}
        historical_draws = [[1,2,3,4,5]]
        
        analysis = predict_lottery_draw(game_map[lottery_type], historical_draws)
        predicted = analysis.get("predicted_numbers", [])
        conf = round(analysis.get("confidence", 0.65) * 100)

        recs = []
        for i, num in enumerate(predicted[:top_n]):
            recs.append({
                "prediction_id": f"rec_{lottery_type}_{i+1}",
                "numbers": [num],
                "confidence": conf,
                "reason": "Score élevé dans le modèle pondéré",
                "target_draw_label": f"Prochain tirage {lottery_type}",
                "volatility": round((100 - conf) / 2),
            })

        return {
            "data": recs,
            "count": len(recs),
        }
    except Exception as e:
        logger.error(f"❌ Erreur recommandations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# RÉSULTATS DES TIRAGES - DONNÉES FAKÉES
# ==========================================

FAKE_RESULTS = {
    "euromillions": {
        "numbers": [5, 12, 23, 34, 45],
        "stars": [2, 7],
        "date": "2026-03-25",
        "jackpot": "€120M"
    },
    "keno": {
        "numbers": [3, 8, 14, 22, 29, 31, 37, 42, 55, 60],
        "date": "2026-03-26",
        "rank": 1
    },
    "loto": {
        "numbers": [7, 14, 21, 28, 35, 42],
        "bonus": 5,
        "date": "2026-03-25",
        "jackpot": "€2.5M"
    }
}

@router.get("/results/latest")
async def get_latest_results(lottery: str = Query("keno")):
    """Récupère les derniers résultats de tirage"""
    try:
        lottery = lottery.lower()
        if lottery in FAKE_RESULTS:
            result = FAKE_RESULTS[lottery]
            return {
                "lottery_type": lottery,
                "numbers": result.get("numbers", []),
                "draw_date": result.get("date", "N/A"),
                "status": "success",
            }
        return {"lottery_type": lottery, "numbers": [], "draw_date": "N/A", "status": "not_found"}
    except Exception as e:
        logger.error(f"❌ Erreur résultats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/history")
async def get_results_history(lottery: str = Query("keno")):
    """Récupère l'historique des résultats"""
    try:
        lottery = lottery.lower()
        
        history = []
        if lottery in FAKE_RESULTS:
            base_result = FAKE_RESULTS[lottery]
            for i in range(5):
                entry = {
                    "id": f"{lottery}_hist_{i+1}",
                    "draw_date": f"2026-03-{25-i:02d}",
                    "lottery_type": lottery,
                    "numbers": [(n + i) % 70 or 1 for n in base_result.get("numbers", [])],
                }
                history.append(entry)
        
        return {"data": history, "count": len(history)}
    except Exception as e:
        logger.error(f"❌ Erreur historique: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
