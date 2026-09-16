import { createFileRoute, Link } from "@tanstack/react-router";
import {
  History as HistoryIcon,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload as UploadIcon,
} from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { analysisStore, useAnalysisHistory } from "@/lib/analysisStore";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Analysis History — DeepShield" },
      { name: "description", content: "Review previous DeepShield deepfake detection analyses." },
      { property: "og:title", content: "Analysis History — DeepShield" },
      {
        property: "og:description",
        content: "Browse every DeepShield analysis with verdicts, confidence and certificates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/** DeepShield is binary: anything that is not REAL is reported as FAKE. */
function verdictBadge(pred: string) {
  return pred === "REAL"
    ? { icon: CheckCircle2, cls: "bg-foreground/10 text-foreground" }
    : { icon: XCircle, cls: "bg-muted text-muted-foreground" };
}

function HistoryPage() {
  const history = useAnalysisHistory();

  return (
    <SectionCard
      icon={HistoryIcon}
      title="Analysis History"
      badge={
        history.length > 0 ? (
          <button
            onClick={() => {
              if (confirm("Clear all analysis history?")) analysisStore.clear();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-secondary text-muted-foreground hover:text-destructive px-2.5 py-1 text-[11px] font-semibold transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        ) : undefined
      }
    >
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
            <HistoryIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <div className="text-base font-semibold text-foreground">No history yet</div>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Your analyses will appear here after you run detection.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <UploadIcon className="h-4 w-4" /> Analyze on Dashboard
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="py-2.5 px-3 font-semibold">File</th>
                <th className="py-2.5 px-3 font-semibold">Verdict</th>
                <th className="py-2.5 px-3 font-semibold">Confidence</th>
                <th className="py-2.5 px-3 font-semibold">Authenticity</th>
                <th className="py-2.5 px-3 font-semibold">Certificate ID</th>
                <th className="py-2.5 px-3 font-semibold">When</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => {
                const { icon: Icon, cls } = verdictBadge(h.prediction);
                return (
                  <tr
                    key={h.id}
                    className="border-b border-border/60 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {h.previewDataUrl ? (
                          <img
                            src={h.previewDataUrl}
                            alt=""
                            className="h-9 w-9 rounded-md object-cover border border-border"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-md bg-secondary" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate max-w-[220px]">
                            {h.fileName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {h.fileType ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
                      >
                        <Icon className="h-3 w-3" /> {h.prediction}
                      </span>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {h.verificationStatus}
                      </div>
                    </td>
                    <td className="py-3 px-3 tabular-nums text-foreground">
                      {h.modelConfidence.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 tabular-nums text-foreground">
                      {h.authenticityScore.toFixed(0)}/100
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                      {h.certificateId}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {new Date(h.analyzedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to="/certificate"
                        search={{ id: h.certificateId }}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 text-[11px] font-semibold transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
