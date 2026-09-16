"""Image detection orchestration.

Sequence for a single image:

    hash -> metadata -> face detection -> preprocessing -> AI pipeline

Face detection runs *before* the CNN: DeepShield reasons about facial
regions, so a face-less upload is rejected with a structured
NO_FACE_DETECTED response instead of producing a meaningless score.
Every heavy step lives in its own service; this module only wires them
together and records timings.
"""
from __future__ import annotations

import time
from pathlib import Path

from PIL import Image

from app.core.config import settings
from app.core.constants import LogEvent
from app.core.exceptions import (
    CorruptedMediaError,
    DeepShieldError,
    FaceDetectionError,
    ModelUnavailableError,
    NoFaceDetectedError,
    PreprocessingError,
)
from app.core.logger import get_logger
from app.core.metrics import ProcessingMetricsCollector, Stage
from app.models.schemas import PredictionResponse
from app.services.ai import PredictionService
from app.services.ai.prediction_service import FaceInput
from app.services.metadata_service import extract_image_metadata
from app.services.preprocessing import load_rgb_image, preprocess_face, preprocess_pil
from app.services.vision import FaceDetectionResult, FaceDetectionService, get_face_detector
from app.utils.hashing import sha256_file

logger = get_logger(__name__)

_service = PredictionService()


class ImageAnalysisService:
    """Composes face detection, preprocessing and the AI pipeline."""

    def __init__(
        self,
        predictor: PredictionService | None = None,
        face_detector: FaceDetectionService | None = None,
    ) -> None:
        self._predictor = predictor or _service
        self._face_detector = face_detector

    @property
    def face_detector(self) -> FaceDetectionService:
        if self._face_detector is None:
            self._face_detector = get_face_detector()
        return self._face_detector

    def analyse(
        self,
        image_path: Path,
        *,
        filename: str | None = None,
        sha256: str | None = None,
    ) -> PredictionResponse:
        if not self._predictor.is_ready():
            raise ModelUnavailableError("AI model is not loaded yet.")

        display_name = filename or image_path.name
        metrics = ProcessingMetricsCollector()

        with metrics.measure(Stage.HASHING):
            digest = sha256 or sha256_file(image_path)
        logger.info("%s: %s -> %s", LogEvent.HASH_GENERATED, display_name, digest)

        with metrics.measure(Stage.METADATA):
            metadata = extract_image_metadata(
                image_path, original_filename=display_name, sha256=digest,
            )
        logger.info("%s: %s (%s, %s, %.1f KB)", LogEvent.METADATA_EXTRACTED,
                    display_name, metadata.resolution or "unknown",
                    metadata.color_mode or "unknown", metadata.size_kb)

        image = self._load(image_path)
        detection = self._detect_faces(image, display_name)

        logger.info("%s: %s", LogEvent.PREPROCESS_STARTED, display_name)
        with metrics.measure(Stage.PREPROCESSING):
            frame_tensor = self._preprocess(lambda: preprocess_pil(image),
                                            display_name)
            face_inputs = self._preprocess_faces(image, detection, display_name)

        return self._predictor.predict(
            frame_tensor,
            filename=display_name,
            preprocess_time_ms=metrics.get(Stage.PREPROCESSING),
            metadata=metadata,
            sha256=digest,
            faces=face_inputs,
            source_image=image,
            face_detection_time_ms=detection.detection_time_ms if detection else 0.0,
            detector_name=detection.detector if detection else None,
        )

    # -- Internals -------------------------------------------------------------
    @staticmethod
    def _load(image_path: Path) -> Image.Image:
        try:
            return load_rgb_image(image_path)
        except ValueError as exc:
            raise CorruptedMediaError(str(exc)) from exc

    def _detect_faces(
        self, image: Image.Image, display_name: str
    ) -> FaceDetectionResult | None:
        if not settings.FACE_DETECTION_ENABLED:
            return None

        try:
            detection = self.face_detector.detect(image)
        except FaceDetectionError:
            if settings.FACE_REQUIRED:
                raise
            logger.warning("%s: %s — analysing the full frame instead",
                           LogEvent.FACE_DETECTION_FAILED, display_name)
            return None

        if not detection.has_faces:
            logger.warning("%s: %s", LogEvent.NO_FACE_DETECTED, display_name)
            if settings.FACE_REQUIRED:
                raise NoFaceDetectedError()
            return detection

        if detection.face_count > 1:
            logger.info("%s: %d faces in %s", LogEvent.MULTI_FACE_DETECTED,
                        detection.face_count, display_name)
        return detection

    def _preprocess_faces(
        self,
        image: Image.Image,
        detection: FaceDetectionResult | None,
        display_name: str,
    ) -> list[FaceInput]:
        if detection is None or not detection.has_faces:
            return []
        return [
            FaceInput(
                region=face,
                tensor=self._preprocess(
                    lambda f=face: preprocess_face(
                        self.face_detector.crop(image, f)
                    ),
                    display_name,
                ),
            )
            for face in detection.faces
        ]

    @staticmethod
    def _preprocess(operation, display_name: str):
        try:
            return operation()
        except ValueError as exc:
            logger.warning("%s: %s (%s)", LogEvent.PREPROCESS_FAILED,
                           display_name, exc)
            raise PreprocessingError(str(exc)) from exc
        except Exception as exc:
            logger.exception("%s: %s", LogEvent.PREPROCESS_FAILED, exc)
            raise PreprocessingError("Image preprocessing failed.") from exc


_analysis_service = ImageAnalysisService()


def predict_image_file(
    image_path: Path,
    *,
    filename: str | None = None,
    sha256: str | None = None,
) -> PredictionResponse:
    """Module-level entry point kept for existing callers."""
    return _analysis_service.analyse(
        image_path, filename=filename, sha256=sha256,
    )


__all__ = ["ImageAnalysisService", "predict_image_file", "DeepShieldError"]
