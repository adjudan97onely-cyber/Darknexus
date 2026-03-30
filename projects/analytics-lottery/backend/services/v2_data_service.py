from datetime import datetime, timedelta
from random import Random
import aiohttp

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None

from db import (
    get_results,
    get_lottery_draws,
    get_sports_leagues,
    get_sports_matches,
    save_lottery_draw,
    save_result,
    save_sports_match,
    update_sports_match_result,
    update_sync_state,
)


LOTTERY_CONFIG = {
    "keno": {"max_number": 70, "pick_count": 20},
    "euromillions": {"max_number": 50, "pick_count": 5},
    "loto": {"max_number": 49, "pick_count": 6},
}

SPORTS_LEAGUES = [
    ("Angleterre", "Premier League", ["Arsenal", "Liverpool", "Chelsea", "Man City", "Tottenham", "Newcastle"]),
    ("Espagne", "La Liga", ["Real Madrid", "Barcelona", "Atletico", "Sevilla", "Valencia", "Real Sociedad"]),
    ("Italie", "Serie A", ["Inter", "Milan", "Juventus", "Napoli", "Roma", "Lazio"]),
    ("France", "Ligue 1", ["PSG", "OM", "Monaco", "Lyon", "Lille", "Lens"]),
]


class V2DataService:
    def __init__(self):
        self.rng = Random(20260318)
        self._tz = None
        if ZoneInfo:
            try:
                self._tz = ZoneInfo("Europe/Paris")
            except Exception:
                self._tz = None

    def initialize(self):
        self._ensure_lottery_history()
        self._ensure_sports_history()
        self._ensure_results_shadow()
        self._materialize_sports_results()

    async def refresh_external_feeds(self):
        results = []
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=6)) as session:
            lottery_status = await self._sync_lottery_feeds(session)
            sports_status = await self._sync_sports_feeds(session)
            results.extend([lottery_status, sports_status])
        sports_materialized = self._materialize_sports_results()
        results.append({"domain": "sports_results", "source": "engine", "status": "ok", "synced": sports_materialized})
        return results

    def _now_local(self):
        if self._tz is not None:
            return datetime.now(self._tz)
        return datetime.utcnow()

    def _lottery_draw_slot(self, dt):
        # Rythme produit: une session "midi" et une session "soir" par jour.
        if dt.hour < 15:
            return "midi", "12:30:00"
        return "soir", "20:30:00"

    @staticmethod
    def _sport_match_key(match):
        return f"{match.get('league','')}-{match.get('home_team','')}-{match.get('away_team','')}-{match.get('match_date','')}"

    async def _sync_lottery_feeds(self, session):
        providers = [
            ("keno", "https://www.randomnumberapi.com/api/v1.0/random?min=1&max=70&count=20"),
            ("euromillions", "https://www.randomnumberapi.com/api/v1.0/random?min=1&max=50&count=5"),
            ("loto", "https://www.randomnumberapi.com/api/v1.0/random?min=1&max=49&count=6"),
        ]

        success_count = 0
        now_local = self._now_local()
        today = now_local.date().isoformat()
        slot_name, slot_time = self._lottery_draw_slot(now_local)
        draw_stamp = f"{today}T{slot_time}"
        draw_key = f"{today}:{slot_name}"

        existing_results = get_results(limit=200)
        existing_keys = {
            (item["type"], (item.get("actual_result") or {}).get("draw_key"))
            for item in existing_results
        }

        for lottery_type, url in providers:
            try:
                async with session.get(url) as response:
                    if response.status != 200:
                        continue
                    payload = await response.json()
                    if isinstance(payload, list):
                        numbers = sorted(list({int(x) for x in payload}))
                    else:
                        continue
                    expected_count = LOTTERY_CONFIG[lottery_type]["pick_count"]
                    if len(numbers) >= expected_count:
                        numbers = numbers[:expected_count]
                    if (lottery_type, draw_key) not in existing_keys:
                        bonus = self.rng.randint(1, 12) if lottery_type == "euromillions" else None
                        save_lottery_draw(lottery_type, draw_stamp, numbers, bonus=bonus, source="remote")
                        save_result(
                            lottery_type,
                            {
                                "numbers": numbers,
                                "bonus": bonus,
                                "draw_slot": slot_name,
                                "draw_key": draw_key,
                            },
                            draw_stamp,
                            source="remote",
                        )
                        success_count += 1
            except Exception:
                continue

        if success_count > 0:
            update_sync_state("lotteries", "randomnumberapi", "reachable", f"{success_count} feed(s) synced")
            return {"domain": "lotteries", "source": "randomnumberapi", "status": "reachable", "synced": success_count}

        update_sync_state("lotteries", "seed", "fallback", "remote unavailable, seeded dataset active")
        return {"domain": "lotteries", "source": "seed", "status": "fallback", "synced": 0}

    async def _sync_sports_feeds(self, session):
        # Source ouverte sans clé API (démonstration robuste + fallback)
        providers = [
            ("Premier League", "Angleterre", "https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328"),
            ("La Liga", "Espagne", "https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4335"),
            ("Serie A", "Italie", "https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4332"),
            ("Ligue 1", "France", "https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4334"),
        ]

        inserted = 0
        known = {
            (m["league"], m["home_team"], m["away_team"], m["match_date"][:10])
            for m in get_sports_matches(limit=600)
        }

        for league, country, url in providers:
            try:
                async with session.get(url) as response:
                    if response.status != 200:
                        continue
                    payload = await response.json()
                    events = payload.get("events") or []
                    for event in events[:10]:
                        home = event.get("strHomeTeam")
                        away = event.get("strAwayTeam")
                        date_part = event.get("dateEvent")
                        if not home or not away or not date_part:
                            continue
                        match_date = f"{date_part}T20:00:00"
                        key = (league, home, away, date_part)
                        if key in known:
                            continue
                        save_sports_match(
                            country=country,
                            league=league,
                            match_date=match_date,
                            home_team=home,
                            away_team=away,
                            home_score=None,
                            away_score=None,
                            status="scheduled",
                            source="remote",
                        )
                        known.add(key)
                        inserted += 1
            except Exception:
                continue

        if inserted > 0:
            update_sync_state("sports", "thesportsdb", "reachable", f"{inserted} match(es) synced")
            return {"domain": "sports", "source": "thesportsdb", "status": "reachable", "synced": inserted}

        update_sync_state("sports", "seed", "fallback", "remote unavailable, seeded dataset active")
        return {"domain": "sports", "source": "seed", "status": "fallback", "synced": 0}

    def _ensure_lottery_history(self):
        existing = get_lottery_draws(limit=1)
        if existing:
            return

        for lottery_type, config in LOTTERY_CONFIG.items():
            total_draws = 180 if lottery_type == "keno" else 120
            start = datetime.utcnow() - timedelta(days=total_draws)
            for index in range(total_draws):
                draw_date = (start + timedelta(days=index)).date().isoformat()
                numbers = sorted(self.rng.sample(range(1, config["max_number"] + 1), config["pick_count"]))
                bonus = self.rng.randint(1, 12) if lottery_type == "euromillions" else None
                save_lottery_draw(lottery_type, draw_date, numbers, bonus=bonus, source="seed")
        update_sync_state("lottery_draws", "seed", "ready", "seeded lottery history")

    def _ensure_results_shadow(self):
        if get_results(limit=1):
            return
        draws = get_lottery_draws(limit=15)
        by_type = {}
        for draw in draws:
            by_type.setdefault(draw["lottery_type"], []).append(draw)

        for lottery_type, items in by_type.items():
            for draw in items[:5]:
                save_result(
                    lottery_type,
                    {
                        "numbers": draw["numbers"],
                        "bonus": draw.get("bonus"),
                        "draw_slot": "seed",
                        "draw_key": f"{str(draw['draw_date'])[:10]}:seed",
                    },
                    draw["draw_date"],
                    source="seed",
                )
        update_sync_state("results", "seed", "ready", "shadow results generated")

    def _materialize_sports_results(self):
        now_local = self._now_local()

        scheduled = get_sports_matches(status="scheduled", limit=2000)
        simulated = 0
        for match in scheduled:
            match_date_raw = match.get("match_date") or ""
            match_date = match_date_raw.replace("Z", "+00:00")
            try:
                dt = datetime.fromisoformat(match_date)
            except ValueError:
                continue

            if dt.tzinfo is None and self._tz is not None:
                dt = dt.replace(tzinfo=self._tz)

            if dt > now_local - timedelta(minutes=30):
                continue

            seed = sum(ord(ch) for ch in f"{match.get('home_team','')}{match.get('away_team','')}{match_date_raw}")
            home_score = seed % 4
            away_score = (seed // 3) % 4
            update_sports_match_result(match["id"], home_score, away_score, status="finished", source="simulated")
            simulated += 1

        finished = get_sports_matches(status="finished", limit=3000)
        existing_results = get_results("sport", limit=3000)
        existing_keys = {
            (item.get("actual_result") or {}).get("match_key")
            for item in existing_results
            if item.get("actual_result")
        }

        inserted = 0
        for match in finished:
            key = self._sport_match_key(match)
            if key in existing_keys:
                continue

            home_score = match.get("home_score")
            away_score = match.get("away_score")
            if home_score is None or away_score is None:
                continue

            winner = "N"
            if home_score > away_score:
                winner = "1"
            elif away_score > home_score:
                winner = "2"

            save_result(
                "sport",
                {
                    "winner": winner,
                    "home_team": match.get("home_team"),
                    "away_team": match.get("away_team"),
                    "home_score": home_score,
                    "away_score": away_score,
                    "league": match.get("league"),
                    "match_date": match.get("match_date"),
                    "match_key": key,
                },
                match.get("match_date"),
                source=match.get("source") or "seed",
            )
            inserted += 1

        update_sync_state(
            "sports_results",
            "engine",
            "ready",
            f"simulated={simulated}, inserted={inserted}",
        )
        return inserted

    def _ensure_sports_history(self):
        existing = get_sports_matches(limit=1)
        if existing:
            return

        base_date = datetime.utcnow() - timedelta(days=80)
        for country, league, teams in SPORTS_LEAGUES:
            for index in range(42):
                home, away = self.rng.sample(teams, 2)
                match_date = (base_date + timedelta(days=index * 2)).isoformat()
                played = index < 28
                home_score = self.rng.randint(0, 4) if played else None
                away_score = self.rng.randint(0, 4) if played else None
                status = "finished" if played else "scheduled"
                save_sports_match(
                    country=country,
                    league=league,
                    match_date=match_date,
                    home_team=home,
                    away_team=away,
                    home_score=home_score,
                    away_score=away_score,
                    status=status,
                    source="seed",
                )
        update_sync_state("sports_matches", "seed", "ready", "seeded sports history")

    def list_leagues(self):
        return get_sports_leagues()

    def list_matches(self, league=None, country=None, status=None, limit=100):
        return get_sports_matches(league=league, country=country, status=status, limit=limit)

    def latest_lottery_results(self, lottery_type=None):
        draws = get_lottery_draws(lottery_type=lottery_type, limit=500)
        latest = {}
        for draw in draws:
            if draw["lottery_type"] not in latest:
                latest[draw["lottery_type"]] = draw
        return list(latest.values()) if not lottery_type else latest.get(lottery_type)

    def lottery_history(self, lottery_type, limit=50):
        return get_lottery_draws(lottery_type=lottery_type, limit=limit)
