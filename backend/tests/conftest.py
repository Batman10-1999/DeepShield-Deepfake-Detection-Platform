"""Shared test fixtures.

Every test runs against a temporary dataset/upload root so a test run can
never touch, overwrite or delete real project data.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

import pytest
from PIL import Image

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings  # noqa: E402


@pytest.fixture()
def temp_upload_dir(tmp_path, monkeypatch):
    directory = tmp_path / "uploads"
    directory.mkdir()
    monkeypatch.setattr(settings, "UPLOAD_DIR", directory)
    return directory


@pytest.fixture()
def temp_dataset_root(tmp_path, monkeypatch):
    root = tmp_path / "datasets"
    monkeypatch.setattr(settings, "DATASET_DIR", root)
    return root


def make_jpeg_bytes(size: tuple[int, int] = (64, 64), color=(120, 90, 70)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, color).save(buffer, format="JPEG")
    return buffer.getvalue()


def make_png_bytes(size: tuple[int, int] = (64, 64), color=(10, 200, 120)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, color).save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture()
def jpeg_bytes() -> bytes:
    return make_jpeg_bytes()
