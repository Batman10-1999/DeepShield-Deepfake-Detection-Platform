"""Training loop.

Responsibilities: run epochs, track validation loss/metrics, stop early
and hand the best weights to the CheckpointManager. Architecture creation
stays in the model registry and metric computation stays in the
evaluation package, so this file only owns the loop.

The trainer never starts on import and never runs without an explicit
call: `scripts/train.py` requires a prepared dataset and confirmation.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Callable, Optional

from app.core.config import settings
from app.core.logger import get_logger
from app.services.ai.model_registry import build_model
from app.services.evaluation.metrics import BinaryMetrics, compute_metrics
from app.services.training.checkpoint_manager import CheckpointManager, CheckpointRef
from app.services.training.config import TrainingConfig, resolve_device

logger = get_logger(__name__)


@dataclass
class EpochResult:
    epoch: int
    train_loss: float
    validation_loss: float
    validation_metrics: dict
    duration_sec: float


@dataclass
class TrainingResult:
    config: dict
    device: str
    epochs_run: int
    best_epoch: int
    best_validation_loss: float
    best_metrics: dict
    history: list[dict] = field(default_factory=list)
    checkpoint: Optional[str] = None
    stopped_early: bool = False

    def save(self, path: Path) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(asdict(self), indent=2))
        return path


class Trainer:
    """Binary face-crop classifier training."""

    def __init__(
        self,
        config: TrainingConfig | None = None,
        checkpoints: CheckpointManager | None = None,
    ) -> None:
        self._config = config or TrainingConfig()
        self._checkpoints = checkpoints or CheckpointManager()

    @property
    def config(self) -> TrainingConfig:
        return self._config

    def fit(
        self,
        train_loader,
        validation_loader,
        *,
        dataset: str,
        checkpoint_name: str | None = None,
        on_epoch: Callable[[EpochResult], None] | None = None,
    ) -> TrainingResult:
        import torch
        from torch import nn

        device = torch.device(resolve_device(self._config.device))
        model = build_model(self._config.model_key,
                            pretrained=self._config.pretrained_backbone).to(device)
        criterion = nn.BCEWithLogitsLoss()
        optimizer = self._build_optimizer(model)

        best_loss = float("inf")
        best_epoch = -1
        best_metrics: dict = {}
        best_state = None
        patience_left = self._config.early_stopping_patience
        history: list[EpochResult] = []
        stopped_early = False

        logger.info("Training %s on %s for up to %d epoch(s).",
                    self._config.model_key, device, self._config.epochs)

        for epoch in range(1, self._config.epochs + 1):
            started = time.perf_counter()
            train_loss = self._train_epoch(
                model, train_loader, criterion, optimizer, device)
            validation_loss, metrics = self._validate(
                model, validation_loader, criterion, device)
            result = EpochResult(
                epoch=epoch,
                train_loss=round(train_loss, 6),
                validation_loss=round(validation_loss, 6),
                validation_metrics=metrics.as_dict(),
                duration_sec=round(time.perf_counter() - started, 2),
            )
            history.append(result)
            logger.info("epoch %d/%d train_loss=%.4f val_loss=%.4f val_acc=%.4f",
                        epoch, self._config.epochs, train_loss,
                        validation_loss, metrics.accuracy)
            if on_epoch:
                on_epoch(result)

            if validation_loss < best_loss - 1e-5:
                best_loss = validation_loss
                best_epoch = epoch
                best_metrics = metrics.as_dict()
                best_state = {k: v.detach().cpu().clone()
                              for k, v in model.state_dict().items()}
                patience_left = self._config.early_stopping_patience
            else:
                patience_left -= 1
                if patience_left <= 0:
                    stopped_early = True
                    logger.info("Early stopping at epoch %d.", epoch)
                    break

        checkpoint: Optional[CheckpointRef] = None
        if best_state is not None:
            checkpoint = self._checkpoints.save(
                best_state,
                architecture=self._config.model_key,
                name=checkpoint_name
                or f"deepshield_{self._config.model_key}_{dataset}",
                dataset=dataset,
                dataset_version=self._config.dataset_version,
                training_config=self._config.as_dict(),
                validation_metrics=best_metrics,
                deepfake_trained=True,
                notes=("Trained by DeepShield on the operator-supplied deepfake "
                       "dataset named above."),
            )

        outcome = TrainingResult(
            config=self._config.as_dict(),
            device=str(device),
            epochs_run=len(history),
            best_epoch=best_epoch,
            best_validation_loss=round(best_loss, 6) if history else 0.0,
            best_metrics=best_metrics,
            history=[asdict(item) for item in history],
            checkpoint=str(checkpoint.path) if checkpoint else None,
            stopped_early=stopped_early,
        )
        outcome.save(settings.TRAIN_LOG_DIR /
                     f"training_{self._config.model_key}_{int(time.time())}.json")
        return outcome

    # -- Internals -------------------------------------------------------------
    def _build_optimizer(self, model):
        import torch

        name = self._config.optimizer.lower()
        params = model.parameters()
        if name == "adam":
            return torch.optim.Adam(params, lr=self._config.learning_rate,
                                    weight_decay=self._config.weight_decay)
        if name == "sgd":
            return torch.optim.SGD(params, lr=self._config.learning_rate,
                                   momentum=0.9,
                                   weight_decay=self._config.weight_decay)
        return torch.optim.AdamW(params, lr=self._config.learning_rate,
                                 weight_decay=self._config.weight_decay)

    @staticmethod
    def _train_epoch(model, loader, criterion, optimizer, device) -> float:
        model.train()
        total, batches = 0.0, 0
        for inputs, targets in loader:
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad()
            logits = model(inputs)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer.step()
            total += float(loss.item())
            batches += 1
        return total / max(1, batches)

    @staticmethod
    def _validate(model, loader, criterion, device) -> tuple[float, BinaryMetrics]:
        import torch

        model.eval()
        total, batches = 0.0, 0
        probabilities: list[float] = []
        labels: list[float] = []
        with torch.inference_mode():
            for inputs, targets in loader:
                inputs, targets = inputs.to(device), targets.to(device)
                logits = model(inputs)
                total += float(criterion(logits, targets).item())
                batches += 1
                probabilities += torch.sigmoid(logits).flatten().tolist()
                labels += targets.flatten().tolist()
        return total / max(1, batches), compute_metrics(labels, probabilities)
