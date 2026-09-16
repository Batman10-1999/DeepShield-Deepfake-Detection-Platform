"""Regression: dataset manifest, provenance fields and split integrity."""
from __future__ import annotations

from app.services.dataset.manifest import (
    ManifestRecord,
    read_manifest,
    write_manifest,
)
from app.services.dataset.splitter import GroupAwareSplitter
from app.services.dataset.statistics import collect_statistics


def _record(index: int, label: str, source_id: str, *, sha: str = "",
            split: str | None = None) -> ManifestRecord:
    return ManifestRecord(
        path=f"processed/{label}/crop_{index}.png",
        label=label,
        source="celebdf",
        source_id=source_id,
        media_type="video",
        frame_number=index,
        face_index=0,
        width=224,
        height=224,
        sample_id=f"crop_{index}",
        timestamp_sec=index / 25.0,
        face_x=10, face_y=20, face_width=100, face_height=120,
        detector_score=0.91,
        sha256=sha or f"{index:064d}",
        split=split,
    )


def test_manifest_roundtrip_preserves_provenance(tmp_path):
    path = tmp_path / "manifest.jsonl"
    records = [_record(i, "real" if i % 2 else "fake", f"vid{i}")
               for i in range(6)]
    assert write_manifest(path, records) == 6

    loaded = read_manifest(path)
    assert loaded == records
    assert loaded[0].face_coordinates == {"x": 10, "y": 20,
                                          "width": 100, "height": 120}
    assert loaded[0].sample_id
    assert loaded[0].timestamp_sec is not None


def test_manifest_reader_tolerates_legacy_rows(tmp_path):
    """Older manifests lack the Day 5 fields; they must still load."""
    path = tmp_path / "manifest.jsonl"
    path.write_text(
        '{"path":"a.png","label":"real","source":"s","source_id":"v1",'
        '"media_type":"image","frame_number":null,"face_index":0,'
        '"width":224,"height":224,"split":"train"}\n'
    )
    loaded = read_manifest(path)
    assert len(loaded) == 1
    assert loaded[0].sample_id == ""
    assert loaded[0].sha256 == ""


def test_split_never_puts_one_source_in_two_splits(tmp_path, monkeypatch):
    from app.services.dataset.layout import DatasetLayout

    layout = DatasetLayout(root=tmp_path / "datasets")
    layout.create()
    records = [
        _record(i, "fake" if i % 2 else "real", f"vid{i // 3}")
        for i in range(30)
    ]
    assigned, report = GroupAwareSplitter(layout).apply(records,
                                                        copy_files=False)
    assert GroupAwareSplitter.detect_leakage(assigned) == []
    assert report.leakage_detected is False
    assert {r.split for r in assigned} <= {"train", "validation", "test"}


def test_identical_crops_across_splits_are_reported_as_leakage():
    duplicated = [
        _record(1, "real", "vidA", sha="deadbeef", split="train"),
        _record(2, "real", "vidB", sha="deadbeef", split="test"),
        _record(3, "fake", "vidC", sha="cafebabe", split="train"),
    ]
    assert GroupAwareSplitter.detect_duplicate_content(duplicated) == ["deadbeef"]


def test_split_is_reproducible_for_a_fixed_seed(tmp_path):
    from app.services.dataset.layout import DatasetLayout

    layout = DatasetLayout(root=tmp_path / "datasets")
    layout.create()
    records = [_record(i, "fake" if i % 2 else "real", f"vid{i // 2}")
               for i in range(20)]
    first = GroupAwareSplitter(layout, seed=7).plan(records).assignments
    second = GroupAwareSplitter(layout, seed=7).plan(records).assignments
    assert first == second


def test_statistics_are_counted_not_estimated(tmp_path):
    from app.services.dataset.layout import DatasetLayout

    layout = DatasetLayout(root=tmp_path / "datasets")
    layout.create()
    records = [_record(i, "real" if i < 6 else "fake", f"vid{i}")
               for i in range(10)]
    stats = collect_statistics(layout, records=records)
    assert stats.total_samples == 10
    assert stats.real_samples == 6
    assert stats.fake_samples == 4
    assert stats.class_balance == 0.4
    assert stats.per_source == {"celebdf": 10}
