"""Integration tests for transaction ingress simulator (insert only)."""

import pytest


@pytest.mark.asyncio
async def test_list_simulator_scenarios(seeded_client):
    response = await seeded_client.get("/api/simulator/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 4
    assert data[0]["template_id"].startswith("T-")


@pytest.mark.asyncio
async def test_simulator_insert_without_evaluation(seeded_client):
    response = await seeded_client.post("/api/simulator/insert/T-1003")
    assert response.status_code == 200
    body = response.json()
    sim_id = body["transaction_id"]
    assert sim_id.startswith("SIM-T-1003-")
    assert body["source_template"] == "T-1003"
    assert "pending fraud analysis" in body["message"].lower() or "evaluate" in body["message"].lower()

    tx_list = await seeded_client.get("/api/transactions")
    assert sim_id in [t["transaction_id"] for t in tx_list.json()]

    eval_response = await seeded_client.get(f"/api/evaluations/{sim_id}")
    assert eval_response.status_code == 404

    audit = await seeded_client.get(f"/api/audit/{sim_id}")
    assert audit.status_code == 200
    actions = [e["action"] for e in audit.json()]
    assert "transaction_received" in actions
    assert "processing_started" not in actions


@pytest.mark.asyncio
async def test_insert_then_evaluate_calls_pipeline(seeded_client):
    insert = await seeded_client.post("/api/simulator/insert/T-1003")
    sim_id = insert.json()["transaction_id"]

    evaluate = await seeded_client.post(f"/api/transactions/{sim_id}/evaluate")
    assert evaluate.status_code == 200
    assert evaluate.json()["decision"] == "APPROVE"
    assert len(evaluate.json()["agent_trace"]) >= 8


@pytest.mark.asyncio
async def test_simulator_variations_are_not_identical(seeded_client):
    first = await seeded_client.post("/api/simulator/insert/T-1003")
    second = await seeded_client.post("/api/simulator/insert/T-1003")
    a = first.json()
    b = second.json()
    assert a["transaction_id"] != b["transaction_id"]
    assert a["transaction"]["amount"] != b["transaction"]["amount"]
