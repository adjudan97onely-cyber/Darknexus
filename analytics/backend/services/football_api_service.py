"""
Service Football — football-data.org v4
Couvre : Ligue 1, Premier League, La Liga, Serie A, Bundesliga
"""

import httpx
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

FOOTBALL_DATA_KEY  = os.getenv("FOOTBALL_DATA_KEY", "")
FOOTBALL_DATA_BASE = "https://api.football-data.org/v4"

HEADERS = {
    "X-Auth-Token": FOOTBALL_DATA_KEY,
}

if not FOOTBALL_DATA_KEY:
    logger.warning("⚠️ FOOTBALL_DATA_KEY non configurée dans .env")

# Codes des ligues cibles sur football-data.org
TARGET_COMPETITIONS = {
    "PL":  {"name": "Premier League", "country": "England"},
    "FL1": {"name": "Ligue 1",        "country": "France"},
    "PD":  {"name": "Primera Division", "country": "Spain"},
    "SA":  {"name": "Serie A",        "country": "Italy"},
    "BL1": {"name": "Bundesliga",     "country": "Germany"},
}

# Alias de compatibilité
LEAGUES = TARGET_COMPETITIONS

# Alias pour normaliser les noms de ligue
LEAGUE_ALIASES = {
    "primera division": "La Liga",
    "primera división": "La Liga",
    "pd": "La Liga",
}


def _normalize_league(name: str) -> str:
    return LEAGUE_ALIASES.get(name.lower(), name)


def _format_match(match: dict, competition_code: str) -> Optional[dict]:
    """Convertit un match football-data.org en format interne."""
    try:
        home = match.get("homeTeam", {}) or {}
        away = match.get("awayTeam", {}) or {}
        competition = match.get("competition", {}) or {}
        area = match.get("area", {}) or {}

        utc_date = match.get("utcDate", "")
        if not utc_date:
            return None

        match_dt = datetime.fromisoformat(utc_date.replace("Z", "+00:00"))

        status_raw = match.get("status", "TIMED")
        if status_raw in ("IN_PLAY", "PAUSED", "HALFTIME"):
            display_status = "live"
        elif status_raw == "FINISHED":
            display_status = "finished"
        else:
            display_status = "scheduled"

        score_home = score_away = None
        if display_status in ("live", "finished"):
            score = match.get("score", {}) or {}
            full = score.get("fullTime", {}) or {}
            score_home = full.get("home")
            score_away = full.get("away")

        league_name = _normalize_league(competition.get("name", "Unknown"))
        country = area.get("name", TARGET_COMPETITIONS.get(competition_code, {}).get("country", "Unknown"))

        return {
            "id":            match.get("id"),
            "homeTeam":      home.get("name", "Unknown"),
            "awayTeam":      away.get("name", "Unknown"),
            "league":        league_name,
            "country":       country,
            "matchDateTime": match_dt.isoformat(),
            "time":          match_dt.strftime("%H:%M"),
            "date":          match_dt.strftime("%Y-%m-%d"),
            "status":        display_status,
            "goalsHome":     score_home,
            "goalsAway":     score_away,
            "tournamentId":  competition.get("id"),
            "confidence":    85,
        }
    except Exception as e:
        logger.warning(f"⚠️ Erreur formatage match: {e}")
        return None


async def _fetch_competition_matches(code: str, date_from: str, date_to: str, status: str = "SCHEDULED,TIMED") -> List[dict]:
    """Récupère les matchs d'une compétition entre deux dates."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            url = f"{FOOTBALL_DATA_BASE}/competitions/{code}/matches"
            params = {"dateFrom": date_from, "dateTo": date_to, "status": status}
            resp = await client.get(url, headers=HEADERS, params=params)

            if resp.status_code == 200:
                data = resp.json()
                matches = data.get("matches", [])
                formatted = [_format_match(m, code) for m in matches]
                return [m for m in formatted if m]

            logger.warning(f"⚠️ football-data.org {code}: HTTP {resp.status_code}")
            return []

    except Exception as e:
        logger.error(f"❌ Erreur fetch {code}: {e}")
        return []


async def get_live_matches() -> List[dict]:
    """Matchs EN COURS dans les ligues cibles."""
    all_matches: List[dict] = []
    seen_ids = set()

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for code in TARGET_COMPETITIONS:
        matches = await _fetch_competition_matches(code, today, today, status="IN_PLAY,PAUSED,HALFTIME")
        for m in matches:
            mid = m.get("id")
            if mid not in seen_ids:
                seen_ids.add(mid)
                all_matches.append(m)

    logger.info(f"✅ {len(all_matches)} matchs LIVE (ligues cibles)")
    return all_matches


async def get_todays_matches() -> List[dict]:
    """Matchs du jour dans les ligues cibles."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    all_matches: List[dict] = []
    seen_ids = set()

    for code in TARGET_COMPETITIONS:
        matches = await _fetch_competition_matches(code, today, today, status="SCHEDULED,TIMED,IN_PLAY,PAUSED")
        for m in matches:
            mid = m.get("id")
            if mid not in seen_ids:
                seen_ids.add(mid)
                all_matches.append(m)

    logger.info(f"✅ {len(all_matches)} matchs AUJOURD'HUI (ligues cibles)")
    return all_matches


async def get_upcoming_matches(days: int = 7) -> List[dict]:
    """Matchs des X prochains jours dans les ligues cibles."""
    date_from = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    date_to   = (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%Y-%m-%d")

    all_matches: List[dict] = []
    seen_ids = set()

    for code in TARGET_COMPETITIONS:
        matches = await _fetch_competition_matches(code, date_from, date_to, status="SCHEDULED,TIMED")
        for m in matches:
            if m.get("status") == "finished":
                continue
            mid = m.get("id")
            if mid not in seen_ids:
                seen_ids.add(mid)
                all_matches.append(m)

    all_matches.sort(key=lambda m: m.get("matchDateTime", ""))
    logger.info(f"✅ {len(all_matches)} matchs à venir ({days}j, ligues cibles)")
    return all_matches


async def get_all_current_matches() -> List[dict]:
    """Live + aujourd'hui + prochains 14 jours, dédupliqués."""
    try:
        live     = await get_live_matches()
        today    = await get_todays_matches()
        upcoming = await get_upcoming_matches(days=14)

        seen_ids = set()
        unique: List[dict] = []
        for m in live + today + upcoming:
            mid = m.get("id")
            if mid not in seen_ids:
                seen_ids.add(mid)
                unique.append(m)

        unique.sort(key=lambda m: m.get("matchDateTime", ""))
        logger.info(f"✅ Total: {len(unique)} matchs actuels/futurs")
        return unique

    except Exception as e:
        logger.error(f"❌ Erreur collecte: {e}")
        return []


async def search_by_league(league_filter: str) -> List[dict]:
    """Matchs à venir d'une ligue spécifique."""
    league_lower = league_filter.lower().strip()
    matches = await get_upcoming_matches(days=14)
    result = [
        m for m in matches
        if league_lower in m.get("league", "").lower()
        or league_lower in m.get("country", "").lower()
    ]
    logger.info(f"✅ {len(result)} matchs pour '{league_filter}'")
    return result


async def search_by_country(country_filter: str) -> List[dict]:
    """Matchs à venir d'un pays spécifique."""
    country_lower = country_filter.lower().strip()
    matches = await get_upcoming_matches(days=14)
    result = [
        m for m in matches
        if country_lower in m.get("country", "").lower()
    ]
    logger.info(f"✅ {len(result)} matchs pour pays '{country_filter}'")
    return result
