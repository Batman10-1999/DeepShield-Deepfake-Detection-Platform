"""DeepShield FastAPI entrypoint.

Run locally with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
import gc
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.predict_image import router as predict_image_router
from app.api.predict_video import router as predict_video_router
from app.api.upload import router as upload_router
from app.core.config import settings
from app.core.constants import LogEvent
from app.core.logger import get_logger
from app.services.model_loader import ModelLoader

# Limit PyTorch CPU threads to prevent thread contention on shared micro-cores
torch.set_num_threads(2)

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info(LogEvent.APP_STARTED)
    # The CNN is loaded eagerly so future prediction requests are fast.
    try:
        ModelLoader.get_instance().load(settings.DEFAULT_MODEL)
        logger.info("Model Loaded: %s", settings.DEFAULT_MODEL)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Model not loaded (%s). Upload + preprocessing still work.", exc)
    yield
    gc.collect()
    logger.info(LogEvent.APP_STOPPED)


app = FastAPI(
    title="DeepShield API",
    description=(
        "Multi-modal AI system for deepfake detection.\n\n"
        "Phase 2 – Input & Preprocessing Layer:\n"
        "  * Upload validation (image + video)\n"
        "  * Image preprocessing (resize, normalize, tensor prep)\n"
        "  * Video preprocessing (metadata + frame sampling)\n"
        "Phase 3 – Video Detection Engine:\n"
        "  * POST /predict/video (frame extraction + frame-level AI)\n"
    ),
    version="0.4.0",
    lifespan=lifespan,
)

# CORS Middleware allowing localhost and Vercel frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "https://deepshield-deepfake-detection-platform.onrender.com",
        "*"
    ],
    allow_credentials=False,  # Set to False when allow_origins includes wildcard "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(upload_router)
app.include_router(predict_image_router)
app.include_router(predict_video_router)