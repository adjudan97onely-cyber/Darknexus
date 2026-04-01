import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from uuid import uuid4

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["dark_nexus_local"]
    
    existing = await db.users.find_one({"email": "admin@darknexus.ai"})
    if existing:
        print("Utilisateur admin existe deja!")
        print("Email: admin@darknexus.ai")
        print("Mot de passe: DarkNexus2042!")
        return
    
    admin = {
        "id": str(uuid4()),
        "email": "admin@darknexus.ai",
        "password_hash": pwd_context.hash("DarkNexus2042!"),
        "role": "admin"
    }
    await db.users.insert_one(admin)
    print("Utilisateur admin cree avec succes!")
    print("Email: admin@darknexus.ai")
    print("Mot de passe: DarkNexus2042!")

if __name__ == "__main__":
    asyncio.run(create_admin())