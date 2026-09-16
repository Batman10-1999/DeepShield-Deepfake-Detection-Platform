"""Dataset preprocessing job.

Turns operator-provided raw media into a directory of labelled face crops
plus a manifest and a statistics file.

    raw sample -> face extraction -> usability check -> save crop
               -> manifest record -> statistics

Samples with no detectable face are rejected and counted; they are never
silently converted into full-frame samples, because a full frame carries
different statistics than the face crops the detector is trained on.
"""
from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Sequence

from app.core.logger import get_logger
from app.services.dataset.face_extraction import SampleFaceExtractor
from app.services.dataset.layout import DatasetLayout
from app.services.dataset.manifest import ManifestRecord, write_manifest
from app.services.dataset.sample_registry import RawSample, discover_raw_samples
from app.services.dataset.statistics import DatasetStatistics, collect_statistics

logger = get_logger(__name__)


@dataclass
class PreprocessReport:
    processed_samples: int = 0
    crops_written: int = 0
    rejected_samples: int = 0
    face_detection_failures: int = 0
    unreadable_samples: int = 0
    duration_sec: float = 0.0
    records: list[ManifestRecord] = field(default_factory=list)
    statistics: DatasetStatistics | None = None

    def as_dict(self) -> dict:
        return {
            "processed_samples": self.processed_samples,
            "crops_written": self.crops_written,
            "rejected_samples": self.rejected_samples,
            "face_detection_failures": self.face_detection_failures,
            "unreadable_samples": self.unreadable_samples,
            "duration_sec": round(self.duration_sec, 2),
            "statistics": self.statistics.as_dict() if self.statistics else None,
        }


class DatasetPreprocessor:
    """Reusable raw -> processed conversion."""

    def __init__(
        self,
        layout: DatasetLayout | None = None,
        extractor: SampleFaceExtractor | None = None,
    ) -> None:
        self._layout = layout or DatasetLayout()
        self._extractor = extractor or SampleFaceExtractor()

    def run(self, samples: Sequence[RawSample] | None = None) -> PreprocessReport:
        started = time.perf_counter()
        pending = list(samples if samples is not None
                       else discover_raw_samples(self._layout))
        report = PreprocessReport()

        for sample in pending:
            report.processed_samples += 1
            try:
                faces = self._extractor.extract(sample.path, sample.media_type)
            except Exception as exc:
                logger.warning("Unreadable sample %s: %s", sample.path, exc)
                report.unreadable_samples += 1
                report.rejected_samples += 1
                continue

            if not faces:
                logger.info("No usable face in %s — sample rejected.", sample.path)
                report.face_detection_failures += 1
                report.rejected_samples += 1
                continue

            for face in faces:
                record = self._persist(sample, face)
                report.records.append(record)
                report.crops_written += 1

        write_manifest(self._layout.manifest_path, report.records)
        report.statistics = collect_statistics(
            self._layout,
            records=report.records,
            rejected=report.rejected_samples,
            face_failures=report.face_detection_failures,
        )
        report.statistics.save(self._layout.statistics_path)
        report.duration_sec = time.perf_counter() - started
        logger.info(
            "Dataset preprocessing complete: %d crops from %d samples "
            "(%d rejected).",
            report.crops_written, report.processed_samples,
            report.rejected_samples,
        )
        return report

    # -- Internals -------------------------------------------------------------
    def _persist(self, sample: RawSample, face) -> ManifestRecord:
        target_dir = self._layout.processed_class_dir(sample.label)
        target_dir.mkdir(parents=True, exist_ok=True)
        stem = sample.source_id.replace("/", "__")
        frame_part = "img" if face.frame_number is None else f"f{face.frame_number:06d}"
        sample_id = f"{stem}__{frame_part}__face{face.face_index}"
        path = target_dir / f"{sample_id}.png"
        face.image.save(path, format="PNG")
        x, y, w, h = getattr(face, "box", (0, 0, 0, 0))
        return ManifestRecord(
            path=self._relative(path),
            label=sample.label,
            source=sample.source,
            source_id=sample.source_id,
            media_type=sample.media_type,
            frame_number=face.frame_number,
            face_index=face.face_index,
            width=face.image.width,
            height=face.image.height,
            sample_id=sample_id,
            timestamp_sec=getattr(face, "timestamp_sec", None),
            face_x=int(x), face_y=int(y),
            face_width=int(w), face_height=int(h),
            detector_score=float(getattr(face, "detector_score", 1.0)),
            sha256=self._sha256(path),
        )

    @staticmethod
    def _sha256(path: Path) -> str:
        """Content hash of the stored crop — used to detect duplicates that
        would otherwise leak across train/validation/test."""
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()

    def _relative(self, path: Path) -> str:
        return path.relative_to(self._layout.root).as_posix()
