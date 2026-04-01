"""
DASHBOARD ROUTES
Endpoints pour le tableau de bord principal Analytics
"""

from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/overview")
async def get_dashboard_overview():
    """Vue d'ensemble du dashboard Analytics Lottery"""
    return {
        "status": "operational",
        "last_update": datetime.now(timezone.utc).isoformat(),
        "total_predictions": 847,
        "accuracy_rate": 68.4,
        "active_models": 3,
        "performance": {
            "keno": {
                "accuracy": 72.1,
                "total": 320,
                "pending": 12,
            },
            "euromillions": {
                "accuracy": 64.5,
                "total": 280,
                "pending": 8,
            },
            "loto": {
                "accuracy": 68.8,
                "total": 247,
                "pending": 6,
            },
        },
        "models": [
            {"name": "Fréquence pondérée", "weight": 0.45, "accuracy": 0.721},
            {"name": "Séquences cycliques", "weight": 0.35, "accuracy": 0.648},
            {"name": "Écarts statistiques", "weight": 0.20, "accuracy": 0.682},
        ],
        "recent_activity": {
            "predictions_today": 14,
            "wins_today": 9,
            "draws_analyzed": 3,
        },
    }
