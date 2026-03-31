"""
Learning Loop Service - Boucle d'apprentissage pour amélioration continue
Prédiction → Résultat → Comparaison → Apprentissage → Amélioration
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json

class LearningLoopService:
    """
    Gère la boucle d'apprentissage:
    1. Enregistre les prédictions
    2. Compare avec les résultats réels
    3. Calcule accuracy
    4. Ajuste les poids des modèles
    """
    
    def __init__(self, db):
        self.db = db
        
    async def record_prediction(self, data: Dict[str, Any]):
        """Enregistre une prédiction"""
        predictions_col = self.db["predictions"]
        
        prediction_record = {
            "prediction_type": data.get("type"),  # "keno", "loto", "euromillions", "football"
            "predicted_values": data.get("values"),  # Liste des nombres/matchs prédits
            "confidence": data.get("confidence"),
            "timestamp": datetime.now().isoformat(),
            "status": "pending"  # pending, completed, winning, losing
        }
        
        result = await predictions_col.insert_one(prediction_record)
        return result.get("inserted_id", "")
    
    async def compare_prediction_with_result(self, prediction_id: str, actual_result: Dict[str, Any]):
        """Compare la prédiction avec le résultat réel"""
        predictions_col = self.db["predictions"]
        
        # Récupérer la prédiction
        prediction = await predictions_col.find_one({"_id": prediction_id})
        if not prediction:
            return None
        
        # Comparer
        predicted = set(prediction.get("predicted_values", []))
        actual = set(actual_result.get("values", []))
        
        matched = predicted.intersection(actual)
        accuracy = len(matched) / len(predicted) * 100 if predicted else 0
        
        # Mettre à jour la prédiction
        status = "winning" if accuracy >= 40 else "losing"
        
        await predictions_col.update_one(
            {"_id": prediction_id},
            {
                "status": status,
                "actual_result": actual_result,
                "matched_count": len(matched),
                "accuracy": accuracy,
                "completed_at": datetime.now().isoformat()
            }
        )
        
        return {
            "prediction_id": prediction_id,
            "predicted": list(predicted),
            "actual": list(actual),
            "matched": list(matched),
            "accuracy": accuracy,
            "status": status
        }
    
    async def get_performance_stats(self, prediction_type: str = None, days: int = 7):
        """Récupère les stats de performance"""
        predictions_col = self.db["predictions"]
        
        # Résultats des 7 derniers jours
        since = (datetime.now() - timedelta(days=days)).isoformat()
        
        query = {
            "timestamp": {"$gte": since},
            "status": {"$in": ["winning", "losing"]}
        }
        if prediction_type:
            query["prediction_type"] = prediction_type
        
        results = await predictions_col.find(query)
        
        if not results:
            return {"accuracy": 0, "total": 0, "winning": 0, "losing": 0}
        
        total = len(results)
        winning = sum(1 for r in results if r.get("status") == "winning")
        losing = total - winning
        avg_accuracy = sum(r.get("accuracy", 0) for r in results) / total if total > 0 else 0
        
        return {
            "type": prediction_type or "all",
            "period_days": days,
            "total_predictions": total,
            "winning": winning,
            "losing": losing,
            "accuracy_rate": round(avg_accuracy, 1),
            "win_rate": round((winning / total * 100), 1) if total > 0 else 0
        }
    
    async def update_model_weights(self, prediction_type: str, new_weights: Dict[str, float]):
        """Ajuste les poids du modèle basé sur l'apprentissage"""
        models_col = self.db.get("models", {})
        
        await models_col.update_one(
            {"type": prediction_type},
            {
                "weights": new_weights,
                "updated_at": datetime.now().isoformat(),
                "learning_phase": "active"
            }
        )
        
        return {"success": True, "updated": prediction_type}
    
    async def get_learning_trends(self, prediction_type: str = None, window_days: int = 30):
        """Analyse les tendances d'apprentissage"""
        predictions_col = self.db["predictions"]
        
        since = (datetime.now() - timedelta(days=window_days)).isoformat()
        
        query = {
            "timestamp": {"$gte": since},
            "status": {"$in": ["winning", "losing"]}
        }
        if prediction_type:
            query["prediction_type"] = prediction_type
        
        results = await predictions_col.find(query)
        
        if not results:
            return {}
        
        # Grouper par semaine
        trends = {}
        for r in results:
            week = r.get("timestamp", "").split("T")[0]
            if week not in trends:
                trends[week] = {"total": 0, "winning": 0}
            trends[week]["total"] += 1
            if r.get("status") == "winning":
                trends[week]["winning"] += 1
        
        # Calculer tendance
        for week, stats in trends.items():
            stats["accuracy"] = round((stats["winning"] / stats["total"] * 100), 1) if stats["total"] > 0 else 0
        
        return {
            "type": prediction_type or "all",
            "period_days": window_days,
            "weekly_trends": trends,
            "overall_improvement": "↑" if len(trends) > 1 and list(trends.values())[-1]["accuracy"] > list(trends.values())[0]["accuracy"] else "→"
        }


# Export
learning_service = None

def init_learning_service(db):
    """Initialise le service"""
    global learning_service
    learning_service = LearningLoopService(db)
    return learning_service
