"""Integration tests for API endpoints."""

import pytest


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "transaction_id,expected_decision",
    [
        ("T-1003", "APPROVE"),
        ("T-1001", "CHALLENGE"),
        ("T-1004", "BLOCK"),
        ("T-1005", "ESCALATE_TO_HUMAN"),
    ],
    ids=["T-1003", "T-1001", "T-1004", "T-1005"],
)
async def test_evaluate_demo_decisions(seeded_client, transaction_id, expected_decision):
    response = await seeded_client.post(f"/api/transactions/{transaction_id}/evaluate")
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == expected_decision
    assert data["transaction_id"] == transaction_id
    assert len(data["agent_trace"]) >= 8
    assert data.get("transaction_context") is not None
    assert data["transaction_context"]["amount_ratio"] > 0


@pytest.mark.asyncio
async def test_get_evaluation_after_evaluate(seeded_client):
    await seeded_client.post("/api/transactions/T-1003/evaluate")
    response = await seeded_client.get("/api/evaluations/T-1003")
    assert response.status_code == 200
    assert response.json()["decision"] == "APPROVE"
