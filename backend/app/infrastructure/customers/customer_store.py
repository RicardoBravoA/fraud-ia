"""Customer catalog for display labels."""

import json
from pathlib import Path

from app.core.config import DATA_DIR


class CustomerStore:
    def __init__(self, customers_path: Path | None = None) -> None:
        self._path = customers_path or DATA_DIR / "customers.json"
        self._customers: list[dict] = []

    def load(self) -> None:
        with open(self._path, encoding="utf-8") as f:
            self._customers = json.load(f)

    def get_name(self, customer_id: str) -> str | None:
        if not self._customers:
            self.load()
        for customer in self._customers:
            if customer["customer_id"] == customer_id:
                return customer["name"]
        return None
