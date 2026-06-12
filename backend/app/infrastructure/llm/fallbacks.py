"""Rule-based LLM fallbacks when the provider is unavailable or times out."""

from __future__ import annotations

from typing import Any


def fallback_debate_argument(role: str, ctx: dict[str, Any]) -> str:
    signals = ctx.get("signals") or []
    signal_text = ", ".join(signals) if signals else "no notable signals"
    if role.lower().startswith("pro-fraud"):
        return (
            f"The transaction shows elevated risk ({signal_text}). "
            f"Amount is {ctx['amount_ratio']}x the customer's usual spend, "
            "which supports tighter controls."
        )
    return (
        f"The customer may have a plausible reason for this activity at "
        f"{ctx.get('merchant_name', 'this merchant')}; signals ({signal_text}) "
        "can have benign explanations."
    )


def fallback_customer_explanation(ctx: dict[str, Any]) -> str:
    name = ctx.get("customer_name") or "cliente"
    decision = (ctx.get("decision") or "CHALLENGE").upper()
    templates = {
        "APPROVE": (
            f"Estimado/a {name}, su transacción fue aprobada porque no se detectaron "
            "señales de riesgo relevantes en el análisis."
        ),
        "CHALLENGE": (
            f"Estimado/a {name}, su transacción requiere verificación adicional debido "
            "a un monto o horario fuera de su patrón habitual."
        ),
        "BLOCK": (
            f"Estimado/a {name}, su transacción fue bloqueada por un monto "
            "significativamente superior a su comportamiento habitual."
        ),
        "ESCALATE_TO_HUMAN": (
            f"Estimado/a {name}, su transacción fue derivada a un especialista porque "
            "se realizó desde un país o dispositivo no habituales."
        ),
    }
    return templates.get(
        decision,
        f"Estimado/a {name}, su transacción fue revisada y requiere validación adicional "
        "por señales atípicas detectadas.",
    )


def fallback_audit_explanation(
    ctx: dict[str, Any],
    agent_route: str,
    debate: dict[str, str] | None,
) -> str:
    policies = ctx.get("matched_policies") or []
    policy_titles = ", ".join(p.get("title", p.get("policy_id", "")) for p in policies) or "none"
    signals = ctx.get("signals") or []
    signal_text = ", ".join(signals) if signals else "none"
    debate_note = ""
    if debate:
        debate_note = " Debate arguments were recorded from both fraud and customer perspectives."
    risk = ctx.get("risk_score")
    risk_line = f" Risk score {risk:.2f}." if risk is not None else ""
    return (
        f"Decision {ctx.get('decision')} for {ctx['transaction_id']} after route "
        f"{agent_route}. Matched policies: {policy_titles}. "
        f"Key signals: {signal_text}.{risk_line}{debate_note} "
        "LLM explanations were generated from rule-based fallback due to provider timeout."
    )
