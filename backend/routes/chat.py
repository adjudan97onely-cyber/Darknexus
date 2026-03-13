from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Optional
from pydantic import BaseModel
from services.ai_service import ai_generator
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
    Envoie un message au chat et reçoit une réponse de l'IA
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
        
        # Récupérer l'historique récent (10 derniers messages)
        history = await messages_collection.find(
            {"project_id": project_id}
        ).sort("timestamp", -1).limit(10).to_list(10)
        history.reverse()
        
        # Construire le contexte
        context = f"""Tu es l'assistant IA de ADJ KILLAGAIN IA 2.0. Tu aides l'utilisateur avec son projet.

PROJET ACTUEL:
Nom: {project['name']}
Description: {project['description']}
Type: {project['type']}
Technologies: {', '.join(project['tech_stack'])}
Statut: {project['status']}

HISTORIQUE DE CONVERSATION:
{chr(10).join([f"{msg['role'].upper()}: {msg['content']}" for msg in history[-5:]])}

CODE ACTUEL:
{chr(10).join([f"Fichier: {f['filename']}" for f in project.get('code_files', [])[:5]])}

INSTRUCTION:
L'utilisateur dit: "{user_message}"
"""
        
        if action == "improve":
            context += "\n\nACTION: Améliorer le code selon la demande"
        elif action == "debug":
            context += "\n\nACTION: Déboguer et corriger les erreurs"
        elif action == "modify":
            context += "\n\nACTION: Modifier le code selon la demande"
        
        context += """

Réponds de manière conversationnelle et utile. Si tu dois modifier du code, explique ce que tu vas faire.
Si c'est une question simple, réponds directement.
Sois concis mais complet."""
        
        # Générer la réponse de l'IA
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            session_id = f"chat_{project_id}_{datetime.utcnow().timestamp()}"
            chat = LlmChat(
                api_key=os.environ.get('EMERGENT_LLM_KEY'),
                session_id=session_id,
                system_message="Tu es un assistant de développement expert, amical et efficace."
            )
            chat.with_model("openai", "gpt-5.1")
            
            response_text = await chat.send_message(UserMessage(text=context))
            
        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            response_text = "Désolé, je rencontre un problème technique. Pouvez-vous reformuler votre demande ?"
        
        # Sauvegarder la réponse de l'IA
        ai_msg = {
            "project_id": project_id,
            "role": "assistant",
            "content": response_text,
            "timestamp": datetime.utcnow(),
            "action": action
        }
        await messages_collection.insert_one(ai_msg)
        
        return {
            "message": response_text,
            "timestamp": ai_msg["timestamp"].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
