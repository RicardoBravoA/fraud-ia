"""Transaction routes."""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_fraud_service
from app.models.schemas import BulkEvaluateResultSchema, EvaluationResultSchema, TransactionSchema
from app.services.fraud_service import FraudService

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionSchema])
async def list_transactions(
    service: FraudService = Depends(get_fraud_service),
) -> list[TransactionSchema]:
    return await service.list_transactions()


@router.post("/evaluate-pending", response_model=BulkEvaluateResultSchema)
async def evaluate_pending_transactions(
    service: FraudService = Depends(get_fraud_service),
) -> BulkEvaluateResultSchema:
    return await service.evaluate_pending()


@router.post("/{transaction_id}/evaluate", response_model=EvaluationResultSchema)
async def evaluate_transaction(
    transaction_id: str,
    service: FraudService = Depends(get_fraud_service),
) -> EvaluationResultSchema:
    return await service.evaluate(transaction_id)
