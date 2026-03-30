import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["dark_nexus_local"]
    
    # Supprimer l'ancien admin
    await db.users.delete_many({"email": "admin@darknexus.ai"})
    print("Ancien admin supprime")
    
    # Creer le nouveau admin
    admin = {
        "id": "admin-001",
        "email": "admin@darknexus.ai",
        "password_hash": pwd_context.hash("admin123"),
        "role": "admin"
    }
    await db.users.insert_one(admin)
    print("Nouvel admin cree!")
    print("Email: admin@darknexus.ai")
    print("Mot de passe: admin123")

asyncio.run(reset_admin())