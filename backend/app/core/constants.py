"""Static constants shared across the DeepShield backend.

Kept separate from `config.py` so that values that never change at runtime
(supported formats, event names) live independently from tunables.
"""
from __future__ import annotations

# --- Supported media formats -------------------------------------------------

IMAGE_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png"}
IMAGE_MIME_TYPES: set[str] = {"image/jpeg", "image/png"}

VIDEO_EXTENSIONS: set[str] = {".mp4", ".avi", ".mov", ".mkv"}
VIDEO_MIME_TYPES: set[str] = {
    "video/mp4",
    "video/quicktime",   # .mov
    "video/x-msvideo",   # .avi
    "video/avi",
    "video/x-matroska",  # .mkv
    "video/mkv",
}


# --- Human-readable log events ------------------------------------------------
# Using named constants keeps log strings uniform across the codebase and
# makes them easy to grep during a project demo.
class LogEvent:
    APP_STARTED = "Application Started"
    APP_STOPPED = "Application Shutting Down"

    UPLOAD_RECEIVED = "Upload Received"
    UPLOAD_SAVED = "Upload Saved"

    VALIDATION_STARTED = "Validation Started"
    VALIDATION_PASSED = "Validation Passed"
    VALIDATION_FAILED = "Validation Failed"

    PREPROCESS_STARTED = "Preprocessing Started"
    PREPROCESS_COMPLETED = "Preprocessing Completed"
    PREPROCESS_FAILED = "Preprocessing Failed"

    FACE_DETECTION_STARTED = "Face Detection Started"
    FACE_DETECTION_COMPLETED = "Face Detection Completed"
    FACE_DETECTION_FAILED = "Face Detection Failed"
    NO_FACE_DETECTED = "No Face Detected"
    MULTI_FACE_DETECTED = "Multiple Faces Detected"
    FACE_ANALYSED = "Face Analysed"
    PREDICTIONS_AGGREGATED = "Face Predictions Aggregated"

    MODEL_LOADING = "Model Loading"
    MODEL_LOADED = "Model Loaded"
    MODEL_LOAD_FAILED = "Model Load Failed"

    INFERENCE_STARTED = "Inference Started"
    INFERENCE_COMPLETED = "Inference Completed"
    INFERENCE_FAILED = "Inference Failed"

    MODEL_SELECTED = "Model Selected"

    CONFIDENCE_CALCULATED = "Confidence Calculated"
    AUTHENTICITY_SCORED = "Authenticity Score Generated"
    RISK_ASSESSED = "Risk Level Generated"
    METADATA_EXTRACTED = "Metadata Extracted"
    HASH_GENERATED = "SHA-256 Generated"
    DECISION_MADE = "Prediction Decision Made"
    GRADCAM_STARTED = "Grad-CAM Started"
    GRADCAM_COMPLETED = "Grad-CAM Completed"
    GRADCAM_FAILED = "Grad-CAM Failed"
    EXPLANATION_BUILT = "Explanation Generated"

    CERTIFICATE_GENERATED = "Certificate Generated"
    RECORD_BUILT = "Analysis Record Built"
    PROCESSING_FINISHED = "Processing Finished"
    RESPONSE_BUILT = "Response Generated"

    VIDEO_UPLOADED = "Video Uploaded"
    VIDEO_METADATA_EXTRACTED = "Video Metadata Extracted"
    FRAME_EXTRACTION_STARTED = "Frame Extraction Started"
    FRAME_EXTRACTION_COMPLETED = "Frame Extraction Completed"
    FRAME_ANALYSIS_STARTED = "Frame Analysis Started"
    FRAME_ANALYSED = "Frame Analysed"
    FRAME_ANALYSIS_COMPLETED = "Frame Analysis Completed"
    FRAME_AGGREGATION_COMPLETED = "Frame Aggregation Completed"
    VIDEO_ANALYSIS_STARTED = "Video Analysis Started"
    VIDEO_ANALYSIS_COMPLETED = "Video Analysis Completed"

    ANALYSIS_STARTED = "Analysis Started"
    ANALYSIS_COMPLETED = "Analysis Completed"

    PREDICTION_STARTED = "Prediction Started"
    PREDICTION_COMPLETED = "Prediction Completed"
    PREDICTION_FAILED = "Prediction Failed"

    ERROR = "Error"
