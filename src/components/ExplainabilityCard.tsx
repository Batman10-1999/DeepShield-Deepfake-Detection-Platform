import { Flame } from "lucide-react";
import { EmptyState } from "./EmptyState";
import type { PredictionResult } from "@/lib/analyze";

interface Props {
  previewDataUrl: string | null;
  result: PredictionResult | null;
  isAnalyzing: boolean;
}

/**
 * Explainability panel.
 *
 * Only real backend Grad-CAM output is ever rendered. When the active
 * backbone exposes no convolutional target layer — or the explainability
 * engine failed — the card states that honestly instead of drawing a
 * decorative heatmap that would imply evidence that does not exist.
 */
export function ExplainabilityCard({ result, isAnalyzing }: Props) {
  const hasResult = !!result && !isAnalyzing;
  const explainability = hasResult ? result!.explainability : null;
  const overlayUrl = explainability?.overlayDataUrl ?? explainability?.heatmapDataUrl ?? null;

  if (!overlayUrl) {
    const description = isAnalyzing
      ? "Grad-CAM activation regions appear here once the analysis completes."
      : hasResult
        ? "The active model produced no Grad-CAM map for this file, so no visual explanation is available."
        : "Grad-CAM explanation will appear after a successful analysis.";
    return (
      <EmptyState
        icon={Flame}
        minHeight="min-h-[260px]"
        title={
          isAnalyzing
            ? "Generating heatmap…"
            : hasResult
              ? "No Grad-CAM available"
              : "No heatmap yet"
        }
        description={description}
      />
    );
  }

  const method = explainability?.method ?? "heuristic";
  const manipulation = explainability?.manipulationPercentage ?? 0;
  const faceCount = result?.faceAnalysis?.faceCount ?? null;
  return (
    <div className="flex flex-1 flex-col">
      {/* Heatmap viewport */}
      <div className="relative flex min-h-[240px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border bg-[oklch(0.16_0.02_258)]">
        <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl shadow-[inset_0_0_60px_-20px_rgba(0,0,0,0.9)]" />
        <img
          src={overlayUrl}
          alt="Grad-CAM activation overlay highlighting the regions that influenced the model"
          className="max-h-[340px] max-w-full object-contain"
        />

        {/* Method badge */}
        <span className="absolute left-3 top-3 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          {method === "grad_cam" || method === "gradcam" ? "Grad-CAM" : method.replace(/_/g, " ")}
        </span>

        {/* Intensity legend */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/70">
            Low
          </span>
          <div className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#facc15] to-[#ef4444]" />
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/70">
            High
          </span>
        </div>
      </div>

      {explainability?.available && (
        <div className="mt-4 space-y-3">
          <div
  className={`grid grid-cols-2 gap-2.5 ${
    faceCount !== null ? "sm:grid-cols-4" : "sm:grid-cols-3"
  }`}
>
            <Stat label="Manipulation" value={`${manipulation.toFixed(1)}%`} />

<Stat label="Faces Detected" value={faceCount === null ? "—" : `${faceCount}`} />

<Stat label="Regions" value={`${explainability.regions.length}`} />

<Stat label="Focus" value={explainability.mostSuspiciousRegion ?? "—"} />
          </div>

          {explainability.summary && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {explainability.summary}
            </p>
          )}

          {explainability.regions.length > 0 && (
            <div>
              <div className="section-label mb-2">Activated Regions</div>
              <div className="flex flex-wrap gap-1.5">
                {explainability.regions.map((region, index) => (
                  <span
                    key={`${region.label ?? "region"}-${index}`}
                    className="rounded-lg border border-border bg-secondary/60 px-2 py-1 text-[10px] font-medium text-foreground/75"
                  >
                    <span className="text-primary">#{index + 1}</span> {region.width}×
                    {region.height}px · {region.confidence.toFixed(0)}% ·{" "}
                    {region.areaPercentage.toFixed(1)}% area
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        Warmer areas mark the pixels that influenced the model’s decision the most.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-secondary/50 px-3 py-2">
      <div className="section-label">{label}</div>
      <div
        className="mt-1 truncate text-xs font-semibold tracking-tight text-foreground"
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
