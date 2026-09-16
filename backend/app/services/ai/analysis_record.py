"""Structured analysis record.

Builds the storage-ready object that the persistence milestone will
write to the database, plus the certificate identifier that ties a
prediction to its verification certificate.
"""
from __future__ import annotations

import secrets
from datetime import datetime, timezone

from app.models.schemas import AnalysisRecord, PredictionResponse

_ID_PREFIX = "DS"
_SUFFIX_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"


def generate_certificate_id(moment: datetime | None = None) -> str:
    """Return an identifier shaped DS-YYYYMMDD-HHMMSS-XXXX."""
    now = moment or datetime.now(timezone.utc)
    suffix = "".join(secrets.choice(_SUFFIX_ALPHABET) for _ in range(4))
    return f"{_ID_PREFIX}-{now:%Y%m%d}-{now:%H%M%S}-{suffix}"


def build_analysis_record(response: PredictionResponse) -> AnalysisRecord:
    """Project a prediction response onto the reusable analysis object."""
    decision = response.decision
    return AnalysisRecord(
        certificate_id=response.certificate_id or generate_certificate_id(),
        filename=response.filename,
        prediction=response.prediction,
        confidence=response.confidence,
        authenticity_score=response.authenticity_score,
        fake_percentage=response.fake_percentage,
        risk_level=response.risk_level,
        risk_description=response.risk_description,
        requires_manual_review=bool(decision and decision.requires_manual_review),
        sha256=response.sha256,
        metadata=response.metadata,
        model_name=response.model_name,
        weights_source=response.weights_source,
        device=response.device,
        processing_time=response.processing_time,
        inference_time_ms=response.inference_time_ms,
        preprocess_time_ms=response.preprocess_time_ms,
        timestamp=response.timestamp,
    )
