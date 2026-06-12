"""Pure domain entities — no I/O dependencies."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class Decision(str, Enum):
    APPROVE = "APPROVE"
    CHALLENGE = "CHALLENGE"
    BLOCK = "BLOCK"
    ESCALATE_TO_HUMAN = "ESCALATE_TO_HUMAN"


class HitlStatus(str, Enum):
    PENDING = "PENDING"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ESCALATED = "ESCALATED"


@dataclass
class Transaction:
    transaction_id: str
    customer_id: str
    amount: float
    currency: str
    country: str
    channel: str
    device_id: str
    timestamp: datetime
    merchant_id: str


@dataclass
class CustomerBehavior:
    customer_id: str
    usual_amount_avg: float
    usual_hours: str
    usual_countries: str
    usual_devices: str


@dataclass
class MerchantProfile:
    merchant_id: str
    name: str
    category: str
    risk_level: str
    risk_reason: str | None = None


@dataclass
class TransactionContext:
    transaction: Transaction
    customer_profile: CustomerBehavior
    merchant: MerchantProfile | None
    amount_ratio: float
    device_is_new: bool
    transaction_hour: int
    customer_name: str | None = None
    device_label: str | None = None


@dataclass
class InternalCitation:
    policy_id: str
    chunk_id: str
    version: str
    rule: str = ""


@dataclass
class MatchedPolicy:
    policy_id: str
    title: str
    rule: str
    version: str
    recommended_action: str
    triggered_by: list[str]


@dataclass
class ExternalCitation:
    url: str
    summary: str


@dataclass
class AgentTraceEntry:
    agent_name: str
    findings: dict
    confidence_delta: float
    timestamp: datetime


@dataclass
class DebateResult:
    pro_fraud: str
    pro_customer: str


@dataclass
class EvaluationResult:
    transaction_id: str
    decision: Decision
    confidence: float
    signals: list[str]
    citations_internal: list[InternalCitation]
    citations_external: list[ExternalCitation]
    explanation_customer: str
    explanation_audit: str
    matched_policies: list[MatchedPolicy] = field(default_factory=list)
    transaction_context: TransactionContext | None = None
    agent_trace: list[AgentTraceEntry] = field(default_factory=list)
