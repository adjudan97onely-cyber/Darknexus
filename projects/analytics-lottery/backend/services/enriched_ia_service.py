"""
Service IA Enrichi - Prédictions Football
Utilise football_brain pour vraie IA + odds comme signal
"""

import logging
from typing import Dict, Optional, List
from services.football_brain import predict_match, compute_team_score, odds_to_probability
from services.prediction_storage import save_match_prediction

logger = logging.getLogger(__name__)


def combine_predictions(enriched_match: dict) -> Dict[str, any]:
    """
    Combine prédictions footer via football_brain
    
    Prend un match enrichi et retourne prédiction professionnelle
    en utilisant vraie IA (pas placeholders)
    """
    
    try:
        # Récupérer données du match
        home_team_name = enriched_match.get('homeTeam', 'Unknown')
        away_team_name = enriched_match.get('awayTeam', 'Unknown')
        league = enriched_match.get('league', 'Unknown')
        match_id = enriched_match.get('id', 'unknown')
        
        # Récupérer stats enrichies (si disponibles)
        # Format: {"homeTeam": {...stats...}, "awayTeam": {...stats...}}
        home_team_stats = enriched_match.get('homeTeamStats', {})
        away_team_stats = enriched_match.get('awayTeamStats', {})
        
        # Récupérer cotes
        odds_signal = enriched_match.get('odds_signal', {})
        home_odds = odds_signal.get('home', 2.0)  # Défaut 1/2 chance
        away_odds = odds_signal.get('away', 2.0)
        
        # Construire teams pour football_brain
        # Si pas de stats enrichies, créer structure avec cotes
        home_team = {
            'name': home_team_name,
            'form': home_team_stats.get('form', ['D', 'D', 'D', 'D', 'D']),  # 5 derniers
            'goals_scored': home_team_stats.get('goals_scored', 1.5),
            'goals_conceded': home_team_stats.get('goals_conceded', 1.2),
            'odds': home_odds
        }
        
        away_team = {
            'name': away_team_name,
            'form': away_team_stats.get('form', ['D', 'D', 'D', 'D', 'D']),
            'goals_scored': away_team_stats.get('goals_scored', 1.5),
            'goals_conceded': away_team_stats.get('goals_conceded', 1.2),
            'odds': away_odds
        }
        
        # UTILISER FOOTBALL BRAIN - Vraie IA
        brain_prediction = predict_match(home_team, away_team)
        
        if brain_prediction.get('prediction') == 'ERROR':
            logger.warning(f"⚠️  Football brain error, retour données brutes")
            
            # Fallback: utiliser juste odds
            odds_signal_home = odds_to_probability(home_odds)
            odds_signal_away = odds_to_probability(away_odds)
            
            if odds_signal_home > odds_signal_away * 1.1:
                prediction = 'HOME'
            elif odds_signal_away > odds_signal_home * 1.1:
                prediction = 'AWAY'
            else:
                prediction = 'DRAW'
            
            confidence = min(0.75, abs(odds_signal_home - odds_signal_away))
            analysis = {'fallback': True}
        else:
            prediction = brain_prediction.get('prediction', 'DRAW')
            confidence = brain_prediction.get('confidence', 0.5)
            analysis = brain_prediction.get('analysis', {})
        
        # Format pour frontend (compatible ancien API)
        result = {
            'id': match_id,
            'homeTeam': home_team_name,
            'awayTeam': away_team_name,
            'league': league,
            'prediction': {
                'outcome': prediction,         # HOME/DRAW/AWAY
                'confidence': confidence,      # 0-1
                'matchDateTime': enriched_match.get('matchDateTime', '')
            },
            'analysis': analysis,  # Détails form/attack/defense/odds
            'odds_signal': odds_signal,
            'enrichment': enriched_match.get('enrichment', {})
        }
        
        # Optionnel: sauvegarder pour tracking accuracy
        # save_match_prediction(
        #     match_id=match_id,
        #     league=league,
        #     home_team=home_team_name,
        #     away_team=away_team_name,
        #     prediction=prediction,
        #     confidence=confidence,
        #     analysis=analysis
        # )
        
        logger.info(f"✅ Prédiction: {home_team_name} vs {away_team_name} → {prediction} ({confidence:.0%})")
        
        return result
    
    except Exception as e:
        logger.error(f"❌ Erreur prediction combinée: {e}", exc_info=True)
        # Retourner prédiction neutre en cas d'erreur
        return {
            'homeTeam': enriched_match.get('homeTeam', 'Unknown'),
            'awayTeam': enriched_match.get('awayTeam', 'Unknown'),
            'league': enriched_match.get('league', 'Unknown'),
            'prediction': {
                'outcome': 'DRAW',
                'confidence': 0.5
            },
            'error': str(e)
        }


def batch_predictions(enriched_matches: list) -> list:
    """Génère des prédictions pour une liste de matchs"""
    
    predictions = []
    
    for match in enriched_matches:
        pred = combine_predictions(match)
        if pred:
            predictions.append(pred)
    
    logger.info(f"✅ {len(predictions)} prédictions générées")
    
    return predictions


def get_prediction_quality_metrics(predictions: list) -> Dict:
    """
    Calcule des métriques sur la qualité des prédictions
    (À utiliser après avoir des résultats réels)
    """
    
    if not predictions:
        return {}
    
    try:
        total = len(predictions)
        high_confidence = len([p for p in predictions if p.get('prediction', {}).get('confidence', 0) > 0.7])
        medium_confidence = len([p for p in predictions if 0.5 <= p.get('prediction', {}).get('confidence', 0) <= 0.7])
        low_confidence = len([p for p in predictions if p.get('prediction', {}).get('confidence', 0) < 0.5])
        
        return {
            'total_predictions': total,
            'high_confidence_count': high_confidence,
            'high_confidence_pct': (high_confidence / total * 100) if total > 0 else 0,
            'medium_confidence_count': medium_confidence,
            'medium_confidence_pct': (medium_confidence / total * 100) if total > 0 else 0,
            'low_confidence_count': low_confidence,
            'low_confidence_pct': (low_confidence / total * 100) if total > 0 else 0,
            'average_confidence': sum([p.get('prediction', {}).get('confidence', 0) for p in predictions]) / total if total > 0 else 0
        }
    
    except Exception as e:
        logger.error(f"❌ Erreur calcul métriques: {e}")
        return {}
