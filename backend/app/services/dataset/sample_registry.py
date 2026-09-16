"""Raw sample discovery.

Walks ``datasets/raw/<label>/`` and describes every legitimate media file
found there. The critical output is ``source_id``: the identity of the
originating image or video. Frames extracted from one video share a
source_id, which is what makes the later split leakage-safe.

Expected raw layout (the source folder is optional but recommended):

    datasets/raw/real/celebdf/id0_0000.mp4
    datasets/raw/fake/faceforensics/000_003.mp4
    datasets/raw/real/some_photo.jpg
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings
from app.core.constants import IMAGE_EXTENSIONS, VIDEO_EXTENSIONS
from app.services.dataset.layout import DatasetLayout
from app.services.dataset.sources import DATASET_SOURCES


@dataclass(frozen=True)
class RawSample:
    path: Path
    label: str
    source: str
    source_id: str
    media_type: str      # "image" | "video"

    @property
    def size_bytes(self) -> int:
        return self.path.stat().st_size if self.path.exists() else 0


def _media_type(path: Path) -> str | None:
    suffix = path.suffix.lower()
    if suffix in IMAGE_EXTENSIONS:
        return "image"
    if suffix in VIDEO_EXTENSIONS:
        return "video"
    return None


def _source_of(path: Path, class_dir: Path) -> str:
    relative = path.relative_to(class_dir)
    head = relative.parts[0].lower() if len(relative.parts) > 1 else ""
    return head if head in DATASET_SOURCES else "unspecified"


def _source_id(path: Path, class_dir: Path, label: str) -> str:
    """Stable identity of the originating media file."""
    relative = path.relative_to(class_dir).with_suffix("")
    return f"{label}/{relative.as_posix()}"


def discover_raw_samples(layout: DatasetLayout | None = None) -> list[RawSample]:
    active = layout or DatasetLayout()
    samples: list[RawSample] = []
    for label in settings.DATASET_CLASSES:
        class_dir = active.raw_class_dir(label)
        if not class_dir.exists():
            continue
        for path in sorted(class_dir.rglob("*")):
            if not path.is_file():
                continue
            media_type = _media_type(path)
            if media_type is None:
                continue
            samples.append(RawSample(
                path=path,
                label=label,
                source=_source_of(path, class_dir),
                source_id=_source_id(path, class_dir, label),
                media_type=media_type,
            ))
    return samples
