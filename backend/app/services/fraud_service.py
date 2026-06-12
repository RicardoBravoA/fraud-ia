"""Application services — use cases."""

from dataclasses import asdict

from app.core.config import get_settings
from app.core.exceptions import NotFoundError
from app.domain.models import Decision
from app.domain.transaction_context import (
    build_transaction_context,
    transaction_context_to_dict,
)
from app.models.schemas import (
    BulkEvaluateErrorSchema,
    BulkEvaluateResultSchema,
    EvaluationResultSchema,
    MatchedPolicySchema,
    TransactionContextSchema,
    TransactionSchema,
)
from app.orchestrator.pipeline import FraudPipeline
from app.repositories.mongo_repositories import (
    AuditRepository,
    EvaluationRepository,
    HitlRepository,
    TransactionRepository,
)


class FraudService:
    def __init__(
        self,
        tx_repo: TransactionRepository,
        eval_repo: EvaluationRepository,
        audit_repo: AuditRepository,
        hitl_repo: HitlRepository,
        pipeline: FraudPipeline | None = None,
    ) -> None:
        self._tx_repo = tx_repo
        self._eval_repo = eval_repo
        self._audit_repo = audit_repo
        self._hitl_repo = hitl_repo
        self._pipeline = pipeline or FraudPipeline()

    async def list_transactions(self) -> list[TransactionSchema]:
        txs = await self._tx_repo.list_all()
        evaluated_ids = set(await self._eval_repo.list_evaluated_ids())
        return [
            TransactionSchema(**asdict(tx), evaluated=tx.transaction_id in evaluated_ids)
            for tx in txs
        ]

    async def list_pending_ids(self) -> list[str]:
        evaluated_ids = set(await self._eval_repo.list_evaluated_ids())
        txs = await self._tx_repo.list_all()
        return [tx.transaction_id for tx in txs if tx.transaction_id not in evaluated_ids]

    async def evaluate_pending(self) -> BulkEvaluateResultSchema:
        pending_ids = await self.list_pending_ids()
        results: list[EvaluationResultSchema] = []
        errors: list[BulkEvaluateErrorSchema] = []

        for transaction_id in pending_ids:
            try:
                results.append(await self.evaluate(transaction_id))
            except Exception as exc:  # noqa: BLE001 — collect per-tx failures for bulk response
                errors.append(BulkEvaluateErrorSchema(transaction_id=transaction_id, error=str(exc)))

        return BulkEvaluateResultSchema(
            evaluated_count=len(results),
            skipped_count=0,
            pending_before=len(pending_ids),
            results=results,
            errors=errors,
        )

    async def evaluate(self, transaction_id: str) -> EvaluationResultSchema:
        tx = await self._tx_repo.get_by_id(transaction_id)
        behavior = await self._tx_repo.get_behavior(tx.customer_id)
        result = await self._pipeline.run(tx, behavior)

        await self._eval_repo.save(result)
        for entry in result.agent_trace:
            await self._audit_repo.append(
                transaction_id,
                entry.agent_name,
                "agent_completed",
                {"findings": entry.findings, "confidence_delta": entry.confidence_delta},
            )

        settings = get_settings()
        if (
            result.decision == Decision.ESCALATE_TO_HUMAN
            or result.confidence >= settings.hitl_confidence_threshold
        ):
            case_id = await self._hitl_repo.create_case(
                transaction_id, result.decision, result.confidence
            )
            await self._audit_repo.append(
                transaction_id,
                "HITL",
                "case_created",
                {"case_id": case_id},
            )

        return self._to_schema(result)

    async def get_evaluation(self, transaction_id: str) -> EvaluationResultSchema:
        doc = await self._eval_repo.get_by_transaction_id(transaction_id)
        transaction_context = doc.get("transaction_context")
        if transaction_context:
            transaction_context = TransactionContextSchema(**transaction_context)
        else:
            transaction_context = await self._hydrate_transaction_context(transaction_id)
        return EvaluationResultSchema(
            transaction_id=doc["transaction_id"],
            decision=doc["decision"],
            confidence=doc["confidence"],
            signals=doc["signals"],
            citations_internal=doc["citations_internal"],
            citations_external=doc["citations_external"],
            explanation_customer=doc["explanation_customer"],
            explanation_audit=doc["explanation_audit"],
            matched_policies=_matched_policies_from_doc(doc),
            transaction_context=transaction_context,
            agent_trace=doc.get("agent_trace", []),
        )

    async def _hydrate_transaction_context(
        self, transaction_id: str
    ) -> TransactionContextSchema | None:
        try:
            tx = await self._tx_repo.get_by_id(transaction_id)
            behavior = await self._tx_repo.get_behavior(tx.customer_id)
        except NotFoundError:
            return None

        usual_devices = [d.strip() for d in behavior.usual_devices.split(",")]
        context = build_transaction_context(
            tx,
            behavior,
            device_is_new=tx.device_id not in usual_devices,
        )
        return TransactionContextSchema(**transaction_context_to_dict(context))

    @staticmethod
    def _to_schema(result) -> EvaluationResultSchema:
        return EvaluationResultSchema(
            transaction_id=result.transaction_id,
            decision=result.decision.value,
            confidence=result.confidence,
            signals=result.signals,
            citations_internal=[
                {
                    "policy_id": c.policy_id,
                    "chunk_id": c.chunk_id,
                    "version": c.version,
                    "rule": c.rule,
                }
                for c in result.citations_internal
            ],
            citations_external=[
                {"url": c.url, "summary": c.summary} for c in result.citations_external
            ],
            explanation_customer=result.explanation_customer,
            explanation_audit=result.explanation_audit,
            matched_policies=[
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
            transaction_context=(
                TransactionContextSchema(**transaction_context_to_dict(result.transaction_context))
                if result.transaction_context
                else None
            ),
            agent_trace=[
                {
                    "agent_name": t.agent_name,
                    "findings": t.findings,
                    "confidence_delta": t.confidence_delta,
                    "timestamp": t.timestamp,
                }
                for t in result.agent_trace
            ],
        )


def _matched_policies_from_doc(doc: dict) -> list[MatchedPolicySchema]:
    if doc.get("matched_policies"):
        return [MatchedPolicySchema(**p) for p in doc["matched_policies"]]

    for entry in reversed(doc.get("agent_trace", [])):
        if entry.get("agent_name") != "InternalPolicyRagAgent":
            continue
        details = entry.get("findings", {}).get("matched_policy_details")
        if details:
            return [MatchedPolicySchema(**p) for p in details]

    return []


class HitlService:
    def __init__(
        self,
        hitl_repo: HitlRepository,
        audit_repo: AuditRepository,
    ) -> None:
        self._hitl_repo = hitl_repo
        self._audit_repo = audit_repo

    async def list_queue(self) -> list[dict]:
        return await self._hitl_repo.list_queue()

    async def resolve(self, case_id: str, action: str, note: str | None) -> dict:
        case = await self._hitl_repo.resolve(case_id, action, note)
        await self._audit_repo.append(
            case["transaction_id"],
            "HITL",
            "case_resolved",
            {"case_id": case_id, "action": action, "note": note},
        )
        return case


class AuditService:
    def __init__(self, audit_repo: AuditRepository) -> None:
        self._audit_repo = audit_repo

    async def get_trail(self, transaction_id: str) -> list[dict]:
        events = await self._audit_repo.list_by_transaction(transaction_id)
        if not events:
            raise NotFoundError("AuditTrail", transaction_id)
        return events
