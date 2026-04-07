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


COMPETITIONS_PARAM = ",".join(TARGET_COMPETITIONS.keys())  # "PL,FL1,PD,SA,BL1"


async def _fetch_bulk_matches(date_from: str, date_to: str, status: str = "SCHEDULED,TIMED") -> List[dict]:
    """Une seule requête pour toutes les ligues cibles — évite le rate-limiting du plan gratuit."""
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            url = f"{FOOTBALL_DATA_BASE}/matches"
            params = {
                "dateFrom":     date_from,
                "dateTo":       date_to,
                "status":       status,
                "competitions": COMPETITIONS_PARAM,
            }
            resp = await client.get(url, headers=HEADERS, params=params)

            if resp.status_code == 200:
                data = resp.json()
                matches = data.get("matches", [])
                logger.info(f"✅ football-data.org /v4/matches: {len(matches)} matchs ({date_from} → {date_to})")
                formatted = []
                for m in matches:
                    code = (m.get("competition") or {}).get("code", "")
                    fmt = _format_match(m, code)
                    if fmt:
                        formatted.append(fmt)
                return formatted

            logger.warning(f"⚠️ football-data.org /v4/matches: HTTP {resp.status_code} — {resp.text[:300]}")
            return []

    except Exception as e:
        logger.error(f"❌ Erreur _fetch_bulk_matches: {e}")
        return []


async def get_live_matches() -> List[dict]:
    """Matchs EN COURS dans les ligues cibles."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    matches = await _fetch_bulk_matches(today, today, status="IN_PLAY,PAUSED,HALFTIME")
    logger.info(f"✅ {len(matches)} matchs LIVE")
    return matches


async def get_todays_matches() -> List[dict]:
    """Matchs du jour dans les ligues cibles."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    matches = await _fetch_bulk_matches(today, today, status="SCHEDULED,TIMED,IN_PLAY,PAUSED,HALFTIME,FINISHED")
    logger.info(f"✅ {len(matches)} matchs AUJOURD'HUI")
    return matches


async def get_upcoming_matches(days: int = 7) -> List[dict]:
    """Matchs des X prochains jours dans les ligues cibles."""
    date_from = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    date_to   = (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%Y-%m-%d")

    matches = await _fetch_bulk_matches(date_from, date_to, status="SCHEDULED,TIMED")
    result = [m for m in matches if m.get("status") != "finished"]
    result.sort(key=lambda m: m.get("matchDateTime", ""))
    logger.info(f"✅ {len(result)} matchs à venir ({days}j)")
    return result


async def get_all_current_matches() -> List[dict]:
    """Matchs actuels + prochains 14 jours en une seule requête."""
    try:
        date_from = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        date_to   = (datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%d")

        matches = await _fetch_bulk_matches(
            date_from, date_to,
            status="SCHEDULED,TIMED,IN_PLAY,PAUSED,HALFTIME"
        )
        matches.sort(key=lambda m: m.get("matchDateTime", ""))
        logger.info(f"✅ Total: {len(matches)} matchs actuels/futurs")
        return matches

    except Exception as e:
        logger.error(f"❌ Erreur get_all_current_matches: {e}")
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


async def get_finished_matches(days_ago: int = 30) -> List[dict]:
    """Matchs terminés des X derniers jours — découpe en tranches de 10 jours (limite API gratuite)."""
    all_matches = []
    now = datetime.now(timezone.utc)
    chunk_size = 10  # football-data.org gratuit = max 10 jours par requête

    days_remaining = days_ago
    while days_remaining > 0:
        chunk = min(days_remaining, chunk_size)
        date_to   = (now - timedelta(days=days_ago - days_remaining)).strftime("%Y-%m-%d")
        date_from = (now - timedelta(days=days_ago - days_remaining + chunk)).strftime("%Y-%m-%d")
        matches = await _fetch_bulk_matches(date_from, date_to, status="FINISHED")
        all_matches.extend(matches)
        days_remaining -= chunk

    logger.info(f"✅ {len(all_matches)} matchs terminés (derniers {days_ago}j, {(days_ago + chunk_size - 1) // chunk_size} requêtes)")
    return all_matches


def build_team_stats(finished_matches: List[dict]) -> dict:
    """
    Construit les statistiques récentes de chaque équipe depuis les matchs terminés.
    Retourne: {team_name: {form, goals_scored, goals_conceded, odds}}
    """
    from collections import defaultdict
    team_data: dict = defaultdict(lambda: {"results": [], "goals_for": [], "goals_against": []})

    for m in finished_matches:
        home = m.get("homeTeam")
        away = m.get("awayTeam")
        gh   = m.get("goalsHome")
        ga   = m.get("goalsAway")

        if not all([home, away, gh is not None, ga is not None]):
            continue
        try:
            gh, ga = int(gh), int(ga)
        except (ValueError, TypeError):
            continue

        # Équipe domicile
        team_data[home]["goals_for"].append(gh)
        team_data[home]["goals_against"].append(ga)
        team_data[home]["results"].append("W" if gh > ga else ("D" if gh == ga else "L"))

        # Équipe extérieur
        team_data[away]["goals_for"].append(ga)
        team_data[away]["goals_against"].append(gh)
        team_data[away]["results"].append("W" if ga > gh else ("D" if ga == gh else "L"))

    stats: dict = {}
    for team, data in team_data.items():
        results       = data["results"]
        goals_for     = data["goals_for"]
        goals_against = data["goals_against"]
        n = len(results)
        if n == 0:
            continue
        stats[team] = {
            "form":            results[-5:],
            "goals_scored":    round(sum(goals_for)     / n, 2),
            "goals_conceded":  round(sum(goals_against) / n, 2),
            "odds":            2.0,   # Pas disponible sur le plan gratuit football-data.org
        }

    logger.info(f"✅ Stats calculées pour {len(stats)} équipes")
    return stats


def determine_result(goals_home: int, goals_away: int) -> str:
    """Convertit un score en résultat HOME / DRAW / AWAY."""
    if goals_home > goals_away:
        return "HOME"
    if goals_away > goals_home:
        return "AWAY"
    return "DRAW"
