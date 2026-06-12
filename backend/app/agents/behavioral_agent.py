"""Behavioral Pattern Agent — compare vs customer history."""

from datetime import datetime, timezone

from app.agents.base import BaseAgent
from app.domain.models import CustomerBehavior, Transaction
from app.orchestrator.state import FraudAnalysisState


class BehavioralAgent(BaseAgent):
    name = "BehavioralPatternAgent"

    async def run(self, state: FraudAnalysisState) -> FraudAnalysisState:
        tx = Transaction(**state["transaction"])
        behavior = CustomerBehavior(**state["customer_profile"])

        findings: list[str] = []
        if tx.amount > behavior.usual_amount_avg * 1.5:
            findings.append("Amount above typical customer pattern")
        hour = tx.timestamp.hour
        start, end = (int(p) for p in behavior.usual_hours.split("-"))
        if not (start <= hour <= end):
            findings.append("Operating outside usual hours")

        device_is_new = tx.device_id not in [
            d.strip() for d in behavior.usual_devices.split(",")
        ]

        trace = list(state.get("agent_trace", []))
        trace.append(
            {
                "agent_name": self.name,
                "findings": {"behavioral_flags": findings, "device_is_new": device_is_new},
                "confidence_delta": 0.1 if findings else 0.02,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        return {**state, "device_is_new": device_is_new, "agent_trace": trace}
