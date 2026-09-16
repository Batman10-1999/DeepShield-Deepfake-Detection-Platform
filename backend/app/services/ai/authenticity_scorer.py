"""Authenticity Scoring Engine.

Single owner of the "how authentic is this media?" question. Turns a
calibrated FAKE probability into the 0-100 authenticity score that the
whole product (UI, certificate, risk assessor) is built around.

Kept model-agnostic and media-agnostic so image, video (frame
aggregation) and future audio modules all reuse the same scale.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Sequence

from app.services.ai.confidence_calibrator import (
    CalibratedProbability,
    sanitize_probability,
)

MediaType = Literal["image", "video", "audio"]


@dataclass(frozen=True)
class AuthenticityScore:
    authenticity_score: float   # 0-100, higher = more real
    fake_percentage: float      # 0-100
    confidence: float           # 0-100, how strongly the model commits
    media_type: MediaType = "image"


class AuthenticityScorer:
    """Reusable scoring engine: probability -> 0-100 authenticity."""

    @staticmethod
    def from_calibrated(
        calibrated: CalibratedProbability,
        *,
        media_type: MediaType = "image",
    ) -> AuthenticityScore:
        """Preferred entry point — consumes the calibration layer output."""
        fake_percentage = round(calibrated.fake_probability * 100.0, 2)
        return AuthenticityScore(
            authenticity_score=round(100.0 - fake_percentage, 2),
            fake_percentage=fake_percentage,
            confidence=round(calibrated.confidence, 2),
            media_type=media_type,
        )

    @classmethod
    def score(
        cls,
        fake_probability: float,
        *,
        confidence: float | None = None,
        media_type: MediaType = "image",
    ) -> AuthenticityScore:
        """Score a bare probability (back-compatible convenience API)."""
        fake = sanitize_probability(fake_probability)
        fake_percentage = round(fake * 100.0, 2)
        authenticity = round(100.0 - fake_percentage, 2)
        committed = round(max(fake_percentage, authenticity), 2)
        return AuthenticityScore(
            authenticity_score=authenticity,
            fake_percentage=fake_percentage,
            confidence=round(confidence, 2) if confidence is not None else committed,
            media_type=media_type,
        )

    @classmethod
    def aggregate(
        cls,
        fake_probabilities: Sequence[float],
        *,
        media_type: MediaType = "video",
    ) -> AuthenticityScore:
        """Aggregate many per-frame probabilities into one score.

        Used by the future video module: the mean probability is the most
        stable estimator across sampled frames.
        """
        if not fake_probabilities:
            raise ValueError("Cannot aggregate an empty probability sequence.")
        sanitized = [sanitize_probability(p) for p in fake_probabilities]
        mean_fake = sum(sanitized) / len(sanitized)
        return cls.score(mean_fake, media_type=media_type)
