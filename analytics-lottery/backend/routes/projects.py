from fastapi import APIRouter, HTTPException
from typing import List
from models.project import Project, ProjectCreate, ProjectResponse, CodeFile
from services.ai_service import ai_generator, AICodeGenerator
from services.background_tasks import launch_background_generation, get_task_status
from database import get_projects_collection
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects", tags=["projects"])


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
        projects_collection = await get_projects_collection()
        
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
    Récupère tous les projets (SANS code_files pour performance)
    """
    try:
        projects_collection = await get_projects_collection()
        
        # Récupérer tous les projets SANS code_files pour optimiser
        all_projects = await projects_collection.find({}, {
            "_id": 0,
            "code_files": 0  # Exclure code_files - c'est lourd!
        }).to_list(None)
        
        logger.info(f"Found {len(all_projects)} projects in database")
        
        results = []
        for p in all_projects:
            try:
                # Log chaque projet
                proj_id = p.get('id', 'unknown')
                proj_name = p.get('name', 'Unknown')
                logger.debug(f"Processing project: {proj_name} ({proj_id})")
                
                # Valider les données critiques
                created_at = p.get('created_at')
                if isinstance(created_at, datetime):
                    created_at_str = created_at.isoformat()
                elif isinstance(created_at, str):
                    created_at_str = created_at
                else:
                    created_at_str = datetime.utcnow().isoformat()
                    logger.warning(f"Invalid created_at for {proj_id}: {type(created_at)}")
                
                # Construire chaque réponse
                project_response = ProjectResponse(
                    id=proj_id,
                    name=proj_name,
                    description=p.get('description', ''),
                    type=p.get('type', 'unknown'),
                    tech_stack=p.get('tech_stack', []) if isinstance(p.get('tech_stack'), list) else [],
                    status=p.get('status', 'pending'),
                    ai_model_used=p.get('ai_model_used'),
                    created_at=created_at_str,
                    code_files=[]  # Jamais inclure pour la liste
                )
                results.append(project_response)
                logger.debug(f"Successfully added {proj_name}")
                
            except Exception as e:
                logger.error(f"Error parsing project {p.get('id', 'unknown')}: {str(e)}", exc_info=True)
                # Continue avec le projet suivant
                continue
        
        logger.info(f"Returning {len(results)} valid projects")
        return results
        
    except Exception as e:
        logger.error(f"Fatal error fetching projects: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """
    Récupère un projet spécifique avec son statut de génération
    """
    try:
        projects_collection = await get_projects_collection()
        
        # Récupérer le projet de la base de données
        project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
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


@router.get("/{project_id}/preview-html")
async def get_preview_html(project_id: str, request: Request = None):
    """
    Retourne un HTML compilé pour le Live Preview (standalone, sans imports ESM)
    PUBLIC endpoint (pas d'authentification requise pour le preview)
    """
    try:
        from fastapi.responses import HTMLResponse
        
        projects_collection = await get_projects_collection()
        project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
        
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        # Données sûres à injecter
        project_name = project.get('name', 'Projet').replace("'", "\\'").replace('"', '\\"')
        project_desc = project.get('description', '').split('\n')[0] if project.get('description') else ''
        project_desc = project_desc[:200].replace("'", "\\'").replace('"', '\\"')
        project_type = project.get('type', 'ai-app')
        num_files = len(project.get('code_files', []))
        tech_stack = ', '.join(project.get('tech_stack', [])[:2]) if project.get('tech_stack') else 'React, Vite'
        
        # Générer le HTML avec une approche vanilla JS simple (sans React CDN)
        html_preview = f'''<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{project_name}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1a1f3a 0%, #0f1625 100%);
            color: white;
            min-height: 100vh;
            padding: 2rem 1rem;
        }}
        
        .container {{
            max-width: 900px;
            margin: 0 auto;
        }}
        
        .header {{
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }}
        
        .header h1 {{
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #a855f7, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
        }}
        
        .header p {{
            color: #cbd5e1;
            font-size: 1rem;
            margin-bottom: 1rem;
        }}
        
        .badges {{
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }}
        
        .badge {{
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            background-color: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.5);
            color: #86efac;
        }}
        
        .stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }}
        
        .stat-card {{
            background-color: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 0.5rem;
            padding: 1.5rem;
            text-align: center;
        }}
        
        .stat-value {{
            font-size: 2rem;
            font-weight: bold;
            color: #a78bfa;
            margin-bottom: 0.5rem;
        }}
        
        .stat-label {{
            color: #94a3b8;
            font-size: 0.875rem;
        }}
        
        .content {{
            background-color: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 0.5rem;
            padding: 2rem;
        }}
        
        .content h2 {{
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }}
        
        .content p {{
            color: #cbd5e1;
            line-height: 1.6;
            margin-bottom: 1rem;
        }}
        
        .features {{
            background-color: rgba(30, 41, 59, 0.3);
            border-left: 3px solid #a855f7;
            padding: 1.5rem;
            margin-top: 1.5rem;
            border-radius: 0.375rem;
        }}
        
        .features h3 {{
            margin-bottom: 1rem;
            font-size: 1rem;
        }}
        
        .features ul {{
            list-style: none;
        }}
        
        .features li {{
            padding: 0.5rem 0;
            color: #cbd5e1;
        }}
        
        .cta-button {{
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #a855f7, #ec4899);
            color: white;
            text-decoration: none;
            border-radius: 0.375rem;
            font-weight: 600;
            border: none;
            cursor: pointer;
            margin-top: 1rem;
        }}
        
        .cta-button:hover {{
            opacity: 0.9;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{project_name}</h1>
            <p>{project_desc}</p>
            <div class="badges">
                <span class="badge">✅ Généré</span>
                <span class="badge">Prêt à déployer</span>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">{num_files}</div>
                <div class="stat-label">📁 Fichiers</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">⚡</div>
                <div class="stat-label">Frontend Moderne</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">📱</div>
                <div class="stat-label">PWA Prête</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">🚀</div>
                <div class="stat-label">Déploiement Simple</div>
            </div>
        </div>
        
        <div class="content">
            <h2>✨ Votre projet est généré!</h2>
            <p>
                Tous les fichiers ({num_files} fichiers) ont été générés avec les meilleures pratiques.
                Votre application est optimisée pour la performance et prête à être déployée.
            </p>
            
            <div class="features">
                <h3>📚 Inclus dans votre projet:</h3>
                <ul>
                    <li>✓ Frontend: React 18 + Vite</li>
                    <li>✓ Styles: Tailwind CSS</li>
                    <li>✓ Progressive Web App</li>
                    <li>✓ Service Worker (offline support)</li>
                    <li>✓ SEO optimisé</li>
                    <li>✓ Déploiement Vercel-ready</li>
                </ul>
            </div>
            
            <button class="cta-button" onclick="alert('🚀 Redirection vers Vercel en construction!\\n\\nVous pouvez maintenant télécharger votre code sur GitHub et le déployer sur Vercel, Netlify ou votre serveur.')">
                🚀 Déployer maintenant
            </button>
        </div>
    </div>
</body>
</html>'''
        
        from fastapi.responses import HTMLResponse
        return HTMLResponse(content=html_preview)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating preview: {str(e)}")
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
        projects_collection = await get_projects_collection()
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

