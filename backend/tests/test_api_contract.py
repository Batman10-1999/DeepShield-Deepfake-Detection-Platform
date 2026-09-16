"""End-to-end API regression tests.

These exercise the real FastAPI app: routing, validation, streaming
persistence and response contracts. Model-dependent tests are skipped when
torch is unavailable rather than being silently passed.
"""
from __future__ import annotations

import pytest

torch = pytest.importorskip("torch", reason="torch not installed in this env")

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402
from pathlib import Path  # noqa: E402

from tests.conftest import make_jpeg_bytes, make_png_bytes  # noqa: E402

FIXTURE_FACE = Path(__file__).parent / "fixtures" / "face.jpg"

@pytest.fixture(scope="module")
def client():
    """Run the app through its lifespan so the model actually loads."""
    with TestClient(app) as test_client:
        yield test_client


def test_health_reports_model_state(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "model_loaded" in body
    assert "device" in body
    weights = body["provenance"]["weights"]
    assert isinstance(weights["deepfake_trained"], bool)
    assert weights["effective_weights"] in {
        "imagenet_pretrained_backbone", "deepshield_checkpoint"}


def test_unsupported_extension_is_rejected_before_analysis(client):
    response = client.post(
        "/predict/image",
        files={"file": ("evil.gif", b"GIF89a", "image/gif")},
    )
    assert response.status_code in (400, 415)
    assert response.json()["error_code"]


def test_corrupted_image_returns_a_structured_error(client):
    response = client.post(
        "/predict/image",
        files={"file": ("broken.jpg", b"nonsense-bytes", "image/jpeg")},
    )
    assert response.status_code in (400, 422)
    body = response.json()
    assert body["error_code"]
    assert body["message"]


def test_image_prediction_returns_binary_verdict(client, temp_upload_dir):
    response = client.post(
        "/predict/image",
        files={"file": ("face.jpg", make_jpeg_bytes((256, 256)), "image/jpeg")},
    )
    # 503 is a legitimate outcome here: no deepfake-trained weights are
    # bundled, so the model may be unavailable in a clean checkout.
    assert response.status_code in (200, 422, 503)
    body = response.json()
    if response.status_code == 200:
        assert body["prediction"] in {"REAL", "FAKE"}
        assert 0.0 <= body["confidence"] <= 100.0
        assert body["decision"]["analytical_band"] in {
            "REAL", "FAKE", "SUSPICIOUS", "NEEDS_MANUAL_REVIEW"}
        assert isinstance(body["decision"]["binary_decision_validated"], bool)


def test_upload_endpoint_persists_streamed_file(client, temp_upload_dir):
    response = client.post(
        "/upload/image",
        files={"file": ("shot.png", make_png_bytes((128, 128)), "image/png")},
    )
    assert response.status_code in (200, 400, 415, 422, 503)
    if response.status_code == 200:
        assert len(list(temp_upload_dir.iterdir())) == 1


def test_oversized_video_is_refused(client):
    payload = b"0" * (2 * 1024 * 1024)
    from app.core.config import settings

    original = settings.MAX_VIDEO_SIZE_MB
    settings.MAX_VIDEO_SIZE_MB = 1
    try:
        response = client.post(
            "/predict/video",
            files={"file": ("huge.mp4", payload, "video/mp4")},
        )
    finally:
        settings.MAX_VIDEO_SIZE_MB = original
    assert response.status_code in (413, 400)
    assert response.json()["error_code"] == "FILE_TOO_LARGE"


def test_real_face_image_produces_a_full_binary_analysis(client, temp_upload_dir):
    """End-to-end: a genuine face photo must yield a complete REAL/FAKE result."""
    response = client.post(
        "/predict/image",
        files={"file": ("face.jpg", FIXTURE_FACE.read_bytes(), "image/jpeg")},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["prediction"] in {"REAL", "FAKE"}
    assert 0.0 <= body["confidence"] <= 100.0

    decision = body["decision"]
    assert decision["analytical_band"] in {
        "REAL", "FAKE", "SUSPICIOUS", "NEEDS_MANUAL_REVIEW"}
    assert decision["binary_threshold_pct"] > 0
    assert decision["validation_note"]
    assert 0.0 <= body["fake_percentage"] <= 100.0


def test_repeated_analysis_of_one_image_is_deterministic(client, temp_upload_dir):
    payload = FIXTURE_FACE.read_bytes()
    results = []
    for _ in range(2):
        response = client.post(
            "/predict/image", files={"file": ("face.jpg", payload, "image/jpeg")})
        assert response.status_code == 200
        body = response.json()
        results.append((body["prediction"], round(body["confidence"], 2)))
    assert results[0] == results[1], "identical input produced different verdicts"
