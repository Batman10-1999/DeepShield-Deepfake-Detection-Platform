"""Manipulated-region extraction.

Thresholds a full-resolution Grad-CAM map and converts the resulting
blobs into bounding boxes ranked by activation energy. Each box carries
its own confidence (mean activation inside the contour) and the share of
the frame it covers, which the explainability summary turns into prose.
"""
from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from app.core.config import settings


@dataclass(frozen=True)
class DetectedRegion:
    """A suspicious area expressed in original-image pixels."""

    x: int
    y: int
    width: int
    height: int
    intensity: float          # peak activation, 0-1
    confidence: float         # mean activation inside the box, 0-100
    area_percentage: float    # share of the frame covered, 0-100
    label: str

    @property
    def area(self) -> int:
        return self.width * self.height


def extract_regions(
    cam: np.ndarray,
    *,
    threshold: float | None = None,
    max_regions: int | None = None,
) -> list[DetectedRegion]:
    """Return the most strongly activated regions of a CAM, ranked."""
    if cam.size == 0:
        return []

    level = threshold if threshold is not None else settings.GRADCAM_REGION_THRESHOLD
    limit = max_regions or settings.GRADCAM_MAX_REGIONS
    height, width = cam.shape[:2]
    frame_area = float(height * width) or 1.0
    min_area = frame_area * (settings.GRADCAM_MIN_REGION_AREA_PCT / 100.0)

    mask = (cam >= level).astype(np.uint8) * 255
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL,
                                   cv2.CHAIN_APPROX_SIMPLE)

    regions: list[DetectedRegion] = []
    for contour in contours:
        x, y, box_w, box_h = cv2.boundingRect(contour)
        if box_w * box_h < min_area:
            continue
        patch = cam[y:y + box_h, x:x + box_w]
        if patch.size == 0:
            continue
        regions.append(DetectedRegion(
            x=int(x), y=int(y), width=int(box_w), height=int(box_h),
            intensity=round(float(patch.max()), 3),
            confidence=round(float(patch.mean()) * 100.0, 2),
            area_percentage=round(box_w * box_h / frame_area * 100.0, 2),
            label="manipulated_region",
        ))

    regions.sort(key=lambda r: (r.intensity, r.area), reverse=True)
    return [
        DetectedRegion(**{**region.__dict__, "label": f"region_{index + 1}"})
        for index, region in enumerate(regions[:limit])
    ]


def manipulation_percentage(
    cam: np.ndarray, *, threshold: float | None = None
) -> float:
    """Share of the frame whose activation exceeds the region threshold."""
    if cam.size == 0:
        return 0.0
    level = threshold if threshold is not None else settings.GRADCAM_REGION_THRESHOLD
    return round(float((cam >= level).sum()) / float(cam.size) * 100.0, 2)


__all__ = ["DetectedRegion", "extract_regions", "manipulation_percentage"]
