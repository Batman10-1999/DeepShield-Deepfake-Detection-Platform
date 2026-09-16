# DeepShield Backend

FastAPI backend powering the DeepShield deepfake detection system.
The React frontend (in this repo) talks to it at `http://localhost:8000`.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

| Method | Path             | Purpose                                              |
|--------|------------------|------------------------------------------------------|
| GET    | `/health`        | Backend + model status                               |
| POST   | `/upload/image`  | Validate + preprocess an image                       |
| POST   | `/upload/video`  | Validate + preprocess a video (metadata + frames)    |
| POST   | `/predict/image` | Full AI pipeline: preprocess -> inference -> risk    |

## Layered architecture

```
backend/
├── app/
│   ├── api/                     # FastAPI routers (HTTP layer only)
│   │   ├── health.py
│   │   ├── upload.py
│   │   └── predict_image.py
│   ├── core/                    # Config, constants, logger
│   ├── models/schemas.py        # Pydantic request/response models
│   ├── services/
│   │   ├── preprocessing/       # Image + video preprocessing
│   │   ├── ai/                  # >>> AI Engine Foundation <<<
│   │   │   ├── inference_engine.py   # Tensor -> raw probabilities
│   │   │   ├── risk_assessor.py      # Authenticity -> risk band
│   │   │   ├── prediction_service.py # End-to-end AI orchestration
│   │   │   └── response_builder.py   # Canonical JSON payload
│   │   ├── model_loader.py      # Singleton model management
│   │   └── image_service.py     # Image-specific glue
│   └── utils/                   # Validators + file helpers
├── uploads/                     # Saved uploads (gitignored)
│   └── frames/                  # Extracted video frames
├── results/                     # Reserved for later phases
├── weights/                     # Drop trained .pth files here
├── main.py                      # FastAPI entrypoint + lifespan
└── requirements.txt
```

## AI Engine Foundation

The AI layer is split into small, single-responsibility modules so every
future detector (video, audio, multi-modal fusion) can reuse the same
pipeline:

1. **ModelLoader** — process-wide singleton. The CNN is built once at
   startup and cached. Supports EfficientNet (default), ResNet, Xception.
2. **InferenceEngine** — takes a preprocessed tensor, runs a forward
   pass, returns raw `fake_probability` / `real_probability`.
3. **RiskAssessor** — maps the 0-100 authenticity score to a risk band:
   `Very Low` (≥95), `Low` (≥80), `Medium` (≥60), `High` (≥40),
   `Critical` (<40).
4. **PredictionService** — orchestrates inference + risk + response
   assembly. This is the single entry point every detection module
   should call.
5. **ResponseBuilder** — formats the canonical `PredictionResponse` JSON
   so the frontend contract stays stable.

## Logging

Every important event is logged with a stable string constant
(`app/core/constants.py :: LogEvent`) so they are easy to grep during
a project demo — `Model Loaded`, `Inference Completed`,
`Prediction Completed`, etc.
