"""Singleton model loader.

Responsibility: own exactly one instantiated model per process and the
metadata describing it. Architecture details live in
`app.services.ai.model_registry`, so swapping EfficientNet for ResNet,
Xception or a Vision Transformer never touches this file.

The active EfficientNet-B0 model uses the external pretrained
DeepfakeDetector checkpoint:
    models/best_model-v3.pt
"""
from __future__ import annotations

import time
from typing import Optional

import torch
from torch import nn

from app.core.config import settings
from app.core.constants import LogEvent
from app.core.logger import get_logger
from app.services.ai.model_registry import (  # re-exported for compatibility
    MODEL_REGISTRY,
    ModelSpec,
    build_model,
    get_spec,
)

logger = get_logger(__name__)

__all__ = ["ModelLoader", "MODEL_REGISTRY", "ModelSpec"]


class ModelLoader:
    """Process-wide singleton holding the active model."""

    _instance: Optional["ModelLoader"] = None

    def __init__(self) -> None:
        self._model: Optional[nn.Module] = None
        self._spec: Optional[ModelSpec] = None
        self._device: torch.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        self.model_name: Optional[str] = None
        self.load_time_ms: float = 0.0
        self.weights_source: str = "none"

    # -- Singleton accessor ----------------------------------------------------

    @classmethod
    def get_instance(cls) -> "ModelLoader":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # -- Public API ------------------------------------------------------------

    def load(self, model_name: str) -> None:
        """Build the architecture and load weights exactly once."""

        if self._model is not None and self.model_name == model_name:
            logger.info(
                "Model already loaded — reusing cached instance: %s",
                model_name,
            )
            return

        spec = get_spec(model_name)

        logger.info(
            "%s: %s (%s)",
            LogEvent.MODEL_LOADING,
            spec.display_name,
            spec.family,
        )

        started = time.perf_counter()

        try:
            # Architecture matches the external DeepfakeDetector checkpoint:
            # EfficientNet-B0 + 2-class classifier.
            model = build_model(model_name, pretrained=True)
            self.weights_source = "imagenet_pretrained_backbone"

        except Exception as exc:
            logger.exception(
                "%s: %s",
                LogEvent.MODEL_LOAD_FAILED,
                exc,
            )
            raise

        # Replace the ImageNet weights with the actual pretrained
        # deepfake-detection checkpoint.
        self._apply_finetuned_weights(model, model_name)

        model.eval().to(self._device)

        self._model = model
        self._spec = spec
        self.model_name = model_name

        self.load_time_ms = round(
            (time.perf_counter() - started) * 1000.0,
            2,
        )

        logger.info(
            "%s: %s on %s (source=%s, load_time=%.2fms)",
            LogEvent.MODEL_LOADED,
            spec.display_name,
            self._device,
            self.weights_source,
            self.load_time_ms,
        )

    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def device(self) -> torch.device:
        return self._device

    @property
    def spec(self) -> Optional[ModelSpec]:
        return self._spec

    @property
    def input_size(self) -> int:
        return (
            self._spec.input_size
            if self._spec
            else settings.INPUT_SIZE
        )

    @property
    def model(self) -> nn.Module:
        if self._model is None:
            raise RuntimeError("Model has not been loaded yet.")

        return self._model

    # -- Internals -------------------------------------------------------------

    def _apply_finetuned_weights(
        self,
        model: nn.Module,
        model_name: str,
    ) -> None:
        """Load the external pretrained deepfake checkpoint."""

        # Actual checkpoint location:
        # backend/models/best_model-v3.pt
        weights_path = settings.MODELS_DIR / "best_model-v3.pt"

        if not weights_path.exists():
            logger.error(
                "Deepfake checkpoint not found: %s",
                weights_path,
            )
            raise FileNotFoundError(
                f"Required deepfake checkpoint not found: {weights_path}"
            )

        try:
            logger.info(
                "Loading external deepfake checkpoint: %s",
                weights_path,
            )

            state = torch.load(
                weights_path,
                map_location=self._device,
                weights_only=True,
            )

            if not isinstance(state, dict):
                raise TypeError(
                    "Deepfake checkpoint must contain a state_dict."
                )

            # strict=True is intentional.
            # It ensures the architecture and checkpoint match exactly
            # instead of silently ignoring incompatible layers.
            model.load_state_dict(
                state,
                strict=True,
            )

            self.weights_source = "external_pretrained_deepfake_checkpoint"

            logger.info(
                "Successfully loaded deepfake checkpoint: %s",
                weights_path,
            )

        except Exception as exc:
            logger.exception(
                "Failed to load deepfake checkpoint %s: %s",
                weights_path,
                exc,
            )
            raise