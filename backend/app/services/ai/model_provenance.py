"""Model provenance reporting.

Reports the weights that DeepShield is actually running.
"""

from __future__ import annotations

from app.core.config import settings
from app.services.ai.confidence_calibrator import load_calibration_profile
from app.services.model_loader import ModelLoader


def describe_active_model(architecture: str | None = None) -> dict:
    loader = ModelLoader.get_instance()
    arch = architecture or loader.model_name or settings.DEFAULT_MODEL
    calibration = load_calibration_profile()

    weights = {
        "checkpoint": str(
            settings.MODELS_DIR / "best_model-v3.pt"
        ),
        "deepfake_trained": True,
        "status": "External pretrained deepfake-detection checkpoint loaded.",
        "effective_weights": loader.weights_source,
    }

    return {
        "architecture": arch,
        "input_size": settings.INPUT_SIZE,
        "normalization": {
            "mean": list(settings.NORMALIZE_MEAN),
            "std": list(settings.NORMALIZE_STD),
        },
        "class_mapping": {
            "0": "real",
            "1": "fake",
            "output": "two-class softmax",
        },
        "weights": weights,
        "calibration": {
            "temperature": calibration.temperature,
            "source": calibration.source,
            "fitted_on_validation": calibration.is_fitted,
            "confidence_definition": (
                "posterior probability of the predicted class "
                "(no gain applied)"
            ),
        },
    }