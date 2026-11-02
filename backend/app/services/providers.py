from abc import ABC, abstractmethod

import httpx

from app.config import get_settings


class AIProviderError(RuntimeError):
    """Raised when the configured AI provider cannot answer a request."""


class AIProvider(ABC):
    @abstractmethod
    async def reply(
        self,
        message: str,
        mode: str,
        history: list[dict[str, str]] | None = None,
        context: str | None = None,
    ) -> str: ...


class MockAIProvider(AIProvider):
    async def reply(
        self,
        message: str,
        mode: str,
        history: list[dict[str, str]] | None = None,
        context: str | None = None,
    ) -> str:
        return (
            f"[{mode} tutor] Start by explaining what you expect this code to do, "
            "then test one small hypothesis."
        )


class OpenAICompatibleProvider(AIProvider):
    async def reply(
        self,
        message: str,
        mode: str,
        history: list[dict[str, str]] | None = None,
        context: str | None = None,
    ) -> str:
        settings = get_settings()
        if not settings.ai_api_key:
            raise AIProviderError(
                "AI provider credentials are not configured. Set AI_API_KEY or use AI_PROVIDER=mock."
            )

        system = (
            "You are a patient Python learning assistant. Use a Socratic teaching style "
            "when possible, explain errors clearly, and prefer hints over complete solutions. "
            f"Current interaction mode: {mode}."
        )
        if context:
            system += f"\n\nLesson or exercise context:\n{context}"
        messages = [{"role": "system", "content": system}]
        messages.extend(history or [])
        messages.append({"role": "user", "content": message})

        try:
            async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
                response = await client.post(
                    f"{settings.ai_base_url.rstrip('/')}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.ai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={"model": settings.ai_model, "messages": messages, "temperature": 0.3},
                )
            response.raise_for_status()
            payload = response.json()
            content = payload["choices"][0]["message"]["content"]
            if not isinstance(content, str) or not content.strip():
                raise AIProviderError("The AI provider returned an empty response.")
            return content.strip()
        except AIProviderError:
            raise
        except httpx.TimeoutException as exc:
            raise AIProviderError("The AI provider timed out. Please try again.") from exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429:
                raise AIProviderError("The AI provider rate limit was reached. Please try again later.") from exc
            raise AIProviderError("The AI provider rejected the request.") from exc
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            raise AIProviderError("The AI provider is temporarily unavailable.") from exc


def get_ai_provider() -> AIProvider:
    if get_settings().ai_provider == "mock":
        return MockAIProvider()
    return OpenAICompatibleProvider()


class SpeechProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio: bytes) -> str: ...

    @abstractmethod
    async def synthesize(self, text: str) -> bytes: ...


class MockSpeechProvider(SpeechProvider):
    async def transcribe(self, audio: bytes) -> str:
        return ""

    async def synthesize(self, text: str) -> bytes:
        return text.encode()
