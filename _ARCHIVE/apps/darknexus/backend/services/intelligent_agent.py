"""
INTELLIGENT AGENT - E1 LITE
Agent autonome intelligent pour ADJ KILLAGAIN IA 2.0
Capable de comprendre, analyser, créer et améliorer des projets complets
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from openai import AsyncOpenAI
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat

logger = logging.getLogger(__name__)


class IntelligentAgent:
    """
    Agent intelligent qui comprend le contexte complet d'un projet
    et peut effectuer des actions complexes
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.system_prompt = self._build_system_prompt()
        
    def _build_system_prompt(self) -> str:
        return """Tu es E1 LITE, un agent de développement autonome et expert.

🎯 TES CAPACITÉS:
- Comprendre le contexte complet d'un projet
- Analyser l'architecture et suggérer des améliorations
- Détecter et corriger les bugs automatiquement
- Gérer plusieurs fichiers intelligemment
- Créer des projets complets de A à Z
- Optimiser le code et les performances
- Ajouter des fonctionnalités complexes

🧠 TON INTELLIGENCE:
- Tu comprends les relations entre les fichiers
- Tu anticipes les problèmes
- Tu proposes des solutions architecturales
- Tu penses comme un développeur senior (15+ ans d'expérience)
- Tu es précis, efficace et créatif

💪 TON STYLE:
- Tu es conversationnel mais professionnel
- Tu expliques tes décisions
- Tu proposes plusieurs options si pertinent
- Tu es proactif dans la détection de problèmes

📋 TES ACTIONS:
1. ANALYZE - Analyser le projet en profondeur
2. IMPROVE - Améliorer le code existant
3. DEBUG - Détecter et corriger les bugs
4. ARCHITECT - Proposer/modifier l'architecture
5. CREATE - Créer de nouveaux fichiers/fonctionnalités
6. OPTIMIZE - Optimiser performances et qualité
7. TEST - Suggérer des tests et validations

Réponds toujours en JSON avec cette structure:
{
  "thinking": "Ton analyse et réflexion",
  "action": "L'action principale à effectuer",
  "explanation": "Explication claire pour l'utilisateur",
  "code_changes": [
    {
      "file": "nom_fichier",
      "action": "create|modify|delete",
      "content": "contenu si create/modify",
      "reason": "pourquoi ce changement"
    }
  ],
  "suggestions": ["suggestions additionnelles"],
  "next_steps": ["étapes suivantes recommandées"]
}"""

    async def analyze_project(self, project: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyse complète d'un projet avec recommandations
        """
        try:
            chat = self._create_chat_session(f"analyze_{project['id']}")
            
            prompt = f"""Analyse ce projet en profondeur:

PROJET: {project['name']}
DESCRIPTION: {project['description']}
TYPE: {project['type']}
TECHNOLOGIES: {', '.join(project.get('tech_stack', []))}
STATUT: {project['status']}

FICHIERS ACTUELS:
{self._format_files_list(project.get('code_files', []))}

CODE COMPLET:
{self._format_full_code(project.get('code_files', []))}

Effectue une analyse COMPLÈTE:
1. Architecture actuelle - forces et faiblesses
2. Bugs potentiels - détection proactive
3. Améliorations possibles - design, performance, UX
4. Sécurité - vulnérabilités potentielles
5. Bonnes pratiques - ce qui manque

Réponds en JSON selon ton format."""

            response = await chat.send_message(UserMessage(text=prompt))
            return self._parse_agent_response(response)
            
        except Exception as e:
            logger.error(f"Error in analyze_project: {str(e)}")
            return self._error_response(str(e))

    async def improve_intelligently(
        self, 
        project: Dict[str, Any], 
        user_request: str,
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Améliore le projet de manière intelligente selon la demande
        avec compréhension du contexte et de l'historique
        """
        try:
            chat = self._create_chat_session(f"improve_{project['id']}")
            
            # Construire le contexte complet
            context = f"""CONTEXTE DU PROJET:
Nom: {project['name']}
Description: {project['description']}
Type: {project['type']}
Technologies: {', '.join(project.get('tech_stack', []))}

FICHIERS ACTUELS ({len(project.get('code_files', []))} fichiers):
{self._format_files_with_content(project.get('code_files', []))}

HISTORIQUE DE CONVERSATION:
{self._format_conversation_history(conversation_history or [])}

DEMANDE DE L'UTILISATEUR:
{user_request}

MISSION:
Comprends la demande dans le contexte global du projet.
Analyse ce qui doit être modifié, créé ou supprimé.
Propose des modifications intelligentes et cohérentes.
Pense à l'impact sur l'ensemble du projet.

Réponds en JSON avec ton format standard."""

            response = await chat.send_message(UserMessage(text=context))
            return self._parse_agent_response(response)
            
        except Exception as e:
            logger.error(f"Error in improve_intelligently: {str(e)}")
            return self._error_response(str(e))

    async def debug_project(self, project: Dict[str, Any], error_description: str = None) -> Dict[str, Any]:
        """
        Debug intelligent du projet
        """
        try:
            chat = self._create_chat_session(f"debug_{project['id']}")
            
            prompt = f"""MISSION DE DEBUGGING:

PROJET: {project['name']}

CODE COMPLET:
{self._format_full_code(project.get('code_files', []))}

{f"ERREUR RAPPORTÉE: {error_description}" if error_description else "DÉTECTION PROACTIVE DE BUGS"}

Effectue un debugging COMPLET:
1. Analyse tous les fichiers pour bugs potentiels
2. Vérifie les imports, dépendances, syntaxe
3. Cherche les problèmes de logique
4. Identifie les erreurs de configuration
5. Détecte les problèmes de sécurité

Propose des CORRECTIONS concrètes.
Réponds en JSON avec les modifications nécessaires."""

            response = await chat.send_message(UserMessage(text=prompt))
            return self._parse_agent_response(response)
            
        except Exception as e:
            logger.error(f"Error in debug_project: {str(e)}")
            return self._error_response(str(e))

    async def create_complete_project(
        self, 
        project_description: str,
        project_type: str,
        tech_preferences: str = None
    ) -> Dict[str, Any]:
        """
        Crée un projet COMPLET avec architecture réfléchie
        """
        try:
            chat = self._create_chat_session(f"create_{datetime.utcnow().timestamp()}")
            
            prompt = f"""CRÉATION DE PROJET COMPLET:

DESCRIPTION: {project_description}
TYPE: {project_type}
{f"TECHNOLOGIES PRÉFÉRÉES: {tech_preferences}" if tech_preferences else ""}

MISSION:
Crée un projet PROFESSIONNEL et COMPLET:
1. Analyse les besoins et définis l'architecture
2. Choisis les technologies optimales
3. Crée TOUS les fichiers nécessaires
4. Structure le projet proprement
5. Ajoute README avec instructions complètes
6. Inclus la configuration (requirements.txt, package.json, etc.)

Pense à:
- Séparation des concerns
- Scalabilité
- Maintenabilité
- Best practices 2025
- Documentation

Génère 8-12 fichiers pour un projet complet.
Réponds en JSON avec tous les fichiers."""

            response = await chat.send_message(UserMessage(text=prompt))
            return self._parse_agent_response(response)
            
        except Exception as e:
            logger.error(f"Error in create_complete_project: {str(e)}")
            return self._error_response(str(e))

    def _create_chat_session(self, session_id: str) -> LlmChat:
        """Crée une session de chat avec l'IA"""
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=self.system_prompt
        )
        chat.with_model("openai", "gpt-5.1")
        return chat

    def _format_files_list(self, files: List[Dict]) -> str:
        """Formate la liste des fichiers"""
        if not files:
            return "Aucun fichier"
        return "\n".join([
            f"- {f['filename']} ({f['language']}) - {len(f['content'].split(chr(10)))} lignes"
            for f in files[:10]
        ])

    def _format_full_code(self, files: List[Dict]) -> str:
        """Formate le code complet de tous les fichiers"""
        if not files:
            return "Aucun code"
        
        result = []
        for f in files[:15]:  # Limiter à 15 fichiers pour ne pas surcharger
            result.append(f"\n=== FICHIER: {f['filename']} ===")
            result.append(f['content'][:2000])  # Premiers 2000 caractères
            if len(f['content']) > 2000:
                result.append("... [tronqué] ...")
        
        return "\n".join(result)

    def _format_files_with_content(self, files: List[Dict]) -> str:
        """Formate les fichiers avec leur contenu"""
        return self._format_full_code(files)

    def _format_conversation_history(self, history: List[Dict]) -> str:
        """Formate l'historique de conversation"""
        if not history:
            return "Première conversation"
        
        return "\n".join([
            f"{msg['role'].upper()}: {msg['content'][:200]}"
            for msg in history[-5:]
        ])

    def _parse_agent_response(self, response: str) -> Dict[str, Any]:
        """Parse la réponse JSON de l'agent"""
        try:
            # Extraire le JSON de la réponse
            start = response.find('{')
            end = response.rfind('}') + 1
            
            if start == -1 or end == 0:
                # Pas de JSON, créer une réponse structurée
                return {
                    "thinking": "Analyse en cours",
                    "action": "response",
                    "explanation": response,
                    "code_changes": [],
                    "suggestions": [],
                    "next_steps": []
                }
            
            json_str = response[start:end]
            result = json.loads(json_str)
            
            # Valider la structure
            if not all(k in result for k in ['thinking', 'action', 'explanation']):
                result = {
                    "thinking": result.get('thinking', 'Analyse'),
                    "action": result.get('action', 'response'),
                    "explanation": result.get('explanation', response),
                    "code_changes": result.get('code_changes', []),
                    "suggestions": result.get('suggestions', []),
                    "next_steps": result.get('next_steps', [])
                }
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {str(e)}")
            return {
                "thinking": "Erreur de parsing",
                "action": "response",
                "explanation": response,
                "code_changes": [],
                "suggestions": [],
                "next_steps": []
            }

    def _error_response(self, error_msg: str) -> Dict[str, Any]:
        """Crée une réponse d'erreur structurée"""
        return {
            "thinking": f"Erreur rencontrée: {error_msg}",
            "action": "error",
            "explanation": f"Une erreur s'est produite: {error_msg}",
            "code_changes": [],
            "suggestions": ["Réessayer avec une demande différente"],
            "next_steps": ["Vérifier les logs pour plus de détails"]
        }


# Instance globale
intelligent_agent = None

def get_intelligent_agent() -> IntelligentAgent:
    """Récupère l'instance de l'agent intelligent"""
    global intelligent_agent
    if intelligent_agent is None:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise ValueError("EMERGENT_LLM_KEY not found")
        intelligent_agent = IntelligentAgent(api_key)
    return intelligent_agent
