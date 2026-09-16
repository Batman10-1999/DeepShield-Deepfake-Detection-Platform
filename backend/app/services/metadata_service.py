"""Media metadata extraction.

Filesystem and image-level facts about an upload. Deliberately tolerant:
metadata is descriptive, never a reason to fail a prediction.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

from app.models.schemas import MediaMetadata
from app.utils.hashing import sha256_file

_CHANNELS_BY_MODE = {
    "1": 1, "L": 1, "P": 1, "LA": 2,
    "RGB": 3, "YCbCr": 3, "HSV": 3,
    "RGBA": 4, "CMYK": 4,
}


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


def extract_image_metadata(
    path: Path,
    *,
    original_filename: str | None = None,
    sha256: str | None = None,
) -> MediaMetadata:
    """Collect filesystem + pixel metadata for a stored image."""
    filename = original_filename or path.name
    size_bytes = path.stat().st_size if path.exists() else 0
    created_at, modified_at = _timestamps(path)

    width = height = 0
    color_mode: str | None = None
    image_format: str | None = None
    channels: int | None = None

    try:
        with Image.open(path) as image:
            width, height = image.size
            color_mode = image.mode
            image_format = image.format
            channels = _CHANNELS_BY_MODE.get(image.mode, len(image.getbands()))
    except Exception:  # metadata is best-effort, never fatal
        pass

    return MediaMetadata(
        filename=filename,
        extension=Path(filename).suffix.lower(),
        size_bytes=size_bytes,
        size_kb=round(size_bytes / 1024, 2),
        width=width,
        height=height,
        resolution=f"{width}x{height}" if width and height else None,
        channels=channels,
        color_mode=color_mode,
        format=image_format,
        created_at=created_at,
        modified_at=modified_at,
        sha256=sha256 or (sha256_file(path) if path.exists() else None),
    )
