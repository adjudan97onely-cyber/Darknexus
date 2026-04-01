"""
ADMIN ROUTES
Routes réservées aux administrateurs
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from pydantic import BaseModel
from services.auth_service import auth_service, _users_table, UserQuery
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
    if not authorization:
        raise HTTPException(status_code=401, detail="Non authentifié")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer':
            raise HTTPException(status_code=401, detail="Schéma d'authentification invalide")
    except ValueError:
        raise HTTPException(status_code=401, detail="Format d'autorisation invalide")

    user = await auth_service.get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    records = _users_table.search(UserQuery.id == user.id)
    if not records or records[0].get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")

    user_doc = records[0]
    if not auth_service.verify_password(request.current_password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Mot de passe actuel incorrect")

    new_hash = auth_service.hash_password(request.new_password)
    _users_table.update({'password_hash': new_hash}, UserQuery.id == user.id)

    logger.info(f"Mot de passe changé pour : {user.email}")
    return {"success": True, "message": "Mot de passe changé avec succès"}
