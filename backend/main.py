"""Backwards-compatible entrypoint.

The FastAPI application now lives in ``app/main.py`` so the documented command
``uvicorn app.main:app --reload`` works. This shim keeps the older
``uvicorn main:app`` command working for anyone with the previous instructions.
"""

from app.main import app

__all__ = ["app"]
