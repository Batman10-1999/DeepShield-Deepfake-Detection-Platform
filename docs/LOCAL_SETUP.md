# DeepShield — Local Setup Guide

This guide runs the full stack locally: the React frontend and the FastAPI
detection backend.

## 1. Requirements

- Node.js 20+ (or Bun 1.1+)
- Python 3.10 – 3.13
- ~3 GB disk space (PyTorch CPU wheels)

## 2. Frontend

```bash
npm install
npm run dev
```

The app starts on <http://localhost:8080>.

If `npm install` fails with `Invalid Version`, delete the lockfile cache and
retry:

```bash
rm -rf node_modules package-lock.json
npm install
```

## 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is then on <http://localhost:8000>, with interactive docs at
<http://localhost:8000/docs> and honest model provenance at `/health`.

`uvicorn main:app` still works as a legacy alias (`backend/main.py` re-exports
the app), but `app.main:app` is the canonical entrypoint.

### Common backend errors

| Error | Cause | Fix |
| --- | --- | --- |
| `ModuleNotFoundError: No module named 'app.main'` | Command run from the repo root | `cd backend` first |
| `module 'cv2' has no attribute 'CascadeClassifier'` | OpenCV 5.x installed | `pip install "opencv-python-headless<5"` |
| `No module named 'torch'` | Torch wheel missing for your Python | `pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision` |

## 4. Connecting frontend to backend

The frontend calls the API base URL from `src/lib/api.ts`. When running the
backend elsewhere, set `VITE_API_BASE_URL` in `.env.local`.

## 5. Accounts and data

Authentication is email + password. Sign-up is instant (no email confirmation
step), and "Remember me" controls whether the session survives closing the
browser. Every analysis, history entry and certificate is scoped to the signed
in account and isolated by row-level security in the database.

## 6. Tests

```bash
cd backend && pytest -q
```
