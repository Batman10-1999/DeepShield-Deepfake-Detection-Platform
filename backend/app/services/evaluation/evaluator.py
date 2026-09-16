"""Isolated test-set evaluation.

Loads a checkpoint through the existing ModelLoader path, runs the test
split once, and writes a metrics report. It never touches training or
validation data, and it refuses to emit numbers when no checkpoint or no
test split exists.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.logger import get_logger
from app.services.dataset.layout import DatasetLayout
from app.services.evaluation.metrics import BinaryMetrics, compute_metrics
from app.services.training.checkpoint_manager import CheckpointManager
from app.services.training.config import resolve_device
from app.services.training.datamodule import build_dataloaders

logger = get_logger(__name__)

PENDING_MESSAGE = "Evaluation pending trained deepfake checkpoint."


@dataclass
class EvaluationReport:
    available: bool
    message: str
    architecture: str
    checkpoint: Optional[str] = None
    deepfake_trained_checkpoint: bool = False
    split: str = "test"
    samples: int = 0
    metrics: dict = field(default_factory=dict)
    evaluated_at: str = ""

    def as_dict(self) -> dict:
        return asdict(self)

    def save(self, directory: Path | None = None) -> Path:
        target_dir = directory or settings.EVALUATION_DIR
        target_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        path = target_dir / f"evaluation_{self.architecture}_{stamp}.json"
        path.write_text(json.dumps(self.as_dict(), indent=2))
        return path


class ModelEvaluator:
    """Reusable test-set evaluator."""

    def __init__(
        self,
        *,
        layout: DatasetLayout | None = None,
        checkpoints: CheckpointManager | None = None,
    ) -> None:
        self._layout = layout or DatasetLayout()
        self._checkpoints = checkpoints or CheckpointManager()

    def evaluate(
        self,
        architecture: str | None = None,
        *,
        split: str = "test",
        batch_size: int | None = None,
    ) -> EvaluationReport:
        import torch

        from app.services.ai.model_registry import build_model

        arch = architecture or settings.DEFAULT_MODEL
        checkpoint = self._checkpoints.latest(arch)
        loaders = build_dataloaders(
            layout=self._layout, batch_size=batch_size,
            augment_train=False, splits=(split,),
        )

        if checkpoint is None:
            return EvaluationReport(
                available=False, message=PENDING_MESSAGE, architecture=arch)
        if split not in loaders:
            return EvaluationReport(
                available=False,
                message=f"No samples in the '{split}' split — evaluation skipped.",
                architecture=arch,
                checkpoint=str(checkpoint.path),
                deepfake_trained_checkpoint=
                checkpoint.is_verified_deepfake_checkpoint,
            )

        device = torch.device(resolve_device(settings.TRAIN_DEVICE))
        model = build_model(arch, pretrained=False)
        model.load_state_dict(torch.load(checkpoint.path, map_location=device))
        model.eval().to(device)

        probabilities: list[float] = []
        labels: list[float] = []
        with torch.inference_mode():
            for inputs, targets in loaders[split]:
                logits = model(inputs.to(device))
                probabilities += torch.sigmoid(logits).flatten().tolist()
                labels += targets.flatten().tolist()

        metrics: BinaryMetrics = compute_metrics(labels, probabilities)
        report = EvaluationReport(
            available=True,
            message="Evaluated on the isolated test split.",
            architecture=arch,
            checkpoint=str(checkpoint.path),
            deepfake_trained_checkpoint=checkpoint.is_verified_deepfake_checkpoint,
            split=split,
            samples=metrics.samples,
            metrics=metrics.as_dict(),
            evaluated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        )
        report.save()
        logger.info("Evaluation complete: accuracy=%.4f on %d samples.",
                    metrics.accuracy, metrics.samples)
        return report

    def collect_probabilities(
        self, architecture: str | None = None, *, split: str = "validation",
    ) -> tuple[list[float], list[float]]:
        """Raw (labels, probabilities) for calibration fitting."""
        import torch

        from app.services.ai.model_registry import build_model

        arch = architecture or settings.DEFAULT_MODEL
        checkpoint = self._checkpoints.latest(arch)
        loaders = build_dataloaders(
            layout=self._layout, augment_train=False, splits=(split,))
        if checkpoint is None or split not in loaders:
            return [], []

        device = torch.device(resolve_device(settings.TRAIN_DEVICE))
        model = build_model(arch, pretrained=False)
        model.load_state_dict(torch.load(checkpoint.path, map_location=device))
        model.eval().to(device)

        labels: list[float] = []
        probabilities: list[float] = []
        with torch.inference_mode():
            for inputs, targets in loaders[split]:
                logits = model(inputs.to(device))
                probabilities += torch.sigmoid(logits).flatten().tolist()
                labels += targets.flatten().tolist()
        return labels, probabilities
