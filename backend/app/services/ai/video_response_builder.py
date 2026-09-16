"""Video response assembly.

Keeps HTTP payload construction out of the orchestrator and mirrors the
image `response_builder` so both media types share one contract shape.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Sequence

from app.models.schemas import (
    DecisionPayload,
    ExplanationPayload,
    FrameAnalysisPayload,
    VideoAggregationPayload,
    VideoFileMetadata,
    VideoPredictionResponse,
    VideoProcessingMetrics,
)
from app.services.ai.decision_engine import Decision
from app.services.ai.frame_aggregation import VideoAggregate
from app.services.ai.risk_assessor import RiskBand


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_aggregation_payload(
    aggregate: VideoAggregate,
    *,
    frames_extracted: int,
    frames_skipped: int,
    authenticity_score: float,
) -> VideoAggregationPayload:
    return VideoAggregationPayload(
        strategy=aggregate.strategy,
        frames_extracted=frames_extracted,
        frames_analysed=aggregate.frames_analysed,
        frames_skipped=frames_skipped,
        real_frames=aggregate.real_frames,
        fake_frames=aggregate.fake_frames,
        suspicious_frames=aggregate.suspicious_frames,
        manual_review_frames=aggregate.manual_review_frames,
        agreement=aggregate.agreement,
        consistent=aggregate.consistent,
        dominant_frame_number=aggregate.dominant_frame_number,
        overall_fake_percentage=round(aggregate.fake_probability * 100.0, 2),
        overall_authenticity_score=round(authenticity_score, 2),
        overall_confidence=round(aggregate.confidence, 2),
    )


def build_video_prediction_response(
    *,
    filename: str,
    model_name: str,
    weights_source: str,
    device: str,
    authenticity_score: float,
    fake_percentage: float,
    confidence: float,
    risk: RiskBand,
    decision: Decision,
    calibration_method: str,
    processing_time: float,
    video_metadata: VideoFileMetadata | None,
    aggregation: VideoAggregationPayload,
    timeline: Sequence[FrameAnalysisPayload],
    metrics: VideoProcessingMetrics,
    explanation: ExplanationPayload | None = None,
    sha256: str | None = None,
    certificate_id: str | None = None,
) -> VideoPredictionResponse:
    return VideoPredictionResponse(
        prediction=decision.verdict,
        confidence=round(float(confidence), 2),
        authenticity_score=round(float(authenticity_score), 2),
        fake_percentage=round(float(fake_percentage), 2),
        risk_level=risk.risk_level,
        risk_description=risk.description,
        processing_time=round(float(processing_time), 3),
        inference_time_ms=metrics.inference_ms,
        preprocess_time_ms=metrics.preprocess_ms,
        model_load_time_ms=metrics.model_load_ms,
        model_name=model_name,
        weights_source=weights_source,
        device=device,
        calibration_method=calibration_method,
        decision=DecisionPayload(
            verdict=decision.verdict,
            analytical_band=decision.analytical_band,
            binary_threshold_pct=decision.binary_threshold_pct,
            binary_decision_validated=decision.binary_decision_validated,
            validation_note=decision.validation_note,
            requires_manual_review=decision.requires_manual_review,
            rationale=decision.rationale,
            thresholds=dict(decision.thresholds),
        ),
        explanation=explanation,
        video_metadata=video_metadata,
        aggregation=aggregation,
        timeline=list(timeline),
        metrics=metrics,
        sha256=sha256 or (video_metadata.sha256 if video_metadata else None),
        certificate_id=certificate_id,
        filename=filename,
        status="success",
        timestamp=_now_iso(),
    )
