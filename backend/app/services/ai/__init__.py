"""DeepShield AI Engine.

This package hosts the modular AI inference architecture that every
future detection module (image, video, audio, multi-modal fusion) will
plug into. Each concern lives in its own file:

    model_registry.py     -> Architecture specs + builders (pure, no runtime deps)
    inference_engine.py   -> Tensor -> raw probability
    risk_assessor.py      -> Authenticity score -> risk band
    prediction_service.py -> End-to-end orchestration for a single input
    response_builder.py   -> Structured API response payload

IMPORTANT — import policy
-------------------------
This ``__init__`` performs **no eager submodule imports**. ``ModelLoader``
(``app.services.model_loader``) imports ``app.services.ai.model_registry``;
if this package eagerly imported ``inference_engine`` (which imports
``ModelLoader``), Python would execute a cycle:

    model_loader -> app.services.ai/__init__ -> inference_engine -> model_loader

and fail with "cannot import name 'ModelLoader' from partially initialized
module". The convenience re-exports below are therefore resolved lazily
through PEP 562 ``__getattr__``, so importing a single submodule never drags
in its siblings. Public API and call sites are unchanged.
"""
from __future__ import annotations

from importlib import import_module
from typing import TYPE_CHECKING, Any

# name -> submodule that defines it
_EXPORTS: dict[str, str] = {
    "build_analysis_record": "analysis_record",
    "generate_certificate_id": "analysis_record",
    "AggregatedPrediction": "aggregation",
    "FaceAnalysis": "aggregation",
    "PredictionAggregator": "aggregation",
    "AuthenticityScore": "authenticity_scorer",
    "AuthenticityScorer": "authenticity_scorer",
    "CalibratedProbability": "confidence_calibrator",
    "ConfidenceCalibrator": "confidence_calibrator",
    "Decision": "decision_engine",
    "DecisionEngine": "decision_engine",
    "FrameAggregator": "frame_aggregation",
    "FrameVerdict": "frame_aggregation",
    "VideoAggregate": "frame_aggregation",
    "CamResult": "gradcam",
    "GradCamEngine": "gradcam",
    "GradCamExplainer": "explainability",
    "HeuristicExplainer": "explainability",
    "HeatmapRender": "heatmap_renderer",
    "render": "heatmap_renderer",
    "DetectedRegion": "region_extractor",
    "extract_regions": "region_extractor",
    "ExplanationSummary": "explanation_summary",
    "build_summary": "explanation_summary",
    "ExplainabilityProvider": "explainability",
    "ExplanationResult": "explainability",
    "ManipulatedRegion": "explainability",
    "get_explainer": "explainability",
    "InferenceEngine": "inference_engine",
    "InferenceResult": "inference_engine",
    "FaceInput": "prediction_service",
    "PredictionService": "prediction_service",
    "build_prediction_response": "response_builder",
    "RiskAssessor": "risk_assessor",
    "RiskBand": "risk_assessor",
}


def __getattr__(name: str) -> Any:
    """Resolve public AI-engine symbols on first access (PEP 562)."""
    module_name = _EXPORTS.get(name)
    if module_name is None:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    value = getattr(import_module(f"{__name__}.{module_name}"), name)
    globals()[name] = value  # cache: subsequent lookups skip __getattr__
    return value


def __dir__() -> list[str]:
    return sorted(set(globals()) | set(_EXPORTS))


if TYPE_CHECKING:  # static analysers still see the real symbols
    from app.services.ai.analysis_record import (
        build_analysis_record,
        generate_certificate_id,
    )
    from app.services.ai.aggregation import (
        AggregatedPrediction,
        FaceAnalysis,
        PredictionAggregator,
    )
    from app.services.ai.authenticity_scorer import AuthenticityScore, AuthenticityScorer
    from app.services.ai.confidence_calibrator import (
        CalibratedProbability,
        ConfidenceCalibrator,
    )
    from app.services.ai.decision_engine import Decision, DecisionEngine
    from app.services.ai.explainability import (
        ExplainabilityProvider,
        ExplanationResult,
        ManipulatedRegion,
        get_explainer,
    )
    from app.services.ai.frame_aggregation import (
        FrameAggregator,
        FrameVerdict,
        VideoAggregate,
    )
    from app.services.ai.inference_engine import InferenceEngine, InferenceResult
    from app.services.ai.prediction_service import FaceInput, PredictionService
    from app.services.ai.response_builder import build_prediction_response
    from app.services.ai.risk_assessor import RiskAssessor, RiskBand

__all__ = sorted(_EXPORTS)
