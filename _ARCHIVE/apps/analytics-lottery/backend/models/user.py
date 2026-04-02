"""
USER MODEL
Modèle utilisateur pour l'authentification
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class User(BaseModel):
    """Modèle utilisateur"""
    id: str
    email: EmailStr
    password_hash: str  # Mot de passe crypté
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "user_123",
                "email": "adjudan97one.ly@gmail.com",
                "password_hash": "$2b$12$...",
                "created_at": "2025-03-14T12:00:00",
                "last_login": "2025-03-14T12:00:00"
            }
        }


class UserCreate(BaseModel):
    """Modèle pour créer un utilisateur"""
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "adjudan97one.ly@gmail.com",
                "password": "MonMotDePasseSecurise123!"
            }
        }


class UserLogin(BaseModel):
    """Modèle pour la connexion"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Réponse utilisateur (sans mot de passe)"""
    id: str
    email: EmailStr
    created_at: datetime
    last_login: Optional[datetime] = None


class Token(BaseModel):
    """Modèle de token JWT"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
