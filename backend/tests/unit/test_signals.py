"""Unit tests for domain signal computation."""

from datetime import datetime

from app.domain.models import CustomerBehavior, Transaction
from app.domain.signals import compute_signals


def test_compute_signals_challenge_when_amount_and_hour_unusual():
    tx = Transaction(
        transaction_id="T-1001",
        customer_id="CU-001",
        amount=1800.0,
        currency="PEN",
        country="PE",
        channel="web",
        device_id="D-01",
        timestamp=datetime(2025, 12, 17, 3, 15, 0),
        merchant_id="M-001",
    )
    behavior = CustomerBehavior(
        customer_id="CU-001",
        usual_amount_avg=500.0,
        usual_hours="08-20",
        usual_countries="PE",
        usual_devices="D-01",
    )
    signals = compute_signals(tx, behavior)
    assert "Monto fuera de rango" in signals
    assert "Horario no habitual" in signals


def test_compute_signals_approve_when_normal():
    tx = Transaction(
        transaction_id="T-1003",
        customer_id="CU-001",
        amount=450.0,
        currency="PEN",
        country="PE",
        channel="web",
        device_id="D-01",
        timestamp=datetime(2025, 12, 17, 10, 0, 0),
        merchant_id="M-001",
    )
    behavior = CustomerBehavior(
        customer_id="CU-001",
        usual_amount_avg=500.0,
        usual_hours="08-20",
        usual_countries="PE",
        usual_devices="D-01",
    )
    signals = compute_signals(tx, behavior)
    assert signals == []
