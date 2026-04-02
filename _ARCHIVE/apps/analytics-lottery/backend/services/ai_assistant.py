"""
SERVICE ASSISTANT IA INTELLIGENT
Aide à la création de projets avec guidage intelligent
"""

from openai import AsyncOpenAI
import os
import logging
import json
import asyncio

logger = logging.getLogger(__name__)

class AIAssistant:
    def __init__(self):
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment")
        self.client = AsyncOpenAI(api_key=api_key)
    
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
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                temperature=0.7
            )
            
            # Parser la réponse JSON
            result = json.loads(response.choices[0].message.content)
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

Génère une description PROFESSIONNELLE pour le projet.

Réponds UNIQUEMENT en JSON valide:
{
  "name": "Nom du projet",
  "type": "web-app|pwa|mobile-game|desktop-app|ai-app|automation|python-script|api",
  "description": "Description complète (300+ caractères)",
  "tech_stack": "Technologies recommandées",
  "is_pwa": true ou false,
  "estimated_complexity": "simple|medium|complex"
}"""

        user_message = f"Projet: {user_input}"
        if answers:
            user_message += f"\n\nRéponses: {json.dumps(answers, ensure_ascii=False)}"
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7
            )
            
            result = json.loads(response.choices[0].message.content)
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
