from fastapi import APIRouter, HTTPException
from typing import List
from models.project import Project, ProjectCreate, ProjectResponse, CodeFile
from services.ai_service import ai_generator, AICodeGenerator
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects", tags=["projects"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
projects_collection = db.projects


@router.get("/models")
async def get_available_models():
    """
    Récupère la liste des modèles IA disponibles
    """
    return {
        "models": [
            {"id": key, "name": config["name"]}
            for key, config in AICodeGenerator.AVAILABLE_MODELS.items()
        ],
        "recommended": "gpt-5.1"
    }


@router.post("", response_model=ProjectResponse)
async def create_project(project_input: ProjectCreate):
    """
    Crée un nouveau projet et génère le code via IA
    """
    try:
        # Créer l'objet projet initial
        project = Project(
            name=project_input.name,
            description=project_input.description,
            type=project_input.type,
            tech_stack=project_input.tech_stack.split(',') if project_input.tech_stack else [],
            status="in-progress"
        )
        
        # Sauvegarder le projet en DB (status: in-progress)
        project_dict = project.dict()
        project_dict['created_at'] = project.created_at
        project_dict['updated_at'] = project.updated_at
        await projects_collection.insert_one(project_dict)
        
        # Générer le code en arrière-plan (pour l'instant synchrone, mais devrait être async)
        try:
            logger.info(f"Starting code generation for project: {project.name}")
            
            ai_result = await ai_generator.generate_code(
                project_data={
                    'name': project.name,
                    'description': project.description,
                    'type': project.type,
                    'tech_stack': ', '.join(project.tech_stack) if project.tech_stack else None
                },
                preferred_model=project_input.ai_model
            )
            
            # Convertir les fichiers
            code_files = [
                CodeFile(
                    filename=f['filename'],
                    language=f['language'],
                    content=f['content']
                )
                for f in ai_result['files']
            ]
            
            # Mettre à jour le projet
            project.code_files = code_files
            project.tech_stack = ai_result.get('tech_stack', project.tech_stack)
            project.ai_model_used = ai_result.get('model_used', 'unknown')
            project.status = "completed"
            project.updated_at = datetime.utcnow()
            
            # Sauvegarder en DB
            update_dict = project.dict()
            update_dict['updated_at'] = project.updated_at
            await projects_collection.update_one(
                {"id": project.id},
                {"$set": update_dict}
            )
            
            logger.info(f"Code generation completed for project: {project.name}")
            
        except Exception as e:
            logger.error(f"Error during code generation: {str(e)}")
            # Mettre le statut en erreur
            await projects_collection.update_one(
                {"id": project.id},
                {"$set": {"status": "error", "updated_at": datetime.utcnow()}}
            )
            raise HTTPException(status_code=500, detail=f"Erreur lors de la génération du code: {str(e)}")
        
        # Retourner le projet
        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            type=project.type,
            tech_stack=project.tech_stack,
            status=project.status,
            ai_model_used=project.ai_model_used,
            created_at=project.created_at.isoformat(),
            code_files=project.code_files
        )
        
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[ProjectResponse])
async def get_projects():
    """
    Récupère tous les projets
    """
    try:
        projects = await projects_collection.find().to_list(1000)
        return [
            ProjectResponse(
                id=p['id'],
                name=p['name'],
                description=p['description'],
                type=p['type'],
                tech_stack=p['tech_stack'],
                status=p['status'],
                ai_model_used=p.get('ai_model_used'),
                created_at=p['created_at'].isoformat() if isinstance(p['created_at'], datetime) else p['created_at'],
                code_files=[
                    CodeFile(**cf) for cf in p.get('code_files', [])
                ]
            )
            for p in projects
        ]
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """
    Récupère un projet spécifique
    """
    try:
        project = await projects_collection.find_one({"id": project_id})
        
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        return ProjectResponse(
            id=project['id'],
            name=project['name'],
            description=project['description'],
            type=project['type'],
            tech_stack=project['tech_stack'],
            status=project['status'],
            ai_model_used=project.get('ai_model_used'),
            created_at=project['created_at'].isoformat() if isinstance(project['created_at'], datetime) else project['created_at'],
            code_files=[
                CodeFile(**cf) for cf in project.get('code_files', [])
            ]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """
    Supprime un projet
    """
    try:
        result = await projects_collection.delete_one({"id": project_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        return {"message": "Projet supprimé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
