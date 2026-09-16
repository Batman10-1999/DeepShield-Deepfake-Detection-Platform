// Verification Certificate PDF builder.
//
// Consumes a fully-formed AnalysisEntry (see analysisStore.buildAnalysisEntry)
// so certificate metadata — certificate ID, verification status, prediction
// details — stays consistent between the on-screen card, the history table,
// and the exported PDF.

import { jsPDF } from "jspdf";
import type { AnalysisEntry } from "./analysisStore";
import { buildVerificationUrl } from "./verification";

export interface BuildCertificateInput {
  entry: AnalysisEntry;
  qrDataUrl?: string | null;
  /** DeepShield logo as a data URL, centered at the top of the sheet. */
  logoDataUrl?: string | null;
}

const BRAND_PRIMARY: [number, number, number] = [30, 50, 130];
const BRAND_SOFT: [number, number, number] = [180, 190, 220];
const TEXT_MUTED: [number, number, number] = [110, 115, 135];
const TEXT_STRONG: [number, number, number] = [30, 30, 55];

export function buildCertificate({ entry, qrDataUrl, logoDataUrl }: BuildCertificateInput): jsPDF {
  const { result, fileName, fileType, certificateId, verificationStatus, previewDataUrl } = entry;
  const analyzedAt = new Date(entry.analyzedAt);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Outer + inner frames.
  doc.setDrawColor(...BRAND_PRIMARY);
  doc.setLineWidth(2);
  doc.rect(24, 24, pageW - 48, pageH - 48);
  doc.setLineWidth(0.5);
  doc.rect(32, 32, pageW - 64, pageH - 64);

  // Header / branding — logo centered on the top border.
  let headerY = 84;
  if (logoDataUrl) {
    try {
      const size = 46;
      doc.setFillColor(255, 255, 255);
      doc.circle(pageW / 2, 24, size / 2 + 6, "F");
      doc.setDrawColor(...BRAND_PRIMARY);
      doc.setLineWidth(1);
      doc.circle(pageW / 2, 24, size / 2 + 6, "S");
      doc.addImage(logoDataUrl, "PNG", pageW / 2 - size / 2, 24 - size / 2, size, size);
      headerY = 92;
    } catch {
      /* logo embed errors are non-fatal */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text("DeepShield Verification Certificate", pageW / 2, headerY, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    "Multi-Modal AI System for Deepfake Detection and Trust Verification",
    pageW / 2,
    headerY + 20,
    { align: "center" },
  );

  doc.setDrawColor(...BRAND_SOFT);
  doc.line(60, headerY + 36, pageW - 60, headerY + 36);

  // Verification status pill.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(`Status: ${verificationStatus}`, pageW / 2, headerY + 56, { align: "center" });

  // Body — key/value grid.
  doc.setTextColor(...TEXT_STRONG);
  let y = headerY + 88;
  const line = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(label.toUpperCase(), 70, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...TEXT_STRONG);
    doc.text(String(value), 220, y);
    y += 22;
  };

  line("Certificate ID", certificateId);
  line("Prediction", result.prediction);
  line("Fake Probability", `${result.fakePercentage.toFixed(2)}%`);
  line("Real Probability", `${result.realPercentage.toFixed(2)}%`);
  line("Model Confidence", `${result.modelConfidence.toFixed(2)}%`);
  line("Authenticity Score", `${result.authenticityScore.toFixed(2)} / 100`);
  line("Risk Level", result.riskLevel);
  line("AI Model", result.modelName);
  line("File Name", truncate(fileName, 48));
  line("File Type", fileType ?? "—");
  line("Processing Time", `${result.processingTime.toFixed(2)} sec`);
  line("Analyzed On", analyzedAt.toLocaleString());
  line("SHA-256", result.sha256 ? `${result.sha256.slice(0, 32)}…` : "Not reported");

  // Preview image (top right).
  if (previewDataUrl) {
    try {
      const w = 170;
      const h = 140;
      const x = pageW - w - 60;
      const py = headerY + 88;
      doc.setDrawColor(...BRAND_SOFT);
      doc.rect(x - 4, py - 4, w + 8, h + 8);
      doc.addImage(previewDataUrl, "JPEG", x, py, w, h, undefined, "FAST");
    } catch {
      /* embed errors are non-fatal */
    }
  }

  // QR code + verification URL block.
  const qrSize = 96;
  const qrX = pageW - qrSize - 60;
  const qrY = pageH - qrSize - 110;
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    } catch {
      /* ignore */
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text("Scan to verify", qrX + qrSize / 2, qrY + qrSize + 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(8);
  const verifyUrl = buildVerificationUrl(certificateId);
  doc.text(truncate(verifyUrl, 42), qrX + qrSize / 2, qrY + qrSize + 26, { align: "center" });

  // Footer.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text("Verified by the DeepShield Detection Engine", pageW / 2, pageH - 62, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    `Certificate ID ${certificateId} · Issued ${new Date().toLocaleString()}`,
    pageW / 2,
    pageH - 46,
    { align: "center" },
  );

  if (!result.decisionValidated) {
    doc.setFontSize(7.5);
    doc.text(
      truncate(
        result.validationNote ??
          "The active checkpoint is not a verified deepfake-trained model; this verdict is not scientifically validated.",
        140,
      ),
      pageW / 2,
      pageH - 34,
      { align: "center" },
    );
  }

  return doc;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
