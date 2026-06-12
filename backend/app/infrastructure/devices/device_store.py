"""Device catalog for display labels."""

import json
from pathlib import Path

from app.core.config import DATA_DIR


class DeviceStore:
    def __init__(self, devices_path: Path | None = None) -> None:
        self._path = devices_path or DATA_DIR / "devices.json"
        self._devices: list[dict] = []

    def load(self) -> None:
        with open(self._path, encoding="utf-8") as f:
            self._devices = json.load(f)

    def get_label(self, device_id: str) -> str | None:
        if not self._devices:
            self.load()
        for device in self._devices:
            if device["device_id"] == device_id:
                return device["label"]
        return None
