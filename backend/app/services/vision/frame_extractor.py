"""Frame Extraction Engine.

Turns a video file into a small, representative set of RGB frames. The
selection policy is pluggable so the rest of the video pipeline never
needs to know *how* frames were chosen:

    uniform  – N evenly spaced frames across the whole clip
    interval – every Nth frame
    fps      – N frames per second of footage

Decoding is intentionally the only responsibility here; face detection,
preprocessing and inference all live downstream.
"""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

import numpy as np
from PIL import Image

from app.core.config import settings
from app.core.exceptions import NoFramesExtractedError, UnreadableVideoError


@dataclass(frozen=True)
class ExtractedFrame:
    """A single decoded frame with its position in the timeline."""

    frame_number: int
    timestamp_sec: float
    image: Image.Image


@dataclass(frozen=True)
class FrameExtractionResult:
    frames: list[ExtractedFrame]
    strategy: str
    requested_indices: list[int]
    total_frames: int
    extraction_time_ms: float

    @property
    def count(self) -> int:
        return len(self.frames)


class FrameSelectionStrategy(ABC):
    """Chooses which frame indices deserve analysis."""

    name: str = "abstract"

    @abstractmethod
    def select(self, *, frame_count: int, fps: float, limit: int) -> list[int]:
        raise NotImplementedError

    @staticmethod
    def _clip(indices: Sequence[int], frame_count: int, limit: int) -> list[int]:
        unique = sorted({max(0, min(frame_count - 1, int(i))) for i in indices})
        if limit > 0 and len(unique) > limit:
            step = len(unique) / limit
            unique = [unique[min(len(unique) - 1, int(i * step))] for i in range(limit)]
        return unique


class UniformSampling(FrameSelectionStrategy):
    """Evenly spaced frames — best default coverage for short clips."""

    name = "uniform"

    def select(self, *, frame_count: int, fps: float, limit: int) -> list[int]:
        if frame_count <= 0 or limit <= 0:
            return []
        if frame_count <= limit:
            return list(range(frame_count))
        step = frame_count / limit
        return self._clip([int(i * step) for i in range(limit)], frame_count, limit)


class IntervalSampling(FrameSelectionStrategy):
    """Every Nth frame."""

    name = "interval"

    def __init__(self, interval: int | None = None) -> None:
        self._interval = max(1, int(interval or settings.FRAME_INTERVAL))

    def select(self, *, frame_count: int, fps: float, limit: int) -> list[int]:
        if frame_count <= 0:
            return []
        return self._clip(range(0, frame_count, self._interval), frame_count, limit)


class FpsSampling(FrameSelectionStrategy):
    """N frames per second of footage."""

    name = "fps"

    def __init__(self, sample_fps: float | None = None) -> None:
        self._sample_fps = max(
            0.01, float(sample_fps if sample_fps is not None else settings.FRAME_SAMPLE_FPS)
        )

    def select(self, *, frame_count: int, fps: float, limit: int) -> list[int]:
        if frame_count <= 0:
            return []
        if fps <= 0:
            return UniformSampling().select(
                frame_count=frame_count, fps=fps, limit=limit)
        step = max(1, int(round(fps / self._sample_fps)))
        return self._clip(range(0, frame_count, step), frame_count, limit)


_STRATEGIES: dict[str, type[FrameSelectionStrategy]] = {
    UniformSampling.name: UniformSampling,
    IntervalSampling.name: IntervalSampling,
    FpsSampling.name: FpsSampling,
}


def build_strategy(name: str | None = None) -> FrameSelectionStrategy:
    key = (name or settings.FRAME_EXTRACTION_STRATEGY or "uniform").strip().lower()
    return _STRATEGIES.get(key, UniformSampling)()


class FrameExtractionService:
    """Decodes the frames chosen by a selection strategy."""

    def __init__(
        self,
        strategy: FrameSelectionStrategy | None = None,
        *,
        max_frames: int | None = None,
    ) -> None:
        self._strategy = strategy or build_strategy()
        self._max_frames = int(
            max_frames if max_frames is not None else settings.MAX_FRAMES_ANALYSED
        )

    @property
    def strategy_name(self) -> str:
        return self._strategy.name

    def extract(
        self,
        path: Path,
        *,
        frame_count: int,
        fps: float,
    ) -> FrameExtractionResult:
        import cv2

        started = time.perf_counter()
        capture = cv2.VideoCapture(str(path))
        if not capture.isOpened():
            raise UnreadableVideoError()

        indices = self._strategy.select(
            frame_count=frame_count, fps=fps, limit=self._max_frames)
        frames: list[ExtractedFrame] = []
        try:
            for index in indices:
                capture.set(cv2.CAP_PROP_POS_FRAMES, index)
                ok, raw = capture.read()
                if not ok or raw is None:
                    continue
                rgb = cv2.cvtColor(raw, cv2.COLOR_BGR2RGB)
                frames.append(ExtractedFrame(
                    frame_number=index,
                    timestamp_sec=round(index / fps, 3) if fps > 0 else 0.0,
                    image=Image.fromarray(np.asarray(rgb)),
                ))
        finally:
            capture.release()

        if not frames:
            raise NoFramesExtractedError()

        return FrameExtractionResult(
            frames=frames,
            strategy=self._strategy.name,
            requested_indices=list(indices),
            total_frames=frame_count,
            extraction_time_ms=round((time.perf_counter() - started) * 1000.0, 2),
        )
