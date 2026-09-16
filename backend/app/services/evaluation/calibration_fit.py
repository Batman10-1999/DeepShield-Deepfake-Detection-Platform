"""Validation-based temperature fitting.

The only statistically defensible way to change reported confidence is to
fit a single scalar temperature that minimises negative log-likelihood on
a *held-out validation split*, then reuse it at inference. This module
performs that fit and writes the result to weights/calibration.json,
which is the only file ConfidenceCalibrator will trust.

It refuses to produce a temperature without real labelled predictions.
"""
from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Sequence

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

_EPSILON = 1e-6


def _negative_log_likelihood(
    labels: Sequence[float],
    probabilities: Sequence[float],
    temperature: float,
) -> float:
    total = 0.0
    for label, probability in zip(labels, probabilities):
        clipped = min(max(probability, _EPSILON), 1.0 - _EPSILON)
        logit = math.log(clipped / (1.0 - clipped)) / temperature
        scaled = 1.0 / (1.0 + math.exp(-logit))
        scaled = min(max(scaled, _EPSILON), 1.0 - _EPSILON)
        total -= label * math.log(scaled) + (1.0 - label) * math.log(1.0 - scaled)
    return total / max(1, len(labels))


def fit_temperature(
    labels: Sequence[float],
    probabilities: Sequence[float],
    *,
    search_range: tuple[float, float] = (0.25, 5.0),
    steps: int = 96,
) -> tuple[float, float]:
    """Return (temperature, validation NLL) minimising NLL on this split."""
    if not labels or len(labels) != len(probabilities):
        raise ValueError("Temperature fitting requires matched, non-empty inputs.")
    if len({1 if l >= 0.5 else 0 for l in labels}) < 2:
        raise ValueError("Temperature fitting requires both classes.")

    low, high = search_range
    best = (1.0, _negative_log_likelihood(labels, probabilities, 1.0))
    for index in range(steps + 1):
        temperature = low + (high - low) * index / steps
        if temperature <= 0:
            continue
        nll = _negative_log_likelihood(labels, probabilities, temperature)
        if nll < best[1]:
            best = (round(temperature, 4), nll)
    return best[0], round(best[1], 6)


def save_calibration(
    temperature: float,
    *,
    fitted_on: str,
    samples: int,
    nll: float,
    path: Path | None = None,
) -> Path:
    target = path or settings.CALIBRATION_FILE
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({
        "temperature": temperature,
        "fitted_on": fitted_on,
        "samples": samples,
        "validation_nll": nll,
        "fitted_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "method": "temperature_scaling_nll_minimisation",
    }, indent=2))
    logger.info("Wrote fitted calibration T=%.4f to %s", temperature, target)
    return target
