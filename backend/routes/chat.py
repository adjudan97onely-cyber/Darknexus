from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Optional
from pydantic import BaseModel
from services.ai_service import ai_generator
from services.intelligent_agent import get_intelligent_agent
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
messages_collection = db.chat_messages
projects_collection = db.projects


class ChatMessage(BaseModel):
    project_id: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = None
    action: Optional[str] = None  # 'improve', 'deploy', 'modify', 'debug'


class ChatRequest(BaseModel):
    project_id: str
    message: str
    action: Optional[str] = None


@router.post("/message")
async def send_chat_message(chat_request: ChatRequest):
    """
    Envoie un message au chat et reçoit une réponse de l'AGENT INTELLIGENT
    """
    try:
        project_id = chat_request.project_id
        user_message = chat_request.message
        action = chat_request.action
        
        # Récupérer le projet
        project = await projects_collection.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        # Sauvegarder le message utilisateur
        user_msg = {
            "project_id": project_id,
            "role": "user",
            "content": user_message,
            "timestamp": datetime.utcnow(),
            "action": action
        }
        await messages_collection.insert_one(user_msg)
        
        # Récupérer l'historique récent
        history = await messages_collection.find(
            {"project_id": project_id}
        ).sort("timestamp", -1).limit(10).to_list(10)
        history.reverse()
        
        # Utiliser l'AGENT INTELLIGENT
        agent = get_intelligent_agent()
        
        # Déterminer l'action à effectuer
        if "analys" in user_message.lower() or "audit" in user_message.lower():
            logger.info("Action: ANALYZE")
            response_data = await agent.analyze_project(project)
        elif "debug" in user_message.lower() or "bug" in user_message.lower() or "erreur" in user_message.lower():
            logger.info("Action: DEBUG")
            response_data = await agent.debug_project(project, user_message)
        else:
            logger.info("Action: IMPROVE")
            response_data = await agent.improve_intelligently(
                project, 
                user_message, 
                [{"role": msg["role"], "content": msg["content"]} for msg in history[-5:]]
            )
        
        # Construire la réponse utilisateur
        response_text = f"""💭 **Analyse**: {response_data.get('thinking', 'En cours...')}

📋 **Action**: {response_data.get('action', 'N/A').upper()}

💬 **Explication**:
{response_data.get('explanation', 'Réponse en cours...')}
"""
        
        if response_data.get('code_changes'):
            response_text += f"\n\n🔧 **Modifications proposées**: {len(response_data['code_changes'])} fichier(s)"
        
        if response_data.get('suggestions'):
            response_text += f"\n\n💡 **Suggestions**:\n" + "\n".join([f"- {s}" for s in response_data['suggestions'][:3]])
        
        if response_data.get('next_steps'):
            response_text += f"\n\n📝 **Prochaines étapes**:\n" + "\n".join([f"{i+1}. {s}" for i, s in enumerate(response_data['next_steps'][:3])])
        
        # Appliquer les modifications de code si demandé
        code_updated = False
        if response_data.get('code_changes') and ("applique" in user_message.lower() or "modifie" in user_message.lower()):
            try:
                # Appliquer les modifications
                await _apply_code_changes(project_id, response_data['code_changes'])
                code_updated = True
                response_text += "\n\n✅ **Modifications appliquées avec succès!**"
            except Exception as e:
                logger.error(f"Error applying code changes: {str(e)}")
                response_text += f"\n\n❌ **Erreur lors de l'application**: {str(e)}"
        
        # Sauvegarder la réponse de l'agent
        ai_msg = {
            "project_id": project_id,
            "role": "assistant",
            "content": response_text,
            "timestamp": datetime.utcnow(),
            "action": action,
            "agent_data": response_data
        }
        await messages_collection.insert_one(ai_msg)
        
        return {
            "message": response_text,
            "timestamp": ai_msg["timestamp"].isoformat(),
            "code_updated": code_updated,
            "agent_analysis": response_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def _apply_code_changes(project_id: str, code_changes: List[Dict]):
    """Applique les modifications de code au projet"""
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise Exception("Projet non trouvé")
    
    current_files = {f['filename']: f for f in project.get('code_files', [])}
    
    for change in code_changes:
        filename = change.get('file')
        action_type = change.get('action')
        content = change.get('content', '')
        
        if action_type == 'create' or action_type == 'modify':
            # Détecter le langage
            ext = filename.split('.')[-1] if '.' in filename else 'txt'
            lang_map = {
                'py': 'python', 'js': 'javascript', 'jsx': 'javascript',
                'ts': 'typescript', 'tsx': 'typescript', 'html': 'html',
                'css': 'css', 'md': 'markdown', 'json': 'json'
            }
            language = lang_map.get(ext, 'text')
            
            current_files[filename] = {
                'filename': filename,
                'language': language,
                'content': content
            }
        elif action_type == 'delete':
            current_files.pop(filename, None)
    
    # Mettre à jour le projet
    await projects_collection.update_one(
        {"id": project_id},
        {"$set": {
            "code_files": list(current_files.values()),
            "updated_at": datetime.utcnow()
        }}
    )


@router.get("/history/{project_id}")
async def get_chat_history(project_id: str, limit: int = 50):
    """
    Récupère l'historique de chat pour un projet
    """
    try:
        messages = await messages_collection.find(
            {"project_id": project_id}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        messages.reverse()
        
        return [
            {
                "role": msg["role"],
                "content": msg["content"],
                "timestamp": msg["timestamp"].isoformat() if isinstance(msg["timestamp"], datetime) else msg["timestamp"],
                "action": msg.get("action")
            }
            for msg in messages
        ]
        
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{project_id}")
async def clear_chat_history(project_id: str):
    """
    Efface l'historique de chat pour un projet
    """
    try:
        result = await messages_collection.delete_many({"project_id": project_id})
        return {"message": f"{result.deleted_count} messages supprimés"}
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/action/{project_id}")
async def execute_chat_action(project_id: str, action_data: dict):
    """
    Exécute une action demandée via le chat
    """
    try:
        action = action_data.get("action")
        description = action_data.get("description", "")
        
        project = await projects_collection.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Projet non trouvé")
        
        if action == "improve" or action == "modify":
            # Utiliser l'endpoint d'amélioration existant
            from routes.projects import ai_generator
            from models.project import CodeFile
            
            await projects_collection.update_one(
                {"id": project_id},
                {"$set": {"status": "in-progress"}}
            )
            
            context = f"{project['description']}\n\nModifications demandées: {description}"
            
            ai_result = await ai_generator.generate_code(
                project_data={
                    'name': project['name'],
                    'description': context,
                    'type': project['type'],
                    'tech_stack': ', '.join(project['tech_stack'])
                },
                preferred_model='gpt-5.1'
            )
            
            code_files = [
                {
                    "filename": f['filename'],
                    "language": f['language'],
                    "content": f['content']
                }
                for f in ai_result['files']
            ]
            
            await projects_collection.update_one(
                {"id": project_id},
                {"$set": {
                    "code_files": code_files,
                    "status": "completed",
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return {"status": "completed", "message": "Code mis à jour avec succès"}
            
        else:
            return {"status": "pending", "message": f"Action '{action}' en développement"}
            
    except Exception as e:
        logger.error(f"Error executing action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
