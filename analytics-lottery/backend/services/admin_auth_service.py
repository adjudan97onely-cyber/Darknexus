"""
SERVICE D'AUTHENTIFICATION ADMIN
Gestion des tokens, sessions, et permissions
"""

import jwt
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-prod")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")  # À changer!
TOKEN_EXPIRY_DAYS = 30


class AdminAuthService:
    """Service d'authentification pour l'admin"""
    
    def __init__(self, secret_key: str = SECRET_KEY):
        self.secret_key = secret_key
        self.algorithm = "HS256"
    
    def create_token(self, admin_id: str, admin_email: str) -> str:
        """Crée un JWT token pour l'admin"""
        payload = {
            "sub": admin_id,
            "email": admin_email,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS),
            "role": "admin"
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        logger.info(f"✅ Token créé pour admin: {admin_email}")
        return token
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Vérifie et décode un JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Vérifier que c'est un token admin
            if payload.get("role") != "admin":
                logger.warning(f"❌ Token non-admin tentée: {payload.get('email')}")
                return None
            
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("❌ Token expiré")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"❌ Token invalide: {str(e)}")
            return None
    
    def verify_password(self, provided_password: str, admin_password: str) -> bool:
        """Vérifie le mot de passe admin"""
        return provided_password == admin_password
    
    def authenticate_admin(self, password: str, admin_email: str = "admin@analytics-lottery.com") -> Optional[str]:
        """Authentifie l'admin et retourne un token"""
        if self.verify_password(password, ADMIN_PASSWORD):
            token = self.create_token("admin-001", admin_email)
            logger.info(f"✅ Admin authentifié: {admin_email}")
            return token
        else:
            logger.warning(f"❌ Échec authentification admin")
            return None


# Instance globale
admin_auth_service = AdminAuthService()
