"""Risk Assessor.

Maps a 0-100 authenticity score to a human-readable risk band and to a
final prediction label. Kept isolated so risk logic can evolve
independently from model or API code.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.core.config import settings


RiskLevel = Literal["Very Low", "Low", "Medium", "High", "Critical"]
Prediction = Literal["REAL", "SUSPICIOUS", "FAKE"]


@dataclass(frozen=True)
class RiskBand:
    prediction: Prediction
    risk_level: RiskLevel
    description: str


class RiskAssessor:
    """Reusable risk classifier.

    Bands (based on authenticity score, higher = more real):
        95-100  -> REAL         / Very Low Risk
        80-95   -> REAL         / Low Risk
        60-80   -> SUSPICIOUS   / Medium Risk
        40-60   -> SUSPICIOUS   / High Risk
        <40     -> FAKE         / Critical
    """

    @staticmethod
    def classify(authenticity_score: float) -> RiskBand:
        score = max(0.0, min(100.0, float(authenticity_score)))

        if score >= settings.RISK_VERY_LOW_MIN:
            return RiskBand("REAL", "Very Low",
                            "Media appears authentic with very high confidence.")
        if score >= settings.RISK_LOW_MIN:
            return RiskBand("REAL", "Low",
                            "Media appears authentic.")
        if score >= settings.RISK_MEDIUM_MIN:
            return RiskBand("SUSPICIOUS", "Medium",
                            "Media shows minor signs of manipulation.")
        if score >= settings.RISK_HIGH_MIN:
            return RiskBand("SUSPICIOUS", "High",
                            "Media shows strong signs of manipulation.")
        return RiskBand("FAKE", "Critical",
                        "Media is very likely a deepfake.")
