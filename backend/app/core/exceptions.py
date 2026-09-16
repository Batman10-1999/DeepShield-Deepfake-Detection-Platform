"""Domain exceptions for the DeepShield detection core.

Every failure the AI pipeline can produce is expressed as a typed
exception carrying a stable `error_code`. The HTTP layer maps those
codes onto structured JSON responses, so no stack trace or internal
detail ever reaches a client.
"""
from __future__ import annotations



class ErrorCode:
    NO_FACE_DETECTED = "NO_FACE_DETECTED"
    FACE_DETECTION_FAILED = "FACE_DETECTION_FAILED"
    UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT"
    CORRUPTED_FILE = "CORRUPTED_FILE"
    PREPROCESSING_FAILED = "PREPROCESSING_FAILED"
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
    INFERENCE_TIMEOUT = "INFERENCE_TIMEOUT"
    INFERENCE_FAILED = "INFERENCE_FAILED"
    UNREADABLE_VIDEO = "UNREADABLE_VIDEO"
    VIDEO_TOO_LONG = "VIDEO_TOO_LONG"
    NO_FRAMES_EXTRACTED = "NO_FRAMES_EXTRACTED"
    NO_ANALYSABLE_FRAMES = "NO_ANALYSABLE_FRAMES"


class DeepShieldError(Exception):
    """Base class: a failure that is safe to surface to an API client."""

    error_code: str = "PREDICTION_FAILED"
    http_status: int = 500
    default_message: str = "Prediction failed."

    def __init__(self, message: str | None = None, **context: object) -> None:
        super().__init__(message or self.default_message)
        self.message = message or self.default_message
        self.context = context


class NoFaceDetectedError(DeepShieldError):
    error_code = ErrorCode.NO_FACE_DETECTED
    http_status = 422
    default_message = (
        "No human face was detected in this image. "
        "DeepShield analyses facial regions, so please upload a photo "
        "that clearly contains at least one face."
    )


class FaceDetectionError(DeepShieldError):
    error_code = ErrorCode.FACE_DETECTION_FAILED
    http_status = 503
    default_message = "The face detection service is unavailable."


class PreprocessingError(DeepShieldError):
    error_code = ErrorCode.PREPROCESSING_FAILED
    http_status = 400
    default_message = "The image could not be preprocessed."


class CorruptedMediaError(DeepShieldError):
    error_code = ErrorCode.CORRUPTED_FILE
    http_status = 400
    default_message = "The image file appears to be corrupted."


class ModelUnavailableError(DeepShieldError):
    error_code = ErrorCode.MODEL_UNAVAILABLE
    http_status = 503
    default_message = "The AI model is not available. Please try again shortly."


class InferenceTimeoutError(DeepShieldError):
    error_code = ErrorCode.INFERENCE_TIMEOUT
    http_status = 504
    default_message = "Inference took too long and was aborted."


class InferenceError(DeepShieldError):
    error_code = ErrorCode.INFERENCE_FAILED
    http_status = 503
    default_message = "The AI model failed to analyse this image."


class UnreadableVideoError(DeepShieldError):
    error_code = ErrorCode.UNREADABLE_VIDEO
    http_status = 400
    default_message = (
        "The video could not be opened. It may be corrupted or use an "
        "unsupported codec."
    )


class VideoTooLongError(DeepShieldError):
    error_code = ErrorCode.VIDEO_TOO_LONG
    http_status = 413
    default_message = "The video is longer than the supported duration limit."


class NoFramesExtractedError(DeepShieldError):
    error_code = ErrorCode.NO_FRAMES_EXTRACTED
    http_status = 422
    default_message = "No readable frames could be extracted from this video."


class NoAnalysableFramesError(DeepShieldError):
    error_code = ErrorCode.NO_ANALYSABLE_FRAMES
    http_status = 422
    default_message = (
        "No human face was detected in any sampled frame. DeepShield "
        "analyses facial regions, so please upload footage containing a face."
    )
