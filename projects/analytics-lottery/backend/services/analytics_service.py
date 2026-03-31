"""
SERVICE ANALYTICS (NIVEAU E5)
Tracking basique de l'utilisation des projets
"""

import logging
from datetime import datetime
from typing import Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
import os

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service d'analytics pour tracker l'utilisation"""
    
    def __init__(self):
        self.mongo_url = os.environ.get('MONGO_URL')
        self.db_name = os.environ.get('DB_NAME')
    
    async def track_event(self, event_type: str, project_id: str = None, metadata: Dict[str, Any] = None):
        """
        Track un événement d'utilisation
        
        Args:
            event_type: Type d'événement (project_created, project_improved, project_deployed, etc.)
            project_id: ID du projet concerné (optionnel)
            metadata: Données additionnelles (optionnel)
        """
        try:
            client = AsyncIOMotorClient(self.mongo_url)
            db = client[self.db_name]
            analytics_collection = db.analytics
            
            event = {
                'event_type': event_type,
                'project_id': project_id,
                'timestamp': datetime.utcnow(),
                'metadata': metadata or {}
            }
            
            await analytics_collection.insert_one(event)
            logger.info(f"📊 Event tracked: {event_type}")
            
            client.close()
            
        except Exception as e:
            logger.error(f"❌ Error tracking event: {str(e)}")
    
    async def get_project_stats(self, project_id: str) -> Dict[str, Any]:
        """
        Récupère les statistiques d'un projet
        
        Returns:
            Dict avec nombre de vues, améliorations, déploiements, etc.
        """
        try:
            client = AsyncIOMotorClient(self.mongo_url)
            db = client[self.db_name]
            analytics_collection = db.analytics
            
            # Compter les événements par type
            total_events = await analytics_collection.count_documents({"project_id": project_id})
            improvements = await analytics_collection.count_documents({
                "project_id": project_id,
                "event_type": "project_improved"
            })
            deployments = await analytics_collection.count_documents({
                "project_id": project_id,
                "event_type": "project_deployed"
            })
            
            # Récupérer la dernière activité
            last_event = await analytics_collection.find_one(
                {"project_id": project_id},
                sort=[("timestamp", -1)]
            )
            
            client.close()
            
            return {
                'total_events': total_events,
                'improvements_count': improvements,
                'deployments_count': deployments,
                'last_activity': last_event['timestamp'] if last_event else None
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting project stats: {str(e)}")
            return {
                'total_events': 0,
                'improvements_count': 0,
                'deployments_count': 0,
                'last_activity': None
            }
    
    async def get_global_stats(self) -> Dict[str, Any]:
        """
        Récupère les statistiques globales de la plateforme
        
        Returns:
            Dict avec stats globales
        """
        try:
            client = AsyncIOMotorClient(self.mongo_url)
            db = client[self.db_name]
            projects_collection = db.projects
            analytics_collection = db.analytics
            
            # Total projets
            total_projects = await projects_collection.count_documents({})
            completed_projects = await projects_collection.count_documents({"status": "completed"})
            deployed_projects = await projects_collection.count_documents({"status": "deployed"})
            
            # Total événements
            total_events = await analytics_collection.count_documents({})
            
            # Projets par type
            pipeline = [
                {"$group": {"_id": "$type", "count": {"$sum": 1}}}
            ]
            projects_by_type = await projects_collection.aggregate(pipeline).to_list(100)
            
            client.close()
            
            return {
                'total_projects': total_projects,
                'completed_projects': completed_projects,
                'deployed_projects': deployed_projects,
                'total_events': total_events,
                'projects_by_type': {item['_id']: item['count'] for item in projects_by_type}
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting global stats: {str(e)}")
            return {
                'total_projects': 0,
                'completed_projects': 0,
                'deployed_projects': 0,
                'total_events': 0,
                'projects_by_type': {}
            }


# Instance globale
analytics_service = AnalyticsService()
