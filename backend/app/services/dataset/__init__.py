"""Dataset engineering services (Day 5).

Layout, discovery, face-based preprocessing, leakage-safe splitting and
dataset statistics. Nothing in this package fabricates data: every sample
must be placed on disk by the operator from a legitimate source dataset.
"""
from app.services.dataset.layout import DatasetLayout, DatasetValidation
from app.services.dataset.manifest import ManifestRecord, read_manifest, write_manifest
from app.services.dataset.sample_registry import RawSample, discover_raw_samples
from app.services.dataset.sources import DATASET_SOURCES, DatasetSource
from app.services.dataset.splitter import SplitPlan, SplitReport, GroupAwareSplitter
from app.services.dataset.statistics import DatasetStatistics, collect_statistics

__all__ = [
    "DATASET_SOURCES",
    "DatasetLayout",
    "DatasetSource",
    "DatasetStatistics",
    "DatasetValidation",
    "GroupAwareSplitter",
    "ManifestRecord",
    "RawSample",
    "SplitPlan",
    "SplitReport",
    "collect_statistics",
    "discover_raw_samples",
    "read_manifest",
    "write_manifest",
]
