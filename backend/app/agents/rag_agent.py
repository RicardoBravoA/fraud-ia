"""Internal Policy RAG Agent — retrieve fraud policies."""

from datetime import datetime, timezone

from app.agents.base import BaseAgent
from app.domain.merchant_risk import is_high_risk_merchant
from app.domain.models import Transaction
from app.infrastructure.rag.policy_store import PolicyStore
from app.orchestrator.state import FraudAnalysisState


class RagAgent(BaseAgent):
    name = "InternalPolicyRagAgent"

    def __init__(self, policy_store: PolicyStore | None = None) -> None:
        self._store = policy_store or PolicyStore()

    async def run(self, state: FraudAnalysisState) -> FraudAnalysisState:
        signals = state.get("signals", [])
        tx = Transaction(**state["transaction"])
        device_new = state.get("device_is_new", False)
        amount_ratio = float(state.get("amount_ratio", 0.0))
        high_risk = is_high_risk_merchant(tx.merchant_id)

        matched_detail = self._store.match_policies(
            signals,
            tx.country,
            device_new,
            amount_ratio=amount_ratio,
            high_risk_merchant=high_risk,
        )
        matched_ids = [p.policy_id for p in matched_detail]
        citations = self._store.citations_for_matched(matched_detail)

        trace = list(state.get("agent_trace", []))
        trace.append(
            {
                "agent_name": self.name,
                "findings": {
                    "matched_policies": matched_ids,
                    "matched_policy_details": [
                        {
                            "policy_id": p.policy_id,
                            "title": p.title,
                            "rule": p.rule,
                            "version": p.version,
                            "recommended_action": p.recommended_action,
                            "triggered_by": p.triggered_by,
                        }
                        for p in matched_detail
                    ],
                },
                "confidence_delta": 0.12 if matched_ids else 0.03,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        return {
            **state,
            "internal_citations": [
                {
                    "policy_id": c.policy_id,
                    "chunk_id": c.chunk_id,
                    "version": c.version,
                    "rule": c.rule,
                }
                for c in citations
            ],
            "matched_policies": matched_ids,
            "matched_policy_details": [
                {
                    "policy_id": p.policy_id,
                    "title": p.title,
                    "rule": p.rule,
                    "version": p.version,
                    "recommended_action": p.recommended_action,
                    "triggered_by": p.triggered_by,
                }
                for p in matched_detail
            ],
            "agent_trace": trace,
        }
