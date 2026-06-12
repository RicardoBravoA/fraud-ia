"""External Threat Intel Agent — governed web search."""

from datetime import datetime, timezone

from app.agents.base import BaseAgent
from app.domain.models import Transaction
from app.infrastructure.web_search.client import WebSearchClient
from app.orchestrator.state import FraudAnalysisState


class WebIntelAgent(BaseAgent):
    name = "ExternalThreatIntelAgent"

    def __init__(self, client: WebSearchClient | None = None) -> None:
        self._client = client or WebSearchClient()

    async def run(self, state: FraudAnalysisState) -> FraudAnalysisState:
        tx = Transaction(**state["transaction"])
        citations_raw = await self._client.search(tx.merchant_id, tx.country)

        trace = list(state.get("agent_trace", []))
        trace.append(
            {
                "agent_name": self.name,
                "findings": {"external_hits": len(citations_raw)},
                "confidence_delta": 0.08 if citations_raw else 0.0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        return {
            **state,
            "external_citations": [
                {"url": c.url, "summary": c.summary} for c in citations_raw
            ],
            "agent_trace": trace,
        }
