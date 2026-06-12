"""Validate the four PDF demo decisions through the pipeline."""

import pytest

from app.orchestrator.pipeline import FraudPipeline
from tests.conftest import DEMO_BEHAVIORS, DEMO_TRANSACTIONS

DEMO_EXPECTED = {
    "T-1001": "CHALLENGE",
    "T-1003": "APPROVE",
    "T-1004": "BLOCK",
    "T-1005": "ESCALATE_TO_HUMAN",
}


def _behavior_for(customer_id: str):
    return next(b for b in DEMO_BEHAVIORS if b.customer_id == customer_id)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "transaction_id,expected",
    list(DEMO_EXPECTED.items()),
    ids=list(DEMO_EXPECTED.keys()),
)
async def test_demo_decision(transaction_id: str, expected: str):
    tx = next(t for t in DEMO_TRANSACTIONS if t.transaction_id == transaction_id)
    behavior = _behavior_for(tx.customer_id)
    result = await FraudPipeline().run(tx, behavior)
    assert result.decision.value == expected


@pytest.mark.asyncio
async def test_demo_matched_policies_align_with_decision():
    """RAG matched policies must not over-report BLOCK rules on CHALLENGE cases."""
    tx = next(t for t in DEMO_TRANSACTIONS if t.transaction_id == "T-1001")
    behavior = _behavior_for(tx.customer_id)
    result = await FraudPipeline().run(tx, behavior)

    assert result.decision.value == "CHALLENGE"
    policy_ids = {p.policy_id for p in result.matched_policies}
    assert policy_ids == {"FP-01"}
    assert "FP-03" not in policy_ids
    assert "FP-04" not in policy_ids


@pytest.mark.asyncio
async def test_demo_risk_score_ordering():
    """Higher risk score should correlate with stricter demo outcomes."""
    pipeline = FraudPipeline()
    scores: dict[str, float] = {}

    for tx in DEMO_TRANSACTIONS:
        if tx.transaction_id not in DEMO_EXPECTED:
            continue
        behavior = _behavior_for(tx.customer_id)
        result = await pipeline.run(tx, behavior)
        scores[tx.transaction_id] = result.confidence

    assert scores["T-1003"] < scores["T-1005"]
    assert scores["T-1003"] < scores["T-1001"]
    assert scores["T-1004"] > scores["T-1001"]
    assert scores["T-1003"] <= 0.30
    assert scores["T-1004"] >= 0.85
