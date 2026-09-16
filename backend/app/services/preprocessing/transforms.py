"""Composable image transform pipeline.

Each concern is a small, independently testable callable so a stage can
be added (augmentation) or disabled (denoising) through configuration
without rewriting the preprocessor.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Protocol

import torch
from PIL import Image, ImageFilter
from torchvision import transforms

from app.core.config import settings

PILTransform = Callable[[Image.Image], Image.Image]


class ImageStage(Protocol):
    name: str

    def __call__(self, image: Image.Image) -> Image.Image: ...


@dataclass(frozen=True)
class NamedStage:
    name: str
    apply: PILTransform

    def __call__(self, image: Image.Image) -> Image.Image:
        return self.apply(image)


def to_rgb(image: Image.Image) -> Image.Image:
    return image if image.mode == "RGB" else image.convert("RGB")


def letterbox(image: Image.Image, size: int) -> Image.Image:
    """Resize preserving aspect ratio, then pad to a square canvas.

    Squashing a portrait photo into a square distorts facial geometry —
    exactly the signal a deepfake detector relies on — so aspect ratio
    is preserved by default.
    """
    src_w, src_h = image.size
    if src_w == 0 or src_h == 0:
        raise ValueError("Image has zero dimensions.")
    scale = size / max(src_w, src_h)
    new_w, new_h = max(1, round(src_w * scale)), max(1, round(src_h * scale))
    resized = image.resize((new_w, new_h), Image.BICUBIC)
    canvas = Image.new("RGB", (size, size), settings.PADDING_COLOR)
    canvas.paste(resized, ((size - new_w) // 2, (size - new_h) // 2))
    return canvas


def stretch_resize(image: Image.Image, size: int) -> Image.Image:
    return image.resize((size, size), Image.BICUBIC)


def denoise(image: Image.Image) -> Image.Image:
    """Light median filter that suppresses compression speckle.

    Deliberately gentle: aggressive denoising destroys the sensor-noise
    fingerprint the detector depends on.
    """
    return image.filter(ImageFilter.MedianFilter(size=3))


def identity(image: Image.Image) -> Image.Image:
    return image


def build_augmentation(enabled: bool = False) -> PILTransform:
    """Hook for future train-time augmentation; inference is a no-op."""
    if not enabled:
        return identity
    return transforms.Compose([
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
    ])


@dataclass(frozen=True)
class TensorNormalizer:
    """PIL image -> normalized [1, 3, H, W] tensor."""

    mean: tuple[float, float, float] = settings.NORMALIZE_MEAN
    std: tuple[float, float, float] = settings.NORMALIZE_STD

    def __call__(self, image: Image.Image) -> torch.Tensor:
        pipeline = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=list(self.mean), std=list(self.std)),
        ])
        return pipeline(image).unsqueeze(0)


class ImagePipeline:
    """Ordered PIL stages followed by tensor normalization."""

    def __init__(
        self,
        *,
        input_size: int | None = None,
        preserve_aspect_ratio: bool | None = None,
        denoise_enabled: bool | None = None,
        augment: bool = False,
    ) -> None:
        self.input_size = input_size or settings.INPUT_SIZE
        self.preserve_aspect_ratio = (
            settings.PRESERVE_ASPECT_RATIO
            if preserve_aspect_ratio is None else preserve_aspect_ratio
        )
        self.denoise_enabled = (
            settings.DENOISE_ENABLED if denoise_enabled is None else denoise_enabled
        )
        self.augment = augment
        self._normalizer = TensorNormalizer()

    @property
    def stages(self) -> list[NamedStage]:
        resize: PILTransform = (
            (lambda img: letterbox(img, self.input_size))
            if self.preserve_aspect_ratio
            else (lambda img: stretch_resize(img, self.input_size))
        )
        pipeline = [NamedStage("rgb_conversion", to_rgb)]
        if self.denoise_enabled:
            pipeline.append(NamedStage("noise_reduction", denoise))
        pipeline.append(NamedStage(
            "aspect_preserving_resize" if self.preserve_aspect_ratio
            else "resize", resize,
        ))
        if self.augment:
            pipeline.append(NamedStage("augmentation", build_augmentation(True)))
        return pipeline

    @property
    def stage_names(self) -> list[str]:
        return [stage.name for stage in self.stages] + ["tensor_normalization"]

    def run(self, image: Image.Image) -> torch.Tensor:
        processed = image
        for stage in self.stages:
            processed = stage(processed)
        return self._normalizer(processed)
