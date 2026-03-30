"""
Service The-Odds-API
Récupère les cotes en temps réel
"""

import httpx
import logging
import os
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Charge les variables d'environnement
load_dotenv()

logger = logging.getLogger(__name__)

# API The-Odds-API
ODDS_API = "https://api.the-odds-api.com/v4"

# Clé API chargée depuis .env
ODDS_API_KEY = os.getenv("ODDS_API_KEY", "PLACEHOLDER_API_KEY")
if ODDS_API_KEY == "PLACEHOLDER_API_KEY":
    logger.warning("⚠️ ODDS_API_KEY non configurée dans .env")

# Ligues supportées - Clés exactes de The-Odds-API
ODDS_SPORTS = {
    'soccer_england_premier_league': 'Premier League (England)',
    'soccer_germany_bundesliga': 'Bundesliga',
    'soccer_france_ligue_one': 'Ligue 1 (France)',
    'soccer_spain_la_liga': 'La Liga (Spain)',
    'soccer_italy_serie_a': 'Serie A (Italy)',
}

# Marchés disponibles
MARKETS = [
    'h2h',  # Victoire 1/2/X
    'spreads',  # Handicaps
    'totals',  # Over/Under
]


async def fetch_odds_for_upcoming_matches(sport: str = None, region: str = 'eu') -> List[dict]:
    """
    Récupère les cotes pour les matchs à venir de TOUTES les ligues
    Aggrège les résultats de tous les ODDS_SPORTS
    """
    try:
        all_matches = []
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Récupérer les cotes pour chaque ligue
            for sport_key, league_name in ODDS_SPORTS.items():
                url = f"{ODDS_API}/sports/{sport_key}/events"
                params = {
                    'apiKey': ODDS_API_KEY,
                    'region': region,
                    'marketsFilter': ','.join(MARKETS)
                }
                
                try:
                    response = await client.get(url, params=params, timeout=10.0)
                    
                    if response.status_code == 200:
                        data = response.json()
                        # La réponse est directement un array de matches
                        matches = data if isinstance(data, list) else data.get('data', [])
                        
                        formatted = [_format_odds_match(m) for m in matches]
                        league_matches = [m for m in formatted if m]
                        all_matches.extend(league_matches)
                        
                        logger.info(f"✅ {len(league_matches)} matchs {league_name}")
                    
                    elif response.status_code == 429:
                        logger.warning(f"⚠️ Rate limit The-Odds-API")
                        break
                    
                except httpx.TimeoutException:
                    logger.warning(f"⚠️ Timeout pour {league_name}")
                    continue
                except Exception as e:
                    logger.warning(f"⚠️ Erreur récupérant {league_name}: {e}")
                    continue
        
        logger.info(f"✅ Total: {len(all_matches)} matchs avec cotes")
        return all_matches
    
    except Exception as e:
        logger.error(f"❌ Erreur aggrégation odds: {e}")
        return []


async def fetch_odds_by_sport(sport_key: str) -> List[dict]:
    """Récupère les cotes pour un sport spécifique"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            url = f"{ODDS_API}/sports/{sport_key}/events"
            params = {
                'apiKey': ODDS_API_KEY,
                'region': 'eu',
                'marketsFilter': ','.join(MARKETS)
            }
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                # La réponse est directement un array de matches
                matches = data if isinstance(data, list) else data.get('data', [])
                
                formatted = [_format_odds_match(m) for m in matches]
                odds_matches = [m for m in formatted if m]
                
                logger.info(f"✅ {len(odds_matches)} matchs sport {sport_key}")
                return odds_matches
            
            return []
    
    except Exception as e:
        logger.error(f"❌ Erreur fetch odds sport {sport_key}: {e}")
        return []


async def search_odds_by_teams(home_team: str, away_team: str) -> Optional[dict]:
    """
    Recherche les cotes pour un match spécifique (par équipes et date)
    """
    try:
        # Récupérer tous les matchs avec cotes
        all_matches = await fetch_odds_for_upcoming_matches()
        
        # Normaliser noms d'équipes
        home_norm = home_team.lower().strip()
        away_norm = away_team.lower().strip()
        
        # Chercher le match
        for match in all_matches:
            match_home = match.get('homeTeam', '').lower().strip()
            match_away = match.get('awayTeam', '').lower().strip()
            
            if (home_norm in match_home or match_home in home_norm) and \
               (away_norm in match_away or match_away in away_norm):
                return match
        
        logger.info(f"⚠️ Cotes non trouvées pour {home_team} vs {away_team}")
        return None
    
    except Exception as e:
        logger.error(f"❌ Erreur recherche cotes: {e}")
        return None


def _format_odds_match(match: dict) -> Optional[dict]:
    """Formate un match avec cotes"""
    try:
        match_id = match.get('id')
        home_team = match.get('home_team', 'Unknown')
        away_team = match.get('away_team', 'Unknown')
        
        commence_time_str = match.get('commence_time', '')
        if not commence_time_str:
            return None
        
        match_date = datetime.fromisoformat(commence_time_str.replace('Z', '+00:00'))
        
        # Extraire les bookmakers et cotes
        bookmakers = match.get('bookmakers', [])
        
        odds_data = {
            'id': match_id,
            'homeTeam': home_team,
            'awayTeam': away_team,
            'matchDateTime': match_date.isoformat(),
            'date': match_date.strftime('%Y-%m-%d'),
            'time': match_date.strftime('%H:%M'),
            'sport': match.get('sport_title', 'Soccer'),
            'league': match.get('league_title', 'Unknown'),
            'bookmakers': _extract_bookmaker_odds(bookmakers),
            'implied_probabilities': _calculate_implied_probabilities(bookmakers)
        }
        
        return odds_data
    
    except Exception as e:
        logger.warning(f"⚠️ Erreur formatage odds match: {e}")
        return None


def _extract_bookmaker_odds(bookmakers: list) -> Dict[str, dict]:
    """Extrait les cotes par bookmaker"""
    odds_by_bookmaker = {}
    
    for bookmaker in bookmakers:
        bm_name = bookmaker.get('title', 'Unknown')
        markets = bookmaker.get('markets', [])
        
        bm_odds = {}
        
        for market in markets:
            market_key = market.get('key', '')
            outcomes = market.get('outcomes', [])
            
            bm_odds[market_key] = {}
            
            for outcome in outcomes:
                outcome_name = outcome.get('name', '')
                price = outcome.get('price', 0)
                
                if outcome_name and price:
                    bm_odds[market_key][outcome_name] = price
        
        if bm_odds:
            odds_by_bookmaker[bm_name] = bm_odds
    
    return odds_by_bookmaker


def _calculate_implied_probabilities(bookmakers: list) -> Dict[str, float]:
    """Calcule les probabilités implicites from h2h odds"""
    
    try:
        # Prendre le premier bookmaker disponible
        if not bookmakers:
            return {}
        
        bookmaker = bookmakers[0]
        markets = bookmaker.get('markets', [])
        
        # Chercher h2h (victoire)
        h2h = None
        for market in markets:
            if market.get('key') == 'h2h':
                h2h = market.get('outcomes', [])
                break
        
        if not h2h or len(h2h) < 2:
            return {}
        
        # Extraire les cotes décimales
        # Format: [{"name": "Home", "price": X.XX}, {"name": "Away", "price": Y.YY}]
        odds_list = []
        names_list = []
        
        for outcome in h2h:
            names_list.append(outcome.get('name', ''))
            price = outcome.get('price', 0)
            if price > 0:
                # Convertir cote décimale en probabilité implicite
                # Prob = 1 / cote
                implicit_prob = 1.0 / price
                odds_list.append(implicit_prob)
            else:
                odds_list.append(0)
        
        # Normaliser (diviser par somme)
        total = sum(odds_list)
        if total > 0:
            probabilities = {
                'home_win': (odds_list[0] / total) * 100 if len(odds_list) > 0 else 0,
                'away_win': (odds_list[1] / total) * 100 if len(odds_list) > 1 else 0,
                'draw': (odds_list[2] / total) * 100 if len(odds_list) > 2 else 0,
            }
            return probabilities
        
        return {}
    
    except Exception as e:
        logger.warning(f"⚠️ Erreur calcul probabilités: {e}")
        return {}


async def get_available_sports() -> List[dict]:
    """Récupère les sports et ligues disponibles"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{ODDS_API}/sports"
            params = {'apiKey': ODDS_API_KEY}
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                sports = response.json()
                logger.info(f"✅ {len(sports)} ligues récupérées")
                return sports
            
            return []
    
    except Exception as e:
        logger.error(f"❌ Erreur récupération ligues: {e}")
        return []
