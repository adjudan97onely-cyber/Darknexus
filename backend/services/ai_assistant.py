"""
SERVICE ASSISTANT IA INTELLIGENT
Aide à la création de projets avec guidage intelligent
"""

from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import logging

logger = logging.getLogger(__name__)

class AIAssistant:
    def __init__(self):
        self.api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
        # On initialise LlmChat à la demande avec session_id unique
    
    def _get_llm_client(self, session_id: str = None):
        """Crée un client LLM avec les bons paramètres"""
        if session_id is None:
            import uuid
            session_id = str(uuid.uuid4())
        
        return LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message="Tu es un assistant IA expert en développement."
        )
    
    async def analyze_project_idea(self, user_input: str) -> dict:
        """
        Analyse l'idée de projet de l'utilisateur et pose des questions si nécessaire
        """
        system_prompt = """Tu es un assistant IA expert en développement de projets.
        
Ton rôle:
1. Analyser l'idée de projet de l'utilisateur
2. Identifier le type de projet (web app, PWA, jeu mobile, logiciel PC, IA, automatisation, script, etc.)
3. Poser des questions PERTINENTES pour clarifier si l'idée est vague
4. Générer une description COMPLÈTE et DÉTAILLÉE

Types de projets supportés:
- Web App / PWA (applications web modernes)
- Jeux Mobile (jeux pour téléphone)
- Logiciels PC (applications desktop)
- Applications IA (chatbots, analyse, ML)
- Automatisation (scripts, bots, workflows)
- Scripts (Python, Node.js, etc.)
- APIs (REST, GraphQL)
- Et TOUT autre type !

Réponds en JSON avec cette structure:
{
  "needs_clarification": true/false,
  "questions": ["question1", "question2"],  // Si needs_clarification=true
  "project_analysis": {
    "detected_type": "web-app|pwa|mobile-game|desktop-app|ai-app|automation|script|api",
    "name_suggestion": "Nom du projet",
    "description": "Description complète détaillée",
    "tech_stack": "Technologies suggérées",
    "key_features": ["feature1", "feature2"]
  }
}

Si l'idée est claire, mets needs_clarification=false et génère directement l'analyse complète."""

        try:
            # Créer le prompt complet avec system + user
            full_prompt = f"{system_prompt}\n\n{user_input}"
            
            # Créer un client LLM pour cette requête
            llm = self._get_llm_client()
            
            messages = [UserMessage(content=full_prompt)]
            
            response = await llm.chat(
                messages=messages,
                model="gemini-3-flash",
                temperature=0.7
            )
            
            # Parser la réponse JSON
            import json
            result = json.loads(response.content)
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing project idea: {str(e)}")
            return {
                "needs_clarification": False,
                "questions": [],
                "project_analysis": {
                    "detected_type": "web-app",
                    "name_suggestion": "Mon Projet",
                    "description": user_input,
                    "tech_stack": "React, Vite, Tailwind CSS",
                    "key_features": []
                }
            }
    
    async def generate_full_description(self, user_input: str, answers: dict = None) -> dict:
        """
        Génère une description complète du projet avec tous les détails
        """
        system_prompt = """Tu es un expert en spécifications de projets.

Génère une description COMPLÈTE et PROFESSIONNELLE pour le projet.

La description doit inclure:
1. Vue d'ensemble du projet
2. Fonctionnalités principales détaillées
3. Interface utilisateur / UX
4. Technologies recommandées
5. Caractéristiques spéciales

Types de projets que tu peux créer:
- Web App: Applications web modernes React/Vue/Next.js
- PWA: Applications mobiles web installables
- Jeux Mobile: Jeux pour téléphone (HTML5, Canvas, WebGL)
- Logiciels PC: Applications desktop (Electron, PyQt, etc.)
- Applications IA: Chatbots, analyse de données, ML, vision
- Automatisation: Scripts, bots, workflows, scraping
- Scripts: Python, Node.js, Bash pour diverses tâches
- APIs: REST, GraphQL, WebSocket

Réponds en JSON:
{
  "name": "Nom du projet",
  "type": "web-app|pwa|mobile-game|desktop-app|ai-app|automation|python-script|api",
  "description": "Description complète et détaillée (300-500 caractères minimum)",
  "tech_stack": "Technologies recommandées",
  "is_pwa": true/false,
  "estimated_complexity": "simple|medium|complex"
}"""

        user_message = f"Projet: {user_input}"
        if answers:
            user_message += f"\n\nRéponses aux questions: {answers}"
        
        try:
            # Créer le prompt complet
            full_prompt = f"{system_prompt}\n\n{user_message}"
            
            # Créer un client LLM pour cette requête
            llm = self._get_llm_client()
            
            messages = [UserMessage(content=full_prompt)]
            
            response = await llm.chat(
                messages=messages,
                model="gemini-3-flash",
                temperature=0.7
            )
            
            import json
            result = json.loads(response.content)
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating description: {str(e)}")
            return {
                "name": "Mon Projet",
                "type": "web-app",
                "description": user_input,
                "tech_stack": "React 18, Vite, Tailwind CSS",
                "is_pwa": False,
                "estimated_complexity": "medium"
            }

# Instance globale
ai_assistant = AIAssistant()
