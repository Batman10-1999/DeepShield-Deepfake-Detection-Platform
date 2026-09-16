import { CheckCircle2, XCircle, AlertTriangle, Users } from "lucide-react";
import type { FaceAnalysis } from "@/lib/api";

interface Props {
  faceAnalysis: FaceAnalysis | null;
}

function toneFor(prediction: string) {
  const p = prediction.toUpperCase();
  if (p === "REAL") return { text: "text-foreground", bar: "bg-foreground", Icon: CheckCircle2 };
  if (p === "FAKE")
    return { text: "text-muted-foreground", bar: "bg-muted-foreground", Icon: XCircle };
  return { text: "text-muted-foreground", bar: "bg-muted-foreground", Icon: AlertTriangle };
}

/**
 * Multi-face breakdown. Rendered only when the backend face pipeline
 * actually returned per-face verdicts, so single-face and face-less media
 * keep the analysis panel unchanged.
 */
export function MultiFaceBreakdown({ faceAnalysis }: Props) {
  if (!faceAnalysis?.detected || faceAnalysis.faces.length < 2) return null;

  const {
    faces,
    faceCount,
    agreement,
    consistent,
    dominantFaceIndex,
    aggregationStrategy,
    detector,
  } = faceAnalysis;

  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-xs font-semibold tracking-tight text-foreground">
            {faceCount} faces analysed independently
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            consistent ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {consistent ? "Consistent" : "Conflicting"} · {agreement.toFixed(0)}% agreement
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {faces.map((face) => {
          const tone = toneFor(face.prediction);
          const dominant = dominantFaceIndex === face.index;
          return (
            <div
              key={face.index}
              className={`rounded-xl border bg-card px-3 py-2.5 ${
                dominant ? "border-primary/40" : "border-border"
              }`}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <tone.Icon className={`h-3.5 w-3.5 shrink-0 ${tone.text}`} />
                  <span className={`truncate text-xs font-bold ${tone.text}`}>
                    Face {face.index + 1} · {face.prediction}
                  </span>
                </div>
                {dominant && (
                  <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                    Dominant
                  </span>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{ width: `${face.confidence}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{face.confidence.toFixed(1)}% confidence</span>
                <span>{face.authenticityScore.toFixed(0)}/100 authentic</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                Region {face.region.width}×{face.region.height}px at ({face.region.x},{" "}
                {face.region.y})
              </div>
            </div>
          );
        })}
      </div>

      {(aggregationStrategy || detector) && (
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          {detector && (
            <>
              Detector: <span className="font-medium text-foreground/80">{detector}</span>.{" "}
            </>
          )}
          {aggregationStrategy && (
            <>
              Verdict aggregated with{" "}
              <span className="font-medium text-foreground/80">{aggregationStrategy}</span>.
            </>
          )}
        </p>
      )}
    </div>
  );
}
