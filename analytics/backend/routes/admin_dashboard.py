"""
ADMIN DASHBOARD ROUTES
Routes protégées pour l'administration complète
"""

from fastapi import APIRouter, HTTPException, Header, Depends, Query
from typing import Optional
from pydantic import BaseModel
from services.admin_auth_service import admin_auth_service
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class LoginRequest(BaseModel):
    password: str
    email: Optional[str] = "admin@analytics-lottery.com"


class AdminStats(BaseModel):
    total_predictions: int
    winning_predictions: int
    accuracy_rate: float
    active_users: int
    models_trained: int
    last_update: str


def get_admin_token(authorization: Optional[str] = Header(None)) -> dict:
    """Dependency pour vérifier le token admin"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Schéma invalide")
    except ValueError:
        raise HTTPException(status_code=401, detail="Format invalide")
    
    # Vérifier le token
    payload = admin_auth_service.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    
    return payload


def setup_admin_routes(db) -> APIRouter:
    """Configure les routes admin"""
    router = APIRouter(prefix="/api/admin", tags=["admin"])
    
    @router.post("/login")
    async def admin_login(request: LoginRequest):
        """
        Connexion admin
        
        **Password**: Défini via env var ADMIN_PASSWORD
        """
        token = admin_auth_service.authenticate_admin(request.password, request.email)
        
        if not token:
            logger.warning(f"❌ Tentative login échouée")
            raise HTTPException(status_code=401, detail="Mot de passe incorrect")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 2592000,  # 30 jours
            "role": "admin",
            "message": "✅ Connecté en tant qu'administrateur"
        }
    
    @router.get("/stats")
    async def get_admin_stats(admin: dict = Depends(get_admin_token)):
        """
        Dashboard admin - Statistiques globales
        
        ✅ Réservé aux administrateurs
        """
        try:
            # Récupérer les stats de la base de données
            from config.database import get_predictions_collection, get_models_collection
            
            predictions_col = get_predictions_collection(db)
            models_col = get_models_collection(db)
            
            total_preds = await predictions_col.count_documents({})
            winning_preds = await predictions_col.count_documents({"status": "winning"})
            
            # Calculer l'accuracy
            accuracy = (winning_preds / total_preds * 100) if total_preds > 0 else 0
            
            # Compter les modèles
            models = await models_col.count_documents({})
            
            return {
                "success": True,
                "admin_email": admin.get("email"),
                "stats": {
                    "total_predictions": total_preds,
                    "winning_predictions": winning_preds,
                    "accuracy_rate": round(accuracy, 2),
                    "models_trained": models,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }
        except Exception as e:
            logger.error(f"❌ Erreur stats: {str(e)}")
            raise HTTPException(status_code=500, detail="Erreur lors de la récupération des stats")
    
    @router.get("/predictions")
    async def list_predictions(
        admin: dict = Depends(get_admin_token),
        limit: int = Query(50, ge=1, le=1000),
        offset: int = Query(0, ge=0)
    ):
        """
        Liste toutes les prédictions
        
        ✅ Réservé aux administrateurs
        """
        try:
            from config.database import get_predictions_collection
            
            predictions_col = get_predictions_collection(db)
            
            # Récupérer les prédictions
            predictions = await predictions_col.find() \
                .sort("created_at", -1) \
                .skip(offset) \
                .limit(limit) \
                .to_list(length=limit)
            
            total = await predictions_col.count_documents({})
            
            return {
                "success": True,
                "total": total,
                "limit": limit,
                "offset": offset,
                "predictions": predictions
            }
        except Exception as e:
            logger.error(f"❌ Erreur listing predictions: {str(e)}")
            raise HTTPException(status_code=500, detail="Erreur")
    
    @router.get("/performance")
    async def admin_performance(
        admin: dict = Depends(get_admin_token),
        days: int = Query(7, ge=1, le=90)
    ):
        """
        Aperçu de performance sur les derniers jours
        
        ✅ Réservé aux administrateurs
        """
        try:
            from config.database import get_performance_collection
            from datetime import timedelta
            
            perf_col = get_performance_collection(db)
            
            # Performance globale
            perf_data = await perf_col.find_one() or {}
            
            return {
                "success": True,
                "period_days": days,
                "performance": {
                    "total_predictions": perf_data.get("total", 0),
                    "winning": perf_data.get("winning", 0),
                    "losing": perf_data.get("losing", 0),
                    "accuracy": perf_data.get("accuracy", 0),
                    "last_updated": perf_data.get("updated_at", "N/A")
                }
            }
        except Exception as e:
            logger.error(f"❌ Erreur performance: {str(e)}")
            raise HTTPException(status_code=500, detail="Erreur")
    
    @router.post("/reset-models")
    async def reset_models(admin: dict = Depends(get_admin_token)):
        """
        Réinitialise tous les modèles d'IA
        
        ⚠️ Action irréversible!
        ✅ Réservé aux administrateurs
        """
        try:
            from config.database import get_models_collection
            
            models_col = get_models_collection(db)
            
            # Supprimer tous les modèles
            result = await models_col.delete_many({})
            
            logger.warning(f"🔄 Modèles réinitialisés: {result.deleted_count} records")
            
            return {
                "success": True,
                "message": f"✅ {result.deleted_count} modèles supprimés",
                "action": "reset_models",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"❌ Erreur reset models: {str(e)}")
            raise HTTPException(status_code=500, detail="Erreur")
    
    @router.get("/database-info")
    async def database_info(admin: dict = Depends(get_admin_token)):
        """
        Informations sur la base de données
        
        ✅ Réservé aux administrateurs
        """
        try:
            # Compter les collections
            from config.database import (
                get_draws_collection,
                get_analysis_collection,
                get_predictions_collection,
                get_models_collection
            )
            
            draws = await get_draws_collection(db).count_documents({})
            analysis = await get_analysis_collection(db).count_documents({})
            predictions = await get_predictions_collection(db).count_documents({})
            models = await get_models_collection(db).count_documents({})
            
            return {
                "success": True,
                "database": {
                    "draws": draws,
                    "analysis": analysis,
                    "predictions": predictions,
                    "models": models,
                    "total_documents": draws + analysis + predictions + models
                },
                "status": "✅ Connectée"
            }
        except Exception as e:
            logger.error(f"❌ Erreur DB info: {str(e)}")
            raise HTTPException(status_code=500, detail="Erreur")
    
    @router.post("/export-data")
    async def export_data(admin: dict = Depends(get_admin_token)):
        """
        Exporte toutes les données (format JSON)
        
        ✅ Réservé aux administrateurs
        """
        try:
            from config.database import (
                get_draws_collection,
                get_predictions_collection,
                get_models_collection
            )
            import json
            
            draws_data = await get_draws_collection(db).find().to_list(10000)
            predictions_data = await get_predictions_collection(db).find().to_list(10000)
            models_data = await get_models_collection(db).find().to_list(10000)
            
            # Convertir ObjectId en string pour JSON
            def convert_objectid(obj):
                if isinstance(obj, dict):
                    return {k: convert_objectid(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_objectid(item) for item in obj]
                else:
                    return str(obj)
            
            export_data = {
                "draws": [convert_objectid(d) for d in draws_data],
                "predictions": [convert_objectid(p) for p in predictions_data],
                "models": [convert_objectid(m) for m in models_data],
                "exported_at": datetime.now(timezone.utc).isoformat()
            }
            
            return {
                "success": True,
                "message": "✅ Données exportées",
                "data": export_data
            }
        except Exception as e:
            logger.error(f"❌ Erreur export: {str(e)}")
            raise HTTPException(status_code=500, detail="Erreur")
    
    return router
