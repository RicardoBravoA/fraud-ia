"""Pytest fixtures."""

import os
from datetime import datetime

import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.core.config import get_settings
from app.domain.models import CustomerBehavior, Transaction
from app.main import create_app
from app.repositories.mongo_repositories import TransactionRepository


@pytest.fixture(autouse=True)
def force_llm_mock(monkeypatch):
    """Tests must not depend on a running Ollama instance."""
    if os.getenv("OLLAMA_LIVE_TEST") == "1":
        yield
        get_settings.cache_clear()
        return
    monkeypatch.setenv("LLM_MOCK", "true")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()

DEMO_BEHAVIORS = [
    CustomerBehavior(
        customer_id="CU-001",
        usual_amount_avg=500.0,
        usual_hours="08-20",
        usual_countries="PE",
        usual_devices="D-01",
    ),
    CustomerBehavior(
        customer_id="CU-002",
        usual_amount_avg=1200.0,
        usual_hours="09-22",
        usual_countries="PE",
        usual_devices="D-02",
    ),
    CustomerBehavior(
        customer_id="CU-003",
        usual_amount_avg=800.0,
        usual_hours="10-18",
        usual_countries="PE",
        usual_devices="D-03",
    ),
]

DEMO_TRANSACTIONS = [
    Transaction(
        transaction_id="T-1001",
        customer_id="CU-001",
        amount=1800.0,
        currency="PEN",
        country="PE",
        channel="web",
        device_id="D-01",
        timestamp=datetime(2025, 12, 17, 3, 15, 0),
        merchant_id="M-001",
    ),
    Transaction(
        transaction_id="T-1002",
        customer_id="CU-002",
        amount=9500.0,
        currency="PEN",
        country="PE",
        channel="mobile",
        device_id="D-02",
        timestamp=datetime(2025, 12, 17, 23, 45, 0),
        merchant_id="M-002",
    ),
    Transaction(
        transaction_id="T-1003",
        customer_id="CU-001",
        amount=450.0,
        currency="PEN",
        country="PE",
        channel="web",
        device_id="D-01",
        timestamp=datetime(2025, 12, 17, 10, 0, 0),
        merchant_id="M-001",
    ),
    Transaction(
        transaction_id="T-1004",
        customer_id="CU-002",
        amount=50000.0,
        currency="PEN",
        country="PE",
        channel="mobile",
        device_id="D-02",
        timestamp=datetime(2025, 12, 17, 23, 50, 0),
        merchant_id="M-003",
    ),
    Transaction(
        transaction_id="T-1005",
        customer_id="CU-003",
        amount=2000.0,
        currency="USD",
        country="US",
        channel="web",
        device_id="D-99",
        timestamp=datetime(2025, 12, 17, 14, 0, 0),
        merchant_id="M-004",
    ),
]


@pytest.fixture
def mock_mongo_client():
    return AsyncMongoMockClient()


@pytest.fixture
def mock_db(mock_mongo_client):
    return mock_mongo_client["fraud_detection_test"]


@pytest.fixture
async def app(mock_mongo_client, mock_db, monkeypatch):
    monkeypatch.setattr("app.core.database._client", mock_mongo_client)
    monkeypatch.setattr("app.core.database.get_database", lambda: mock_db)
    monkeypatch.setattr("app.core.dependencies.get_database", lambda: mock_db)

    async def _connect():
        return None

    async def _close():
        return None

    monkeypatch.setattr("app.core.database.connect_db", _connect)
    monkeypatch.setattr("app.core.database.close_db", _close)

    return create_app()


@pytest.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def seeded_client(client, mock_db):
    repo = TransactionRepository(mock_db)
    for tx in DEMO_TRANSACTIONS:
        await repo.upsert_transaction(tx)
    for behavior in DEMO_BEHAVIORS:
        await repo.upsert_behavior(behavior)
    return client
