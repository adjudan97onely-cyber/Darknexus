import os
import json
import asyncio
from typing import Dict, Any
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)


class AICodeGenerator:
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not self.api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment")
    
    async def generate_code(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Génère du code pour un projet en utilisant l'IA
        
        Args:
            project_data: Dictionnaire contenant name, description, type, tech_stack
            
        Returns:
            Dict avec 'files' (liste de fichiers) et 'tech_stack' (liste de technologies)
        """
        try:
            # Créer une session de chat
            session_id = f"project_{project_data.get('name', 'unknown')}_{asyncio.get_event_loop().time()}"
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message="Tu es un expert développeur qui génère du code de haute qualité, fonctionnel et prêt à l'emploi."
            )
            
            # Utiliser GPT-5.1 (recommandé selon la doc)
            chat.with_model("openai", "gpt-5.1")
            
            # Construire le prompt
            prompt = self._build_prompt(project_data)
            
            logger.info(f"Generating code for project: {project_data.get('name')}")
            
            # Envoyer le message
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            logger.info(f"Received response from AI: {len(response)} characters")
            
            # Parser la réponse JSON
            result = self._parse_response(response)
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating code: {str(e)}")
            raise Exception(f"Erreur lors de la génération du code: {str(e)}")
    
    def _build_prompt(self, project_data: Dict[str, Any]) -> str:
        """Construit le prompt pour l'IA"""
        project_type = project_data.get('type', 'unknown')
        name = project_data.get('name', 'Unknown')
        description = project_data.get('description', '')
        tech_stack = project_data.get('tech_stack', '')
        
        # Définir les guidelines par type de projet
        type_guidelines = {
            'web-app': "Génère une application web complète avec frontend (React) et backend (FastAPI). Inclus les fichiers HTML/JSX, CSS, Python avec routes API, et un README.",
            'python-script': "Génère un script Python complet et fonctionnel avec les imports nécessaires, gestion d'erreurs, et commentaires explicatifs.",
            'excel-automation': "Génère un script Python utilisant pandas et openpyxl pour automatiser les tâches Excel. Inclus des exemples de traitement de données.",
            'game-script': "Génère un script de jeu vidéo avec PyGame ou selon la description. Inclus la logique de jeu, gestion des événements, et commentaires.",
            'ai-app': "Génère une application IA complète avec intégration OpenAI/autre service IA, interface utilisateur, et backend. Bien documenté.",
            'api': "Génère une API REST complète avec FastAPI, routes, modèles, gestion d'erreurs, et documentation."
        }
        
        guideline = type_guidelines.get(project_type, "Génère le code selon la description fournie.")
        
        prompt = f"""Tu es un expert développeur. Génère du code complet et fonctionnel pour le projet suivant.

Type de projet: {project_type}
Nom du projet: {name}
Description: {description}
{f'Stack technique demandée: {tech_stack}' if tech_stack else 'Tu choisis la stack technique appropriée.'}

Guidelines:
{guideline}

Règles importantes:
1. Le code doit être COMPLET et FONCTIONNEL (pas de TODO ou placeholders)
2. Ajoute des commentaires explicatifs en français
3. Suis les bonnes pratiques du langage
4. Limite à 5-8 fichiers maximum
5. Maximum 300 lignes par fichier
6. Inclus un README.md avec instructions

Réponds UNIQUEMENT avec un objet JSON valide suivant ce format exact:
{{
  "files": [
    {{
      "filename": "nom_fichier.ext",
      "language": "python|javascript|html|css|markdown",
      "content": "contenu complet du fichier"
    }}
  ],
  "tech_stack": ["technologie1", "technologie2"]
}}

Ne rajoute AUCUN texte avant ou après le JSON. Seulement le JSON pur."""
        
        return prompt
    
    def _parse_response(self, response: str) -> Dict[str, Any]:
        """Parse la réponse de l'IA et extrait le JSON"""
        try:
            # Nettoyer la réponse
            response = response.strip()
            
            # Chercher le JSON dans la réponse
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("Pas de JSON trouvé dans la réponse")
            
            json_str = response[start_idx:end_idx]
            result = json.loads(json_str)
            
            # Valider la structure
            if 'files' not in result or not isinstance(result['files'], list):
                raise ValueError("Structure JSON invalide: 'files' manquant ou invalide")
            
            if 'tech_stack' not in result:
                result['tech_stack'] = []
            
            # Valider chaque fichier
            for file in result['files']:
                if not all(k in file for k in ['filename', 'language', 'content']):
                    raise ValueError(f"Fichier invalide: {file}")
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            logger.error(f"Response was: {response[:500]}...")
            raise ValueError(f"Réponse JSON invalide de l'IA: {str(e)}")
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}")
            raise


# Instance globale
ai_generator = AICodeGenerator()
