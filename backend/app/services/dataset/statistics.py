"""Dataset statistics.

Reports what is actually on disk. Every number here is counted, never
estimated, so it can be quoted directly in the project report.
"""
from __future__ import annotations

import json
from collections import Counter
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Sequence

from app.services.dataset.layout import SPLITS, DatasetLayout
from app.services.dataset.manifest import ManifestRecord, read_manifest


@dataclass
class DatasetStatistics:
    root: str
    total_samples: int = 0
    real_samples: int = 0
    fake_samples: int = 0
    rejected_samples: int = 0
    face_detection_failures: int = 0
    source_videos: int = 0
    per_source: dict[str, int] = field(default_factory=dict)
    per_split: dict[str, dict[str, int]] = field(default_factory=dict)
    dimensions: dict[str, int] = field(default_factory=dict)

    @property
    def class_balance(self) -> float:
        """Fake share of the dataset, 0-1. 0.5 is perfectly balanced."""
        if self.total_samples == 0:
            return 0.0
        return round(self.fake_samples / self.total_samples, 4)

    def as_dict(self) -> dict:
        payload = asdict(self)
        payload["class_balance_fake_ratio"] = self.class_balance
        return payload

    def save(self, path: Path) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.as_dict(), indent=2))
        return path


def collect_statistics(
    layout: DatasetLayout | None = None,
    *,
    records: Sequence[ManifestRecord] | None = None,
    rejected: int = 0,
    face_failures: int = 0,
) -> DatasetStatistics:
    active = layout or DatasetLayout()
    manifest = list(records if records is not None
                    else read_manifest(active.manifest_path))

    stats = DatasetStatistics(root=str(active.root))
    stats.total_samples = len(manifest)
    stats.real_samples = sum(1 for r in manifest if r.label == "real")
    stats.fake_samples = sum(1 for r in manifest if r.label == "fake")
    stats.rejected_samples = rejected
    stats.face_detection_failures = face_failures
    stats.source_videos = len({r.source_id for r in manifest
                               if r.media_type == "video"})
    stats.per_source = dict(Counter(r.source for r in manifest))
    stats.dimensions = dict(Counter(f"{r.width}x{r.height}" for r in manifest))

    for split in SPLITS:
        in_split = [r for r in manifest if r.split == split]
        on_disk = {
            label: len([p for p in active.split_dir(split, label).glob("*")
                        if p.is_file()])
            if active.split_dir(split, label).exists() else 0
            for label in ("real", "fake")
        }
        stats.per_split[split] = {
            "total": len(in_split),
            "real": sum(1 for r in in_split if r.label == "real"),
            "fake": sum(1 for r in in_split if r.label == "fake"),
            "files_on_disk_real": on_disk["real"],
            "files_on_disk_fake": on_disk["fake"],
        }
    return stats
