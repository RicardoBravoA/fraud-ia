"""MongoDB connection lifecycle."""

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import OperationFailure

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_database() -> AsyncIOMotorDatabase:
    settings = get_settings()
    return get_client()[settings.mongodb_db_name]


async def connect_db() -> None:
    db = get_database()
    await db.command("ping")
    await _ensure_indexes(db)


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


async def _safe_create_index(collection, keys, **kwargs) -> None:
    """Create index idempotently; ignore if an equivalent index already exists."""
    try:
        await collection.create_index(keys, **kwargs)
    except OperationFailure as exc:
        # 85 IndexOptionsConflict, 86 IndexKeySpecsConflict — index already present
        if exc.code not in (85, 86):
            raise
        logger.debug("Index already exists on %s: %s", collection.name, kwargs.get("name", keys))


async def _ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create indexes idempotently on startup (matches data/mongo-init.js names)."""
    await _safe_create_index(
        db.transactions, "transaction_id", unique=True, name="idx_transaction_id"
    )
    await _safe_create_index(
        db.transactions, "customer_id", name="idx_customer_id"
    )
    await _safe_create_index(
        db.customer_behaviors, "customer_id", unique=True, name="idx_customer_id"
    )
    await _safe_create_index(
        db.evaluations, "transaction_id", unique=True, name="idx_evaluation_transaction_id"
    )
    await _safe_create_index(
        db.evaluations,
        [("decision", 1), ("created_at", -1)],
        name="idx_decision_created",
    )
    await _safe_create_index(
        db.audit_events,
        [("transaction_id", 1), ("timestamp", -1)],
        name="idx_tx_timestamp",
    )
    await _safe_create_index(
        db.audit_events, "agent_name", name="idx_agent_name"
    )
    await _safe_create_index(
        db.hitl_cases, "case_id", unique=True, name="idx_case_id"
    )
    await _safe_create_index(
        db.hitl_cases,
        [("status", 1), ("created_at", -1)],
        name="idx_status_created",
    )
    await _safe_create_index(
        db.hitl_cases, "transaction_id", name="idx_hitl_transaction_id"
    )
