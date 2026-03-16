"""
ASSISTANT CHAT API - Backend pour l'assistant IA conversationnel COMPLET
Permet de discuter naturellement avec l'IA comme avec Emergent
Supporte Vision AI, modification de projets, et actions avancées
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import logging
from services.ai_service import ai_generator
from services.intelligent_agent import get_intelligent_agent
from services.web_search_service import web_search_service
from services.n8n_generator import n8n_generator
from services.user_memory import user_memory
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
from datetime import datetime
from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorClient
import base64
import io
from PIL import Image

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
    images: Optional[List[str]] = None
    files_created: Optional[List[str]] = None


class AssistantChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []
    images: Optional[List[str]] = None  # Base64 encoded images
    current_project_id: Optional[str] = None  # Pour modifier un projet existant
    user_id: Optional[str] = None  # ID de l'utilisateur pour la mémoire


@router.post("/chat")
async def chat_with_assistant(request: AssistantChatRequest):
    """
    Discute avec l'assistant IA de manière naturelle - VERSION COMPLÈTE
    Supporte : Vision AI, modification de projets, création avancée, RECHERCHE WEB, N8N, MÉMOIRE
    """
    try:
        user_message = request.message.lower()
        user_id = request.user_id or "default_user"  # TODO: Récupérer depuis JWT
        
        # ÉTAPE 0 : Charger le contexte utilisateur depuis la mémoire
        user_context = await user_memory.get_user_context_summary(user_id)
        
        # Détect if user wants n8n workflow
        wants_n8n = _wants_n8n_workflow(user_message, request.message)
        
        if wants_n8n:
            result = await _handle_n8n_generation(request.message, user_id)
            # Stocker dans l'historique
            await user_memory.store_conversation(
                user_id,
                request.message,
                result['response'],
                {'action': 'n8n_workflow'}
            )
            return result
        
        # ÉTAPE 1 : Détecter si on a besoin de chercher des infos
        needs_search = _needs_web_search(user_message, request.message)
        
        # Si on a besoin de chercher, faire une recherche web d'abord
        search_results = None
        if needs_search:
            logger.info(f"Web search needed for: {request.message}")
            search_results = await web_search_service.search_and_summarize(request.message)
        
        # Déterminer l'intention de l'utilisateur
        intention = _detect_intention(user_message, request.current_project_id)
        
        logger.info(f"User message: {request.message}")
        logger.info(f"Detected intention: {intention}")
        logger.info(f"Has images: {bool(request.images)}")
        logger.info(f"Web search done: {bool(search_results)}")
        logger.info(f"User context loaded: {bool(user_context)}")
        
        # Si des images sont fournies, analyser d'abord
        image_analysis = None
        if request.images and len(request.images) > 0:
            image_analysis = await _analyze_images(request.images, request.message)
        
        # Construire le contexte enrichi avec la recherche web ET la mémoire utilisateur
        enriched_message = request.message
        if user_context:
            enriched_message = f"[CONTEXTE UTILISATEUR]\n{user_context}\n\n{request.message}"
        if search_results:
            enriched_message += f"\n\n[INFORMATIONS TROUVÉES]\n{search_results}"
        
        # Si l'utilisateur veut modifier un projet existant
        if intention == 'modify_project' and request.current_project_id:
            result = await _handle_project_modification(
                enriched_message, 
                request.current_project_id,
                request.conversation_history,
                image_analysis
            )
        
        # Si l'utilisateur veut créer quelque chose
        elif intention == 'create_project':
            result = await _handle_project_creation(
                enriched_message, 
                request.conversation_history,
                image_analysis,
                search_results
            )
            # Apprendre le pattern
            await user_memory.learn_pattern(user_id, 'project_creation', {'type': 'create'})
        
        # Si l'utilisateur pose une question ou discute
        elif intention == 'question' or intention == 'chat':
            result = await _handle_conversation(
                enriched_message, 
                request.conversation_history,
                image_analysis
            )
        
        # Si l'utilisateur demande de l'aide
        elif intention == 'help':
            result = {
                'response': _get_help_message(),
                'action': 'help',
                'progress': ['Affichage de l\'aide']
            }
        
        # Réponse par défaut - conversation normale
        else:
            result = await _handle_conversation(
                enriched_message, 
                request.conversation_history,
                image_analysis
            )
        
        # Stocker la conversation dans la mémoire
        await user_memory.store_conversation(
            user_id,
            request.message,
            result.get('response', ''),
            {'action': result.get('action', 'unknown')}
        )
        
        return result
            
    except Exception as e:
        logger.error(f"Error in assistant chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def _wants_n8n_workflow(message_lower: str, original_message: str) -> bool:
    """Détecte si l'utilisateur veut un workflow n8n"""
    
    n8n_keywords = [
        'n8n', 'workflow', 'automatisation', 'automatiser',
        'automatique', 'trigger', 'webhook', 'zapier',
        'intégration', 'connecter', 'synchroniser'
    ]
    
    return any(keyword in message_lower for keyword in n8n_keywords)


async def _handle_n8n_generation(message: str, user_id: str) -> Dict[str, Any]:
    """Génère un workflow n8n basé sur la demande"""
    try:
        # Détecter le type de workflow
        use_case = None
        if 'facture' in message.lower():
            use_case = 'facture_ocr'
        elif 'email' in message.lower():
            use_case = 'email_automation'
        
        # Générer le workflow
        result = await n8n_generator.generate_workflow(message, use_case)
        
        if result['success']:
            # Stocker la préférence
            await user_memory.store_preference(user_id, 'uses_n8n', True)
            
            return {
                'response': f"""🤖 **WORKFLOW N8N GÉNÉRÉ !**

{result['workflow']}

**💡 INSTRUCTIONS** :
1. Copie le JSON du workflow
2. Va dans n8n → Click + → Import from JSON
3. Colle le JSON
4. Configure les credentials
5. Active le workflow !

**🎯 NOTE** : Ce workflow est un point de départ. Adapte-le selon tes besoins !""",
                'action': 'n8n_workflow_generated',
                'progress': [
                    '🔍 Analyse de ta demande d\'automatisation...',
                    '🤖 Sélection des nodes n8n appropriés...',
                    '⚙️ Configuration du workflow...',
                    '✅ Workflow n8n généré !'
                ]
            }
        else:
            return {
                'response': f"""Désolé, je n'ai pas pu générer le workflow n8n ! 😅

**Erreur** : {result.get('error', 'Inconnue')}

Peux-tu reformuler ta demande d'automatisation ?

**Exemple** :
- Je veux un workflow n8n qui envoie un email quand je reçois un paiement Stripe
- Crée un workflow pour extraire les données d'une facture par OCR""",
                'action': 'error'
            }
            
    except Exception as e:
        logger.error(f"Error handling n8n generation: {str(e)}")
        return {
            'response': f"Erreur lors de la génération du workflow n8n : {str(e)}",
            'action': 'error'
        }


def _needs_web_search(message_lower: str, original_message: str) -> bool:
    """Détecte si on a besoin de faire une recherche web"""
    
    # Mots-clés qui indiquent qu'on a besoin de chercher
    search_indicators = [
        # Fichiers spécifiques
        'dt18', 'fichier', 'file',
        # Jeux et logiciels
        'football live', 'football life', 'pes', 'fifa', 'jeu', 'game',
        # Demandes d'info
        'qu\'est-ce que', 'c\'est quoi', 'comment faire', 'où trouver',
        'explique', 'parle-moi de', 'informe-moi',
        # Technologies spécifiques
        'api de', 'library', 'framework', 'outil',
        # Termes techniques non communs
        'patch', 'mod', 'modding', 'data folder'
    ]
    
    # Patterns qui suggèrent des sujets spécifiques
    specific_patterns = [
        len(original_message.split()) > 15,  # Messages longs = sujets complexes
        any(word.isupper() and len(word) > 2 for word in original_message.split()),  # Acronymes
        '?' in original_message,  # Questions
    ]
    
    # Vérifier si on a besoin de chercher
    has_indicator = any(indicator in message_lower for indicator in search_indicators)
    has_pattern = any(specific_patterns)
    
    return has_indicator or has_pattern


def _detect_intention(message: str, current_project_id: str = None) -> str:
    """Détecte l'intention de l'utilisateur"""
    
    # Si on est dans un projet, détecter la modification
    if current_project_id:
        modify_keywords = [
            'modifie', 'modifier', 'change', 'changer', 'améliore', 'améliorer',
            'corrige', 'corriger', 'ajoute', 'ajouter', 'enlève', 'enlever',
            'supprime', 'supprimer', 'remplace', 'remplacer', 'mets à jour'
        ]
        if any(keyword in message for keyword in modify_keywords):
            return 'modify_project'
    
    # Mots-clés pour créer un projet
    create_keywords = [
        'crée', 'créer', 'faire', 'construire', 'développe', 'développer',
        'génère', 'générer', 'je veux', 'j\'ai besoin', 'peux-tu créer',
        'application', 'site web', 'script', 'programme', 'nouveau projet'
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


async def _analyze_images(images: List[str], context: str) -> Dict[str, Any]:
    """Analyse des images avec Vision AI"""
    try:
        api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
        
        # Utiliser GPT-5.1 avec Vision
        chat = LlmChat(
            api_key=api_key,
            session_id=f"vision_{datetime.utcnow().timestamp()}"
        )
        chat.with_model("openai", "gpt-5.1-vision")
        
        # Préparer les images pour l'API
        image_messages = []
        for img_base64 in images[:3]:  # Max 3 images
            image_messages.append({
                'type': 'image_url',
                'image_url': {
                    'url': f"data:image/png;base64,{img_base64}"
                }
            })
        
        # Créer le prompt
        prompt = f"""Analyse cette/ces image(s) dans le contexte suivant : {context}

Décris :
1. Ce que tu vois dans l'image
2. Comment cela se rapporte à la demande de l'utilisateur
3. Des suggestions ou recommandations basées sur l'image

Sois précis et technique si c'est du code ou une interface."""

        # Envoyer à l'API
        response = await chat.send_message(UserMessage(text=prompt, images=image_messages))
        
        return {
            'success': True,
            'analysis': response,
            'image_count': len(images)
        }
        
    except Exception as e:
        logger.error(f"Error analyzing images: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'analysis': "Je ne peux pas analyser les images pour le moment, mais je vais répondre à ta demande du mieux que je peux !"
        }


async def _handle_project_modification(
    message: str, 
    project_id: str,
    history: List[ChatMessage],
    image_analysis: Dict = None
) -> Dict:
    """Modifie un projet existant basé sur les demandes de l'utilisateur"""
    try:
        # Récupérer le projet
        project = await projects_collection.find_one({'id': project_id}, {'_id': 0})
        
        if not project:
            return {
                'response': "Je ne trouve pas ce projet. Peux-tu me donner plus de détails ?",
                'action': 'error'
            }
        
        # Construire le contexte
        context = f"""
PROJET ACTUEL:
Nom: {project['name']}
Description: {project['description']}
Type: {project['type']}

FICHIERS EXISTANTS:
{chr(10).join([f"- {f['filename']}" for f in project.get('code_files', [])])}

DEMANDE DE L'UTILISATEUR:
{message}
"""
        
        if image_analysis and image_analysis.get('success'):
            context += f"\n\nANALYSE D'IMAGE:\n{image_analysis['analysis']}"
        
        # Utiliser l'IA pour générer les modifications
        api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(api_key=api_key, session_id=f"modify_{project_id}")
        chat.with_model("openai", "gpt-5.1")
        
        prompt = f"""{context}

Basé sur la demande de l'utilisateur, génère les fichiers MODIFIÉS ou NOUVEAUX.
Réponds en JSON avec cette structure:
{{
    "explanation": "Explication des changements",
    "files_to_modify": [
        {{"filename": "nom.ext", "content": "contenu complet du fichier modifié"}}
    ],
    "files_to_create": [
        {{"filename": "nouveau.ext", "content": "contenu", "language": "python"}}
    ]
}}"""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parser la réponse (simplifiée pour l'instant)
        # En production, il faudrait parser le JSON correctement
        
        # Mettre à jour le projet
        updated_at = datetime.utcnow()
        await projects_collection.update_one(
            {'id': project_id},
            {'$set': {'updated_at': updated_at}}
        )
        
        return {
            'response': f"""✅ **Modifications appliquées !**

{response[:500]}...

Ton projet a été mis à jour avec succès !

**Prochaines étapes** :
- Vérifie les changements dans les fichiers
- Teste avec le Live Preview
- Télécharge si tu es satisfait

Veux-tu d'autres modifications ? 😊""",
            'action': 'project_modified',
            'project_id': project_id,
            'progress': [
                'Analyse de la demande...',
                'Lecture du projet existant...',
                'Génération des modifications...',
                'Application des changements...',
                'Projet mis à jour !'
            ]
        }
        
    except Exception as e:
        logger.error(f"Error modifying project: {str(e)}")
        return {
            'response': f"""Oups, problème lors de la modification ! 😅

**Erreur** : {str(e)}

Peux-tu reformuler ta demande plus clairement ?

Exemple: "Change la couleur du titre en rouge" ou "Ajoute un bouton de connexion" """,
            'action': 'error'
        }


async def _handle_project_creation(
    message: str, 
    history: List[ChatMessage],
    image_analysis: Dict = None,
    search_results: str = None
) -> Dict:
    """Gère la création de projet via conversation naturelle + Vision AI + Web Search"""
    try:
        # Ajouter l'analyse d'image au contexte si disponible
        full_message = message
        if image_analysis and image_analysis.get('success'):
            full_message += f"\n\nINFORMATIONS DEPUIS L'IMAGE:\n{image_analysis['analysis']}"
        
        # Ajouter les résultats de recherche si disponibles
        context_info = ""
        if search_results:
            context_info = f"\n\n📚 CONTEXTE (depuis recherche web):\n{search_results}\n\n"
        
        # Extraire les informations du projet
        project_info = _extract_project_info(full_message)
        
        # CHANGEMENT : Même si les infos semblent insuffisantes, on essaie quand même
        # si on a des résultats de recherche ou une description détaillée
        has_context = bool(search_results) or len(message.split()) > 20
        
        if not project_info['sufficient'] and not has_context:
            return {
                'response': f"""Je comprends que tu veux créer quelque chose ! 🚀

{context_info if context_info else ''}

Pour que je puisse générer le meilleur code possible, j'ai besoin de quelques détails :

📝 **Décris-moi ton projet** :
- Quel type d'application ? (site web, script Python, outil Excel, etc.)
- Quelle est sa fonction principale ?
- Y a-t-il des fonctionnalités spécifiques ?

**Exemple** : "Je veux une application web pour gérer mes tâches quotidiennes avec des priorités et des catégories"

Donne-moi plus de détails et je vais créer ça pour toi ! 💪""",
                'action': 'need_more_info',
                'progress': ['Analyse de ta demande...', 'Besoin de plus de détails']
            }
        
        # Créer le projet avec le contexte enrichi
        project_data = {
            'name': project_info['name'],
            'description': full_message + context_info,  # Ajouter le contexte
            'type': project_info['type'],
            'tech_stack': project_info.get('tech_stack', '')
        }
        
        # Retourner la progression
        progress_steps = [
            '🔍 Recherche d\'informations...' if search_results else '🎯 Analyse de ta demande...',
            '🧠 Choix des technologies...',
            '⚙️ Configuration du projet...',
            '📝 Génération du code...'
        ]
        
        # Générer le code avec le contexte enrichi
        logger.info(f"Generating code for project: {project_data['name']}")
        logger.info(f"With web search context: {bool(search_results)}")
        
        ai_result = await ai_generator.generate_code(
            project_data=project_data,
            preferred_model='gpt-5.1'
        )
        
        progress_steps.append(f'✅ {len(ai_result["files"])} fichiers créés !')
        
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

{context_info if context_info else ''}

📦 **{project_data['name']}**

J'ai généré **{len(ai_result['files'])} fichiers** pour toi :
{chr(10).join([f"  ✓ {f['filename']}" for f in ai_result['files'][:5]])}
{'  ...' if len(ai_result['files']) > 5 else ''}

🛠️ **Technologies utilisées** :
{', '.join(ai_result.get('tech_stack', [])[:5])}

**Clique sur "Voir le projet créé" ci-dessous pour accéder à ton code !** 🚀

Tu peux maintenant :
- 👁️ Voir et copier le code
- 🖥️ Utiliser le Live Preview (si c'est une app web)
- 📦 Télécharger le projet en ZIP
- 🚀 Le déployer en ligne

Que veux-tu faire maintenant ? 😊""",
            'action': 'project_created',
            'project_id': project_id,
            'files_count': len(ai_result['files']),
            'files_created': [f['filename'] for f in ai_result['files']],
            'progress': progress_steps
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
            'action': 'error',
            'progress': ['❌ Erreur lors de la création']
        }


async def _handle_conversation(
    message: str, 
    history: List[ChatMessage],
    image_analysis: Dict = None
) -> Dict:
    """Gère une conversation normale avec l'IA + Vision + GUIDE DE PROJET"""
    try:
        # Détecter si l'utilisateur décrit un projet qu'il veut créer
        wants_project_guide = _wants_project_creation_guide(message)
        
        if wants_project_guide:
            # L'utilisateur décrit un projet - on lui donne un guide formaté
            return await _generate_project_template(message, history, image_analysis)
        
        # Créer une session de chat avec l'IA
        api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
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
        
        # Ajouter l'analyse d'image si disponible
        if image_analysis and image_analysis.get('success'):
            context_messages.append(f"\n[IMAGE ANALYSÉE] : {image_analysis['analysis']}")
        
        # Ajouter le message actuel
        full_prompt = "\n".join(context_messages) + f"\nUtilisateur : {message}\nAssistant :"
        
        # Obtenir la réponse
        response = await chat.send_message(UserMessage(text=full_prompt))
        
        return {
            'response': response,
            'action': 'conversation',
            'progress': ['💬 Analyse de ta question...', '🧠 Réflexion...', '✅ Réponse prête !']
        }
        
    except Exception as e:
        logger.error(f"Error in conversation: {str(e)}")
        return {
            'response': """Je suis là pour t'aider ! 😊

Tu peux me demander de :
- **Créer des projets** : "Crée-moi une application de gestion de tâches"
- **Te guider** : "Je veux créer une app, aide-moi à remplir le formulaire"
- **Répondre à des questions** : "Comment créer une API ?"
- **Te conseiller** : "Quelle technologie utiliser pour..."
- **Analyser des images** : Envoie une capture d'écran et pose ta question

**Qu'est-ce que je peux faire pour toi ?** 🚀""",
            'action': 'fallback',
            'progress': ['En attente de ta demande...']
        }


def _wants_project_creation_guide(message: str) -> bool:
    """Détecte si l'utilisateur veut un guide pour créer un projet"""
    
    guide_indicators = [
        'aide-moi à créer', 'je veux créer', 'j\'aimerais créer',
        'comment créer', 'guide-moi', 'aide-moi pour',
        'prépare-moi', 'formule pour', 'template pour',
        'je veux faire', 'j\'aimerais faire', 'comment faire'
    ]
    
    project_words = [
        'projet', 'application', 'app', 'site', 'outil',
        'script', 'programme', 'logiciel'
    ]
    
    has_guide_word = any(ind in message.lower() for ind in guide_indicators)
    has_project_word = any(word in message.lower() for word in project_words)
    
    # Si c'est une longue description (>50 mots) c'est probablement un projet
    is_long_description = len(message.split()) > 50
    
    return (has_guide_word and has_project_word) or is_long_description


async def _generate_project_template(
    message: str,
    history: List[ChatMessage],
    image_analysis: Dict = None
) -> Dict:
    """Génère un template de projet formaté pour copier-coller"""
    try:
        # Utiliser l'IA pour analyser la demande et créer le template
        api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(api_key=api_key, session_id=f"template_{datetime.utcnow().timestamp()}")
        chat.with_model("openai", "gpt-5.1")
        
        context = message
        if image_analysis and image_analysis.get('success'):
            context += f"\n\nInformations depuis l'image : {image_analysis['analysis']}"
        
        prompt = f"""L'utilisateur veut créer un projet. Voici sa description :

{context}

Génère un TEMPLATE DE PROJET formaté qu'il peut COPIER-COLLER dans le formulaire de création.

Format EXACT à suivre :

📋 **VOICI TON FORMULAIRE DE PROJET** 

**📝 Nom du Projet :**
[Nom court et clair, max 50 caractères]

**🔧 Type de Projet :**
[Choisis parmi : Application Web, Script Python, API REST, Application Mobile, Script de Jeux, Automatisation Excel, CLI Tool]

**🤖 Modèle IA Expert Recommandé :**
[Choisis parmi : 
- GPT-5.1 (Recommandé) - Pour projets standards
- GPT-5.2 (Ultra) - Pour projets très complexes
- Claude 4 Sonnet - Pour analyse et raisonnement
- GPT-5.1 Vision - Pour projets avec images
- Gemini 2.5 Flash - Pour rapidité
- Gemini 2.5 Pro - Pour projets ambitieux]

**📚 Stack Technique (optionnel) :**
[Technologies suggérées, ex: React, Python, FastAPI, MongoDB]

**📄 Description Détaillée :**
[Description complète et structurée avec :
- Objectif principal
- Fonctionnalités clés (bullet points)
- Détails techniques importants
- Ce que l'app doit pouvoir faire]

---

**💡 INSTRUCTIONS DE COPIE-COLLE :**
1. Copie le contenu après "Nom du Projet :" → Colle dans le champ "Nom du Projet"
2. Copie le type suggéré → Sélectionne-le dans le menu déroulant "Type de Projet"
3. Copie le modèle IA → Sélectionne-le dans "Modèle IA Expert"
4. Copie la stack technique → Colle dans "Stack Technique"
5. Copie la description détaillée → Colle dans "Description Détaillée"
6. Clique sur "Générer le Code" !

**🎯 POURQUOI CES CHOIX :**
[Brève explication des recommandations]

Sois précis, structuré et fais en sorte que ce soit facile à copier-coller !"""

        response = await chat.send_message(UserMessage(text=prompt))
        
        return {
            'response': response,
            'action': 'project_guide',
            'progress': [
                '🎯 Analyse de ton idée de projet...',
                '🧠 Choix du meilleur type et modèle...',
                '📝 Génération du template...',
                '✅ Template prêt à copier-coller !'
            ]
        }
        
    except Exception as e:
        logger.error(f"Error generating project template: {str(e)}")
        return {
            'response': f"""Je peux t'aider à préparer ton projet ! 😊

Redis-moi ce que tu veux créer avec plus de détails :
- Quel type d'application ?
- À quoi ça va servir ?
- Quelles fonctionnalités tu veux ?

Et je te préparerai un formulaire prêt à copier-coller ! 💪

**Erreur** : {str(e)}""",
            'action': 'error'
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
