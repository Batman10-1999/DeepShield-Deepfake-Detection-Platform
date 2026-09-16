"""Explainability summary.

Converts Grad-CAM measurements into the plain-language narrative the
dashboard shows next to the heatmap. Kept free of tensors and images so
it can be unit-tested and reused by the video pipeline unchanged.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

from app.services.ai.region_extractor import DetectedRegion

_MODEL_DESCRIPTIONS: dict[str, str] = {
    "efficientnet_b0": "EfficientNet-B0 convolutional backbone",
    "resnet50": "ResNet-50 residual backbone",
    "xception": "Xception-style separable convolutional backbone",
    "vit_b16": "ViT-B/16 transformer backbone",
}


@dataclass(frozen=True)
class ExplanationSummary:
    """Human-readable interpretation of one Grad-CAM result."""

    summary: str
    most_suspicious_region: str | None
    manipulation_percentage: float
    confidence_explanation: str
    model_explanation: str
    reasons: list[str]


def build_summary(
    *,
    regions: Sequence[DetectedRegion],
    manipulation_percentage: float,
    fake_percentage: float,
    confidence: float,
    model_name: str,
    target_layer: str,
) -> ExplanationSummary:
    dominant = regions[0] if regions else None
    backbone = _MODEL_DESCRIPTIONS.get(model_name, model_name)

    return ExplanationSummary(
        summary=_narrative(dominant, manipulation_percentage, fake_percentage),
        most_suspicious_region=_describe_region(dominant),
        manipulation_percentage=round(manipulation_percentage, 2),
        confidence_explanation=_confidence_sentence(confidence, fake_percentage),
        model_explanation=(
            f"Activations were read from the {backbone} at layer "
            f"'{target_layer}', the deepest feature map before classification."
        ),
        reasons=_reasons(regions, manipulation_percentage, fake_percentage),
    )


def _narrative(
    dominant: DetectedRegion | None,
    manipulation_percentage: float,
    fake_percentage: float,
) -> str:
    if dominant is None:
        return (
            "Grad-CAM found no concentrated activation: the model's attention "
            "is spread evenly across the frame, which is typical of authentic "
            "media."
        )
    verdict = (
        "strongly manipulated" if fake_percentage >= 60
        else "partially inconsistent" if fake_percentage >= 40
        else "largely consistent"
    )
    return (
        f"The model considers this media {verdict}. Attention peaks over a "
        f"{dominant.width}x{dominant.height}px area at ({dominant.x}, "
        f"{dominant.y}), covering {dominant.area_percentage:.1f}% of the frame; "
        f"{manipulation_percentage:.1f}% of all pixels exceed the activation "
        "threshold."
    )


def _describe_region(dominant: DetectedRegion | None) -> str | None:
    if dominant is None:
        return None
    return (
        f"{dominant.width}x{dominant.height}px at ({dominant.x}, {dominant.y}) "
        f"— {dominant.confidence:.1f}% activation"
    )


def _confidence_sentence(confidence: float, fake_percentage: float) -> str:
    strength = (
        "high" if confidence >= 80
        else "moderate" if confidence >= 60
        else "low"
    )
    return (
        f"Confidence is {confidence:.1f}% ({strength}); the calibrated fake "
        f"probability is {fake_percentage:.1f}%."
    )


def _reasons(
    regions: Sequence[DetectedRegion],
    manipulation_percentage: float,
    fake_percentage: float,
) -> list[str]:
    reasons: list[str] = []
    if regions:
        reasons.append(
            f"{len(regions)} activated region(s) isolated by Grad-CAM, "
            f"strongest at {regions[0].confidence:.1f}% activation."
        )
    if manipulation_percentage >= 25:
        reasons.append(
            f"{manipulation_percentage:.1f}% of the frame exceeds the "
            "manipulation activation threshold."
        )
    else:
        reasons.append(
            f"Only {manipulation_percentage:.1f}% of the frame is highly "
            "activated, indicating localized rather than global influence."
        )
    if fake_percentage >= 60:
        reasons.append("Synthesis-like texture and edge statistics dominate "
                       "the highlighted areas.")
    elif fake_percentage >= 40:
        reasons.append("Mixed authenticity signals: highlighted areas disagree "
                       "with the surrounding frame.")
    else:
        reasons.append("Highlighted areas remain consistent with natural "
                       "sensor noise and lighting.")
    return reasons


__all__ = ["ExplanationSummary", "build_summary"]
