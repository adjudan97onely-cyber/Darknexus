"""
API Routes for Learning Loop - Enregistrement prédictions et résultats
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from services.learning_loop import LearningLoopService

router = APIRouter(prefix="/api/learning", tags=["Learning Loop"])

def setup_learning_routes(db):
    """Configure les routes d'apprentissage"""
    learning_service = LearningLoopService(db)
    
    @router.post("/predict")
    async def record_prediction(data: Dict[str, Any]):
        """Enregistre une prédiction pour suivi"""
        try:
            prediction_id = await learning_service.record_prediction(data)
            return {
                "success": True,
                "prediction_id": prediction_id,
                "message": "Prédiction enregistrée"
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @router.post("/result/{prediction_id}")
    async def record_result(prediction_id: str, result: Dict[str, Any]):
        """Enregistre le résultat et compare"""
        try:
            comparison = await learning_service.compare_prediction_with_result(prediction_id, result)
            if not comparison:
                raise HTTPException(status_code=404, detail="Prédiction non trouvée")
            return {
                "success": True,
                "comparison": comparison,
                "message": f"Accuracy: {comparison['accuracy']:.1f}%"
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @router.get("/performance")
    async def get_performance(prediction_type: str = None, days: int = 7):
        """Récupère les stats de performance"""
        try:
            stats = await learning_service.get_performance_stats(prediction_type, days)
            return {
                "success": True,
                "data": stats
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @router.get("/trends")
    async def get_trends(prediction_type: str = None, window_days: int = 30):
        """Analyse les tendances d'apprentissage"""
        try:
            trends = await learning_service.get_learning_trends(prediction_type, window_days)
            return {
                "success": True,
                "data": trends
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @router.put("/weights")
    async def update_weights(prediction_type: str, weights: Dict[str, float]):
        """Ajuste les poids du modèle"""
        try:
            result = await learning_service.update_model_weights(prediction_type, weights)
            return {
                "success": True,
                "data": result,
                "message": "Poids du modèle mis à jour"
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    return router
