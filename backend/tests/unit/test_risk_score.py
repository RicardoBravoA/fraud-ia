"""Unit tests for fraud risk score."""

from app.domain.models import Decision
from app.domain.risk_score import compute_risk_score, finalize_risk_score


def test_compute_risk_score_low_when_no_signals():
    score = compute_risk_score(
        signals=[],
        amount_ratio=0.9,
        device_new=False,
        matched_policies=[],
        external_hits=0,
        high_risk_merchant=False,
    )
    assert score == 0.0


def test_compute_risk_score_high_when_extreme_amount():
    score = compute_risk_score(
        signals=["Monto fuera de rango", "Horario no habitual"],
        amount_ratio=41.0,
        device_new=False,
        matched_policies=["FP-03"],
        external_hits=1,
        high_risk_merchant=True,
    )
    assert score >= 0.85


def test_finalize_risk_score_caps_clean_approve():
    score = finalize_risk_score(Decision.APPROVE, 0.08, has_signals=False)
    assert score <= 0.30


def test_finalize_risk_score_floor_for_block():
    score = finalize_risk_score(Decision.BLOCK, 0.40, has_signals=True)
    assert score >= 0.85


def test_finalize_risk_score_floor_for_challenge():
    score = finalize_risk_score(Decision.CHALLENGE, 0.40, has_signals=True)
    assert score >= 0.55
