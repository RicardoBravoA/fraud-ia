"""Unit tests for policy store matching."""

from pathlib import Path

import pytest

from app.infrastructure.rag.policy_store import PolicyStore

POLICIES_PATH = Path(__file__).resolve().parents[3] / "data" / "fraud_policies.json"


@pytest.fixture
def store() -> PolicyStore:
    return PolicyStore(policies_path=POLICIES_PATH)


def test_match_policies_challenge(store: PolicyStore):
    matched = store.match_policies(
        ["Monto fuera de rango", "Horario no habitual"],
        tx_country="PE",
        device_new=False,
        amount_ratio=3.6,
        high_risk_merchant=False,
    )
    ids = {p.policy_id for p in matched}
    assert ids == {"FP-01"}
    fp01 = matched[0]
    assert fp01.recommended_action == "CHALLENGE"
    assert fp01.triggered_by == ["Monto fuera de rango", "Horario no habitual"]


def test_match_policies_challenge_does_not_include_block_policies(store: PolicyStore):
    """Ratio 3.6× triggers CHALLENGE policy only — not FP-03 (>10×) or FP-04."""
    matched = store.match_policies(
        ["Monto fuera de rango", "Horario no habitual"],
        tx_country="PE",
        device_new=False,
        amount_ratio=3.6,
        high_risk_merchant=False,
    )
    ids = {p.policy_id for p in matched}
    assert "FP-03" not in ids
    assert "FP-04" not in ids


def test_match_policies_block_extreme_amount(store: PolicyStore):
    matched = store.match_policies(
        ["Monto fuera de rango", "Horario no habitual"],
        tx_country="PE",
        device_new=False,
        amount_ratio=41.67,
        high_risk_merchant=True,
    )
    ids = {p.policy_id for p in matched}
    assert "FP-01" in ids
    assert "FP-03" in ids
    assert "FP-04" in ids


def test_match_policies_high_risk_merchant_only(store: PolicyStore):
    matched = store.match_policies(
        ["Monto fuera de rango"],
        tx_country="PE",
        device_new=False,
        amount_ratio=5.0,
        high_risk_merchant=True,
    )
    ids = {p.policy_id for p in matched}
    assert ids == {"FP-04"}


def test_match_policies_escalate(store: PolicyStore):
    matched = store.match_policies(
        ["País no habitual", "Dispositivo no habitual"],
        tx_country="US",
        device_new=True,
        amount_ratio=2.5,
        high_risk_merchant=False,
    )
    ids = {p.policy_id for p in matched}
    assert ids == {"FP-02"}


def test_match_policies_escalate_requires_both_conditions(store: PolicyStore):
    matched = store.match_policies(
        ["País no habitual"],
        tx_country="US",
        device_new=False,
        amount_ratio=2.5,
        high_risk_merchant=False,
    )
    assert matched == []


def test_match_policies_fp01_requires_both_signals(store: PolicyStore):
    matched = store.match_policies(
        ["Monto fuera de rango"],
        tx_country="PE",
        device_new=False,
        amount_ratio=4.0,
        high_risk_merchant=False,
    )
    assert matched == []


def test_retrieve_includes_rule_text(store: PolicyStore):
    citations = store.retrieve([])
    assert citations
    assert citations[0].rule


def test_citations_for_matched_only_returns_applicable(store: PolicyStore):
    matched = store.match_policies(
        ["Monto fuera de rango", "Horario no habitual"],
        tx_country="PE",
        device_new=False,
        amount_ratio=3.6,
        high_risk_merchant=False,
    )
    citations = store.citations_for_matched(matched)
    assert len(citations) == 1
    assert citations[0].policy_id == "FP-01"


def test_citations_for_matched_empty_when_no_policies(store: PolicyStore):
    assert store.citations_for_matched([]) == []

