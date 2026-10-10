from abc import ABC, abstractmethod


class AIProvider(ABC):
    @abstractmethod
    async def reply(self, message: str, mode: str) -> str: ...


class MockAIProvider(AIProvider):
    async def reply(self, message: str, mode: str) -> str:
        return f"[{mode} tutor] Start by explaining what you expect this code to do, then test one small hypothesis."


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
