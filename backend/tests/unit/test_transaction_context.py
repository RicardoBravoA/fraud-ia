"""Tests for transaction context snapshot."""

from datetime import datetime
from pathlib import Path

from app.domain.models import CustomerBehavior, Transaction
from app.domain.transaction_context import build_transaction_context
from app.infrastructure.merchants.merchant_store import MerchantStore

MERCHANTS_PATH = Path(__file__).resolve().parents[3] / "data" / "merchants.json"


def test_build_transaction_context_includes_merchant_and_ratio():
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
    store = MerchantStore(merchants_path=MERCHANTS_PATH)

    context = build_transaction_context(
        tx,
        behavior,
        device_is_new=False,
        merchant_store=store,
    )

    assert context.amount_ratio == 3.6
    assert context.transaction_hour == 3
    assert context.merchant is not None
    assert context.merchant.name == "Retail Plaza Lima"
