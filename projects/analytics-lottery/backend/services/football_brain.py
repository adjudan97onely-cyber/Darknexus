"""
Football Brain - Vrai Modèle IA pour Prédictions Football
Ne simule rien, analyse vraiment
"""

from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

# =========================
# CONFIG (facile à ajuster)
# =========================
WEIGHTS = {
    "form": 0.3,           # Forme récente
    "attack": 0.25,        # Puissance offensive
    "defense": 0.1,        # Robustesse défensive
    "home_advantage": 0.15, # Avantage domicile
    "odds": 0.3            # Signal du marché (max)
}

HOME_ADVANTAGE_VALUE = 0.1  # +10% si domicile

# =========================
# UTILITAIRES
# =========================

def normalize(value: float, min_val: float, max_val: float) -> float:
    """Normalise une valeur entre 0 et 1"""
    if max_val - min_val == 0:
        return 0.5
    return (value - min_val) / (max_val - min_val)


def compute_form(last_matches: List[str]) -> float:
    """
    Calcule le score de forme sur les 5 derniers matchs
    
    Args:
        last_matches: ["W", "D", "L", "W", "W"]
    
    Returns:
        0-1 (où 1 = parfait, 0 = désastreux)
    """
    if not last_matches:
        return 0.5  # Défaut si pas de données
    
    score = 0
    for match in last_matches:
        if match == "W":
            score += 3  # Victoire = 3 points
        elif match == "D":
            score += 1  # Nul = 1 point
        # Défaite = 0 point
    
    # Normaliser par rapport au max possible (5 victoires = 15 points)
    return min(1.0, score / 15.0)


def compute_attack(goals_scored: float) -> float:
    """
    Évalue force offensive
    
    Args:
        goals_scored: moyenne buts marqués par match
    
    Returns:
        0-1 score d'attaque
    """
    # Normaliser: 0 but = 0, 3+ buts = 1
    return min(1.0, goals_scored / 3.0)


def compute_defense(goals_conceded: float) -> float:
    """
    Évalue solidité défensive
    
    Args:
        goals_conceded: moyenne buts encaissés par match
    
    Returns:
        0-1 score défense (plus bas = mieux)
    """
    # Normaliser: 3+ buts = 0, 0 but = 1
    return max(0.0, 1.0 - (goals_conceded / 3.0))


def odds_to_probability(odds: float) -> float:
    """
    Convertit cotes en probabilité implicite
    
    Args:
        odds: cote décimale (ex: 1.8 = 1.8x le pari)
    
    Returns:
        Probabilité 0-1
    """
    if odds <= 0:
        return 0.5
    try:
        return 1.0 / odds
    except:
        return 0.5


# =========================
# CORE IA FOOTBALL
# =========================

def compute_team_score(team: Dict, is_home: bool = False) -> float:
    """
    Calcule le score prédictif d'une équipe
    
    Args:
        team: {
            "name": "Paris SG",
            "form": ["W","W","D","W","L"],           # 5 derniers
            "goals_scored": 2.1,                     # moyenne par match
            "goals_conceded": 0.8,                   # moyenne par match
            "odds": 1.8                              # cote pour victoire
        }
        is_home: Si l'équipe joue à domicile
    
    Returns:
        0-1 score de force relative
    """
    
    form_score = compute_form(team.get("form", []))
    attack_score = compute_attack(team.get("goals_scored", 1.0))
    defense_score = compute_defense(team.get("goals_conceded", 1.0))
    odds_score = odds_to_probability(team.get("odds", 2.0))
    
    # Bonus domicile
    home_bonus = HOME_ADVANTAGE_VALUE if is_home else 0
    
    # Combinaison pondérée
    total_score = (
        form_score * WEIGHTS["form"]
        + attack_score * WEIGHTS["attack"]
        + defense_score * WEIGHTS["defense"]
        + home_bonus * WEIGHTS["home_advantage"]
        + odds_score * WEIGHTS["odds"]
    )
    
    # Normaliser 0-1
    return min(1.0, max(0.0, total_score))


def predict_match(home_team: Dict, away_team: Dict) -> Dict:
    """
    Prédire le résultat d'un match
    
    Args:
        home_team: équipe à domicile avec stats
        away_team: équipe en déplacement avec stats
    
    Returns:
        {
            "prediction": "HOME|DRAW|AWAY",
            "confidence": 0-1,
            "score_home": 0-1,
            "score_away": 0-1,
            "analysis": {...}
        }
    """
    
    try:
        # Calculer scores des équipes
        score_home = compute_team_score(home_team, is_home=True)
        score_away = compute_team_score(away_team, is_home=False)
        
        # Différence
        diff = score_home - score_away
        
        # Déterminer prédiction (seuil ±5% pour nul)
        DRAW_THRESHOLD = 0.05
        
        if abs(diff) < DRAW_THRESHOLD:
            prediction = "DRAW"
        elif diff > 0:
            prediction = "HOME"
        else:
            prediction = "AWAY"
        
        # Confiance = écart entre les deux scores
        confidence = min(0.95, abs(diff) * 5)
        confidence = max(0.35, confidence)  # Min 35%
        
        # Détail analyse
        analysis = {
            "home_form": round(compute_form(home_team.get("form", [])), 2),
            "away_form": round(compute_form(away_team.get("form", [])), 2),
            "home_attack": round(compute_attack(home_team.get("goals_scored", 1)), 2),
            "away_attack": round(compute_attack(away_team.get("goals_scored", 1)), 2),
            "home_defense": round(compute_defense(home_team.get("goals_conceded", 1)), 2),
            "away_defense": round(compute_defense(away_team.get("goals_conceded", 1)), 2),
            "home_odds_signal": round(odds_to_probability(home_team.get("odds", 2)), 2),
            "away_odds_signal": round(odds_to_probability(away_team.get("odds", 2)), 2),
        }
        
        result = {
            "prediction": prediction,
            "confidence": round(confidence, 2),
            "score_home": round(score_home, 3),
            "score_away": round(score_away, 3),
            "analysis": analysis
        }
        
        logger.info(f"✅ Prédiction: {home_team.get('name', 'Home')} vs {away_team.get('name', 'Away')} → {prediction} (conf: {confidence:.0%})")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Erreur prédiction: {e}")
        return {
            "prediction": "ERROR",
            "confidence": 0.0,
            "score_home": 0.5,
            "score_away": 0.5,
            "analysis": {}
        }


def batch_predict_matches(matches: List[Dict]) -> List[Dict]:
    """
    Prédire plusieurs matchs à la fois
    
    Args:
        matches: Liste de matchs avec home_team et away_team enrichis
    
    Returns:
        Liste de prédictions
    """
    predictions = []
    for match in matches:
        try:
            pred = predict_match(
                match.get("home_team", {}),
                match.get("away_team", {})
            )
            pred["match_id"] = match.get("id")
            pred["league"] = match.get("league")
            predictions.append(pred)
        except Exception as e:
            logger.error(f"Erreur prédiction match: {e}")
            continue
    
    return predictions


# =========================
# ANALYSE PRÉDICTIONS
# =========================

def calculate_prediction_quality(predictions: List[Dict], results: List[Dict]) -> Dict:
    """
    Analyse la qualité des prédictions vs résultats réels
    
    Args:
        predictions: Liste {"prediction": "HOME", "confidence": 0.8, ...}
        results: Liste {"result": "HOME", ...}
    
    Returns:
        Métriques d'accuracy
    """
    
    if not predictions or not results or len(predictions) != len(results):
        return {"error": "Mismatch predictions/results"}
    
    correct = 0
    high_confidence_correct = 0
    low_confidence_correct = 0
    
    for pred, result in zip(predictions, results):
        actual = result.get("result")
        predicted = pred.get("prediction")
        confidence = pred.get("confidence", 0.5)
        
        if predicted == actual:
            correct += 1
            if confidence >= 0.7:
                high_confidence_correct += 1
            else:
                low_confidence_correct += 1
    
    accuracy = correct / len(predictions) if predictions else 0
    
    return {
        "total_predictions": len(predictions),
        "correct": correct,
        "accuracy": round(accuracy, 3),
        "high_confidence_accuracy": round(high_confidence_correct / len([p for p in predictions if p.get("confidence", 0) >= 0.7]) if any(p.get("confidence", 0) >= 0.7 for p in predictions) else 0, 3),
        "low_confidence_accuracy": round(low_confidence_correct / len([p for p in predictions if p.get("confidence", 0) < 0.7]) if any(p.get("confidence", 0) < 0.7 for p in predictions) else 0, 3),
    }
