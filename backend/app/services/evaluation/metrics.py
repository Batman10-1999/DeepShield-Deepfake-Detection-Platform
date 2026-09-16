"""Binary classification metrics.

Implemented directly on top of the confusion matrix so DeepShield keeps a
dependency-light backend and every number is explainable during a viva.
Positive class = FAKE (label 1).
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Sequence


@dataclass(frozen=True)
class BinaryMetrics:
    threshold: float
    samples: int
    true_positive: int
    true_negative: int
    false_positive: int
    false_negative: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    specificity: float
    false_positive_rate: float
    false_negative_rate: float
    roc_auc: float | None

    @property
    def confusion_matrix(self) -> dict:
        return {
            "true_positive_fake": self.true_positive,
            "false_negative_fake_missed": self.false_negative,
            "false_positive_real_flagged": self.false_positive,
            "true_negative_real": self.true_negative,
        }

    def as_dict(self) -> dict:
        payload = asdict(self)
        payload["confusion_matrix"] = self.confusion_matrix
        return payload


def _safe_divide(numerator: float, denominator: float) -> float:
    return round(numerator / denominator, 6) if denominator else 0.0


def roc_auc(labels: Sequence[float], scores: Sequence[float]) -> float | None:
    """Rank-based AUC (Mann-Whitney U). None when one class is absent."""
    positives = [s for s, y in zip(scores, labels) if y >= 0.5]
    negatives = [s for s, y in zip(scores, labels) if y < 0.5]
    if not positives or not negatives:
        return None

    ordered = sorted(range(len(scores)), key=lambda i: scores[i])
    ranks = [0.0] * len(scores)
    index = 0
    while index < len(ordered):
        end = index
        while (end + 1 < len(ordered)
               and scores[ordered[end + 1]] == scores[ordered[index]]):
            end += 1
        average_rank = (index + end) / 2.0 + 1.0
        for position in range(index, end + 1):
            ranks[ordered[position]] = average_rank
        index = end + 1

    positive_rank_sum = sum(r for r, y in zip(ranks, labels) if y >= 0.5)
    n_pos, n_neg = len(positives), len(negatives)
    statistic = positive_rank_sum - n_pos * (n_pos + 1) / 2.0
    return round(statistic / (n_pos * n_neg), 6)


def compute_metrics(
    labels: Sequence[float],
    probabilities: Sequence[float],
    *,
    threshold: float = 0.5,
) -> BinaryMetrics:
    if len(labels) != len(probabilities):
        raise ValueError("labels and probabilities must have the same length.")

    tp = tn = fp = fn = 0
    for label, probability in zip(labels, probabilities):
        predicted_fake = probability >= threshold
        actual_fake = label >= 0.5
        if predicted_fake and actual_fake:
            tp += 1
        elif predicted_fake and not actual_fake:
            fp += 1
        elif not predicted_fake and actual_fake:
            fn += 1
        else:
            tn += 1

    total = tp + tn + fp + fn
    precision = _safe_divide(tp, tp + fp)
    recall = _safe_divide(tp, tp + fn)
    return BinaryMetrics(
        threshold=threshold,
        samples=total,
        true_positive=tp,
        true_negative=tn,
        false_positive=fp,
        false_negative=fn,
        accuracy=_safe_divide(tp + tn, total),
        precision=precision,
        recall=recall,
        f1_score=_safe_divide(2 * precision * recall, precision + recall),
        specificity=_safe_divide(tn, tn + fp),
        false_positive_rate=_safe_divide(fp, fp + tn),
        false_negative_rate=_safe_divide(fn, fn + tp),
        roc_auc=roc_auc(labels, probabilities),
    )
