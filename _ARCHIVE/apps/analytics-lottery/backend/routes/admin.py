"""
ADMIN ROUTES
Routes réservées aux administrateurs
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from pydantic import BaseModel
from services.auth_service import auth_service, users_collection
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["admin"])


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Change le mot de passe de l'utilisateur connecté (Admin uniquement)
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    try:
        # Extraire et vérifier le token
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Schéma d'authentification invalide")
    except ValueError:
        raise HTTPException(status_code=401, detail="Format d'autorisation invalide")
    
    # Vérifier le token et récupérer l'utilisateur
    user = await auth_service.get_current_user(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    
    # Vérifier que l'utilisateur est admin
    user_doc = await users_collection.find_one({"id": user.id}, {"_id": 0})
    if not user_doc or user_doc.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    
    # Vérifier le mot de passe actuel
    if not auth_service.verify_password(request.current_password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Mot de passe actuel incorrect")
    
    # Hasher le nouveau mot de passe
    new_password_hash = auth_service.hash_password(request.new_password)
    
    # Mettre à jour dans la base de données
    from datetime import datetime, timezone
    result = await users_collection.update_one(
        {"id": user.id},
        {"$set": {
            "password_hash": new_password_hash,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Erreur lors du changement de mot de passe")
    
    logger.info(f"Password changed for admin user: {user.email}")
    
    return {
        "success": True,
        "message": "Mot de passe changé avec succès"
    }
