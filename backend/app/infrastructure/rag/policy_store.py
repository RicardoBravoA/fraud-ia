"""Simple JSON-based policy store for RAG (local dev)."""

import json
from pathlib import Path

from app.core.config import DATA_DIR
from app.domain.models import InternalCitation, MatchedPolicy


class PolicyStore:
    def __init__(self, policies_path: Path | None = None) -> None:
        self._path = policies_path or DATA_DIR / "fraud_policies.json"
        self._policies: list[dict] = []

    def load(self) -> None:
        with open(self._path, encoding="utf-8") as f:
            self._policies = json.load(f)

    def retrieve(self, signals: list[str], limit: int = 3) -> list[InternalCitation]:
        """Legacy retrieve — prefer citations_for_matched after policy matching."""
        if not self._policies:
            self.load()
        citations: list[InternalCitation] = []
        for i, policy in enumerate(self._policies[:limit]):
            citations.append(
                InternalCitation(
                    policy_id=policy["policy_id"],
                    chunk_id=str(i + 1),
                    version=policy["version"],
                    rule=policy["rule"],
                )
            )
        return citations

    def citations_for_matched(self, matched: list[MatchedPolicy]) -> list[InternalCitation]:
        """Return internal citations only for policies that matched this transaction."""
        return [
            InternalCitation(
                policy_id=p.policy_id,
                chunk_id=str(i + 1),
                version=p.version,
                rule=p.rule,
            )
            for i, p in enumerate(matched)
        ]

    def matching_rules(
        self,
        signals: list[str],
        tx_country: str,
        device_new: bool,
        *,
        amount_ratio: float = 0.0,
        high_risk_merchant: bool = False,
    ) -> list[str]:
        return [
            p.policy_id
            for p in self.match_policies(
                signals,
                tx_country,
                device_new,
                amount_ratio=amount_ratio,
                high_risk_merchant=high_risk_merchant,
            )
        ]

    def match_policies(
        self,
        signals: list[str],
        tx_country: str,
        device_new: bool,
        *,
        amount_ratio: float = 0.0,
        high_risk_merchant: bool = False,
    ) -> list[MatchedPolicy]:
        if not self._policies:
            self.load()

        matched: list[MatchedPolicy] = []
        seen: set[str] = set()

        for policy in self._policies:
            triggered = _policy_triggered(
                policy["policy_id"],
                signals=signals,
                device_new=device_new,
                amount_ratio=amount_ratio,
                high_risk_merchant=high_risk_merchant,
            )
            if not triggered:
                continue

            policy_id = policy["policy_id"]
            if policy_id in seen:
                continue
            seen.add(policy_id)

            matched.append(
                MatchedPolicy(
                    policy_id=policy_id,
                    title=policy.get("title", policy_id),
                    rule=policy["rule"],
                    version=policy["version"],
                    recommended_action=_recommended_action(policy["rule"]),
                    triggered_by=triggered,
                )
            )

        return matched


def _policy_triggered(
    policy_id: str,
    *,
    signals: list[str],
    device_new: bool,
    amount_ratio: float,
    high_risk_merchant: bool,
) -> list[str]:
    """Return triggered_by when the policy's full rule conditions are met."""
    if policy_id == "FP-01":
        if "Monto fuera de rango" in signals and "Horario no habitual" in signals:
            return ["Monto fuera de rango", "Horario no habitual"]
        return []

    if policy_id == "FP-02":
        if "País no habitual" in signals and device_new:
            return ["País no habitual", "Dispositivo nuevo"]
        return []

    if policy_id == "FP-03":
        if amount_ratio > 10:
            return ["Monto > 10x promedio habitual"]
        return []

    if policy_id == "FP-04":
        if high_risk_merchant and amount_ratio > 3:
            return ["Merchant alto riesgo", "Monto elevado (>3x)"]
        return []

    return []


def _recommended_action(rule: str) -> str:
    if "→" in rule:
        return rule.rsplit("→", maxsplit=1)[-1].strip()
    return "REVIEW"
