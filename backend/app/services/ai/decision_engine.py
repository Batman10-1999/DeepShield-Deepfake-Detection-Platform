"""Prediction Decision Engine.

Owns the single question "given a calibrated fake probability and a
confidence value, what does DeepShield report?". Separated from the risk
assessor so that thresholds, labels and abstention logic can evolve
without touching scoring or inference code.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.core.config import settings

Verdict = Literal["REAL", "FAKE"]
AnalyticalBand = Literal["REAL", "FAKE", "SUSPICIOUS", "NEEDS_MANUAL_REVIEW"]


@dataclass(frozen=True)
class Decision:
    """A binary user-facing verdict plus the internal evidence behind it.

    `verdict` is always REAL or FAKE. The analytical band (which may be
    SUSPICIOUS or NEEDS_MANUAL_REVIEW) is retained internally for
    calibration and reporting but is never the user-facing result.
    """
    verdict: Verdict
    analytical_band: AnalyticalBand
    fake_percentage: float
    confidence: float
    requires_manual_review: bool
    rationale: str
    thresholds: dict[str, float]
    binary_threshold_pct: float
    binary_decision_validated: bool
    validation_note: str


class DecisionEngine:
    """Threshold-driven verdict resolution.

    The user-facing verdict is produced by a single configurable
    threshold on the fake percentage:

        fake_pct >= binary_fake_pct -> FAKE
        fake_pct <  binary_fake_pct -> REAL

    The three-band analysis (REAL / SUSPICIOUS / FAKE) and the confidence
    abstention floor are kept as internal evidence: they explain how firm
    the binary call is without introducing a third user-facing category.
    """

    def __init__(
        self,
        *,
        real_max_fake_pct: float | None = None,
        fake_min_fake_pct: float | None = None,
        manual_review_confidence: float | None = None,
        binary_fake_pct: float | None = None,
    ) -> None:
        self._real_max = float(
            real_max_fake_pct
            if real_max_fake_pct is not None
            else settings.DECISION_REAL_MAX_FAKE_PCT
        )
        self._fake_min = float(
            fake_min_fake_pct
            if fake_min_fake_pct is not None
            else settings.DECISION_FAKE_MIN_FAKE_PCT
        )
        self._review_confidence = float(
            manual_review_confidence
            if manual_review_confidence is not None
            else settings.DECISION_MANUAL_REVIEW_CONFIDENCE
        )
        self._binary_fake_pct = float(
            binary_fake_pct if binary_fake_pct is not None
            else settings.DECISION_BINARY_FAKE_PCT
        )
        if self._real_max >= self._fake_min:
            raise ValueError(
                "Real threshold must be strictly below the fake threshold."
            )

    @property
    def thresholds(self) -> dict[str, float]:
        return {
            "real_max_fake_pct": self._real_max,
            "fake_min_fake_pct": self._fake_min,
            "manual_review_confidence": self._review_confidence,
            "binary_fake_pct": self._binary_fake_pct,
        }

    def decide(self, *, fake_percentage: float, confidence: float) -> Decision:
        fake_pct = self._clamp(fake_percentage)
        conf = self._clamp(confidence)
        band = self._analytical_band(fake_pct, conf)
        verdict: Verdict = "FAKE" if fake_pct >= self._binary_fake_pct else "REAL"

        rationale = (
            f"Manipulation likelihood {fake_pct:.2f}% "
            f"{'meets or exceeds' if verdict == 'FAKE' else 'stays below'} the "
            f"{self._binary_fake_pct:.0f}% binary threshold "
            f"(internal band: {band}, confidence {conf:.2f}%)."
        )
        validated, note = self._validation_state()
        return Decision(
            verdict=verdict,
            analytical_band=band,
            fake_percentage=round(fake_pct, 2),
            confidence=round(conf, 2),
            requires_manual_review=(band == "NEEDS_MANUAL_REVIEW"),
            rationale=rationale,
            thresholds=self.thresholds,
            binary_threshold_pct=self._binary_fake_pct,
            binary_decision_validated=validated,
            validation_note=note,
        )

    def _analytical_band(self, fake_pct: float, conf: float) -> AnalyticalBand:
        if conf < self._review_confidence:
            return "NEEDS_MANUAL_REVIEW"
        if fake_pct >= self._fake_min:
            return "FAKE"
        if fake_pct <= self._real_max:
            return "REAL"
        return "SUSPICIOUS"

    @staticmethod
    def _validation_state() -> tuple[bool, str]:
        """Is the binary verdict backed by a verified deepfake checkpoint?"""
        from app.services.training.checkpoint_manager import CheckpointManager

        checkpoint = CheckpointManager().latest(settings.DEFAULT_MODEL)
        if checkpoint and checkpoint.is_verified_deepfake_checkpoint:
            return True, "Verdict produced by a verified deepfake-trained checkpoint."
        return False, (
            "Deepfake-trained checkpoint unavailable — this binary verdict has "
            "not been scientifically validated."
        )

    @staticmethod
    def _clamp(value: float) -> float:
        return max(0.0, min(100.0, float(value)))
