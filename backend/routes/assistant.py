"""
ASSISTANT CHAT API - Backend pour l'assistant IA conversationnel
Permet de discuter naturellement avec l'IA comme avec Emergent
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
from services.ai_service import ai_generator
from services.intelligent_agent import get_intelligent_agent
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
from datetime import datetime
from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
projects_collection = db.projects


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str


class AssistantChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []


@router.post("/chat")
async def chat_with_assistant(request: AssistantChatRequest):
    """
    Discute avec l'assistant IA de manière naturelle
    L'assistant comprend les intentions et peut créer des projets
    """
    try:
        user_message = request.message.lower()
        
        # Déterminer l'intention de l'utilisateur
        intention = _detect_intention(user_message)
        
        logger.info(f"User message: {request.message}")
        logger.info(f"Detected intention: {intention}")
        
        # Si l'utilisateur veut créer quelque chose
        if intention == 'create_project':
            return await _handle_project_creation(request.message, request.conversation_history)
        
        # Si l'utilisateur pose une question ou discute
        elif intention == 'question' or intention == 'chat':
            return await _handle_conversation(request.message, request.conversation_history)
        
        # Si l'utilisateur demande de l'aide
        elif intention == 'help':
            return {
                'response': _get_help_message(),
                'action': 'help'
            }
        
        # Réponse par défaut - conversation normale
        else:
            return await _handle_conversation(request.message, request.conversation_history)
            
    except Exception as e:
        logger.error(f"Error in assistant chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def _detect_intention(message: str) -> str:
    """Détecte l'intention de l'utilisateur"""
    
    # Mots-clés pour créer un projet
    create_keywords = [
        'crée', 'créer', 'faire', 'construire', 'développe', 'développer',
        'génère', 'générer', 'je veux', 'j\'ai besoin', 'peux-tu créer',
        'application', 'site web', 'script', 'programme'
    ]
    
    # Mots-clés pour l'aide
    help_keywords = [
        'aide', 'aider', 'comment', 'capable', 'peux-tu faire',
        'qu\'est-ce que', 'c\'est quoi', 'explique'
    ]
    
    # Mots-clés pour les questions
    question_keywords = [
        '?', 'pourquoi', 'comment', 'quand', 'où', 'qui', 'quoi'
    ]
    
    # Vérifier les intentions
    if any(keyword in message for keyword in create_keywords):
        return 'create_project'
    elif any(keyword in message for keyword in help_keywords):
        return 'help'
    elif any(keyword in message for keyword in question_keywords):
        return 'question'
    else:
        return 'chat'


async def _handle_project_creation(message: str, history: List[ChatMessage]) -> Dict:
    """Gère la création de projet via conversation naturelle"""
    try:
        # Extraire les informations du projet depuis le message
        project_info = _extract_project_info(message)
        
        # Si les informations sont insuffisantes, demander plus de détails
        if not project_info['sufficient']:
            return {
                'response': f"""Je comprends que tu veux créer quelque chose ! 🚀

Pour que je puisse générer le meilleur code possible, j'ai besoin de quelques détails :

📝 **Décris-moi ton projet** :
- Quel type d'application ? (site web, script Python, outil Excel, etc.)
- Quelle est sa fonction principale ?
- Y a-t-il des fonctionnalités spécifiques ?

**Exemple** : "Je veux une application web pour gérer mes tâches quotidiennes avec des priorités et des catégories"

Donne-moi plus de détails et je vais créer ça pour toi ! 💪""",
                'action': 'need_more_info'
            }
        
        # Créer le projet
        project_data = {
            'name': project_info['name'],
            'description': project_info['description'],
            'type': project_info['type'],
            'tech_stack': project_info.get('tech_stack', '')
        }
        
        # Générer le code
        logger.info(f"Generating code for project: {project_data['name']}")
        ai_result = await ai_generator.generate_code(
            project_data=project_data,
            preferred_model='gpt-5.1'
        )
        
        # Créer le projet dans la DB
        project_id = str(uuid4())
        project = {
            'id': project_id,
            'name': project_data['name'],
            'description': project_data['description'],
            'type': project_data['type'],
            'status': 'completed',
            'tech_stack': ai_result.get('tech_stack', []),
            'code_files': ai_result['files'],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        await projects_collection.insert_one(project)
        
        logger.info(f"Project created successfully: {project_id}")
        
        return {
            'response': f"""✨ **Projet créé avec succès !** ✨

📦 **{project_data['name']}**

J'ai généré {len(ai_result['files'])} fichiers pour toi :
{chr(10).join([f"- {f['filename']}" for f in ai_result['files'][:5]])}
{'...' if len(ai_result['files']) > 5 else ''}

🛠️ **Technologies utilisées** :
{', '.join(ai_result.get('tech_stack', [])[:5])}

**Clique sur "Voir le projet créé" ci-dessous pour accéder à ton code !** 🚀

Tu peux maintenant :
- Voir et copier le code
- Utiliser le Live Preview (si c'est une app web)
- Télécharger le projet en ZIP
- Le déployer en ligne

Que veux-tu faire maintenant ? 😊""",
            'action': 'project_created',
            'project_id': project_id,
            'files_count': len(ai_result['files'])
        }
        
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        return {
            'response': f"""Oups, j'ai rencontré un problème lors de la création ! 😅

**Erreur** : {str(e)}

Peux-tu réessayer en me donnant :
1. Le nom de ton projet
2. Une description claire de ce que tu veux
3. Le type d'application (web, Python, etc.)

Je suis là pour t'aider ! 💪""",
            'action': 'error'
        }


async def _handle_conversation(message: str, history: List[ChatMessage]) -> Dict:
    """Gère une conversation normale avec l'IA"""
    try:
        # Créer une session de chat avec l'IA
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"assistant_{datetime.utcnow().timestamp()}",
            system_message=_get_system_prompt()
        )
        chat.with_model("openai", "gpt-5.1")
        
        # Construire le contexte avec l'historique
        context_messages = []
        for msg in history[-5:]:  # Derniers 5 messages
            if msg.role == 'user':
                context_messages.append(f"Utilisateur : {msg.content}")
            else:
                context_messages.append(f"Assistant : {msg.content}")
        
        # Ajouter le message actuel
        full_prompt = "\n".join(context_messages) + f"\nUtilisateur : {message}\nAssistant :"
        
        # Obtenir la réponse
        response = await chat.send_message(UserMessage(text=full_prompt))
        
        return {
            'response': response,
            'action': 'conversation'
        }
        
    except Exception as e:
        logger.error(f"Error in conversation: {str(e)}")
        return {
            'response': """Je suis là pour t'aider ! 😊

Tu peux me demander de :
- **Créer des projets** : "Crée-moi une application de gestion de tâches"
- **Répondre à des questions** : "Comment créer une API ?"
- **Te conseiller** : "Quelle technologie utiliser pour..."

**Qu'est-ce que je peux faire pour toi ?** 🚀""",
            'action': 'fallback'
        }


def _extract_project_info(message: str) -> Dict:
    """Extrait les informations du projet depuis le message"""
    
    # Types de projets détectables
    type_keywords = {
        'web-app': ['site web', 'application web', 'webapp', 'landing page', 'page web'],
        'python-script': ['script python', 'programme python', 'python'],
        'api': ['api', 'rest api', 'backend'],
        'excel-automation': ['excel', 'automatiser excel', 'feuille de calcul'],
        'ai-app': ['ia', 'intelligence artificielle', 'machine learning', 'chatbot'],
        'game-script': ['jeu', 'game']
    }
    
    detected_type = 'web-app'  # Par défaut
    for ptype, keywords in type_keywords.items():
        if any(keyword in message.lower() for keyword in keywords):
            detected_type = ptype
            break
    
    # Vérifier si la description est suffisante
    is_sufficient = len(message.split()) >= 10  # Au moins 10 mots
    
    return {
        'sufficient': is_sufficient,
        'name': _generate_project_name(message),
        'description': message,
        'type': detected_type,
        'tech_stack': ''
    }


def _generate_project_name(description: str) -> str:
    """Génère un nom de projet depuis la description"""
    # Prendre les premiers mots significatifs
    words = description.split()[:5]
    name = ' '.join(words)
    
    # Limiter à 50 caractères
    if len(name) > 50:
        name = name[:47] + "..."
    
    return name.capitalize()


def _get_system_prompt() -> str:
    """Prompt système pour l'assistant"""
    return """Tu es un assistant IA expert en développement, créatif et sympathique.

Tu parles français de manière naturelle et amicale.
Tu utilises des emojis pour rendre la conversation agréable.
Tu es patient et tu poses des questions si tu as besoin de clarifications.

Tu peux aider l'utilisateur à :
- Créer des applications (web, Python, APIs, etc.)
- Répondre à des questions techniques
- Donner des conseils sur les technologies
- Déboguer du code
- Expliquer des concepts

Sois concis mais complet dans tes réponses.
Encourage l'utilisateur et reste positif !"""


def _get_help_message() -> str:
    """Message d'aide"""
    return """👋 **Voici ce que je peux faire pour toi !**

💻 **Créer des projets** :
- Applications web (React, HTML/CSS/JS)
- Scripts Python (automatisation, analyse de données)
- APIs REST (FastAPI)
- Applications IA (chatbots, ML)
- Outils Excel automatisés
- Et bien plus !

💬 **Répondre à tes questions** :
- Questions techniques
- Conseils sur les technologies
- Aide au débogage
- Explications de concepts

🎤 **Utilisation** :
- Écris ta demande normalement, comme si tu parlais à un ami
- Utilise le micro pour parler
- Ajoute des fichiers si nécessaire

**Exemples de ce que tu peux me dire** :
- "Crée-moi un site web pour mon portfolio"
- "Comment automatiser des tâches Excel ?"
- "Je veux une API pour gérer des utilisateurs"
- "Aide-moi à créer un chatbot"

**Alors, qu'est-ce que tu veux créer aujourd'hui ?** 🚀"""


def _get_insufficient_info_message() -> str:
    """Message quand les infos sont insuffisantes"""
    return """J'ai compris que tu veux créer quelque chose ! 🎯

Pour te générer le meilleur code possible, j'ai besoin d'un peu plus de détails :

📝 **Dis-moi** :
1. **Quel type de projet ?** (site web, script Python, application, etc.)
2. **À quoi ça va servir ?** (description simple)
3. **Des fonctionnalités spécifiques ?** (optionnel)

**Exemple parfait** :
"Je veux une application web de liste de tâches avec possibilité d'ajouter, supprimer et marquer comme fait. Design moderne et coloré."

**Donne-moi plus de détails et je crée ça pour toi !** 💪"""
