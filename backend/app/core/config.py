"""Centralized backend configuration.

Every tunable value lives in one place so the project is easy to
maintain and explain during a project viva.
"""
import os
from pathlib import Path


def _env(key: str, default: str) -> str:
    return os.environ.get(key, default).strip()


def _flag(key: str, default: bool) -> bool:
    raw = os.environ.get(key)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    # --- Filesystem layout ----------------------------------------------------
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    RESULTS_DIR: Path = BASE_DIR / "results"
    WEIGHTS_DIR: Path = BASE_DIR / "weights"
    # Optional override for the Haar cascade used by face detection.
    FACE_CASCADE_PATH: str | None = _env("DEEPSHIELD_FACE_CASCADE", "") or None
    FRAMES_DIR: Path = BASE_DIR / "uploads" / "frames"

    # --- Upload validation ----------------------------------------------------
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_VIDEO_SIZE_MB: int = 200

    # --- Image preprocessing --------------------------------------------------
    INPUT_SIZE: int = 224
    NORMALIZE_MEAN: tuple[float, float, float] = (0.485, 0.456, 0.406)
    NORMALIZE_STD: tuple[float, float, float] = (0.229, 0.224, 0.225)
    PRESERVE_ASPECT_RATIO: bool = _flag("DEEPSHIELD_PRESERVE_ASPECT", True)
    PADDING_COLOR: tuple[int, int, int] = (0, 0, 0)
    DENOISE_ENABLED: bool = _flag("DEEPSHIELD_DENOISE", False)
    AUGMENTATION_ENABLED: bool = _flag("DEEPSHIELD_AUGMENT", False)

    # --- Face detection -------------------------------------------------------
    FACE_DETECTION_ENABLED: bool = _flag("DEEPSHIELD_FACE_DETECTION", True)
    # When True a face-less image is rejected instead of analysed full-frame.
    FACE_REQUIRED: bool = _flag("DEEPSHIELD_FACE_REQUIRED", True)
    FACE_SCALE_FACTOR: float = 1.1
    FACE_MIN_NEIGHBORS: int = 5
    FACE_MIN_SIZE_PX: int = 48
    FACE_CROP_MARGIN: float = 0.25       # context added around each box
    MAX_FACES_PER_IMAGE: int = 10
    FACE_AGGREGATION_STRATEGY: str = _env(
        "DEEPSHIELD_FACE_AGGREGATION", "weighted"
    )                                     # max | mean | weighted
    FACE_CONSISTENCY_MIN_AGREEMENT: float = 70.0

    # --- Video preprocessing --------------------------------------------------
    VIDEO_SAMPLE_FRAMES: int = 16
    MAX_VIDEO_DURATION_SEC: float = 600.0

    # --- Video detection engine ------------------------------------------------
    # Extraction strategy: "uniform" (evenly spaced), "interval" (every Nth
    # frame) or "fps" (N frames per second of footage).
    FRAME_EXTRACTION_STRATEGY: str = _env("DEEPSHIELD_FRAME_STRATEGY", "uniform")
    FRAME_INTERVAL: int = int(_env("DEEPSHIELD_FRAME_INTERVAL", "30"))
    FRAME_SAMPLE_FPS: float = float(_env("DEEPSHIELD_FRAME_SAMPLE_FPS", "1"))
    MAX_FRAMES_ANALYSED: int = int(_env("DEEPSHIELD_MAX_FRAMES", "24"))
    VIDEO_FRAME_AGGREGATION_STRATEGY: str = _env(
        "DEEPSHIELD_VIDEO_AGGREGATION", "mean"
    )                                     # max | mean | weighted
    VIDEO_FRAME_MIN_AGREEMENT: float = 70.0
    # A face-less frame is skipped instead of failing the whole video.
    VIDEO_SKIP_FACELESS_FRAMES: bool = _flag("DEEPSHIELD_VIDEO_SKIP_FACELESS", True)
    VIDEO_PERSIST_FRAMES: bool = _flag("DEEPSHIELD_VIDEO_PERSIST_FRAMES", False)

    # --- Model ---------------------------------------------------------------
    # Switch architectures without touching prediction code:
    #   DEEPSHIELD_MODEL=resnet50 uvicorn main:app
    DEFAULT_MODEL: str = _env("DEEPSHIELD_MODEL", "efficientnet_b0")
    SUPPORTED_MODELS: tuple[str, ...] = (
        "efficientnet_b0",
        "resnet50",
        "xception",
        "vit_b16",
    )
    INFERENCE_TIMEOUT_SEC: float = float(_env("DEEPSHIELD_INFERENCE_TIMEOUT", "60"))

    # --- Explainability (Grad-CAM) --------------------------------------------
    GRADCAM_ENABLED: bool = _flag("DEEPSHIELD_GRADCAM", True)
    GRADCAM_COLORMAP: str = _env("DEEPSHIELD_GRADCAM_COLORMAP", "jet")
    GRADCAM_OVERLAY_OPACITY: float = float(
        _env("DEEPSHIELD_GRADCAM_OPACITY", "0.45"))
    GRADCAM_BLUR_KERNEL: int = int(_env("DEEPSHIELD_GRADCAM_BLUR", "11"))
    GRADCAM_REGION_THRESHOLD: float = float(
        _env("DEEPSHIELD_GRADCAM_THRESHOLD", "0.55"))
    GRADCAM_MIN_REGION_AREA_PCT: float = float(
        _env("DEEPSHIELD_GRADCAM_MIN_AREA", "1.0"))
    GRADCAM_MAX_REGIONS: int = int(_env("DEEPSHIELD_GRADCAM_MAX_REGIONS", "4"))
    # Video Grad-CAM runs only on the dominant and most suspicious frames.
    VIDEO_GRADCAM_FRAMES: int = int(_env("DEEPSHIELD_VIDEO_GRADCAM_FRAMES", "2"))

    # --- Prediction decision engine (fake percentage, 0-100) ------------------
    DECISION_REAL_MAX_FAKE_PCT: float = 40.0    # <= 40  -> REAL
    DECISION_FAKE_MIN_FAKE_PCT: float = 60.0    # >= 60  -> FAKE
    DECISION_MANUAL_REVIEW_CONFIDENCE: float = 55.0  # below -> manual review
    # The user-facing verdict is strictly binary. One configurable threshold
    # separates REAL from FAKE. Until a verified deepfake-trained checkpoint
    # exists, that binary verdict is reported as scientifically unvalidated.
    DECISION_BINARY_FAKE_PCT: float = float(
        _env("DEEPSHIELD_BINARY_THRESHOLD", "50.0"))

    # --- Confidence calibration ----------------------------------------------
    # Confidence is the posterior probability of the predicted class, taken
    # directly from the model. The temperature is 1.0 (identity) until a
    # temperature is fitted on a real validation split by
    # `app.services.evaluation.calibration_fit`, which writes
    # weights/calibration.json. Nothing here may inflate a probability.
    CALIBRATION_TEMPERATURE: float = float(_env("DEEPSHIELD_TEMPERATURE", "1.0"))
    CALIBRATION_FILE: Path = BASE_DIR / "weights" / "calibration.json"
    CONFIDENCE_DECIMALS: int = 1

    # --- Risk assessment (authenticity score bands, 0-100) --------------------
    # score >= threshold -> that band. Ordered high to low.
    RISK_VERY_LOW_MIN: float = 95.0   # 95-100  Very Low  (REAL)
    RISK_LOW_MIN: float = 80.0        # 80-95   Low       (REAL)
    RISK_MEDIUM_MIN: float = 60.0     # 60-80   Medium    (SUSPICIOUS)
    RISK_HIGH_MIN: float = 40.0       # 40-60   High      (SUSPICIOUS)
    # < 40 -> Critical (FAKE)

    # --- Dataset engineering (Day 5) ------------------------------------------
    DATASETS_DIR: Path = Path(
        _env("DEEPSHIELD_DATASETS_DIR", str(BASE_DIR / "datasets"))
    )
    DATASET_SPLIT_RATIOS: tuple[float, float, float] = (0.70, 0.15, 0.15)
    DATASET_SPLIT_SEED: int = int(_env("DEEPSHIELD_SPLIT_SEED", "1337"))
    DATASET_CLASSES: tuple[str, str] = ("real", "fake")
    # Frames sampled per source video when building a training set. Kept low
    # so one long clip cannot dominate the class distribution.
    DATASET_FRAMES_PER_VIDEO: int = int(_env("DEEPSHIELD_DATASET_FRAMES", "8"))
    DATASET_MIN_FACE_PX: int = int(_env("DEEPSHIELD_DATASET_MIN_FACE", "64"))
    DATASET_MAX_FACES_PER_SAMPLE: int = int(
        _env("DEEPSHIELD_DATASET_MAX_FACES", "1"))

    # --- Training / checkpoints ------------------------------------------------
    MODELS_DIR: Path = Path(_env("DEEPSHIELD_MODELS_DIR", str(BASE_DIR / "models")))
    TRAIN_BATCH_SIZE: int = int(_env("DEEPSHIELD_BATCH_SIZE", "32"))
    TRAIN_EPOCHS: int = int(_env("DEEPSHIELD_EPOCHS", "10"))
    TRAIN_LEARNING_RATE: float = float(_env("DEEPSHIELD_LR", "1e-4"))
    TRAIN_WEIGHT_DECAY: float = float(_env("DEEPSHIELD_WEIGHT_DECAY", "1e-4"))
    TRAIN_OPTIMIZER: str = _env("DEEPSHIELD_OPTIMIZER", "adamw")
    TRAIN_EARLY_STOPPING_PATIENCE: int = int(_env("DEEPSHIELD_PATIENCE", "3"))
    TRAIN_NUM_WORKERS: int = int(_env("DEEPSHIELD_WORKERS", "0"))
    TRAIN_DEVICE: str = _env("DEEPSHIELD_DEVICE", "auto")  # auto | cpu | cuda
    TRAIN_LOG_DIR: Path = BASE_DIR / "results" / "training"
    EVALUATION_DIR: Path = BASE_DIR / "results" / "evaluation"

    # --- Media processing budgets (200 MB architecture) ------------------------
    # Uploads are streamed to disk in chunks and rejected as soon as the byte
    # budget is exceeded, so a 200 MB video never sits fully in memory.
    UPLOAD_CHUNK_BYTES: int = 1024 * 1024
    MAX_UPLOAD_SIZE_MB: int = int(_env("DEEPSHIELD_MAX_UPLOAD_MB", "200"))
    MAX_VIDEO_DECODE_PIXELS: int = int(
        _env("DEEPSHIELD_MAX_DECODE_PIXELS", str(1920 * 1080)))


settings = Settings()


# Ensure required runtime directories exist on startup. Dataset directories
# are created explicitly by the dataset tooling, never implicitly.
for directory in (
    settings.UPLOAD_DIR,
    settings.RESULTS_DIR,
    settings.WEIGHTS_DIR,
    settings.FRAMES_DIR,
    settings.MODELS_DIR,
):
    directory.mkdir(parents=True, exist_ok=True)

