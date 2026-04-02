"""
Modèles MongoDB pour Analyseur de Loteries
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Any
from datetime import datetime


class DrawNumber(BaseModel):
    """Un tirage de loterie"""
    draw_id: str
    lottery_type: str  # "keno", "euromillions", "loto"
    date: datetime
    numbers: List[int]
    bonus: Optional[int] = None  # ex: Euromillions star
    

class LotteryAnalysis(BaseModel):
    """Analyse d'une loterie"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    lottery_type: str
    total_draws: int
    date_range: Dict[str, datetime]
    frequency: Dict[int, float]
    hot_numbers: List[int]
    cold_numbers: List[int]
    mean_frequency: float
    std_dev: float
    top_scores: List[Dict[str, Any]]
    balance: Dict[str, Dict]
    last_updated: datetime


class Recommendation(BaseModel):
    """Recommandation intelligente"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    lottery_type: str
    recommended_numbers: List[int]
    score: float  # 0-100
    confidence: int  # %
    reason: str
    top_numbers: List[Dict[str, Any]]
    generated_at: datetime
    validity_hours: int = 24


class GridGenerated(BaseModel):
    """Grille générée automatiquement"""
    grid_id: str
    lottery_type: str
    numbers: List[int]
    bonus: Optional[int] = None
    score: float
    reasoning: str
    generated_at: datetime


class SportsMatch(BaseModel):
    """Un match pour paris sportifs"""
    match_id: str
    sport: str  # "football"
    date: datetime
    home_team: str
    away_team: str
    league: str
    home_recent_form: List[str]  # ['W', 'D', 'L', ...]
    away_recent_form: List[str]
    home_avg_goals: float
    away_avg_goals_conceded: float
    away_avg_goals: float
    home_avg_goals_conceded: float
    h2h_history: Dict  # {"home_wins": 5, "draws": 2, "away_wins": 3}
    

class SportsPrediction(BaseModel):
    """Prédiction pour un match"""
    match_id: str
    match_info: Dict  # {home, away, date, league}
    prediction: Dict
    confidence: int
    generated_at: datetime
    reasoning: str


class UserProfile(BaseModel):
    """Profil utilisateur (Phase 2)"""
    user_id: str
    email: str
    preferences: Dict
    favorite_lotteries: List[str]
    favorite_sports: List[str]
    created_at: datetime
    updated_at: datetime
