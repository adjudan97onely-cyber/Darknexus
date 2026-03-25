#!/usr/bin/env python3
"""
Crée un utilisateur directement en Python sans passlib
"""

import asyncio
import sys
import os

# Ajouter le backend aux chemins
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from uuid import uuid4

async def create_user_direct():
    """Crée un utilisateur avec bcrypt directement"""
    try:
        # Import du auth_service APRÈS que les chemins soient configurés
        from backend.services.auth_service import AuthService
        
        # Connexion MongoDB
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client["dark_nexus_local"]
        
        email = "admin@darknexus.ai"
        password = "DarkNexus2042!"
        
        # Vérifier si existe
        existing = await db.users.find_one({"email": email})
        if existing:
            print(f"✅ Utilisateur {email} existe déjà!")
            print(f"   ID: {existing.get('id')}")
            print("\n💡 Essaie de te connecter avec:")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
            client.close()
            return
        
        # Hacher le password avec bcrypt
        password_hash = AuthService.hash_password(password)
        
        # Créer l'utilisateur
        user_id = str(uuid4())
        user = {
            "id": user_id,
            "email": email,
            "password_hash": password_hash,
            "role": "admin",
            "created_at": "2024-01-01T00:00:00Z"
        }
        
        result = await db.users.insert_one(user)
        
        print("✅ Utilisateur admin créé avec succès!")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   ID: {user_id}")
        print(f"\n   Essaie maintenant de te connecter avec ces credentials.")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_user_direct())
