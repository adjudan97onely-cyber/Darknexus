"""
SERVICE DE GÉNÉRATION EN ARRIÈRE-PLAN
Permet de lancer des générations IA sans bloquer le endpoint HTTP
"""

import asyncio
import logging
from typing import Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os

logger = logging.getLogger(__name__)

# Stockage des tâches en cours
active_tasks: Dict[str, asyncio.Task] = {}


async def generate_code_background(
    project_id: str,
    project_data: Dict[str, Any],
    ai_generator,
    db_collection,
    preferred_model: str = None
):
    """
    Génère du code en arrière-plan pour un projet
    Met à jour le statut dans la DB au fur et à mesure
    """
    try:
        logger.info(f"🚀 Background generation started for project: {project_id}")
        
        # Mettre à jour le statut: génération en cours
        await db_collection.update_one(
            {"id": project_id},
            {"$set": {
                "status": "generating",
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Générer le code (peut prendre du temps)
        ai_result = await ai_generator.generate_code(
            project_data=project_data,
            preferred_model=preferred_model
        )
        
        # Convertir les fichiers
        from models.project import CodeFile
        code_files = [
            CodeFile(
                filename=f['filename'],
                language=f['language'],
                content=f['content']
            )
            for f in ai_result['files']
        ]
        
        # Mettre à jour le projet avec le code généré
        await db_collection.update_one(
            {"id": project_id},
            {"$set": {
                "code_files": [cf.dict() for cf in code_files],
                "tech_stack": ai_result.get('tech_stack', []),
                "ai_model_used": ai_result.get('model_used', 'unknown'),
                "status": "completed",
                "updated_at": datetime.utcnow()
            }}
        )
        
        logger.info(f"✅ Background generation completed for project: {project_id}")
        
    except Exception as e:
        logger.error(f"❌ Background generation failed for project {project_id}: {str(e)}")
        
        # Mettre le statut en erreur
        await db_collection.update_one(
            {"id": project_id},
            {"$set": {
                "status": "error",
                "error_message": str(e),
                "updated_at": datetime.utcnow()
            }}
        )
    
    finally:
        # Nettoyer la tâche de la liste des tâches actives
        if project_id in active_tasks:
            del active_tasks[project_id]


def launch_background_generation(
    project_id: str,
    project_data: Dict[str, Any],
    ai_generator,
    db_collection,
    preferred_model: str = None
) -> asyncio.Task:
    """
    Lance une génération de code en arrière-plan
    Retourne la Task pour permettre le tracking
    """
    task = asyncio.create_task(
        generate_code_background(
            project_id,
            project_data,
            ai_generator,
            db_collection,
            preferred_model
        )
    )
    
    active_tasks[project_id] = task
    logger.info(f"📋 Task created for project: {project_id}")
    
    return task


def get_task_status(project_id: str) -> Dict[str, Any]:
    """
    Récupère le statut d'une tâche en cours
    """
    if project_id not in active_tasks:
        return {"exists": False}
    
    task = active_tasks[project_id]
    
    return {
        "exists": True,
        "done": task.done(),
        "cancelled": task.cancelled()
    }
