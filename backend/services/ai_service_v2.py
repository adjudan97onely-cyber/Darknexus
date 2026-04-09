"""IA service V2 isolated from the legacy assistant service."""

from typing import Dict, Any


class AIAssistantV2Service:
    """Minimal V2 service placeholder to avoid impacting existing flows."""

    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "ok": True,
            "version": "v2",
            "message": "Assistant V2 ready",
            "payload": payload,
        }


ai_assistant_v2_service = AIAssistantV2Service()
