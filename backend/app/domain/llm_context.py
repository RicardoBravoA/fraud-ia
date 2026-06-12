"""Shared context for LLM-backed agents (debate, explainability)."""

from app.domain.merchant_risk import is_high_risk_merchant
from app.domain.models import Transaction
from app.infrastructure.customers.customer_store import CustomerStore
from app.infrastructure.merchants.merchant_store import MerchantStore
from app.orchestrator.state import FraudAnalysisState


def preliminary_decision_hint(
    *,
    signals: list[str],
    amount_ratio: float,
    device_new: bool,
    matched_policy_ids: list[str],
    merchant_id: str,
) -> str:
    """Mirror arbiter rules for debate context (runs before final decision)."""
    high_risk = is_high_risk_merchant(merchant_id)

    if "País no habitual" in signals and device_new:
        return "ESCALATE_TO_HUMAN"
    if amount_ratio > 10:
        return "BLOCK"
    if high_risk and amount_ratio > 3:
        return "BLOCK"
    if "Monto fuera de rango" in signals and "Horario no habitual" in signals:
        return "CHALLENGE"
    if "FP-02" in matched_policy_ids:
        return "ESCALATE_TO_HUMAN"
    if signals:
        return "CHALLENGE"
    return "APPROVE"


def build_llm_context(state: FraudAnalysisState) -> dict:
    """Extract structured facts for prompts from pipeline state."""
    tx = Transaction(**state["transaction"])
    customers = CustomerStore()
    merchants = MerchantStore()
    merchant = merchants.get(tx.merchant_id)

    matched_details = state.get("matched_policy_details", [])
    policy_summaries = [
        {
            "policy_id": p["policy_id"],
            "title": p.get("title", p["policy_id"]),
            "rule": p.get("rule", ""),
            "recommended_action": p.get("recommended_action", ""),
            "triggered_by": p.get("triggered_by", []),
        }
        for p in matched_details
    ]

    signals = state.get("signals", [])
    amount_ratio = float(state.get("amount_ratio", 0.0))
    device_new = bool(state.get("device_is_new", False))
    matched_ids = list(state.get("matched_policies", []))

    return {
        "transaction_id": tx.transaction_id,
        "customer_name": customers.get_name(tx.customer_id),
        "amount": tx.amount,
        "currency": tx.currency,
        "country": tx.country,
        "merchant_id": tx.merchant_id,
        "merchant_name": merchant.name if merchant else tx.merchant_id,
        "amount_ratio": round(amount_ratio, 2),
        "device_is_new": device_new,
        "signals": signals,
        "matched_policies": policy_summaries,
        "matched_policy_ids": matched_ids,
        "decision": state.get("decision"),
        "risk_score": state.get("confidence"),
        "preliminary_decision": preliminary_decision_hint(
            signals=signals,
            amount_ratio=amount_ratio,
            device_new=device_new,
            matched_policy_ids=matched_ids,
            merchant_id=tx.merchant_id,
        ),
    }


def sanitize_customer_explanation(text: str, customer_name: str | None) -> str:
    """Strip LLM placeholders and personalize when possible."""
    import re

    name = customer_name or "cliente"
    cleaned = text
    cleaned = cleaned.replace("Señor/a [Nombre]", f"Estimado/a {name}")
    cleaned = cleaned.replace("Señor(a)", f"Estimado/a {name}")
    cleaned = cleaned.replace("[Nombre]", name)
    cleaned = re.sub(r"\[[^\]]+\]", name, cleaned)
    return cleaned.strip()
