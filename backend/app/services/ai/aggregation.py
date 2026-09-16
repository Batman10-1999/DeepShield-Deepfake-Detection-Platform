"""Prediction Consistency Layer.

When several faces appear in one image the system must speak with a
single voice. This module owns that arbitration: it turns N per-face
probabilities into one overall probability plus a consistency measure,
without knowing anything about models, HTTP, or the UI.

Aggregation policy (configurable):
    max      – any convincingly fake face makes the media fake
    mean     – average opinion
    weighted – area-weighted mean, larger faces count more
"""
from __future__ import annotations

from dataclasses import dataclass
from statistics import pstdev
from typing import Sequence

from app.core.config import settings
from app.services.ai.confidence_calibrator import sanitize_probability
from app.services.vision.face_detector import FaceRegion


@dataclass(frozen=True)
class FaceAnalysis:
    """One face's independent verdict."""

    region: FaceRegion
    fake_probability: float
    confidence: float
    prediction: str
    inference_time_ms: float = 0.0

    @property
    def fake_percentage(self) -> float:
        return round(self.fake_probability * 100.0, 2)


@dataclass(frozen=True)
class AggregatedPrediction:
    """Overall opinion derived from every analysed face."""

    fake_probability: float
    confidence: float
    strategy: str
    face_count: int
    agreement: float          # 0-100, how much the faces agree
    consistent: bool
    dominant_face_index: int


class PredictionAggregator:
    """Combines per-face opinions into one consistent verdict."""

    def __init__(self, strategy: str | None = None) -> None:
        self._strategy = strategy or settings.FACE_AGGREGATION_STRATEGY

    def aggregate(self, analyses: Sequence[FaceAnalysis]) -> AggregatedPrediction:
        if not analyses:
            raise ValueError("Cannot aggregate an empty set of face analyses.")

        probabilities = [sanitize_probability(a.fake_probability) for a in analyses]
        combined = self._combine(analyses, probabilities)
        agreement = self._agreement(probabilities)
        dominant = max(analyses, key=lambda a: abs(a.fake_probability - 0.5))

        confidence = sum(a.confidence for a in analyses) / len(analyses)
        if len(analyses) > 1:
            # Disagreement between faces must lower the reported confidence.
            confidence *= 0.5 + (agreement / 200.0)

        return AggregatedPrediction(
            fake_probability=round(combined, 6),
            confidence=round(min(100.0, max(0.0, confidence)), 2),
            strategy=self._strategy,
            face_count=len(analyses),
            agreement=round(agreement, 2),
            consistent=agreement >= settings.FACE_CONSISTENCY_MIN_AGREEMENT,
            dominant_face_index=dominant.region.index,
        )

    # -- Internals -------------------------------------------------------------
    def _combine(
        self,
        analyses: Sequence[FaceAnalysis],
        probabilities: Sequence[float],
    ) -> float:
        if len(probabilities) == 1:
            return probabilities[0]
        if self._strategy == "max":
            return max(probabilities)
        if self._strategy == "weighted":
            weights = [max(1, a.region.area) for a in analyses]
            total = float(sum(weights))
            return sum(p * w for p, w in zip(probabilities, weights)) / total
        return sum(probabilities) / len(probabilities)

    @staticmethod
    def _agreement(probabilities: Sequence[float]) -> float:
        """100 = every face agrees, 0 = maximally split."""
        if len(probabilities) < 2:
            return 100.0
        spread = pstdev(probabilities)  # 0.5 is the theoretical maximum
        return max(0.0, min(100.0, 100.0 * (1.0 - spread / 0.5)))
