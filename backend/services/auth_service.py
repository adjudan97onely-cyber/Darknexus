import hashlib
import secrets
from datetime import datetime, timedelta

from db import (
    create_user,
    get_subscription,
    get_user_by_email,
    get_user_by_id,
    get_user_by_token,
    revoke_token,
    save_auth_token,
    upsert_subscription,
)


PLANS = {
    "starter": {
        "name": "Starter",
        "price_month": 0,
        "features": ["Dashboard", "Historique limité", "Auto-select basic"],
    },
    "pro": {
        "name": "Pro",
        "price_month": 29,
        "features": ["Toutes analyses", "Auto-select avancé", "Notifications premium"],
    },
    "elite": {
        "name": "Elite",
        "price_month": 79,
        "features": ["API prioritaire", "Monitoring en temps réel", "Scoring avancé"],
    },
}


class AuthService:
    def hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def verify_password(self, password: str, password_hash: str) -> bool:
        return self.hash_password(password) == password_hash

    def register(self, email: str, password: str):
        existing = get_user_by_email(email)
        if existing:
            raise ValueError("Utilisateur déjà existant")
        user_id = create_user(email=email, password_hash=self.hash_password(password), role="user")
        token = self._issue_token(user_id)
        user = get_user_by_id(user_id)
        return self._public_user(user), token

    def login(self, email: str, password: str):
        user = get_user_by_email(email)
        if not user or not self.verify_password(password, user["password_hash"]):
            raise ValueError("Email ou mot de passe invalide")
        token = self._issue_token(user["id"])
        return self._public_user(user), token

    def me(self, token: str):
        user = get_user_by_token(token)
        if not user:
            return None
        profile = self._public_user(user)
        profile["subscription"] = get_subscription(user["id"])
        return profile

    def logout(self, token: str):
        revoke_token(token)

    def plans(self):
        return [{"code": code, **data} for code, data in PLANS.items()]

    def current_subscription(self, user_id: int):
        return get_subscription(user_id)

    def upgrade(self, user_id: int, plan: str):
        if plan not in PLANS:
            raise ValueError("Plan invalide")
        expires_at = (datetime.utcnow() + timedelta(days=30)).isoformat()
        upsert_subscription(user_id, plan=plan, status="active", expires_at=expires_at)
        return get_subscription(user_id)

    def _issue_token(self, user_id: int):
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.utcnow() + timedelta(days=15)).isoformat()
        save_auth_token(user_id, token, expires_at)
        return token

    def _public_user(self, user):
        return {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"],
        }


auth_service = AuthService()
