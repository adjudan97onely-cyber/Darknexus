"""
ROUTES POUR L'ASSISTANT IA
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_assistant import ai_assistant
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])


class ProjectIdeaRequest(BaseModel):
    user_input: str


class AnswersRequest(BaseModel):
    user_input: str
    answers: dict = {}


@router.post("/analyze")
async def analyze_project_idea(request: ProjectIdeaRequest):
    """
    Analyse l'idée de projet et demande des clarifications si nécessaire
    """
    try:
        result = await ai_assistant.analyze_project_idea(request.user_input)
        return result
    except Exception as e:
        logger.error(f"Error in analyze endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_description(request: AnswersRequest):
    """
    Génère une description complète du projet
    """
    try:
        result = await ai_assistant.generate_full_description(
            request.user_input,
            request.answers
        )
        return result
    except Exception as e:
        logger.error(f"Error in generate endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
