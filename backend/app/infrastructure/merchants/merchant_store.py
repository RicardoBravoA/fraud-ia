"""Merchant catalog for transaction context (local dev)."""

import json
from pathlib import Path

from app.core.config import DATA_DIR
from app.domain.models import MerchantProfile


class MerchantStore:
    def __init__(self, merchants_path: Path | None = None) -> None:
        self._path = merchants_path or DATA_DIR / "merchants.json"
        self._merchants: list[dict] = []

    def load(self) -> None:
        with open(self._path, encoding="utf-8") as f:
            self._merchants = json.load(f)

    def get(self, merchant_id: str) -> MerchantProfile | None:
        if not self._merchants:
            self.load()
        for merchant in self._merchants:
            if merchant["merchant_id"] == merchant_id:
                return MerchantProfile(
                    merchant_id=merchant["merchant_id"],
                    name=merchant["name"],
                    category=merchant["category"],
                    risk_level=merchant["risk_level"],
                    risk_reason=merchant.get("risk_reason"),
                )
        return None

    def list_all(self) -> list[MerchantProfile]:
        if not self._merchants:
            self.load()
        return [
            MerchantProfile(
                merchant_id=m["merchant_id"],
                name=m["name"],
                category=m["category"],
                risk_level=m["risk_level"],
                risk_reason=m.get("risk_reason"),
            )
            for m in self._merchants
        ]
