"""Heatmap rendering.

Turns a normalized Grad-CAM map into artefacts the frontend can display:

    cam (h x w) -> full-resolution map -> coloured heatmap PNG
                                       -> blended overlay PNG

The CAM is produced from a letterboxed square tensor, so the padding
bands are removed before the map is stretched back onto the original
image. That keeps the overlay perfectly aligned and distortion-free at
any aspect ratio.
"""
from __future__ import annotations

import base64
from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image

from app.core.config import settings

_COLORMAPS: dict[str, int] = {
    "jet": cv2.COLORMAP_JET,
    "turbo": cv2.COLORMAP_TURBO,
    "inferno": cv2.COLORMAP_INFERNO,
    "magma": cv2.COLORMAP_MAGMA,
}


@dataclass(frozen=True)
class HeatmapRender:
    """Rendered explainability artefacts for one image."""

    cam: np.ndarray            # [H, W] float32 in [0, 1], original resolution
    heatmap_base64: str        # coloured CAM, PNG payload
    overlay_base64: str        # CAM blended over the original image
    width: int
    height: int
    opacity: float


def content_box(
    original_size: tuple[int, int], input_size: int
) -> tuple[int, int, int, int]:
    """Region of the square model canvas actually covered by the image."""
    width, height = original_size
    if width <= 0 or height <= 0:
        return 0, 0, input_size, input_size
    if not settings.PRESERVE_ASPECT_RATIO:
        return 0, 0, input_size, input_size

    scale = input_size / max(width, height)
    scaled_w = max(1, round(width * scale))
    scaled_h = max(1, round(height * scale))
    return ((input_size - scaled_w) // 2, (input_size - scaled_h) // 2,
            scaled_w, scaled_h)


def upscale_cam(cam: np.ndarray, image_size: tuple[int, int]) -> np.ndarray:
    """Project a low-resolution CAM back onto the original image grid."""
    input_size = settings.INPUT_SIZE
    square = cv2.resize(cam, (input_size, input_size),
                        interpolation=cv2.INTER_CUBIC)
    x, y, box_w, box_h = content_box(image_size, input_size)
    cropped = square[y:y + box_h, x:x + box_w]
    if cropped.size == 0:
        cropped = square

    full = cv2.resize(cropped, image_size, interpolation=cv2.INTER_CUBIC)
    blur = settings.GRADCAM_BLUR_KERNEL
    if blur >= 3 and blur % 2 == 1:
        full = cv2.GaussianBlur(full, (blur, blur), 0)

    full = np.clip(full, 0.0, None)
    peak = float(full.max()) or 1.0
    return (full / peak).astype(np.float32)


def colorize(cam: np.ndarray) -> np.ndarray:
    """Apply the configured colormap; returns a BGR uint8 image."""
    colormap = _COLORMAPS.get(settings.GRADCAM_COLORMAP, cv2.COLORMAP_JET)
    return cv2.applyColorMap((cam * 255.0).astype(np.uint8), colormap)


def render(
    image: Image.Image,
    cam: np.ndarray,
    *,
    opacity: float | None = None,
) -> HeatmapRender:
    """Produce the full-resolution CAM plus heatmap and overlay PNGs."""
    rgb = np.asarray(image.convert("RGB"))
    height, width = rgb.shape[:2]
    blend = _clamp_opacity(
        settings.GRADCAM_OVERLAY_OPACITY if opacity is None else opacity)

    full_cam = upscale_cam(cam, (width, height))
    heatmap_bgr = colorize(full_cam)
    base_bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

    # Weight the blend by activation so calm regions keep their detail.
    mask = full_cam[..., None] * blend
    overlay_bgr = (base_bgr * (1.0 - mask) + heatmap_bgr * mask).astype(np.uint8)

    return HeatmapRender(
        cam=full_cam,
        heatmap_base64=encode_png(heatmap_bgr),
        overlay_base64=encode_png(overlay_bgr),
        width=width,
        height=height,
        opacity=round(blend, 2),
    )


def encode_png(bgr_image: np.ndarray) -> str:
    """Encode a BGR image as a base64 PNG string (no data-URI prefix)."""
    success, buffer = cv2.imencode(".png", bgr_image)
    if not success:
        raise ValueError("Heatmap could not be encoded as PNG.")
    return base64.b64encode(buffer.tobytes()).decode("ascii")


def _clamp_opacity(value: float) -> float:
    return float(max(0.0, min(1.0, value)))


__all__ = ["HeatmapRender", "colorize", "content_box", "encode_png",
           "render", "upscale_cam"]
