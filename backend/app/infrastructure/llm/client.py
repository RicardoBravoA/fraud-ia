"""LLM client — mock (tests), Ollama (local), or Azure OpenAI (cloud)."""

import asyncio
import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

OLLAMA_GENERATION_OPTIONS = {
    "num_predict": 256,
    "temperature": 0.2,
}


class LlmClientError(Exception):
    """Raised when the configured LLM provider cannot complete a request."""


class LlmClient:
    async def complete(self, prompt: str, *, system: str | None = None) -> str:
        settings = get_settings()
        if settings.llm_mock:
            return self._mock_response(prompt)

        provider = settings.llm_provider.lower()
        if provider == "ollama":
            return await self._complete_ollama(prompt, system=system)
        if provider == "azure":
            return await self._complete_azure(prompt, system=system)

        raise LlmClientError(f"Unsupported LLM provider: {settings.llm_provider}")

    async def _complete_ollama(self, prompt: str, *, system: str | None) -> str:
        settings = get_settings()
        url = f"{settings.ollama_base_url.rstrip('/')}/api/chat"
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": settings.ollama_model,
            "messages": messages,
            "stream": False,
            "keep_alive": "30m",
            "options": OLLAMA_GENERATION_OPTIONS,
        }

        timeout = httpx.Timeout(
            connect=10.0,
            read=settings.llm_timeout_seconds,
            write=10.0,
            pool=10.0,
        )
        max_attempts = settings.llm_max_retries + 1
        last_timeout: httpx.TimeoutException | None = None

        for attempt in range(1, max_attempts + 1):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(url, json=payload)
                    response.raise_for_status()
                break
            except httpx.ConnectError as exc:
                raise LlmClientError(
                    f"Cannot reach Ollama at {settings.ollama_base_url}. "
                    "Start it with: ollama serve"
                ) from exc
            except httpx.HTTPStatusError as exc:
                detail = exc.response.text[:300]
                if exc.response.status_code == 404 and "model" in detail.lower():
                    raise LlmClientError(
                        f"Ollama model '{settings.ollama_model}' not found. "
                        f"Pull it with: ollama pull {settings.ollama_model}"
                    ) from exc
                raise LlmClientError(
                    f"Ollama request failed ({exc.response.status_code}): {detail}"
                ) from exc
            except httpx.TimeoutException as exc:
                last_timeout = exc
                if attempt < max_attempts:
                    delay = min(2 ** (attempt - 1), 8)
                    logger.warning(
                        "Ollama timeout on attempt %s/%s; retrying in %ss",
                        attempt,
                        max_attempts,
                        delay,
                    )
                    await asyncio.sleep(delay)
                    continue
                raise LlmClientError(
                    f"Ollama timed out after {settings.llm_timeout_seconds}s "
                    f"({max_attempts} attempts)"
                ) from last_timeout

        data = response.json()
        content = (data.get("message") or {}).get("content", "").strip()
        if not content:
            raise LlmClientError("Ollama returned an empty response")
        return content

    async def _complete_azure(self, prompt: str, *, system: str | None) -> str:
        settings = get_settings()
        if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
            raise LlmClientError(
                "Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY."
            )
        raise NotImplementedError("Azure OpenAI integration not implemented yet")

    @staticmethod
    def _mock_response(prompt: str) -> str:
        lower = prompt.lower()
        if "role: pro-fraud" in lower:
            return (
                "The amount ratio and timing deviate sharply from this customer's profile, "
                "supporting elevated fraud concern."
            )
        if "role: pro-customer" in lower:
            return (
                "The customer has a plausible spending pattern on this channel and merchant; "
                "the activity may still be legitimate."
            )
        if "task: customer explanation" in lower:
            if "final decision: approve" in lower:
                return (
                    "Estimado/a cliente, su transacción fue aprobada porque no se detectaron "
                    "señales de riesgo relevantes en el análisis."
                )
            if "final decision: challenge" in lower:
                return (
                    "Estimado/a cliente, su transacción requiere verificación adicional debido "
                    "a un monto o horario fuera de su patrón habitual."
                )
            if "final decision: block" in lower:
                return (
                    "Estimado/a cliente, su transacción fue bloqueada por un monto "
                    "significativamente superior a su comportamiento habitual."
                )
            if "final decision: escalate_to_human" in lower:
                return (
                    "Estimado/a cliente, su transacción fue derivada a un especialista porque "
                    "se realizó desde un país y dispositivo no habituales."
                )
            return (
                "Su transacción fue revisada. Según el análisis, se requiere "
                "validación adicional por señales atípicas detectadas."
            )
        if "task: audit explanation" in lower:
            return (
                "Matched policies and signals were applied per the arbiter rules. "
                "The multi-agent route completed with documented evidence and debate input."
            )
        return "Analysis completed based on available signals and policies."
