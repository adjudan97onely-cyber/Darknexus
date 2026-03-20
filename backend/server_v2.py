from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Query, HTTPException, Header
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

from db import (
    compute_performance,
    compute_performance_by_subtype,
    get_notifications,
    get_predictions,
    get_predictions_paginated,
    get_results,
    get_results_paginated,
    get_scheduler_logs,
    get_sync_state,
    get_lottery_draws,
    init_db,
    mark_notifications_read,
    push_notification,
    save_result,
)
from services.auth_service import auth_service
from services.scheduler_service import SchedulerService
from services.v2_data_service import V2DataService
from services.v2_prediction_service import V2PredictionService


data_service = V2DataService()
prediction_service = V2PredictionService(data_service)
scheduler_service = SchedulerService(data_service, prediction_service)


class AuthRegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class SubscriptionUpgradeRequest(BaseModel):
    plan: str


def _extract_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    if not authorization.lower().startswith("bearer "):
        return None
    return authorization.split(" ", 1)[1].strip()


def _require_user(authorization: Optional[str]):
    token = _extract_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Token manquant")
    user = auth_service.me(token)
    if not user:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    return user, token


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    data_service.initialize()
    await data_service.refresh_external_feeds()

    existing_sports_results = get_results("sport", limit=1)
    if not existing_sports_results:
        finished_matches = data_service.list_matches(status="finished", limit=20)
        for match in finished_matches[:8]:
            winner = "N"
            if match["home_score"] > match["away_score"]:
                winner = "1"
            elif match["away_score"] > match["home_score"]:
                winner = "2"
            save_result(
                "sport",
                {
                    "winner": winner,
                    "home_team": match["home_team"],
                    "away_team": match["away_team"],
                    "home_score": match["home_score"],
                    "away_score": match["away_score"],
                    "league": match["league"],
                },
                match["match_date"],
                source="seed",
            )
    prediction_service.reconcile_predictions()
    prediction_service.ensure_next_draw_predictions()
    await scheduler_service.start()
    push_notification("system", "Plateforme Analytics Lottery & Sports Predictor prête")
    yield
    await scheduler_service.stop()


app = FastAPI(
    title="Analytics Lottery & Sports Predictor V2",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "name": "Analytics Lottery & Sports Predictor",
        "version": "2.0.0",
        "status": "running",
        "mode": "adaptive-saas",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "sync_state": get_sync_state(),
        "scheduler": scheduler_service.status(),
    }


@app.post("/api/auth/register")
def auth_register(payload: AuthRegisterRequest):
    if "@" not in payload.email or "." not in payload.email:
        raise HTTPException(status_code=400, detail="Email invalide")
    try:
        user, token = auth_service.register(payload.email, payload.password)
        return {"user": user, "token": token}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/auth/login")
def auth_login(payload: AuthLoginRequest):
    if "@" not in payload.email or "." not in payload.email:
        raise HTTPException(status_code=400, detail="Email invalide")
    try:
        user, token = auth_service.login(payload.email, payload.password)
        return {"user": user, "token": token}
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


@app.get("/api/auth/me")
def auth_me(authorization: Optional[str] = Header(default=None)):
    user, _ = _require_user(authorization)
    return user


@app.post("/api/auth/logout")
def auth_logout(authorization: Optional[str] = Header(default=None)):
    _, token = _require_user(authorization)
    auth_service.logout(token)
    return {"status": "ok"}


@app.get("/api/subscriptions/plans")
def subscription_plans():
    return auth_service.plans()


@app.get("/api/subscriptions/current")
def subscription_current(authorization: Optional[str] = Header(default=None)):
    user, _ = _require_user(authorization)
    return auth_service.current_subscription(user["id"])


@app.post("/api/subscriptions/upgrade")
def subscription_upgrade(payload: SubscriptionUpgradeRequest, authorization: Optional[str] = Header(default=None)):
    user, _ = _require_user(authorization)
    try:
        return auth_service.upgrade(user["id"], payload.plan)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/dashboard/overview")
def dashboard_overview():
    return prediction_service.dashboard_overview()


@app.get("/api/lotteries/results/latest")
def latest_lottery_results(lottery: str | None = Query(None)):
    return data_service.latest_lottery_results(lottery_type=lottery)


@app.get("/api/lotteries/results/history")
def lottery_history(lottery: str = Query(...), limit: int = Query(50, ge=1, le=300)):
    return data_service.lottery_history(lottery, limit=limit)


@app.get("/api/lotteries/{lottery_type}/analysis")
def lottery_analysis_alias(lottery_type: str):
    return prediction_service.build_lottery_analysis(lottery_type)


@app.get("/api/lotteries/keno/analysis")
def keno_analysis():
    return prediction_service.build_lottery_analysis("keno")


@app.get("/api/lotteries/euromillions/analysis")
def euro_analysis():
    return prediction_service.build_lottery_analysis("euromillions")


@app.get("/api/lotteries/loto/analysis")
def loto_analysis():
    return prediction_service.build_lottery_analysis("loto")


@app.get("/api/lotteries/recommendations/{lottery}")
def lottery_recommendations(lottery: str, top_n: int = Query(10, ge=1, le=20)):
    return prediction_service.lottery_recommendations(lottery, top_n=top_n)


@app.get("/api/lotteries/grids/{lottery}")
def lottery_grids(lottery: str, num_grids: int = Query(5, ge=1, le=15)):
    return prediction_service.lottery_grids(lottery, num_grids=num_grids)


@app.get("/api/sports/leagues")
def sports_leagues():
    return data_service.list_leagues()


@app.get("/api/sports/matches")
def sports_matches(
    league: str | None = Query(None),
    country: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(30, ge=1, le=150),
):
    return data_service.list_matches(league=league, country=country, status=status, limit=limit)


@app.get("/api/sports/statistics")
def sports_statistics():
    return prediction_service.sports_statistics()


@app.get("/api/sports/recommendations")
def sports_recommendations(
    league: str | None = Query(None),
    country: str | None = Query(None),
    min_confidence: int = Query(0, ge=0, le=100),
    take: int = Query(10, ge=1, le=30),
):
    return prediction_service.sports_recommendations(
        league=league,
        country=country,
        min_confidence=min_confidence,
        take=take,
    )


@app.get("/api/sports/matches/{home}/vs/{away}/prediction")
def sports_prediction(home: str, away: str, league: str | None = Query(None), country: str | None = Query(None)):
    return prediction_service.sports_match_prediction(home, away, persist=True, league=league, country=country)


@app.get("/api/predictions/history")
def prediction_history(type: str | None = Query(None), limit: int = Query(100, ge=1, le=500)):
    return get_predictions(type, limit=limit)


@app.get("/api/predictions/history/paginated")
def prediction_history_paginated(
    type: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
):
    return get_predictions_paginated(type, page=page, per_page=per_page)


@app.get("/api/results/recent")
def recent_results(type: str | None = Query(None), limit: int = Query(50, ge=1, le=200)):
    return get_results(type, limit=limit)


@app.get("/api/results/recent/paginated")
def recent_results_paginated(
    type: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
):
    return get_results_paginated(type, page=page, per_page=per_page)


@app.get("/api/performance")
def performance_overview():
    return {
        "by_type": compute_performance(),
        "by_subtype": compute_performance_by_subtype(),
        "overview": prediction_service.dashboard_overview(),
    }


@app.get("/api/performance/by-subtype")
def performance_by_subtype():
    return compute_performance_by_subtype()


@app.get("/api/notifications")
def notifications(unread_only: bool = Query(False), limit: int = Query(20, ge=1, le=100)):
    return get_notifications(unread_only=unread_only, limit=limit)


@app.post("/api/notifications/read")
def notifications_read():
    mark_notifications_read()
    return {"status": "ok"}


@app.get("/api/auto-select/lottery")
def auto_select_lottery(
    lottery: str = Query(...),
    take: int = Query(5, ge=1, le=30),
    min_confidence: int = Query(80, ge=0, le=100),
):
    return prediction_service.auto_select("lottery", subtype=lottery, min_confidence=min_confidence, take=take)


@app.get("/api/auto-select/sports")
def auto_select_sports(
    league: str | None = Query(None),
    take: int = Query(5, ge=1, le=30),
    min_confidence: int = Query(80, ge=0, le=100),
):
    return prediction_service.auto_select("sport", subtype=league, min_confidence=min_confidence, take=take)


@app.post("/api/system/reconcile")
async def reconcile_predictions():
    updates = await scheduler_service.run_reconcile_now()
    return {"updated": updates, "count": len(updates)}


@app.post("/api/system/prepare-next-draw")
async def prepare_next_draw_predictions():
    created = await scheduler_service.run_cycle_predictions_now()
    return {"prepared": created, "count": len(created)}


@app.get("/api/system/cron/refresh")
async def cron_refresh_all():
    refreshed = await scheduler_service.run_sync_now()
    reconciled = await scheduler_service.run_reconcile_now()
    prepared = await scheduler_service.run_cycle_predictions_now()
    return {
        "status": "ok",
        "refresh_count": len(refreshed),
        "reconciled_count": len(reconciled),
        "prepared_count": len(prepared),
    }


@app.get("/api/system/cron/reconcile")
async def cron_reconcile_only():
    reconciled = await scheduler_service.run_reconcile_now()
    return {"status": "ok", "reconciled_count": len(reconciled)}


@app.get("/api/system/cron/prepare-next-draw")
async def cron_prepare_next_draw_only():
    prepared = await scheduler_service.run_cycle_predictions_now()
    return {"status": "ok", "prepared_count": len(prepared)}


@app.post("/api/system/refresh")
async def refresh_data():
    refreshed = await scheduler_service.run_sync_now()
    return {"status": "ok", "refresh": refreshed, "sync_state": get_sync_state()}


@app.get("/api/system/scheduler")
def scheduler_status(limit: int = Query(20, ge=1, le=100)):
    return {
        "status": scheduler_service.status(),
        "logs": get_scheduler_logs(limit=limit),
    }


# ─────────────────────── BILAN IA ────────────────────────────────

@app.get("/api/rapport/lottery/{subtype}")
def rapport_lottery(subtype: str, limit: int = Query(20, ge=5, le=100)):
    """
    Retourne le bilan comparatif IA pour une loterie donnée.
    Chaque entrée montre : prédiction IA vs tirage réel, numéros trouvés, score.
    Inclut un verdict : l'IA fait-elle mieux que le hasard ?
    """
    # ── Config par loterie ─────────────────────────────────────────
    lottery_config = {
        "keno":         {"total_numbers": 70, "pick_count": 20, "draw_count": 20},
        "euromillions": {"total_numbers": 50, "pick_count": 5,  "draw_count": 5},
        "loto":         {"total_numbers": 49, "pick_count": 6,  "draw_count": 6},
    }
    cfg = lottery_config.get(subtype, {"total_numbers": 70, "pick_count": 20, "draw_count": 20})

    # ── Prédictions et tirages réels ───────────────────────────────
    all_preds = get_predictions("lottery", limit=500)
    sub_preds = [
        p for p in all_preds
        if (p.get("subtype") or "").lower() == subtype.lower()
        and p.get("status") in ("won", "lost")
    ][:limit]

    draws = get_lottery_draws(subtype, limit=50)
    draws_by_date = {}
    for d in draws:
        key = d["draw_date"][:10]
        if key not in draws_by_date:
            draws_by_date[key] = d["numbers"]

    # ── Construire les lignes du bilan ─────────────────────────────
    rows = []
    for pred in sub_preds:
        prediction_data = pred.get("prediction") or {}
        predicted_numbers = sorted(prediction_data.get("numbers", []))
        created_day = (pred.get("created_at") or "")[:10]

        # Trouve le tirage le plus proche (même jour ou jour suivant)
        actual_numbers = []
        draw_date_used = None
        for offset in range(0, 4):
            from datetime import timedelta
            try:
                from datetime import date as _date
                target = (_date.fromisoformat(created_day) + timedelta(days=offset)).isoformat()
            except Exception:
                target = created_day
            if target in draws_by_date:
                actual_numbers = sorted(draws_by_date[target])
                draw_date_used = target
                break

        matched = sorted(set(predicted_numbers) & set(actual_numbers)) if actual_numbers else []
        score = pred.get("score") or 0
        if not score and predicted_numbers and actual_numbers:
            score = round(len(matched) / max(1, len(predicted_numbers)) * 100, 1)

        rows.append({
            "id": pred["id"],
            "prediction_date": created_day,
            "draw_date": draw_date_used,
            "predicted": predicted_numbers,
            "actual": actual_numbers,
            "matched": matched,
            "matched_count": len(matched),
            "predicted_count": len(predicted_numbers),
            "score": score,
            "status": pred.get("status"),
            "confidence": pred.get("confidence", 0),
        })

    # ── Statistiques globales ──────────────────────────────────────
    scored_rows = [r for r in rows if r["actual"]]
    avg_score = round(sum(r["score"] for r in scored_rows) / max(1, len(scored_rows)), 1)
    avg_matched = round(sum(r["matched_count"] for r in scored_rows) / max(1, len(scored_rows)), 2)

    # Baseline hasard pur : si on tire pick_count numéros parmi total_numbers
    # probabilité d'en trouver X parmi draw_count sortis = hypergéométrique
    # Valeur attendue = pick_count * draw_count / total_numbers
    random_expected_matches = round(
        cfg["pick_count"] * cfg["draw_count"] / cfg["total_numbers"], 2
    )
    random_score_pct = round(random_expected_matches / max(1, cfg["pick_count"]) * 100, 1)

    if scored_rows:
        ai_better = avg_score > random_score_pct
        gain_vs_random = round(avg_score - random_score_pct, 1)
        verdict = (
            f"L'IA trouve en moyenne {avg_matched} numéros (score {avg_score}%). "
            f"Le hasard pur donnerait {random_expected_matches} numéros ({random_score_pct}%). "
            + (
                f"✅ L'IA fait +{gain_vs_random}% mieux que le hasard."
                if ai_better
                else f"⚠️ L'IA est en dessous du hasard de {abs(gain_vs_random)}% — modèles en apprentissage."
            )
        )
    else:
        ai_better = None
        gain_vs_random = 0
        verdict = "Pas encore assez de prédictions validées pour établir un verdict."

    return {
        "subtype": subtype,
        "total_evaluated": len(scored_rows),
        "avg_score_pct": avg_score,
        "avg_matched": avg_matched,
        "random_baseline_pct": random_score_pct,
        "random_baseline_matches": random_expected_matches,
        "ai_better_than_random": ai_better,
        "gain_vs_random_pct": gain_vs_random,
        "verdict": verdict,
        "rows": rows,
    }
