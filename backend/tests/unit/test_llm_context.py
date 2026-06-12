"""Tests for LLM context builders and explanation sanitization."""

import pytest

from app.domain.llm_context import (
    build_llm_context,
    preliminary_decision_hint,
    sanitize_customer_explanation,
)
from app.orchestrator.pipeline import FraudPipeline
from tests.conftest import DEMO_BEHAVIORS, DEMO_TRANSACTIONS


def _behavior(customer_id: str):
    return next(b for b in DEMO_BEHAVIORS if b.customer_id == customer_id)


@pytest.mark.parametrize(
    "transaction_id,expected",
    [
        ("T-1003", "APPROVE"),
        ("T-1001", "CHALLENGE"),
        ("T-1004", "BLOCK"),
        ("T-1005", "ESCALATE_TO_HUMAN"),
    ],
)
def test_preliminary_decision_hint(transaction_id: str, expected: str):
    tx = next(t for t in DEMO_TRANSACTIONS if t.transaction_id == transaction_id)
    behavior = _behavior(tx.customer_id)
    from app.domain.signals import compute_signals, amount_ratio

    signals = compute_signals(tx, behavior)
    ratio = amount_ratio(tx, behavior)
    device_new = tx.device_id not in behavior.usual_devices.split(",")
    hint = preliminary_decision_hint(
        signals=signals,
        amount_ratio=ratio,
        device_new=device_new,
        matched_policy_ids=[],
        merchant_id=tx.merchant_id,
    )
    assert hint == expected


@pytest.mark.asyncio
async def test_build_llm_context_includes_customer_name():
    tx = next(t for t in DEMO_TRANSACTIONS if t.transaction_id == "T-1003")
    behavior = _behavior(tx.customer_id)
    result = await FraudPipeline().run(tx, behavior)
    # Rebuild minimal state from pipeline result for explainability-style context
    from dataclasses import asdict

    state = {
        "transaction": {**asdict(tx), "timestamp": tx.timestamp},
        "signals": result.signals,
        "amount_ratio": result.transaction_context.amount_ratio if result.transaction_context else 0,
        "device_is_new": result.transaction_context.device_is_new if result.transaction_context else False,
        "matched_policies": [p.policy_id for p in result.matched_policies],
        "matched_policy_details": [
            {
                "policy_id": p.policy_id,
                "title": p.title,
                "rule": p.rule,
                "version": p.version,
                "recommended_action": p.recommended_action,
                "triggered_by": p.triggered_by,
            }
            for p in result.matched_policies
        ],
        "decision": result.decision.value,
        "confidence": result.confidence,
    }
    ctx = build_llm_context(state)
    assert ctx["customer_name"] == "María López"
    assert ctx["decision"] == "APPROVE"


def test_sanitize_customer_explanation_replaces_placeholders():
    text = "Señor/a [Nombre], su transacción fue aprobada."
    assert "[Nombre]" not in sanitize_customer_explanation(text, "María López")
    assert "María López" in sanitize_customer_explanation(text, "María López")
