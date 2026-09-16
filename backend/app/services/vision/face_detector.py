"""Face Detection Service.

DeepShield analyses facial regions, so every image passes through this
service before it ever reaches the CNN. The implementation is a thin,
swappable strategy: OpenCV's Haar cascade today, an MTCNN/RetinaFace
detector tomorrow — callers only depend on `FaceDetectionService`.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Sequence

import numpy as np
from PIL import Image

from app.core.config import settings
from app.core.constants import LogEvent
from app.core.config import settings
from app.core.exceptions import FaceDetectionError
from app.core.logger import get_logger

logger = get_logger(__name__)


@dataclass(frozen=True)
class FaceRegion:
    """Axis-aligned face bounding box in original-image coordinates."""

    index: int
    x: int
    y: int
    width: int
    height: int
    detector_score: float = 1.0

    @property
    def area(self) -> int:
        return self.width * self.height

    @property
    def box(self) -> tuple[int, int, int, int]:
        return self.x, self.y, self.x + self.width, self.y + self.height

    def expanded(self, margin: float, bounds: tuple[int, int]) -> tuple[int, int, int, int]:
        """Bounding box grown by `margin` (fraction) and clipped to the image."""
        img_w, img_h = bounds
        dx, dy = int(self.width * margin), int(self.height * margin)
        left = max(0, self.x - dx)
        top = max(0, self.y - dy)
        right = min(img_w, self.x + self.width + dx)
        bottom = min(img_h, self.y + self.height + dy)
        return left, top, right, bottom

    def as_dict(self) -> dict[str, float | int]:
        return {
            "index": self.index,
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "detector_score": round(self.detector_score, 4),
        }


@dataclass(frozen=True)
class FaceDetectionResult:
    """Outcome of one detection pass, including its cost."""

    faces: list[FaceRegion]
    image_width: int
    image_height: int
    detector: str
    detection_time_ms: float

    @property
    def face_count(self) -> int:
        return len(self.faces)

    @property
    def has_faces(self) -> bool:
        return bool(self.faces)


class FaceDetectionStrategy(ABC):
    """Contract every detector backend implements."""

    name: str = "abstract"

    @abstractmethod
    def locate(self, image: np.ndarray) -> Sequence[tuple[int, int, int, int, float]]:
        """Return (x, y, w, h, score) tuples for an RGB numpy image."""
        raise NotImplementedError


CASCADE_FILENAME = "haarcascade_frontalface_default.xml"


class HaarCascadeDetector(FaceDetectionStrategy):
    """OpenCV frontal-face Haar cascade — dependency-free and offline."""

    name = "opencv_haar_frontalface"

    def __init__(self) -> None:
        self._cascade = self._load_cascade()

    @staticmethod
    def _load_cascade():
        try:
            import cv2  # imported lazily so the API boots without OpenCV
        except ImportError as exc:  # pragma: no cover - environment guard
            raise FaceDetectionError(
                "Face detection requires OpenCV, which is not installed."
            ) from exc

        classifier = getattr(cv2, "CascadeClassifier", None) or getattr(
            getattr(cv2, "objdetect", None), "CascadeClassifier", None
        )
        if classifier is None:
            raise FaceDetectionError(
                "The installed OpenCV build has no cascade classifier support."
            )
        for path in HaarCascadeDetector._cascade_candidates(cv2):
            if not path.exists():
                continue
            cascade = classifier(str(path))
            if not cascade.empty():
                logger.info("Loaded face cascade from %s", path)
                return cascade
        raise FaceDetectionError("Face detection model could not be loaded.")

    @staticmethod
    def _cascade_candidates(cv2) -> list[Path]:
        """Where to look for the Haar cascade, in priority order.

        Some OpenCV builds (notably slim//nix packaged ones) ship without the
        bundled `cv2/data` XML files, which silently disabled face detection.
        A vendored copy under `weights/` keeps detection working offline
        regardless of the OpenCV build.
        """
        candidates: list[Path] = []
        configured = getattr(settings, "FACE_CASCADE_PATH", None)
        if configured:
            candidates.append(Path(configured))
        data_dir = getattr(getattr(cv2, "data", None), "haarcascades", None)
        if data_dir:
            candidates.append(Path(data_dir) / CASCADE_FILENAME)
        candidates.append(Path(settings.WEIGHTS_DIR) / CASCADE_FILENAME)
        return candidates

    def locate(self, image: np.ndarray) -> Sequence[tuple[int, int, int, int, float]]:
        import cv2

        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        gray = cv2.equalizeHist(gray)
        min_size = settings.FACE_MIN_SIZE_PX
        detections = self._cascade.detectMultiScale(
            gray,
            scaleFactor=settings.FACE_SCALE_FACTOR,
            minNeighbors=settings.FACE_MIN_NEIGHBORS,
            minSize=(min_size, min_size),
        )
        return [(int(x), int(y), int(w), int(h), 1.0) for x, y, w, h in detections]


class FaceDetectionService:
    """Reusable façade around a detection strategy.

    Responsibilities: run the strategy, normalise its output, sort by
    prominence, cap the face count, and produce face crops for the
    preprocessing layer. It never decides what a missing face *means* —
    that policy lives in the calling service.
    """

    def __init__(self, strategy: FaceDetectionStrategy | None = None) -> None:
        self._strategy = strategy
        self._strategy_error: Optional[Exception] = None

    @property
    def strategy(self) -> FaceDetectionStrategy:
        if self._strategy is None:
            if self._strategy_error is not None:
                raise FaceDetectionError(str(self._strategy_error))
            try:
                self._strategy = HaarCascadeDetector()
            except Exception as exc:
                self._strategy_error = exc
                raise FaceDetectionError(
                    "The face detection service is unavailable."
                ) from exc
        return self._strategy

    def detect(self, image: Image.Image) -> FaceDetectionResult:
        """Locate every face in a PIL RGB image."""
        import time

        started = time.perf_counter()
        array = np.asarray(image.convert("RGB"))
        logger.info("%s: %dx%d", LogEvent.FACE_DETECTION_STARTED, *image.size)

        try:
            raw = self.strategy.locate(array)
        except FaceDetectionError:
            raise
        except Exception as exc:
            logger.exception("%s: %s", LogEvent.FACE_DETECTION_FAILED, exc)
            raise FaceDetectionError(
                "Face detection failed while scanning this image."
            ) from exc

        faces = self._normalise(raw)
        elapsed_ms = round((time.perf_counter() - started) * 1000.0, 2)
        logger.info("%s: %d face(s) in %.2fms via %s",
                    LogEvent.FACE_DETECTION_COMPLETED, len(faces),
                    elapsed_ms, self.strategy.name)

        return FaceDetectionResult(
            faces=faces,
            image_width=image.width,
            image_height=image.height,
            detector=self.strategy.name,
            detection_time_ms=elapsed_ms,
        )

    def crop(self, image: Image.Image, face: FaceRegion) -> Image.Image:
        """Crop a face with the configured context margin."""
        box = face.expanded(settings.FACE_CROP_MARGIN, (image.width, image.height))
        return image.convert("RGB").crop(box)

    # -- Internals -------------------------------------------------------------
    def _normalise(
        self, raw: Sequence[tuple[int, int, int, int, float]]
    ) -> list[FaceRegion]:
        ordered = sorted(raw, key=lambda d: d[2] * d[3], reverse=True)
        capped = ordered[: settings.MAX_FACES_PER_IMAGE]
        return [
            FaceRegion(index=i, x=x, y=y, width=w, height=h, detector_score=score)
            for i, (x, y, w, h, score) in enumerate(capped)
        ]


_service: Optional[FaceDetectionService] = None


def get_face_detector() -> FaceDetectionService:
    """Process-wide detector (cascade is loaded once, then reused)."""
    global _service
    if _service is None:
        _service = FaceDetectionService()
    return _service
