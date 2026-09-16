"""Regression: the API tells the truth about the model it is running."""
from __future__ import annotations

import json

from app.services.ai.model_provenance import (
    NO_CHECKPOINT_MESSAGE,
    describe_active_model,
)
from app.services.training.checkpoint_manager import (
    CheckpointManager,
    CheckpointMetadata,
)


def test_no_checkpoint_reports_imagenet_backbone(tmp_path, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "MODELS_DIR", tmp_path / "models")
    report = describe_active_model()
    assert report["weights"]["deepfake_trained"] is False
    assert report["weights"]["status"] == NO_CHECKPOINT_MESSAGE
    assert report["weights"]["effective_weights"] == "imagenet_pretrained_backbone"


def test_checkpoint_without_metadata_is_never_called_deepfake_trained(
        tmp_path, monkeypatch):
    from app.core.config import settings

    models = tmp_path / "models" / "efficientnet_b0"
    models.mkdir(parents=True)
    (models / "mystery.pth").write_bytes(b"weights")
    monkeypatch.setattr(settings, "MODELS_DIR", tmp_path / "models")

    report = describe_active_model("efficientnet_b0")
    assert report["weights"]["deepfake_trained"] is False
    assert "unverified" in report["weights"]["status"].lower()


def test_verified_checkpoint_is_preferred_over_unverified(tmp_path):
    root = tmp_path / "models"
    directory = root / "efficientnet_b0"
    directory.mkdir(parents=True)
    (directory / "a_unverified.pth").write_bytes(b"a")
    (directory / "b_verified.pth").write_bytes(b"b")
    metadata = CheckpointMetadata(
        architecture="efficientnet_b0",
        checkpoint_filename="b_verified.pth",
        dataset="celebdf",
        deepfake_trained=True,
    )
    (directory / "b_verified.json").write_text(json.dumps(metadata.as_dict()))

    latest = CheckpointManager(root).latest("efficientnet_b0")
    assert latest is not None
    assert latest.path.name == "b_verified.pth"
    assert latest.is_verified_deepfake_checkpoint is True


def test_provenance_exposes_preprocessing_contract(tmp_path, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "MODELS_DIR", tmp_path / "models")
    report = describe_active_model()
    assert report["input_size"] == settings.INPUT_SIZE
    assert len(report["normalization"]["mean"]) == 3
    assert report["class_mapping"]["1"] == "fake"
    assert "temperature" in report["calibration"]
