"""Dataset directory layout.

One object owns every dataset path so scripts, preprocessing, splitting,
training and evaluation can never disagree about where data lives.

    datasets/
        raw/            operator-provided source media, untouched
            real/
            fake/
        processed/      face crops produced by the preprocessing pipeline
            real/
            fake/
        train/ validation/ test/
            real/
            fake/
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings

SPLITS: tuple[str, ...] = ("train", "validation", "test")


@dataclass(frozen=True)
class DatasetValidation:
    """Result of checking the layout on disk."""
    root: Path
    exists: bool
    missing_directories: list[str]
    empty_directories: list[str]
    file_counts: dict[str, int]

    @property
    def is_ready_for_training(self) -> bool:
        required = [f"{split}/{cls}"
                    for split in ("train", "validation")
                    for cls in settings.DATASET_CLASSES]
        return (self.exists
                and not self.missing_directories
                and all(self.file_counts.get(key, 0) > 0 for key in required))

    def as_dict(self) -> dict:
        return {
            "root": str(self.root),
            "exists": self.exists,
            "missing_directories": self.missing_directories,
            "empty_directories": self.empty_directories,
            "file_counts": self.file_counts,
            "ready_for_training": self.is_ready_for_training,
        }


class DatasetLayout:
    """Filesystem contract for a DeepShield dataset."""

    def __init__(self, root: Path | None = None) -> None:
        self.root = Path(root or settings.DATASETS_DIR)

    # -- Paths -----------------------------------------------------------------
    @property
    def raw(self) -> Path:
        return self.root / "raw"

    @property
    def processed(self) -> Path:
        return self.root / "processed"

    @property
    def manifest_path(self) -> Path:
        return self.processed / "manifest.jsonl"

    @property
    def statistics_path(self) -> Path:
        return self.root / "dataset_statistics.json"

    @property
    def split_report_path(self) -> Path:
        return self.root / "split_report.json"

    def raw_class_dir(self, label: str) -> Path:
        return self.raw / self._label(label)

    def processed_class_dir(self, label: str) -> Path:
        return self.processed / self._label(label)

    def split_dir(self, split: str, label: str) -> Path:
        return self.root / self._split(split) / self._label(label)

    def all_directories(self) -> list[Path]:
        dirs = [self.raw, self.processed]
        for label in settings.DATASET_CLASSES:
            dirs += [self.raw_class_dir(label), self.processed_class_dir(label)]
        for split in SPLITS:
            for label in settings.DATASET_CLASSES:
                dirs.append(self.split_dir(split, label))
        return dirs

    # -- Operations -------------------------------------------------------------
    def create(self) -> list[Path]:
        """Create the full skeleton. Safe to run repeatedly."""
        created: list[Path] = []
        for directory in self.all_directories():
            if not directory.exists():
                directory.mkdir(parents=True, exist_ok=True)
                created.append(directory)
        return created

    def validate(self) -> DatasetValidation:
        missing: list[str] = []
        empty: list[str] = []
        counts: dict[str, int] = {}
        for directory in self.all_directories():
            key = directory.relative_to(self.root).as_posix()
            if not directory.exists():
                missing.append(key)
                continue
            files = [p for p in directory.rglob("*") if p.is_file()]
            counts[key] = len(files)
            if not files:
                empty.append(key)
        return DatasetValidation(
            root=self.root,
            exists=self.root.exists(),
            missing_directories=missing,
            empty_directories=empty,
            file_counts=counts,
        )

    # -- Guards -----------------------------------------------------------------
    @staticmethod
    def _label(label: str) -> str:
        normalised = label.strip().lower()
        if normalised not in settings.DATASET_CLASSES:
            raise ValueError(
                f"Unknown class '{label}'. Expected one of "
                f"{settings.DATASET_CLASSES}."
            )
        return normalised

    @staticmethod
    def _split(split: str) -> str:
        normalised = split.strip().lower()
        if normalised not in SPLITS:
            raise ValueError(f"Unknown split '{split}'. Expected one of {SPLITS}.")
        return normalised
