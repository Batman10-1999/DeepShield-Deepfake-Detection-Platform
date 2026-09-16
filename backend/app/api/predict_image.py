"""POST /predict/image — image deepfake detection endpoint.

Orchestrates: upload validation -> disk persist -> preprocessing ->
AI prediction pipeline -> structured JSON response. All AI logic is
delegated to `app.services.ai` — this file only handles HTTP concerns
and translates exceptions into structured error responses.
"""
from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from app.core.constants import LogEvent
from app.core.exceptions import DeepShieldError
from app.core.logger import get_logger
from app.models.schemas import PredictionResponse
from app.services.ai.response_builder import build_error_response
from app.core.config import settings
from app.services.image_service import predict_image_file
from app.utils.file_utils import (
    UploadTooLarge,
    discard_upload,
    stream_upload_to_disk,
    unique_filename,
)
from app.utils.validators import validate_image_path, validate_upload_envelope

logger = get_logger(__name__)
router = APIRouter(prefix="/predict", tags=["prediction"])

_ERROR_CODES = {
    status.HTTP_400_BAD_REQUEST: "BAD_INPUT",
    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE: "FILE_TOO_LARGE",
    status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
    status.HTTP_503_SERVICE_UNAVAILABLE: "MODEL_UNAVAILABLE",
}


def _error(code: int, error_code: str, message: str,
           filename: str | None = None) -> JSONResponse:
    payload = build_error_response(
        error_code=error_code, message=message, filename=filename,
    )
    return JSONResponse(status_code=code, content=payload.model_dump())


def _validation_status(message: str) -> int:
    if "MIME" in message or "extension" in message:
        return status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    if "exceeds" in message:
        return status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    return status.HTTP_400_BAD_REQUEST


def _validation_code(message: str) -> str:
    if "corrupted" in message.lower():
        return "CORRUPTED_FILE"
    if "empty" in message.lower():
        return "EMPTY_FILE"
    if "exceeds" in message:
        return "FILE_TOO_LARGE"
    if "MIME" in message or "extension" in message:
        return "UNSUPPORTED_FORMAT"
    return "INVALID_IMAGE"


@router.post("/image", response_model=PredictionResponse)
async def predict_image_endpoint(file: UploadFile = File(...)):
    if file is None or not file.filename:
        return _error(status.HTTP_400_BAD_REQUEST, "NO_FILE",
                      "No image file provided.")

    logger.info("%s: %s (%s)", LogEvent.UPLOAD_RECEIVED,
                file.filename, file.content_type)

    logger.info("%s: %s", LogEvent.VALIDATION_STARTED, file.filename)
    envelope_error = validate_upload_envelope(
        file.filename, file.content_type, "image")
    if envelope_error:
        logger.warning("%s: %s (%s)", LogEvent.VALIDATION_FAILED,
                       file.filename, envelope_error)
        return _error(_validation_status(envelope_error),
                      _validation_code(envelope_error), envelope_error,
                      filename=file.filename)

    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    try:
        stored = await stream_upload_to_disk(
            file, unique_filename(file.filename), max_bytes=max_bytes)
    except UploadTooLarge as exc:
        logger.warning("%s: %s (%s)", LogEvent.VALIDATION_FAILED,
                       file.filename, exc)
        return _error(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                      "FILE_TOO_LARGE",
                      f"Image exceeds {settings.MAX_IMAGE_SIZE_MB} MB limit.",
                      filename=file.filename)
    except Exception:
        logger.exception("%s: unable to read upload stream", LogEvent.ERROR)
        return _error(status.HTTP_400_BAD_REQUEST, "UPLOAD_READ_FAILED",
                      "The uploaded file could not be read.",
                      filename=file.filename)

    validation = validate_image_path(file.filename, file.content_type,
                                     stored.path, stored.size_bytes)
    if not validation.is_valid:
        message = validation.error or "Invalid image."
        discard_upload(stored.path)
        logger.warning("%s: %s (%s)", LogEvent.VALIDATION_FAILED,
                       file.filename, message)
        return _error(_validation_status(message), _validation_code(message),
                      message, filename=file.filename)

    logger.info("%s: %s (%.1f KB)", LogEvent.VALIDATION_PASSED,
                file.filename, validation.size_bytes / 1024)

    digest = stored.sha256
    saved_path = stored.path
    logger.info("%s: %s -> %s", LogEvent.UPLOAD_SAVED, file.filename, saved_path)

    try:
        return predict_image_file(saved_path, filename=file.filename,
                                  sha256=digest)
    except DeepShieldError as exc:
        logger.warning("%s: %s (%s)", LogEvent.PREDICTION_FAILED,
                       file.filename, exc.error_code)
        return _error(exc.http_status, exc.error_code, exc.message,
                      filename=file.filename)
    except HTTPException as exc:
        logger.warning("%s: %s (%s)", LogEvent.PREDICTION_FAILED,
                       file.filename, exc.detail)
        return _error(
            exc.status_code,
            _ERROR_CODES.get(exc.status_code, "PREDICTION_ERROR"),
            str(exc.detail),
            filename=file.filename,
        )
    except Exception as exc:
        logger.exception("%s: %s", LogEvent.PREDICTION_FAILED, exc)
        return _error(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "PREDICTION_FAILED",
            "Prediction failed. Please try a different image.",
            filename=file.filename,
        )

