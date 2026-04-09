"""IA service V2 isolated from the legacy assistant service."""

import os
from typing import Dict, Any, List


class AIAssistantV2Service:
    """Conversational V2 service that remains isolated from legacy flows."""

    def _normalize_history(self, history: Any) -> List[Dict[str, str]]:
        if not isinstance(history, list):
            return []

        normalized: List[Dict[str, str]] = []
        for item in history[-12:]:
            if not isinstance(item, dict):
                continue
            role = item.get("role", "user")
            content = item.get("content", "")
            if not isinstance(content, str) or not content.strip():
                continue
            normalized.append({"role": role, "content": content.strip()})
        return normalized

    def _capabilities_response(self) -> str:
        return (
            "Je suis Assistant IA N2 en mode parallele.\\n\\n"
            "Je peux t'aider a :\\n"
            "- clarifier une idee de projet\\n"
            "- proposer une architecture backend/frontend\\n"
            "- ecrire ou corriger du code\\n"
            "- decomposer un plan de livraison en etapes\\n"
            "- expliquer rapidement les choix techniques\\n\\n"
            "Donne-moi ton objectif (ex: \"creer une app React + FastAPI avec auth\") et je te reponds directement."
        )

    async def _llm_response(self, user_message: str, history: List[Dict[str, str]]) -> str:
        if not os.environ.get("OPENAI_API_KEY"):
            raise RuntimeError("OPENAI_API_KEY missing")

        from services.llm_service import llm_service

        messages: List[Dict[str, str]] = [
            {
                "role": "system",
                "content": (
                    "Tu es Assistant IA N2 de Dark Nexus. "
                    "Reponds en francais, concretement, avec un ton direct et utile. "
                    "Quand la demande est de dev, propose des actions executables en priorite."
                ),
            }
        ]

        for turn in history:
            role = turn.get("role", "user")
            if role not in {"user", "assistant", "system"}:
                role = "user"
            messages.append({"role": role, "content": turn["content"]})

        messages.append({"role": "user", "content": user_message})
        return await llm_service.chat(messages=messages, temperature=0.35)

    def _fallback_response(self, user_message: str, history: List[Dict[str, str]]) -> str:
        last_assistant = next((m["content"] for m in reversed(history) if m.get("role") == "assistant"), None)
        prefix = "Je prends ta demande N2. "
        if last_assistant:
            prefix += "Je garde le contexte de notre echange precedent. "

        return (
            f"{prefix}\\n\\n"
            f"Demande comprise : {user_message}\\n\\n"
            "Je peux maintenant te fournir :\\n"
            "1) un plan court en etapes\\n"
            "2) le code de depart\\n"
            "3) les commandes pour lancer/tester\\n\\n"
            "Dis-moi juste si tu veux un mode rapide (MVP) ou propre (production)."
        )

    async def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        user_message = str(payload.get("message", "")).strip()
        history = self._normalize_history(payload.get("conversation_history", []))

        if not user_message:
            return {
                "ok": False,
                "version": "v2",
                "response": "Envoie un message pour lancer la conversation N2.",
            }

        capability_tokens = [
            "capacite",
            "capacites",
            "tu fais quoi",
            "que peux",
            "quoi faire",
            "aide",
        ]
        lower_msg = user_message.lower()
        if any(token in lower_msg for token in capability_tokens):
            return {
                "ok": True,
                "version": "v2",
                "response": self._capabilities_response(),
                "mode": "capabilities",
            }

        try:
            reply = await self._llm_response(user_message, history)
            mode = "llm"
        except Exception:
            reply = self._fallback_response(user_message, history)
            mode = "fallback"

        return {
            "ok": True,
            "version": "v2",
            "response": reply,
            "mode": mode,
        }


ai_assistant_v2_service = AIAssistantV2Service()
