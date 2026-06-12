"""Evaluation routes."""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_fraud_service
from app.models.schemas import EvaluationResultSchema
from app.services.fraud_service import FraudService

router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])


@router.get("/{transaction_id}", response_model=EvaluationResultSchema)
async def get_evaluation(
    transaction_id: str,
    service: FraudService = Depends(get_fraud_service),
) -> EvaluationResultSchema:
    return await service.get_evaluation(transaction_id)
