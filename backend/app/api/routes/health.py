"""Health check route."""

from fastapi import APIRouter

from app.core.database import get_database
from app.models.schemas import HealthSchema

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthSchema)
async def health() -> HealthSchema:
    db_status = "ok"
    try:
        await get_database().command("ping")
    except Exception:
        db_status = "error"
    return HealthSchema(status="ok", database=db_status)
