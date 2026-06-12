"""Sequential multi-agent pipeline (LangGraph-style orchestration)."""

from dataclasses import asdict
from datetime import datetime

from app.agents.aggregation_agent import AggregationAgent
from app.agents.arbiter_agent import ArbiterAgent
from app.agents.behavioral_agent import BehavioralAgent
from app.agents.context_agent import ContextAgent
from app.agents.debate_agent import DebateAgent
from app.agents.explainability_agent import ExplainabilityAgent
from app.agents.rag_agent import RagAgent
from app.agents.web_intel_agent import WebIntelAgent
from app.domain.models import (
    AgentTraceEntry,
    CustomerBehavior,
    Decision,
    EvaluationResult,
    ExternalCitation,
    InternalCitation,
    MatchedPolicy,
    Transaction,
)
from app.domain.transaction_context import build_transaction_context
from app.orchestrator.state import FraudAnalysisState


class FraudPipeline:
    """Runs all agents in sequence — replace with LangGraph StateGraph when scaling."""

    def __init__(self) -> None:
        from app.infrastructure.llm.client import LlmClient

        llm = LlmClient()
        self._agents = [
            ContextAgent(),
            BehavioralAgent(),
            RagAgent(),
            WebIntelAgent(),
            AggregationAgent(),
            DebateAgent(llm=llm),
            ArbiterAgent(),
            ExplainabilityAgent(llm=llm),
        ]

    async def run(self, tx: Transaction, behavior: CustomerBehavior) -> EvaluationResult:
        state: FraudAnalysisState = {
            "transaction_id": tx.transaction_id,
            "transaction": asdict(tx),
            "customer_profile": asdict(behavior),
            "signals": [],
            "internal_citations": [],
            "external_citations": [],
            "agent_trace": [],
            "confidence": 0.0,
        }
        # Fix datetime serialization for agents
        state["transaction"]["timestamp"] = tx.timestamp

        for agent in self._agents:
            state = await agent.run(state)

        return self._to_result(tx, behavior, state)

    @staticmethod
    def _to_result(
        tx: Transaction, behavior: CustomerBehavior, state: FraudAnalysisState
    ) -> EvaluationResult:
        trace = [
            AgentTraceEntry(
                agent_name=t["agent_name"],
                findings=t.get("findings", {}),
                confidence_delta=t.get("confidence_delta", 0.0),
                timestamp=datetime.fromisoformat(t["timestamp"].replace("Z", "+00:00"))
                if isinstance(t["timestamp"], str)
                else t["timestamp"],
            )
            for t in state.get("agent_trace", [])
        ]
        context = build_transaction_context(
            tx,
            behavior,
            device_is_new=bool(state.get("device_is_new", False)),
        )
        return EvaluationResult(
            transaction_id=tx.transaction_id,
            decision=Decision(state.get("decision", "APPROVE")),
            confidence=float(state.get("confidence", 0.0)),
            signals=state.get("signals", []),
            citations_internal=[
                InternalCitation(**c) for c in state.get("internal_citations", [])
            ],
            citations_external=[
                ExternalCitation(**c) for c in state.get("external_citations", [])
            ],
            explanation_customer=state.get("explanation_customer", ""),
            explanation_audit=state.get("explanation_audit", ""),
            matched_policies=[
                MatchedPolicy(**p) for p in state.get("matched_policy_details", [])
            ],
            transaction_context=context,
            agent_trace=trace,
        )
