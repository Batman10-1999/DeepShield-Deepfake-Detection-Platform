"""Model checkpoint management.

Layout:

    models/
        efficientnet_b0/
            deepshield_efficientnet_b0_v1.pth
            deepshield_efficientnet_b0_v1.json   <- metadata sidecar

Every checkpoint must declare what it is. A checkpoint without a sidecar
is treated as UNVERIFIED and is never described as deepfake-trained,
which is what stops ImageNet weights from being mislabelled.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

METADATA_SUFFIX = ".json"
CHECKPOINT_SUFFIX = ".pth"


@dataclass
class CheckpointMetadata:
    architecture: str
    checkpoint_filename: str
    dataset: str = "unspecified"
    dataset_version: str = "unspecified"
    deepfake_trained: bool = False
    training_config: dict = field(default_factory=dict)
    validation_metrics: dict = field(default_factory=dict)
    created_at: str = ""
    sha256: str = ""
    notes: str = ""

    def as_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class CheckpointRef:
    path: Path
    metadata: Optional[CheckpointMetadata]

    @property
    def is_verified_deepfake_checkpoint(self) -> bool:
        return bool(self.metadata and self.metadata.deepfake_trained)


class CheckpointManager:
    """Discovery, saving and provenance of trained weights."""

    def __init__(self, root: Path | None = None) -> None:
        self.root = Path(root or settings.MODELS_DIR)

    def model_dir(self, architecture: str) -> Path:
        return self.root / architecture

    # -- Discovery ---------------------------------------------------------------
    def list_checkpoints(self, architecture: str) -> list[CheckpointRef]:
        directory = self.model_dir(architecture)
        if not directory.exists():
            return []
        refs = []
        for path in sorted(directory.glob(f"*{CHECKPOINT_SUFFIX}")):
            refs.append(CheckpointRef(path=path, metadata=self.read_metadata(path)))
        return refs

    def latest(self, architecture: str) -> Optional[CheckpointRef]:
        """Newest verified deepfake checkpoint, else newest checkpoint."""
        refs = self.list_checkpoints(architecture)
        if not refs:
            return None
        verified = [r for r in refs if r.is_verified_deepfake_checkpoint]
        pool = verified or refs
        return max(pool, key=lambda r: r.path.stat().st_mtime)

    def read_metadata(self, checkpoint: Path) -> Optional[CheckpointMetadata]:
        sidecar = checkpoint.with_suffix(METADATA_SUFFIX)
        if not sidecar.exists():
            return None
        try:
            payload = json.loads(sidecar.read_text())
            known = {f for f in CheckpointMetadata.__dataclass_fields__}
            return CheckpointMetadata(**{k: v for k, v in payload.items()
                                         if k in known})
        except Exception as exc:
            logger.warning("Unreadable checkpoint metadata %s: %s", sidecar, exc)
            return None

    # -- Saving -------------------------------------------------------------------
    def save(
        self,
        state_dict,
        *,
        architecture: str,
        name: str,
        dataset: str,
        dataset_version: str,
        training_config: dict,
        validation_metrics: dict,
        deepfake_trained: bool,
        notes: str = "",
    ) -> CheckpointRef:
        import torch

        directory = self.model_dir(architecture)
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / f"{name}{CHECKPOINT_SUFFIX}"
        torch.save(state_dict, path)

        metadata = CheckpointMetadata(
            architecture=architecture,
            checkpoint_filename=path.name,
            dataset=dataset,
            dataset_version=dataset_version,
            deepfake_trained=deepfake_trained,
            training_config=training_config,
            validation_metrics=validation_metrics,
            created_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            sha256=self._sha256(path),
        )
        metadata.notes = notes
        path.with_suffix(METADATA_SUFFIX).write_text(
            json.dumps(metadata.as_dict(), indent=2))
        logger.info("Saved checkpoint %s (deepfake_trained=%s)",
                    path, deepfake_trained)
        return CheckpointRef(path=path, metadata=metadata)

    @staticmethod
    def _sha256(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest()
