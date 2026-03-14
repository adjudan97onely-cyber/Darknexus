"""
AUTHENTICATION SERVICE
Gestion de l'authentification sécurisée
"""

import os
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import User, UserCreate, UserLogin, UserResponse, Token
import logging
from uuid import uuid4

logger = logging.getLogger(__name__)

# Configuration JWT
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'adj-killagain-super-secret-key-2025-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30  # Token valide 30 jours

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
users_collection = db.users


class AuthService:
    """Service d'authentification"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash un mot de passe avec bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Vérifie un mot de passe"""
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    
    @staticmethod
    def create_access_token(user_id: str, email: str) -> str:
        """Crée un token JWT"""
        expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
        to_encode = {
            "sub": user_id,
            "email": email,
            "exp": expire
        }
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict]:
        """Vérifie et décode un token JWT"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.error("Token expired")
            return None
        except jwt.JWTError as e:
            logger.error(f"JWT Error: {str(e)}")
            return None
    
    @staticmethod
    async def create_user(user_data: UserCreate) -> User:
        """Crée un nouvel utilisateur"""
        # Vérifier si l'email existe déjà
        existing_user = await users_collection.find_one(
            {"email": user_data.email},
            {"_id": 0}
        )
        
        if existing_user:
            raise ValueError("Cet email est déjà utilisé")
        
        # Créer l'utilisateur
        user_id = str(uuid4())
        password_hash = AuthService.hash_password(user_data.password)
        
        user = User(
            id=user_id,
            email=user_data.email,
            password_hash=password_hash,
            created_at=datetime.now(timezone.utc)
        )
        
        # Sauvegarder dans MongoDB
        await users_collection.insert_one(user.dict())
        
        logger.info(f"User created: {user.email}")
        return user
    
    @staticmethod
    async def authenticate_user(login_data: UserLogin) -> Optional[Token]:
        """Authentifie un utilisateur et retourne un token"""
        # Trouver l'utilisateur
        user = await users_collection.find_one(
            {"email": login_data.email},
            {"_id": 0}
        )
        
        if not user:
            logger.warning(f"Login failed: User not found - {login_data.email}")
            return None
        
        # Vérifier le mot de passe
        if not AuthService.verify_password(login_data.password, user['password_hash']):
            logger.warning(f"Login failed: Wrong password - {login_data.email}")
            return None
        
        # Mettre à jour last_login
        await users_collection.update_one(
            {"id": user['id']},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
        
        # Créer le token
        access_token = AuthService.create_access_token(user['id'], user['email'])
        
        # Préparer la réponse
        user_response = UserResponse(
            id=user['id'],
            email=user['email'],
            created_at=user['created_at'],
            last_login=datetime.now(timezone.utc)
        )
        
        token = Token(
            access_token=access_token,
            user=user_response
        )
        
        logger.info(f"User logged in: {user['email']}")
        return token
    
    @staticmethod
    async def get_current_user(token: str) -> Optional[UserResponse]:
        """Récupère l'utilisateur actuel depuis le token"""
        payload = AuthService.verify_token(token)
        
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        # Récupérer l'utilisateur
        user = await users_collection.find_one(
            {"id": user_id},
            {"_id": 0}
        )
        
        if not user:
            return None
        
        return UserResponse(
            id=user['id'],
            email=user['email'],
            created_at=user['created_at'],
            last_login=user.get('last_login')
        )


# Instance globale
auth_service = AuthService()
