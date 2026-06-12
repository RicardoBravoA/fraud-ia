"""Transaction ingress simulator — insert only."""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_simulator_service
from app.models.schemas import (
    SimulatorInsertResultSchema,
    SimulatorScenarioSchema,
    SimulatorStatusSchema,
)
from app.services.simulator_service import SimulatorService

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


@router.get("/scenarios", response_model=list[SimulatorScenarioSchema])
async def list_scenarios(
    service: SimulatorService = Depends(get_simulator_service),
) -> list[SimulatorScenarioSchema]:
    return await service.list_scenarios()


@router.get("/status", response_model=SimulatorStatusSchema)
async def simulator_status(
    service: SimulatorService = Depends(get_simulator_service),
) -> SimulatorStatusSchema:
    return await service.get_status()


@router.post("/insert/{template_id}", response_model=SimulatorInsertResultSchema)
async def insert_transaction(
    template_id: str,
    service: SimulatorService = Depends(get_simulator_service),
) -> SimulatorInsertResultSchema:
    """Insert a new SIM-* transaction. Does not call the LLM — use POST /evaluate after."""
    return await service.insert(template_id)


@router.post("/insert-next", response_model=SimulatorInsertResultSchema)
async def insert_next_transaction(
    service: SimulatorService = Depends(get_simulator_service),
) -> SimulatorInsertResultSchema:
    """Insert the next demo scenario as a new SIM-* transaction."""
    return await service.insert_next()
