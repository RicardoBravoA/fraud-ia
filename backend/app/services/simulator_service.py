"""Simulate incoming transactions — insert only, no LLM analysis."""

from dataclasses import asdict
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError
from app.domain.simulator_variations import (
    generate_varied_transaction,
    transaction_fingerprint,
    variation_metadata,
)
from app.models.schemas import (
    SimulatorInsertResultSchema,
    SimulatorScenarioSchema,
    SimulatorStatusSchema,
    SimulatorVariationSchema,
    TransactionSchema,
)
from app.repositories.mongo_repositories import AuditRepository, TransactionRepository

# Demo templates — each insert creates a new SIM-* row in MongoDB.
SIMULATOR_SCENARIOS: list[tuple[str, str, str]] = [
    ("T-1003", "Clean profile", "APPROVE"),
    ("T-1001", "Amount + unusual hours", "CHALLENGE"),
    ("T-1004", "Extreme amount spike", "BLOCK"),
    ("T-1005", "International + new device", "ESCALATE_TO_HUMAN"),
    ("T-1002", "High amount · late night", "CHALLENGE"),
]


class SimulatorService:
    def __init__(
        self,
        tx_repo: TransactionRepository,
        audit_repo: AuditRepository,
    ) -> None:
        self._tx_repo = tx_repo
        self._audit_repo = audit_repo

    async def list_scenarios(self) -> list[SimulatorScenarioSchema]:
        scenarios: list[SimulatorScenarioSchema] = []
        for template_id, label, expected in SIMULATOR_SCENARIOS:
            try:
                template = await self._tx_repo.get_by_id(template_id)
            except NotFoundError:
                continue
            runs = await self._tx_repo.count_simulated(template_id)
            meta = variation_metadata(template_id)
            scenarios.append(
                SimulatorScenarioSchema(
                    template_id=template_id,
                    label=label,
                    expected_decision=expected,
                    runs_count=runs,
                    last_simulated_id=await self._tx_repo.latest_simulated_id(template_id),
                    template=TransactionSchema(**asdict(template)),
                    variation=SimulatorVariationSchema(**meta),
                )
            )
        return scenarios

    async def get_status(self) -> SimulatorStatusSchema:
        scenarios = await self.list_scenarios()
        total_runs = sum(s.runs_count for s in scenarios)
        next_template = await self._peek_next_template()
        return SimulatorStatusSchema(
            total_scenarios=len(scenarios),
            total_simulated_runs=total_runs,
            next_template_id=next_template,
            auto_feed_order=[s.template_id for s in scenarios],
        )

    async def insert(self, template_id: str) -> SimulatorInsertResultSchema:
        """Insert a new SIM-* transaction. Analysis is a separate step (POST /evaluate)."""
        template = await self._tx_repo.get_by_id(template_id)
        forbidden = await self._tx_repo.list_simulated_fingerprints(template_id)
        sim_tx = generate_varied_transaction(
            template,
            template_id,
            forbidden_fingerprints=forbidden,
        )
        fingerprint = transaction_fingerprint(sim_tx)
        inserted_at = datetime.now(timezone.utc)
        await self._tx_repo.insert_simulated(
            sim_tx,
            template_id,
            variation_fingerprint=fingerprint,
        )

        await self._audit_repo.append(
            sim_tx.transaction_id,
            "TransactionIngress",
            "transaction_received",
            {
                "source_template": template_id,
                "amount": sim_tx.amount,
                "currency": sim_tx.currency,
                "channel": sim_tx.channel,
                "customer_id": sim_tx.customer_id,
                "timestamp": sim_tx.timestamp.isoformat(),
                "variation_fingerprint": fingerprint,
                "received_at": inserted_at.isoformat(),
                "message": "Transaction inserted — pending fraud analysis",
            },
        )

        return SimulatorInsertResultSchema(
            transaction_id=sim_tx.transaction_id,
            source_template=template_id,
            transaction=TransactionSchema(**asdict(sim_tx)),
            variation_fingerprint=fingerprint,
            inserted_at=inserted_at,
            message="Transaction inserted. Run Evaluate to trigger the LLM pipeline.",
        )

    async def insert_next(self) -> SimulatorInsertResultSchema:
        template_id = await self._peek_next_template()
        if not template_id:
            raise NotFoundError("SimulatorScenario", "next")
        return await self.insert(template_id)

    async def _peek_next_template(self) -> str | None:
        for template_id, _, _ in SIMULATOR_SCENARIOS:
            if await self._transaction_exists(template_id):
                return template_id
        return None

    async def _transaction_exists(self, transaction_id: str) -> bool:
        try:
            await self._tx_repo.get_by_id(transaction_id)
            return True
        except NotFoundError:
            return False
