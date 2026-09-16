"""Upload + preprocessing endpoints.

These endpoints DO NOT run any AI model. They accept a file, validate it,
persist it, and run the preprocessing pipeline so the media is ready for
the future detection phase.

    POST /upload/image  -> ImageUploadResponse
    POST /upload/video  -> VideoUploadResponse
"""
from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.constants import LogEvent
from app.core.logger import get_logger
from app.models.schemas import ImageUploadResponse, VideoUploadResponse
from app.core.config import settings
from app.services.preprocessing import preprocess_image, preprocess_video
from app.utils.file_utils import (
    UploadTooLarge,
    discard_upload,
    stream_upload_to_disk,
    unique_filename,
)
from app.utils.validators import (
    validate_image_path,
    validate_upload_envelope,
    validate_video_path,
)

logger = get_logger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])


def _reject(result) -> None:
    """Translate a failed ValidationResult into an HTTPException."""
    detail = result.error or "Invalid file."
    code = status.HTTP_400_BAD_REQUEST
    if "MIME" in detail:
        code = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    elif "exceeds" in detail:
        code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    logger.warning("%s: %s (%s)", LogEvent.VALIDATION_FAILED,
                   result.filename, detail)
    raise HTTPException(status_code=code, detail=detail)


async def _store(file: UploadFile, media_type: str, limit_mb: int):
    """Envelope-check then stream the upload to disk in chunks."""
    envelope_error = validate_upload_envelope(
        file.filename, file.content_type, media_type)
    if envelope_error:
        logger.warning("%s: %s (%s)", LogEvent.VALIDATION_FAILED,
                       file.filename, envelope_error)
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            envelope_error)
    try:
        return await stream_upload_to_disk(
            file, unique_filename(file.filename),
            max_bytes=limit_mb * 1024 * 1024)
    except UploadTooLarge as exc:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            str(exc)) from exc


@router.post("/image", response_model=ImageUploadResponse)
async def upload_image(file: UploadFile = File(...)) -> ImageUploadResponse:
    if file is None or not file.filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No image file provided.")

    logger.info("%s: %s (%s)", LogEvent.UPLOAD_RECEIVED,
                file.filename, file.content_type)
    logger.info("%s: %s", LogEvent.VALIDATION_STARTED, file.filename)
    stored = await _store(file, "image", settings.MAX_IMAGE_SIZE_MB)
    validation = validate_image_path(file.filename, file.content_type,
                                     stored.path, stored.size_bytes)
    if not validation.is_valid:
        discard_upload(stored.path)
        _reject(validation)
    logger.info("%s: %s", LogEvent.VALIDATION_PASSED, file.filename)

    saved_path = stored.path

    try:
        _tensor, summary = preprocess_image(saved_path)
    except ValueError as exc:
        logger.warning("%s: %s (%s)", LogEvent.PREPROCESS_FAILED,
                       file.filename, exc)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("%s: %s", LogEvent.PREPROCESS_FAILED, exc)
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Image preprocessing failed.",
        ) from exc

    return ImageUploadResponse(
        filename=file.filename,
        saved_path=str(saved_path),
        validation=validation,
        preprocessing=summary,
    )


@router.post("/video", response_model=VideoUploadResponse)
async def upload_video(file: UploadFile = File(...)) -> VideoUploadResponse:
    if file is None or not file.filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No video file provided.")

    logger.info("%s: %s (%s)", LogEvent.UPLOAD_RECEIVED,
                file.filename, file.content_type)
    logger.info("%s: %s", LogEvent.VALIDATION_STARTED, file.filename)
    stored = await _store(file, "video", settings.MAX_VIDEO_SIZE_MB)
    validation = validate_video_path(file.filename, file.content_type,
                                     stored.path, stored.size_bytes)
    if not validation.is_valid:
        discard_upload(stored.path)
        _reject(validation)
    logger.info("%s: %s", LogEvent.VALIDATION_PASSED, file.filename)

    saved_path = stored.path

    try:
        _frames, summary = preprocess_video(saved_path)
    except ValueError as exc:
        logger.warning("%s: %s (%s)", LogEvent.PREPROCESS_FAILED,
                       file.filename, exc)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("%s: %s", LogEvent.PREPROCESS_FAILED, exc)
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Video preprocessing failed.",
        ) from exc

    return VideoUploadResponse(
        filename=file.filename,
        saved_path=str(saved_path),
        validation=validation,
        preprocessing=summary,
    )
