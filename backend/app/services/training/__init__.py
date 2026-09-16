"""Training foundation (Day 5).

Dataset loading, training loop, early stopping and checkpoint management
for the DeepShield backbones declared in the model registry.

Torch-dependent members are resolved lazily so that checkpoint provenance
(which the API needs on every request) never forces torch to be imported.
"""
from app.services.training.checkpoint_manager import (
    CheckpointManager,
    CheckpointMetadata,
    CheckpointRef,
)

_LAZY = {
    "TrainingConfig": "app.services.training.config",
    "resolve_device": "app.services.training.config",
    "FaceCropDataset": "app.services.training.datamodule",
    "build_dataloaders": "app.services.training.datamodule",
    "EpochResult": "app.services.training.trainer",
    "Trainer": "app.services.training.trainer",
    "TrainingResult": "app.services.training.trainer",
}

__all__ = ["CheckpointManager", "CheckpointMetadata", "CheckpointRef", *_LAZY]


def __getattr__(name: str):
    module_path = _LAZY.get(name)
    if module_path is None:
        raise AttributeError(name)
    from importlib import import_module

    return getattr(import_module(module_path), name)
