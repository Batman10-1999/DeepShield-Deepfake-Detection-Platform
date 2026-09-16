import {
  CheckCircle2,
  XCircle,
  FileText,
  FileType2,
  Clock,
  Calendar,
  Cpu,
  Brain,
  Info,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AnalysisProgress } from "./AnalysisProgress";
import { EmptyState } from "./EmptyState";
import { MultiFaceBreakdown } from "./MultiFaceBreakdown";
import type { PipelineStage } from "@/lib/analyze";
import type { PredictionResult } from "@/lib/api";

interface Props {
  result: PredictionResult | null;
  isAnalyzing: boolean;
  fileName: string | null;
  fileType: string | null;
  analyzedAt: Date | null;
  stage?: PipelineStage | null;
}

export function AnalysisCard({
  result,
  isAnalyzing,
  fileName,
  fileType,
  analyzedAt,
  stage = null,
}: Props) {
  const [animatedRing, setAnimatedRing] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
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
    return (
      <EmptyState
        icon={Brain}
        title="Awaiting analysis"
        description="Upload media to view the AI prediction, model confidence, risk level and authenticity score."
      />
    );
  }

  if (isAnalyzing) {
    return <AnalysisProgress stage={stage} />;
  }

  // Binary product contract: REAL or FAKE, nothing else is ever displayed.
  const isReal = result!.prediction.toUpperCase() === "REAL";
  const verdict = isReal
    ? {
        color: "text-foreground",
        label: "REAL",
        message: "The media is likely to be authentic.",
        ring: "stroke-foreground",
        bar: "bg-foreground",
        riskBg: "bg-foreground/10",
        riskText: "text-foreground",
        Icon: CheckCircle2,
      }
    : {
        color: "text-muted-foreground",
        label: "FAKE",
        message: "The media is likely manipulated.",
        ring: "stroke-muted-foreground",
        bar: "bg-muted-foreground",
        riskBg: "bg-muted",
        riskText: "text-muted-foreground",
        Icon: XCircle,
      };

  const R = 42;
  const C = 2 * Math.PI * R;
  const ringOffset = C - (animatedRing / 100) * C;

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 animate-fade-in-up">
      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
        {/* Prediction */}
        <div>
          <div className="section-label">Prediction</div>
          <div
            className={`mt-2 text-[2.75rem] font-extrabold leading-none tracking-tight ${verdict.color}`}
          >
            {verdict.label}
          </div>
          <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {verdict.message}
          </div>
          {result!.riskDescription && (
            <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
              {result!.riskDescription}
            </div>
          )}
        </div>

        {/* Confidence ring */}
        <div className="justify-self-center">
          <div className="relative h-[128px] w-[128px]">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r={R} className="fill-none stroke-muted" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r={R}
                className={`fill-none ${verdict.ring} transition-all duration-1000 ease-out`}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className={`text-[1.35rem] font-bold leading-none tracking-tight ${verdict.color}`}
              >
                {result!.modelConfidence.toFixed(1)}%
              </div>
              <div className="section-label mt-1.5">Confidence</div>
            </div>
          </div>
        </div>

        {/* Authenticity */}
        <div>
          <div className="section-label">Authenticity Score</div>
          <div className="mt-2 text-2xl font-bold leading-none tracking-tight text-foreground">
            {result!.authenticityScore.toFixed(2)}{" "}
            <span className="text-sm font-medium text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${verdict.bar} transition-all duration-1000 ease-out`}
              style={{ width: `${animatedScore}%` }}
            />
          </div>
          <div className="section-label mt-4">Risk Level</div>
          <span
            className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full ${verdict.riskBg} ${verdict.riskText} px-3 py-1 text-xs font-semibold`}
          >
            <verdict.Icon className="h-3.5 w-3.5" />
            {result!.riskLevel}
          </span>
        </div>
      </div>

      <div>
        <div className="section-label mb-2.5">Probabilities</div>
        <div className="grid grid-cols-2 gap-2.5">
          <Probability
            label="Fake probability"
            value={result!.fakePercentage}
            bar="bg-muted-foreground"
          />
          <Probability
            label="Real probability"
            value={result!.realPercentage}
            bar="bg-foreground"
          />
        </div>
      </div>

      {!result!.decisionValidated && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {result!.validationNote ??
              "The active checkpoint is not a verified deepfake-trained model, so this verdict is not scientifically validated."}
          </span>
        </div>
      )}

      <MultiFaceBreakdown faceAnalysis={result!.faceAnalysis} />

      <div>
        <div className="section-label mb-2.5">Media & Pipeline Metadata</div>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5">
          <Meta icon={FileText} label="File Name" value={fileName ?? "—"} />
          <Meta icon={FileType2} label="File Type" value={fileType ?? "—"} />
          <Meta icon={Cpu} label="AI Model" value={result!.modelName} />
          <Meta
            icon={Clock}
            label="Processed In"
            value={`${result!.processingTime.toFixed(2)} sec`}
          />
          <Meta
            icon={Calendar}
            label="Analyzed On"
            value={
              analyzedAt
                ? analyzedAt.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"
            }
          />
        </div>
      </div>
    </div>
  );
}

function Probability({ label, value, bar }: { label: string; value: number; bar: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-xl border border-border bg-secondary/50 px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="section-label">{label}</span>
        <span className="text-xs font-bold tabular-nums text-foreground">{pct.toFixed(2)}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${bar} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-secondary/50 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-primary/80" />
      <div className="min-w-0">
        <div className="section-label">{label}</div>
        <div
          className="mt-1 truncate text-xs font-semibold tracking-tight text-foreground"
          title={value}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
