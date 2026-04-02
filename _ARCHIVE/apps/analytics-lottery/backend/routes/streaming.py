"""
ROUTES STREAMING - Génération de projets avec feedback en temps réel
Permet d'afficher la progression pendant la génération de code
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import asyncio
import json
import logging
from services.ai_service import ai_generator
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/streaming", tags=["streaming"])

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


class StreamingProjectCreate(BaseModel):
    name: str
    description: str
    type: str
    tech_stack: Optional[str] = None
    ai_model: Optional[str] = 'gpt-5.1'
    is_pwa: Optional[bool] = False


async def generate_project_stream(project_data: dict):
    """Génère un projet avec des mises à jour en temps réel"""
    
    try:
        # Étape 1 : Initialisation
        yield json.dumps({
            'status': 'progress',
            'step': 'init',
            'message': '🚀 Initialisation de la génération...',
            'progress': 10
        }) + '\n'
        await asyncio.sleep(0.5)
        
        # Étape 2 : Connexion à l'IA
        yield json.dumps({
            'status': 'progress',
            'step': 'ai_connect',
            'message': f'🤖 Connexion au modèle {project_data.get("ai_model", "IA")}...',
            'progress': 20
        }) + '\n'
        await asyncio.sleep(0.5)
        
        # Étape 3 : Génération en cours
        yield json.dumps({
            'status': 'progress',
            'step': 'generating',
            'message': '⚡ Génération du code en cours...',
            'progress': 40
        }) + '\n'
        
        # Appeler le générateur de code
        result = await ai_generator.generate_code(
            project_data={
                'name': project_data['name'],
                'description': project_data['description'],
                'type': project_data['type'],
                'tech_stack': project_data.get('tech_stack'),
                'is_pwa': project_data.get('is_pwa', False)
            },
            preferred_model=project_data.get('ai_model', 'gpt-5.1')
        )
        
        # Étape 4 : Code généré
        yield json.dumps({
            'status': 'progress',
            'step': 'code_generated',
            'message': f'✅ {len(result["files"])} fichiers générés !',
            'progress': 70
        }) + '\n'
        await asyncio.sleep(0.3)
        
        # Étape 5 : Sauvegarde en base
        yield json.dumps({
            'status': 'progress',
            'step': 'saving',
            'message': '💾 Sauvegarde du projet...',
            'progress': 85
        }) + '\n'
        
        # Créer le projet en base
        from models.project import Project, CodeFile
        from uuid import uuid4
        
        project = Project(
            id=str(uuid4()),
            name=project_data['name'],
            description=project_data['description'],
            type=project_data['type'],
            tech_stack=result.get('tech_stack', []),
            status='completed',
            ai_model_used=result.get('model_used', 'unknown'),
            code_files=[
                CodeFile(**f) for f in result['files']
            ],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        project_dict = project.dict()
        await db.projects.insert_one(project_dict)
        
        # Étape 6 : Terminé !
        yield json.dumps({
            'status': 'success',
            'step': 'completed',
            'message': '🎉 Projet créé avec succès !',
            'progress': 100,
            'project_id': project.id,
            'files_count': len(result['files'])
        }) + '\n'
        
    except Exception as e:
        logger.error(f"Error in streaming generation: {str(e)}")
        yield json.dumps({
            'status': 'error',
            'step': 'failed',
            'message': f'❌ Erreur: {str(e)}',
            'progress': 0
        }) + '\n'


@router.post("/generate-project")
async def stream_generate_project(project_data: StreamingProjectCreate):
    """
    Génère un projet avec des mises à jour en temps réel (Server-Sent Events)
    
    **Utilisation frontend:**
    ```javascript
    const eventSource = new EventSource('/api/streaming/generate-project');
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data.message, data.progress);
    };
    ```
    """
    return StreamingResponse(
        generate_project_stream(project_data.dict()),
        media_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )
