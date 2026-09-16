"""Prediction Service.

Single orchestrator for one media prediction. It owns *sequencing*
only — every calculation lives in its own service:

    tensor(s)
      -> InferenceEngine        raw FAKE probability (per face or frame)
      -> PredictionAggregator   consistent overall probability
      -> ConfidenceCalibrator   calibrated probabilities + confidence
      -> AuthenticityScorer     0-100 authenticity score
      -> RiskAssessor           prediction label + risk band
      -> DecisionEngine         final verdict
      -> ExplainabilityProvider explanation metadata (Grad-CAM ready)
      -> ResponseBuilder        canonical API payload

Every future detection module (video, audio, fusion) calls this exact
pipeline, which is why no step is inlined here.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Sequence

import torch
from PIL import Image

from app.core.constants import LogEvent
from app.core.exceptions import InferenceError, InferenceTimeoutError, ModelUnavailableError
from app.core.logger import get_logger
from app.core.metrics import Stage
from app.models.schemas import (
    FaceAnalysisPayload,
    FacePrediction,
    FaceRegionPayload,
    MediaMetadata,
    PredictionResponse,
    ProcessingMetrics,
)
from app.core.config import settings
from app.services.ai.aggregation import (
    AggregatedPrediction,
    FaceAnalysis,
    PredictionAggregator,
)
from app.services.ai.analysis_record import (
    build_analysis_record,
    generate_certificate_id,
)
from app.services.ai.authenticity_scorer import AuthenticityScorer, MediaType
from app.services.ai.confidence_calibrator import ConfidenceCalibrator
from app.services.ai.decision_engine import DecisionEngine
from app.services.ai.explainability import (
    ExplainabilityProvider,
    ManipulatedRegion,
    get_explainer,
)
from app.services.ai.inference_engine import InferenceEngine
from app.services.ai.response_builder import build_prediction_response
from app.services.ai.risk_assessor import RiskAssessor
from app.services.model_loader import ModelLoader
from app.services.vision.face_detector import FaceRegion

logger = get_logger(__name__)


@dataclass(frozen=True)
class FaceInput:
    """A detected face paired with its preprocessed tensor."""

    region: FaceRegion
    tensor: torch.Tensor


class PredictionService:
    """High-level API for turning tensors into a PredictionResponse."""

    def __init__(
        self,
        engine: InferenceEngine | None = None,
        calibrator: ConfidenceCalibrator | None = None,
        explainer: ExplainabilityProvider | None = None,
        decision_engine: DecisionEngine | None = None,
        aggregator: PredictionAggregator | None = None,
    ) -> None:
        self._engine = engine or InferenceEngine()
        self._calibrator = calibrator or ConfidenceCalibrator()
        self._scorer = AuthenticityScorer()
        self._risk = RiskAssessor()
        self._decision = decision_engine or DecisionEngine()
        self._explainer = explainer or get_explainer()
        self._aggregator = aggregator or PredictionAggregator()

    def is_ready(self) -> bool:
        return self._engine.is_ready()

    def predict(
        self,
        tensor: torch.Tensor,
        *,
        filename: str,
        preprocess_time_ms: float = 0.0,
        media_type: MediaType = "image",
        metadata: MediaMetadata | None = None,
        sha256: str | None = None,
        faces: Sequence[FaceInput] | None = None,
        face_detection_time_ms: float = 0.0,
        detector_name: str | None = None,
        source_image: Image.Image | None = None,
        explain: bool = True,
    ) -> PredictionResponse:
        """Run the full AI pipeline on one tensor, or on N face tensors."""
        self._validate_tensor(tensor)

        logger.info("%s: %s", LogEvent.ANALYSIS_STARTED, filename)
        logger.info("%s: tensor=%s media=%s",
                    LogEvent.PREPROCESS_COMPLETED, list(tensor.shape), media_type)
        started = time.perf_counter()

        loader = ModelLoader.get_instance()
        logger.info("%s: %s (weights=%s, device=%s)", LogEvent.MODEL_SELECTED,
                    loader.model_name, loader.weights_source, loader.device)

        face_analyses = self._analyse_faces(faces or [])
        if face_analyses:
            aggregate = self._aggregator.aggregate(face_analyses)
            fake_probability = aggregate.fake_probability
            inference_ms = sum(a.inference_time_ms for a in face_analyses)
            device = str(loader.device)
            model_name = loader.model_name or "unknown"
            logger.info("%s: %d face(s) via %s -> fake=%.4f (agreement=%.1f%%)",
                        LogEvent.PREDICTIONS_AGGREGATED, aggregate.face_count,
                        aggregate.strategy, fake_probability, aggregate.agreement)
        else:
            aggregate = None
            inference = self._run_inference(tensor)
            fake_probability = inference.fake_probability
            inference_ms = inference.inference_time_ms
            device = inference.device
            model_name = inference.model_name

        calibrated = self._calibrator.calibrate(fake_probability)
        logger.info(
            "%s: raw_fake=%.4f calibrated_fake=%.4f confidence=%.2f%% via %s",
            LogEvent.CONFIDENCE_CALCULATED, calibrated.raw_fake_probability,
            calibrated.fake_probability, calibrated.confidence, calibrated.method,
        )

        score = self._scorer.from_calibrated(calibrated, media_type=media_type)
        logger.info("%s: authenticity=%.2f/100 fake=%.2f%%",
                    LogEvent.AUTHENTICITY_SCORED,
                    score.authenticity_score, score.fake_percentage)

        risk = self._risk.classify(score.authenticity_score)
        logger.info("%s: %s risk", LogEvent.RISK_ASSESSED, risk.risk_level)

        confidence = aggregate.confidence if aggregate else score.confidence
        decision = self._decision.decide(
            fake_percentage=score.fake_percentage,
            confidence=confidence,
        )
        logger.info("%s: %s (%s)", LogEvent.DECISION_MADE,
                    decision.verdict, decision.rationale)

        explanation = (
            self.explain(
                tensor,
                fake_percentage=score.fake_percentage,
                confidence=decision.confidence,
                model_name=model_name,
                image=source_image,
                regions=self._regions_for(face_analyses),
            )
            if explain else None
        )

        certificate_id = generate_certificate_id()
        logger.info("%s: %s", LogEvent.CERTIFICATE_GENERATED, certificate_id)

        processing_time = time.perf_counter() - started
        metrics = ProcessingMetrics(
            face_detection_ms=round(face_detection_time_ms, 2),
            preprocess_ms=round(preprocess_time_ms, 2),
            inference_ms=round(inference_ms, 2),
            postprocess_ms=round(
                max(0.0, processing_time * 1000.0 - inference_ms), 2),
            model_load_ms=loader.load_time_ms,
            total_ms=round(
                processing_time * 1000.0 + preprocess_time_ms
                + face_detection_time_ms, 2),
        )

        response = build_prediction_response(
            filename=filename,
            model_name=model_name,
            authenticity_score=score.authenticity_score,
            fake_percentage=score.fake_percentage,
            confidence=decision.confidence,
            risk=risk,
            processing_time=processing_time,
            inference_time_ms=inference_ms,
            preprocess_time_ms=preprocess_time_ms,
            model_load_time_ms=loader.load_time_ms,
            weights_source=loader.weights_source,
            device=device,
            explanation=explanation,
            calibration_method=calibrated.method,
            decision=decision,
            metadata=metadata,
            face_analysis=self._face_payload(
                face_analyses, aggregate,
                detector_name=detector_name,
                detection_time_ms=face_detection_time_ms,
            ),
            metrics=metrics,
            sha256=sha256,
            certificate_id=certificate_id,
        )
        logger.info("%s: %s", LogEvent.RESPONSE_BUILT, filename)

        record = build_analysis_record(response)
        logger.info("%s: %s (%s)", LogEvent.RECORD_BUILT,
                    record.certificate_id, record.prediction)

        logger.info(
            "%s: %s -> %s (%.2f%% authentic, risk=%s, conf=%.2f%%, %.0fms)",
            LogEvent.ANALYSIS_COMPLETED, filename, response.prediction,
            response.authenticity_score, response.risk_level,
            response.confidence, processing_time * 1000.0,
        )
        logger.info("%s: %s in %.0fms", LogEvent.PROCESSING_FINISHED,
                    filename, processing_time * 1000.0)
        return response

    def explain(
        self,
        tensor: torch.Tensor,
        *,
        fake_percentage: float,
        confidence: float,
        model_name: str,
        image: Image.Image | None = None,
        regions: Sequence[ManipulatedRegion] | None = None,
    ):
        """Run the explainability provider on an already-inferred tensor.

        Exposed so the video pipeline can generate Grad-CAM for selected
        frames only, reusing the tensors preprocessing already produced.
        """
        explanation = self._explainer.explain(
            tensor=tensor,
            fake_percentage=fake_percentage,
            model_name=model_name,
            regions=list(regions or []),
            image=image,
            confidence=confidence,
        )
        logger.info("%s: method=%s regions=%d", LogEvent.EXPLANATION_BUILT,
                    explanation.method, len(explanation.regions))
        return explanation

    # -- Internals -------------------------------------------------------------
    def _run_inference(self, tensor: torch.Tensor):
        if not self._engine.is_ready():
            raise ModelUnavailableError()
        started = time.perf_counter()
        try:
            result = self._engine.run(tensor)
        except RuntimeError as exc:
            logger.exception("%s: %s", LogEvent.INFERENCE_FAILED, exc)
            raise InferenceError() from exc
        if (time.perf_counter() - started) > settings.INFERENCE_TIMEOUT_SEC:
            logger.warning("%s: exceeded %.0fs budget",
                           LogEvent.INFERENCE_FAILED,
                           settings.INFERENCE_TIMEOUT_SEC)
            raise InferenceTimeoutError()
        return result

    def _analyse_faces(self, faces: Sequence[FaceInput]) -> list[FaceAnalysis]:
        """Independently score every detected face."""
        analyses: list[FaceAnalysis] = []
        for face in faces:
            self._validate_tensor(face.tensor)
            inference = self._run_inference(face.tensor)
            calibrated = self._calibrator.calibrate(inference.fake_probability)
            score = self._scorer.from_calibrated(calibrated)
            decision = self._decision.decide(
                fake_percentage=score.fake_percentage,
                confidence=score.confidence,
            )
            logger.info("%s: face #%d -> %s (%.2f%% fake, conf=%.2f%%)",
                        LogEvent.FACE_ANALYSED, face.region.index,
                        decision.verdict, score.fake_percentage,
                        decision.confidence)
            analyses.append(FaceAnalysis(
                region=face.region,
                fake_probability=calibrated.fake_probability,
                confidence=decision.confidence,
                prediction=decision.verdict,
                inference_time_ms=inference.inference_time_ms,
            ))
        return analyses

    @staticmethod
    def _regions_for(analyses: Sequence[FaceAnalysis]) -> list[ManipulatedRegion]:
        return [
            ManipulatedRegion(
                x=a.region.x, y=a.region.y,
                width=a.region.width, height=a.region.height,
                intensity=round(a.fake_probability, 3),
                label=f"face_{a.region.index}",
            )
            for a in analyses
        ]

    @staticmethod
    def _face_payload(
        analyses: Sequence[FaceAnalysis],
        aggregate: AggregatedPrediction | None,
        *,
        detector_name: str | None,
        detection_time_ms: float,
    ) -> FaceAnalysisPayload | None:
        if not analyses:
            return None
        faces = [
            FacePrediction(
                index=a.region.index,
                region=FaceRegionPayload(**a.region.as_dict()),
                prediction=a.prediction,
                confidence=round(a.confidence, 2),
                fake_percentage=a.fake_percentage,
                authenticity_score=round(100.0 - a.fake_percentage, 2),
                inference_time_ms=a.inference_time_ms,
            )
            for a in analyses
        ]
        return FaceAnalysisPayload(
            detected=True,
            face_count=len(faces),
            detector=detector_name,
            detection_time_ms=round(detection_time_ms, 2),
            aggregation_strategy=aggregate.strategy if aggregate else None,
            agreement=aggregate.agreement if aggregate else 100.0,
            consistent=aggregate.consistent if aggregate else True,
            dominant_face_index=aggregate.dominant_face_index if aggregate else None,
            faces=faces,
        )

    @staticmethod
    def _validate_tensor(tensor: torch.Tensor) -> None:
        if not isinstance(tensor, torch.Tensor) or tensor.ndim != 4:
            raise ValueError(
                "Invalid tensor: expected 4-D torch.Tensor [B, C, H, W]."
            )
