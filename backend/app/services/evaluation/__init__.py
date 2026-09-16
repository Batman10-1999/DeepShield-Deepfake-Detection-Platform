"""Evaluation services (Day 5).

Metric computation, isolated test-set evaluation and validation-based
temperature fitting. No metric is ever produced without real predictions
over a real labelled split.
"""
from app.services.evaluation.calibration_fit import fit_temperature, save_calibration
from app.services.evaluation.evaluator import EvaluationReport, ModelEvaluator
from app.services.evaluation.metrics import BinaryMetrics, compute_metrics

__all__ = [
    "BinaryMetrics",
    "EvaluationReport",
    "ModelEvaluator",
    "compute_metrics",
    "fit_temperature",
    "save_calibration",
]
