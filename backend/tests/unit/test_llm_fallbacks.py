"""Unit tests for LLM fallbacks and agent resilience."""

import pytest
from pytest_mock import MockerFixture

from app.agents.explainability_agent import ExplainabilityAgent
from app.infrastructure.llm.client import LlmClientError
from app.infrastructure.llm.fallbacks import (
    fallback_audit_explanation,
    fallback_customer_explanation,
    fallback_debate_argument,
)


def test_fallback_debate_pro_fraud():
    text = fallback_debate_argument(
        "Pro-Fraud",
        {"signals": ["Monto fuera de rango"], "amount_ratio": 4.2, "merchant_name": "Shop"},
    )
    assert "risk" in text.lower()
    assert "4.2" in text


def test_fallback_customer_block():
    text = fallback_customer_explanation(
        {"decision": "BLOCK", "customer_name": "Ana"},
    )
    assert "Ana" in text
    assert "bloqueada" in text.lower()


def test_fallback_audit_mentions_route():
    text = fallback_audit_explanation(
        {"transaction_id": "T-1004", "decision": "BLOCK", "signals": ["Monto fuera de rango"]},
        "ContextAgent → ArbiterAgent",
        {"pro_fraud": "risky", "pro_customer": "ok"},
    )
    assert "T-1004" in text
    assert "ContextAgent" in text


@pytest.mark.asyncio
async def test_explainability_agent_uses_fallback_on_llm_timeout(mocker: MockerFixture):
    agent = ExplainabilityAgent()
    mocker.patch.object(
        agent._llm,
        "complete",
        side_effect=LlmClientError("Ollama timed out after 120s (3 attempts)"),
    )

    state = {
        "transaction": {
            "transaction_id": "T-1004",
            "customer_id": "C-001",
            "amount": 5000.0,
            "currency": "PEN",
            "country": "PE",
            "channel": "WEB",
            "device_id": "D-01",
            "timestamp": "2025-01-15T10:00:00",
            "merchant_id": "M-003",
        },
        "customer_profile": {
            "customer_id": "C-001",
            "usual_amount_avg": 200.0,
            "usual_hours": "09:00-18:00",
            "usual_countries": "PE",
            "usual_devices": "D-01",
        },
        "signals": ["Monto fuera de rango"],
        "internal_citations": [],
        "external_citations": [],
        "agent_trace": [{"agent_name": "ContextAgent", "findings": {}, "timestamp": "2025-01-01T00:00:00Z"}],
        "confidence": 0.9,
        "decision": "BLOCK",
        "matched_policy_details": [],
        "matched_policies": [],
        "amount_ratio": 25.0,
        "device_is_new": False,
        "debate": {"pro_fraud": "risk", "pro_customer": "legit"},
    }

    result = await agent.run(state)

    assert result["explanation_customer"]
    assert "fallback" in result["explanation_audit"].lower()
