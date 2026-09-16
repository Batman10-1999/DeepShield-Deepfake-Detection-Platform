# 🛡️ DeepShield

## AI-Powered Deepfake Detection, Verification & Digital Reputation Protection Platform

> **Verify what you see. Trust what you can prove.**

DeepShield is an AI-powered digital media verification platform designed to help identify manipulated images and videos and provide users with a structured verification report.

In a world where generative AI can create highly realistic synthetic faces and manipulated media, simply looking at an image or watching a video is no longer enough.

**DeepShield approaches the problem as a verification workflow rather than just a prediction.**

It combines deep learning inference, media preprocessing, facial analysis, explainability, metadata inspection, cryptographic hashing, confidence information, and verification certificates into a single platform.

---

# 🎯 What Problem Does DeepShield Solve?

Deepfakes can be used for:

- Identity impersonation
- Fake social-media content
- Misinformation
- Reputation damage
- Fraud and scams
- Manipulated evidence
- Unauthorized use of someone's identity

Traditional visual inspection cannot reliably determine whether modern media has been manipulated.

DeepShield provides a technical workflow for analyzing uploaded images and videos and producing a structured result.

---

# 🔍 How DeepShield Works

A typical analysis follows this pipeline:

```text
        MEDIA UPLOAD
             │
             ▼
       FILE VALIDATION
             │
             ▼
       PREPROCESSING
             │
             ▼
       FACE / FRAME ANALYSIS
             │
             ▼
       AI MODEL INFERENCE
             │
             ▼
       CONFIDENCE ANALYSIS
             │
             ▼
       EXPLAINABILITY
             │
             ▼
       VERIFICATION REPORT
             │
             ▼
      DIGITAL CERTIFICATE

The goal is not simply to display:

"Fake"

Instead, DeepShield organizes the analysis into a traceable verification process.

🧠 AI Detection Engine

DeepShield currently integrates a pretrained EfficientNet-B0 based deepfake detection model.

The model accepts processed RGB images at:

224 × 224

and produces a two-class prediction:

REAL
FAKE

The deployed checkpoint is:

backend/models/best_model-v3.pt

The model architecture and inference pipeline are implemented using PyTorch and TorchVision.

Important

The included checkpoint is an externally pretrained deepfake-detection checkpoint.

The project does not claim that the model was trained from scratch as part of this repository, and no fabricated accuracy or training results are presented.

🎥 Image & Video Analysis
Images

DeepShield can:

Validate the uploaded image
Preprocess it
Detect relevant facial regions
Run the deepfake detector
Generate the prediction
Produce analysis information
Generate a verification certificate
Videos

Video analysis extends the process by extracting representative frames and analyzing them through the detection pipeline.

The resulting analysis is aggregated to produce the final media-level result.

🔬 Explainable AI

DeepShield includes an explainability layer designed around Grad-CAM.

Instead of treating the AI model as a complete black box, the system can associate model attention with visual regions of the analyzed media.

This helps answer an important question:

"Where did the model focus when making its prediction?"

The explainability architecture is designed so that the visualization layer can consume model activation information without requiring changes to the main user interface.

🔐 Verification & Integrity

DeepShield also uses cryptographic hashing to help establish the integrity of analyzed media.

The platform uses:

SHA-256

for file hashing.

This creates a deterministic fingerprint of the analyzed file.

If the underlying file changes, its hash changes as well.

📜 Verification Certificates

After analysis, DeepShield can generate a structured verification certificate containing information associated with the analysis.

The certificate workflow is designed to make the result easier to:

Save
Review
Share
Reference later

The system also maintains analysis history for authenticated users.

👤 Authentication & History

DeepShield uses Supabase for authentication and persistent application data.

Authenticated users can access features such as:

Analysis history
Saved verification records
Certificates
Account settings
Data-related controls

The application separates authentication/configuration from the AI inference backend.

🏗️ System Architecture
                    ┌─────────────────────┐
                    │      USER           │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ React + Vite        │
                    │ Frontend             │
                    └──────────┬──────────┘
                               │
                         HTTP / API
                               │
                               ▼
                    ┌─────────────────────┐
                    │ FastAPI Backend     │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
       Preprocessing      Vision / Frames    Metadata
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ PyTorch AI Engine   │
                    │ EfficientNet-B0     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Analysis & Response │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
        Explanation       Certificate        History
                               │
                               ▼
                         Supabase
🧰 Technology Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
TanStack Router
Backend
Python
FastAPI
Uvicorn
AI / Computer Vision
PyTorch
TorchVision
EfficientNet-B0
OpenCV
Grad-CAM based explainability
Database & Authentication
Supabase
Development
Git
GitHub
VS Code
📁 Project Structure
DeepShield10/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   ├── dataset/
│   │   │   ├── evaluation/
│   │   │   ├── preprocessing/
│   │   │   ├── training/
│   │   │   ├── video/
│   │   │   └── vision/
│   │   └── utils/
│   │
│   ├── models/
│   │   └── best_model-v3.pt
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── main.py
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── integrations/
│   ├── lib/
│   └── routes/
│
├── supabase/
│   └── config.toml
│
├── docs/
├── package.json
├── package-lock.json
├── .env.example
└── README.md
⚙️ Local Setup
1. Clone the repository
git clone https://github.com/Batman10-1999/DeepShield-Deepfake-Detection-Platform.git
cd DeepShield-Deepfake-Detection-Platform
2. Frontend Setup

Install Node.js dependencies:

npm install
3. Backend Setup

Create a Python virtual environment:

Windows
python -m venv backend\venv

Activate it:

backend\venv\Scripts\activate

Install backend dependencies:

pip install -r backend\requirements.txt
4. Environment Configuration

DeepShield requires environment variables for its Supabase integration.

The repository intentionally does not contain the real .env file.

Create it from the example:

Copy-Item .env.example .env

Then open:

.env

and provide the required Supabase project configuration.

Required variables
VITE_SUPABASE_PROJECT_ID=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=

SUPABASE_PROJECT_ID=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
Security

Never commit the real .env file.

The repository's .gitignore excludes environment files containing local credentials.

5. Start the Backend

From the project root:

cd backend
uvicorn app.main:app --reload

The API will normally be available at:

http://127.0.0.1:8000

FastAPI's interactive API documentation is available at:

http://127.0.0.1:8000/docs
6. Start the Frontend

Open another terminal.

From the project root:

npm run dev

Vite will display the local frontend URL in the terminal.

Open that URL in your browser.

🔄 Development Workflow

A typical development workflow is:

Modify code
     ↓
Run frontend/backend
     ↓
Test functionality
     ↓
Review changes
     ↓
git status
     ↓
git add .
     ↓
git commit -m "Describe the change"
     ↓
git push

Git keeps the project history so previous versions can be inspected or restored when required.

🧪 Testing

Backend tests are located under:

backend/tests/

Run them with:

cd backend
pytest
📌 Current Project Scope

DeepShield currently focuses on:

Image deepfake detection
Video deepfake detection
Face/frame analysis
AI inference
Explainability
Metadata analysis
SHA-256 file hashing
Verification records
Analysis history
Digital verification certificates
User authentication

The user-facing detection result is intentionally simplified to:

REAL
FAKE
⚠️ Important Limitations

Deepfake detection is a probabilistic machine-learning task.

A model prediction should therefore not automatically be interpreted as absolute proof of authenticity or manipulation.

Performance can vary depending on:

Image quality
Compression
Resolution
Face visibility
Manipulation technique
Video frame selection
Distribution differences between training data and real-world media

The included model is a pretrained external deepfake-detection checkpoint. This repository does not claim independently reproduced training accuracy unless such evaluation has actually been performed.

🚀 Project Vision

DeepShield is designed around a simple idea:

Digital media should be verifiable, not blindly trusted.

The long-term vision is to build a practical verification layer for digital identity and media authenticity — combining AI detection with explainability, integrity information, and verifiable analysis records.

👨‍💻 Development

DeepShield is developed as an academic/final-year engineering project with a focus on:

Artificial Intelligence
Deep Learning
Computer Vision
Explainable AI
Cybersecurity
Digital Media Verification
Full-stack Application Development
📄 License

This project uses third-party open-source components and pretrained model assets.

Refer to the respective project licenses and documentation before redistributing or commercially deploying third-party components or model weights.