"""Re-evaluate the four PDF demo transactions using the configured LLM."""

import asyncio

from app.core.config import get_settings
from app.core.database import close_db, connect_db, get_database
from app.orchestrator.pipeline import FraudPipeline
from app.repositories.mongo_repositories import (
    AuditRepository,
    EvaluationRepository,
    HitlRepository,
    TransactionRepository,
)
from app.services.fraud_service import FraudService

DEMO_IDS = ("T-1003", "T-1001", "T-1004", "T-1005")


async def run_reevaluate() -> None:
    settings = get_settings()
    print(f"LLM: provider={settings.llm_provider}, mock={settings.llm_mock}, model={settings.ollama_model}")

    await connect_db()
    db = get_database()
    service = FraudService(
        tx_repo=TransactionRepository(db),
        eval_repo=EvaluationRepository(db),
        audit_repo=AuditRepository(db),
        hitl_repo=HitlRepository(db),
        pipeline=FraudPipeline(),
    )

    for tx_id in DEMO_IDS:
        print(f"\n--- {tx_id} ---")
        result = await service.evaluate(tx_id)
        print(f"Decision: {result.decision}")
        print(f"Risk score: {result.confidence:.2f}")
        print(f"Customer: {result.explanation_customer[:140]}...")
        print(f"Audit: {result.explanation_audit[:140]}...")
        debate = next(
            (t for t in result.agent_trace if t.agent_name == "DebateAgents"),
            None,
        )
        if debate:
            findings = debate.findings
            print(f"Debate (fraud): {findings.get('pro_fraud', '')[:100]}...")
            print(f"Debate (customer): {findings.get('pro_customer', '')[:100]}...")

    print("\nAll demo evaluations saved to MongoDB.")


def main() -> None:
    asyncio.run(run_reevaluate())
    asyncio.run(close_db())


if __name__ == "__main__":
    main()
