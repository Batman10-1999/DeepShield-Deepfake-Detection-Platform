"""Regression: uploads are streamed, bounded and cleaned up.

The Day 5 reliability requirement is that a large upload never lands in
memory in one piece and that an oversized upload is refused *during*
transfer, not after it completes.
"""
from __future__ import annotations

import io

import pytest
from fastapi import UploadFile

from app.utils.file_utils import (
    UploadTooLarge,
    discard_upload,
    stream_upload_to_disk,
)
from app.utils.validators import (
    validate_image_path,
    validate_upload_envelope,
    validate_video_path,
)
from tests.conftest import make_jpeg_bytes


def _upload(name: str, payload: bytes, content_type: str) -> UploadFile:
    return UploadFile(filename=name, file=io.BytesIO(payload),
                      headers={"content-type": content_type})


@pytest.mark.asyncio
async def test_stream_writes_file_and_reports_size_and_hash(temp_upload_dir):
    payload = make_jpeg_bytes()
    stored = await stream_upload_to_disk(
        _upload("a.jpg", payload, "image/jpeg"), "a.jpg",
        max_bytes=10 * 1024 * 1024)
    assert stored.path.exists()
    assert stored.size_bytes == len(payload)
    assert len(stored.sha256) == 64
    assert stored.path.read_bytes() == payload


@pytest.mark.asyncio
async def test_oversized_upload_is_rejected_and_leaves_no_file(temp_upload_dir):
    payload = b"x" * (256 * 1024)
    with pytest.raises(UploadTooLarge):
        await stream_upload_to_disk(
            _upload("big.mp4", payload, "video/mp4"), "big.mp4",
            max_bytes=64 * 1024)
    assert list(temp_upload_dir.iterdir()) == []


@pytest.mark.asyncio
async def test_large_upload_streams_in_bounded_chunks(temp_upload_dir):
    """A 12 MB payload must be consumed in many small reads, not one."""
    payload = b"y" * (12 * 1024 * 1024)
    upload = _upload("big.mp4", payload, "video/mp4")
    reads: list[int] = []
    original = upload.read

    async def counting_read(size: int = -1):
        chunk = await original(size)
        reads.append(len(chunk))
        return chunk

    upload.read = counting_read  # type: ignore[method-assign]
    stored = await stream_upload_to_disk(
        upload, "big.mp4", max_bytes=200 * 1024 * 1024)

    assert stored.size_bytes == len(payload)
    assert len(reads) > 1, "upload was read in a single call"
    assert max(reads) <= 8 * 1024 * 1024


@pytest.mark.asyncio
async def test_discard_removes_stored_file(temp_upload_dir):
    stored = await stream_upload_to_disk(
        _upload("a.jpg", make_jpeg_bytes(), "image/jpeg"), "a.jpg",
        max_bytes=1024 * 1024)
    discard_upload(stored.path)
    assert not stored.path.exists()
    discard_upload(stored.path)  # idempotent


def test_envelope_rejects_unsupported_types_before_transfer():
    assert validate_upload_envelope("clip.gif", "image/gif", "image")
    assert validate_upload_envelope("clip.wmv", "video/x-ms-wmv", "video")
    assert validate_upload_envelope("photo.png", "image/png", "image") is None
    assert validate_upload_envelope("clip.mp4", "video/mp4", "video") is None


def test_corrupted_image_is_detected_on_disk(tmp_path):
    path = tmp_path / "broken.jpg"
    path.write_bytes(b"not really a jpeg")
    result = validate_image_path("broken.jpg", "image/jpeg", path,
                                 path.stat().st_size)
    assert result.is_valid is False
    assert "corrupted" in (result.error or "")


def test_empty_video_is_rejected(tmp_path):
    path = tmp_path / "empty.mp4"
    path.write_bytes(b"")
    result = validate_video_path("empty.mp4", "video/mp4", path, 0)
    assert result.is_valid is False
