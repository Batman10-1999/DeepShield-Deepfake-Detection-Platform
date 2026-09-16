"""Training entry point. Requires an explicit --confirm flag.

    python -m scripts.train --confirm --dataset celebdf --epochs 10
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.dataset.layout import DatasetLayout      # noqa: E402
from app.services.training.config import TrainingConfig    # noqa: E402
from app.services.training.datamodule import build_dataloaders  # noqa: E402
from app.services.training.trainer import Trainer          # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--confirm", action="store_true",
                        help="Required: training is resource intensive.")
    parser.add_argument("--dataset", default="unspecified")
    parser.add_argument("--model", default=None)
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--batch-size", type=int, default=None)
    parser.add_argument("--lr", type=float, default=None)
    parser.add_argument("--dry-run", action="store_true",
                        help="Only verify that the dataset loads.")
    args = parser.parse_args()

    layout = DatasetLayout()
    validation = layout.validate()
    loaders = build_dataloaders(layout=layout, batch_size=args.batch_size,
                                splits=("train", "validation"))
    summary = {
        "dataset_ready": validation.is_ready_for_training,
        "splits_loaded": {k: len(v.dataset) for k, v in loaders.items()},
    }

    if not validation.is_ready_for_training or "train" not in loaders:
        summary["error"] = ("No prepared training data. Run "
                            "'python -m scripts.dataset preprocess' and 'split'.")
        print(json.dumps(summary, indent=2))
        return
    if args.dry_run or not args.confirm:
        summary["status"] = ("Dry run — pass --confirm to start training."
                             if not args.dry_run else "Dry run complete.")
        print(json.dumps(summary, indent=2))
        return

    overrides = {k: v for k, v in {
        "model_key": args.model, "epochs": args.epochs,
        "batch_size": args.batch_size, "learning_rate": args.lr,
        "dataset_version": args.dataset,
    }.items() if v is not None}
    config = TrainingConfig(**overrides)
    result = Trainer(config).fit(
        loaders["train"], loaders.get("validation", loaders["train"]),
        dataset=args.dataset,
    )
    print(json.dumps({"summary": summary, "result": result.__dict__},
                     indent=2, default=str))


if __name__ == "__main__":
    main()
