"""
SHIM/WRAPPER for emergentintegrations
Maps old API to OpenAI SDK for backward compatibility
This is a migration bridge - services should be updated to use openai directly
"""

from openai import AsyncOpenAI
import logging

logger = logging.getLogger(__name__)


class UserMessage:
    """Simulates emergentintegrations UserMessage"""
    def __init__(self, text: str = None, content: str = None):
        self.text = text or content
        self.content = text or content


class LlmChat:
    """Simulates emergentintegrations LlmChat - maps to OpenAI SDK"""
    
    def __init__(self, api_key: str = None, session_id: str = None, system_message: str = None):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message or "You are a helpful AI assistant."
        self.model = "gpt-4o"  # Default model
        self.provider = "openai"
        self.client = AsyncOpenAI(api_key=api_key) if api_key else None
    
    def with_model(self, provider: str, model: str):
        """Set the provider and model"""
        self.provider = provider
        # Map any model name to gpt-4o (most compatible)
        self.model = "gpt-4o"
        return self
    
    async def send_message(self, message: UserMessage):
        """Send a message and get response (maps to OpenAI)"""
        if not self.client:
            raise ValueError("API key not provided to LlmChat")
        
        try:
            messages = [
                {"role": "system", "content": self.system_message},
                {"role": "user", "content": message.text or message.content}
            ]
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7
            )
            
            # Return response wrapped in message format
            response_text = response.choices[0].message.content
            
            # Create a response object with .text and .content attributes
            class Response:
                def __init__(self, text):
                    self.text = text
                    self.content = text
                
                def __str__(self):
                    return self.text
            
            return Response(response_text)
            
        except Exception as e:
            logger.error(f"Error in LlmChat.send_message: {str(e)}")
            raise
    
    async def chat(self, messages: list, model: str = None, temperature: float = 0.7, **kwargs):
        """Alternative API - maps to OpenAI chat completions"""
        if not self.client:
            raise ValueError("API key not provided to LlmChat")
        
        try:
            # Convert messages if they're UserMessage objects
            converted_messages = []
            for msg in messages:
                if isinstance(msg, UserMessage):
                    converted_messages.append({"role": "user", "content": msg.text or msg.content})
                elif isinstance(msg, dict):
                    converted_messages.append(msg)
                else:
                    converted_messages.append({"role": "user", "content": str(msg)})
            
            response = await self.client.chat.completions.create(
                model=model or self.model,
                messages=converted_messages,
                temperature=temperature,
                **kwargs
            )
            
            response_text = response.choices[0].message.content
            
            # Return wrapped response
            class Response:
                def __init__(self, text):
                    self.text = text
                    self.content = text
                
                def __str__(self):
                    return self.text
            
            return Response(response_text)
            
        except Exception as e:
            logger.error(f"Error in LlmChat.chat: {str(e)}")
            raise
