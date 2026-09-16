"""Frame Analysis Pipeline.

A frame is just an image, so this module owns no detection logic of its
own: it wires an extracted frame through the *existing* face detection,
preprocessing and prediction services and returns the canonical
`PredictionResponse` those services already produce.
"""
from __future__ import annotations

from dataclasses import dataclass

import torch
from PIL import Image

from app.core.config import settings
from app.core.exceptions import FaceDetectionError, PreprocessingError
from app.core.logger import get_logger
from app.models.schemas import PredictionResponse
from app.services.ai.prediction_service import FaceInput, PredictionService
from app.services.preprocessing import preprocess_face, preprocess_pil
from app.services.vision import FaceDetectionResult, FaceDetectionService, get_face_detector
from app.services.vision.frame_extractor import ExtractedFrame

logger = get_logger(__name__)


@dataclass(frozen=True)
class FrameAnalysis:
    """A frame paired with the prediction the shared pipeline produced.

    The preprocessed tensor is retained so explainability can run later
    on selected frames without a second preprocessing pass.
    """

    frame: ExtractedFrame
    response: PredictionResponse
    faces_detected: int
    tensor: torch.Tensor


class FrameAnalyzer:
    """Runs one extracted frame through the shared image AI pipeline."""

    def __init__(
        self,
        predictor: PredictionService,
        face_detector: FaceDetectionService | None = None,
    ) -> None:
        self._predictor = predictor
        self._face_detector = face_detector

    @property
    def face_detector(self) -> FaceDetectionService:
        if self._face_detector is None:
            self._face_detector = get_face_detector()
        return self._face_detector

    def analyse(
        self, frame: ExtractedFrame, *, source_name: str, explain: bool = False
    ) -> FrameAnalysis | None:
        """Analyse a frame, or return None when it carries no usable face."""
        detection = self._detect(frame.image, source_name)
        if (
            settings.FACE_DETECTION_ENABLED
            and settings.VIDEO_SKIP_FACELESS_FRAMES
            and (detection is None or not detection.has_faces)
        ):
            return None

        try:
            frame_tensor = preprocess_pil(frame.image)
            faces = self._face_inputs(frame.image, detection)
        except ValueError as exc:
            raise PreprocessingError(str(exc)) from exc

        response = self._predictor.predict(
            frame_tensor,
            filename=f"{source_name}#frame_{frame.frame_number}",
            media_type="video",
            faces=faces,
            explain=explain,
            face_detection_time_ms=detection.detection_time_ms if detection else 0.0,
            detector_name=detection.detector if detection else None,
        )
        return FrameAnalysis(
            frame=frame,
            response=response,
            faces_detected=detection.face_count if detection else 0,
            tensor=frame_tensor,
        )

    # -- Internals -------------------------------------------------------------
    def _detect(
        self, image: Image.Image, source_name: str
    ) -> FaceDetectionResult | None:
        if not settings.FACE_DETECTION_ENABLED:
            return None
        try:
            return self.face_detector.detect(image)
        except FaceDetectionError:
            logger.warning("Face detection unavailable for %s — using full frame",
                           source_name)
            return None

    def _face_inputs(
        self, image: Image.Image, detection: FaceDetectionResult | None
    ) -> list[FaceInput]:
        if detection is None or not detection.has_faces:
            return []
        return [
            FaceInput(
                region=face,
                tensor=preprocess_face(self.face_detector.crop(image, face)),
            )
            for face in detection.faces
        ]
