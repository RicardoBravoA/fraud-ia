"""Debate Agents — Pro-Fraud vs Pro-Customer."""

import logging
from datetime import datetime, timezone

from app.agents.base import BaseAgent
from app.domain.llm_context import build_llm_context
from app.infrastructure.llm.client import LlmClient, LlmClientError
from app.infrastructure.llm.fallbacks import fallback_debate_argument
from app.infrastructure.llm.prompts import DEBATE_SYSTEM, debate_prompt
from app.orchestrator.state import FraudAnalysisState

logger = logging.getLogger(__name__)


class DebateAgent(BaseAgent):
    name = "DebateAgents"

    def __init__(self, llm: LlmClient | None = None) -> None:
        self._llm = llm or LlmClient()

    async def _debate_argument(self, role: str, ctx: dict) -> str:
        try:
            return await self._llm.complete(
                debate_prompt(role, ctx),
                system=DEBATE_SYSTEM,
            )
        except LlmClientError as exc:
            logger.warning("Debate LLM failed for %s: %s — using fallback", role, exc)
            return fallback_debate_argument(role, ctx)

    async def run(self, state: FraudAnalysisState) -> FraudAnalysisState:
        ctx = build_llm_context(state)
        pro_fraud = await self._debate_argument("Pro-Fraud", ctx)
        pro_customer = await self._debate_argument("Pro-Customer", ctx)

        trace = list(state.get("agent_trace", []))
        trace.append(
            {
                "agent_name": self.name,
                "findings": {
                    "pro_fraud": pro_fraud,
                    "pro_customer": pro_customer,
                    "preliminary_decision": ctx["preliminary_decision"],
                },
                "confidence_delta": 0.05,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        return {
            **state,
            "debate": {"pro_fraud": pro_fraud, "pro_customer": pro_customer},
            "agent_trace": trace,
        }
