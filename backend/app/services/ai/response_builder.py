"""Response Builder.

Central place that formats every AI prediction (or failure) into a
consistent, API-ready payload. Every future detection module (video,
audio, fusion) must reuse this builder so the frontend contract stays
stable.
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.core.config import settings
from app.models.schemas import (
    DecisionPayload,
    ErrorResponse,
    ExplanationPayload,
    FaceAnalysisPayload,
    HeatmapRegion,
    MediaMetadata,
    PredictionResponse,
    ProcessingMetrics,
)
from app.services.ai.decision_engine import Decision
from app.services.ai.explainability import ExplanationResult
from app.services.ai.risk_assessor import RiskBand


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_payload(explanation: "ExplanationResult | None") -> ExplanationPayload | None:
    """Map the internal explainability result onto the API schema."""
    if explanation is None:
        return None
    return ExplanationPayload(
        method=explanation.method,
        target_layer=explanation.target_layer,
        heatmap_base64=explanation.heatmap_base64,
        overlay_base64=explanation.overlay_base64,
        reasons=list(explanation.reasons),
        available=explanation.available,
        heatmap_shape=explanation.heatmap_shape,
        regions=[
            HeatmapRegion(
                x=r.x, y=r.y, width=r.width, height=r.height,
                intensity=round(float(r.intensity), 3), label=r.label,
                confidence=round(float(r.confidence), 2),
                area_percentage=round(float(r.area_percentage), 2),
            )
            for r in explanation.regions
        ],
        overlay_opacity=explanation.overlay_opacity,
        confidence_overlay=explanation.confidence_overlay,
        summary=explanation.summary,
        most_suspicious_region=explanation.most_suspicious_region,
        manipulation_percentage=explanation.manipulation_percentage,
        confidence_explanation=explanation.confidence_explanation,
        model_explanation=explanation.model_explanation,
        generation_time_ms=explanation.generation_time_ms,
    )


build_explanation_payload = _to_payload


def _binary_from_percentage(fake_percentage: float) -> str:
    """Fallback binary verdict when no Decision object is supplied."""
    return ("FAKE" if float(fake_percentage) >= settings.DECISION_BINARY_FAKE_PCT
            else "REAL")


def _to_decision_payload(decision: "Decision | None") -> DecisionPayload | None:
    if decision is None:
        return None
    return DecisionPayload(
        verdict=decision.verdict,
        analytical_band=decision.analytical_band,
        binary_threshold_pct=decision.binary_threshold_pct,
        binary_decision_validated=decision.binary_decision_validated,
        validation_note=decision.validation_note,
        requires_manual_review=decision.requires_manual_review,
        rationale=decision.rationale,
        thresholds=dict(decision.thresholds),
    )


def build_prediction_response(
    *,
    filename: str,
    model_name: str,
    authenticity_score: float,
    fake_percentage: float,
    confidence: float,
    risk: RiskBand,
    processing_time: float,
    inference_time_ms: float,
    preprocess_time_ms: float = 0.0,
    model_load_time_ms: float = 0.0,
    weights_source: str = "pretrained",
    device: str = "cpu",
    explanation: ExplanationResult | None = None,
    calibration_method: str = "temperature_scaling(T=1)",
    decision: Decision | None = None,
    metadata: MediaMetadata | None = None,
    face_analysis: FaceAnalysisPayload | None = None,
    metrics: ProcessingMetrics | None = None,
    sha256: str | None = None,
    certificate_id: str | None = None,
) -> PredictionResponse:
    """Assemble the canonical DeepShield prediction payload."""
    return PredictionResponse(
        prediction=(decision.verdict if decision
                    else _binary_from_percentage(fake_percentage)),
        confidence=round(float(confidence), 2),
        authenticity_score=round(float(authenticity_score), 2),
        fake_percentage=round(float(fake_percentage), 2),
        risk_level=risk.risk_level,
        risk_description=risk.description,
        processing_time=round(float(processing_time), 3),
        inference_time_ms=round(float(inference_time_ms), 2),
        preprocess_time_ms=round(float(preprocess_time_ms), 2),
        model_load_time_ms=round(float(model_load_time_ms), 2),
        model_name=model_name,
        weights_source=weights_source,
        device=device,
        calibration_method=calibration_method,
        explanation=_to_payload(explanation),
        decision=_to_decision_payload(decision),
        metadata=metadata,
        face_analysis=face_analysis,
        metrics=metrics,
        sha256=sha256 or (metadata.sha256 if metadata else None),
        certificate_id=certificate_id,
        filename=filename,
        status="success",
        timestamp=_now_iso(),
    )


def build_error_response(
    *,
    error_code: str,
    message: str,
    filename: str | None = None,
) -> ErrorResponse:
    """Assemble the canonical DeepShield error payload."""
    return ErrorResponse(
        error_code=error_code,
        message=message,
        filename=filename,
        timestamp=_now_iso(),
    )
