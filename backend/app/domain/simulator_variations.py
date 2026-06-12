"""Generate non-repeated simulated transactions from demo templates."""

import random
from datetime import datetime
from uuid import uuid4

from app.domain.models import Transaction

# Per-template ranges keep fraud signals meaningful while varying payload each run.
_VARIATION_RULES: dict[str, dict] = {
    "T-1003": {
        "amount_range": (420.0, 520.0),
        "hour_range": (9, 18),
        "minute_range": (0, 59),
    },
    "T-1001": {
        "amount_range": (1650.0, 2400.0),
        "hour_choices": [2, 3, 4, 5, 22, 23],
        "minute_range": (0, 59),
    },
    "T-1002": {
        "amount_range": (8800.0, 10200.0),
        "hour_choices": [23],
        "minute_range": (0, 59),
    },
    "T-1004": {
        "amount_range": (45000.0, 58000.0),
        "hour_range": (22, 23),
        "minute_range": (0, 59),
    },
    "T-1005": {
        "amount_range": (1700.0, 2600.0),
        "hour_range": (11, 17),
        "minute_range": (0, 59),
    },
}


def variation_metadata(template_id: str) -> dict:
    """Human-readable variation bounds for API / UI."""
    rules = _VARIATION_RULES.get(template_id, {})
    amount_range = rules.get("amount_range")
    if "hour_choices" in rules:
        hours = ", ".join(f"{h:02d}h" for h in rules["hour_choices"])
        hour_hint = f"Unusual hours: {hours}"
    elif "hour_range" in rules:
        lo, hi = rules["hour_range"]
        hour_hint = f"Hours {lo:02d}:00–{hi:02d}:59"
    else:
        hour_hint = "Same hour window as template"

    return {
        "amount_min": amount_range[0] if amount_range else None,
        "amount_max": amount_range[1] if amount_range else None,
        "hour_hint": hour_hint,
        "unique_fields": ["transaction_id", "amount", "timestamp"],
    }


def transaction_fingerprint(tx: Transaction) -> str:
    return (
        f"{tx.customer_id}|{tx.amount:.2f}|{tx.country}|{tx.device_id}|"
        f"{tx.merchant_id}|{tx.timestamp.isoformat()}"
    )


def generate_varied_transaction(
    template: Transaction,
    source_template_id: str,
    *,
    forbidden_fingerprints: set[str] | None = None,
    rng: random.Random | None = None,
) -> Transaction:
    """Build a unique SIM-* transaction with varied amount and timestamp."""
    random_gen = rng or random.Random()
    forbidden = forbidden_fingerprints or set()
    rules = _VARIATION_RULES.get(source_template_id, {})

    for _ in range(25):
        amount_lo, amount_hi = rules.get("amount_range", (template.amount, template.amount))
        amount = round(random_gen.uniform(amount_lo, amount_hi), 2)

        if "hour_choices" in rules:
            hour = random_gen.choice(rules["hour_choices"])
        else:
            hour_lo, hour_hi = rules.get("hour_range", (template.timestamp.hour, template.timestamp.hour))
            hour = random_gen.randint(hour_lo, hour_hi)

        minute_lo, minute_hi = rules.get("minute_range", (0, 59))
        minute = random_gen.randint(minute_lo, minute_hi)
        timestamp = datetime(2025, 12, 17, hour, minute, 0)

        candidate = Transaction(
            transaction_id=f"SIM-{source_template_id}-{uuid4().hex[:6].upper()}",
            customer_id=template.customer_id,
            amount=amount,
            currency=template.currency,
            country=template.country,
            channel=template.channel,
            device_id=template.device_id,
            timestamp=timestamp,
            merchant_id=template.merchant_id,
        )
        if transaction_fingerprint(candidate) not in forbidden:
            return candidate

    # Fallback: micro-noise on amount guarantees uniqueness
    noise = random_gen.randint(1, 99) / 100
    fallback = Transaction(
        transaction_id=f"SIM-{source_template_id}-{uuid4().hex[:6].upper()}",
        customer_id=template.customer_id,
        amount=round(template.amount + noise, 2),
        currency=template.currency,
        country=template.country,
        channel=template.channel,
        device_id=template.device_id,
        timestamp=template.timestamp,
        merchant_id=template.merchant_id,
    )
    return fallback
