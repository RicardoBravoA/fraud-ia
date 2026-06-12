"""Integration tests for bulk evaluate pending transactions."""

import pytest


@pytest.mark.asyncio
async def test_evaluate_pending_all_demo_transactions(seeded_client):
    pending = await seeded_client.post("/api/transactions/evaluate-pending")
    assert pending.status_code == 200
    body = pending.json()
    assert body["pending_before"] == 5
    assert body["evaluated_count"] == 5
    assert len(body["results"]) == 5
    assert body["errors"] == []

    tx_list = await seeded_client.get("/api/transactions")
    assert all(tx["evaluated"] for tx in tx_list.json())


@pytest.mark.asyncio
async def test_evaluate_pending_skips_already_evaluated(seeded_client):
    await seeded_client.post("/api/transactions/T-1003/evaluate")

    pending = await seeded_client.post("/api/transactions/evaluate-pending")
    assert pending.status_code == 200
    body = pending.json()
    assert body["pending_before"] == 4
    assert body["evaluated_count"] == 4
    assert {r["transaction_id"] for r in body["results"]} == {
        "T-1001",
        "T-1002",
        "T-1004",
        "T-1005",
    }


@pytest.mark.asyncio
async def test_evaluate_pending_empty_when_all_done(seeded_client):
    await seeded_client.post("/api/transactions/evaluate-pending")

    again = await seeded_client.post("/api/transactions/evaluate-pending")
    assert again.status_code == 200
    body = again.json()
    assert body["pending_before"] == 0
    assert body["evaluated_count"] == 0
    assert body["results"] == []
