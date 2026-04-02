"""
Routes API pour les loteries
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models import Recommendation, GridGenerated, LotteryAnalysis
from services.lottery_service import LotteryService

router = APIRouter(prefix="/api/lotteries", tags=["Lotteries"])


def setup_lottery_routes(db):
    """Configure les routes avec le service de loterie"""
    
    lottery_service = LotteryService(db)
    
    @router.get("/analyze/{lottery_type}")
    async def analyze_lottery(lottery_type: str):
        """Analyse une loterie spécifique"""
        
        if lottery_type not in ["keno", "euromillions", "loto"]:
            raise HTTPException(status_code=400, detail="Type de loterie invalide")
        
        analysis = await lottery_service.analyze_lottery(lottery_type)
        
        if not analysis:
            raise HTTPException(status_code=404, detail=f"Pas de données pour {lottery_type}")
        
        return analysis.dict()
    
    @router.get("/statistics/{lottery_type}")
    async def get_statistics(lottery_type: str):
        """Récupère les statistiques d'une loterie"""
        
        if lottery_type not in ["keno", "euromillions", "loto"]:
            raise HTTPException(status_code=400, detail="Type de loterie invalide")
        
        stats = await lottery_service.get_statistics(lottery_type)
        
        if not stats:
            raise HTTPException(status_code=404, detail="Pas de statistiques disponibles")
        
        return stats
    
    @router.get("/recommendations/{lottery_type}")
    async def get_recommendations(
        lottery_type: str,
        top_n: int = Query(10, ge=1, le=50)
    ) -> List[Recommendation]:
        """Récupère les recommandations de numéros"""
        
        if lottery_type not in ["keno", "euromillions", "loto"]:
            raise HTTPException(status_code=400, detail="Type de loterie invalide")
        
        recommendations = await lottery_service.get_recommendations(lottery_type, top_n)
        
        if not recommendations:
            raise HTTPException(status_code=404, detail="Pas de recommandations disponibles")
        
        return recommendations
    
    @router.get("/grids/{lottery_type}")
    async def generate_grids(
        lottery_type: str,
        num_grids: int = Query(5, ge=1, le=20)
    ) -> List[GridGenerated]:
        """Génère des grilles de jeu recommandées"""
        
        if lottery_type not in ["keno", "euromillions", "loto"]:
            raise HTTPException(status_code=400, detail="Type de loterie invalide")
        
        grids = await lottery_service.generate_grid(lottery_type, num_grids)
        
        if not grids:
            raise HTTPException(status_code=404, detail="Impossible de générer les grilles")
        
        return [g.dict() for g in grids]
    
    @router.get("/keno/analysis")
    async def get_keno_analysis():
        """Analyse complète pour Keno"""
        analysis = await lottery_service.analyze_lottery("keno")
        if not analysis:
            raise HTTPException(status_code=404, detail="Pas de données Keno")
        return analysis.dict()
    
    @router.get("/euromillions/analysis")
    async def get_euromillions_analysis():
        """Analyse complète pour Euromillions"""
        analysis = await lottery_service.analyze_lottery("euromillions")
        if not analysis:
            raise HTTPException(status_code=404, detail="Pas de données Euromillions")
        return analysis.dict()
    
    @router.get("/loto/analysis")
    async def get_loto_analysis():
        """Analyse complète pour Loto"""
        analysis = await lottery_service.analyze_lottery("loto")
        if not analysis:
            raise HTTPException(status_code=404, detail="Pas de données Loto")
        return analysis.dict()
    
    return router
