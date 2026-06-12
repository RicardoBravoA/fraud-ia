"""FastAPI dependency injection."""

from app.core.database import get_database
from app.orchestrator.pipeline import FraudPipeline
from app.repositories.mongo_repositories import (
    AuditRepository,
    EvaluationRepository,
    HitlRepository,
    TransactionRepository,
)
from app.services.fraud_service import AuditService, FraudService, HitlService
from app.services.simulator_service import SimulatorService


def get_fraud_service() -> FraudService:
    db = get_database()
    return FraudService(
        tx_repo=TransactionRepository(db),
        eval_repo=EvaluationRepository(db),
        audit_repo=AuditRepository(db),
        hitl_repo=HitlRepository(db),
        pipeline=FraudPipeline(),
    )


def get_hitl_service() -> HitlService:
    db = get_database()
    return HitlService(
        hitl_repo=HitlRepository(db),
        audit_repo=AuditRepository(db),
    )


def get_audit_service() -> AuditService:
    return AuditService(AuditRepository(get_database()))


def get_simulator_service() -> SimulatorService:
    db = get_database()
    return SimulatorService(
        tx_repo=TransactionRepository(db),
        audit_repo=AuditRepository(db),
    )
