"""
Video inference using the preprocessing/inference methodology
demonstrated by the pretrained DeepfakeDetector checkpoint.

Important:
- Video only.
- Does NOT modify the existing image InferenceEngine.
- Uses full video frames, not face crops.
- 10 uniformly sampled frames.
- Averages class probabilities.
- Checkpoint class mapping:
    class 0 = REAL
    class 1 = FAKE
"""

from __future__ import annotations

from dataclasses import dataclass

from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from app.services.model_loader import ModelLoader


@dataclass(frozen=True)
class VideoInferenceResult:
    """Result of full-frame video inference."""

    real_probability: float
    fake_probability: float
    predicted_class: int
    frames_analyzed: int
    sampled_frame_indexes: list[int]
    frame_probabilities: list[list[float]]
    model_name: str
    device: str


class UpstreamVideoInference:
    """
    Full-frame video inference for the DeepfakeDetector checkpoint.

    The implementation follows the checkpoint author's demonstrated
    video methodology:
        10 uniformly sampled frames
        -> 224x224 RGB
        -> ImageNet normalization
        -> softmax
        -> probability averaging
    """

    NUM_FRAMES = 10

    _transform = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ]
    )

    def __init__(
        self,
        loader: ModelLoader | None = None,
    ) -> None:
        self._loader = loader or ModelLoader.get_instance()

    def analyze(
        self,
        video_path: str | Path,
    ) -> VideoInferenceResult:

        video_path = Path(video_path)

        if not video_path.exists():
            raise FileNotFoundError(
                f"Video not found: {video_path}"
            )

        self._loader.load("efficientnet_b0")

        frames, indexes = self._extract_uniform_frames(
            video_path,
            self.NUM_FRAMES,
        )

        if not frames:
            raise RuntimeError(
                "No readable frames were extracted from the video."
            )

        model = self._loader.model
        device = self._loader.device

        probabilities: list[np.ndarray] = []

        with torch.inference_mode():

            for frame in frames:

                tensor = self._transform(frame).unsqueeze(0)
                tensor = tensor.to(device)

                logits = model(tensor)

                probs = torch.softmax(
                    logits,
                    dim=1,
                )[0]

                probabilities.append(
                    probs.detach()
                    .cpu()
                    .numpy()
                )

        average_probability = np.mean(
            np.stack(probabilities),
            axis=0,
        )

        real_probability = float(
            average_probability[0]
        )

        fake_probability = float(
            average_probability[1]
        )

        predicted_class = int(
            np.argmax(average_probability)
        )

        return VideoInferenceResult(
            real_probability=real_probability,
            fake_probability=fake_probability,
            predicted_class=predicted_class,
            frames_analyzed=len(frames),
            sampled_frame_indexes=indexes,
            frame_probabilities=[
                p.tolist() for p in probabilities
            ],
            model_name=self._loader.model_name or "efficientnet_b0",
            device=str(device),
        )

    @staticmethod
    def _extract_uniform_frames(
        video_path: Path,
        num_frames: int,
    ) -> tuple[list[Image.Image], list[int]]:

        cap = cv2.VideoCapture(str(video_path))

        if not cap.isOpened():
            raise RuntimeError(
                f"Could not open video: {video_path}"
            )

        try:
            total_frames = int(
                cap.get(cv2.CAP_PROP_FRAME_COUNT)
            )

            if total_frames <= 0:
                raise RuntimeError(
                    "Video contains no readable frames."
                )

            count = min(
                num_frames,
                total_frames,
            )

            indexes = np.linspace(
                0,
                total_frames - 1,
                num=count,
                dtype=int,
            )

            target_indexes = set(
                indexes.tolist()
            )

            frames: list[Image.Image] = []
            collected_indexes: list[int] = []

            current_index = 0

            while True:

                success, frame = cap.read()

                if not success:
                    break

                if current_index in target_indexes:

                    rgb = cv2.cvtColor(
                        frame,
                        cv2.COLOR_BGR2RGB,
                    )

                    frames.append(
                        Image.fromarray(rgb)
                    )

                    collected_indexes.append(
                        current_index
                    )

                    if len(frames) == count:
                        break

                current_index += 1

            return frames, collected_indexes

        finally:
            cap.release()