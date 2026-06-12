"""Merchant risk helpers — shared by RAG and arbiter."""

import json

from app.core.config import DATA_DIR


def is_high_risk_merchant(merchant_id: str) -> bool:
    path = DATA_DIR / "high_risk_merchants.json"
    if not path.exists():
        return False
    with open(path, encoding="utf-8") as f:
        merchants = json.load(f)
    return any(
        m.get("merchant_id") == merchant_id and m.get("risk_level") == "high"
        for m in merchants
    )
