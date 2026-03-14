"""
USER MEMORY SERVICE - Système de mémoire pour l'assistant
Permet à l'assistant de se souvenir des préférences et historique utilisateur
"""

import logging
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os

logger = logging.getLogger(__name__)

# MongoDB - avec fallback si variable manquante
try:
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'codeforge')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
except Exception as e:
    logger.error(f"Error connecting to MongoDB: {e}")
    db = None

# Collections
if db is not None:
    user_preferences_collection = db.user_preferences
    conversation_history_collection = db.conversation_history
    user_patterns_collection = db.user_patterns
else:
    user_preferences_collection = None
    conversation_history_collection = None
    user_patterns_collection = None


class UserMemoryService:
    """
    Gère la mémoire persistante de l'utilisateur
    """
    
    async def store_conversation(self, user_id: str, message: str, response: str, metadata: Dict = None):
        """Stocke une conversation dans l'historique"""
        try:
            conversation = {
                'user_id': user_id,
                'message': message,
                'response': response,
                'metadata': metadata or {},
                'timestamp': datetime.utcnow()
            }
            
            await conversation_history_collection.insert_one(conversation)
            logger.info(f"Conversation stored for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error storing conversation: {str(e)}")
    
    async def get_conversation_history(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Récupère l'historique des conversations"""
        try:
            conversations = await conversation_history_collection.find(
                {'user_id': user_id},
                {'_id': 0}
            ).sort('timestamp', -1).limit(limit).to_list(limit)
            
            return list(reversed(conversations))  # Plus anciens en premier
            
        except Exception as e:
            logger.error(f"Error getting conversation history: {str(e)}")
            return []
    
    async def get_recent_context(self, user_id: str, limit: int = 10) -> str:
        """Récupère le contexte récent formaté pour l'IA"""
        try:
            conversations = await self.get_conversation_history(user_id, limit)
            
            if not conversations:
                return ""
            
            context = "📚 **Historique récent de nos conversations** :\n\n"
            for conv in conversations:
                date = conv['timestamp'].strftime("%d/%m à %H:%M")
                context += f"[{date}]\n"
                context += f"Toi : {conv['message'][:100]}...\n"
                context += f"Moi : {conv['response'][:100]}...\n\n"
            
            return context
            
        except Exception as e:
            logger.error(f"Error getting recent context: {str(e)}")
            return ""
    
    async def store_preference(self, user_id: str, key: str, value: Any):
        """Stocke une préférence utilisateur"""
        try:
            await user_preferences_collection.update_one(
                {'user_id': user_id},
                {
                    '$set': {
                        f'preferences.{key}': value,
                        'updated_at': datetime.utcnow()
                    },
                    '$setOnInsert': {
                        'user_id': user_id,
                        'created_at': datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            logger.info(f"Preference '{key}' stored for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error storing preference: {str(e)}")
    
    async def get_preference(self, user_id: str, key: str, default: Any = None) -> Any:
        """Récupère une préférence utilisateur"""
        try:
            user_prefs = await user_preferences_collection.find_one(
                {'user_id': user_id},
                {'_id': 0, f'preferences.{key}': 1}
            )
            
            if user_prefs and 'preferences' in user_prefs and key in user_prefs['preferences']:
                return user_prefs['preferences'][key]
            
            return default
            
        except Exception as e:
            logger.error(f"Error getting preference: {str(e)}")
            return default
    
    async def get_all_preferences(self, user_id: str) -> Dict[str, Any]:
        """Récupère toutes les préférences d'un utilisateur"""
        try:
            user_prefs = await user_preferences_collection.find_one(
                {'user_id': user_id},
                {'_id': 0, 'preferences': 1}
            )
            
            return user_prefs.get('preferences', {}) if user_prefs else {}
            
        except Exception as e:
            logger.error(f"Error getting all preferences: {str(e)}")
            return {}
    
    async def learn_pattern(self, user_id: str, pattern_type: str, pattern_data: Dict):
        """Apprend un pattern de comportement utilisateur"""
        try:
            await user_patterns_collection.update_one(
                {'user_id': user_id, 'pattern_type': pattern_type},
                {
                    '$inc': {'count': 1},
                    '$set': {
                        'last_occurrence': datetime.utcnow(),
                        'data': pattern_data
                    },
                    '$setOnInsert': {
                        'user_id': user_id,
                        'pattern_type': pattern_type,
                        'first_occurrence': datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            logger.info(f"Pattern '{pattern_type}' learned for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error learning pattern: {str(e)}")
    
    async def get_patterns(self, user_id: str) -> List[Dict]:
        """Récupère les patterns appris"""
        try:
            patterns = await user_patterns_collection.find(
                {'user_id': user_id},
                {'_id': 0}
            ).sort('count', -1).to_list(100)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error getting patterns: {str(e)}")
            return []
    
    async def get_user_context_summary(self, user_id: str) -> str:
        """Génère un résumé complet du contexte utilisateur"""
        try:
            # Préférences
            prefs = await self.get_all_preferences(user_id)
            
            # Patterns
            patterns = await self.get_patterns(user_id)
            
            # Historique récent
            recent_context = await self.get_recent_context(user_id, 5)
            
            summary = "🧠 **Ce que je sais de toi** :\n\n"
            
            # Préférences
            if prefs:
                summary += "**Tes préférences** :\n"
                for key, value in prefs.items():
                    summary += f"- {key} : {value}\n"
                summary += "\n"
            
            # Patterns fréquents
            if patterns:
                summary += "**Ce que tu fais souvent** :\n"
                for pattern in patterns[:3]:  # Top 3
                    summary += f"- {pattern['pattern_type']} ({pattern['count']} fois)\n"
                summary += "\n"
            
            # Historique
            if recent_context:
                summary += recent_context
            
            if not prefs and not patterns and not recent_context:
                summary = "🆕 **Première fois qu'on travaille ensemble !**\n\n"
                summary += "Je vais apprendre à te connaître au fur et à mesure. 😊"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting user context summary: {str(e)}")
            return "Je n'ai pas encore de mémoire de nos interactions précédentes."


# Instance globale
user_memory = UserMemoryService()
