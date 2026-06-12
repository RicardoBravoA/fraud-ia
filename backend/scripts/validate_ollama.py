"""Validate local Ollama setup and run a sample pipeline evaluation."""

import asyncio
import sys

import httpx

from app.core.config import get_settings
from app.infrastructure.llm.client import LlmClient, LlmClientError
from app.orchestrator.pipeline import FraudPipeline
from tests.conftest import DEMO_BEHAVIORS, DEMO_TRANSACTIONS


def check_ollama_running() -> list[str]:
    settings = get_settings()
    url = f"{settings.ollama_base_url.rstrip('/')}/api/tags"
    response = httpx.get(url, timeout=5.0)
    response.raise_for_status()
    return [m.get("name", "") for m in response.json().get("models", [])]


async def main() -> int:
    settings = get_settings()
    print(f"LLM provider: {settings.llm_provider} (mock={settings.llm_mock})")
    print(f"Ollama URL:   {settings.ollama_base_url}")
    print(f"Ollama model: {settings.ollama_model}")

    if settings.llm_mock:
        print("\nERROR: LLM_MOCK=true — set LLM_MOCK=false in .env to use Ollama.")
        return 1

    try:
        models = check_ollama_running()
    except httpx.HTTPError as exc:
        print(f"\nERROR: Ollama not reachable — start with: ollama serve\n  ({exc})")
        return 1

    prefix = settings.ollama_model.split(":")[0]
    if not any(m == settings.ollama_model or m.startswith(f"{prefix}:") for m in models):
        print(f"\nERROR: Model '{settings.ollama_model}' not found.")
        print(f"Available: {', '.join(models) or '(none)'}")
        print(f"Pull with: ollama pull {settings.ollama_model}")
        return 1

    print("\n1/2 Testing LLM completion...")
    try:
        reply = await LlmClient().complete("Reply with one short sentence confirming you are ready.")
        print(f"   OK: {reply[:120]}")
    except LlmClientError as exc:
        print(f"   FAIL: {exc}")
        return 1

    print("\n2/2 Running pipeline for T-1003 (APPROVE)...")
    tx = next(t for t in DEMO_TRANSACTIONS if t.transaction_id == "T-1003")
    behavior = next(b for b in DEMO_BEHAVIORS if b.customer_id == tx.customer_id)
    result = await FraudPipeline().run(tx, behavior)
    print(f"   Decision: {result.decision.value}")
    print(f"   Risk score: {result.confidence:.2f}")
    print(f"   Customer explanation: {result.explanation_customer[:160]}...")
    print(f"   Audit explanation: {result.explanation_audit[:160]}...")
    print("\nOllama integration OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
