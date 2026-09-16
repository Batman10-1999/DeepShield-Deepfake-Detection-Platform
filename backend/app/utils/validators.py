"""Reusable, UI-independent validation utilities.

Each validator returns a structured `ValidationResult`. Callers decide
whether to raise HTTP errors or forward the object to the client.
Keeping the logic here means the same rules power `/upload/*`, future
`/predict/*` endpoints, and any batch scripts we add later.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from PIL import Image, UnidentifiedImageError

from app.core.constants import (
    IMAGE_EXTENSIONS,
    IMAGE_MIME_TYPES,
    VIDEO_EXTENSIONS,
    VIDEO_MIME_TYPES,
)
from app.core.config import settings
from app.models.schemas import ValidationResult


def _extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def _size_mb(contents: bytes) -> float:
    return len(contents) / (1024 * 1024)


def _fail(filename: str, media_type: str, contents: bytes,
          ext: str, mime: Optional[str], error: str) -> ValidationResult:
    return ValidationResult(
        is_valid=False,
        filename=filename,
        media_type=media_type,  # type: ignore[arg-type]
        size_bytes=len(contents),
        extension=ext,
        mime_type=mime,
        error=error,
    )


def _ok(filename: str, media_type: str, contents: bytes,
        ext: str, mime: Optional[str]) -> ValidationResult:
    return ValidationResult(
        is_valid=True,
        filename=filename,
        media_type=media_type,  # type: ignore[arg-type]
        size_bytes=len(contents),
        extension=ext,
        mime_type=mime,
    )


# ---------------------------------------------------------------------------
# Image validation
# ---------------------------------------------------------------------------

def validate_image(filename: str, mime: Optional[str], contents: bytes) -> ValidationResult:
    ext = _extension(filename)

    if not filename:
        return _fail(filename, "unknown", contents, ext, mime, "No filename provided.")
    if not contents:
        return _fail(filename, "image", contents, ext, mime, "Uploaded file is empty.")
    if ext not in IMAGE_EXTENSIONS:
        return _fail(filename, "image", contents, ext, mime,
                     f"Unsupported image extension '{ext}'. Allowed: jpg, jpeg, png.")
    if mime and mime not in IMAGE_MIME_TYPES:
        return _fail(filename, "image", contents, ext, mime,
                     f"Unsupported MIME type '{mime}'.")
    if _size_mb(contents) > settings.MAX_IMAGE_SIZE_MB:
        return _fail(filename, "image", contents, ext, mime,
                     f"Image exceeds {settings.MAX_IMAGE_SIZE_MB} MB limit.")

    # Corruption check — cheap header parse, does not decode pixels.
    from io import BytesIO
    try:
        with Image.open(BytesIO(contents)) as img:
            img.verify()
    except (UnidentifiedImageError, OSError, ValueError):
        return _fail(filename, "image", contents, ext, mime,
                     "The image file appears to be corrupted.")

    return _ok(filename, "image", contents, ext, mime)


# ---------------------------------------------------------------------------
# Video validation
# ---------------------------------------------------------------------------

def validate_video(filename: str, mime: Optional[str], contents: bytes) -> ValidationResult:
    ext = _extension(filename)

    if not filename:
        return _fail(filename, "unknown", contents, ext, mime, "No filename provided.")
    if not contents:
        return _fail(filename, "video", contents, ext, mime, "Uploaded file is empty.")
    if ext not in VIDEO_EXTENSIONS:
        return _fail(filename, "video", contents, ext, mime,
                     f"Unsupported video extension '{ext}'. Allowed: mp4, avi, mov, mkv.")
    if mime and mime not in VIDEO_MIME_TYPES:
        return _fail(filename, "video", contents, ext, mime,
                     f"Unsupported MIME type '{mime}'.")
    if _size_mb(contents) > settings.MAX_VIDEO_SIZE_MB:
        return _fail(filename, "video", contents, ext, mime,
                     f"Video exceeds {settings.MAX_VIDEO_SIZE_MB} MB limit.")

    return _ok(filename, "video", contents, ext, mime)


# ---------------------------------------------------------------------------
# Path-based validation (streamed uploads)
# ---------------------------------------------------------------------------

def _result(filename: str, media_type: str, size_bytes: int, ext: str,
            mime: Optional[str], error: Optional[str] = None) -> ValidationResult:
    return ValidationResult(
        is_valid=error is None,
        filename=filename,
        media_type=media_type,  # type: ignore[arg-type]
        size_bytes=size_bytes,
        extension=ext,
        mime_type=mime,
        error=error,
    )


def validate_upload_envelope(filename: str, mime: Optional[str],
                             media_type: str) -> Optional[str]:
    """Cheap pre-transfer check: extension and MIME only.

    Runs before a single byte is streamed so an unsupported upload is
    rejected without touching the disk.
    """
    ext = _extension(filename)
    if not filename:
        return "No filename provided."
    if media_type == "image":
        if ext not in IMAGE_EXTENSIONS:
            return (f"Unsupported image extension '{ext}'. "
                    "Allowed: jpg, jpeg, png.")
        if mime and mime not in IMAGE_MIME_TYPES:
            return f"Unsupported MIME type '{mime}'."
        return None
    if ext not in VIDEO_EXTENSIONS:
        return (f"Unsupported video extension '{ext}'. "
                "Allowed: mp4, avi, mov, mkv.")
    if mime and mime not in VIDEO_MIME_TYPES:
        return f"Unsupported MIME type '{mime}'."
    return None


def validate_image_path(filename: str, mime: Optional[str], path: Path,
                        size_bytes: int) -> ValidationResult:
    """Validate an image already streamed to disk (no full read)."""
    ext = _extension(filename)
    envelope = validate_upload_envelope(filename, mime, "image")
    if envelope:
        return _result(filename, "image", size_bytes, ext, mime, envelope)
    if size_bytes == 0:
        return _result(filename, "image", size_bytes, ext, mime,
                       "Uploaded file is empty.")
    if size_bytes / (1024 * 1024) > settings.MAX_IMAGE_SIZE_MB:
        return _result(filename, "image", size_bytes, ext, mime,
                       f"Image exceeds {settings.MAX_IMAGE_SIZE_MB} MB limit.")
    try:
        with Image.open(path) as img:
            img.verify()
    except (UnidentifiedImageError, OSError, ValueError):
        return _result(filename, "image", size_bytes, ext, mime,
                       "The image file appears to be corrupted.")
    return _result(filename, "image", size_bytes, ext, mime)


def validate_video_path(filename: str, mime: Optional[str], path: Path,
                        size_bytes: int) -> ValidationResult:
    """Validate a video already streamed to disk (no full read)."""
    ext = _extension(filename)
    envelope = validate_upload_envelope(filename, mime, "video")
    if envelope:
        return _result(filename, "video", size_bytes, ext, mime, envelope)
    if size_bytes == 0:
        return _result(filename, "video", size_bytes, ext, mime,
                       "Uploaded file is empty.")
    if size_bytes / (1024 * 1024) > settings.MAX_VIDEO_SIZE_MB:
        return _result(filename, "video", size_bytes, ext, mime,
                       f"Video exceeds {settings.MAX_VIDEO_SIZE_MB} MB limit.")
    if not path.exists():
        return _result(filename, "video", size_bytes, ext, mime,
                       "The uploaded video could not be stored.")
    return _result(filename, "video", size_bytes, ext, mime)
