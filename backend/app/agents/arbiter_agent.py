"""Decision Arbiter Agent — final decision and risk score (confidence field)."""

from datetime import datetime, timezone

from app.agents.base import BaseAgent
from app.domain.merchant_risk import is_high_risk_merchant
from app.domain.models import Decision, Transaction
from app.domain.risk_score import compute_risk_score, finalize_risk_score
from app.orchestrator.state import FraudAnalysisState


class ArbiterAgent(BaseAgent):
    name = "DecisionArbiterAgent"

    async def run(self, state: FraudAnalysisState) -> FraudAnalysisState:
        tx = Transaction(**state["transaction"])
        signals = state.get("signals", [])
        ratio = state.get("amount_ratio", 0.0)
        device_new = state.get("device_is_new", False)
        matched = state.get("matched_policies", [])

        high_risk = is_high_risk_merchant(tx.merchant_id)
        decision = Decision.APPROVE

        if "País no habitual" in signals and device_new:
            decision = Decision.ESCALATE_TO_HUMAN
        elif ratio > 10:
            decision = Decision.BLOCK
        elif high_risk and ratio > 3:
            decision = Decision.BLOCK
        elif "Monto fuera de rango" in signals and "Horario no habitual" in signals:
            decision = Decision.CHALLENGE
        elif signals:
            decision = Decision.CHALLENGE

        if "FP-02" in matched:
            decision = Decision.ESCALATE_TO_HUMAN

        raw_risk = compute_risk_score(
            signals=signals,
            amount_ratio=ratio,
            device_new=device_new,
            matched_policies=matched,
            external_hits=len(state.get("external_citations", [])),
            high_risk_merchant=high_risk,
        )
        risk_score = finalize_risk_score(decision, raw_risk, has_signals=bool(signals))

        trace = list(state.get("agent_trace", []))
        trace.append(
            {
                "agent_name": self.name,
                "findings": {
                    "decision": decision.value,
                    "confidence": risk_score,
                    "raw_risk_score": raw_risk,
                },
                "confidence_delta": 0.0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        return {
            **state,
            "decision": decision.value,
            "confidence": risk_score,
            "agent_trace": trace,
        }
