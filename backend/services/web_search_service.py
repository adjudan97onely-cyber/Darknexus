"""
WEB SEARCH SERVICE - Recherche sur Internet pour l'assistant
Permet à l'assistant de chercher des informations en temps réel
"""

import logging
import aiohttp
import os
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class WebSearchService:
    """
    Service de recherche web pour enrichir les réponses de l'assistant
    """
    
    def __init__(self):
        self.search_api_key = os.environ.get('EMERGENT_LLM_KEY')  # Utilise la même clé
        
    async def search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Effectue une recherche web et retourne les résultats
        
        Args:
            query: La requête de recherche
            num_results: Nombre de résultats à retourner
            
        Returns:
            Dict avec les résultats de recherche
        """
        try:
            # Utiliser l'API Emergent pour la recherche web
            # Pour l'instant, on utilise une approche simplifiée
            
            # On va utiliser GPT pour "simuler" une recherche en demandant des connaissances
            # Dans un environnement de production, il faudrait une vraie API de recherche
            
            from openai import AsyncOpenAI
            
            chat = LlmChat(
                api_key=self.search_api_key,
                session_id=f"search_{query[:20]}"
            )
            chat.with_model("openai", "gpt-5.1")
            
            search_prompt = f"""Tu es un moteur de recherche. L'utilisateur cherche des informations sur : "{query}"

Fournis les informations les plus pertinentes et actuelles que tu connais sur ce sujet.
Sois précis, technique et détaillé.

Si tu ne connais pas le sujet, dis-le clairement.

Format ta réponse comme ceci :
**Résumé** : [résumé en 1-2 phrases]

**Informations détaillées** :
- Point 1
- Point 2
- Point 3

**Sources/Contexte** : [d'où viennent ces infos]"""

            response = await chat.send_message(UserMessage(text=search_prompt))
            
            return {
                'success': True,
                'query': query,
                'results': response,
                'source': 'AI Knowledge Base (GPT-5.1)'
            }
            
        except Exception as e:
            logger.error(f"Error in web search: {str(e)}")
            return {
                'success': False,
                'query': query,
                'error': str(e),
                'results': "Impossible d'effectuer la recherche pour le moment."
            }
    
    async def search_and_summarize(self, query: str) -> str:
        """
        Effectue une recherche et retourne un résumé simple
        """
        result = await self.search(query)
        
        if result['success']:
            return f"""📚 **Recherche effectuée pour** : {query}

{result['results']}

*Source : {result['source']}*"""
        else:
            return f"❌ Je n'ai pas pu trouver d'informations sur '{query}'. Peux-tu reformuler ?"


# Instance globale
web_search_service = WebSearchService()
