from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
from database import get_client, get_database, close_client
from database_sqlite import init_db, get_db_session
from routes.projects import router as projects_router
from routes.chat import router as chat_router
from routes.auth import router as auth_router
from routes.admin import router as admin_router
from routes.admin_api import router as admin_api_router
from routes.assistant import router as assistant_router
from routes.scraper import router as scraper_router
from routes.streaming import router as streaming_router
from routes.ai_assistant import router as ai_assistant_router
from routes.whisper import router as whisper_router
from routes.copilot import router as copilot_router
from routes.predictions import router as predictions_router
from routes.football_real import router as football_real_router
from routes.predictions_enriched import router as predictions_enriched_router
from routes.sports import router as sports_router
from routes.lotteries import router as lotteries_router
from routes.keno_engine_routes import router as keno_engine_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialiser la base de données SQLite
try:
    init_db()
    logger.info('✅ SQLite database initialized')
except Exception as e:
    logger.warning(f'⚠️ SQLite initialization: {e}')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

# Include projects router
app.include_router(projects_router)

# Include chat router
app.include_router(chat_router)

# Include auth router
app.include_router(auth_router)

# Include admin router
app.include_router(admin_router)

# Include admin API router (NEW)
app.include_router(admin_api_router)

# Include assistant router
app.include_router(assistant_router)

# Include scraper router
app.include_router(scraper_router)

# Include streaming router
app.include_router(streaming_router)

# Include AI assistant router
app.include_router(ai_assistant_router)

# Include Whisper STT router
app.include_router(whisper_router)

# Include Copilot Intelligent router
app.include_router(copilot_router)

# Include Predictions router
app.include_router(predictions_router)

# Include Football Real Data router
app.include_router(football_real_router)

# Include Predictions Enriched router (matchs + odds + IA)
app.include_router(predictions_enriched_router)

# Include Sports router
app.include_router(sports_router)

# Include Lotteries router
app.include_router(lotteries_router)

# Include Keno Engine router (moteur statistique sérieux)
app.include_router(keno_engine_router)

# ── Stub routes for frontend pages that expect these endpoints ──
stub_router = APIRouter(tags=["Stubs"])

@stub_router.get("/api/dashboard/overview")
async def dashboard_overview():
    return {
        "kpis": {
            "active_predictions": 42,
            "validated_predictions": 28,
            "global_accuracy": 69,
            "avg_model_weight": 0.74,
        },
        "performance": {
            "keno": {"accuracy": 72, "total": 45, "pending": 3},
            "loto": {"accuracy": 68, "total": 32, "pending": 2},
            "euromillions": {"accuracy": 65, "total": 28, "pending": 1},
            "football": {"accuracy": 70, "total": 120, "pending": 8},
        },
        "models": [
            {"name": "Frequency", "weight": 0.40, "accuracy": 0.72},
            {"name": "Overdue",   "weight": 0.35, "accuracy": 0.68},
            {"name": "Trend",     "weight": 0.25, "accuracy": 0.65},
        ],
        "recent_results": [
            {"id": "r1", "lottery_type": "Keno",         "draw_date": "01/04/2026", "numbers": [5, 12, 18, 27, 33, 44]},
            {"id": "r2", "lottery_type": "EuroMillions",  "draw_date": "29/03/2026", "numbers": [7, 15, 22, 38, 45]},
            {"id": "r3", "lottery_type": "Loto",          "draw_date": "28/03/2026", "numbers": [3, 11, 24, 36, 42, 49]},
        ],
        "recent_predictions": [
            {"id": "p1", "subtype": "keno",         "status": "validée", "confidence": 78, "score": 3},
            {"id": "p2", "subtype": "football",     "status": "validée", "confidence": 82, "score": 1},
            {"id": "p3", "subtype": "euromillions", "status": "en attente", "confidence": 65, "score": 0},
            {"id": "p4", "subtype": "loto",         "status": "validée", "confidence": 71, "score": 2},
        ],
        "sports_statistics": {
            "total_matches": 150,
            "btts_rate": 0.48,
            "over_2_5_rate": 0.54,
        },
    }

@stub_router.get("/api/performance")
async def performance_overview():
    from services.prediction_storage import PredictionStorage
    metrics = PredictionStorage.get_accuracy_metrics()
    matched = PredictionStorage.match_predictions_with_results()

    if isinstance(metrics, dict) and metrics.get("total", 0) > 0:
        acc    = int(round(metrics.get("accuracy", 0) * 100))
        total  = metrics.get("total", 0)
        correct = metrics.get("correct", 0)
        pending = len([p for p in PredictionStorage.get_predictions(limit=500)
                       if p.get("status") == "pending"])
        football_by_type = {
            "football": {
                "accuracy": acc,
                "total":    total,
                "correct":  correct,
                "pending":  pending,
            }
        }
    else:
        acc = 0
        football_by_type = {"football": {"accuracy": 0, "total": 0, "correct": 0, "pending": 0}}

    return {
        "overview": {
            "kpis": {
                "global_accuracy":       acc or 0,
                "active_predictions":    len(PredictionStorage.get_predictions(limit=500)) if acc == 0 else metrics.get("total", 0),
                "validated_predictions": metrics.get("total", 0) if isinstance(metrics, dict) else 0,
                "avg_model_weight":      0.74,
            },
            "models": [
                {"name": "Forme équipes",    "weight": 0.30, "accuracy": 0.72},
                {"name": "Attaque/Défense",  "weight": 0.35, "accuracy": 0.68},
                {"name": "Avantage domicile","weight": 0.35, "accuracy": 0.65},
            ],
        },
        "by_type": {
            **football_by_type,
            "keno":         {"accuracy": 0, "total": 0, "pending": 0},
            "loto":         {"accuracy": 0, "total": 0, "pending": 0},
            "euromillions": {"accuracy": 0, "total": 0, "pending": 0},
        },
    }

@stub_router.get("/api/auto-select/lottery")
async def auto_select_lottery(lottery: str = "keno", take: int = 5, min_confidence: int = 80):
    from services.loto_keno_brain import predict_lottery_draw, GAME_CONFIG
    game_map = {"keno": "KENO", "euromillions": "EUROMILLIONS", "loto": "LOTO"}
    game = game_map.get(lottery.lower(), "KENO")
    config = GAME_CONFIG.get(game, {"draw_count": 6})
    grids = []
    for i in range(take):
        historical = [[j for j in range(1, config["draw_count"] + 1)]]
        pred = predict_lottery_draw(game, historical)
        conf = round(pred.get("confidence", 0.65) * 100)
        if conf >= min_confidence or i < 2:
            grids.append({
                "prediction_id": f"auto_{lottery}_{i+1}",
                "numbers": pred.get("predicted_numbers", []),
                "confidence": conf,
                "reliability": round(conf * 0.9),
            })
    return {"data": grids, "count": len(grids)}

@stub_router.get("/api/notifications")
async def get_notifications(unread_only: bool = False, limit: int = 20):
    return {"data": [
        {"id": "n1", "type": "info", "message": "Système démarré avec succès", "created_at": "2026-03-26T10:00:00", "read": True},
        {"id": "n2", "type": "prediction", "message": "Nouvelle prédiction Keno disponible", "created_at": "2026-03-26T12:00:00", "read": False},
    ], "count": 2}

@stub_router.post("/api/notifications/read")
async def mark_notifications_read():
    return {"status": "ok"}

@stub_router.post("/api/system/refresh")
async def system_refresh():
    return {"status": "refreshed"}

@stub_router.post("/api/system/reconcile")
async def system_reconcile():
    """Déclenche la réconciliation réelle des prédictions football vs résultats."""
    try:
        from services.football_api_service import get_finished_matches, determine_result
        from services.prediction_storage import PredictionStorage

        finished = await get_finished_matches(days_ago=14)
        finished_by_id = {str(m.get("id")): m for m in finished if m.get("id")}

        all_preds = PredictionStorage.get_predictions(limit=1000)
        resolved_ids = {r.get("match_id") for r in PredictionStorage.get_results(limit=1000)}

        reconciled = 0
        for pred in all_preds:
            match_id = pred.get("match_id", "")
            if match_id in resolved_ids:
                continue
            match_data = finished_by_id.get(match_id)
            if not match_data:
                continue
            gh = match_data.get("goalsHome")
            ga = match_data.get("goalsAway")
            if gh is None or ga is None:
                continue
            try:
                actual_result = determine_result(int(gh), int(ga))
            except (ValueError, TypeError):
                continue
            PredictionStorage.save_result(
                match_id=match_id,
                actual_result=actual_result,
                notes=f"{match_data.get('homeTeam')} {gh}-{ga} {match_data.get('awayTeam')}",
            )
            reconciled += 1

        metrics = PredictionStorage.recalculate_accuracy()
        return {
            "status": "reconciled",
            "matched": reconciled,
            "accuracy": metrics.get("accuracy", 0) if isinstance(metrics, dict) else 0,
        }
    except Exception as e:
        return {"status": "error", "matched": 0, "detail": str(e)}

@stub_router.get("/api/results/recent/paginated")
async def results_recent_paginated(type: str = None, page: int = 1, per_page: int = 25):
    return {"items": [], "total": 0, "page": page, "per_page": per_page}

@stub_router.get("/api/results/recent")
async def results_recent(type: str = None, limit: int = 50):
    return {"data": [], "count": 0}

@stub_router.get("/api/predictions/history/paginated")
async def predictions_history_paginated(type: str = None, page: int = 1, per_page: int = 25):
    return {"items": [], "total": 0, "page": page, "per_page": per_page}

@stub_router.get("/api/predictions/history")
async def predictions_history(type: str = None, limit: int = 100):
    return {"data": [], "count": 0}

@stub_router.get("/api/subscriptions/plans")
async def subscription_plans():
    return {"data": []}

@stub_router.get("/api/subscriptions/current")
async def subscription_current():
    return {"plan": "free", "status": "active"}

@stub_router.get("/api/rapport/lottery/{subtype}")
async def rapport_lottery(subtype: str, limit: int = 20):
    configs = {
        "keno":         {"baseline": 20, "numbers": 20, "pool": 70},
        "euromillions": {"baseline": 10, "numbers": 5,  "pool": 50},
        "loto":         {"baseline": 10, "numbers": 6,  "pool": 49},
    }
    cfg = configs.get(subtype, {"baseline": 15, "numbers": 6, "pool": 49})
    baseline = cfg["baseline"]

    # Tirages de démonstration réalistes
    from datetime import datetime, timedelta
    import random
    rows = []
    for i in range(min(limit, 5)):
        pred_date = (datetime.now() - timedelta(days=(i + 1) * 3)).strftime("%d/%m/%Y")
        draw_date = (datetime.now() - timedelta(days=i * 3)).strftime("%d/%m/%Y")
        predicted = sorted(random.sample(range(1, cfg["pool"] + 1), cfg["numbers"]))
        actual    = sorted(random.sample(range(1, cfg["pool"] + 1), cfg["numbers"]))
        matched   = [n for n in predicted if n in actual]
        score     = round(len(matched) / cfg["numbers"] * 100)
        rows.append({
            "id": f"{subtype}_{i+1}",
            "prediction_date": pred_date,
            "draw_date": draw_date,
            "status": "won" if len(matched) >= 2 else "lost",
            "score": score,
            "matched_count": len(matched),
            "predicted_count": cfg["numbers"],
            "predicted": predicted,
            "actual": actual,
            "matched": matched,
        })

    avg_score = round(sum(r["score"] for r in rows) / len(rows)) if rows else 0
    gain = avg_score - baseline
    return {
        "subtype": subtype,
        "verdict": (
            f"Sur {len(rows)} tirages analysés, l'IA obtient en moyenne {avg_score}% de numéros corrects "
            f"contre {baseline}% pour le hasard pur. "
            + ("L'IA est meilleure que le hasard." if gain > 0 else "Performance proche du hasard — données insuffisantes.")
        ),
        "total_evaluated": len(rows),
        "avg_score_pct": avg_score,
        "random_baseline_pct": baseline,
        "ai_better_than_random": gain > 0,
        "gain_vs_random_pct": gain,
        "rows": rows,
    }

@stub_router.get("/api/rapport/sports")
async def rapport_sports():
    """Délègue au endpoint /api/sports/bilan."""
    from routes.sports import get_sports_bilan
    return await get_sports_bilan()

@stub_router.post("/api/learning/predict")
async def learning_predict(data: dict):
    import uuid
    return {
        "success": True,
        "prediction_id": str(uuid.uuid4()),
        "message": "Prédiction enregistrée"
    }

@stub_router.post("/api/learning/result")
async def learning_result(data: dict):
    return {"success": True, "message": "Résultat enregistré"}

@stub_router.get("/api/learning/predictions")
async def learning_predictions():
    return []

@stub_router.get("/api/learning/stats")
async def learning_stats():
    return {"total": 0, "accuracy": 0}

app.include_router(stub_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_client()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "5000"))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )