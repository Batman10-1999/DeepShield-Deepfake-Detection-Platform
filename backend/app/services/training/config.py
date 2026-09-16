"""Training configuration.

One immutable object carries every hyper-parameter, so a run is fully
described by the JSON that is stored next to its checkpoint and can be
reproduced exactly.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Literal

from app.core.config import settings

Optimizer = Literal["adamw", "adam", "sgd"]


@dataclass(frozen=True)
class TrainingConfig:
    model_key: str = settings.DEFAULT_MODEL
    batch_size: int = settings.TRAIN_BATCH_SIZE
    epochs: int = settings.TRAIN_EPOCHS
    learning_rate: float = settings.TRAIN_LEARNING_RATE
    weight_decay: float = settings.TRAIN_WEIGHT_DECAY
    optimizer: Optimizer = settings.TRAIN_OPTIMIZER  # type: ignore[assignment]
    loss: str = "bce_with_logits"
    early_stopping_patience: int = settings.TRAIN_EARLY_STOPPING_PATIENCE
    num_workers: int = settings.TRAIN_NUM_WORKERS
    device: str = settings.TRAIN_DEVICE
    augment: bool = True
    pretrained_backbone: bool = True
    dataset_version: str = "unspecified"
    seed: int = settings.DATASET_SPLIT_SEED

    def as_dict(self) -> dict:
        return asdict(self)


def resolve_device(requested: str = "auto") -> str:
    """CPU/GPU selection with an explicit override."""
    import torch

    choice = (requested or "auto").strip().lower()
    if choice == "auto":
        return "cuda" if torch.cuda.is_available() else "cpu"
    if choice == "cuda" and not torch.cuda.is_available():
        return "cpu"
    return choice
