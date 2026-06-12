"""Pydantic API schemas (DTOs)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class InternalCitationSchema(BaseModel):
    policy_id: str
    chunk_id: str
    version: str
    rule: str = ""


class MatchedPolicySchema(BaseModel):
    policy_id: str
    title: str = ""
    rule: str
    version: str
    recommended_action: str
    triggered_by: list[str] = Field(default_factory=list)


class ExternalCitationSchema(BaseModel):
    url: str
    summary: str


class AgentTraceSchema(BaseModel):
    agent_name: str
    findings: dict
    confidence_delta: float
    timestamp: datetime


class EvaluationResultSchema(BaseModel):
    decision: Literal["APPROVE", "CHALLENGE", "BLOCK", "ESCALATE_TO_HUMAN"]
    confidence: float = Field(ge=0.0, le=1.0)
    signals: list[str]
    citations_internal: list[InternalCitationSchema]
    citations_external: list[ExternalCitationSchema]
    explanation_customer: str
    explanation_audit: str
    matched_policies: list[MatchedPolicySchema] = Field(default_factory=list)
    transaction_context: TransactionContextSchema | None = None
    agent_trace: list[AgentTraceSchema] = Field(default_factory=list)
    transaction_id: str | None = None


class TransactionSchema(BaseModel):
    transaction_id: str
    customer_id: str
    amount: float
    currency: str
    country: str
    channel: str
    device_id: str
    timestamp: datetime
    merchant_id: str
    evaluated: bool = False


class BulkEvaluateErrorSchema(BaseModel):
    transaction_id: str
    error: str


class BulkEvaluateResultSchema(BaseModel):
    evaluated_count: int
    skipped_count: int
    pending_before: int
    results: list[EvaluationResultSchema]
    errors: list[BulkEvaluateErrorSchema] = Field(default_factory=list)


class CustomerProfileSchema(BaseModel):
    customer_id: str
    usual_amount_avg: float
    usual_hours: str
    usual_countries: str
    usual_devices: str


class MerchantProfileSchema(BaseModel):
    merchant_id: str
    name: str
    category: str
    risk_level: str
    risk_reason: str | None = None


class TransactionContextSchema(BaseModel):
    transaction: TransactionSchema
    customer_profile: CustomerProfileSchema
    merchant: MerchantProfileSchema | None = None
    amount_ratio: float
    device_is_new: bool
    transaction_hour: int = Field(ge=0, le=23)
    customer_name: str | None = None
    device_label: str | None = None


class HitlCaseSchema(BaseModel):
    case_id: str
    transaction_id: str
    status: str
    decision_original: str
    confidence: float
    created_at: datetime
    resolved_at: datetime | None = None
    reviewer_note: str | None = None


class HitlResolveRequest(BaseModel):
    action: Literal["APPROVED", "REJECTED", "ESCALATED"]
    reviewer_note: str | None = None


class AuditEventSchema(BaseModel):
    transaction_id: str
    agent_name: str
    action: str
    payload: dict
    timestamp: datetime


class HealthSchema(BaseModel):
    status: str
    database: str


class SimulatorVariationSchema(BaseModel):
    amount_min: float | None = None
    amount_max: float | None = None
    hour_hint: str
    unique_fields: list[str] = Field(default_factory=list)


class SimulatorScenarioSchema(BaseModel):
    template_id: str
    label: str
    expected_decision: str
    runs_count: int
    last_simulated_id: str | None = None
    template: TransactionSchema
    variation: SimulatorVariationSchema


class SimulatorStatusSchema(BaseModel):
    total_scenarios: int
    total_simulated_runs: int
    next_template_id: str | None
    auto_feed_order: list[str]


class SimulatorInsertResultSchema(BaseModel):
    transaction_id: str
    source_template: str
    transaction: TransactionSchema
    variation_fingerprint: str
    inserted_at: datetime
    message: str
