"""Prompt templates for LLM-backed agents."""

from __future__ import annotations

from typing import Any

DEBATE_SYSTEM = (
    "You are a fraud analyst in a bank dispute panel. "
    "Give a concise 2-3 sentence argument in English. "
    "Reference the transaction facts and signals provided — do not invent data."
)

EXPLAIN_CUSTOMER_SYSTEM = (
    "You explain fraud decisions to bank customers in clear, calm Spanish. "
    "Use 2-3 sentences. Address the customer by name when provided. "
    "Never use placeholders like [Nombre] or brackets. "
    "Do not mention internal agent names, policy IDs, or risk scores. "
    "Match the explanation to the final decision: "
    "APPROVE = approved; CHALLENGE = needs extra verification; "
    "BLOCK = blocked; ESCALATE_TO_HUMAN = referred to a specialist."
)

EXPLAIN_AUDIT_SYSTEM = (
    "You write audit notes for fraud investigators in English. "
    "Cite matched policies by title and rule text, list key signals, "
    "and explain the decision rationale in 3-4 sentences. "
    "Do not invent policies or signals not present in the context."
)


def _policy_lines(policies: list[dict[str, Any]]) -> str:
    if not policies:
        return "none"
    lines = []
    for p in policies:
        triggered = ", ".join(p.get("triggered_by", [])) or "n/a"
        lines.append(
            f"- {p.get('title', p.get('policy_id'))}: {p.get('rule', '')} "
            f"(action: {p.get('recommended_action', '')}; triggered by: {triggered})"
        )
    return "\n".join(lines)


def debate_prompt(role: str, ctx: dict[str, Any]) -> str:
    signals = ctx.get("signals") or []
    signal_text = ", ".join(signals) if signals else "none"
    return (
        f"Role: {role}.\n"
        f"Transaction: {ctx['transaction_id']} — {ctx['amount']} {ctx['currency']} "
        f"in {ctx['country']} at merchant {ctx.get('merchant_name', ctx['merchant_id'])}.\n"
        f"Amount vs customer average: {ctx['amount_ratio']}x. "
        f"New device: {'yes' if ctx.get('device_is_new') else 'no'}.\n"
        f"Fraud signals: {signal_text}.\n"
        f"Matched policies:\n{_policy_lines(ctx.get('matched_policies', []))}\n"
        f"Preliminary decision from rules: {ctx.get('preliminary_decision', 'unknown')}.\n"
        f"Argue from your assigned perspective ({role}) only."
    )


def customer_explanation_prompt(ctx: dict[str, Any]) -> str:
    decision = ctx.get("decision", "APPROVE")
    name = ctx.get("customer_name") or "cliente"
    signals = ctx.get("signals") or []
    return (
        f"Write the customer-facing explanation in Spanish.\n"
        f"Customer name: {name}\n"
        f"Final decision: {decision}\n"
        f"Transaction: {ctx['amount']} {ctx['currency']} ({ctx['amount_ratio']}x usual amount)\n"
        f"Signals detected: {signals or 'none'}\n"
        f"Policies applied:\n{_policy_lines(ctx.get('matched_policies', []))}\n"
        f"Task: customer explanation"
    )


def audit_explanation_prompt(
    ctx: dict[str, Any],
    agent_route: str,
    debate: dict[str, str] | None,
) -> str:
    debate_text = ""
    if debate:
        debate_text = (
            f"\nDebate — Pro-Fraud: {debate.get('pro_fraud', '')}\n"
            f"Pro-Customer: {debate.get('pro_customer', '')}"
        )
    risk = ctx.get("risk_score")
    risk_line = f"Risk score: {risk:.2f}\n" if risk is not None else ""
    return (
        f"Write the audit explanation in English.\n"
        f"Transaction: {ctx['transaction_id']}\n"
        f"Final decision: {ctx.get('decision')}\n"
        f"{risk_line}"
        f"Amount ratio: {ctx['amount_ratio']}x. Country: {ctx['country']}. "
        f"New device: {'yes' if ctx.get('device_is_new') else 'no'}.\n"
        f"Signals: {ctx.get('signals') or 'none'}\n"
        f"Matched policies:\n{_policy_lines(ctx.get('matched_policies', []))}\n"
        f"Agent route: {agent_route}.{debate_text}\n"
        f"Task: audit explanation"
    )
