"""
Routes API pour les sports
"""
from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict
from models import SportsPrediction
from services.sports_service import SportsService

router = APIRouter(prefix="/api/sports", tags=["Sports"])


def setup_sports_routes(db):
    """Configure les routes avec le service de sports"""
    
    sports_service = SportsService(db)
    
    @router.get("/matches")
    async def get_upcoming_matches():
        """Récupère les matchs prochains avec recommandations"""
        
        recommendations = await sports_service.get_live_recommendations("football")
        
        if not recommendations:
            raise HTTPException(status_code=404, detail="Pas de matchs disponibles")
        
        return recommendations
    
    @router.get("/matches/{home_team}/vs/{away_team}/prediction")
    async def predict_specific_match(home_team: str, away_team: str) -> Dict:
        """Prédit un match spécifique"""
        
        try:
            prediction = await sports_service.predict_match(home_team, away_team)
            return prediction.dict()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur de prédiction: {str(e)}")
    
    @router.post("/matches/predict")
    async def predict_multiple_matches(
        matches: List[Dict] = Body(..., example=[
            {"home": "PSG", "away": "OM"},
            {"home": "Monaco", "away": "OL"}
        ])
    ) -> List[Dict]:
        """Prédit plusieurs matchs"""
        
        if not matches or len(matches) == 0:
            raise HTTPException(status_code=400, detail="Liste de matchs vide")
        
        predictions = await sports_service.predict_matches_batch(matches)
        
        return [p.dict() for p in predictions]
    
    @router.get("/team/{team_name}/form")
    async def get_team_form(team_name: str):
        """Récupère la forme d'une équipe"""
        
        form = await sports_service.get_team_form(team_name)
        
        if form["matches_found"] == 0:
            raise HTTPException(status_code=404, detail=f"Pas de données pour {team_name}")
        
        return form
    
    @router.get("/statistics")
    async def get_sports_statistics():
        """Récupère les statistiques globales"""
        
        stats = await sports_service.get_sports_statistics()
        
        if not stats:
            raise HTTPException(status_code=404, detail="Pas de statistiques disponibles")
        
        return stats
    
    @router.get("/recommendations")
    async def get_sports_recommendations():
        """Récupère les recommandations de matchs"""
        
        recommendations = await sports_service.get_live_recommendations()
        
        if not recommendations:
            raise HTTPException(status_code=404, detail="Pas de recommandations disponibles")
        
        return recommendations
    
    @router.get("/football/analysis")
    async def get_football_analysis():
        """Analyse complète pour le football"""
        
        stats = await sports_service.get_sports_statistics()
        recommendations = await sports_service.get_live_recommendations("football")
        
        return {
            "sport": "football",
            "statistics": stats,
            "recommendations": recommendations
        }
    
    return router
