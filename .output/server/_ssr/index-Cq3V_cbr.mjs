import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { S as SectionCard } from "./SectionCard-C9B8xn4y.mjs";
import { a as axios } from "../_libs/axios.mjs";
import { C as CertificateCard, E as EmptyState } from "./CertificateCard-B0ojZzQd.mjs";
import { b as useAnalysisHistory, c as useCurrentAnalysis, d as analysisStore, e as buildAnalysisEntry } from "./router-BhrJ7AGX.mjs";
import "../_libs/qrcode.mjs";
import "../_libs/jspdf.mjs";
import { g as Upload, B as Brain, h as CircleCheck, I as Image$1, i as Flame, S as ShieldCheck, j as Eraser, k as Images, O as OctagonAlert, G as Gauge, b as LoaderCircle, l as CloudUpload, m as FolderOpen, n as FilePlay, o as FileImage, p as CircleX, q as Info, r as FileText, s as FileTypeCorner, t as Cpu, u as Clock, v as Calendar, w as ImageOff, x as Cog, F as FileCheckCorner, y as ChevronRight, z as Check, A as Users, T as TriangleAlert } from "../_libs/lucide-react.mjs";

import "../_libs/form-data.mjs";






import "../_libs/combined-stream.mjs";


import "../_libs/delayed-stream.mjs";

import "../_libs/mime-types.mjs";
import "../_libs/mime-db.mjs";
import "../_libs/asynckit.mjs";

import "../_libs/es-set-tostringtag.mjs";
import "../_libs/get-intrinsic.mjs";
import "../_libs/es-object-atoms.mjs";
import "../_libs/es-errors.mjs";
import "../_libs/math-intrinsics.mjs";
import "../_libs/gopd.mjs";
import "../_libs/es-define-property.mjs";
import "../_libs/has-symbols.mjs";
import "../_libs/get-proto.mjs";
import "../_libs/dunder-proto.mjs";
import "../_libs/call-bind-apply-helpers.mjs";
import "../_libs/function-bind.mjs";
import "../_libs/hasown.mjs";
import "../_libs/has-tostringtag.mjs";
import "../_libs/unenv.mjs";
import "../_libs/proxy-from-env.mjs";
import "../_libs/https-proxy-agent.mjs";



import "../_libs/debug.mjs";
import "../_libs/ms.mjs";
import "../_libs/supports-color.mjs";

import "../_libs/has-flag.mjs";
import "../_libs/agent-base.mjs";


import "../_libs/follow-redirects.mjs";

import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";

import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "./deepshield-logo-BbcsavlP.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/tslib.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/zod.mjs";
import "../_libs/dijkstrajs.mjs";
import "../_libs/pngjs.mjs";
import "../_libs/babel__runtime.mjs";
import "../_libs/fflate.mjs";
import "../_libs/fast-png.mjs";
import "../_libs/iobuffer.mjs";
import "../_libs/pako.mjs";
function StatsCards({ total, real, fake, avgConfidence }) {
  const pct = (n) => total > 0 ? (n / total * 100).toFixed(2) : "0.00";
  const stats = [
    {
      icon: Images,
      title: "Analyses Performed",
      value: String(total),
      sub: "Total Files Analyzed",
      tint: "bg-muted",
      iconColor: "text-muted-foreground"
    },
    {
      icon: ShieldCheck,
      title: "Real Content",
      value: String(real),
      sub: `${pct(real)}% Real Files`,
      tint: "bg-foreground/10",
      iconColor: "text-foreground"
    },
    {
      icon: OctagonAlert,
      title: "Fake Content",
      value: String(fake),
      sub: `${pct(fake)}% Fake Files`,
      tint: "bg-muted",
      iconColor: "text-muted-foreground"
    },
    {
      icon: Gauge,
      title: "Average Confidence",
      value: `${avgConfidence.toFixed(2)}%`,
      sub: "Across All Analyses",
      tint: "bg-muted",
      iconColor: "text-muted-foreground"
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6", children: stats.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "surface-card flex items-center gap-3.5 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `h-12 w-12 rounded-xl ${s.tint} flex items-center justify-center shrink-0`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(s.icon, { className: `h-6 w-6 ${s.iconColor}` })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-medium text-muted-foreground", children: s.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-foreground leading-tight", children: s.value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground truncate", children: s.sub })
    ] })
  ] }, s.title)) });
}
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];
const VIDEO_EXTENSIONS = [".mp4", ".avi", ".mov"];
const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  // .mov
  "video/x-msvideo",
  // .avi
  "video/avi"
];
const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 200;
const extOf = (name) => {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
};
const base = (file) => ({
  filename: file.name,
  sizeBytes: file.size,
  extension: extOf(file.name),
  mimeType: file.type
});
function detectMediaKind(file) {
  const ext = extOf(file.name);
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "unknown";
}
function validateImage(file) {
  const b = base(file);
  if (file.size === 0)
    return { ...b, mediaKind: "image", isValid: false, error: "Uploaded file is empty." };
  if (!IMAGE_EXTENSIONS.includes(b.extension))
    return {
      ...b,
      mediaKind: "image",
      isValid: false,
      error: `Unsupported image extension "${b.extension || "none"}". Allowed: JPG, JPEG, PNG.`
    };
  if (file.type && !IMAGE_MIME_TYPES.includes(file.type))
    return {
      ...b,
      mediaKind: "image",
      isValid: false,
      error: `Unsupported MIME type "${file.type}".`
    };
  if (file.size / (1024 * 1024) > MAX_IMAGE_SIZE_MB)
    return {
      ...b,
      mediaKind: "image",
      isValid: false,
      error: `Image exceeds ${MAX_IMAGE_SIZE_MB} MB limit.`
    };
  return { ...b, mediaKind: "image", isValid: true };
}
function validateVideo(file) {
  const b = base(file);
  if (file.size === 0)
    return { ...b, mediaKind: "video", isValid: false, error: "Uploaded file is empty." };
  if (!VIDEO_EXTENSIONS.includes(b.extension))
    return {
      ...b,
      mediaKind: "video",
      isValid: false,
      error: `Unsupported video extension "${b.extension || "none"}". Allowed: MP4, AVI, MOV.`
    };
  if (file.type && !VIDEO_MIME_TYPES.includes(file.type))
    return {
      ...b,
      mediaKind: "video",
      isValid: false,
      error: `Unsupported MIME type "${file.type}".`
    };
  if (file.size / (1024 * 1024) > MAX_VIDEO_SIZE_MB)
    return {
      ...b,
      mediaKind: "video",
      isValid: false,
      error: `Video exceeds ${MAX_VIDEO_SIZE_MB} MB limit.`
    };
  return { ...b, mediaKind: "video", isValid: true };
}
function validateMedia(file) {
  if (!file || !file.name) {
    return {
      isValid: false,
      mediaKind: "unknown",
      filename: "",
      sizeBytes: 0,
      extension: "",
      mimeType: "",
      error: "No file provided."
    };
  }
  const kind = detectMediaKind(file);
  if (kind === "image") return validateImage(file);
  if (kind === "video") return validateVideo(file);
  return {
    ...base(file),
    mediaKind: "unknown",
    isValid: false,
    error: "Unsupported file. Upload JPG, PNG, MP4, AVI, or MOV."
  };
}
function fileSignature(file) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}
const ACCEPT = [
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo"
].join(",");
function UploadCard({ onAnalyze, isAnalyzing }) {
  const inputRef = reactExports.useRef(null);
  const [file, setFile] = reactExports.useState(null);
  const [lastProcessed, setLastProcessed] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [drag, setDrag] = reactExports.useState(false);
  const handleFile = (f) => {
    if (!f) return;
    if (isAnalyzing) {
      setError("A file is already being processed. Please wait.");
      return;
    }
    const result = validateMedia(f);
    if (!result.isValid) {
      setError(result.error ?? "Invalid file.");
      setFile(null);
      return;
    }
    const signature = fileSignature(f);
    if (signature === lastProcessed) {
      setError("This exact file has already been processed. Choose a different file.");
      return;
    }
    setError(null);
    setFile(f);
    setLastProcessed(signature);
    onAnalyze(f);
  };
  const kind = file ? detectMediaKind(file) : "unknown";
  const Icon = kind === "video" ? FilePlay : FileImage;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-3 -mt-2", children: "Upload an image or video file for deepfake analysis" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        onDragOver: (e) => {
          e.preventDefault();
          setDrag(true);
        },
        onDragLeave: () => setDrag(false),
        onDrop: (e) => {
          e.preventDefault();
          setDrag(false);
          handleFile(e.dataTransfer.files?.[0]);
        },
        onClick: () => !isAnalyzing && inputRef.current?.click(),
        className: `cursor-pointer rounded-2xl border-2 border-dashed py-10 px-6 text-center transition-colors ${drag ? "border-primary bg-accent/60" : "border-border bg-secondary/40 hover:border-primary/60 hover:bg-accent/30"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto h-14 w-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-3 shadow-sm", children: isAnalyzing ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 text-primary animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "h-7 w-7 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-foreground", children: "Drag & Drop your file here" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground my-2", children: "or" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: (e) => {
                e.stopPropagation();
                inputRef.current?.click();
              },
              disabled: isAnalyzing,
              className: "inline-flex items-center gap-2 rounded-xl bg-[var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all disabled:opacity-60",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "h-4 w-4" }),
                " Browse Files"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: inputRef,
              type: "file",
              accept: ACCEPT,
              className: "hidden",
              onChange: (e) => {
                handleFile(e.target.files?.[0]);
                if (inputRef.current) inputRef.current.value = "";
              }
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between text-[11px] text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Supported Formats: JPG, JPEG, PNG, MP4, AVI, MOV" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "Max File Size: ",
        MAX_VIDEO_SIZE_MB,
        "MB"
      ] })
    ] }),
    file && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-3 rounded-xl bg-secondary px-3 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-primary shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs text-foreground", children: file.name })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive", children: error })
  ] });
}
const BACKEND_URL = "https://deepshield-deepfake-detection-platform.onrender.com";
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 12e4
});
function toLabel(value) {
  return String(value ?? "").trim().toUpperCase() === "REAL" ? "REAL" : "FAKE";
}
function toDataUrl(base64) {
  return base64 ? `data:image/png;base64,${base64}` : null;
}
function normalizeExplanation(raw) {
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
      label: r.label ?? null
    })),
    summary: raw.summary ?? null,
    mostSuspiciousRegion: raw.most_suspicious_region ?? null,
    manipulationPercentage: Number(raw.manipulation_percentage ?? 0),
    confidenceExplanation: raw.confidence_explanation ?? null,
    modelExplanation: raw.model_explanation ?? null,
    generationTimeMs: Number(raw.generation_time_ms ?? 0)
  };
}
function normalizeFaceAnalysis(raw) {
  if (!raw) return null;
  const faces = (raw.faces ?? []).map((f, i) => ({
    index: Number(f.index ?? i),
    region: {
      x: Number(f.region?.x ?? 0),
      y: Number(f.region?.y ?? 0),
      width: Number(f.region?.width ?? 0),
      height: Number(f.region?.height ?? 0),
      detectorScore: Number(f.region?.detector_score ?? 1)
    },
    prediction: toLabel(f.prediction),
    confidence: Number(f.confidence ?? 0),
    fakePercentage: Number(f.fake_percentage ?? 0),
    authenticityScore: Number(f.authenticity_score ?? 0),
    inferenceTimeMs: Number(f.inference_time_ms ?? 0)
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
    faces
  };
}
function normalize(raw) {
  const rawExplanation = raw.explanation;
  const explainability = rawExplanation && !Array.isArray(rawExplanation) && typeof rawExplanation === "object" ? normalizeExplanation(rawExplanation) : null;
  const explanation = Array.isArray(rawExplanation) ? rawExplanation : typeof rawExplanation === "string" ? rawExplanation.split(/\n+/).filter(Boolean) : rawExplanation?.reasons ?? [];
  const modelConfidence = typeof raw.model_confidence === "number" ? raw.model_confidence : typeof raw.confidence === "number" ? raw.confidence : 0;
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
    faceAnalysis: normalizeFaceAnalysis(raw.face_analysis)
  };
}
const ERROR_CODE_MESSAGES = {
  FILE_TOO_LARGE: "That file is larger than the 200 MB limit. Please upload a smaller file.",
  UNSUPPORTED_MEDIA: "That file type is not supported. Upload a JPG, PNG, MP4, MOV or AVI file.",
  INVALID_IMAGE: "The image could not be read — it may be corrupted or incomplete.",
  INVALID_VIDEO: "The video could not be read — it may be corrupted or use an unsupported codec.",
  NO_FACE_DETECTED: "No face was detected in this media, so DeepShield cannot analyse it.",
  FACE_DETECTION_ERROR: "The face detector is unavailable on the server right now.",
  MODEL_NOT_LOADED: "The detection model is not loaded on the server yet. Try again in a moment.",
  INFERENCE_ERROR: "The model failed while analysing this file. Please try another file."
};
function friendlyStatusMessage(status, fallback) {
  if (status === 413) return ERROR_CODE_MESSAGES["FILE_TOO_LARGE"];
  if (status === 415) return ERROR_CODE_MESSAGES["UNSUPPORTED_MEDIA"];
  if (status === 422)
    return "DeepShield could not analyse this file. Check that it is a valid, uncorrupted image or video.";
  if (status === 503)
    return "The detection service is temporarily unavailable. Please try again shortly.";
  if (status >= 500)
    return "The DeepShield server hit an unexpected error while analysing this file.";
  return fallback;
}
function toError(e, fallback) {
  if (axios.isAxiosError(e)) {
    const ax = e;
    if (ax.code === "ERR_NETWORK") {
      return new Error(
        "Could not reach the DeepShield backend. Make sure the FastAPI server is running, then try again."
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
    const safeDetail = typeof detail === "string" && detail.length <= 200 && !detail.includes("Traceback") ? detail : null;
    return new Error(safeDetail || friendlyStatusMessage(status, fallback));
  }
  return new Error(e instanceof Error ? e.message : fallback);
}
async function postFile(endpoint, file) {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await api.post(endpoint, form);
    return normalize(data);
  } catch (e) {
    throw toError(e, "Prediction failed");
  }
}
const uploadImage = (file) => postFile("/predict/image", file);
const uploadVideo = (file) => postFile("/predict/video", file);
const PIPELINE_STAGES = [
  { id: "uploading", label: "Uploading..." },
  { id: "validating", label: "Validating..." },
  { id: "preprocessing", label: "Preprocessing..." },
  { id: "loading_model", label: "Loading AI Model..." },
  { id: "inference", label: "Running Inference..." },
  { id: "confidence", label: "Calculating Confidence..." },
  { id: "report", label: "Generating Report..." },
  { id: "complete", label: "Analysis Complete" }
];
function mediaKindFor(file) {
  const kind = detectMediaKind(file);
  if (kind === "image") return "image";
  if (kind === "video") return "video";
  return null;
}
function isNetworkError(err) {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("network") || msg.includes("could not reach") || msg.includes("failed to fetch") || msg.includes("econnrefused");
}
async function callBackend(file, kind) {
  switch (kind) {
    case "image":
      return uploadImage(file);
    case "video":
      return uploadVideo(file);
  }
}
async function analyzeFile(file, kind, opts = {}) {
  const notify = (s) => opts.onStage?.(s);
  const pre = ["uploading", "validating", "preprocessing"];
  for (const s of pre) {
    notify(s);
    await sleep(220);
  }
  notify("loading_model");
  await sleep(180);
  notify("inference");
  try {
    const result = await callBackend(file, kind);
    notify("confidence");
    await sleep(180);
    notify("report");
    await sleep(160);
    notify("complete");
    return result;
  } catch (err) {
    if (isNetworkError(err)) {
      notify("complete");
      return null;
    }
    throw err;
  }
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function AnalysisProgress({ stage }) {
  const activeIndex = stage ? PIPELINE_STAGES.findIndex((s) => s.id === stage) : -1;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5 animate-fade-in-up", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-semibold", children: "Analysis Pipeline" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: PIPELINE_STAGES.map((s, i) => {
      const done = i < activeIndex || stage === "complete";
      const active = i === activeIndex && stage !== "complete";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "li",
        {
          className: `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs border transition-colors ${done ? "border-foreground/40 bg-foreground/10 text-foreground" : active ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-secondary/40 text-muted-foreground"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-5 w-5 rounded-full flex items-center justify-center shrink-0", children: done ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5 text-foreground" }) : active ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-muted-foreground/40" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: s.label })
          ]
        },
        s.id
      );
    }) })
  ] });
}
function toneFor(prediction) {
  const p = prediction.toUpperCase();
  if (p === "REAL") return { text: "text-foreground", bar: "bg-foreground", Icon: CircleCheck };
  if (p === "FAKE")
    return { text: "text-muted-foreground", bar: "bg-muted-foreground", Icon: CircleX };
  return { text: "text-muted-foreground", bar: "bg-muted-foreground", Icon: TriangleAlert };
}
function MultiFaceBreakdown({ faceAnalysis }) {
  if (!faceAnalysis?.detected || faceAnalysis.faces.length < 2) return null;
  const {
    faces,
    faceCount,
    agreement,
    consistent,
    dominantFaceIndex,
    aggregationStrategy,
    detector
  } = faceAnalysis;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-secondary/40 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4 shrink-0 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate text-xs font-semibold tracking-tight text-foreground", children: [
          faceCount,
          " faces analysed independently"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "span",
        {
          className: `shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${consistent ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"}`,
          children: [
            consistent ? "Consistent" : "Conflicting",
            " · ",
            agreement.toFixed(0),
            "% agreement"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-2 sm:grid-cols-2", children: faces.map((face) => {
      const tone = toneFor(face.prediction);
      const dominant = dominantFaceIndex === face.index;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `rounded-xl border bg-card px-3 py-2.5 ${dominant ? "border-primary/40" : "border-border"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(tone.Icon, { className: `h-3.5 w-3.5 shrink-0 ${tone.text}` }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `truncate text-xs font-bold ${tone.text}`, children: [
                  "Face ",
                  face.index + 1,
                  " · ",
                  face.prediction
                ] })
              ] }),
              dominant && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary", children: "Dominant" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `h-full rounded-full ${tone.bar}`,
                style: { width: `${face.confidence}%` }
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                face.confidence.toFixed(1),
                "% confidence"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                face.authenticityScore.toFixed(0),
                "/100 authentic"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[10px] text-muted-foreground", children: [
              "Region ",
              face.region.width,
              "×",
              face.region.height,
              "px at (",
              face.region.x,
              ",",
              " ",
              face.region.y,
              ")"
            ] })
          ]
        },
        face.index
      );
    }) }),
    (aggregationStrategy || detector) && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-[10px] leading-relaxed text-muted-foreground", children: [
      detector && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "Detector: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground/80", children: detector }),
        ".",
        " "
      ] }),
      aggregationStrategy && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "Verdict aggregated with",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground/80", children: aggregationStrategy }),
        "."
      ] })
    ] })
  ] });
}
function AnalysisCard({
  result,
  isAnalyzing,
  fileName,
  fileType,
  analyzedAt,
  stage = null
}) {
  const [animatedRing, setAnimatedRing] = reactExports.useState(0);
  const [animatedScore, setAnimatedScore] = reactExports.useState(0);
  reactExports.useEffect(() => {
    if (!result) {
      setAnimatedRing(0);
      setAnimatedScore(0);
      return;
    }
    const id = requestAnimationFrame(() => {
      setAnimatedRing(result.modelConfidence);
      setAnimatedScore(result.authenticityScore);
    });
    return () => cancelAnimationFrame(id);
  }, [result]);
  if (!result && !isAnalyzing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      EmptyState,
      {
        icon: Brain,
        title: "Awaiting analysis",
        description: "Upload media to view the AI prediction, model confidence, risk level and authenticity score."
      }
    );
  }
  if (isAnalyzing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AnalysisProgress, { stage });
  }
  const isReal = result.prediction.toUpperCase() === "REAL";
  const verdict = isReal ? {
    color: "text-foreground",
    label: "REAL",
    message: "The media is likely to be authentic.",
    ring: "stroke-foreground",
    bar: "bg-foreground",
    riskBg: "bg-foreground/10",
    riskText: "text-foreground",
    Icon: CircleCheck
  } : {
    color: "text-muted-foreground",
    label: "FAKE",
    message: "The media is likely manipulated.",
    ring: "stroke-muted-foreground",
    bar: "bg-muted-foreground",
    riskBg: "bg-muted",
    riskText: "text-muted-foreground",
    Icon: CircleX
  };
  const R = 42;
  const C = 2 * Math.PI * R;
  const ringOffset = C - animatedRing / 100 * C;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col justify-between gap-6 animate-fade-in-up", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label", children: "Prediction" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `mt-2 text-[2.75rem] font-extrabold leading-none tracking-tight ${verdict.color}`,
            children: verdict.label
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-xs leading-relaxed text-muted-foreground", children: verdict.message }),
        result.riskDescription && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-[11px] leading-relaxed text-muted-foreground/80", children: result.riskDescription })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "justify-self-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-[128px] w-[128px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 100 100", className: "h-full w-full -rotate-90", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "50", cy: "50", r: R, className: "fill-none stroke-muted", strokeWidth: "8" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "circle",
            {
              cx: "50",
              cy: "50",
              r: R,
              className: `fill-none ${verdict.ring} transition-all duration-1000 ease-out`,
              strokeWidth: "8",
              strokeLinecap: "round",
              strokeDasharray: C,
              strokeDashoffset: ringOffset
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: `text-[1.35rem] font-bold leading-none tracking-tight ${verdict.color}`,
              children: [
                result.modelConfidence.toFixed(1),
                "%"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label mt-1.5", children: "Confidence" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label", children: "Authenticity Score" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-2xl font-bold leading-none tracking-tight text-foreground", children: [
          result.authenticityScore.toFixed(2),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "/ 100" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `h-full rounded-full ${verdict.bar} transition-all duration-1000 ease-out`,
            style: { width: `${animatedScore}%` }
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label mt-4", children: "Risk Level" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: `mt-1.5 inline-flex items-center gap-1.5 rounded-full ${verdict.riskBg} ${verdict.riskText} px-3 py-1 text-xs font-semibold`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(verdict.Icon, { className: "h-3.5 w-3.5" }),
              result.riskLevel
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label mb-2.5", children: "Probabilities" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Probability,
          {
            label: "Fake probability",
            value: result.fakePercentage,
            bar: "bg-muted-foreground"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Probability,
          {
            label: "Real probability",
            value: result.realPercentage,
            bar: "bg-foreground"
          }
        )
      ] })
    ] }),
    !result.decisionValidated && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: result.validationNote ?? "The active checkpoint is not a verified deepfake-trained model, so this verdict is not scientifically validated." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MultiFaceBreakdown, { faceAnalysis: result.faceAnalysis }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label mb-2.5", children: "Media & Pipeline Metadata" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Meta, { icon: FileText, label: "File Name", value: fileName ?? "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Meta, { icon: FileTypeCorner, label: "File Type", value: fileType ?? "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Meta, { icon: Cpu, label: "AI Model", value: result.modelName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Meta,
          {
            icon: Clock,
            label: "Processed In",
            value: `${result.processingTime.toFixed(2)} sec`
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Meta,
          {
            icon: Calendar,
            label: "Analyzed On",
            value: analyzedAt ? analyzedAt.toLocaleString(void 0, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            }) : "—"
          }
        )
      ] })
    ] })
  ] });
}
function Probability({ label, value, bar }) {
  const pct = Math.max(0, Math.min(100, value));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-secondary/50 px-3 py-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "section-label", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold tabular-nums text-foreground", children: [
        pct.toFixed(2),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `h-full rounded-full ${bar} transition-all duration-700 ease-out`,
        style: { width: `${pct}%` }
      }
    ) })
  ] });
}
function Meta({
  icon: Icon,
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-secondary/50 px-3 py-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 shrink-0 text-primary/80" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "mt-1 truncate text-xs font-semibold tracking-tight text-foreground",
          title: value,
          children: value
        }
      )
    ] })
  ] });
}
function OriginalMediaCard({ previewDataUrl }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-[220px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40", children: previewDataUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
    "img",
    {
      src: previewDataUrl,
      alt: "Original media preview",
      className: "h-full w-full object-contain"
    }
  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center px-6 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ImageOff, { className: "mb-3 h-7 w-7 text-muted-foreground/50" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground/70", children: "No media uploaded yet" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Your uploaded file preview will appear here." })
  ] }) });
}
function ExplainabilityCard({ result, isAnalyzing }) {
  const hasResult = !!result && !isAnalyzing;
  const explainability = hasResult ? result.explainability : null;
  const overlayUrl = explainability?.overlayDataUrl ?? explainability?.heatmapDataUrl ?? null;
  if (!overlayUrl) {
    const description = isAnalyzing ? "Grad-CAM activation regions appear here once the analysis completes." : hasResult ? "The active model produced no Grad-CAM map for this file, so no visual explanation is available." : "Grad-CAM explanation will appear after a successful analysis.";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      EmptyState,
      {
        icon: Flame,
        minHeight: "min-h-[260px]",
        title: isAnalyzing ? "Generating heatmap…" : hasResult ? "No Grad-CAM available" : "No heatmap yet",
        description
      }
    );
  }
  const method = explainability?.method ?? "heuristic";
  const manipulation = explainability?.manipulationPercentage ?? 0;
  const faceCount = result?.faceAnalysis?.faceCount ?? null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex min-h-[240px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border bg-[oklch(0.16_0.02_258)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 z-10 rounded-2xl shadow-[inset_0_0_60px_-20px_rgba(0,0,0,0.9)]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: overlayUrl,
          alt: "Grad-CAM activation overlay highlighting the regions that influenced the model",
          className: "max-h-[340px] max-w-full object-contain"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-3 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm", children: method === "grad_cam" || method === "gradcam" ? "Grad-CAM" : method.replace(/_/g, " ") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-semibold uppercase tracking-wider text-white/70", children: "Low" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 flex-1 rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#facc15] to-[#ef4444]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-semibold uppercase tracking-wider text-white/70", children: "High" })
      ] })
    ] }),
    explainability?.available && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `grid grid-cols-2 gap-2.5 ${faceCount !== null ? "sm:grid-cols-4" : "sm:grid-cols-3"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Manipulation", value: `${manipulation.toFixed(1)}%` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Faces Detected", value: faceCount === null ? "—" : `${faceCount}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Regions", value: `${explainability.regions.length}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Focus", value: explainability.mostSuspiciousRegion ?? "—" })
          ]
        }
      ),
      explainability.summary && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-muted-foreground", children: explainability.summary }),
      explainability.regions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label mb-2", children: "Activated Regions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: explainability.regions.map((region, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: "rounded-lg border border-border bg-secondary/60 px-2 py-1 text-[10px] font-medium text-foreground/75",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary", children: [
                "#",
                index + 1
              ] }),
              " ",
              region.width,
              "×",
              region.height,
              "px · ",
              region.confidence.toFixed(0),
              "% ·",
              " ",
              region.areaPercentage.toFixed(1),
              "% area"
            ]
          },
          `${region.label ?? "region"}-${index}`
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-center text-[11px] leading-relaxed text-muted-foreground", children: "Warmer areas mark the pixels that influenced the model’s decision the most." })
  ] });
}
function Stat({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 rounded-xl border border-border bg-secondary/50 px-3 py-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "mt-1 truncate text-xs font-semibold tracking-tight text-foreground",
        title: value,
        children: value
      }
    )
  ] });
}
const stages = [
  {
    icon: Upload,
    title: "Upload",
    sub: "Media uploaded",
    color: "text-muted-foreground",
    bg: "bg-muted"
  },
  {
    icon: Cog,
    title: "Preprocessing",
    sub: "Data prepared",
    color: "text-foreground",
    bg: "bg-foreground/10"
  },
  {
    icon: Brain,
    title: "AI Analysis",
    sub: "Deep learning model",
    color: "text-muted-foreground",
    bg: "bg-muted"
  },
  {
    icon: CircleCheck,
    title: "Results",
    sub: "Prediction generated",
    color: "text-muted-foreground",
    bg: "bg-muted"
  },
  {
    icon: FileCheckCorner,
    title: "Certificate",
    sub: "Verification ready",
    color: "text-muted-foreground",
    bg: "bg-muted"
  }
];
function WorkflowStrip() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "surface-card mt-5 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center justify-between gap-y-4", children: stages.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-[150px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-10 w-10 rounded-full ${s.bg} flex items-center justify-center`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(s.icon, { className: `h-5 w-5 ${s.color}` }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "leading-tight", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold text-foreground", children: s.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: s.sub })
      ] })
    ] }),
    i < stages.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-auto h-4 w-4 text-muted-foreground shrink-0" })
  ] }, s.title)) }) });
}
function humanType(f) {
  if (f.type === "image/jpeg") return "Image (JPG)";
  if (f.type === "image/png") return "Image (PNG)";
  if (f.type.startsWith("video/"))
    return `Video (${(f.name.split(".").pop() ?? "MP4").toUpperCase()})`;
  return f.type || "Unknown";
}
async function buildPreview(file, kind) {
  try {
    if (kind === "image") return await imagePreview(file);
    if (kind === "video") return await videoPreview(file);
    return null;
  } catch {
    return null;
  }
}
function imagePreview(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxW = 1280;
      const ratio = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(img.width * ratio);
      canvas.height = Math.floor(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Canvas not supported"));
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}
function videoPreview(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      const maxW = 1280;
      const vw = video.videoWidth || 320;
      const vh = video.videoHeight || 180;
      const ratio = Math.min(1, maxW / vw);
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(vw * ratio);
      canvas.height = Math.floor(vh * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Canvas not supported"));
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load video"));
    };
  });
}
function Dashboard() {
  const [isAnalyzing, setIsAnalyzing] = reactExports.useState(false);
  const [pending, setPending] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [stage, setStage] = reactExports.useState(null);
  const history = useAnalysisHistory();
  const entry = useCurrentAnalysis();
  const handleAnalyze = async (file) => {
    setError(null);
    analysisStore.clearCurrent();
    const type = humanType(file);
    setPending({
      fileName: file.name,
      fileType: type
    });
    const kind = mediaKindFor(file);
    if (!kind) {
      setError("Unsupported file type. Upload a JPG, PNG, MP4, MOV or AVI file.");
      return;
    }
    setIsAnalyzing(true);
    setStage("uploading");
    try {
      const preview = await buildPreview(file, kind);
      const res = await analyzeFile(file, kind, {
        onStage: setStage
      });
      if (res) {
        analysisStore.add(buildAnalysisEntry({
          result: res,
          fileName: file.name,
          fileType: type,
          previewDataUrl: preview
        }));
        setPending(null);
      } else {
        setError("Could not reach the DeepShield backend. Start the FastAPI server and try again.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
      setStage(null);
    }
  };
  const clearAnalysis = () => {
    analysisStore.clearCurrent();
    setPending(null);
    setError(null);
    setStage(null);
  };
  const total = history.length;
  const real = history.filter((h) => h.prediction === "REAL").length;
  const fake = history.filter((h) => h.prediction === "FAKE").length;
  const avgConfidence = total ? history.reduce((s, h) => s + h.modelConfidence, 0) / total : 0;
  const result = entry?.result ?? null;
  const previewDataUrl = entry?.previewDataUrl ?? null;
  const fileName = entry?.fileName ?? pending?.fileName ?? null;
  const fileType = entry?.fileType ?? pending?.fileType ?? null;
  const analyzedAt = entry ? new Date(entry.analyzedAt) : null;
  const hasAnalysis = Boolean(entry) || Boolean(pending) || isAnalyzing;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(StatsCards, { total, real, fake, avgConfidence }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive", children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 grid items-stretch gap-5 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { step: 1, icon: Upload, title: "Upload Media", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UploadCard, { onAnalyze: handleAnalyze, isAnalyzing }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { step: 2, icon: Brain, title: "Analysis Results", badge: result && !isAnalyzing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-semibold text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3 w-3" }),
        " Analysis Completed"
      ] }) : void 0, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnalysisCard, { result, isAnalyzing, fileName, fileType, analyzedAt, stage }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { step: 3, icon: Image$1, title: "Original Media", children: /* @__PURE__ */ jsxRuntimeExports.jsx(OriginalMediaCard, { previewDataUrl }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { step: 4, icon: Flame, title: "Explainability (Grad-CAM)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExplainabilityCard, { previewDataUrl, result, isAnalyzing }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { step: 5, icon: ShieldCheck, title: "Verification Certificate", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CertificateCard, { entry }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: clearAnalysis, disabled: !hasAnalysis || isAnalyzing, title: "Clears the current dashboard analysis. Saved history is kept.", className: "inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] transition-colors hover:border-destructive/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-border disabled:hover:text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Eraser, { className: "h-4 w-4" }),
      " Clear Analysis"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WorkflowStrip, {})
  ] });
}
export {
  Dashboard as component
};
