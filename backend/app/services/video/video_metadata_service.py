"""Video metadata extraction.

Filesystem facts (size, timestamps, hash) plus container facts (fps,
resolution, codec, frame count) for an uploaded video. Mirrors the
image `metadata_service` contract so both media types feel identical.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from app.core.exceptions import UnreadableVideoError
from app.models.schemas import VideoFileMetadata
from app.utils.hashing import sha256_file


def _iso(timestamp: float | None) -> str | None:
    if not timestamp:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()


def _timestamps(path: Path) -> tuple[str | None, str | None]:
    try:
        stat = path.stat()
    except OSError:
        return None, None
    created = getattr(stat, "st_birthtime", None) or stat.st_ctime
    return _iso(created), _iso(stat.st_mtime)


def _fourcc_to_codec(fourcc: float) -> str | None:
    try:
        code = int(fourcc)
        codec = "".join(chr((code >> (8 * i)) & 0xFF) for i in range(4)).strip()
        return codec or None
    except Exception:
        return None


def extract_video_metadata(
    path: Path,
    *,
    original_filename: str | None = None,
    sha256: str | None = None,
) -> VideoFileMetadata:
    """Read container metadata; raises UnreadableVideoError when broken."""
    import cv2

    filename = original_filename or path.name
    size_bytes = path.stat().st_size if path.exists() else 0
    created_at, modified_at = _timestamps(path)

    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        raise UnreadableVideoError()
    try:
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        codec = _fourcc_to_codec(capture.get(cv2.CAP_PROP_FOURCC))
    finally:
        capture.release()

    if frame_count <= 0 and fps <= 0:
        raise UnreadableVideoError(
            "The video contains no readable frames or stream information."
        )

    duration = (frame_count / fps) if fps > 0 else 0.0

    return VideoFileMetadata(
        filename=filename,
        extension=Path(filename).suffix.lower(),
        duration_sec=round(duration, 3),
        fps=round(fps, 3),
        width=width,
        height=height,
        resolution=f"{width}x{height}" if width and height else None,
        codec=codec,
        frame_count=frame_count,
        size_bytes=size_bytes,
        size_kb=round(size_bytes / 1024, 2),
        created_at=created_at,
        modified_at=modified_at,
        sha256=sha256 or (sha256_file(path) if path.exists() else None),
    )
