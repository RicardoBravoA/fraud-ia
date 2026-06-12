"""Explainability Agent — customer and audit narratives via LLM."""

import logging
from datetime import datetime, timezone

from app.agents.base import BaseAgent
from app.domain.llm_context import build_llm_context, sanitize_customer_explanation
from app.infrastructure.llm.client import LlmClient, LlmClientError
from app.infrastructure.llm.fallbacks import (
    fallback_audit_explanation,
    fallback_customer_explanation,
)
from app.infrastructure.llm.prompts import (
    EXPLAIN_AUDIT_SYSTEM,
    EXPLAIN_CUSTOMER_SYSTEM,
    audit_explanation_prompt,
    customer_explanation_prompt,
)
from app.orchestrator.state import FraudAnalysisState

logger = logging.getLogger(__name__)


class ExplainabilityAgent(BaseAgent):
    name = "ExplainabilityAgent"

    def __init__(self, llm: LlmClient | None = None) -> None:
        self._llm = llm or LlmClient()

    async def run(self, state: FraudAnalysisState) -> FraudAnalysisState:
        ctx = build_llm_context(state)
        trace_names = [t["agent_name"] for t in state.get("agent_trace", [])]
        agent_route = " → ".join(trace_names) + " → Decision"
        debate = state.get("debate")

        try:
            raw_customer = await self._llm.complete(
                customer_explanation_prompt(ctx),
                system=EXPLAIN_CUSTOMER_SYSTEM,
            )
        except LlmClientError as exc:
            logger.warning("Customer explanation LLM failed: %s — using fallback", exc)
            raw_customer = fallback_customer_explanation(ctx)

        explanation_customer = sanitize_customer_explanation(
            raw_customer,
            ctx.get("customer_name"),
        )

        try:
            explanation_audit = await self._llm.complete(
                audit_explanation_prompt(ctx, agent_route, debate),
                system=EXPLAIN_AUDIT_SYSTEM,
            )
        except LlmClientError as exc:
            logger.warning("Audit explanation LLM failed: %s — using fallback", exc)
            explanation_audit = fallback_audit_explanation(ctx, agent_route, debate)

        trace = list(state.get("agent_trace", []))
        trace.append(
            {
                "agent_name": self.name,
                "findings": {"generated": True},
                "confidence_delta": 0.0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        return {
            **state,
            "explanation_customer": explanation_customer,
            "explanation_audit": explanation_audit,
            "agent_trace": trace,
        }
