"""HITL queue routes."""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_hitl_service
from app.models.schemas import HitlCaseSchema, HitlResolveRequest
from app.services.fraud_service import HitlService

router = APIRouter(prefix="/api/hitl", tags=["hitl"])


@router.get("/queue", response_model=list[HitlCaseSchema])
async def hitl_queue(
    service: HitlService = Depends(get_hitl_service),
) -> list[HitlCaseSchema]:
    cases = await service.list_queue()
    return [
        HitlCaseSchema(
            case_id=c["case_id"],
            transaction_id=c["transaction_id"],
            status=c["status"],
            decision_original=c["decision_original"],
            confidence=c["confidence"],
            created_at=c["created_at"],
            resolved_at=c.get("resolved_at"),
            reviewer_note=c.get("reviewer_note"),
        )
        for c in cases
    ]


@router.post("/{case_id}/resolve", response_model=HitlCaseSchema)
async def resolve_hitl_case(
    case_id: str,
    body: HitlResolveRequest,
    service: HitlService = Depends(get_hitl_service),
) -> HitlCaseSchema:
    case = await service.resolve(case_id, body.action, body.reviewer_note)
    return HitlCaseSchema(
        case_id=case["case_id"],
        transaction_id=case["transaction_id"],
        status=case["status"],
        decision_original=case["decision_original"],
        confidence=case["confidence"],
        created_at=case["created_at"],
        resolved_at=case.get("resolved_at"),
        reviewer_note=case.get("reviewer_note"),
    )
