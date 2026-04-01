import asyncio
import os
from datetime import datetime, timezone
from uuid import uuid4

import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


async def main() -> None:
    email = os.environ.get("LOCAL_USER_EMAIL")
    password = os.environ.get("LOCAL_USER_PASSWORD")

    if not email or not password:
        raise SystemExit("LOCAL_USER_EMAIL et LOCAL_USER_PASSWORD sont requis")

    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    users = db.users

    existing = await users.find_one({"email": email}, {"_id": 0})
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    now = datetime.now(timezone.utc)

    if existing:
        await users.update_one(
            {"email": email},
            {"$set": {"password_hash": password_hash, "updated_at": now}},
        )
        print(f"UPDATED:{email}")
    else:
        await users.insert_one(
            {
                "id": str(uuid4()),
                "email": email,
                "password_hash": password_hash,
                "created_at": now,
                "last_login": None,
            }
        )
        print(f"CREATED:{email}")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())