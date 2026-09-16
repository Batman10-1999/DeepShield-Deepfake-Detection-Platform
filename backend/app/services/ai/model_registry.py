from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

import torch
from torch import nn
from torchvision import models

from app.core.logger import get_logger

logger = get_logger(__name__)

BackboneBuilder = Callable[[bool], nn.Module]


@dataclass(frozen=True)
class ModelSpec:
    key: str
    display_name: str
    family: str
    input_size: int
    builder: BackboneBuilder
    available: bool = True


def _efficientnet_b0(pretrained: bool = True) -> nn.Module:
    weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1 if pretrained else None

    net = models.efficientnet_b0(weights=weights)

    in_features = net.classifier[1].in_features

    net.classifier = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(in_features, 2),
    )

    return net


REGISTRY: dict[str, ModelSpec] = {
    "efficientnet_b0": ModelSpec(
        key="efficientnet_b0",
        display_name="DeepfakeDetector EfficientNet-B0",
        family="cnn",
        input_size=224,
        builder=_efficientnet_b0,
    ),
}


def get_spec(model_key: str) -> ModelSpec:
    spec = REGISTRY.get(model_key)

    if spec is None or not spec.available:
        raise ValueError(f"Unknown model '{model_key}'.")

    return spec


def build_model(model_key: str, *, pretrained: bool = True) -> nn.Module:
    return get_spec(model_key).builder(pretrained)


MODEL_REGISTRY: dict[str, BackboneBuilder] = {
    key: spec.builder for key, spec in REGISTRY.items()
}