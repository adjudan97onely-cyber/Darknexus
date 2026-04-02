#!/usr/bin/env python3
"""
Crée l'utilisateur admin dans MongoDB avec workaround bcrypt
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from uuid import uuid4
import base64
import hashlib

async def create_admin():
    """Crée l'utilisateur admin avec hash simplifié pour éviter l'erreur bcrypt"""
    
    try:
        # Connexion MongoDB
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client["dark_nexus_local"]
        
        # Hash simplifié du password
        password = "DarkNexus2042!"
        # Utilise PBKDF2 hash comme fallback
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            b'darknexus_salt',
            100000
        )
        password_hash_b64 = base64.b64encode(password_hash).decode('utf-8')
        
        # Vérifie si l'utilisateur existe
        existing = await db.users.find_one({"email": "admin@darknexus.ai"})
        if existing:
            print("✅ Utilisateur admin existe déjà!")
            print(f"   Email: admin@darknexus.ai")
            print(f"   ID: {existing.get('id')}")
            
            # Essaie quand même de se connecter avec le password
            client.close()
            print("\n💡 Si la connexion ne fonctionne pas, supprime cet utilisateur et réessaie.")
            return
        
        # Crée l'utilisateur
        admin = {
            "id": str(uuid4()),
            "email": "admin@darknexus.ai",
            "password_hash": f"$pbkdf2${password_hash_b64}",
            "role": "admin",
            "_type": "user"
        }
        
        result = await db.users.insert_one(admin)
        print("✅ Utilisateur admin créé avec succès!")
        print(f"   Email: admin@darknexus.ai")
        print(f"   Password: DarkNexus2042!")
        print(f"   ID: {admin['id']}")
        print(f"   MongoDB ID: {result.inserted_id}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_admin())
