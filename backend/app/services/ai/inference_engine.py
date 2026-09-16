"""Inference Engine.

Receives a preprocessed tensor, runs it through the currently loaded
model, and returns the raw probability of the input being FAKE.

This layer is intentionally thin and UI-independent so it can be reused
by every future detection module (image, video frames, audio spectrograms).
"""
from __future__ import annotations

import time
from dataclasses import dataclass

import torch

from app.core.constants import LogEvent
from app.core.logger import get_logger
from app.services.model_loader import ModelLoader

logger = get_logger(__name__)


@dataclass(frozen=True)
class InferenceResult:
    """Raw output of a single forward pass, before business logic."""
    fake_probability: float          # in [0.0, 1.0]
    real_probability: float          # in [0.0, 1.0]
    model_name: str
    device: str
    inference_time_ms: float


class InferenceEngine:
    """Stateless wrapper around the loaded CNN.

    The model itself is owned by `ModelLoader` (singleton, loaded once
    at startup). This class provides a single, reusable entry point
    that future modules call — no module should ever touch the model
    directly.
    """

    def __init__(self, loader: ModelLoader | None = None) -> None:
        self._loader = loader or ModelLoader.get_instance()

    def is_ready(self) -> bool:
        return self._loader.is_loaded()

    def run(self, tensor: torch.Tensor) -> InferenceResult:
        """Run a forward pass on a preprocessed input tensor.

        Args:
            tensor: shape [1, C, H, W] — already normalized by the
                preprocessing layer.

        Returns:
            InferenceResult with class probabilities and timing.
        """
        if not self._loader.is_loaded():
            raise RuntimeError("AI model is not loaded.")

        model = self._loader.model
        device = self._loader.device
        tensor = tensor.to(device)

        logger.info("%s: model=%s device=%s shape=%s",
                    LogEvent.INFERENCE_STARTED,
                    self._loader.model_name, device, list(tensor.shape))
        started = time.perf_counter()
        with torch.inference_mode():
            logits = model(tensor)
            fake_prob = torch.softmax(logits, dim=1).flatten()[0].item()
        elapsed_ms = round((time.perf_counter() - started) * 1000.0, 2)

        fake_prob = float(max(0.0, min(1.0, fake_prob)))
        real_prob = 1.0 - fake_prob

        logger.info(
            "%s: fake=%.4f real=%.4f model=%s time=%.2fms",
            LogEvent.INFERENCE_COMPLETED,
            fake_prob, real_prob, self._loader.model_name, elapsed_ms,
        )
        return InferenceResult(
            fake_probability=fake_prob,
            real_probability=real_prob,
            model_name=self._loader.model_name or "unknown",
            device=str(device),
            inference_time_ms=elapsed_ms,
        )
