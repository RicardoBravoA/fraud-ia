"""Evidence Aggregation Agent — consolidate all signals and evidence."""

from datetime import datetime, timezone

from app.agents.base import BaseAgent
from app.orchestrator.state import FraudAnalysisState


class AggregationAgent(BaseAgent):
    name = "EvidenceAggregationAgent"

    async def run(self, state: FraudAnalysisState) -> FraudAnalysisState:
        aggregated = {
            "signals": state.get("signals", []),
            "internal": state.get("internal_citations", []),
            "external": state.get("external_citations", []),
            "matched_policies": state.get("matched_policies", []),
        }
        trace = list(state.get("agent_trace", []))
        trace.append(
            {
                "agent_name": self.name,
                "findings": aggregated,
                "confidence_delta": 0.0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        return {**state, "agent_trace": trace}
