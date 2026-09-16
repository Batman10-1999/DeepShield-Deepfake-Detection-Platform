// Thin adapter between the UI and the DeepShield API service.
//
// Exposes an optional per-stage progress callback so the dashboard can
// visualise the full pipeline (upload → validate → preprocess → model →
// inference → confidence → report) while the request is in flight.

import { uploadImage, uploadVideo, type PredictionResult } from "@/lib/api";
import { detectMediaKind, type MediaKind as ValidatedKind } from "@/lib/validation";

export type { PredictionResult } from "@/lib/api";
export type MediaKind = "image" | "video";

export type PipelineStage =
  | "uploading"
  | "validating"
  | "preprocessing"
  | "loading_model"
  | "inference"
  | "confidence"
  | "report"
  | "complete";

export const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
  { id: "uploading", label: "Uploading..." },
  { id: "validating", label: "Validating..." },
  { id: "preprocessing", label: "Preprocessing..." },
  { id: "loading_model", label: "Loading AI Model..." },
  { id: "inference", label: "Running Inference..." },
  { id: "confidence", label: "Calculating Confidence..." },
  { id: "report", label: "Generating Report..." },
  { id: "complete", label: "Analysis Complete" },
];

/** Legacy helper — kept so existing call sites don't break. */
export function mediaKindFor(file: File): MediaKind | null {
  const kind: ValidatedKind = detectMediaKind(file);
  if (kind === "image") return "image";
  if (kind === "video") return "video";
  return null;
}

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("network") ||
    msg.includes("could not reach") ||
    msg.includes("failed to fetch") ||
    msg.includes("econnrefused")
  );
}

async function callBackend(file: File, kind: MediaKind): Promise<PredictionResult> {
  switch (kind) {
    case "image":
      return uploadImage(file);
    case "video":
      return uploadVideo(file);
  }
}

export interface AnalyzeOptions {
  onStage?: (stage: PipelineStage) => void;
}

/**
 * Runs the full detection pipeline. The backend performs all heavy work;
 * this helper just narrates the pipeline stages for the UI so the user
 * sees a clear step-by-step workflow, and normalises network failures to
 * `null` (frontend stays usable when FastAPI isn't running locally).
 */
export async function analyzeFile(
  file: File,
  kind: MediaKind,
  opts: AnalyzeOptions = {},
): Promise<PredictionResult | null> {
  const notify = (s: PipelineStage) => opts.onStage?.(s);

  // Narrate the pre-network stages with small delays so the user can read them.
  const pre: PipelineStage[] = ["uploading", "validating", "preprocessing"];
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
