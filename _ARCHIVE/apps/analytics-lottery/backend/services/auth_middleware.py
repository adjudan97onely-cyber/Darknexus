"""
AUTH MIDDLEWARE - Protection des endpoints avec JWT Bearer Token
"""

import os
from fastapi import Depends, HTTPException, Header
from typing import Optional
from services.auth_service import auth_service
import logging

logger = logging.getLogger(__name__)


async def get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    """Extrait et valide le token JWT du header Authorization"""
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header"
        )
    
    # Format attendu: "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid auth scheme")
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected: Bearer <token>"
        )
    
    return token


async def get_current_user(token: str = Depends(get_token_from_header)):
    """Dépendance pour obtenir l'utilisateur courant à partir du token"""
    user = await auth_service.get_current_user(token)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    
    return user


async def get_current_user_id(user = Depends(get_current_user)) -> str:
    """Retourne l'ID de l'utilisateur courant"""
    return user.id
