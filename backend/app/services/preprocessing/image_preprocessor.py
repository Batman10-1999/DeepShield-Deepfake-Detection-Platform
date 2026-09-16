"""Image preprocessing pipeline.

Responsibilities:
    1. Load the image safely and force RGB.
    2. Apply the configured transform stages (denoise, aspect-aware
       resize, optional augmentation).
    3. Normalize into a CNN-ready tensor of shape [1, 3, H, W].

Face crops reuse the exact same pipeline, so a face tensor and a
full-frame tensor are always statistically comparable.
"""
from __future__ import annotations

from pathlib import Path
from typing import Tuple

import torch
from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.constants import LogEvent
from app.core.logger import get_logger
from app.models.schemas import ImagePreprocessResult
from app.services.preprocessing.transforms import ImagePipeline

logger = get_logger(__name__)

_PIPELINE = ImagePipeline()


def load_rgb_image(path: Path) -> Image.Image:
    """Open an image defensively and return an RGB copy."""
    try:
        with Image.open(path) as img:
            return img.convert("RGB").copy()
    except UnidentifiedImageError as exc:
        raise ValueError("Corrupted or unreadable image file.") from exc
    except OSError as exc:
        raise ValueError("The image file could not be read.") from exc


# Backwards-compatible internal alias.
_open_rgb = load_rgb_image


def preprocess_pil(
    image: Image.Image,
    *,
    pipeline: ImagePipeline | None = None,
) -> torch.Tensor:
    """Turn an in-memory PIL image into a normalized model tensor."""
    return (pipeline or _PIPELINE).run(image)


def preprocess_face(
    face_image: Image.Image,
    *,
    pipeline: ImagePipeline | None = None,
) -> torch.Tensor:
    """Preprocess a cropped face using the shared pipeline."""
    return preprocess_pil(face_image, pipeline=pipeline)


def preprocess_image(
    path: Path,
    *,
    pipeline: ImagePipeline | None = None,
) -> Tuple[torch.Tensor, ImagePreprocessResult]:
    """Run the full image preprocessing pipeline for a file on disk.

    Returns:
        tensor  – torch.Tensor of shape [1, 3, INPUT_SIZE, INPUT_SIZE]
        summary – ImagePreprocessResult describing what happened
    """
    active = pipeline or _PIPELINE
    logger.info("%s: %s", LogEvent.PREPROCESS_STARTED, path.name)
    image = load_rgb_image(path)
    original_w, original_h = image.size

    tensor = active.run(image)

    summary = ImagePreprocessResult(
        width=original_w,
        height=original_h,
        resized_to=active.input_size,
        channels=3,
        normalized=True,
        tensor_shape=list(tensor.shape),
        mean=list(settings.NORMALIZE_MEAN),
        std=list(settings.NORMALIZE_STD),
        aspect_ratio_preserved=active.preserve_aspect_ratio,
        stages=active.stage_names,
    )
    logger.info("%s: %s -> tensor %s via [%s]",
                LogEvent.PREPROCESS_COMPLETED, path.name,
                list(tensor.shape), ", ".join(active.stage_names))
    return tensor, summary
