"""Gemini service dedicated to Assistant V2 routing."""

import asyncio
import os
from typing import Any, Dict, List

import google.generativeai as genai


class GeminiService:
    def __init__(self) -> None:
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self._configured = False

    def _ensure_configured(self) -> None:
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY missing")
        if not self._configured:
            genai.configure(api_key=self.api_key)
            self._configured = True

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: str = "gemini-pro",
        temperature: float = 0.35,
        max_tokens: int = 1400,
    ) -> str:
        self._ensure_configured()

        prompt_lines: List[str] = []
        for msg in messages:
            role = msg.get("role", "user")
            content = str(msg.get("content", ""))
            if not content:
                continue
            prompt_lines.append(f"[{role.upper()}] {content}")

        if not prompt_lines:
            prompt_lines = ["[USER] Bonjour"]

        prompt = "\n\n".join(prompt_lines)

        candidate_models = [model, "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"]
        last_error = None

        def _generate(target_model: str) -> str:
            llm = genai.GenerativeModel(target_model)
            response = llm.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
            text = getattr(response, "text", "")
            return (text or "").strip()

        for candidate in candidate_models:
            try:
                text = await asyncio.to_thread(_generate, candidate)
                if text:
                    return text
            except Exception as err:
                last_error = err

        try:
            available = await asyncio.to_thread(genai.list_models)
            dynamic_candidates = []
            for mdl in available:
                methods = getattr(mdl, "supported_generation_methods", []) or []
                name = getattr(mdl, "name", "")
                if "generateContent" in methods and name.startswith("models/"):
                    dynamic_candidates.append(name.replace("models/", ""))

            for candidate in dynamic_candidates[:5]:
                try:
                    text = await asyncio.to_thread(_generate, candidate)
                    if text:
                        return text
                except Exception as err:
                    last_error = err
        except Exception as err:
            last_error = err

        if last_error:
            raise last_error

        return "Gemini a repondu sans contenu exploitable."


gemini_service = GeminiService()
