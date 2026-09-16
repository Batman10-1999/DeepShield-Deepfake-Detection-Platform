"""Processed-sample manifest.

Every processed face crop is described by one JSON line. The manifest is
the single source of truth for labels, provenance and split membership,
which keeps splitting and training independent of directory scanning
order and makes the dataset auditable.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Iterator


@dataclass(frozen=True)
class ManifestRecord:
    """One processed face crop and its full provenance chain.

        dataset -> source video -> frame -> detected face -> processed crop
    """
    path: str            # processed_path, relative to the dataset root
    label: str           # "real" | "fake"
    source: str          # dataset source key, e.g. "celebdf"
    source_id: str       # grouping key: the originating image/video identity
    media_type: str      # "image" | "video"
    frame_number: int | None
    face_index: int
    width: int
    height: int
    sample_id: str = ""          # stable id of this processed crop
    timestamp_sec: float | None = None    # position in the source video
    face_x: int = 0                       # face box in source coordinates
    face_y: int = 0
    face_width: int = 0
    face_height: int = 0
    detector_score: float = 1.0
    sha256: str = ""                      # content hash of the crop
    split: str | None = None

    @property
    def face_coordinates(self) -> dict[str, int]:
        return {"x": self.face_x, "y": self.face_y,
                "width": self.face_width, "height": self.face_height}

    def with_split(self, split: str) -> "ManifestRecord":
        return ManifestRecord(**{**asdict(self), "split": split})


def write_manifest(path: Path, records: Iterable[ManifestRecord]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(asdict(record)) + "\n")
            count += 1
    return count


def read_manifest(path: Path) -> list[ManifestRecord]:
    if not path.exists():
        return []
    return list(_iter_manifest(path))


def manifest_fields() -> list[str]:
    return list(ManifestRecord.__dataclass_fields__)


def _iter_manifest(path: Path) -> Iterator[ManifestRecord]:
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            payload = json.loads(line)
            known = set(ManifestRecord.__dataclass_fields__)
            yield ManifestRecord(**{k: v for k, v in payload.items()
                                    if k in known})
