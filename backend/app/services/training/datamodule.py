"""Training data loading.

The dataset reads the face crops written by the dataset preprocessor and
normalizes them with the *production* `ImagePipeline`. Training and
inference therefore share one preprocessing implementation — the only
difference is the augmentation stage, which is enabled for training and
disabled everywhere else.

Labels follow the project convention used by the classifier head:
    real -> 0.0
    fake -> 1.0
so a sigmoid output is directly the probability of FAKE.
"""
from __future__ import annotations

from pathlib import Path
from typing import Sequence

import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset

from app.core.config import settings
from app.services.dataset.layout import DatasetLayout
from app.services.preprocessing.transforms import ImagePipeline

LABEL_TO_TARGET: dict[str, float] = {"real": 0.0, "fake": 1.0}


class FaceCropDataset(Dataset):
    """Labelled face crops for one split."""

    def __init__(
        self,
        split: str,
        *,
        layout: DatasetLayout | None = None,
        augment: bool = False,
        pipeline: ImagePipeline | None = None,
    ) -> None:
        self._layout = layout or DatasetLayout()
        self._pipeline = pipeline or ImagePipeline(augment=augment)
        self.split = split
        self.samples: list[tuple[Path, float]] = []
        for label in settings.DATASET_CLASSES:
            directory = self._layout.split_dir(split, label)
            if not directory.exists():
                continue
            for path in sorted(directory.glob("*")):
                if path.is_file():
                    self.samples.append((path, LABEL_TO_TARGET[label]))

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor]:
        path, target = self.samples[index]
        with Image.open(path) as handle:
            image = handle.convert("RGB").copy()
        tensor = self._pipeline.run(image).squeeze(0)
        return tensor, torch.tensor([target], dtype=torch.float32)

    @property
    def class_counts(self) -> dict[str, int]:
        return {
            "real": sum(1 for _, t in self.samples if t == 0.0),
            "fake": sum(1 for _, t in self.samples if t == 1.0),
        }


def build_dataloaders(
    *,
    layout: DatasetLayout | None = None,
    batch_size: int | None = None,
    num_workers: int | None = None,
    augment_train: bool = True,
    splits: Sequence[str] = ("train", "validation", "test"),
) -> dict[str, DataLoader]:
    """Create one DataLoader per requested split that has samples."""
    active_layout = layout or DatasetLayout()
    size = int(batch_size or settings.TRAIN_BATCH_SIZE)
    workers = int(num_workers if num_workers is not None
                  else settings.TRAIN_NUM_WORKERS)

    loaders: dict[str, DataLoader] = {}
    for split in splits:
        dataset = FaceCropDataset(
            split, layout=active_layout,
            augment=augment_train and split == "train",
        )
        if len(dataset) == 0:
            continue
        loaders[split] = DataLoader(
            dataset,
            batch_size=size,
            shuffle=(split == "train"),
            num_workers=workers,
            drop_last=False,
        )
    return loaders
