"""Frame Aggregation.

Turns N independent frame verdicts into one video-level opinion plus a
temporal consistency measure. Deliberately mirrors the multi-face
`PredictionAggregator` so both layers share the same mental model.
"""
from __future__ import annotations

from dataclasses import dataclass
from statistics import pstdev
from typing import Sequence

from app.core.config import settings
from app.services.ai.confidence_calibrator import sanitize_probability


@dataclass(frozen=True)
class FrameVerdict:
    """One analysed frame's independent opinion."""

    frame_number: int
    timestamp_sec: float
    fake_probability: float
    confidence: float
    prediction: str                     # binary: REAL | FAKE
    analytical_band: str | None = None  # internal band, never user-facing
    faces_detected: int = 0
    inference_time_ms: float = 0.0

    @property
    def fake_percentage(self) -> float:
        return round(self.fake_probability * 100.0, 2)


@dataclass(frozen=True)
class VideoAggregate:
    fake_probability: float
    confidence: float
    strategy: str
    frames_analysed: int
    real_frames: int
    fake_frames: int
    suspicious_frames: int
    manual_review_frames: int
    agreement: float
    consistent: bool
    dominant_frame_number: int


class FrameAggregator:
    """Combines per-frame verdicts into one video-level verdict."""

    def __init__(self, strategy: str | None = None) -> None:
        self._strategy = strategy or settings.VIDEO_FRAME_AGGREGATION_STRATEGY

    def aggregate(self, verdicts: Sequence[FrameVerdict]) -> VideoAggregate:
        if not verdicts:
            raise ValueError("Cannot aggregate an empty set of frame verdicts.")

        probabilities = [sanitize_probability(v.fake_probability) for v in verdicts]
        combined = self._combine(verdicts, probabilities)
        agreement = self._agreement(probabilities)
        dominant = max(verdicts, key=lambda v: abs(v.fake_probability - 0.5))

        confidence = sum(v.confidence for v in verdicts) / len(verdicts)
        if len(verdicts) > 1:
            confidence *= 0.5 + (agreement / 200.0)

        return VideoAggregate(
            fake_probability=round(combined, 6),
            confidence=round(min(100.0, max(0.0, confidence)), 2),
            strategy=self._strategy,
            frames_analysed=len(verdicts),
            real_frames=self._count(verdicts, "REAL"),
            fake_frames=self._count(verdicts, "FAKE"),
            suspicious_frames=self._count_band(verdicts, "SUSPICIOUS"),
            manual_review_frames=self._count_band(verdicts, "NEEDS_MANUAL_REVIEW"),
            agreement=round(agreement, 2),
            consistent=agreement >= settings.VIDEO_FRAME_MIN_AGREEMENT,
            dominant_frame_number=dominant.frame_number,
        )

    # -- Internals -------------------------------------------------------------
    def _combine(
        self,
        verdicts: Sequence[FrameVerdict],
        probabilities: Sequence[float],
    ) -> float:
        if len(probabilities) == 1:
            return probabilities[0]
        if self._strategy == "max":
            return max(probabilities)
        if self._strategy == "weighted":
            # Confident frames carry more weight than hesitant ones.
            weights = [max(1.0, v.confidence) for v in verdicts]
            total = float(sum(weights))
            return sum(p * w for p, w in zip(probabilities, weights)) / total
        return sum(probabilities) / len(probabilities)

    @staticmethod
    def _count(verdicts: Sequence[FrameVerdict], label: str) -> int:
        return sum(1 for v in verdicts if v.prediction == label)

    @staticmethod
    def _count_band(verdicts, label: str) -> int:
        return sum(1 for v in verdicts if v.analytical_band == label)

    @staticmethod
    def _agreement(probabilities: Sequence[float]) -> float:
        if len(probabilities) < 2:
            return 100.0
        spread = pstdev(probabilities)
        return max(0.0, min(100.0, 100.0 * (1.0 - spread / 0.5)))
