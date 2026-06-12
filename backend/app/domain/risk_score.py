"""Risk score computation — higher value means higher fraud risk."""

from app.domain.models import Decision


def compute_risk_score(
    *,
    signals: list[str],
    amount_ratio: float,
    device_new: bool,
    matched_policies: list[str],
    external_hits: int,
    high_risk_merchant: bool,
) -> float:
    """Evidence-based fraud risk in [0.0, 1.0]."""
    score = 0.0

    if "Monto fuera de rango" in signals:
        if amount_ratio > 10:
            score += 0.45
        elif amount_ratio > 3:
            score += 0.30
        else:
            score += 0.15

    if "Horario no habitual" in signals:
        score += 0.15

    if "País no habitual" in signals:
        score += 0.20

    if "Dispositivo no habitual" in signals:
        score += 0.15

    if device_new:
        score += 0.05

    if amount_ratio > 10:
        score = max(score, 0.85)
    elif amount_ratio > 3:
        score = max(score, 0.55)

    if high_risk_merchant and amount_ratio > 3:
        score = max(score, 0.75)

    score += min(0.15, 0.05 * len(matched_policies))

    if external_hits > 0:
        score += 0.08

    return min(1.0, max(0.0, score))


def finalize_risk_score(decision: Decision, risk: float, *, has_signals: bool) -> float:
    """Align risk score with decision severity (industry-style risk index)."""
    floors = {
        Decision.CHALLENGE: 0.55,
        Decision.BLOCK: 0.85,
        Decision.ESCALATE_TO_HUMAN: 0.55,
    }
    risk = max(risk, floors.get(decision, 0.0))

    if decision == Decision.APPROVE and not has_signals:
        risk = min(risk, 0.30)

    return min(1.0, max(0.0, risk))
