"""Leakage-safe train / validation / test split.

Frames of one source video are near-duplicates of each other. Splitting
per-frame would place almost identical images in both train and test and
inflate every metric, so DeepShield splits at the *source* level: a
source_id (one image or one video) belongs to exactly one split.

Strategy:
  1. Group manifest records by (label, source_id).
  2. Shuffle the groups with a fixed seed (reproducible split).
  3. Fill each split per class until its sample-count quota is met, so the
     class balance of the dataset is preserved in every split.
  4. Verify afterwards that no source_id crosses a split boundary.

The test split is written once and is never used for tuning: training
selects the best checkpoint on validation only.
"""
from __future__ import annotations

import json
import random
import shutil
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Sequence

from app.core.config import settings
from app.core.logger import get_logger
from app.services.dataset.layout import SPLITS, DatasetLayout
from app.services.dataset.manifest import ManifestRecord, write_manifest

logger = get_logger(__name__)


@dataclass(frozen=True)
class SplitPlan:
    """Which source groups land in which split."""
    assignments: dict[str, str]           # source_id -> split
    counts: dict[str, dict[str, int]]     # split -> {real, fake, total}


@dataclass
class SplitReport:
    ratios: dict[str, float]
    seed: int
    groups: int
    counts: dict[str, dict[str, int]]
    leakage_detected: bool
    leaking_source_ids: list[str] = field(default_factory=list)
    duplicate_hashes_across_splits: list[str] = field(default_factory=list)
    files_copied: int = 0

    def as_dict(self) -> dict:
        return asdict(self)

    def save(self, path: Path) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.as_dict(), indent=2))
        return path


class GroupAwareSplitter:
    """Source-level splitter with an explicit leakage check."""

    def __init__(
        self,
        layout: DatasetLayout | None = None,
        *,
        ratios: Sequence[float] | None = None,
        seed: int | None = None,
    ) -> None:
        self._layout = layout or DatasetLayout()
        resolved = tuple(ratios or settings.DATASET_SPLIT_RATIOS)
        if len(resolved) != 3 or abs(sum(resolved) - 1.0) > 1e-6:
            raise ValueError("Split ratios must be three values summing to 1.0.")
        self._ratios = resolved
        self._seed = int(seed if seed is not None else settings.DATASET_SPLIT_SEED)

    # -- Planning ---------------------------------------------------------------
    def plan(self, records: Sequence[ManifestRecord]) -> SplitPlan:
        groups: dict[tuple[str, str], list[ManifestRecord]] = defaultdict(list)
        for record in records:
            groups[(record.label, record.source_id)].append(record)

        assignments: dict[str, str] = {}
        counts = {split: {"real": 0, "fake": 0, "total": 0} for split in SPLITS}

        for label in settings.DATASET_CLASSES:
            label_groups = [(sid, items) for (lbl, sid), items in groups.items()
                            if lbl == label]
            rng = random.Random(f"{self._seed}:{label}")
            rng.shuffle(label_groups)
            total = sum(len(items) for _, items in label_groups)
            quotas = self._quotas(total)
            for source_id, items in label_groups:
                split = self._pick_split(counts, quotas, label)
                assignments[source_id] = split
                counts[split][label] += len(items)
                counts[split]["total"] += len(items)
        return SplitPlan(assignments=assignments, counts=counts)

    def _quotas(self, total: int) -> dict[str, int]:
        train = int(round(total * self._ratios[0]))
        validation = int(round(total * self._ratios[1]))
        test = max(0, total - train - validation)
        return {"train": train, "validation": validation, "test": test}

    @staticmethod
    def _pick_split(counts, quotas: dict[str, int], label: str) -> str:
        """Choose the split furthest below its quota for this class."""
        deficits = {split: quotas[split] - counts[split][label] for split in SPLITS}
        best = max(SPLITS, key=lambda s: (deficits[s], s == "train"))
        return best if deficits[best] > 0 else "train"

    # -- Materialisation ----------------------------------------------------------
    def apply(
        self,
        records: Sequence[ManifestRecord],
        *,
        copy_files: bool = True,
    ) -> tuple[list[ManifestRecord], SplitReport]:
        plan = self.plan(records)
        assigned = [r.with_split(plan.assignments[r.source_id]) for r in records]

        copied = 0
        if copy_files:
            for split in SPLITS:
                for label in settings.DATASET_CLASSES:
                    target = self._layout.split_dir(split, label)
                    target.mkdir(parents=True, exist_ok=True)
                    for existing in target.glob("*"):
                        if existing.is_file():
                            existing.unlink()
            for record in assigned:
                source = self._layout.root / record.path
                if not source.exists():
                    continue
                destination = (self._layout.split_dir(record.split, record.label)
                               / Path(record.path).name)
                shutil.copy2(source, destination)
                copied += 1

        leaking = self.detect_leakage(assigned)
        duplicates = self.detect_duplicate_content(assigned)
        report = SplitReport(
            ratios={"train": self._ratios[0], "validation": self._ratios[1],
                    "test": self._ratios[2]},
            seed=self._seed,
            groups=len(plan.assignments),
            counts=plan.counts,
            leakage_detected=bool(leaking or duplicates),
            leaking_source_ids=leaking,
            duplicate_hashes_across_splits=duplicates,
            files_copied=copied,
        )
        write_manifest(self._layout.manifest_path, assigned)
        report.save(self._layout.split_report_path)
        if duplicates:
            logger.warning(
                "%d identical crops appear in more than one split — "
                "de-duplicate the raw media before training.", len(duplicates))
        logger.info("Split complete: %s (leakage=%s)", plan.counts,
                    bool(leaking or duplicates))
        return assigned, report

    @staticmethod
    def detect_leakage(records: Sequence[ManifestRecord]) -> list[str]:
        """Source ids that appear in more than one split."""
        seen: dict[str, set[str]] = defaultdict(set)
        for record in records:
            if record.split:
                seen[record.source_id].add(record.split)
        return sorted(sid for sid, splits in seen.items() if len(splits) > 1)

    @staticmethod
    def detect_duplicate_content(records: Sequence[ManifestRecord]) -> list[str]:
        """Content hashes present in more than one split.

        Source-level grouping stops frames of one video from crossing a
        split, but two *different* source files can still be byte-identical
        (re-encodes, duplicated downloads). Those are real leakage too, so
        they are reported explicitly rather than assumed away.
        """
        seen: dict[str, set[str]] = defaultdict(set)
        for record in records:
            if record.split and record.sha256:
                seen[record.sha256].add(record.split)
        return sorted(h for h, splits in seen.items() if len(splits) > 1)
