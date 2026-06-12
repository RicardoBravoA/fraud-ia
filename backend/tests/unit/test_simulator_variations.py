"""Unit tests for simulator transaction variations."""

import random

from app.domain.models import Transaction
from app.domain.simulator_variations import (
    generate_varied_transaction,
    transaction_fingerprint,
)
from datetime import datetime


def _template(template_id: str) -> Transaction:
    templates = {
        "T-1003": Transaction(
            "T-1003", "CU-001", 450.0, "PEN", "PE", "web", "D-01",
            datetime(2025, 12, 17, 10, 0, 0), "M-001",
        ),
        "T-1001": Transaction(
            "T-1001", "CU-001", 1800.0, "PEN", "PE", "web", "D-01",
            datetime(2025, 12, 17, 3, 15, 0), "M-001",
        ),
    }
    return templates[template_id]


def test_generates_different_amounts_for_same_template():
    rng = random.Random(42)
    template = _template("T-1003")
    a = generate_varied_transaction(template, "T-1003", rng=rng)
    b = generate_varied_transaction(template, "T-1003", rng=rng)
    assert a.transaction_id != b.transaction_id
    assert a.amount != b.amount or a.timestamp != b.timestamp


def test_respects_forbidden_fingerprints():
    template = _template("T-1001")
    first = generate_varied_transaction(template, "T-1001", rng=random.Random(1))
    second = generate_varied_transaction(
        template,
        "T-1001",
        forbidden_fingerprints={transaction_fingerprint(first)},
        rng=random.Random(1),
    )
    assert transaction_fingerprint(second) != transaction_fingerprint(first)


def test_fingerprint_is_stable():
    tx = _template("T-1003")
    assert transaction_fingerprint(tx) == transaction_fingerprint(tx)


def test_t1002_variation_uses_late_night_only():
    from datetime import datetime

    template = Transaction(
        "T-1002", "CU-002", 9500.0, "PEN", "PE", "mobile", "D-02",
        datetime(2025, 12, 17, 23, 45, 0), "M-002",
    )
    for seed in range(30):
        tx = generate_varied_transaction(template, "T-1002", rng=random.Random(seed))
        assert tx.timestamp.hour == 23
