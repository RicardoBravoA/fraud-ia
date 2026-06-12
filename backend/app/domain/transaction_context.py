"""Build transaction context snapshot for evaluations."""

from dataclasses import asdict

from app.domain.models import (
    CustomerBehavior,
    MerchantProfile,
    Transaction,
    TransactionContext,
)
from app.domain.signals import amount_ratio
from app.infrastructure.customers.customer_store import CustomerStore
from app.infrastructure.devices.device_store import DeviceStore
from app.infrastructure.merchants.merchant_store import MerchantStore


def build_transaction_context(
    tx: Transaction,
    behavior: CustomerBehavior,
    *,
    device_is_new: bool,
    merchant_store: MerchantStore | None = None,
    customer_store: CustomerStore | None = None,
    device_store: DeviceStore | None = None,
) -> TransactionContext:
    merchants = merchant_store or MerchantStore()
    customers = customer_store or CustomerStore()
    devices = device_store or DeviceStore()
    return TransactionContext(
        transaction=tx,
        customer_profile=behavior,
        merchant=merchants.get(tx.merchant_id),
        amount_ratio=amount_ratio(tx, behavior),
        device_is_new=device_is_new,
        transaction_hour=tx.timestamp.hour,
        customer_name=customers.get_name(tx.customer_id),
        device_label=devices.get_label(tx.device_id),
    )


def transaction_context_to_dict(ctx: TransactionContext) -> dict:
    tx = ctx.transaction
    return {
        "transaction": {
            "transaction_id": tx.transaction_id,
            "customer_id": tx.customer_id,
            "amount": tx.amount,
            "currency": tx.currency,
            "country": tx.country,
            "channel": tx.channel,
            "device_id": tx.device_id,
            "timestamp": tx.timestamp,
            "merchant_id": tx.merchant_id,
        },
        "customer_profile": asdict(ctx.customer_profile),
        "merchant": asdict(ctx.merchant) if ctx.merchant else None,
        "amount_ratio": ctx.amount_ratio,
        "device_is_new": ctx.device_is_new,
        "transaction_hour": ctx.transaction_hour,
        "customer_name": ctx.customer_name,
        "device_label": ctx.device_label,
    }


def transaction_context_from_dict(data: dict) -> TransactionContext:
    tx_raw = data["transaction"]
    timestamp = tx_raw["timestamp"]
    if isinstance(timestamp, str):
        from datetime import datetime

        timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))

    merchant_raw = data.get("merchant")
    merchant = MerchantProfile(**merchant_raw) if merchant_raw else None

    return TransactionContext(
        transaction=Transaction(
            transaction_id=tx_raw["transaction_id"],
            customer_id=tx_raw["customer_id"],
            amount=float(tx_raw["amount"]),
            currency=tx_raw["currency"],
            country=tx_raw["country"],
            channel=tx_raw["channel"],
            device_id=tx_raw["device_id"],
            timestamp=timestamp,
            merchant_id=tx_raw["merchant_id"],
        ),
        customer_profile=CustomerBehavior(**data["customer_profile"]),
        merchant=merchant,
        amount_ratio=float(data["amount_ratio"]),
        device_is_new=bool(data["device_is_new"]),
        transaction_hour=int(data["transaction_hour"]),
        customer_name=data.get("customer_name"),
        device_label=data.get("device_label"),
    )
