"""
AUTHENTICATION ROUTES
Routes pour l'authentification utilisateur
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from models.user import UserCreate, UserLogin, Token, UserResponse
from services.auth_service import auth_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    """
    Crée un nouveau compte utilisateur
    
    **IMPORTANT**: Cette route est utilisée uniquement pour créer le compte initial.
    Pour des raisons de sécurité, elle peut être désactivée après la création du premier compte.
    """
    try:
        # Créer l'utilisateur
        user = await auth_service.create_user(user_data)
        
        # Authentifier immédiatement
        login_data = UserLogin(email=user_data.email, password=user_data.password)
        token = await auth_service.authenticate_user(login_data)
        
        if not token:
            raise HTTPException(status_code=500, detail="Erreur lors de la création du compte")
        
        return token
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création du compte")


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    """
    Connexion utilisateur
    
    Retourne un token JWT valide 30 jours
    """
    try:
        token = await auth_service.authenticate_user(login_data)
        
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Email ou mot de passe incorrect"
            )
        
        return token
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la connexion")


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Récupère les informations de l'utilisateur connecté
    
    Nécessite un token JWT valide dans le header Authorization
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    # Extraire le token
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Schéma d'authentification invalide")
    except ValueError:
        raise HTTPException(status_code=401, detail="Format d'autorisation invalide")
    
    # Vérifier le token et récupérer l'utilisateur
    user = await auth_service.get_current_user(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    
    return user


@router.post("/verify")
async def verify_token(authorization: Optional[str] = Header(None)):
    """
    Vérifie si un token est valide
    
    Utile pour vérifier la session avant d'effectuer des actions
    """
    if not authorization:
        return {"valid": False, "message": "No token provided"}
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            return {"valid": False, "message": "Invalid scheme"}
    except ValueError:
        return {"valid": False, "message": "Invalid format"}
    
    user = await auth_service.get_current_user(token)
    
    if not user:
        return {"valid": False, "message": "Invalid or expired token"}
    
    return {
        "valid": True,
        "user": {
            "id": user.id,
            "email": user.email
        }
    }
