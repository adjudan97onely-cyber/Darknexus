"""
LLM SERVICE - Wrapper centralisé pour l'API OpenAI
Remplace emergentintegrations pour plus de flexibilité et de contrôle
"""

import os
import logging
from typing import List, Dict, Optional, Any
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


class LLMService:
    """Service pour interagir avec les modèles LLM (OpenAI)"""

    def __init__(self):
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = AsyncOpenAI(api_key=api_key)
        self.default_model = "gpt-4o"  # Modèle par défaut (à jour)

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """
        Envoie un message au modèle et retourne la réponse
        
        Args:
            messages: Liste de dicts avec 'role' et 'content'
            model: Modèle à utiliser (défaut: gpt-4o)
            temperature: Créativité (0-1)
            max_tokens: Limite la réponse
        
        Returns:
            str: Texte de la réponse
        """
        try:
            model = model or self.default_model
            
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"LLM Chat error: {str(e)}")
            raise

    async def chat_with_vision(
        self,
        text: str,
        images: List[str],  # Base64 encoded images
        model: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """
        Chat avec capacité vision (analyse d'images)
        
        Args:
            text: Prompt texte
            images: Liste d'images en base64
            model: Modèle vision (défaut: gpt-4-vision)
            temperature: Créativité
        
        Returns:
            str: Analyse textuelle des images
        """
        try:
            model = model or "gpt-4o"  # GPT-4 Vision
            
            # Construire les messages avec images
            content = [{"type": "text", "text": text}]
            
            for img_base64 in images[:3]:  # Max 3 images
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{img_base64}"
                    }
                })
            
            message = {
                "role": "user",
                "content": content
            }
            
            response = await self.client.chat.completions.create(
                model=model,
                messages=[message],
                temperature=temperature,
                max_tokens=2048
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Vision chat error: {str(e)}")
            raise

    async def chat_stream(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        **kwargs
    ):
        """
        Chat avec streaming (pour réponses longues)
        
        Yields:
            str: Chunks de texte au fur et à mesure
        """
        try:
            model = model or self.default_model
            
            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                stream=True,
                **kwargs
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"LLM Stream error: {str(e)}")
            raise


# Instance globale
llm_service = LLMService()
