"""Face extraction for dataset preparation.

Reuses the production OpenCV detector (`FaceDetectionService`) and the
production resize geometry (`transforms.letterbox`), so a crop stored in
the dataset is geometrically identical to a crop produced at inference
time. This is what prevents a train/inference preprocessing mismatch.

    media -> frame/image loading -> face detection -> crop (+margin)
          -> aspect-preserving resize to INPUT_SIZE -> RGB -> saved crop

Normalization is deliberately NOT baked into the stored crop: it is
applied by the shared `ImagePipeline` at training and inference time, so
one pipeline governs both paths.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

from PIL import Image

from app.core.config import settings
from app.core.logger import get_logger
from app.services.preprocessing.image_preprocessor import load_rgb_image
from app.services.preprocessing.transforms import letterbox, stretch_resize, to_rgb
from app.services.vision.face_detector import FaceDetectionService, get_face_detector

logger = get_logger(__name__)


@dataclass(frozen=True)
class ExtractedSampleFace:
    image: Image.Image
    face_index: int
    frame_number: int | None
    detector_score: float
    box: tuple[int, int, int, int] = (0, 0, 0, 0)   # x, y, w, h in source
    timestamp_sec: float | None = None


class SampleFaceExtractor:
    """Produces model-ready face crops from one raw sample."""

    def __init__(
        self,
        detector: FaceDetectionService | None = None,
        *,
        input_size: int | None = None,
        frames_per_video: int | None = None,
        max_faces: int | None = None,
        min_face_px: int | None = None,
    ) -> None:
        self._detector = detector or get_face_detector()
        self._input_size = int(input_size or settings.INPUT_SIZE)
        self._frames_per_video = int(
            frames_per_video
            if frames_per_video is not None
            else settings.DATASET_FRAMES_PER_VIDEO
        )
        self._max_faces = int(
            max_faces if max_faces is not None
            else settings.DATASET_MAX_FACES_PER_SAMPLE
        )
        self._min_face_px = int(
            min_face_px if min_face_px is not None
            else settings.DATASET_MIN_FACE_PX
        )

    def extract_image(self, path: Path) -> list[ExtractedSampleFace]:
        return self._faces_in(load_rgb_image(path), frame_number=None)

    def extract_video(self, path: Path) -> list[ExtractedSampleFace]:
        """Sample a bounded number of frames, then crop faces from each."""
        from app.services.video.video_metadata_service import extract_video_metadata
        from app.services.vision.frame_extractor import (
            FrameExtractionService,
            UniformSampling,
        )

        metadata = extract_video_metadata(path)
        extractor = FrameExtractionService(
            UniformSampling(), max_frames=self._frames_per_video)
        extraction = extractor.extract(
            path,
            frame_count=int(getattr(metadata, "frame_count", 0) or 0),
            fps=float(getattr(metadata, "fps", 0.0) or 0.0),
        )
        faces: list[ExtractedSampleFace] = []
        for frame in extraction.frames:
            faces.extend(self._faces_in(
                frame.image,
                frame_number=frame.frame_number,
                timestamp_sec=getattr(frame, "timestamp_sec", None),
            ))
        return faces

    def extract(self, path: Path, media_type: str) -> list[ExtractedSampleFace]:
        if media_type == "video":
            return self.extract_video(path)
        return self.extract_image(path)

    # -- Internals -------------------------------------------------------------
    def _faces_in(self, image: Image.Image, *,
                  frame_number: int | None,
                  timestamp_sec: float | None = None,
                  ) -> list[ExtractedSampleFace]:
        detection = self._detector.detect(image)
        usable = [f for f in detection.faces
                  if min(f.width, f.height) >= self._min_face_px]
        selected = sorted(usable, key=lambda f: f.area, reverse=True)
        if self._max_faces > 0:
            selected = selected[: self._max_faces]
        return [
            ExtractedSampleFace(
                image=self._resize(self._detector.crop(image, face)),
                face_index=face.index,
                frame_number=frame_number,
                detector_score=face.detector_score,
                box=(face.x, face.y, face.width, face.height),
                timestamp_sec=timestamp_sec,
            )
            for face in selected
        ]

    def _resize(self, crop: Image.Image) -> Image.Image:
        rgb = to_rgb(crop)
        if settings.PRESERVE_ASPECT_RATIO:
            return letterbox(rgb, self._input_size)
        return stretch_resize(rgb, self._input_size)
