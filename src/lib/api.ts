// Centralized API service for the DeepShield FastAPI backend.
// Backend base URL is hardcoded — do not expose in the UI.

import axios, { AxiosError } from "axios";

export const BACKEND_URL =
  import.meta.env.localVITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 120_000,
});

/** DeepShield exposes a strictly binary verdict. */
export type PredictionLabel = "REAL" | "FAKE";
export type RiskLevel = "Very Low" | "Low" | "Medium" | "High" | "Critical" | string;

export interface PredictionResult {
  prediction: PredictionLabel;
  modelConfidence: number; // 0-100
  authenticityScore: number; // 0-100
  fakePercentage: number; // 0-100
  realPercentage: number; // 0-100
  riskLevel: RiskLevel;
  riskDescription: string;
  processingTime: number; // seconds
  inferenceTimeMs: number;
  preprocessTimeMs: number;
  modelName: string;
  weightsSource: string;
  device: string;
  timestamp: string | null;
  /** SHA-256 of the uploaded file, computed server-side during streaming. */
  sha256: string | null;
  /** Certificate identifier issued by the backend, when present. */
  certificateId: string | null;
  /** False until a verified deepfake-trained checkpoint is in use. */
  decisionValidated: boolean;
  /** Honest note about the current model provenance, straight from the API. */
  validationNote: string | null;
  explanation: string[];
  explainability: Explainability | null;
  /** Multi-face pipeline output, when the backend detected faces. */
  faceAnalysis: FaceAnalysis | null;
}

/** Bounding box of one detected face, in original-image pixels. */
export interface FaceRegionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  detectorScore: number;
}

/** Independent verdict the model produced for a single detected face. */
export interface FacePrediction {
  index: number;
  region: FaceRegionBox;
  prediction: PredictionLabel;
  confidence: number;
  fakePercentage: number;
  authenticityScore: number;
  inferenceTimeMs: number;
}

/** Everything the face pipeline produced for one image. */
export interface FaceAnalysis {
  detected: boolean;
  faceCount: number;
  detector: string | null;
  detectionTimeMs: number;
  aggregationStrategy: string | null;
  agreement: number;
  consistent: boolean;
  dominantFaceIndex: number | null;
  faces: FacePrediction[];
}

/** Region of the frame the model reacted to, in original-image pixels. */
export interface ExplainabilityRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number; // 0-1
  confidence: number; // 0-100
  areaPercentage: number; // 0-100
  label: string | null;
}

/** Live Grad-CAM output returned by the backend explainability engine. */
export interface Explainability {
  method: string;
  available: boolean;
  targetLayer: string | null;
  heatmapDataUrl: string | null;
  overlayDataUrl: string | null;
  overlayOpacity: number;
  regions: ExplainabilityRegion[];
  summary: string | null;
  mostSuspiciousRegion: string | null;
  manipulationPercentage: number;
  confidenceExplanation: string | null;
  modelExplanation: string | null;
  generationTimeMs: number;
}

interface RawFaceAnalysis {
  detected?: boolean;
  face_count?: number;
  detector?: string | null;
  detection_time_ms?: number;
  aggregation_strategy?: string | null;
  agreement?: number;
  consistent?: boolean;
  dominant_face_index?: number | null;
  faces?: Array<{
    index?: number;
    region?: { x?: number; y?: number; width?: number; height?: number; detector_score?: number };
    prediction?: string;
    confidence?: number;
    fake_percentage?: number;
    authenticity_score?: number;
    inference_time_ms?: number;
  }>;
}

interface RawRegion {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  intensity?: number;
  confidence?: number;
  area_percentage?: number;
  label?: string | null;
}

interface RawExplanation {
  method?: string;
  available?: boolean;
  target_layer?: string | null;
  heatmap_base64?: string | null;
  overlay_base64?: string | null;
  overlay_opacity?: number;
  regions?: RawRegion[];
  reasons?: string[];
  summary?: string | null;
  most_suspicious_region?: string | null;
  manipulation_percentage?: number;
  confidence_explanation?: string | null;
  model_explanation?: string | null;
  generation_time_ms?: number;
}

interface RawDecision {
  verdict?: string;
  binary_decision_validated?: boolean;
  validation_note?: string | null;
  requires_manual_review?: boolean;
  rationale?: string;
}

// Accept several common backend key spellings and normalize them.
interface RawPrediction {
  prediction?: string;
  model_confidence?: number;
  confidence?: number | string;
  authenticity_score?: number;
  fake_percentage?: number;
  risk_level?: string;
  risk_description?: string;
  processing_time?: number;
  inference_time_ms?: number;
  preprocess_time_ms?: number;
  model_name?: string;
  weights_source?: string;
  device?: string;
  timestamp?: string;
  sha256?: string | null;
  certificate_id?: string | null;
  decision?: RawDecision | null;
  metadata?: { sha256?: string | null } | null;
  explanation?: RawExplanation | string[] | string;
  face_analysis?: RawFaceAnalysis | null;
  [k: string]: unknown;
}

/**
 * Collapses any backend label onto the binary product contract.
 * The backend is already binary; this is a defensive guard so a malformed
 * or legacy payload can never surface a third prediction class in the UI.
 */
function toLabel(value: unknown): PredictionLabel {
  return String(value ?? "")
    .trim()
    .toUpperCase() === "REAL"
    ? "REAL"
    : "FAKE";
}

function toDataUrl(base64?: string | null): string | null {
  return base64 ? `data:image/png;base64,${base64}` : null;
}

function normalizeExplanation(raw: RawExplanation): Explainability {
  return {
    method: (raw.method ?? "heuristic").toString(),
    available: Boolean(raw.available),
    targetLayer: raw.target_layer ?? null,
    heatmapDataUrl: toDataUrl(raw.heatmap_base64),
    overlayDataUrl: toDataUrl(raw.overlay_base64),
    overlayOpacity: Number(raw.overlay_opacity ?? 0.45),
    regions: (raw.regions ?? []).map((r) => ({
      x: Number(r.x ?? 0),
      y: Number(r.y ?? 0),
      width: Number(r.width ?? 0),
      height: Number(r.height ?? 0),
      intensity: Number(r.intensity ?? 0),
      confidence: Number(r.confidence ?? 0),
      areaPercentage: Number(r.area_percentage ?? 0),
      label: r.label ?? null,
    })),
    summary: raw.summary ?? null,
    mostSuspiciousRegion: raw.most_suspicious_region ?? null,
    manipulationPercentage: Number(raw.manipulation_percentage ?? 0),
    confidenceExplanation: raw.confidence_explanation ?? null,
    modelExplanation: raw.model_explanation ?? null,
    generationTimeMs: Number(raw.generation_time_ms ?? 0),
  };
}

function normalizeFaceAnalysis(raw?: RawFaceAnalysis | null): FaceAnalysis | null {
  if (!raw) return null;
  const faces = (raw.faces ?? []).map((f, i) => ({
    index: Number(f.index ?? i),
    region: {
      x: Number(f.region?.x ?? 0),
      y: Number(f.region?.y ?? 0),
      width: Number(f.region?.width ?? 0),
      height: Number(f.region?.height ?? 0),
      detectorScore: Number(f.region?.detector_score ?? 1),
    },
    prediction: toLabel(f.prediction),
    confidence: Number(f.confidence ?? 0),
    fakePercentage: Number(f.fake_percentage ?? 0),
    authenticityScore: Number(f.authenticity_score ?? 0),
    inferenceTimeMs: Number(f.inference_time_ms ?? 0),
  }));
  return {
    detected: Boolean(raw.detected ?? faces.length > 0),
    faceCount: Number(raw.face_count ?? faces.length),
    detector: raw.detector ?? null,
    detectionTimeMs: Number(raw.detection_time_ms ?? 0),
    aggregationStrategy: raw.aggregation_strategy ?? null,
    agreement: Number(raw.agreement ?? 100),
    consistent: raw.consistent ?? true,
    dominantFaceIndex: raw.dominant_face_index ?? null,
    faces,
  };
}

function normalize(raw: RawPrediction): PredictionResult {
  const rawExplanation = raw.explanation;
  const explainability =
    rawExplanation && !Array.isArray(rawExplanation) && typeof rawExplanation === "object"
      ? normalizeExplanation(rawExplanation)
      : null;

  const explanation = Array.isArray(rawExplanation)
    ? rawExplanation
    : typeof rawExplanation === "string"
      ? rawExplanation.split(/\n+/).filter(Boolean)
      : (rawExplanation?.reasons ?? []);

  const modelConfidence =
    typeof raw.model_confidence === "number"
      ? raw.model_confidence
      : typeof raw.confidence === "number"
        ? raw.confidence
        : 0;

  const fakePct = Number(raw.fake_percentage ?? 0) || 0;

  return {
    prediction: toLabel(raw.prediction),
    modelConfidence: Number(modelConfidence) || 0,
    authenticityScore: Number(raw.authenticity_score ?? 0),
    fakePercentage: fakePct,
    realPercentage: Math.max(0, Math.min(100, 100 - fakePct)),
    riskLevel: (raw.risk_level ?? "Medium").toString(),
    riskDescription: (raw.risk_description ?? "").toString(),
    processingTime: Number(raw.processing_time ?? 0),
    inferenceTimeMs: Number(raw.inference_time_ms ?? 0),
    preprocessTimeMs: Number(raw.preprocess_time_ms ?? 0),
    modelName: (raw.model_name ?? "EfficientNet-B0").toString(),
    weightsSource: (raw.weights_source ?? "pretrained").toString(),
    device: (raw.device ?? "cpu").toString(),
    timestamp: raw.timestamp ?? null,
    sha256: raw.sha256 ?? raw.metadata?.sha256 ?? null,
    certificateId: raw.certificate_id ?? null,
    decisionValidated: Boolean(raw.decision?.binary_decision_validated),
    validationNote: raw.decision?.validation_note ?? null,
    explanation,
    explainability,
    faceAnalysis: normalizeFaceAnalysis(raw.face_analysis),
  };
}

/** Human-readable messages for the error codes the backend can return. */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  FILE_TOO_LARGE: "That file is larger than the 200 MB limit. Please upload a smaller file.",
  UNSUPPORTED_MEDIA: "That file type is not supported. Upload a JPG, PNG, MP4, MOV or AVI file.",
  INVALID_IMAGE: "The image could not be read — it may be corrupted or incomplete.",
  INVALID_VIDEO: "The video could not be read — it may be corrupted or use an unsupported codec.",
  NO_FACE_DETECTED: "No face was detected in this media, so DeepShield cannot analyse it.",
  FACE_DETECTION_ERROR: "The face detector is unavailable on the server right now.",
  MODEL_NOT_LOADED: "The detection model is not loaded on the server yet. Try again in a moment.",
  INFERENCE_ERROR: "The model failed while analysing this file. Please try another file.",
};

/** Maps transport/HTTP failures onto messages a normal user can act on. */
function friendlyStatusMessage(status: number, fallback: string): string {
  if (status === 413) return ERROR_CODE_MESSAGES["FILE_TOO_LARGE"]!;
  if (status === 415) return ERROR_CODE_MESSAGES["UNSUPPORTED_MEDIA"]!;
  if (status === 422)
    return "DeepShield could not analyse this file. Check that it is a valid, uncorrupted image or video.";
  if (status === 503)
    return "The detection service is temporarily unavailable. Please try again shortly.";
  if (status >= 500)
    return "The DeepShield server hit an unexpected error while analysing this file.";
  return fallback;
}

function toError(e: unknown, fallback: string): Error {
  if (axios.isAxiosError(e)) {
    const ax = e as AxiosError<{ detail?: string; message?: string; error_code?: string }>;
    if (ax.code === "ERR_NETWORK") {
      return new Error(
        "Could not reach the DeepShield backend. Make sure the FastAPI server is running, then try again.",
      );
    }
    if (ax.code === "ECONNABORTED") {
      return new Error("The analysis timed out. Try a shorter video or a smaller file.");
    }
    const data = ax.response?.data;
    const code = data?.error_code;
    if (code && ERROR_CODE_MESSAGES[code]) return new Error(ERROR_CODE_MESSAGES[code]);

    const detail = data?.detail || data?.message;
    const status = ax.response?.status ?? 0;
    // Never surface raw tracebacks or internal paths to the user.
    const safeDetail =
      typeof detail === "string" && detail.length <= 200 && !detail.includes("Traceback")
        ? detail
        : null;
    return new Error(safeDetail || friendlyStatusMessage(status, fallback));
  }
  return new Error(e instanceof Error ? e.message : fallback);
}

async function postFile(endpoint: string, file: File): Promise<PredictionResult> {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await api.post<RawPrediction>(endpoint, form);
    return normalize(data);
  } catch (e) {
    throw toError(e, "Prediction failed");
  }
}

export const uploadImage = (file: File) => postFile("/predict/image", file);
export const uploadVideo = (file: File) => postFile("/predict/video", file);

export interface BackendHealth {
  online: boolean;
  status?: string;
  modelLoaded?: boolean;
  modelName?: string;
  device?: string;
  weightsSource?: string;
  deepfakeTrained?: boolean;
  provenanceNote?: string;
}

/** Reads /health and surfaces the honest model-provenance block. */
export async function fetchHealth(): Promise<BackendHealth> {
  type Loose = Record<string, unknown>;
  const str = (...vals: unknown[]) => vals.find((v) => typeof v === "string") as string | undefined;
  const bool = (...vals: unknown[]) =>
    vals.find((v) => typeof v === "boolean") as boolean | undefined;
  try {
    const { data } = await api.get<Loose>("/health", { timeout: 6_000 });
    const prov = (data?.["provenance"] ?? data?.["model_provenance"] ?? {}) as Loose;
    const model = (data?.["model"] ?? {}) as Loose;
    return {
      online: true,
      status: str(data?.["status"]),
      modelLoaded: Boolean(data?.["model_loaded"] ?? model["loaded"] ?? prov["loaded"]),
      modelName: str(prov["model_name"], model["name"], data?.["model_name"]),
      device: str(prov["device"], model["device"], data?.["device"]),
      weightsSource: str(prov["weights_source"], model["weights_source"]),
      deepfakeTrained: bool(prov["deepfake_trained"], prov["is_deepfake_trained"]),
      provenanceNote: str(prov["note"], prov["validation_note"]),
    };
  } catch {
    return { online: false };
  }
}
