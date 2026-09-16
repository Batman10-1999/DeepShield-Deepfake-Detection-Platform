"""Model provenance reporting.

Answers one question honestly: what weights is DeepShield actually
running? Used by /health, the CLI and the Day 5 report so nobody has to
infer provenance from log lines.
"""
from __future__ import annotations

from app.core.config import settings
from app.services.ai.confidence_calibrator import load_calibration_profile
from app.services.training.checkpoint_manager import CheckpointManager

NO_CHECKPOINT_MESSAGE = "Deepfake-trained checkpoint not currently available."


def describe_active_model(architecture: str | None = None) -> dict:
    arch = architecture or settings.DEFAULT_MODEL
    checkpoint = CheckpointManager().latest(arch)
    calibration = load_calibration_profile()

    if checkpoint is None:
        weights = {
            "checkpoint": None,
            "deepfake_trained": False,
            "status": NO_CHECKPOINT_MESSAGE,
            "effective_weights": "imagenet_pretrained_backbone",
        }
    else:
        metadata = checkpoint.metadata
        weights = {
            "checkpoint": str(checkpoint.path),
            "deepfake_trained": checkpoint.is_verified_deepfake_checkpoint,
            "status": ("Verified deepfake-trained checkpoint."
                       if checkpoint.is_verified_deepfake_checkpoint
                       else "Checkpoint present but unverified — treated as "
                            "not deepfake-trained."),
            "effective_weights": "deepshield_checkpoint",
            "dataset": getattr(metadata, "dataset", None),
            "validation_metrics": getattr(metadata, "validation_metrics", {}),
            "created_at": getattr(metadata, "created_at", None),
        }

    return {
        "architecture": arch,
        "input_size": settings.INPUT_SIZE,
        "normalization": {
            "mean": list(settings.NORMALIZE_MEAN),
            "std": list(settings.NORMALIZE_STD),
        },
        "class_mapping": {"0": "real", "1": "fake",
                          "output": "single logit -> sigmoid -> P(fake)"},
        "weights": weights,
        "calibration": {
            "temperature": calibration.temperature,
            "source": calibration.source,
            "fitted_on_validation": calibration.is_fitted,
            "confidence_definition":
                "posterior probability of the predicted class (no gain applied)",
        },
    }
