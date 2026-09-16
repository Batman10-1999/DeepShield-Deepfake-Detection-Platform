"""On-disk persistence helpers + legacy validation wrapper.

The heavy lifting for validation now lives in `app.utils.validators`. This
module keeps a thin wrapper for the legacy image-prediction endpoint so it
continues to work while we migrate everything to the new pipeline.
"""
from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.core.logger import get_logger
from app.utils.validators import validate_image

logger = get_logger(__name__)


def unique_filename(original: str) -> str:
    """Return a collision-safe name preserving the original extension."""
    suffix = Path(original).suffix.lower()
    return f"{uuid.uuid4().hex}{suffix}"


def save_upload(contents: bytes, filename: str, directory: Path | None = None) -> Path:
    """Write bytes to `directory / filename` and return the resulting path."""
    target_dir = directory or settings.UPLOAD_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / filename
    target.write_bytes(contents)
    logger.info("Saved upload -> %s (%.1f KB)", target, len(contents) / 1024)
    return target


def validate_image_upload(filename: str, content_type: str | None, contents: bytes) -> None:
    """Legacy wrapper used by /predict/image; raises HTTPException on failure."""
    result = validate_image(filename, content_type, contents)
    if not result.is_valid:
        # Choose an HTTP code that best matches the failure category.
        detail = result.error or "Invalid image."
        code = status.HTTP_400_BAD_REQUEST
        if "MIME" in detail:
            code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        elif "exceeds" in detail:
            code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
        raise HTTPException(status_code=code, detail=detail)


@dataclass(frozen=True)
class StoredUpload:
    """An upload that was streamed to disk without being held in memory."""
    path: Path
    size_bytes: int
    sha256: str


class UploadTooLarge(Exception):
    """Raised as soon as an upload exceeds its byte budget."""

    def __init__(self, limit_mb: float) -> None:
        super().__init__(f"Upload exceeds {limit_mb:.0f} MB limit.")
        self.limit_mb = limit_mb


async def stream_upload_to_disk(
    file: UploadFile,
    filename: str,
    *,
    max_bytes: int,
    directory: Optional[Path] = None,
) -> StoredUpload:
    """Write an upload to disk in chunks, hashing as we go.

    The file never exists fully in memory, the size limit is enforced while
    streaming (so an oversized upload is rejected early), and a partial
    file is deleted if the transfer fails or is interrupted.
    """
    target_dir = directory or settings.UPLOAD_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / filename
    digest = hashlib.sha256()
    written = 0

    try:
        with target.open("wb") as handle:
            while True:
                chunk = await file.read(settings.UPLOAD_CHUNK_BYTES)
                if not chunk:
                    break
                written += len(chunk)
                if written > max_bytes:
                    raise UploadTooLarge(max_bytes / (1024 * 1024))
                digest.update(chunk)
                handle.write(chunk)
    except BaseException:
        target.unlink(missing_ok=True)
        raise

    logger.info("Streamed upload -> %s (%.1f MB)", target, written / (1024 * 1024))
    return StoredUpload(path=target, size_bytes=written, sha256=digest.hexdigest())


def discard_upload(path: Path) -> None:
    """Remove a stored upload, ignoring an already-deleted file."""
    try:
        path.unlink(missing_ok=True)
    except OSError as exc:  # pragma: no cover - defensive
        logger.warning("Could not remove upload %s: %s", path, exc)
