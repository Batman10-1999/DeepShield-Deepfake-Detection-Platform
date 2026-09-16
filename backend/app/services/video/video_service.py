"""Video detection orchestration.

Video analysis uses the pretrained DeepfakeDetector methodology:
10 uniformly sampled full frames with averaged class probabilities.

The existing frame-analysis pipeline is retained for frame-level evidence,
timeline information and Grad-CAM explanations. The final video verdict is
driven by the dedicated full-frame video inference path.
"""
from __future__ import annotations

import time
from pathlib import Path
from app.services.video.upstream_video_inference import (
    UpstreamVideoInference,
)

from app.core.config import settings
from app.core.constants import LogEvent
from app.core.exceptions import (
    ModelUnavailableError,
    NoAnalysableFramesError,
    VideoTooLongError,
)
from app.core.logger import get_logger
from app.core.metrics import ProcessingMetricsCollector, Stage
from app.models.schemas import (
    ExplanationPayload,
    FrameAnalysisPayload,
    VideoPredictionResponse,
    VideoProcessingMetrics,
)
from app.services.ai.analysis_record import generate_certificate_id
from app.services.ai.authenticity_scorer import AuthenticityScorer
from app.services.ai.decision_engine import DecisionEngine
from app.services.ai.frame_aggregation import FrameAggregator, FrameVerdict
from app.services.ai.prediction_service import PredictionService
from app.services.ai.risk_assessor import RiskAssessor
from app.services.ai.response_builder import build_explanation_payload
from app.services.ai.video_response_builder import (
    build_aggregation_payload,
    build_video_prediction_response,
)
from app.services.model_loader import ModelLoader
from app.services.video.frame_analyzer import FrameAnalysis, FrameAnalyzer
from app.services.video.video_metadata_service import extract_video_metadata
from app.services.vision.frame_extractor import FrameExtractionService
from app.utils.hashing import sha256_file

logger = get_logger(__name__)

_predictor = PredictionService()


class VideoAnalysisService:
    """Composes metadata, frame extraction and the shared AI pipeline."""

    def __init__(
        self,
        predictor: PredictionService | None = None,
        extractor: FrameExtractionService | None = None,
        aggregator: FrameAggregator | None = None,
        analyzer: FrameAnalyzer | None = None,
    ) -> None:
        self._predictor = predictor or _predictor
        self._extractor = extractor or FrameExtractionService()
        self._aggregator = aggregator or FrameAggregator()
        self._analyzer = analyzer or FrameAnalyzer(self._predictor)
        self._scorer = AuthenticityScorer()
        self._risk = RiskAssessor()
        self._decision = DecisionEngine()
        self._upstream_video = UpstreamVideoInference()

    def analyse(
        self,
        video_path: Path,
        *,
        filename: str | None = None,
        sha256: str | None = None,
    ) -> VideoPredictionResponse:
        if not self._predictor.is_ready():
            raise ModelUnavailableError("AI model is not loaded yet.")

        display_name = filename or video_path.name
        metrics = ProcessingMetricsCollector()
        started = time.perf_counter()
        logger.info("%s: %s", LogEvent.VIDEO_ANALYSIS_STARTED, display_name)

        with metrics.measure(Stage.HASHING):
            digest = sha256 or sha256_file(video_path)

        with metrics.measure(Stage.METADATA):
            metadata = extract_video_metadata(
                video_path, original_filename=display_name, sha256=digest)
        logger.info("%s: %s (%s, %.2f fps, %.2fs, %s)",
                    LogEvent.VIDEO_METADATA_EXTRACTED, display_name,
                    metadata.resolution or "unknown", metadata.fps,
                    metadata.duration_sec, metadata.codec or "unknown")

        if metadata.duration_sec > settings.MAX_VIDEO_DURATION_SEC:
            raise VideoTooLongError(
                f"Video is {metadata.duration_sec:.1f}s long; the limit is "
                f"{settings.MAX_VIDEO_DURATION_SEC:.0f}s."
            )

        logger.info("%s: %s via %s strategy", LogEvent.FRAME_EXTRACTION_STARTED,
                    display_name, self._extractor.strategy_name)
        with metrics.measure(Stage.FRAME_EXTRACTION):
            extraction = self._extractor.extract(
                video_path,
                frame_count=metadata.frame_count,
                fps=metadata.fps,
            )
        metrics.record(Stage.VIDEO_LOAD, extraction.extraction_time_ms)
        logger.info("%s: %s -> %d frame(s) of %d",
                    LogEvent.FRAME_EXTRACTION_COMPLETED, display_name,
                    extraction.count, extraction.total_frames)

        logger.info("%s: %s (%d frames)", LogEvent.FRAME_ANALYSIS_STARTED,
                    display_name, extraction.count)
        with metrics.measure(Stage.FRAME_ANALYSIS):
            analyses = self._analyse_frames(extraction.frames, display_name)
        if not analyses:
            raise NoAnalysableFramesError()
        logger.info("%s: %s (%d analysed, %d skipped)",
                    LogEvent.FRAME_ANALYSIS_COMPLETED, display_name,
                    len(analyses), extraction.count - len(analyses))
        upstream_result = self._upstream_video.analyze(video_path)

        logger.info(
            "Upstream video inference: frames=%d fake=%.4f real=%.4f class=%d",
            upstream_result.frames_analyzed,
            upstream_result.fake_probability,
            upstream_result.real_probability,
            upstream_result.predicted_class,
        )
        with metrics.measure(Stage.AGGREGATION):
            aggregate = self._aggregator.aggregate(
                [self._verdict(a) for a in analyses]
            )

            aggregate = aggregate.__class__(
                fake_probability=round(upstream_result.fake_probability, 6),
                confidence=round(
                    max(
                        upstream_result.real_probability,
                        upstream_result.fake_probability,
                    ) * 100.0,
                    2,
                ),
                strategy="upstream_10_frame_mean",
                frames_analysed=upstream_result.frames_analyzed,
                real_frames=(
                    upstream_result.frames_analyzed
                    if upstream_result.predicted_class == 0
                    else 0
                ),
                fake_frames=(
                    upstream_result.frames_analyzed
                    if upstream_result.predicted_class == 1
                    else 0
                ),
                suspicious_frames=0,
                manual_review_frames=0,
                agreement=100.0,
                consistent=True,
                dominant_frame_number=(
                    upstream_result.sampled_frame_indexes[0]
                    if upstream_result.sampled_frame_indexes
                    else analyses[0].frame.frame_number
                    ),
                )
        logger.info(
            "%s: %s -> fake=%.2f%% (agreement=%.1f%%, R=%d F=%d S=%d M=%d)",
            LogEvent.FRAME_AGGREGATION_COMPLETED, display_name,
            aggregate.fake_probability * 100.0, aggregate.agreement,
            aggregate.real_frames, aggregate.fake_frames,
            aggregate.suspicious_frames, aggregate.manual_review_frames,
        )

        score = self._scorer.score(
            aggregate.fake_probability,
            confidence=aggregate.confidence,
            media_type="video",
        )
        risk = self._risk.classify(score.authenticity_score)
        decision = self._decision.decide(
            fake_percentage=score.fake_percentage,
            confidence=aggregate.confidence,
        )
        logger.info("%s: %s (%s)", LogEvent.DECISION_MADE,
                    decision.verdict, decision.rationale)

        dominant = self._dominant(analyses, aggregate.dominant_frame_number)
        explanations = self._explain_key_frames(
            analyses, dominant, display_name)
        timeline = [
            self._timeline_entry(a, explanations.get(a.frame.frame_number))
            for a in analyses
        ]
        loader = ModelLoader.get_instance()
        processing_time = time.perf_counter() - started

        response = build_video_prediction_response(
            filename=display_name,
            model_name=loader.model_name or "unknown",
            weights_source=loader.weights_source,
            device=str(loader.device),
            authenticity_score=score.authenticity_score,
            fake_percentage=score.fake_percentage,
            confidence=decision.confidence,
            risk=risk,
            decision=decision,
            calibration_method=dominant.response.calibration_method,
            processing_time=processing_time,
            video_metadata=metadata,
            aggregation=build_aggregation_payload(
                aggregate,
                frames_extracted=extraction.count,
                frames_skipped=extraction.count - len(analyses),
                authenticity_score=score.authenticity_score,
            ),
            timeline=timeline,
            metrics=self._metrics(metrics, analyses, processing_time,
                                  loader.load_time_ms),
            explanation=explanations.get(dominant.frame.frame_number),
            sha256=digest,
            certificate_id=generate_certificate_id(),
        )
        logger.info("%s: %s", LogEvent.RESPONSE_BUILT, display_name)
        logger.info(
            "%s: %s -> %s (%.2f%% authentic, risk=%s, conf=%.2f%%, %.0fms)",
            LogEvent.VIDEO_ANALYSIS_COMPLETED, display_name, response.prediction,
            response.authenticity_score, response.risk_level,
            response.confidence, processing_time * 1000.0,
        )
        return response

    # -- Internals -------------------------------------------------------------
    def _analyse_frames(self, frames, display_name: str) -> list[FrameAnalysis]:
        analyses: list[FrameAnalysis] = []
        for frame in frames:
            analysis = self._analyzer.analyse(frame, source_name=display_name)
            if analysis is None:
                logger.info("%s: frame %d of %s has no face — skipped",
                            LogEvent.NO_FACE_DETECTED, frame.frame_number,
                            display_name)
                continue
            logger.info("%s: frame %d @ %.2fs -> %s (%.2f%% fake, conf=%.2f%%)",
                        LogEvent.FRAME_ANALYSED, frame.frame_number,
                        frame.timestamp_sec, analysis.response.prediction,
                        analysis.response.fake_percentage,
                        analysis.response.confidence)
            analyses.append(analysis)
        return analyses

    @staticmethod
    def _verdict(analysis: FrameAnalysis) -> FrameVerdict:
        response = analysis.response
        return FrameVerdict(
            frame_number=analysis.frame.frame_number,
            timestamp_sec=analysis.frame.timestamp_sec,
            fake_probability=response.fake_percentage / 100.0,
            confidence=response.confidence,
            prediction=response.prediction,
            analytical_band=(response.decision.analytical_band
                             if response.decision else None),
            faces_detected=analysis.faces_detected,
            inference_time_ms=response.inference_time_ms,
        )

    def _explain_key_frames(
        self,
        analyses: list[FrameAnalysis],
        dominant: FrameAnalysis,
        display_name: str,
    ) -> dict[int, ExplanationPayload]:
        """Grad-CAM the dominant and most suspicious frames only.

        Running explainability on every sampled frame would multiply the
        cost of a video analysis for no analytical gain: the verdict is
        driven by the dominant frame, and reviewers care about the worst
        offender. Both reuse the tensors frame analysis already produced.
        """
        suspicious = max(analyses, key=lambda a: a.response.fake_percentage)
        selected: list[FrameAnalysis] = [dominant]
        if suspicious.frame.frame_number != dominant.frame.frame_number:
            selected.append(suspicious)
        selected = selected[:max(1, settings.VIDEO_GRADCAM_FRAMES)]

        explanations: dict[int, ExplanationPayload] = {}
        for analysis in selected:
            response = analysis.response
            explanation = self._predictor.explain(
                analysis.tensor,
                fake_percentage=response.fake_percentage,
                confidence=response.confidence,
                model_name=response.model_name,
                image=analysis.frame.image,
            )
            payload = build_explanation_payload(explanation)
            if payload is not None:
                explanations[analysis.frame.frame_number] = payload
            logger.info("%s: frame %d of %s explained via %s",
                        LogEvent.EXPLANATION_BUILT, analysis.frame.frame_number,
                        display_name, explanation.method)
        return explanations

    @staticmethod
    def _timeline_entry(
        analysis: FrameAnalysis,
        explanation: ExplanationPayload | None = None,
    ) -> FrameAnalysisPayload:
        response = analysis.response
        return FrameAnalysisPayload(
            frame_number=analysis.frame.frame_number,
            timestamp_sec=analysis.frame.timestamp_sec,
            prediction=response.prediction,
            confidence=response.confidence,
            authenticity_score=response.authenticity_score,
            fake_percentage=response.fake_percentage,
            risk_level=response.risk_level,
            faces_detected=analysis.faces_detected,
            inference_time_ms=response.inference_time_ms,
            explanation=explanation or response.explanation,
        )

    @staticmethod
    def _dominant(analyses: list[FrameAnalysis], frame_number: int) -> FrameAnalysis:
        for analysis in analyses:
            if analysis.frame.frame_number == frame_number:
                return analysis
        return analyses[0]

    @staticmethod
    def _metrics(
        collector: ProcessingMetricsCollector,
        analyses: list[FrameAnalysis],
        processing_time: float,
        model_load_ms: float,
    ) -> VideoProcessingMetrics:
        frame_metrics = [a.response.metrics for a in analyses if a.response.metrics]
        return VideoProcessingMetrics(
            video_load_ms=collector.get(Stage.VIDEO_LOAD),
            metadata_ms=collector.get(Stage.METADATA),
            frame_extraction_ms=collector.get(Stage.FRAME_EXTRACTION),
            face_detection_ms=round(
                sum(m.face_detection_ms for m in frame_metrics), 2),
            preprocess_ms=round(sum(m.preprocess_ms for m in frame_metrics), 2),
            inference_ms=round(sum(m.inference_ms for m in frame_metrics), 2),
            aggregation_ms=collector.get(Stage.AGGREGATION),
            model_load_ms=model_load_ms,
            total_ms=round(processing_time * 1000.0, 2),
        )


_analysis_service = VideoAnalysisService()


def predict_video_file(
    video_path: Path,
    *,
    filename: str | None = None,
    sha256: str | None = None,
) -> VideoPredictionResponse:
    """Module-level entry point mirroring `predict_image_file`."""
    return _analysis_service.analyse(
        video_path, filename=filename, sha256=sha256)


__all__ = ["VideoAnalysisService", "predict_video_file"]
