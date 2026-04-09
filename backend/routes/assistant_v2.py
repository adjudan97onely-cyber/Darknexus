from fastapi import APIRouter, Body
from typing import Any, Dict

from services.ai_service_v2 import ai_assistant_v2_service

router = APIRouter()


@router.post("/assistant-v2")
async def assistant_v2(payload: Dict[str, Any] = Body(default_factory=dict)):
    return await ai_assistant_v2_service.run(payload)
