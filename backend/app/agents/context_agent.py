"""Transaction Context Agent — internal signal analysis."""

from datetime import datetime, timezone

from app.agents.base import BaseAgent
from app.domain.models import CustomerBehavior, Transaction
from app.domain.signals import amount_ratio, compute_signals
from app.orchestrator.state import FraudAnalysisState


class ContextAgent(BaseAgent):
    name = "TransactionContextAgent"

    async def run(self, state: FraudAnalysisState) -> FraudAnalysisState:
        tx = Transaction(**state["transaction"])
        behavior = CustomerBehavior(**state["customer_profile"])
        signals = compute_signals(tx, behavior)
        ratio = amount_ratio(tx, behavior)

        trace = list(state.get("agent_trace", []))
        trace.append(
            {
                "agent_name": self.name,
                "findings": {"signals": signals, "amount_ratio": ratio},
                "confidence_delta": 0.15 if signals else 0.05,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        return {
            **state,
            "signals": signals,
            "amount_ratio": ratio,
            "agent_trace": trace,
        }
