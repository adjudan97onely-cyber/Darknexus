"""
Service d'Enrichissement
Fusionne matchs (football-data) + cotes (the-odds-api)
"""

import logging
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from services.football_api_service import (
    get_all_current_matches,
    search_by_league,
    search_by_country
)
from services.odds_api_service import (
    fetch_odds_for_upcoming_matches,
    search_odds_by_teams
)

logger = logging.getLogger(__name__)


async def get_enriched_matches(league: Optional[str] = None, country: Optional[str] = None) -> List[dict]:
    """
    Récupère les matchs ET enrichit avec les cotes
    
    Retourne: matchs + odds + probabilités implicites
    """
    try:
        # Étape 1: Récupérer matchs temps réel
        if league:
            matches = await search_by_league(league)
        elif country:
            matches = await search_by_country(country)
        else:
            matches = await get_all_current_matches()
        
        logger.info(f"📊 {len(matches)} matchs football-data récupérés")
        
        # Étape 2: Récupérer les cotes
        odds_matches = await fetch_odds_for_upcoming_matches()
        logger.info(f"💰 {len(odds_matches)} matchs avec cotes récupérés")
        
        # Étape 3: Enrichir chaque match
        enriched = []
        for match in matches:
            enriched_match = await _enrich_single_match(match, odds_matches)
            enriched.append(enriched_match)
        
        logger.info(f"✅ {len(enriched)} matchs enrichis (matchs + cotes)")
        return enriched
    
    except Exception as e:
        logger.error(f"❌ Erreur enrichissement: {e}")
        return []


async def _enrich_single_match(match: dict, odds_matches: List[dict]) -> dict:
    """
    Enrichit UN match avec les cotes correspondantes
    Matching par équipes et proximité de date
    """
    
    home_team = match.get('homeTeam', '')
    away_team = match.get('awayTeam', '')
    match_date_str = match.get('matchDateTime', '')
    
    # Parser la date du match
    try:
        match_date = datetime.fromisoformat(match_date_str.replace('Z', '+00:00'))
    except:
        match_date = None
    
    # Chercher les cotes correspondantes
    matching_odds = None
    best_similarity = 0
    
    for odds_match in odds_matches:
        odds_home = odds_match.get('homeTeam', '').lower().strip()
        odds_away = odds_match.get('awayTeam', '').lower().strip()
        
        match_home_norm = home_team.lower().strip()
        match_away_norm = away_team.lower().strip()
        
        # Vérifier les équipes
        home_match = _teams_match(match_home_norm, odds_home)
        away_match = _teams_match(match_away_norm, odds_away)
        
        if home_match and away_match:
            # Vérifier la date (même jour, ±2 heures)
            if match_date:
                try:
                    odds_date_str = odds_match.get('matchDateTime', '')
                    odds_date = datetime.fromisoformat(odds_date_str.replace('Z', '+00:00'))
                    
                    time_diff = abs((match_date - odds_date).total_seconds() / 3600)
                    
                    if time_diff <= 2:  # Même match si ≤ 2h d'écart
                        matching_odds = odds_match
                        break
                except:
                    pass
            else:
                matching_odds = odds_match
                break
    
    # Construire le match enrichi
    enriched = {
        **match,  # Garder toutes les données football-data
        'enrichment': {
            'hasOdds': matching_odds is not None,
            'odds': matching_odds if matching_odds else None,
            'impliedProbabilities': matching_odds.get('implied_probabilities', {}) if matching_odds else {}
        }
    }
    
    return enriched


def _teams_match(team1: str, team2: str, min_overlap: int = 3) -> bool:
    """
    Détermine si deux noms d'équipes correspondent
    Utilise une simple vérification de chevauchement de caractères
    """
    
    # Cas exact
    if team1 == team2:
        return True
    
    # Vérifier que l'un contient l'autre (partiellement)
    # Ex: "Manchester United" et "Man United"
    
    words1 = team1.split()
    words2 = team2.split()
    
    # Comparer les mots significatifs (≥ 3 lettres)
    sig_words1 = [w for w in words1 if len(w) >= 3]
    sig_words2 = [w for w in words2 if len(w) >= 3]
    
    # Vérifier le chevauchement
    matches = 0
    for w1 in sig_words1:
        for w2 in sig_words2:
            if w1.startswith(w2) or w2.startswith(w1):
                matches += 1
    
    # Si au moins 1 mot majeur correspond
    return matches >= 1


async def search_enriched_match(home_team: str, away_team: str) -> Optional[dict]:
    """Cherche UN match spécifique enrichi"""
    
    try:
        # Récupérer directement du service odds
        odds_match = await search_odds_by_teams(home_team, away_team)
        
        if odds_match:
            return {
                'homeTeam': home_team,
                'awayTeam': away_team,
                'enrichment': {
                    'hasOdds': True,
                    'odds': odds_match,
                    'impliedProbabilities': odds_match.get('implied_probabilities', {})
                }
            }
        
        # Sinon pas de cotes disponibles
        return {
            'homeTeam': home_team,
            'awayTeam': away_team,
            'enrichment': {
                'hasOdds': False,
                'odds': None,
                'impliedProbabilities': {}
            }
        }
    
    except Exception as e:
        logger.error(f"❌ Erreur recherche enrichie: {e}")
        return None


def extract_odds_signal(enriched_match: dict) -> Dict[str, float]:
    """
    Extrait les signaux de prédiction des cotes
    Retourne des scores -1.0 à 1.0 pour le système IA
    
    -1.0 = victoire away probable
    0.0 = match équilibré
    1.0 = victoire home probable
    """
    
    enrichment = enriched_match.get('enrichment', {})
    
    if not enrichment.get('hasOdds'):
        return {'home_signal': 0.0, 'confidence': 0.0}
    
    implied_probs = enrichment.get('impliedProbabilities', {})
    
    if not implied_probs:
        return {'home_signal': 0.0, 'confidence': 0.0}
    
    home_prob = implied_probs.get('home_win', 50.0)
    away_prob = implied_probs.get('away_win', 50.0)
    
    # Normaliser à -1.0 à 1.0
    # home_prob > away_prob → signal positif
    # away_prob > home_prob → signal négatif
    
    prob_diff = home_prob - away_prob
    
    signal = prob_diff / 100.0  # Normaliser
    confidence = (abs(home_prob - 50.0) / 50.0) * 0.8  # Max 0.8 de confiance
    
    return {
        'home_signal': signal,
        'away_signal': -signal,
        'confidence': min(confidence, 0.8),
        'home_probability': home_prob,
        'away_probability': away_prob
    }
