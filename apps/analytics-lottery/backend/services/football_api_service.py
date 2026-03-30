"""
Service Football - TEMPS RÉEL
Récupère MATCHS ACTUELS, du JOUR et FUTURS
Utilise football-data.org API (matchs actuels/futurs UNIQUEMENT)
"""

import httpx
import logging
import os
from datetime import datetime, timedelta
from typing import List, Optional
from dotenv import load_dotenv

# Charge les variables d'environnement
load_dotenv()

logger = logging.getLogger(__name__)

# API football-data.org - Temps réel
FOOTBALL_DATA_API = "https://api.football-data.org/v4"

# Clé API chargée depuis .env
FOOTBALL_DATA_KEY = os.getenv("FOOTBALL_DATA_KEY", "PLACEHOLDER_API_KEY")
if FOOTBALL_DATA_KEY == "PLACEHOLDER_API_KEY":
    logger.warning("⚠️ FOOTBALL_DATA_KEY non configurée dans .env")

# Ligues actuelles
LEAGUES = {
    'bundesliga': {'id': 'BL1', 'name': 'Bundesliga', 'country': 'Germany'},
    'ligue1': {'id': 'FL1', 'name': 'Ligue 1', 'country': 'France'},
    'premier': {'id': 'PL', 'name': 'Premier League', 'country': 'England'},
    'serie-a': {'id': 'SA', 'name': 'Serie A', 'country': 'Italy'},
    'la-liga': {'id': 'PD', 'name': 'La Liga', 'country': 'Spain'},
}


async def get_live_matches() -> List[dict]:
    """Récupère les matchs EN COURS (LIVE)"""
    try:
        headers = {"X-Auth-Token": FOOTBALL_DATA_KEY}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{FOOTBALL_DATA_API}/matches?status=LIVE"
            response = await client.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                matches = data.get('matches', [])
                
                formatted = [_format_match(m) for m in matches]
                live_matches = [m for m in formatted if m]
                
                logger.info(f"✅ {len(live_matches)} matchs EN COURS")
                return live_matches
            
            logger.warning(f"⚠️ Erreur API LIVE: {response.status_code}")
            return []
    
    except Exception as e:
        logger.error(f"❌ Erreur matchs live: {e}")
        return []


async def get_todays_matches() -> List[dict]:
    """Récupère les matchs du JOUR"""
    today = datetime.now().strftime('%Y-%m-%d')
    
    try:
        headers = {"X-Auth-Token": FOOTBALL_DATA_KEY}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{FOOTBALL_DATA_API}/matches?dateFrom={today}&dateTo={today}"
            response = await client.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                matches = data.get('matches', [])
                
                formatted = [_format_match(m) for m in matches]
                today_matches = [m for m in formatted if m]
                
                logger.info(f"✅ {len(today_matches)} matchs AUJOURD'HUI")
                return today_matches
            
            logger.warning(f"⚠️ Erreur API aujourd'hui: {response.status_code}")
            return []
    
    except Exception as e:
        logger.error(f"❌ Erreur matchs du jour: {e}")
        return []


async def get_upcoming_matches(days: int = 7) -> List[dict]:
    """Récupère les matchs des X prochains jours"""
    today = datetime.now().strftime('%Y-%m-%d')
    future = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')
    
    try:
        headers = {"X-Auth-Token": FOOTBALL_DATA_KEY}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{FOOTBALL_DATA_API}/matches?status=SCHEDULED&dateFrom={today}&dateTo={future}"
            response = await client.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                matches = data.get('matches', [])
                
                formatted = [_format_match(m) for m in matches]
                upcoming = [m for m in formatted if m]
                
                logger.info(f"✅ {len(upcoming)} matchs à venir (7j)")
                return upcoming
            
            logger.warning(f"⚠️ Erreur API futurs: {response.status_code}")
            return []
    
    except Exception as e:
        logger.error(f"❌ Erreur matchs futurs: {e}")
        return []


async def get_all_current_matches() -> List[dict]:
    """Récupère TOUS les matchs actuels/futurs"""
    try:
        live = await get_live_matches()
        today = await get_todays_matches()
        upcoming = await get_upcoming_matches(days=14)
        
        # Combiner et dédupliquer par ID
        all_matches = live + today + upcoming
        seen_ids = set()
        unique_matches = []
        
        for match in all_matches:
            match_id = match.get('id')
            if match_id not in seen_ids:
                seen_ids.add(match_id)
                unique_matches.append(match)
        
        unique_matches.sort(key=lambda m: m.get('matchDateTime', ''))
        logger.info(f"✅ Total: {len(unique_matches)} matchs actuels/futurs")
        
        return unique_matches
    
    except Exception as e:
        logger.error(f"❌ Erreur collecte matchs: {e}")
        return []


async def search_by_league(league_filter: str) -> List[dict]:
    """Recherche matchs ACTUELS/FUTURS d'une ligue spécifique"""
    league_filter = league_filter.lower().strip()
    
    league_info = None
    for key, l in LEAGUES.items():
        if league_filter in [key, l['name'].lower()]:
            league_info = l
            break
    
    if not league_info:
        logger.warning(f"⚠️ Ligue non trouvée: {league_filter}")
        return []
    
    try:
        headers = {"X-Auth-Token": FOOTBALL_DATA_KEY}
        today = datetime.now().strftime('%Y-%m-%d')
        future = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{FOOTBALL_DATA_API}/competitions/{league_info['id']}/matches?status=SCHEDULED,LIVE,TIMED,FINISHED&dateFrom={today}&dateTo={future}"
            response = await client.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                matches = data.get('matches', [])
                
                # Filtrer: garder seulement LIVE, SCHEDULED, TIMED (pas FINISHED)
                matches = [m for m in matches if m.get('status') in ['LIVE', 'SCHEDULED', 'TIMED']]
                
                formatted = [_format_match(m, league_info['country']) for m in matches]
                league_matches = [m for m in formatted if m]
                
                logger.info(f"✅ {len(league_matches)} matchs {league_filter} (actuels/futurs)")
                return league_matches
            
            logger.warning(f"⚠️ Erreur API {league_filter}: {response.status_code}")
            return []
    
    except Exception as e:
        logger.error(f"❌ Erreur recherche ligue {league_filter}: {e}")
        return []


async def search_by_country(country_filter: str) -> List[dict]:
    """Recherche matchs ACTUELS/FUTURS d'un pays"""
    country_filter = country_filter.lower().strip()
    
    matching = [
        l for l in LEAGUES.values()
        if country_filter in l['country'].lower()
    ]
    
    if not matching:
        logger.warning(f"⚠️ Pays non trouvé: {country_filter}")
        return []
    
    all_matches = []
    for league_info in matching:
        try:
            headers = {"X-Auth-Token": FOOTBALL_DATA_KEY}
            today = datetime.now().strftime('%Y-%m-%d')
            future = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{FOOTBALL_DATA_API}/competitions/{league_info['id']}/matches?status=SCHEDULED,LIVE,TIMED,FINISHED&dateFrom={today}&dateTo={future}"
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    matches = data.get('matches', [])
                    
                    for m in matches:
                        fm = _format_match(m, league_info['country'])
                        if fm:
                            all_matches.append(fm)
        
        except Exception as e:
            logger.warning(f"⚠️ Erreur {league_info['name']}: {e}")
    
    all_matches.sort(key=lambda m: m.get('matchDateTime', ''))
    logger.info(f"✅ {len(all_matches)} matchs pays {country_filter} (actuels/futurs)")
    
    return all_matches


def _format_match(match: dict, country: str = 'Unknown') -> Optional[dict]:
    """Formate un match football-data.org en format standardisé"""
    try:
        status = match.get('status', 'TIMED')
        utc_date = match.get('utcDate', '')
        
        if not utc_date:
            return None
        
        # Parser la date ISO
        match_date = datetime.fromisoformat(utc_date.replace('Z', '+00:00'))
        
        # Extraire équipes
        home = match.get('homeTeam', {})
        away = match.get('awayTeam', {})
        
        # Déterminer le statut pour le frontend
        if status == 'LIVE':
            display_status = 'live'
        elif status == 'FINISHED':
            display_status = 'finished'
        else:
            display_status = 'scheduled'
        
        # Extraire résultats si disponibles
        score = match.get('score', {})
        goals_home = score.get('fullTime', {}).get('home')
        goals_away = score.get('fullTime', {}).get('away')
        
        # Créer la réponse formatée
        return {
            'id': match.get('id'),
            'homeTeam': home.get('name', 'Unknown'),
            'awayTeam': away.get('name', 'Unknown'),
            'league': match.get('competition', {}).get('name', 'Unknown'),
            'country': country,
            'matchDateTime': match_date.isoformat(),
            'time': match_date.strftime('%H:%M'),
            'date': match_date.strftime('%Y-%m-%d'),
            'status': display_status,
            'matchday': match.get('season', {}).get('currentMatchday'),
            'goalsHome': goals_home,
            'goalsAway': goals_away,
            'confidence': 92 if status == 'LIVE' else 85
        }
    
    except Exception as e:
        logger.warning(f"⚠️ Erreur formatage match: {e}")
        return None
