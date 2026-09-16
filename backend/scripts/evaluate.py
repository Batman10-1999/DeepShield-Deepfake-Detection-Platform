"""Evaluation entry point (isolated test split only).

    python -m scripts.evaluate --model efficientnet_b0
    python -m scripts.evaluate --fit-calibration
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.evaluation.calibration_fit import (  # noqa: E402
    fit_temperature,
    save_calibration,
)
from app.services.evaluation.evaluator import ModelEvaluator  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default=None)
    parser.add_argument("--fit-calibration", action="store_true",
                        help="Fit the temperature on the validation split.")
    args = parser.parse_args()

    evaluator = ModelEvaluator()
    payload: dict = {"evaluation": evaluator.evaluate(args.model).as_dict()}

    if args.fit_calibration:
        labels, probabilities = evaluator.collect_probabilities(args.model)
        if not labels:
            payload["calibration"] = {
                "fitted": False,
                "reason": "No checkpoint or no validation split available.",
            }
        else:
            temperature, nll = fit_temperature(labels, probabilities)
            save_calibration(temperature, fitted_on="validation",
                             samples=len(labels), nll=nll)
            payload["calibration"] = {
                "fitted": True, "temperature": temperature,
                "validation_nll": nll, "samples": len(labels),
            }

    print(json.dumps(payload, indent=2, default=str))


if __name__ == "__main__":
    main()
