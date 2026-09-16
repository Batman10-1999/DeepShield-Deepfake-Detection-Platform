"""Supported public deepfake dataset sources.

These are the datasets named in the DeepShield project report. DeepShield
never downloads them: each requires an accepted research licence, so the
operator obtains the data and drops it into ``datasets/raw/<source>/``.
This module only records what each source is and how its labels map onto
the DeepShield ``real`` / ``fake`` classes.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DatasetSource:
    key: str
    display_name: str
    media: str                # "video" | "image" | "mixed"
    access: str               # how the data is obtained
    label_convention: str     # how real/fake are identified in the source
    url: str


DATASET_SOURCES: dict[str, DatasetSource] = {
    "faceforensics": DatasetSource(
        key="faceforensics",
        display_name="FaceForensics++",
        media="video",
        access="Signed academic EULA, download script issued by TUM.",
        label_convention=(
            "original_sequences/* -> real; manipulated_sequences/"
            "{Deepfakes,Face2Face,FaceSwap,NeuralTextures} -> fake."
        ),
        url="https://github.com/ondyari/FaceForensics",
    ),
    "celebdf": DatasetSource(
        key="celebdf",
        display_name="Celeb-DF (v2)",
        media="video",
        access="Request form to the Celeb-DF authors.",
        label_convention=(
            "Celeb-real/ and YouTube-real/ -> real; Celeb-synthesis/ -> fake."
        ),
        url="https://github.com/yuezunli/celeb-deepfakeforensics",
    ),
    "dfdc": DatasetSource(
        key="dfdc",
        display_name="DFDC (Deepfake Detection Challenge)",
        media="video",
        access="Kaggle competition data, licence acceptance required.",
        label_convention="metadata.json label field: REAL -> real, FAKE -> fake.",
        url="https://ai.meta.com/datasets/dfdc/",
    ),
    "fakeavceleb": DatasetSource(
        key="fakeavceleb",
        display_name="FakeAVCeleb",
        media="video",
        access="Request form to the FakeAVCeleb authors.",
        label_convention=(
            "RealVideo-RealAudio -> real; every Fake* directory -> fake "
            "(DeepShield Day 5 uses the visual stream only)."
        ),
        url="https://github.com/DASH-Lab/FakeAVCeleb",
    ),
}


def get_source(key: str) -> DatasetSource:
    source = DATASET_SOURCES.get(key.strip().lower())
    if source is None:
        raise ValueError(
            f"Unknown dataset source '{key}'. Known: {sorted(DATASET_SOURCES)}"
        )
    return source
