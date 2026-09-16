"""Pydantic schemas for API request / response payloads."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


# --- Validation --------------------------------------------------------------

class ValidationResult(BaseModel):
    is_valid: bool
    filename: str
    media_type: Literal["image", "video", "unknown"]
    size_bytes: int
    extension: str
    mime_type: Optional[str] = None
    error: Optional[str] = None


# --- Preprocessing -----------------------------------------------------------

class ImagePreprocessResult(BaseModel):
    width: int
    height: int
    resized_to: int
    channels: int = 3
    normalized: bool = True
    tensor_shape: list[int]
    mean: list[float]
    std: list[float]
    aspect_ratio_preserved: bool = True
    stages: list[str] = Field(default_factory=list)


class VideoMetadata(BaseModel):
    width: int
    height: int
    fps: float
    frame_count: int
    duration_sec: float
    codec: Optional[str] = None


class VideoPreprocessResult(BaseModel):
    metadata: VideoMetadata
    sampled_frame_indices: list[int]
    sampled_frames_saved: int
    frames_dir: str


# --- Upload responses --------------------------------------------------------

class ImageUploadResponse(BaseModel):
    status: str = "success"
    filename: str
    saved_path: str
    validation: ValidationResult
    preprocessing: ImagePreprocessResult
    message: str = "Image is ready for AI analysis."


class VideoUploadResponse(BaseModel):
    status: str = "success"
    filename: str
    saved_path: str
    validation: ValidationResult
    preprocessing: VideoPreprocessResult
    message: str = "Video is ready for frame-level AI analysis."


# --- Metadata ----------------------------------------------------------------

class MediaMetadata(BaseModel):
    """Descriptive facts about an uploaded file."""
    filename: str
    extension: str
    size_bytes: int
    size_kb: float
    width: int = 0
    height: int = 0
    resolution: Optional[str] = None
    channels: Optional[int] = None
    color_mode: Optional[str] = None
    format: Optional[str] = None
    created_at: Optional[str] = None
    modified_at: Optional[str] = None
    sha256: Optional[str] = None


# --- Prediction (AI Engine output) ------------------------------------------

# User-facing predictions are strictly binary. SUSPICIOUS and
# NEEDS_MANUAL_REVIEW remain internal analysis bands only.
Prediction = Literal["REAL", "FAKE"]
RiskLevel = Literal["Very Low", "Low", "Medium", "High", "Critical"]


class FaceRegionPayload(BaseModel):
    """Bounding box of a detected face in original-image coordinates."""
    index: int
    x: int
    y: int
    width: int
    height: int
    detector_score: float = 1.0


class FacePrediction(BaseModel):
    """Independent verdict for a single detected face."""
    index: int
    region: FaceRegionPayload
    prediction: Prediction
    confidence: float = Field(..., ge=0, le=100)
    fake_percentage: float = Field(..., ge=0, le=100)
    authenticity_score: float = Field(..., ge=0, le=100)
    inference_time_ms: float = 0.0


class FaceAnalysisPayload(BaseModel):
    """Everything the face pipeline produced for one image."""
    detected: bool = False
    face_count: int = 0
    detector: Optional[str] = None
    detection_time_ms: float = 0.0
    aggregation_strategy: Optional[str] = None
    agreement: float = 100.0
    consistent: bool = True
    dominant_face_index: Optional[int] = None
    faces: list[FacePrediction] = Field(default_factory=list)


class ProcessingMetrics(BaseModel):
    """Per-stage timings, all in milliseconds."""
    face_detection_ms: float = 0.0
    preprocess_ms: float = 0.0
    inference_ms: float = 0.0
    postprocess_ms: float = 0.0
    model_load_ms: float = 0.0
    total_ms: float = 0.0


class HeatmapRegion(BaseModel):
    """A manipulated region extracted from the Grad-CAM activation map."""
    x: int
    y: int
    width: int
    height: int
    intensity: float = Field(0.0, ge=0, le=1)
    label: Optional[str] = None
    confidence: float = Field(0.0, ge=0, le=100)
    area_percentage: float = Field(0.0, ge=0, le=100)


class ExplanationPayload(BaseModel):
    """Explainability metadata produced by the Grad-CAM engine.

    `heatmap_base64` and `overlay_base64` are raw base64 PNG payloads
    (no data-URI prefix); both stay None when the active backbone has no
    convolutional target layer and the heuristic explainer is used."""
    method: str = "heuristic"
    target_layer: Optional[str] = None
    heatmap_base64: Optional[str] = None
    overlay_base64: Optional[str] = None
    reasons: list[str] = Field(default_factory=list)
    available: bool = False
    heatmap_shape: Optional[list[int]] = None
    regions: list[HeatmapRegion] = Field(default_factory=list)
    overlay_opacity: float = Field(0.45, ge=0, le=1)
    confidence_overlay: Optional[float] = None
    summary: Optional[str] = None
    most_suspicious_region: Optional[str] = None
    manipulation_percentage: float = Field(0.0, ge=0, le=100)
    confidence_explanation: Optional[str] = None
    model_explanation: Optional[str] = None
    generation_time_ms: float = 0.0


class DecisionPayload(BaseModel):
    """Why the engine reported a given binary verdict."""
    verdict: Prediction
    analytical_band: Optional[str] = None
    binary_threshold_pct: float = 50.0
    binary_decision_validated: bool = False
    validation_note: Optional[str] = None
    requires_manual_review: bool = False
    rationale: str
    thresholds: dict[str, float] = Field(default_factory=dict)


class PredictionResponse(BaseModel):
    """Canonical DeepShield prediction payload.

    Reused by every detection module (image, video, audio, fusion) so
    the frontend contract stays stable across the project.
    """
    prediction: Prediction
    confidence: float = Field(..., ge=0, le=100)
    authenticity_score: float = Field(..., ge=0, le=100)
    fake_percentage: float = Field(0.0, ge=0, le=100)
    risk_level: RiskLevel
    risk_description: str
    processing_time: float
    inference_time_ms: float
    preprocess_time_ms: float = 0.0
    model_load_time_ms: float = 0.0
    model_name: str
    weights_source: str = "pretrained"
    device: str = "cpu"
    calibration_method: str = "temperature_scaling(T=1)"
    explanation: Optional[ExplanationPayload] = None
    decision: Optional[DecisionPayload] = None
    metadata: Optional[MediaMetadata] = None
    face_analysis: Optional[FaceAnalysisPayload] = None
    metrics: Optional[ProcessingMetrics] = None
    sha256: Optional[str] = None
    certificate_id: Optional[str] = None
    filename: str
    status: str = "success"
    timestamp: str


class AnalysisRecord(BaseModel):
    """Reusable, storage-ready analysis object.

    Mirrors the row that the persistence milestone will write to the
    database; today it is derived from a PredictionResponse.
    """
    certificate_id: str
    filename: str
    prediction: Prediction
    confidence: float
    authenticity_score: float
    fake_percentage: float
    risk_level: RiskLevel
    risk_description: str
    requires_manual_review: bool = False
    sha256: Optional[str] = None
    metadata: Optional[MediaMetadata] = None
    model_name: str
    weights_source: str = "pretrained"
    device: str = "cpu"
    processing_time: float
    inference_time_ms: float
    preprocess_time_ms: float = 0.0
    timestamp: str


class ErrorResponse(BaseModel):
    """Structured error payload returned by every AI endpoint."""
    status: str = "error"
    error_code: str
    message: str
    filename: Optional[str] = None
    timestamp: str



# --- Video detection engine ---------------------------------------------------

class VideoFileMetadata(BaseModel):
    """Everything descriptive about an uploaded video file."""
    filename: str
    extension: str
    duration_sec: float = 0.0
    fps: float = 0.0
    width: int = 0
    height: int = 0
    resolution: Optional[str] = None
    codec: Optional[str] = None
    frame_count: int = 0
    size_bytes: int = 0
    size_kb: float = 0.0
    created_at: Optional[str] = None
    modified_at: Optional[str] = None
    sha256: Optional[str] = None


class FrameAnalysisPayload(BaseModel):
    """One analysed frame — also the timeline entry the UI will render."""
    frame_number: int
    timestamp_sec: float
    prediction: Prediction
    confidence: float = Field(..., ge=0, le=100)
    authenticity_score: float = Field(..., ge=0, le=100)
    fake_percentage: float = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    faces_detected: int = 0
    inference_time_ms: float = 0.0
    explanation: Optional[ExplanationPayload] = None


class VideoAggregationPayload(BaseModel):
    """Consolidated opinion across every analysed frame."""
    strategy: str
    frames_extracted: int = 0
    frames_analysed: int = 0
    frames_skipped: int = 0
    real_frames: int = 0
    fake_frames: int = 0
    suspicious_frames: int = 0
    manual_review_frames: int = 0
    agreement: float = 100.0
    consistent: bool = True
    dominant_frame_number: Optional[int] = None
    overall_fake_percentage: float = 0.0
    overall_authenticity_score: float = 0.0
    overall_confidence: float = 0.0


class VideoProcessingMetrics(BaseModel):
    """Per-stage timings for a video analysis, all in milliseconds."""
    video_load_ms: float = 0.0
    metadata_ms: float = 0.0
    frame_extraction_ms: float = 0.0
    face_detection_ms: float = 0.0
    preprocess_ms: float = 0.0
    inference_ms: float = 0.0
    aggregation_ms: float = 0.0
    model_load_ms: float = 0.0
    total_ms: float = 0.0


class VideoPredictionResponse(BaseModel):
    """Canonical DeepShield video payload.

    Deliberately mirrors `PredictionResponse` field names so the existing
    frontend contract keeps working, with video-specific sections added.
    """
    media_type: Literal["video"] = "video"
    prediction: Prediction
    confidence: float = Field(..., ge=0, le=100)
    authenticity_score: float = Field(..., ge=0, le=100)
    fake_percentage: float = Field(0.0, ge=0, le=100)
    risk_level: RiskLevel
    risk_description: str
    processing_time: float
    inference_time_ms: float = 0.0
    preprocess_time_ms: float = 0.0
    model_load_time_ms: float = 0.0
    model_name: str
    weights_source: str = "pretrained"
    device: str = "cpu"
    calibration_method: str = "temperature_scaling(T=1)"
    decision: Optional[DecisionPayload] = None
    explanation: Optional[ExplanationPayload] = None
    video_metadata: Optional[VideoFileMetadata] = None
    metadata: Optional[MediaMetadata] = None
    aggregation: Optional[VideoAggregationPayload] = None
    timeline: list[FrameAnalysisPayload] = Field(default_factory=list)
    metrics: Optional[VideoProcessingMetrics] = None
    sha256: Optional[str] = None
    certificate_id: Optional[str] = None
    filename: str
    status: str = "success"
    timestamp: str
