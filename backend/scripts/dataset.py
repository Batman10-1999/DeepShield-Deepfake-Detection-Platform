"""DeepShield dataset & model CLI (Day 5).

    python -m scripts.dataset init          create the dataset skeleton
    python -m scripts.dataset status        validate layout + statistics
    python -m scripts.dataset preprocess    raw media -> labelled face crops
    python -m scripts.dataset split         leakage-safe train/val/test split
    python -m scripts.dataset model-status  what weights are actually loaded

Training and evaluation are separate entry points so no long job can
start by accident.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.dataset.layout import DatasetLayout          # noqa: E402
from app.services.dataset.manifest import read_manifest        # noqa: E402
from app.services.dataset.sources import DATASET_SOURCES       # noqa: E402
from app.services.dataset.statistics import collect_statistics  # noqa: E402


def _print(payload) -> None:
    print(json.dumps(payload, indent=2, default=str))


def command_init(_: argparse.Namespace) -> None:
    layout = DatasetLayout()
    created = layout.create()
    _print({
        "root": str(layout.root),
        "created": [str(p) for p in created],
        "supported_sources": {k: v.display_name for k, v in DATASET_SOURCES.items()},
        "next_step": "Place licensed source media in datasets/raw/{real,fake}/.",
    })


def command_status(_: argparse.Namespace) -> None:
    layout = DatasetLayout()
    _print({
        "validation": layout.validate().as_dict(),
        "statistics": collect_statistics(layout).as_dict(),
    })


def command_preprocess(args: argparse.Namespace) -> None:
    from app.services.dataset.preprocessor import DatasetPreprocessor

    report = DatasetPreprocessor(DatasetLayout()).run()
    _print(report.as_dict())


def command_split(_: argparse.Namespace) -> None:
    from app.services.dataset.splitter import GroupAwareSplitter

    layout = DatasetLayout()
    records = read_manifest(layout.manifest_path)
    if not records:
        _print({"error": "No processed samples. Run 'preprocess' first."})
        return
    _, report = GroupAwareSplitter(layout).apply(records)
    _print(report.as_dict())


def command_model_status(_: argparse.Namespace) -> None:
    from app.services.ai.model_provenance import describe_active_model

    _print(describe_active_model())


def main() -> None:
    parser = argparse.ArgumentParser(prog="dataset", description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("init").set_defaults(func=command_init)
    sub.add_parser("status").set_defaults(func=command_status)
    sub.add_parser("preprocess").set_defaults(func=command_preprocess)
    sub.add_parser("split").set_defaults(func=command_split)
    sub.add_parser("model-status").set_defaults(func=command_model_status)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
