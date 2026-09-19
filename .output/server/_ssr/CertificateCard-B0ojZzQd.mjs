import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { Q as QRCode } from "../_libs/qrcode.mjs";
import { E } from "../_libs/jspdf.mjs";
import { h as buildVerificationUrl } from "./router-BhrJ7AGX.mjs";
import { l as logoUrl } from "./deepshield-logo-BbcsavlP.mjs";
import { S as ShieldCheck, p as CircleX, h as CircleCheck, D as FingerprintPattern, q as Info, J as Download, K as ExternalLink } from "../_libs/lucide-react.mjs";
let cached;
let inflight = null;
async function loadLogoDataUrl() {
  if (cached !== void 0) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(logoUrl);
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      cached = dataUrl;
    } catch {
      cached = null;
    } finally {
      inflight = null;
    }
    return cached ?? null;
  })();
  return inflight;
}
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  minHeight = "min-h-[300px]"
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `relative flex h-full ${minHeight} flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-8 text-center`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 cert-guilloche opacity-60" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative animate-float-soft", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 -m-4 rounded-full bg-primary/10 blur-xl" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-card shadow-[var(--shadow-card)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-1.5 rounded-xl border border-primary/15" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "relative h-6 w-6 text-primary", strokeWidth: 1.8 })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "relative mt-5 text-sm font-semibold tracking-tight text-foreground", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "relative mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground", children: description }),
        action && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mt-4", children: action })
      ]
    }
  );
}
const BRAND_PRIMARY = [30, 50, 130];
const BRAND_SOFT = [180, 190, 220];
const TEXT_MUTED = [110, 115, 135];
const TEXT_STRONG = [30, 30, 55];
function buildCertificate({ entry, qrDataUrl, logoDataUrl }) {
  const { result, fileName, fileType, certificateId, verificationStatus, previewDataUrl } = entry;
  const analyzedAt = new Date(entry.analyzedAt);
  const doc = new E({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...BRAND_PRIMARY);
  doc.setLineWidth(2);
  doc.rect(24, 24, pageW - 48, pageH - 48);
  doc.setLineWidth(0.5);
  doc.rect(32, 32, pageW - 64, pageH - 64);
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
    { align: "center" }
  );
  doc.setDrawColor(...BRAND_SOFT);
  doc.line(60, headerY + 36, pageW - 60, headerY + 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text(`Status: ${verificationStatus}`, pageW / 2, headerY + 56, { align: "center" });
  doc.setTextColor(...TEXT_STRONG);
  let y = headerY + 88;
  const line = (label, value) => {
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
  if (previewDataUrl) {
    try {
      const w = 170;
      const h = 140;
      const x = pageW - w - 60;
      const py = headerY + 88;
      doc.setDrawColor(...BRAND_SOFT);
      doc.rect(x - 4, py - 4, w + 8, h + 8);
      doc.addImage(previewDataUrl, "JPEG", x, py, w, h, void 0, "FAST");
    } catch {
    }
  }
  const qrSize = 96;
  const qrX = pageW - qrSize - 60;
  const qrY = pageH - qrSize - 110;
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    } catch {
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
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text("Verified by the DeepShield Detection Engine", pageW / 2, pageH - 62, {
    align: "center"
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    `Certificate ID ${certificateId} · Issued ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
    pageW / 2,
    pageH - 46,
    { align: "center" }
  );
  if (!result.decisionValidated) {
    doc.setFontSize(7.5);
    doc.text(
      truncate(
        result.validationNote ?? "The active checkpoint is not a verified deepfake-trained model; this verdict is not scientifically validated.",
        140
      ),
      pageW / 2,
      pageH - 34,
      { align: "center" }
    );
  }
  return doc;
}
function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
const STATUS_META = {
  "Verified Authentic": { tone: "success", Icon: CircleCheck },
  "Potential Deepfake": { tone: "danger", Icon: CircleX }
};
const TONE_CLASSES = {
  success: {
    chip: "bg-foreground/10 text-foreground",
    ring: "border-foreground/40",
    seal: "text-foreground"
  },
  danger: {
    chip: "bg-muted text-muted-foreground",
    ring: "border-muted-foreground/40",
    seal: "text-muted-foreground"
  }
};
function useQrDataUrl(payload) {
  const [url, setUrl] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!payload) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(payload, { margin: 1, width: 240, errorCorrectionLevel: "M" }).then((data) => {
      if (!cancelled) setUrl(data);
    }).catch(() => {
      if (!cancelled) setUrl(null);
    });
    return () => {
      cancelled = true;
    };
  }, [payload]);
  return url;
}
function CornerOrnament({ className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "svg",
    {
      viewBox: "0 0 40 40",
      className: `absolute h-9 w-9 text-primary/70 ${className}`,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.25",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2 14 V4 H14", strokeLinecap: "round" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M6 18 V8 H18", strokeLinecap: "round", opacity: "0.55" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "4", cy: "4", r: "1.2", fill: "currentColor", stroke: "none" })
      ]
    }
  );
}
function CertificateCard({ entry, full = false }) {
  const verificationUrl = entry ? buildVerificationUrl(entry.certificateId) : null;
  const qr = useQrDataUrl(verificationUrl);
  const [downloading, setDownloading] = reactExports.useState(false);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  if (!entry) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      EmptyState,
      {
        icon: ShieldCheck,
        minHeight: "min-h-[280px]",
        title: "No certificate yet",
        description: "A signed verification certificate is generated automatically after every successful analysis."
      }
    );
  }
  const {
    result,
    fileName,
    fileType,
    certificateId,
    verificationStatus,
    analyzedAt: analyzedAtIso
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
  const dateStr = analyzedAt.toLocaleString(void 0, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const sha256 = result.sha256;
  const signature = sha256 ? `${sha256.slice(0, 16)}…${sha256.slice(-8)}` : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `print-sheet relative overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] ${tone.ring} ${full ? "px-8 pb-7 pt-8" : "px-6 pb-5 pt-6"}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 cert-watermark opacity-[0.55]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 cert-guilloche" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-2.5 rounded-xl border border-primary/25" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CornerOrnament, { className: "left-2 top-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CornerOrnament, { className: "right-2 top-2 rotate-90" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CornerOrnament, { className: "bottom-2 right-2 rotate-180" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CornerOrnament, { className: "bottom-2 left-2 -rotate-90" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "brand-wordmark rotate-[-24deg] text-6xl opacity-[0.06] md:text-7xl", children: "DeepShield" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-card shadow-[var(--shadow-card)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logoUrl, alt: "DeepShield", className: "logo-glow h-11 w-11 object-contain" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "brand-wordmark text-2xl leading-none", children: "DeepShield" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-foreground/75", children: "Verification Certificate" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2.5 h-px w-20 bg-primary/40" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "span",
                {
                  className: `mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${tone.chip}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(meta.Icon, { className: "h-3.5 w-3.5" }),
                    " ",
                    verificationStatus
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `mt-5 flex gap-5 ${full ? "flex-col items-start sm:flex-row" : "flex-col items-center"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full min-w-0 flex-1 space-y-1.5 text-[11.5px]", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "Certificate ID", v: certificateId, mono: true }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "Prediction", v: result.prediction }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "Authenticity", v: `${result.authenticityScore.toFixed(2)} / 100` }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "Confidence", v: `${result.modelConfidence.toFixed(2)}%` }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "Risk Level", v: result.riskLevel }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "Model", v: result.modelName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "Weights", v: result.weightsSource }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "File", v: fileName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "File Type", v: fileType ?? "—" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "Processed In", v: `${result.processingTime.toFixed(2)} sec` }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { k: "Analyzed", v: dateStr })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 flex-col items-center gap-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-[104px] w-[104px] items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-1", children: qr ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: qr,
                        alt: "Verification QR code",
                        className: "h-full w-full object-contain"
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full animate-pulse bg-muted" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground", children: "Scan to verify" })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-t border-primary/15 pt-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label", children: "Digital Signature" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FingerprintPattern, { className: "h-4 w-4 shrink-0 text-primary" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "truncate font-mono text-[11px] font-semibold tracking-wider text-foreground",
                      title: sha256 ?? void 0,
                      children: signature ? `SHA-256 · ${signature}` : "SHA-256 not reported by the server"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[9.5px] italic text-muted-foreground", children: "Authorized by the DeepShield Verification Engine" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `shrink-0 rotate-[-8deg] rounded-full border-2 border-dashed px-3 py-2 text-center ${tone.ring} ${tone.seal}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-bold uppercase tracking-[0.2em]", children: "Verified" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[8px] uppercase tracking-wider opacity-80", children: "DeepShield v1.0" })
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    ),
    !result.decisionValidated && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "print-hide flex items-start gap-2 rounded-xl border border-border bg-secondary/60 p-3 text-[11px] leading-relaxed text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: result.validationNote ?? "The active checkpoint is not a verified deepfake-trained model, so this verdict is not scientifically validated." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "print-hide flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: download,
          disabled: downloading,
          className: "flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-all hover:bg-primary/90 hover:shadow-[var(--shadow-elevated)] disabled:cursor-wait disabled:opacity-90",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
            " ",
            downloading ? "Preparing PDF…" : "Download PDF"
          ]
        }
      ),
      !full && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/certificate",
          search: { id: certificateId },
          className: "flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" }),
            " Open Full Certificate"
          ]
        }
      )
    ] }),
    downloadError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "print-hide rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive", children: downloadError }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "print-hide flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3 w-3 text-primary" }),
      " Signed by DeepShield Verification Engine"
    ] })
  ] });
}
function Row({ k, v, mono = false }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(4.5rem,auto)_0.4rem_minmax(0,1fr)] items-baseline gap-x-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-muted-foreground", children: k }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground/50", children: ":" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: `min-w-0 truncate font-semibold text-foreground ${mono ? "font-mono text-[10.5px]" : ""}`,
        title: v,
        children: v
      }
    )
  ] });
}
export {
  CertificateCard as C,
  EmptyState as E
};
