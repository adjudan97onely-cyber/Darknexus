"""
Routes API Football - Temps RÉEL
Retourne matchs ACTUELS, LIVE et FUTURS de football-data.org
"""

from fastapi import APIRouter, Query
from services.football_api_service import (
    get_live_matches,
    get_todays_matches,
    get_upcoming_matches,
    get_all_current_matches,
    search_by_league,
    search_by_country,
    LEAGUES
)

router = APIRouter()


@router.get("/api/football/health")
async def health_check():
    """Vérification de santé du service football"""
    return {
        "status": "ok",
        "service": "football-data-realtime",
        "api": "football-data.org",
        "notes": "Retourne UNIQUEMENT matchs actuels/futurs (EN COURS + 14 jours)"
    }


@router.get("/api/football/matches/live")
async def get_live():
    """Récupère les matchs EN COURS (status LIVE)"""
    matches = await get_live_matches()
    return {
        "count": len(matches),
        "type": "live",
        "description": "Matchs actuellement en cours",
        "matches": matches
    }


@router.get("/api/football/matches/today")
async def get_today():
    """Récupère les matchs d'AUJOURD'HUI"""
    matches = await get_todays_matches()
    return {
        "count": len(matches),
        "type": "today",
        "description": "Matchs du jour",
        "matches": matches
    }


@router.get("/api/football/matches/upcoming")
async def get_upcoming(days: int = Query(7, ge=1, le=30)):
    """Récupère les prochains matchs (par défaut 7 jours)"""
    matches = await get_upcoming_matches(days=days)
    return {
        "count": len(matches),
        "type": "upcoming",
        "days": days,
        "description": f"Matchs des {days} prochains jours",
        "matches": matches
    }


@router.get("/api/football/matches")
async def get_matches(
    league: str = Query(None),
    country: str = Query(None)
):
    """
    Récupère les matchs ACTUELS et FUTURS (temps réel)
    
    Filtres optionnels:
    - league: bundesliga, ligue1, premier, serie-a, la-liga
    - country: Germany, France, England, Italy, Spain
    
    Note: Retourne UNIQUEMENT matchs actuels/futurs, pas d'archives
    """
    if league:
        matches = await search_by_league(league)
    elif country:
        matches = await search_by_country(country)
    else:
        matches = await get_all_current_matches()
    
    return {
        "count": len(matches),
        "type": "current_and_upcoming",
        "filters": {
            "league": league,
            "country": country
        },
        "description": "Matchs actuels et futurs (14 jours)",
        "matches": matches
    }


@router.get("/api/football/matches/by-league/{league}")
async def get_by_league(league: str):
    """Récupère les matchs ACTUELS/FUTURS d'une ligue spécifique"""
    matches = await search_by_league(league)
    return {
        "count": len(matches),
        "type": "by_league",
        "league": league,
        "description": f"Matchs {league} actuels et futurs",
        "matches": matches
    }


@router.get("/api/football/leagues")
async def get_leagues():
    """Liste les ligues disponibles avec leurs racourcis"""
    leagues_list = [
        {
            "id": v['id'],
            "name": v['name'],
            "country": v['country'],
            "key": k
        }
        for k, v in LEAGUES.items()
    ]
    
    return {
        "count": len(leagues_list),
        "description": "Ligues support temps-réel",
        "leagues": leagues_list
    }

