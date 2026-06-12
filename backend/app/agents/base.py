"""Base agent interface."""

from abc import ABC, abstractmethod

from app.orchestrator.state import FraudAnalysisState


class BaseAgent(ABC):
    name: str

    @abstractmethod
    async def run(self, state: FraudAnalysisState) -> FraudAnalysisState:
        """Process state and return updated state."""
