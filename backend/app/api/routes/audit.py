"""Audit trail routes."""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_audit_service
from app.models.schemas import AuditEventSchema
from app.services.fraud_service import AuditService

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/{transaction_id}", response_model=list[AuditEventSchema])
async def get_audit_trail(
    transaction_id: str,
    service: AuditService = Depends(get_audit_service),
) -> list[AuditEventSchema]:
    events = await service.get_trail(transaction_id)
    return [
        AuditEventSchema(
            transaction_id=e["transaction_id"],
            agent_name=e["agent_name"],
            action=e["action"],
            payload=e.get("payload", {}),
            timestamp=e["timestamp"],
        )
        for e in events
    ]
