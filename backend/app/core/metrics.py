"""Processing metrics collection.

A single, reusable stopwatch that every pipeline stage reports into.
Keeping timing in one object means new stages (video, audio) get
measured without touching the response builder.
"""
from __future__ import annotations

import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Iterator


@dataclass
class ProcessingMetricsCollector:
    """Accumulates per-stage durations in milliseconds."""

    stages: dict[str, float] = field(default_factory=dict)
    _started: float = field(default_factory=time.perf_counter)

    @contextmanager
    def measure(self, stage: str) -> Iterator[None]:
        started = time.perf_counter()
        try:
            yield
        finally:
            self.record(stage, (time.perf_counter() - started) * 1000.0)

    def record(self, stage: str, milliseconds: float) -> None:
        self.stages[stage] = round(self.stages.get(stage, 0.0) + float(milliseconds), 2)

    def get(self, stage: str) -> float:
        return self.stages.get(stage, 0.0)

    @property
    def total_ms(self) -> float:
        return round((time.perf_counter() - self._started) * 1000.0, 2)

    def snapshot(self, *, total_ms: float | None = None) -> dict[str, float]:
        data = dict(self.stages)
        data["total_ms"] = round(
            self.total_ms if total_ms is None else float(total_ms), 2
        )
        return data


class Stage:
    """Canonical stage names shared by collector and API schema."""

    VALIDATION = "validation_ms"
    HASHING = "hashing_ms"
    METADATA = "metadata_ms"
    FACE_DETECTION = "face_detection_ms"
    PREPROCESSING = "preprocess_ms"
    INFERENCE = "inference_ms"
    POSTPROCESSING = "postprocess_ms"
    VIDEO_LOAD = "video_load_ms"
    FRAME_EXTRACTION = "frame_extraction_ms"
    FRAME_ANALYSIS = "frame_analysis_ms"
    AGGREGATION = "aggregation_ms"
