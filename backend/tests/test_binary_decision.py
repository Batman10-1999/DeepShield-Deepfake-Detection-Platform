"""Regression: the user-facing verdict must stay strictly binary.

Days 1-4 exposed SUSPICIOUS and NEEDS_MANUAL_REVIEW to the client. Day 5
collapses those to internal analytical bands. These tests fail if a third
user-facing verdict is ever reintroduced.
"""
from __future__ import annotations

import pytest

from app.services.ai.decision_engine import DecisionEngine

ENGINE = DecisionEngine()


@pytest.mark.parametrize("fake_pct", [0.0, 12.5, 49.9, 50.0, 73.2, 100.0])
def test_verdict_is_always_real_or_fake(fake_pct: float) -> None:
    decision = ENGINE.decide(fake_percentage=fake_pct, confidence=90.0)
    assert decision.verdict in {"REAL", "FAKE"}


def test_low_confidence_still_produces_a_binary_verdict() -> None:
    decision = ENGINE.decide(fake_percentage=80.0, confidence=1.0)
    assert decision.verdict == "FAKE"
    assert decision.analytical_band == "NEEDS_MANUAL_REVIEW"
    assert decision.requires_manual_review is True


def test_threshold_boundary_is_inclusive_for_fake() -> None:
    threshold = ENGINE.thresholds["binary_fake_pct"]
    assert ENGINE.decide(fake_percentage=threshold,
                         confidence=95.0).verdict == "FAKE"
    assert ENGINE.decide(fake_percentage=threshold - 0.01,
                         confidence=95.0).verdict == "REAL"


def test_analytical_band_retains_the_middle_ground() -> None:
    midpoint = (ENGINE.thresholds["real_max_fake_pct"]
                + ENGINE.thresholds["fake_min_fake_pct"]) / 2
    decision = ENGINE.decide(fake_percentage=midpoint, confidence=95.0)
    assert decision.analytical_band == "SUSPICIOUS"
    assert decision.verdict in {"REAL", "FAKE"}


def test_percentages_are_clamped_not_wrapped() -> None:
    assert ENGINE.decide(fake_percentage=-50, confidence=99).fake_percentage == 0.0
    assert ENGINE.decide(fake_percentage=500, confidence=99).fake_percentage == 100.0


def test_verdict_carries_an_honest_validation_flag() -> None:
    decision = ENGINE.decide(fake_percentage=90.0, confidence=95.0)
    assert isinstance(decision.binary_decision_validated, bool)
    if not decision.binary_decision_validated:
        assert "not been scientifically validated" in decision.validation_note


def test_engine_rejects_inverted_thresholds() -> None:
    with pytest.raises(ValueError):
        DecisionEngine(real_max_fake_pct=80.0, fake_min_fake_pct=20.0)
