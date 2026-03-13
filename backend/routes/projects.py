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


@router.post("/{project_id}/improve")
async def improve_project(project_id: str, improvement_request: dict):
    """
    Améliore un projet existant avec de nouvelles instructions
    """
    try:
        # Récupérer le projet existant
        project = await projects_collection.find_one({"id": project_id})
        
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        # Extraire la demande d'amélioration
        improvement_description = improvement_request.get("description", "")
        ai_model = improvement_request.get("ai_model", "gpt-5.1")
        
        if not improvement_description:
            raise HTTPException(status_code=400, detail="Description de l'amélioration requise")
        
        # Construire le contexte pour l'IA
        context = f"""Projet existant à améliorer:
Nom: {project['name']}
Description originale: {project['description']}
Technologies: {', '.join(project['tech_stack'])}

Code actuel:
{chr(10).join([f"Fichier: {f['filename']}" for f in project.get('code_files', [])])}

DEMANDE D'AMÉLIORATION:
{improvement_description}

Génère le code AMÉLIORÉ en gardant la structure existante mais en intégrant les améliorations demandées."""

        # Mettre à jour le statut
        await projects_collection.update_one(
            {"id": project_id},
            {"$set": {"status": "in-progress", "updated_at": datetime.utcnow()}}
        )
        
        try:
            # Générer le code amélioré
            logger.info(f"Improving project: {project['name']}")
            
            ai_result = await ai_generator.generate_code(
                project_data={
                    'name': project['name'],
                    'description': context,
                    'type': project['type'],
                    'tech_stack': ', '.join(project['tech_stack'])
                },
                preferred_model=ai_model
            )
            
            # Mettre à jour avec le nouveau code
            code_files = [
                CodeFile(
                    filename=f['filename'],
                    language=f['language'],
                    content=f['content']
                )
                for f in ai_result['files']
            ]
            
            update_data = {
                "code_files": [cf.dict() for cf in code_files],
                "tech_stack": ai_result.get('tech_stack', project['tech_stack']),
                "ai_model_used": ai_result.get('model_used', 'unknown'),
                "status": "completed",
                "updated_at": datetime.utcnow(),
                "description": f"{project['description']}\n\nAméliorations: {improvement_description}"
            }
            
            await projects_collection.update_one(
                {"id": project_id},
                {"$set": update_data}
            )
            
            logger.info(f"Project improvement completed: {project['name']}")
            
            # Récupérer et retourner le projet mis à jour
            updated_project = await projects_collection.find_one({"id": project_id})
            
            return ProjectResponse(
                id=updated_project['id'],
                name=updated_project['name'],
                description=updated_project['description'],
                type=updated_project['type'],
                tech_stack=updated_project['tech_stack'],
                status=updated_project['status'],
                ai_model_used=updated_project.get('ai_model_used'),
                created_at=updated_project['created_at'].isoformat() if isinstance(updated_project['created_at'], datetime) else updated_project['created_at'],
                code_files=[CodeFile(**cf) for cf in updated_project.get('code_files', [])]
            )
            
        except Exception as e:
            logger.error(f"Error during project improvement: {str(e)}")
            await projects_collection.update_one(
                {"id": project_id},
                {"$set": {"status": "error", "updated_at": datetime.utcnow()}}
            )
            raise HTTPException(status_code=500, detail=f"Erreur lors de l'amélioration: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error improving project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/download")
async def download_project(project_id: str):
    """
    Télécharge le projet en tant que fichier ZIP
    """
    import zipfile
    import io
    from fastapi.responses import StreamingResponse
    
    try:
        project = await projects_collection.find_one({"id": project_id})
        
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        # Créer un fichier ZIP en mémoire
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Ajouter tous les fichiers de code
            for file in project.get('code_files', []):
                zip_file.writestr(file['filename'], file['content'])
            
            # Créer un README avec instructions
            readme_content = f"""# {project['name']}

{project['description']}

## Technologies
{', '.join(project['tech_stack'])}

## Installation

### Pour les projets Python:
```bash
pip install -r requirements.txt
python main.py  # ou le nom du fichier principal
```

### Pour les projets JavaScript/React:
```bash
npm install  # ou yarn install
npm start
```

### Pour les projets Web simples:
Ouvrez index.html dans votre navigateur

## Généré par
ADJ KILLAGAIN IA 2.0
Modèle IA utilisé: {project.get('ai_model_used', 'N/A')}
Date: {project.get('created_at', 'N/A')}
"""
            zip_file.writestr('README.md', readme_content)
        
        # Préparer le téléchargement
        zip_buffer.seek(0)
        
        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={project['name'].replace(' ', '_')}.zip"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{project_id}")
async def update_project(project_id: str, update_data: dict):
    """
    Met à jour les informations d'un projet (nom, description, type)
    """
    try:
        project = await projects_collection.find_one({"id": project_id})
        
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        # Préparer les données de mise à jour
        update_fields = {}
        
        if "name" in update_data and update_data["name"]:
            update_fields["name"] = update_data["name"]
        
        if "description" in update_data and update_data["description"]:
            update_fields["description"] = update_data["description"]
        
        if "type" in update_data and update_data["type"]:
            update_fields["type"] = update_data["type"]
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
        
        update_fields["updated_at"] = datetime.utcnow()
        
        # Mettre à jour le projet
        await projects_collection.update_one(
            {"id": project_id},
            {"$set": update_fields}
        )
        
        # Récupérer et retourner le projet mis à jour
        updated_project = await projects_collection.find_one({"id": project_id})
        
        return ProjectResponse(
            id=updated_project['id'],
            name=updated_project['name'],
            description=updated_project['description'],
            type=updated_project['type'],
            tech_stack=updated_project['tech_stack'],
            status=updated_project['status'],
            ai_model_used=updated_project.get('ai_model_used'),
            created_at=updated_project['created_at'].isoformat() if isinstance(updated_project['created_at'], datetime) else updated_project['created_at'],
            code_files=[CodeFile(**cf) for cf in updated_project.get('code_files', [])]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project: {str(e)}")
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
