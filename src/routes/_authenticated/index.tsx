import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Upload as UploadIcon,
  Brain,
  Image as ImageIcon,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Eraser,
} from "lucide-react";
import { StatsCards } from "@/components/StatsCards";
import { SectionCard } from "@/components/SectionCard";
import { UploadCard } from "@/components/UploadCard";
import { AnalysisCard } from "@/components/AnalysisCard";
import { OriginalMediaCard } from "@/components/OriginalMediaCard";
import { ExplainabilityCard } from "@/components/ExplainabilityCard";
import { CertificateCard } from "@/components/CertificateCard";
import { WorkflowStrip } from "@/components/WorkflowStrip";
import {
  analyzeFile,
  mediaKindFor,
  type PipelineStage,
  type PredictionResult,
} from "@/lib/analyze";
import {
  analysisStore,
  buildAnalysisEntry,
  useAnalysisHistory,
  useCurrentAnalysis,
} from "@/lib/analysisStore";
import { buildPreview, humanType } from "@/lib/mediaUtils";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — DeepShield" },
      {
        name: "description",
        content:
          "Run deepfake detection and view results, explainability and verification certificates.",
      },
      { property: "og:title", content: "DeepShield Dashboard — Deepfake Detection" },
      {
        property: "og:description",
        content:
          "Upload media, get a binary REAL/FAKE verdict, Grad-CAM evidence and a verification certificate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Dashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pending, setPending] = useState<{ fileName: string; fileType: string | null } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<PipelineStage | null>(null);
  const history = useAnalysisHistory();
  // The dashboard analysis lives in the store, so navigating away and back —
  // or refreshing the browser — restores exactly the same analysis.
  const entry = useCurrentAnalysis();

  const handleAnalyze = async (file: File) => {
    setError(null);
    analysisStore.clearCurrent();
    const type = humanType(file);
    setPending({ fileName: file.name, fileType: type });

    const kind = mediaKindFor(file);
    if (!kind) {
      setError("Unsupported file type. Upload a JPG, PNG, MP4, MOV or AVI file.");
      return;
    }

    setIsAnalyzing(true);
    setStage("uploading");
    try {
      const preview = await buildPreview(file, kind);
      const res = await analyzeFile(file, kind, { onStage: setStage });
      if (res) {
        analysisStore.add(
          buildAnalysisEntry({
            result: res,
            fileName: file.name,
            fileType: type,
            previewDataUrl: preview,
          }),
        );
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

  /** Clears the current dashboard analysis only — history is preserved. */
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

  const result: PredictionResult | null = entry?.result ?? null;
  const previewDataUrl = entry?.previewDataUrl ?? null;
  const fileName = entry?.fileName ?? pending?.fileName ?? null;
  const fileType = entry?.fileType ?? pending?.fileType ?? null;
  const analyzedAt = entry ? new Date(entry.analyzedAt) : null;
  const hasAnalysis = Boolean(entry) || Boolean(pending) || isAnalyzing;

  return (
    <>
      <StatsCards total={total} real={real} fake={fake} avgConfidence={avgConfidence} />

      {error && (
        <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-5 grid items-stretch gap-5 lg:grid-cols-2">
        <SectionCard step={1} icon={UploadIcon} title="Upload Media">
          <UploadCard onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </SectionCard>

        <SectionCard
          step={2}
          icon={Brain}
          title="Analysis Results"
          badge={
            result && !isAnalyzing ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                <CheckCircle2 className="h-3 w-3" /> Analysis Completed
              </span>
            ) : undefined
          }
        >
          <AnalysisCard
            result={result}
            isAnalyzing={isAnalyzing}
            fileName={fileName}
            fileType={fileType}
            analyzedAt={analyzedAt}
            stage={stage}
          />
        </SectionCard>
      </div>

      <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
        <SectionCard step={3} icon={ImageIcon} title="Original Media">
          <OriginalMediaCard previewDataUrl={previewDataUrl} />
        </SectionCard>
        <SectionCard step={4} icon={Flame} title="Explainability (Grad-CAM)">
          <ExplainabilityCard
            previewDataUrl={previewDataUrl}
            result={result}
            isAnalyzing={isAnalyzing}
          />
        </SectionCard>
        <SectionCard step={5} icon={ShieldCheck} title="Verification Certificate">
          <CertificateCard entry={entry} />
        </SectionCard>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={clearAnalysis}
          disabled={!hasAnalysis || isAnalyzing}
          title="Clears the current dashboard analysis. Saved history is kept."
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] transition-colors hover:border-destructive/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-border disabled:hover:text-foreground"
        >
          <Eraser className="h-4 w-4" /> Clear Analysis
        </button>
      </div>

      <WorkflowStrip />
    </>
  );
}
