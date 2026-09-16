"""Confidence Calibration Layer.

Turns the raw FAKE probability produced by the CNN into the pair of class
probabilities and the single confidence value the rest of DeepShield
consumes.

Engineering rules enforced here:

  * Confidence is the posterior probability of the predicted class,
    ``max(p_fake, p_real) * 100``. It is a property of the model, not a
    presentation value. No gain, stretch or floor is applied.
  * The only transformation allowed is temperature scaling, and only with
    a temperature that was *fitted on a labelled validation split*
    (see ``app.services.evaluation.calibration_fit``). Until such a file
    exists the temperature is 1.0, which is a mathematical no-op.
  * Because the shipped backbone is an ImageNet classifier, its outputs
    sit close to the 0.5 boundary and therefore report confidences close
    to 50%. That is the honest reading of an untrained detector and must
    not be hidden.

Pipeline:
    raw fake probability
        -> sanitize (NaN / out-of-range guard)
        -> temperature scaling (identity unless a fitted T is loaded)
        -> confidence = posterior of the predicted class, 0-100
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

DEFAULT_TEMPERATURE = 1.0
NEUTRAL_PROBABILITY = 0.5


@dataclass(frozen=True)
class CalibratedProbability:
    """Calibrated model output, ready for scoring."""
    fake_probability: float      # 0..1
    real_probability: float      # 0..1
    confidence: float            # 0..100
    raw_fake_probability: float  # 0..1, before calibration
    method: str                  # e.g. "identity(T=1)" or "temperature_scaling(T=1.42, fitted)"


@dataclass(frozen=True)
class CalibrationProfile:
    """Where the active temperature came from."""
    temperature: float
    source: str          # "default" | "environment" | "validation_fit"
    fitted_on: Optional[str] = None   # dataset/split identifier
    fitted_at: Optional[str] = None
    samples: Optional[int] = None

    @property
    def is_fitted(self) -> bool:
        return self.source == "validation_fit"


def sanitize_probability(value: float) -> float:
    """Clamp any model output into a usable [0, 1] probability."""
    try:
        probability = float(value)
    except (TypeError, ValueError):
        return NEUTRAL_PROBABILITY
    if math.isnan(probability) or math.isinf(probability):
        return NEUTRAL_PROBABILITY
    return max(0.0, min(1.0, probability))


def load_calibration_profile(path: Path | None = None) -> CalibrationProfile:
    """Read a fitted temperature, falling back to the identity transform."""
    target = path or settings.CALIBRATION_FILE
    if not target.exists():
        return CalibrationProfile(
            temperature=float(settings.CALIBRATION_TEMPERATURE),
            source="environment"
            if settings.CALIBRATION_TEMPERATURE != DEFAULT_TEMPERATURE
            else "default",
        )
    try:
        payload = json.loads(target.read_text())
        temperature = float(payload["temperature"])
        if temperature <= 0:
            raise ValueError("non-positive temperature")
        return CalibrationProfile(
            temperature=temperature,
            source="validation_fit",
            fitted_on=payload.get("fitted_on"),
            fitted_at=payload.get("fitted_at"),
            samples=payload.get("samples"),
        )
    except Exception as exc:
        logger.warning("Ignoring unusable calibration file %s: %s", target, exc)
        return CalibrationProfile(temperature=DEFAULT_TEMPERATURE, source="default")


class ConfidenceCalibrator:
    """Reusable calibration service shared by every DeepShield model.

    Temperature scaling is applied in logit space:

        z  = logit(p)          # invert the sigmoid
        p' = sigmoid(z / T)    # T > 1 softens, T < 1 sharpens

    T is only ever different from 1.0 when a validation-fitted value has
    been written to ``weights/calibration.json``.
    """

    _EPSILON = 1e-6

    def __init__(
        self,
        temperature: float | None = None,
        *,
        profile: CalibrationProfile | None = None,
    ) -> None:
        if temperature is not None:
            resolved = CalibrationProfile(float(temperature), source="explicit")
        else:
            resolved = profile or load_calibration_profile()
        if resolved.temperature <= 0:
            raise ValueError("Calibration temperature must be positive.")
        self._profile = resolved

    @property
    def temperature(self) -> float:
        return self._profile.temperature

    @property
    def profile(self) -> CalibrationProfile:
        return self._profile

    def calibrate(self, raw_fake_probability: float) -> CalibratedProbability:
        raw = sanitize_probability(raw_fake_probability)
        fake = self._apply_temperature(raw)
        return CalibratedProbability(
            fake_probability=fake,
            real_probability=1.0 - fake,
            confidence=self._confidence_from(fake),
            raw_fake_probability=raw,
            method=self._method_label(),
        )

    # -- internals ------------------------------------------------------------
    def _method_label(self) -> str:
        if self._profile.temperature == 1.0:
            return "identity(T=1, uncalibrated)"
        return (f"temperature_scaling(T={self._profile.temperature:g}, "
                f"source={self._profile.source})")

    def _apply_temperature(self, probability: float) -> float:
        if self._profile.temperature == 1.0:
            return probability
        clipped = min(max(probability, self._EPSILON), 1.0 - self._EPSILON)
        logit = math.log(clipped / (1.0 - clipped))
        return 1.0 / (1.0 + math.exp(-logit / self._profile.temperature))

    @staticmethod
    def _confidence_from(fake_probability: float) -> float:
        """Posterior probability of the predicted class, as 0-100.

        A model that outputs 0.52 is 52% confident. Reporting anything
        higher would misrepresent the classifier.
        """
        posterior = max(fake_probability, 1.0 - fake_probability)
        return round(posterior * 100.0, settings.CONFIDENCE_DECIMALS)
