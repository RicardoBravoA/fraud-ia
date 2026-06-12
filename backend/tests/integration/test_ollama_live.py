"""Live Ollama integration — skipped unless OLLAMA_LIVE_TEST=1."""

import os

import httpx
import pytest

from app.core.config import get_settings
from app.infrastructure.llm.client import LlmClient
from app.orchestrator.pipeline import FraudPipeline
from tests.conftest import DEMO_BEHAVIORS, DEMO_TRANSACTIONS


def _ollama_available() -> bool:
    if os.getenv("OLLAMA_LIVE_TEST") != "1":
        return False
    settings = get_settings()
    try:
        response = httpx.get(
            f"{settings.ollama_base_url.rstrip('/')}/api/tags",
            timeout=3.0,
        )
        if response.status_code != 200:
            return False
        models = [m.get("name", "") for m in response.json().get("models", [])]
        prefix = settings.ollama_model.split(":")[0]
        return any(m == settings.ollama_model or m.startswith(f"{prefix}:") for m in models)
    except httpx.HTTPError:
        return False


@pytest.fixture(autouse=True)
def enable_live_llm(monkeypatch, request):
    if request.node.get_closest_marker("ollama_live"):
        monkeypatch.setenv("LLM_MOCK", "false")
        monkeypatch.setenv("LLM_PROVIDER", "ollama")
        get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.ollama_live
@pytest.mark.skipif(
    not _ollama_available(),
    reason="Set OLLAMA_LIVE_TEST=1 and run Ollama with the configured model",
)
@pytest.mark.asyncio
async def test_ollama_complete():
    text = await LlmClient().complete("Reply with exactly: OK", system="Be brief")
    assert len(text) > 0


@pytest.mark.ollama_live
@pytest.mark.skipif(
    not _ollama_available(),
    reason="Set OLLAMA_LIVE_TEST=1 and run Ollama with the configured model",
)
@pytest.mark.asyncio
async def test_pipeline_generates_llm_explanations():
    tx = next(t for t in DEMO_TRANSACTIONS if t.transaction_id == "T-1003")
    behavior = next(b for b in DEMO_BEHAVIORS if b.customer_id == tx.customer_id)
    result = await FraudPipeline().run(tx, behavior)

    assert result.decision.value == "APPROVE"
    assert len(result.explanation_customer) > 20
    assert len(result.explanation_audit) > 20
    debate = next(t for t in result.agent_trace if t.agent_name == "DebateAgents")
    assert len(debate.findings.get("pro_fraud", "")) > 10
    assert len(debate.findings.get("pro_customer", "")) > 10
