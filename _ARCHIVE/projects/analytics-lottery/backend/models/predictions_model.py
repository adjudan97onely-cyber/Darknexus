"""
SQLAlchemy Models pour le système de prédictions
Tables : predictions, results, evaluations
"""

from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()


class Prediction(Base):
    """Modèle pour les prédictions"""
    __tablename__ = 'predictions'

    id = Column(Integer, primary_key=True)
    type = Column(String(50), nullable=False)  # 'keno', 'loto', 'euromillions', 'football'
    prediction_data = Column(JSON, nullable=False)  # Données complètes de la prédiction
    confidence = Column(Float, default=0.5)  # Confiance 0-1
    source = Column(String(50), default='aiEngine')  # Source des données
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relations
    evaluations = relationship("Evaluation", back_populates="prediction", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'prediction_data': self.prediction_data,
            'confidence': self.confidence,
            'source': self.source,
            'created_at': self.created_at.isoformat()
        }


class Result(Base):
    """Modèle pour les résultats réels"""
    __tablename__ = 'results'

    id = Column(Integer, primary_key=True)
    type = Column(String(50), nullable=False)  # 'keno', 'loto', 'euromillions', 'football'
    draw_date = Column(DateTime, nullable=False)  # Date du tirage/match
    result_data = Column(JSON, nullable=False)  # Données du résultat réel
    source = Column(String(100))  # Où les données proviennent (FDJ, API-Football, etc.)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relation pour les évaluations associées
    evaluations = relationship("Evaluation", back_populates="result", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'draw_date': self.draw_date.isoformat(),
            'result_data': self.result_data,
            'source': self.source,
            'recorded_at': self.recorded_at.isoformat()
        }


class Evaluation(Base):
    """Modèle pour les évaluations (prédiction vs résultat)"""
    __tablename__ = 'evaluations'

    id = Column(Integer, primary_key=True)
    prediction_id = Column(Integer, ForeignKey('predictions.id'), nullable=False)
    result_id = Column(Integer, ForeignKey('results.id'), nullable=False)
    type = Column(String(50), nullable=False)
    
    # Résultats d'évaluation
    success = Column(Boolean, default=False)  # Prédiction correcte ?
    score = Column(Float, default=0.0)  # Score 0-100
    feedback = Column(String(500))  # Feedback textuel
    evaluation_data = Column(JSON)  # Données d'évaluation complètes
    
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relations
    prediction = relationship("Prediction", back_populates="evaluations")
    result = relationship("Result", back_populates="evaluations")
    
    def to_dict(self):
        return {
            'id': self.id,
            'prediction_id': self.prediction_id,
            'result_id': self.result_id,
            'type': self.type,
            'success': self.success,
            'score': self.score,
            'feedback': self.feedback,
            'evaluation_data': self.evaluation_data,
            'evaluated_at': self.evaluated_at.isoformat()
        }


class APICache(Base):
    """Cache pour les appels API externes"""
    __tablename__ = 'api_cache'

    id = Column(Integer, primary_key=True)
    endpoint = Column(String(200), nullable=False)  # URL de l'API
    response_data = Column(JSON, nullable=False)  # Réponse en cache
    cached_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)  # Quand le cache expire
    
    def is_expired(self):
        if self.expires_at is None:
            return False
        return datetime.datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        return {
            'id': self.id,
            'endpoint': self.endpoint,
            'response_data': self.response_data,
            'cached_at': self.cached_at.isoformat(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }
