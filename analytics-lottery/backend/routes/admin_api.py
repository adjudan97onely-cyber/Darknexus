"""
Admin API Routes - Authentification & Dashboard
Simple et directe pour l'interface admin
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import os
import jwt
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Configuration
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "LorenZ971972@")  # Mot de passe admin
SECRET_KEY = os.getenv("SECRET_KEY", "analytics-lottery-secret-key-2026")
TOKEN_EXPIRY_DAYS = 30


class AdminLoginRequest(BaseModel):
    password: str
    email: str = "admin@analytics-lottery.com"


def create_admin_token(admin_email: str) -> str:
    """Crée un JWT token pour l'admin"""
    payload = {
        "sub": "admin",
        "email": admin_email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS),
        "role": "admin"
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token


def verify_admin_token(token: str) -> dict:
    """Vérifie un JWT token admin"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("role") != "admin":
            return None
        return payload
    except:
        return None


def extract_token_from_header(authorization: str) -> Optional[str]:
    """Extrait le token du header Authorization"""
    if not authorization:
        return None
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
        return token
    except:
        return None


# ========== LOGIN ENDPOINT ==========

@router.post("/login")
async def admin_login(request: AdminLoginRequest):
    """
    Connexion Admin
    
    Password: LorenZ971972@
    """
    if request.password != ADMIN_PASSWORD:
        logger.warning(f"❌ Admin login échoué: mauvais mot de passe")
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")
    
    token = create_admin_token(request.email)
    
    logger.info(f"✅ Admin connecté: {request.email}")
    
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "expires_in": TOKEN_EXPIRY_DAYS * 86400,
        "role": "admin",
        "email": request.email
    }


# ========== ADMIN STATS ==========

@router.get("/stats")
async def get_admin_stats(authorization: Optional[str] = Header(None)):
    """Obtenir les stats admin"""
    token = extract_token_from_header(authorization)
    if not token or not verify_admin_token(token):
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    try:
        # Récupérer les metrics de prediction_storage
        from services.prediction_storage import PredictionStorage
        
        predictions = PredictionStorage.get_predictions(limit=10000)
        results = PredictionStorage.get_results()
        metrics = PredictionStorage.get_accuracy_metrics()
        
        total_preds = len(predictions)
        correct_preds = metrics.get("correct", 0)
        accuracy = metrics.get("accuracy", 0)
        
        return {
            "success": True,
            "stats": {
                "total_predictions": total_preds,
                "correct_predictions": correct_preds,
                "accuracy_rate": round(accuracy * 100, 2),
                "accuracy_raw": accuracy,
                "high_confidence_accuracy": metrics.get("high_confidence_accuracy", 0),
                "low_confidence_accuracy": metrics.get("low_confidence_accuracy", 0),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    except Exception as e:
        logger.error(f"❌ Erreur stats: {str(e)}")
        return {
            "success": True,
            "stats": {
                "total_predictions": 0,
                "correct_predictions": 0,
                "accuracy_rate": 0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }


# ========== ADMIN PREDICTIONS ==========

@router.get("/predictions")
async def list_admin_predictions(
    authorization: Optional[str] = Header(None),
    limit: int = 50
):
    """Liste des prédictions récentes"""
    token = extract_token_from_header(authorization)
    if not token or not verify_admin_token(token):
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    try:
        from services.prediction_storage import PredictionStorage
        
        predictions = PredictionStorage.get_predictions(limit=limit)
        
        return {
            "success": True,
            "count": len(predictions),
            "predictions": predictions
        }
    except Exception as e:
        logger.error(f"❌ Erreur predictions: {str(e)}")
        return {
            "success": True,
            "count": 0,
            "predictions": []
        }


# ========== ADMIN PERFORMANCE ==========

@router.get("/performance")
async def get_admin_performance(
    authorization: Optional[str] = Header(None),
    days: int = 7
):
    """Performance sur les derniers X jours"""
    token = extract_token_from_header(authorization)
    if not token or not verify_admin_token(token):
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    try:
        from services.prediction_storage import PredictionStorage
        
        metrics = PredictionStorage.get_accuracy_metrics()
        
        return {
            "success": True,
            "period_days": days,
            "performance": {
                "accuracy": metrics.get("accuracy", 0),
                "correct": metrics.get("correct", 0),
                "total": metrics.get("total", 0),
                "high_confidence_accuracy": metrics.get("high_confidence_accuracy", 0),
                "low_confidence_accuracy": metrics.get("low_confidence_accuracy", 0),
                "last_updated": metrics.get("calculated_at", "N/A")
            }
        }
    except Exception as e:
        logger.error(f"❌ Erreur performance: {str(e)}")
        return {
            "success": True,
            "performance": {
                "accuracy": 0,
                "correct": 0,
                "total": 0
            }
        }


# ========== ADMIN DATABASE INFO ==========

@router.get("/database-info")
async def get_database_info(authorization: Optional[str] = Header(None)):
    """Informations sur la base de données"""
    token = extract_token_from_header(authorization)
    if not token or not verify_admin_token(token):
        raise HTTPException(status_code=401, detail="Non autorisé")
    
    try:
        from pathlib import Path
        
        # TinyDB files
        db_path = Path(__file__).parent.parent / "databases"
        
        files_info = {}
        for file in db_path.glob("*.json"):
            try:
                size = file.stat().st_size
                files_info[file.name] = {
                    "size_bytes": size,
                    "size_kb": round(size / 1024, 2),
                    "modified": file.stat().st_mtime
                }
            except:
                pass
        
        return {
            "success": True,
            "database": {
                "type": "TinyDB",
                "location": str(db_path),
                "files": files_info,
                "status": "operational"
            }
        }
    except Exception as e:
        logger.error(f"❌ Erreur DB info: {str(e)}")
        return {
            "success": True,
            "database": {
                "type": "TinyDB",
                "status": "unknown"
            }
        }


# ========== ADMIN HEALTH ==========

@router.get("/health")
async def admin_health():
    """Vérifier la santé du système admin"""
    return {
        "status": "operational",
        "admin_panel": "ready",
        "password_required": True,
        "endpoints": {
            "/login": "POST (password)",
            "/stats": "GET (auth)",
            "/predictions": "GET (auth)",
            "/performance": "GET (auth)",
            "/database-info": "GET (auth)",
            "/health": "GET (no auth)"
        }
    }
