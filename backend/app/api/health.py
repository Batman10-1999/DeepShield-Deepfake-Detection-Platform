"""Health check endpoint."""
from fastapi import APIRouter

from app.core.config import settings
from app.services.ai.model_provenance import describe_active_model
from app.services.model_loader import ModelLoader

router = APIRouter(tags=["system"])


@router.get("/health")
def health() -> dict:
    loader = ModelLoader.get_instance()
    return {
        "status": "ok",
        "service": "DeepShield API",
        "version": "0.3.0",
        "model_loaded": loader.is_loaded(),
        "model_name": loader.model_name or settings.DEFAULT_MODEL,
        "weights_source": loader.weights_source,
        "device": str(loader.device),
        "model_load_time_ms": loader.load_time_ms,
        # Provenance is exposed here so nobody has to infer from logs whether
        # the running weights are actually deepfake-trained.
        "provenance": describe_active_model(),
    }
