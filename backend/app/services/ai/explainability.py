"""Explainability Layer.

Two providers implement one contract:

    GradCamExplainer   real activation maps, heatmap + overlay PNGs,
                       manipulated regions and a natural-language summary
    HeuristicExplainer score-driven textual fallback used when the active
                       backbone exposes no convolutional target layer
                       (Vision Transformer) or Grad-CAM is disabled

Callers only ever see `ExplanationResult`, so switching providers — or
adding a new one — never touches the prediction engine or the frontend.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Sequence

import torch
from PIL import Image

from app.core.config import settings
from app.core.constants import LogEvent
from app.core.logger import get_logger
from app.services.ai.explanation_summary import build_summary
from app.services.ai.gradcam import TARGET_LAYERS, GradCamEngine
from app.services.ai.heatmap_renderer import render
from app.services.ai.region_extractor import (
    DetectedRegion,
    extract_regions,
    manipulation_percentage,
)

logger = get_logger(__name__)


@dataclass(frozen=True)
class ManipulatedRegion:
    """Coordinates of a suspicious area, in original-image pixels."""
    x: int
    y: int
    width: int
    height: int
    intensity: float = 0.0            # 0-1, normalized activation energy
    label: Optional[str] = None
    confidence: float = 0.0           # 0-100, mean activation in the box
    area_percentage: float = 0.0      # 0-100, share of the frame covered


@dataclass(frozen=True)
class ExplanationResult:
    """Canonical explainability payload for every detection module."""
    method: str                                  # "heuristic" | "grad_cam"
    target_layer: Optional[str] = None
    heatmap_base64: Optional[str] = None
    overlay_base64: Optional[str] = None
    reasons: list[str] = field(default_factory=list)
    available: bool = False
    heatmap_shape: Optional[list[int]] = None    # [H, W] of the rendered map
    regions: list[ManipulatedRegion] = field(default_factory=list)
    overlay_opacity: float = 0.45
    confidence_overlay: Optional[float] = None
    summary: Optional[str] = None
    most_suspicious_region: Optional[str] = None
    manipulation_percentage: float = 0.0
    confidence_explanation: Optional[str] = None
    model_explanation: Optional[str] = None
    generation_time_ms: float = 0.0


class ExplainabilityProvider(ABC):
    """Interface every explainability strategy must implement."""

    method: str = "abstract"

    @abstractmethod
    def explain(
        self,
        *,
        tensor: torch.Tensor,
        fake_percentage: float,
        model_name: str,
        regions: Optional[Sequence[ManipulatedRegion]] = None,
        image: Optional[Image.Image] = None,
        confidence: float = 0.0,
    ) -> ExplanationResult:
        """Produce explanation metadata for one analysed input."""
        raise NotImplementedError


class HeuristicExplainer(ExplainabilityProvider):
    """Score-driven textual explanation used when Grad-CAM is unavailable."""

    method = "heuristic"

    TARGET_LAYERS: dict[str, str] = dict(TARGET_LAYERS)

    def explain(
        self,
        *,
        tensor: torch.Tensor,
        fake_percentage: float,
        model_name: str,
        regions: Optional[Sequence[ManipulatedRegion]] = None,
        image: Optional[Image.Image] = None,
        confidence: float = 0.0,
    ) -> ExplanationResult:
        intensity = max(0.0, min(1.0, fake_percentage / 100.0))
        seeded = [
            ManipulatedRegion(
                x=r.x, y=r.y, width=r.width, height=r.height,
                intensity=r.intensity or intensity,
                label=r.label or "face_region",
                confidence=r.confidence,
                area_percentage=r.area_percentage,
            )
            for r in (regions or [])
        ]
        return ExplanationResult(
            method=self.method,
            target_layer=self.TARGET_LAYERS.get(model_name),
            heatmap_base64=None,
            reasons=self._reasons_for(fake_percentage),
            available=False,
            heatmap_shape=list(tensor.shape[-2:]) if tensor is not None else None,
            regions=seeded,
            overlay_opacity=round(0.25 + 0.5 * intensity, 2),
            confidence_overlay=round(fake_percentage, 2),
        )

    @staticmethod
    def _reasons_for(fake_percentage: float) -> list[str]:
        if fake_percentage >= 60:
            return [
                "High manipulation energy concentrated in facial regions.",
                "Texture statistics deviate from natural sensor noise.",
                "Edge transitions show synthesis-like smoothing.",
            ]
        if fake_percentage >= 40:
            return [
                "Mixed authenticity signals across the image.",
                "Localized irregularities detected in mid-frequency detail.",
            ]
        return [
            "Consistent sensor noise across the frame.",
            "Natural lighting and edge coherence detected.",
        ]


class GradCamExplainer(ExplainabilityProvider):
    """Real Grad-CAM explanations, with a heuristic safety net."""

    method = "grad_cam"

    def __init__(
        self,
        engine: GradCamEngine | None = None,
        fallback: ExplainabilityProvider | None = None,
    ) -> None:
        self._engine = engine or GradCamEngine()
        self._fallback = fallback or HeuristicExplainer()

    def explain(
        self,
        *,
        tensor: torch.Tensor,
        fake_percentage: float,
        model_name: str,
        regions: Optional[Sequence[ManipulatedRegion]] = None,
        image: Optional[Image.Image] = None,
        confidence: float = 0.0,
    ) -> ExplanationResult:
        if image is None or not self._engine.supports(model_name):
            return self._fallback.explain(
                tensor=tensor, fake_percentage=fake_percentage,
                model_name=model_name, regions=regions, image=image,
                confidence=confidence,
            )

        logger.info("%s: %s", LogEvent.GRADCAM_STARTED, model_name)
        cam_result = self._engine.generate(tensor)
        if cam_result is None:
            logger.warning("%s: falling back to heuristic explanation",
                           LogEvent.GRADCAM_FAILED)
            return self._fallback.explain(
                tensor=tensor, fake_percentage=fake_percentage,
                model_name=model_name, regions=regions, image=image,
                confidence=confidence,
            )

        rendered = render(
            image,
            cam_result.cam,
            regions=regions,
        )
        detected = extract_regions(rendered.cam)
        coverage = manipulation_percentage(rendered.cam)
        summary = build_summary(
            regions=detected,
            manipulation_percentage=coverage,
            fake_percentage=fake_percentage,
            confidence=confidence,
            model_name=model_name,
            target_layer=cam_result.target_layer,
        )
        logger.info(
            "%s: layer=%s regions=%d coverage=%.1f%% in %.0fms",
            LogEvent.GRADCAM_COMPLETED, cam_result.target_layer,
            len(detected), coverage, cam_result.duration_ms,
        )

        return ExplanationResult(
            method=self.method,
            target_layer=cam_result.target_layer,
            heatmap_base64=rendered.heatmap_base64,
            overlay_base64=rendered.overlay_base64,
            reasons=summary.reasons,
            available=True,
            heatmap_shape=[rendered.height, rendered.width],
            regions=(
            list(regions)
            if regions
            else [self._to_region(r) for r in detected]
        ),
            overlay_opacity=rendered.opacity,
            confidence_overlay=round(fake_percentage, 2),
            summary=summary.summary,
            most_suspicious_region=summary.most_suspicious_region,
            manipulation_percentage=summary.manipulation_percentage,
            confidence_explanation=summary.confidence_explanation,
            model_explanation=summary.model_explanation,
            generation_time_ms=cam_result.duration_ms,
        )

    @staticmethod
    def _to_region(region: DetectedRegion) -> ManipulatedRegion:
        return ManipulatedRegion(
            x=region.x, y=region.y, width=region.width, height=region.height,
            intensity=region.intensity, label=region.label,
            confidence=region.confidence,
            area_percentage=region.area_percentage,
        )


def get_explainer(model_name: str | None = None) -> ExplainabilityProvider:
    """Factory — returns the explainability strategy for the active model."""
    if not settings.GRADCAM_ENABLED:
        return HeuristicExplainer()
    return GradCamExplainer()


__all__ = [
    "ExplainabilityProvider",
    "ExplanationResult",
    "GradCamExplainer",
    "HeuristicExplainer",
    "ManipulatedRegion",
    "get_explainer",
]
