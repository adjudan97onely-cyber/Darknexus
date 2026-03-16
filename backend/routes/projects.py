from fastapi import APIRouter, HTTPException
from typing import List
from models.project import Project, ProjectCreate, ProjectResponse, CodeFile
from services.ai_service import ai_generator, AICodeGenerator
from services.background_tasks import launch_background_generation, get_task_status
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
    Crée un nouveau projet et lance la génération IA en arrière-plan
    Retourne immédiatement avec status 'generating'
    """
    try:
        # Créer l'objet projet initial
        project = Project(
            name=project_input.name,
            description=project_input.description,
            type=project_input.type,
            tech_stack=project_input.tech_stack.split(',') if project_input.tech_stack else [],
            status="generating"
        )
        
        # Sauvegarder le projet en DB (status: generating)
        project_dict = project.dict()
        project_dict['created_at'] = project.created_at
        project_dict['updated_at'] = project.updated_at
        await projects_collection.insert_one(project_dict)
        
        # Lancer la génération en arrière-plan (non-bloquant)
        logger.info(f"🚀 Launching background generation for project: {project.name}")
        
        launch_background_generation(
            project_id=project.id,
            project_data={
                'name': project.name,
                'description': project.description,
                'type': project.type,
                'tech_stack': ', '.join(project.tech_stack) if project.tech_stack else None,
                'is_pwa': project_input.is_pwa
            },
            ai_generator=ai_generator,
            db_collection=projects_collection,
            preferred_model=project_input.ai_model
        )
        
        # Retourner IMMÉDIATEMENT le projet avec status "generating"
        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            type=project.type,
            tech_stack=project.tech_stack,
            status="generating",
            ai_model_used=None,
            created_at=project.created_at.isoformat(),
            code_files=[]
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
        # Exclure code_files pour optimiser la performance (peut être lourd)
        projects = await projects_collection.find({}, {"_id": 0, "code_files": 0}).to_list(1000)
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
    Récupère un projet spécifique avec son statut de génération
    """
    try:
        project = await projects_collection.find_one({"id": project_id})
        
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        # Vérifier si une tâche est en cours
        task_status = get_task_status(project_id)
        if task_status["exists"] and not task_status["done"]:
            # Forcer le statut à "generating" si la tâche est en cours
            project['status'] = "generating"
        
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
    Améliore un projet existant avec de nouvelles instructions (NIVEAU E5: Mode Patch Intelligent)
    """
    try:
        from services.smart_improver import smart_improver
        from services.auto_healer import auto_healer
        
        # Récupérer le projet existant
        project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
        
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        # Extraire la demande d'amélioration
        improvement_description = improvement_request.get("description", "")
        ai_model = improvement_request.get("ai_model", "gpt-5.1")
        
        if not improvement_description:
            raise HTTPException(status_code=400, detail="Description de l'amélioration requise")
        
        logger.info(f"🎯 Amélioration intelligente demandée: {improvement_description[:100]}...")
        
        # NIVEAU E5: Analyser la demande d'amélioration
        analysis = smart_improver.analyze_improvement_request(improvement_description)
        logger.info(f"📊 Type d'amélioration: {analysis['type']} - Stratégie: {analysis['strategy']}")
        
        # Construire un prompt intelligent (mode patch)
        context = smart_improver.build_smart_prompt(
            improvement_description=improvement_description,
            project_data=project,
            existing_files=project.get('code_files', []),
            analysis=analysis
        )

        # Mettre à jour le statut
        await projects_collection.update_one(
            {"id": project_id},
            {"$set": {"status": "improving", "updated_at": datetime.utcnow()}}
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
            
            # NIVEAU E5: Fusionner intelligemment avec les fichiers existants
            if not analysis.get('requires_full_regeneration', False):
                logger.info("🔀 Mode patch: fusion avec fichiers existants")
                merged_files = smart_improver.merge_improvements(
                    existing_files=project.get('code_files', []),
                    improved_files=ai_result['files']
                )
            else:
                logger.info("🔄 Régénération complète demandée")
                merged_files = ai_result['files']
            
            # NIVEAU E5: Auto-healing sur le code amélioré
            logger.info("🩹 Auto-healing du code amélioré...")
            healing_result = await auto_healer.heal_project(
                files=merged_files,
                project_type=project['type']
            )
            
            final_files = healing_result['files']
            
            # Convertir en CodeFile
            code_files = [
                CodeFile(
                    filename=f['filename'],
                    language=f['language'],
                    content=f['content']
                )
                for f in final_files
            ]
            
            update_data = {
                "code_files": [cf.dict() for cf in code_files],
                "tech_stack": ai_result.get('tech_stack', project['tech_stack']),
                "ai_model_used": ai_result.get('model_used', 'unknown'),
                "status": "completed",
                "updated_at": datetime.utcnow(),
                "description": f"{project['description']}\n\nAméliorations: {improvement_description}",
                "improvement_type": analysis['type'],
                "auto_fixes_applied": healing_result.get('auto_fixes_applied', 0)
            }
            
            if healing_result.get('applied_fixes'):
                update_data["improvement_notes"] = healing_result['applied_fixes']
            
            await projects_collection.update_one(
                {"id": project_id},
                {"$set": update_data}
            )
            
            logger.info(f"✅ Project improvement completed: {project['name']}")
            
            # Récupérer et retourner le projet mis à jour
            updated_project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
            
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



@router.post("/{project_id}/deploy")
async def deploy_project(project_id: str, deployment_config: dict):
    """
    Déploie un projet sur Vercel (NIVEAU E5: Déploiement 1-clic)
    """
    try:
        from services.vercel_deployer import vercel_deployer
        
        # Récupérer le projet
        project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
        
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        if project['status'] != 'completed':
            raise HTTPException(status_code=400, detail="Le projet doit être complété avant déploiement")
        
        # Extraire le token Vercel de l'utilisateur (optionnel)
        vercel_token = deployment_config.get("vercel_token")
        platform = deployment_config.get("platform", "vercel")
        
        if platform != "vercel":
            raise HTTPException(status_code=400, detail="Seul Vercel est supporté pour le moment")
        
        logger.info(f"🚀 Déploiement demandé pour: {project['name']}")
        
        # Mettre à jour le statut
        await projects_collection.update_one(
            {"id": project_id},
            {"$set": {"status": "deploying", "updated_at": datetime.utcnow()}}
        )
        
        # Déployer sur Vercel
        deployment_result = await vercel_deployer.deploy_to_vercel(
            project_name=project['name'],
            files=project.get('code_files', []),
            vercel_token=vercel_token
        )
        
        if deployment_result['success']:
            # Déploiement réussi
            await projects_collection.update_one(
                {"id": project_id},
                {"$set": {
                    "status": "deployed",
                    "deployment_url": deployment_result['url'],
                    "deployment_id": deployment_result.get('deployment_id'),
                    "deployed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
            
            logger.info(f"✅ Déploiement réussi: {deployment_result['url']}")
            
            return {
                "success": True,
                "url": deployment_result['url'],
                "deployment_id": deployment_result.get('deployment_id'),
                "message": f"✅ Projet déployé sur Vercel ! URL: {deployment_result['url']}"
            }
        else:
            # Déploiement échoué
            await projects_collection.update_one(
                {"id": project_id},
                {"$set": {
                    "status": "completed",  # Retour au statut précédent
                    "updated_at": datetime.utcnow()
                }}
            )
            
            logger.error(f"❌ Déploiement échoué: {deployment_result.get('error')}")
            
            # Si pas de token, retourner les instructions
            if 'Token' in deployment_result.get('error', ''):
                instructions = vercel_deployer.generate_deployment_instructions(
                    project_name=project['name'],
                    files=project.get('code_files', [])
                )
                return {
                    "success": False,
                    "error": deployment_result['error'],
                    "instructions": instructions,
                    "message": "⚠️ Token Vercel requis. Voici les instructions de déploiement manuel."
                }
            
            return {
                "success": False,
                "error": deployment_result.get('error', 'Erreur inconnue'),
                "details": deployment_result.get('details')
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deploying project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/deployment-instructions")
async def get_deployment_instructions(project_id: str):
    """
    Retourne les instructions de déploiement manuel pour un projet
    """
    try:
        from services.vercel_deployer import vercel_deployer
        
        # Récupérer le projet
        project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
        
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        instructions = vercel_deployer.generate_deployment_instructions(
            project_name=project['name'],


@router.get("/{project_id}/analytics")
async def get_project_analytics(project_id: str):
    """
    Récupère les analytics d'un projet (NIVEAU E5)
    """
    try:
        from services.analytics_service import analytics_service
        
        # Vérifier que le projet existe
        project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        # Récupérer les stats
        stats = await analytics_service.get_project_stats(project_id)
        
        return {
            "project_id": project_id,
            "project_name": project['name'],
            **stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/global")
async def get_global_analytics():
    """
    Récupère les analytics globales de la plateforme (NIVEAU E5)
    """
    try:
        from services.analytics_service import analytics_service
        
        stats = await analytics_service.get_global_stats()
        return stats
    
    except Exception as e:
        logger.error(f"Error getting global analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/stripe")
async def get_stripe_templates():
    """
    Liste les templates Stripe disponibles (NIVEAU E5)
    """
    try:
        from services.stripe_templates import stripe_template_generator
        
        templates = stripe_template_generator.list_templates()
        return {"templates": templates}
    
    except Exception as e:
        logger.error(f"Error getting stripe templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/stripe/{template_id}")
async def get_stripe_template_code(template_id: str):
    """
    Récupère le code d'un template Stripe (NIVEAU E5)
    """
    try:
        from services.stripe_templates import stripe_template_generator
        
        code = stripe_template_generator.get_stripe_integration_code(template_id)
        
        return {
            "template_id": template_id,
            **code
        }
    
    except Exception as e:
        logger.error(f"Error getting stripe template code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

            files=project.get('code_files', [])
        )
        
        return {
            "project_name": project['name'],
            "instructions": instructions
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting deployment instructions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
