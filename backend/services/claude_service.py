"""Claude service dedicated to Assistant V2 routing."""

import os
from typing import Any, Dict, List, Optional

import anthropic


class ClaudeService:
    def __init__(self) -> None:
        self.api_key = os.environ.get("ANTHROPIC_API_KEY")
        self.client: Optional[anthropic.AsyncAnthropic] = None

    def _ensure_client(self) -> anthropic.AsyncAnthropic:
        if not self.api_key:
            raise RuntimeError("ANTHROPIC_API_KEY missing")
        if self.client is None:
            self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
        return self.client

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: str = "claude-3-sonnet-20240229",
        temperature: float = 0.35,
        max_tokens: int = 1400,
    ) -> str:
        client = self._ensure_client()

        system_parts: List[str] = []
        anthropic_messages: List[Dict[str, str]] = []

        for msg in messages:
            role = msg.get("role", "user")
            content = str(msg.get("content", ""))
            if not content:
                continue
            if role == "system":
                system_parts.append(content)
                continue
            if role not in {"user", "assistant"}:
                role = "user"
            anthropic_messages.append({"role": role, "content": content})

        if not anthropic_messages:
            anthropic_messages = [{"role": "user", "content": "Bonjour"}]

        response = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            system="\n\n".join(system_parts) if system_parts else None,
            messages=anthropic_messages,
        )

        parts = []
        for block in response.content:
            text = getattr(block, "text", None)
            if text:
                parts.append(text)

        return "\n".join(parts).strip() or "Claude a repondu sans contenu exploitable."


claude_service = ClaudeService()
