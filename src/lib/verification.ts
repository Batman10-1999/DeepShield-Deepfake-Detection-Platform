// Verification & Trust Layer.
//
// Pure, framework-agnostic helpers that turn a DeepShield PredictionResult
// into the metadata every certificate needs: a certificate ID, a
// human-readable verification status, and a shareable verification URL
// (used today only for the QR-code payload, so a future public
// verification page can consume the same ID unchanged).
//
// PRODUCT CONTRACT: DeepShield exposes exactly two outcomes — REAL and
// FAKE. There is deliberately no third status here.

import type { PredictionResult } from "./api";

export type VerificationStatus = "Verified Authentic" | "Potential Deepfake";

export interface VerificationBadge {
  status: VerificationStatus;
  tone: "success" | "danger";
  description: string;
}

/**
 * Generates a verification certificate ID.
 * Format: DS-YYYYMMDD-HHMMSS-XXXX (XXXX = random alphanumeric).
 * Used only when the backend did not issue one with the prediction.
 */
export function generateCertificateId(date: Date = new Date()): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DS-${y}${m}${d}-${hh}${mm}${ss}-${rand}`;
}

/**
 * Maps the engine's binary verdict onto the certificate wording. The verdict
 * itself is never altered here — this is presentation only.
 */
export function determineVerificationStatus(result: PredictionResult): VerificationBadge {
  const isReal = String(result.prediction).toUpperCase() === "REAL";
  return isReal
    ? {
        status: "Verified Authentic",
        tone: "success",
        description: "Media passed DeepShield's authenticity checks.",
      }
    : {
        status: "Potential Deepfake",
        tone: "danger",
        description: "Media shows indicators of AI manipulation.",
      };
}

/** Normalises any legacy/stored status onto the binary contract. */
export function coerceVerificationStatus(
  status: string | undefined,
  prediction: string | undefined,
): VerificationStatus {
  if (status === "Verified Authentic" || status === "Potential Deepfake") return status;
  return String(prediction ?? "").toUpperCase() === "REAL"
    ? "Verified Authentic"
    : "Potential Deepfake";
}

/**
 * Builds the canonical verification URL for a certificate ID. The public
 * verification page is not implemented yet — this URL is the QR-code
 * payload today and the target of the future verifier tomorrow.
 */
export function buildVerificationUrl(certificateId: string): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://deepshield.app";
  return `${origin}/certificate?id=${encodeURIComponent(certificateId)}`;
}
