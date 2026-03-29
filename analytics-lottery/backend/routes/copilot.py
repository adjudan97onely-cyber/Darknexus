"""
API ROUTE - Copilote Intelligent
Endpoint pour interagir avec le copilote intelligent de Dark Nexus AI
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
from services.intelligent_copilot import intelligent_copilot

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/copilot", tags=["copilot"])


class CopilotRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []


class CopilotResponse(BaseModel):
    response: str
    recommended_model: Optional[str] = None
    estimated_cost: Optional[float] = None
    project_description: Optional[str] = None
    project_name: Optional[str] = None
    stack: Optional[Dict[str, str]] = None


@router.post("/chat", response_model=CopilotResponse)
async def chat_with_copilot(request: CopilotRequest):
    """
    Discuter avec le copilote intelligent
    
    Le copilote :
    - Analyse les demandes
    - Recommande le meilleur modèle
    - Génère des descriptions optimales
    - Estime les coûts
    - Répond aux questions sur Dark Nexus AI
    """
    try:
        result = await intelligent_copilot.analyze_and_recommend(
            user_message=request.message,
            conversation_history=request.conversation_history
        )
        
        return CopilotResponse(**result)
        
    except Exception as e:
        logger.error(f"Erreur API copilote : {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur du copilote : {str(e)}"
        )


@router.get("/health")
async def copilot_health():
    """Check si le copilote est opérationnel"""
    return {
        "status": "operational",
        "copilot": "Dark Nexus AI Intelligent Copilot",
        "version": "1.0"
    }
