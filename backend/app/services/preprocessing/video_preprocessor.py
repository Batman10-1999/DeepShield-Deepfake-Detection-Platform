"""Video preprocessing pipeline.

Responsibilities:
    1. Read metadata (width, height, fps, frame count, duration, codec).
    2. Reject videos that are too long for the demo pipeline.
    3. Sample N evenly-spaced frames and save them under `uploads/frames/<uid>/`.
       These frames will be fed to the image CNN by the multi-modal fusion
       layer in a later phase.

Actual detection / classification is NOT performed here.
"""
from __future__ import annotations

import uuid
from pathlib import Path
from typing import List, Tuple

import cv2  # opencv-python-headless

from app.core.config import settings
from app.core.constants import LogEvent
from app.core.logger import get_logger
from app.models.schemas import VideoMetadata, VideoPreprocessResult

logger = get_logger(__name__)


def _fourcc_to_codec(fourcc_int: float) -> str:
    try:
        code = int(fourcc_int)
        return "".join(chr((code >> (8 * i)) & 0xFF) for i in range(4)).strip()
    except Exception:  # pragma: no cover
        return ""


def _read_metadata(cap: "cv2.VideoCapture") -> VideoMetadata:
    fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    codec = _fourcc_to_codec(cap.get(cv2.CAP_PROP_FOURCC))
    duration = (frame_count / fps) if fps > 0 else 0.0
    return VideoMetadata(
        width=width,
        height=height,
        fps=round(fps, 3),
        frame_count=frame_count,
        duration_sec=round(duration, 3),
        codec=codec or None,
    )


def _evenly_spaced_indices(total: int, n: int) -> List[int]:
    if total <= 0 or n <= 0:
        return []
    if total <= n:
        return list(range(total))
    step = total / n
    return [min(total - 1, int(i * step)) for i in range(n)]


def preprocess_video(path: Path) -> Tuple[List[Path], VideoPreprocessResult]:
    """Extract metadata and sample frames from a video file.

    Returns:
        frame_paths – list of Path objects (may be empty if fps=0)
        summary     – VideoPreprocessResult with metadata + frame info
    """
    logger.info("%s: %s", LogEvent.PREPROCESS_STARTED, path.name)

    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        raise ValueError("Could not open the video file. It may be corrupted.")

    try:
        metadata = _read_metadata(cap)

        if metadata.duration_sec > settings.MAX_VIDEO_DURATION_SEC:
            raise ValueError(
                f"Video is too long ({metadata.duration_sec:.1f}s). "
                f"Limit is {settings.MAX_VIDEO_DURATION_SEC:.0f}s."
            )

        indices = _evenly_spaced_indices(metadata.frame_count,
                                         settings.VIDEO_SAMPLE_FRAMES)

        frames_dir = settings.FRAMES_DIR / uuid.uuid4().hex
        frames_dir.mkdir(parents=True, exist_ok=True)

        saved_paths: List[Path] = []
        for order, idx in enumerate(indices):
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ok, frame = cap.read()
            if not ok or frame is None:
                continue
            out_path = frames_dir / f"frame_{order:03d}_idx{idx}.jpg"
            cv2.imwrite(str(out_path), frame)
            saved_paths.append(out_path)
    finally:
        cap.release()

    summary = VideoPreprocessResult(
        metadata=metadata,
        sampled_frame_indices=indices,
        sampled_frames_saved=len(saved_paths),
        frames_dir=str(frames_dir),
    )
    logger.info("%s: %s -> %d frames (%dx%d @ %.2f fps)",
                LogEvent.PREPROCESS_COMPLETED, path.name,
                len(saved_paths), metadata.width, metadata.height, metadata.fps)
    return saved_paths, summary
