"""Deterministic signal computation — pure domain logic."""

from app.domain.models import CustomerBehavior, Transaction


def compute_signals(tx: Transaction, behavior: CustomerBehavior) -> list[str]:
    """Derive fraud signals by comparing transaction vs customer profile."""
    signals: list[str] = []

    if behavior.usual_amount_avg > 0 and tx.amount / behavior.usual_amount_avg > 3:
        signals.append("Monto fuera de rango")

    hour = tx.timestamp.hour
    start, end = (int(p) for p in behavior.usual_hours.split("-"))
    if not (start <= hour <= end):
        signals.append("Horario no habitual")

    usual_countries = [c.strip() for c in behavior.usual_countries.split(",")]
    if tx.country not in usual_countries:
        signals.append("País no habitual")

    usual_devices = [d.strip() for d in behavior.usual_devices.split(",")]
    if tx.device_id not in usual_devices:
        signals.append("Dispositivo no habitual")

    return signals


def amount_ratio(tx: Transaction, behavior: CustomerBehavior) -> float:
    if behavior.usual_amount_avg <= 0:
        return 0.0
    return tx.amount / behavior.usual_amount_avg
