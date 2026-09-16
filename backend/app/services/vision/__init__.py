"""Computer-vision services (face detection today, tracking later)."""
from app.services.vision.face_detector import (
    FaceDetectionResult,
    FaceDetectionService,
    FaceRegion,
    get_face_detector,
)
from app.services.vision.frame_extractor import (
    ExtractedFrame,
    FrameExtractionResult,
    FrameExtractionService,
    FrameSelectionStrategy,
    build_strategy,
)

__all__ = [
    "ExtractedFrame",
    "FrameExtractionResult",
    "FrameExtractionService",
    "FrameSelectionStrategy",
    "build_strategy",
    "FaceDetectionResult",
    "FaceDetectionService",
    "FaceRegion",
    "get_face_detector",
]
