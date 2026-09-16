"""Grad-CAM engine.

Produces a class-activation map for the currently loaded backbone by
hooking one convolutional layer, capturing its activations during the
forward pass and its gradients during a backward pass on the FAKE logit.

The engine knows nothing about images, colours or API payloads: it
returns a normalized 2-D activation map. Rendering lives in
`heatmap_renderer`, region extraction in `region_extractor`.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Optional

import numpy as np
import torch
from torch import nn

from app.core.logger import get_logger
from app.services.model_loader import ModelLoader

logger = get_logger(__name__)

# Backbone key -> module path Grad-CAM hooks. Adding an architecture is a
# one-line change here plus its ModelSpec in the registry.
TARGET_LAYERS: dict[str, str] = {
    "efficientnet_b0": "features.8",
    "resnet50": "layer4",
    "xception": "layer4",
}


@dataclass(frozen=True)
class CamResult:
    """A normalized activation map plus the metadata that produced it."""

    cam: np.ndarray            # [h, w] float32 in [0, 1]
    target_layer: str
    model_name: str
    logit: float
    duration_ms: float


class GradCamEngine:
    """Computes Grad-CAM maps from the singleton-loaded model."""

    def __init__(
        self,
        loader: ModelLoader | None = None,
        target_layers: dict[str, str] | None = None,
    ) -> None:
        self._loader = loader
        self._target_layers = target_layers or dict(TARGET_LAYERS)

    @property
    def loader(self) -> ModelLoader:
        if self._loader is None:
            self._loader = ModelLoader.get_instance()
        return self._loader

    def target_layer_for(self, model_name: str | None) -> Optional[str]:
        return self._target_layers.get(model_name or "")

    def supports(self, model_name: str | None) -> bool:
        return self.target_layer_for(model_name) is not None

    def generate(self, tensor: torch.Tensor) -> Optional[CamResult]:
        """Return the activation map for one preprocessed tensor.

        Returns None when the active backbone exposes no Grad-CAM target
        layer (e.g. a Vision Transformer), so callers can fall back to
        the heuristic explainer without special-casing architectures.
        """
        loader = self.loader
        model = loader.model
        layer_name = self.target_layer_for(loader.model_name)
        if model is None or layer_name is None:
            return None

        layer = self._resolve(model, layer_name)
        if layer is None:
            return None

        captured: dict[str, torch.Tensor] = {}
        handles = [
            layer.register_forward_hook(
                lambda _m, _i, out: captured.__setitem__("activations", out)),
            layer.register_full_backward_hook(
                lambda _m, _gi, gout: captured.__setitem__("gradients", gout[0])),
        ]

        started = time.perf_counter()
        try:
            logit = self._forward_backward(model, tensor, loader.device)
        except RuntimeError as exc:
            logger.warning("Grad-CAM unavailable for %s: %s",
                           loader.model_name, exc)
            return None
        finally:
            for handle in handles:
                handle.remove()
            model.zero_grad(set_to_none=True)

        cam = self._activation_map(
            captured.get("activations"), captured.get("gradients"))
        if cam is None:
            return None

        return CamResult(
            cam=cam,
            target_layer=layer_name,
            model_name=loader.model_name or "unknown",
            logit=logit,
            duration_ms=round((time.perf_counter() - started) * 1000.0, 2),
        )

    # -- Internals -------------------------------------------------------------
    @staticmethod
    def _resolve(model: nn.Module, layer_name: str) -> Optional[nn.Module]:
        try:
            return model.get_submodule(layer_name)
        except AttributeError:
            logger.warning("Grad-CAM target layer '%s' not found", layer_name)
            return None

    @staticmethod
    def _forward_backward(
        model: nn.Module, tensor: torch.Tensor, device: torch.device
    ) -> float:
        model.zero_grad(set_to_none=True)
        with torch.enable_grad():
            logits = model(tensor.to(device))
            score = logits.flatten()[0]
            score.backward()
        return float(score.detach().item())

    @staticmethod
    def _activation_map(
        activations: torch.Tensor | None, gradients: torch.Tensor | None
    ) -> Optional[np.ndarray]:
        if activations is None or gradients is None:
            return None
        acts = activations.detach()[0].float()
        grads = gradients.detach()[0].float()
        if acts.ndim != 3 or grads.ndim != 3:
            return None

        weights = grads.mean(dim=(1, 2), keepdim=True)
        weighted = (weights * acts).sum(dim=0)
        cam = torch.relu(weighted)

        # A uniformly negative map means the target logit is suppressed
        # everywhere; the magnitude still localises the evidence, so the
        # signed map is used instead of discarding the explanation.
        if float(cam.max()) <= 0.0:
            cam = weighted.abs()

        cam_np = cam.cpu().numpy().astype(np.float32)
        cam_np = cam_np - float(cam_np.min())
        peak = float(cam_np.max())
        if peak <= 0.0:
            return None
        return (cam_np / peak).astype(np.float32)



__all__ = ["CamResult", "GradCamEngine", "TARGET_LAYERS"]
