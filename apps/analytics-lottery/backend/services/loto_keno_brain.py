"""
Loto & Keno Brain - Systèmes de Prédiction pour Jeux de Loterie
Basé sur: fréquence, retard, tendances
"""

import logging
from typing import Dict, List, Optional
from collections import Counter
from datetime import datetime

logger = logging.getLogger(__name__)

# =========================
# CONFIG JEUX
# =========================

GAME_CONFIG = {
    "KENO": {"min_num": 1, "max_num": 80, "draw_count": 20},
    "LOTO": {"min_num": 1, "max_num": 49, "draw_count": 6},
    "EUROMILLIONS": {"min_num": 1, "max_num": 50, "draw_count": 5}
}

WEIGHTS = {
    "frequency": 0.4,      # Numéros qui reviennent souvent
    "overdue": 0.35,       # Numéros en retard
    "trend": 0.25          # Tendance récente
}


# =========================
# UTILITAIRES
# =========================

def calculate_frequency(historical_draws: List[List[int]], game: str) -> Dict[int, float]:
    """
    Calcule la fréquence d'apparition de chaque numéro
    
    Args:
        historical_draws: [[1,2,3,4,5,6], [2,3,5,7,8,9], ...]
        game: "KENO", "LOTO", "EUROMILLIONS"
    
    Returns:
        {1: 0.8, 2: 0.9, ...} (0-1 score)
    """
    
    counter = Counter()
    for draw in historical_draws:
        counter.update(draw)
    
    if not counter:
        config = GAME_CONFIG.get(game, {"max_num": 49})
        return {i: 0.5 for i in range(1, config["max_num"] + 1)}
    
    max_freq = max(counter.values())
    
    # Normaliser 0-1
    frequency_scores = {}
    config = GAME_CONFIG.get(game, {"max_num": 49})
    
    for num in range(1, config["max_num"] + 1):
        frequency_scores[num] = counter.get(num, 0) / max_freq if max_freq > 0 else 0.5
    
    return frequency_scores


def calculate_overdue(historical_draws: List[List[int]], game: str) -> Dict[int, float]:
    """
    Calcule le retard (overdue) de chaque numéro
    Plus un numéro n'a pas été tiré, plus le score est haut
    
    Args:
        historical_draws: [[1,2,3,4,5,6], [2,3,5,7,8,9], ...]
        game: "KENO" ou autre
    
    Returns:
        {1: 0.9, 2: 0.1, ...} (0-1 score)
    """
    
    config = GAME_CONFIG.get(game, {"max_num": 49})
    last_draw_index = {}
    
    # Trouver le dernier tirage de chaque numéro
    for idx, draw in enumerate(reversed(historical_draws)):
        for num in draw:
            if num not in last_draw_index:
                last_draw_index[num] = len(historical_draws) - idx - 1
    
    max_overdue = len(historical_draws)
    overdue_scores = {}
    
    for num in range(1, config["max_num"] + 1):
        # Plus loin en arrière = plus haut score
        draws_since_last = max_overdue - last_draw_index.get(num, 0)
        overdue_scores[num] = min(1.0, draws_since_last / max_overdue) if max_overdue > 0 else 0.5
    
    return overdue_scores


def calculate_trend(historical_draws: List[List[int]], game: str, window: int = 10) -> Dict[int, float]:
    """
    Calcule la tendance récente (derniers N tirages)
    Numéros fréquents récemment = score haut
    
    Args:
        historical_draws: Tous les tirages
        game: Type de jeu
        window: Nombre de derniers tirages à considérer
    
    Returns:
        {1: 0.8, 2: 0.3, ...}
    """
    
    config = GAME_CONFIG.get(game, {"max_num": 49})
    
    # Prendre les N derniers tirages
    recent_draws = historical_draws[-window:] if len(historical_draws) >= window else historical_draws
    
    if not recent_draws:
        return {i: 0.5 for i in range(1, config["max_num"] + 1)}
    
    counter = Counter()
    for draw in recent_draws:
        counter.update(draw)
    
    max_freq = max(counter.values()) if counter else 1
    trend_scores = {}
    
    for num in range(1, config["max_num"] + 1):
        trend_scores[num] = counter.get(num, 0) / max_freq if max_freq > 0 else 0.5
    
    return trend_scores


def combine_scores(
    frequency: Dict[int, float],
    overdue: Dict[int, float],
    trend: Dict[int, float]
) -> Dict[int, float]:
    """
    Combine les 3 signaux avec pondérations
    
    Returns:
        {1: 0.75, 2: 0.42, ...} (0-1 score)
    """
    
    combined = {}
    all_nums = set(frequency.keys()) | set(overdue.keys()) | set(trend.keys())
    
    for num in all_nums:
        combined[num] = (
            frequency.get(num, 0.5) * WEIGHTS["frequency"]
            + overdue.get(num, 0.5) * WEIGHTS["overdue"]
            + trend.get(num, 0.5) * WEIGHTS["trend"]
        )
    
    return combined


# =========================
# CORE IA LOTERIE
# =========================

def predict_lottery_draw(
    game: str,
    historical_draws: List[List[int]],
    count: int = None
) -> Dict:
    """
    Prédire les numéros pour le prochain tirage
    
    Args:
        game: "KENO", "LOTO", "EUROMILLIONS"
        historical_draws: Historique [[1,2,3,...], ...]
        count: Nombre de numéros à prédire (défaut = config)
    
    Returns:
        {
            "game": "LOTO",
            "predicted_numbers": [7, 23, 14, 38, 45, 2],
            "scores": {7: 0.92, 23: 0.89, ...},
            "confidence": 0.65,
            "analysis": {...}
        }
    """
    
    try:
        config = GAME_CONFIG.get(game)
        if not config:
            return {"error": f"Jeu '{game}' non reconnu"}
        
        count = count or config["draw_count"]
        
        # Calculer les 3 signaux
        frequency_scores = calculate_frequency(historical_draws, game)
        overdue_scores = calculate_overdue(historical_draws, game)
        trend_scores = calculate_trend(historical_draws, game)
        
        # Combiner
        combined_scores = combine_scores(frequency_scores, overdue_scores, trend_scores)
        
        # Trier et prendre les top N
        sorted_nums = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
        predicted_numbers = [num for num, score in sorted_nums[:count]]
        
        # Confiance = variance des scores
        scores_list = list(combined_scores.values())
        avg_score = sum(scores_list) / len(scores_list) if scores_list else 0.5
        variance = sum((s - avg_score) ** 2 for s in scores_list) / len(scores_list) if scores_list else 0
        confidence = min(0.95, 0.5 + (variance * 2))  # Plus de variance = plus confiant
        
        result = {
            "game": game,
            "predicted_numbers": sorted(predicted_numbers),
            "predicted_scores": {num: round(combined_scores[num], 2) for num in predicted_numbers},
            "confidence": round(confidence, 2),
            "timestamp": datetime.now().isoformat(),
            "analysis": {
                "frequency_avg": round(avg_score, 2),
                "variance": round(variance, 3),
                "frequency_scores_top5": sorted(frequency_scores.items(), key=lambda x: x[1], reverse=True)[:5],
                "overdue_scores_top5": sorted(overdue_scores.items(), key=lambda x: x[1], reverse=True)[:5],
                "trend_scores_top5": sorted(trend_scores.items(), key=lambda x: x[1], reverse=True)[:5],
            }
        }
        
        logger.info(f"✅ Prédiction {game}: {predicted_numbers} (conf: {confidence:.0%})")
        return result
        
    except Exception as e:
        logger.error(f"❌ Erreur prédiction {game}: {e}")
        return {"error": str(e)}


def evaluate_lottery_prediction(
    predicted: List[int],
    actual: List[int],
    game: str
) -> Dict:
    """
    Évalue la qualité d'une prédiction
    
    Args:
        predicted: [7, 23, 14, 38, 45, 2]
        actual: [7, 12, 23, 39, 48, 50]
        game: "LOTO"
    
    Returns:
        {"correct": 2, "partial": 1, "accuracy": 0.33, ...}
    """
    
    try:
        predicted_set = set(predicted)
        actual_set = set(actual)
        
        correct_exact = len(predicted_set & actual_set)  # Intersection
        
        config = GAME_CONFIG.get(game)
        draw_count = config["draw_count"] if config else len(actual)
        
        accuracy = correct_exact / draw_count
        
        return {
            "game": game,
            "predicted": predicted,
            "actual": actual,
            "correct": correct_exact,
            "total": draw_count,
            "accuracy": round(accuracy, 2),
            "match_rate": f"{correct_exact}/{draw_count}"
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur évaluation: {e}")
        return {}


def batch_predict_lottery(
    game: str,
    historical_draws: List[List[int]],
    num_predictions: int = 5
) -> List[Dict]:
    """
    Génère N prédictions pour un jeu
    Utile pour comparaison/statistiques
    
    Returns:
        [prédiction1, prédiction2, ...]
    """
    
    predictions = []
    for i in range(num_predictions):
        pred = predict_lottery_draw(game, historical_draws)
        if "error" not in pred:
            predictions.append(pred)
    
    return predictions


# =========================
# HELPERS - STATS
# =========================

def get_lottery_statistics(historical_draws: List[List[int]], game: str) -> Dict:
    """Statistiques générales sur un jeu"""
    
    config = GAME_CONFIG.get(game)
    if not config:
        return {}
    
    counter = Counter()
    for draw in historical_draws:
        counter.update(draw)
    
    return {
        "game": game,
        "total_draws": len(historical_draws),
        "most_common": counter.most_common(5),
        "least_common": counter.most_common()[-5:],
        "avg_appearances": sum(counter.values()) / (config["max_num"]) if config["max_num"] > 0 else 0
    }
