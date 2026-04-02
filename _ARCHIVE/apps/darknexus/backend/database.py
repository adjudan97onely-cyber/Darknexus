"""
Centralized MongoDB Database Configuration
Singleton pattern to ensure only one AsyncIOMotorClient instance
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize client (singleton pattern)
_client = None
_db = None


async def get_client():
    """Get the MongoDB client instance"""
    global _client
    if _client is None:
        mongo_url = os.environ.get('MONGO_URL')
        if not mongo_url:
            raise ValueError("MONGO_URL not found in environment variables")
        
        _client = AsyncIOMotorClient(mongo_url)
        logger.info(f"✅ MongoDB client initialized: {mongo_url[:30]}...")
    
    return _client


async def get_database():
    """Get the MongoDB database instance"""
    global _db
    if _db is None:
        client = await get_client()
        db_name = os.environ.get('DB_NAME', 'darknexus')
        _db = client[db_name]
        logger.info(f"✅ Database selected: {db_name}")
    
    return _db


async def close_client():
    """Close the MongoDB client connection"""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("✅ MongoDB client closed")


# Convenience functions for common collections
async def get_users_collection():
    """Get the users collection"""
    db = await get_database()
    return db.users


async def get_projects_collection():
    """Get the projects collection"""
    db = await get_database()
    return db.projects


async def get_chat_messages_collection():
    """Get the chat_messages collection"""
    db = await get_database()
    return db.chat_messages


async def get_status_checks_collection():
    """Get the status_checks collection"""
    db = await get_database()
    return db.status_checks
