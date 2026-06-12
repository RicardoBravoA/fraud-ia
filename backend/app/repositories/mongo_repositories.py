"""MongoDB repositories — data access only."""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

SIMULATED_TX_PREFIX = "SIM-"

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import NotFoundError
from app.domain.models import (
    CustomerBehavior,
    Decision,
    EvaluationResult,
    HitlStatus,
    MerchantProfile,
    Transaction,
)
from app.domain.transaction_context import transaction_context_to_dict


def _parse_dt(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    raise ValueError(f"Invalid datetime: {value}")


class TransactionRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db.transactions
        self._behaviors = db.customer_behaviors

    async def list_all(self) -> list[Transaction]:
        cursor = self._col.find({}).sort("transaction_id", 1)
        return [self._to_transaction(doc) async for doc in cursor]

    async def get_by_id(self, transaction_id: str) -> Transaction:
        doc = await self._col.find_one({"transaction_id": transaction_id})
        if not doc:
            raise NotFoundError("Transaction", transaction_id)
        return self._to_transaction(doc)

    async def get_behavior(self, customer_id: str) -> CustomerBehavior:
        doc = await self._behaviors.find_one({"customer_id": customer_id})
        if not doc:
            raise NotFoundError("CustomerBehavior", customer_id)
        return CustomerBehavior(
            customer_id=doc["customer_id"],
            usual_amount_avg=float(doc["usual_amount_avg"]),
            usual_hours=doc["usual_hours"],
            usual_countries=doc["usual_countries"],
            usual_devices=doc["usual_devices"],
        )

    async def upsert_transaction(self, tx: Transaction) -> None:
        doc = self._transaction_doc(tx)
        await self._col.update_one(
            {"transaction_id": tx.transaction_id},
            {"$set": doc},
            upsert=True,
        )

    async def insert_simulated(
        self,
        sim_tx: Transaction,
        source_template_id: str,
        *,
        variation_fingerprint: str,
    ) -> Transaction:
        """Persist a generated SIM-* transaction."""
        doc = self._transaction_doc(sim_tx)
        doc["source_template"] = source_template_id
        doc["simulated"] = True
        doc["variation_fingerprint"] = variation_fingerprint
        doc["ingested_at"] = datetime.now(timezone.utc)
        await self._col.insert_one(doc)
        return sim_tx

    async def list_simulated_fingerprints(self, source_template_id: str) -> set[str]:
        cursor = self._col.find(
            {"source_template": source_template_id, "variation_fingerprint": {"$exists": True}},
            {"variation_fingerprint": 1},
        )
        return {doc["variation_fingerprint"] async for doc in cursor}

    async def count_simulated(self, source_template_id: str) -> int:
        return await self._col.count_documents({"source_template": source_template_id})

    async def latest_simulated_id(self, source_template_id: str) -> str | None:
        doc = await self._col.find_one(
            {"source_template": source_template_id},
            {"transaction_id": 1},
            sort=[("ingested_at", -1)],
        )
        return doc["transaction_id"] if doc else None

    @staticmethod
    def _transaction_doc(tx: Transaction) -> dict:
        return {
            "transaction_id": tx.transaction_id,
            "customer_id": tx.customer_id,
            "amount": tx.amount,
            "currency": tx.currency,
            "country": tx.country,
            "channel": tx.channel,
            "device_id": tx.device_id,
            "timestamp": tx.timestamp,
            "merchant_id": tx.merchant_id,
        }

    async def upsert_behavior(self, behavior: CustomerBehavior) -> None:
        doc = {
            "customer_id": behavior.customer_id,
            "usual_amount_avg": behavior.usual_amount_avg,
            "usual_hours": behavior.usual_hours,
            "usual_countries": behavior.usual_countries,
            "usual_devices": behavior.usual_devices,
        }
        await self._behaviors.update_one(
            {"customer_id": behavior.customer_id},
            {"$set": doc},
            upsert=True,
        )

    @staticmethod
    def _to_transaction(doc: dict) -> Transaction:
        return Transaction(
            transaction_id=doc["transaction_id"],
            customer_id=doc["customer_id"],
            amount=float(doc["amount"]),
            currency=doc["currency"],
            country=doc["country"],
            channel=doc["channel"],
            device_id=doc["device_id"],
            timestamp=_parse_dt(doc["timestamp"]),
            merchant_id=doc["merchant_id"],
        )


class EvaluationRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db.evaluations

    async def save(self, result: EvaluationResult) -> None:
        doc = {
            "transaction_id": result.transaction_id,
            "decision": result.decision.value,
            "confidence": result.confidence,
            "signals": result.signals,
            "citations_internal": [
                {
                    "policy_id": c.policy_id,
                    "chunk_id": c.chunk_id,
                    "version": c.version,
                    "rule": c.rule,
                }
                for c in result.citations_internal
            ],
            "citations_external": [
                {"url": c.url, "summary": c.summary} for c in result.citations_external
            ],
            "explanation_customer": result.explanation_customer,
            "explanation_audit": result.explanation_audit,
            "matched_policies": [
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
            "transaction_context": (
                transaction_context_to_dict(result.transaction_context)
                if result.transaction_context
                else None
            ),
            "agent_trace": [
                {
                    "agent_name": t.agent_name,
                    "findings": t.findings,
                    "confidence_delta": t.confidence_delta,
                    "timestamp": t.timestamp,
                }
                for t in result.agent_trace
            ],
            "created_at": datetime.now(timezone.utc),
        }
        await self._col.update_one(
            {"transaction_id": result.transaction_id},
            {"$set": doc},
            upsert=True,
        )

    async def get_by_transaction_id(self, transaction_id: str) -> dict:
        doc = await self._col.find_one({"transaction_id": transaction_id})
        if not doc:
            raise NotFoundError("Evaluation", transaction_id)
        return doc

    async def has_evaluation(self, transaction_id: str) -> bool:
        doc = await self._col.find_one(
            {"transaction_id": transaction_id},
            {"_id": 1},
        )
        return doc is not None

    async def list_evaluated_ids(self) -> list[str]:
        cursor = self._col.find({}, {"transaction_id": 1})
        return [doc["transaction_id"] async for doc in cursor]


class MerchantRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db.merchants

    async def upsert(self, merchant: MerchantProfile) -> None:
        doc = {
            "merchant_id": merchant.merchant_id,
            "name": merchant.name,
            "category": merchant.category,
            "risk_level": merchant.risk_level,
            "risk_reason": merchant.risk_reason,
        }
        await self._col.update_one(
            {"merchant_id": merchant.merchant_id},
            {"$set": doc},
            upsert=True,
        )


class AuditRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db.audit_events

    async def append(
        self,
        transaction_id: str,
        agent_name: str,
        action: str,
        payload: dict,
    ) -> None:
        await self._col.insert_one(
            {
                "transaction_id": transaction_id,
                "agent_name": agent_name,
                "action": action,
                "payload": payload,
                "timestamp": datetime.now(timezone.utc),
            }
        )

    async def list_by_transaction(self, transaction_id: str) -> list[dict]:
        cursor = self._col.find({"transaction_id": transaction_id}).sort("timestamp", 1)
        return [doc async for doc in cursor]


class HitlRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db.hitl_cases

    async def create_case(
        self,
        transaction_id: str,
        decision: Decision,
        confidence: float,
    ) -> str:
        case_id = f"HITL-{uuid4().hex[:8].upper()}"
        await self._col.insert_one(
            {
                "case_id": case_id,
                "transaction_id": transaction_id,
                "status": HitlStatus.PENDING.value,
                "decision_original": decision.value,
                "confidence": confidence,
                "created_at": datetime.now(timezone.utc),
                "resolved_at": None,
                "reviewer_note": None,
            }
        )
        return case_id

    async def list_queue(self) -> list[dict]:
        cursor = self._col.find(
            {"status": {"$in": [HitlStatus.PENDING.value, HitlStatus.IN_REVIEW.value]}}
        ).sort("created_at", 1)
        return [doc async for doc in cursor]

    async def resolve(
        self,
        case_id: str,
        action: str,
        reviewer_note: str | None,
    ) -> dict:
        doc = await self._col.find_one({"case_id": case_id})
        if not doc:
            raise NotFoundError("HitlCase", case_id)
        status_map = {
            "APPROVED": HitlStatus.APPROVED.value,
            "REJECTED": HitlStatus.REJECTED.value,
            "ESCALATED": HitlStatus.ESCALATED.value,
        }
        new_status = status_map.get(action, HitlStatus.IN_REVIEW.value)
        await self._col.update_one(
            {"case_id": case_id},
            {
                "$set": {
                    "status": new_status,
                    "resolved_at": datetime.now(timezone.utc),
                    "reviewer_note": reviewer_note,
                }
            },
        )
        updated = await self._col.find_one({"case_id": case_id})
        assert updated is not None
        return updated
