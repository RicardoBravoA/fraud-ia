"""Shared pipeline state for multi-agent orchestration."""

from typing import TypedDict


class FraudAnalysisState(TypedDict, total=False):
    transaction_id: str
    transaction: dict
    customer_profile: dict
    signals: list[str]
    internal_citations: list[dict]
    external_citations: list[dict]
    agent_trace: list[dict]
    debate: dict | None
    decision: str | None
    confidence: float
    explanation_customer: str
    explanation_audit: str
    matched_policies: list[str]
    matched_policy_details: list[dict]
    amount_ratio: float
    device_is_new: bool
