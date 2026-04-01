"""
AUTHENTICATION SERVICE
Gestion de l'authentification sécurisée — stockage TinyDB (local)
"""

import os
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional
from tinydb import TinyDB, Query
from pathlib import Path
from models.user import User, UserCreate, UserLogin, UserResponse, Token
import logging
from uuid import uuid4

logger = logging.getLogger(__name__)

# Configuration JWT
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'analytics-local-dev-key-2026')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Base de données locale TinyDB
_DB_PATH = Path(__file__).parent.parent / 'databases' / 'users.json'
_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
_db = TinyDB(str(_DB_PATH))
_users_table = _db.table('users')

UserQuery = Query()


class AuthService:

    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )

    @staticmethod
    def create_access_token(user_id: str, email: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
        to_encode = {"sub": user_id, "email": email, "exp": expire}
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        try:
            return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except jwt.ExpiredSignatureError:
            logger.warning("Token expiré")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Token invalide")
            return None

    # ── async wrappers (compatibilité avec les routes FastAPI async) ──

    async def create_user(self, user_data: UserCreate) -> User:
        # Vérifier si email déjà pris
        existing = _users_table.search(UserQuery.email == user_data.email)
        if existing:
            raise ValueError("Un compte avec cet email existe déjà")

        user_id = str(uuid4())
        hashed_pw = self.hash_password(user_data.password)
        now = datetime.now(timezone.utc).isoformat()

        record = {
            "id": user_id,
            "email": user_data.email,
            "password_hash": hashed_pw,
            "created_at": now,
            "role": "user",
        }
        _users_table.insert(record)
        logger.info(f"✅ Utilisateur créé : {user_data.email}")

        return User(
            id=user_id,
            email=user_data.email,
            password_hash=hashed_pw,
            created_at=datetime.fromisoformat(now),
            role="user",
        )

    async def authenticate_user(self, login_data: UserLogin) -> Optional[Token]:
        records = _users_table.search(UserQuery.email == login_data.email)
        if not records:
            return None
        record = records[0]

        if not self.verify_password(login_data.password, record["password_hash"]):
            return None

        token = self.create_access_token(record["id"], record["email"])
        return Token(
            access_token=token,
            token_type="bearer",
            user_id=record["id"],
            email=record["email"],
        )

    async def get_current_user(self, token: str) -> Optional[UserResponse]:
        payload = self.decode_token(token)
        if not payload:
            return None

        user_id = payload.get("sub")
        records = _users_table.search(UserQuery.id == user_id)
        if not records:
            return None
        record = records[0]

        return UserResponse(
            id=record["id"],
            email=record["email"],
            role=record.get("role", "user"),
            created_at=record.get("created_at", ""),
        )


auth_service = AuthService()
