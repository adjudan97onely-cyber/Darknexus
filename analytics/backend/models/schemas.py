"""
Schémas Pydantic pour les loteries
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Recommendation(BaseModel):
    """Recommandation de numéros"""
    lottery_type: str = Field(..., description="Type de loterie (keno, euromillions, loto)")
    numbers: List[int] = Field(..., description="Numéros recommandés")
    score: float = Field(..., ge=0, le=100, description="Score de confiance 0-100")
    reason: str = Field(..., description="Explication de la recommandation")
    created_at: Optional[datetime] = None


class GridGenerated(BaseModel):
    """Grille générée pour un tirage"""
    lottery_type: str
    numbers: List[int]
    confidence: float = Field(ge=0, le=100)
    matches_previous: int = Field(description="Nombre de matchs avec tirages précédents")


class LotteryAnalysis(BaseModel):
    """Analyse statistique d'une loterie"""
    lottery_type: str
    total_draws: int
    frequency_analysis: dict = Field(description="Fréquence des numéros")
    anomalies: List[str] = Field(description="Anomalies détectées")
    mean_appearance: Optional[float] = Field(description="Moyenne d'apparition des numéros")
    most_common: List[int] = Field(description="Numéros les plus courants")
    least_common: List[int] = Field(description="Numéros les moins courants")
    analysis_date: datetime = Field(default_factory=datetime.now)


class LotteryDraw(BaseModel):
    """Un tirage de loterie"""
    id: Optional[int] = None
    lottery_type: str
    numbers: List[int]
    bonus: Optional[int] = None
    date: datetime
    created_at: Optional[datetime] = None


class PredictionRequest(BaseModel):
    """Requête de prédiction"""
    lottery_type: str = Field(..., description="keno | euromillions | loto")
    
    
class PredictionResponse(BaseModel):
    """Réponse de prédiction"""
    lottery_type: str
    predicted_numbers: List[int]
    bonus: Optional[int] = None
    confidence: float = Field(ge=0, le=100)
    analysis: dict = Field(description="Détails de l'analyse")
