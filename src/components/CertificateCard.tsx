import {
  Download,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Fingerprint,
  Info,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import QRCode from "qrcode";
import { EmptyState } from "./EmptyState";
import type { AnalysisEntry } from "@/lib/analysisStore";
import { buildCertificate } from "@/lib/certificate";
import { loadLogoDataUrl, logoUrl } from "@/lib/logo";
import { buildVerificationUrl, type VerificationStatus } from "@/lib/verification";

interface Props {
  entry: AnalysisEntry | null;
  /** Full-page presentation: larger sheet, no "open full certificate" link. */
  full?: boolean;
}

type Tone = "success" | "danger";

const STATUS_META: Record<VerificationStatus, { tone: Tone; Icon: typeof CheckCircle2 }> = {
  "Verified Authentic": { tone: "success", Icon: CheckCircle2 },
  "Potential Deepfake": { tone: "danger", Icon: XCircle },
};

const TONE_CLASSES: Record<Tone, { chip: string; ring: string; seal: string }> = {
  success: {
    chip: "bg-foreground/10 text-foreground",
    ring: "border-foreground/40",
    seal: "text-foreground",
  },
  danger: {
    chip: "bg-muted text-muted-foreground",
    ring: "border-muted-foreground/40",
    seal: "text-muted-foreground",
  },
};

/** QR code renderer. Uses `qrcode` to build a data-URL PNG we can render + embed in PDFs. */
function useQrDataUrl(payload: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!payload) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(payload, { margin: 1, width: 240, errorCorrectionLevel: "M" })
      .then((data) => {
        if (!cancelled) setUrl(data);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);
  return url;
}

function CornerOrnament({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={`absolute h-9 w-9 text-primary/70 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M2 14 V4 H14" strokeLinecap="round" />
      <path d="M6 18 V8 H18" strokeLinecap="round" opacity="0.55" />
      <circle cx="4" cy="4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CertificateCard({ entry, full = false }: Props) {
  const verificationUrl = entry ? buildVerificationUrl(entry.certificateId) : null;
  const qr = useQrDataUrl(verificationUrl);
  // Hooks must run on every render, so they stay above the empty-state return.
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!entry) {
    return (
      <EmptyState
        icon={ShieldCheck}
        minHeight="min-h-[280px]"
        title="No certificate yet"
        description="A signed verification certificate is generated automatically after every successful analysis."
      />
    );
  }

  const {
    result,
    fileName,
    fileType,
    certificateId,
    verificationStatus,
    analyzedAt: analyzedAtIso,
  } = entry;
  const analyzedAt = new Date(analyzedAtIso);
  const meta = STATUS_META[verificationStatus];
  const tone = TONE_CLASSES[meta.tone];

  const download = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const logo = await loadLogoDataUrl();
      const doc = buildCertificate({ entry, qrDataUrl: qr, logoDataUrl: logo });
      doc.save(`DeepShield-Certificate-${certificateId}.pdf`);
    } catch {
      setDownloadError("The certificate PDF could not be generated. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const dateStr = analyzedAt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sha256 = result.sha256;
  const signature = sha256 ? `${sha256.slice(0, 16)}…${sha256.slice(-8)}` : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Certificate sheet */}
      <div
        className={`print-sheet relative overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] ${tone.ring} ${
          full ? "px-8 pb-7 pt-8" : "px-6 pb-5 pt-6"
        }`}
      >
        {/* Security substrate */}
        <div className="pointer-events-none absolute inset-0 cert-watermark opacity-[0.55]" />
        <div className="pointer-events-none absolute inset-0 cert-guilloche" />
        <div className="pointer-events-none absolute inset-2.5 rounded-xl border border-primary/25" />
        <CornerOrnament className="left-2 top-2" />
        <CornerOrnament className="right-2 top-2 rotate-90" />
        <CornerOrnament className="bottom-2 right-2 rotate-180" />
        <CornerOrnament className="bottom-2 left-2 -rotate-90" />

        {/* Diagonal brand watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="brand-wordmark rotate-[-24deg] text-6xl opacity-[0.06] md:text-7xl">
            DeepShield
          </span>
        </div>

        <div className="relative">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-card shadow-[var(--shadow-card)]">
              <img src={logoUrl} alt="DeepShield" className="logo-glow h-11 w-11 object-contain" />
            </div>
            <div className="brand-wordmark text-2xl leading-none">DeepShield</div>
            <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/75">
              Verification Certificate
            </div>
            <div className="mt-2.5 h-px w-20 bg-primary/40" />
            <span
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${tone.chip}`}
            >
              <meta.Icon className="h-3.5 w-3.5" /> {verificationStatus}
            </span>
          </div>

          {/* Body */}
          {/* Body — the narrow dashboard card stacks the QR under the fields so
              every value stays fully readable instead of truncating. */}
          <div
            className={`mt-5 flex gap-5 ${
              full ? "flex-col items-start sm:flex-row" : "flex-col items-center"
            }`}
          >
            <div className="w-full min-w-0 flex-1 space-y-1.5 text-[11.5px]">
              <Row k="Certificate ID" v={certificateId} mono />
              <Row k="Prediction" v={result.prediction} />
              <Row k="Authenticity" v={`${result.authenticityScore.toFixed(2)} / 100`} />
              <Row k="Confidence" v={`${result.modelConfidence.toFixed(2)}%`} />
              <Row k="Risk Level" v={result.riskLevel} />
              <Row k="Model" v={result.modelName} />
              <Row k="Weights" v={result.weightsSource} />
              <Row k="File" v={fileName} />
              <Row k="File Type" v={fileType ?? "—"} />
              <Row k="Processed In" v={`${result.processingTime.toFixed(2)} sec`} />
              <Row k="Analyzed" v={dateStr} />
            </div>

            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="flex h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-1">
                {qr ? (
                  <img
                    src={qr}
                    alt="Verification QR code"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-muted" />
                )}
              </div>
              <div className="text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground">
                Scan to verify
              </div>
            </div>
          </div>

          {/* Digital signature block */}
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-t border-primary/15 pt-3">
            <div className="min-w-0">
              <div className="section-label">Digital Signature</div>
              <div className="mt-1 flex items-center gap-2">
                <Fingerprint className="h-4 w-4 shrink-0 text-primary" />
                <span
                  className="truncate font-mono text-[11px] font-semibold tracking-wider text-foreground"
                  title={sha256 ?? undefined}
                >
                  {signature ? `SHA-256 · ${signature}` : "SHA-256 not reported by the server"}
                </span>
              </div>
              <div className="mt-1 text-[9.5px] italic text-muted-foreground">
                Authorized by the DeepShield Verification Engine
              </div>
            </div>
            <div
              className={`shrink-0 rotate-[-8deg] rounded-full border-2 border-dashed px-3 py-2 text-center ${tone.ring} ${tone.seal}`}
            >
              <div className="text-[9px] font-bold uppercase tracking-[0.2em]">Verified</div>
              <div className="text-[8px] uppercase tracking-wider opacity-80">DeepShield v1.0</div>
            </div>
          </div>
        </div>
      </div>

      {!result.decisionValidated && (
        <div className="print-hide flex items-start gap-2 rounded-xl border border-border bg-secondary/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {result.validationNote ??
              "The active checkpoint is not a verified deepfake-trained model, so this verdict is not scientifically validated."}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="print-hide flex flex-wrap gap-2">
        <button
          onClick={download}
          disabled={downloading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-all hover:bg-primary/90 hover:shadow-[var(--shadow-elevated)] disabled:cursor-wait disabled:opacity-90"
        >
          <Download className="h-4 w-4" /> {downloading ? "Preparing PDF…" : "Download PDF"}
        </button>

        {!full && (
          <Link
            to="/certificate"
            search={{ id: certificateId }}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" /> Open Full Certificate
          </Link>
        )}
      </div>

      {downloadError && (
        <div className="print-hide rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          {downloadError}
        </div>
      )}

      <div className="print-hide flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3 text-primary" /> Signed by DeepShield Verification Engine
      </div>
    </div>
  );
}

function Row({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(4.5rem,auto)_0.4rem_minmax(0,1fr)] items-baseline gap-x-2">
      <span className="truncate text-muted-foreground">{k}</span>
      <span className="text-foreground/50">:</span>
      <span
        className={`min-w-0 truncate font-semibold text-foreground ${mono ? "font-mono text-[10.5px]" : ""}`}
        title={v}
      >
        {v}
      </span>
    </div>
  );
}
