import { Check, Loader2 } from "lucide-react";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/analyze";

interface Props {
  stage: PipelineStage | null;
}

/**
 * Visualises the DeepShield detection pipeline while an analysis is in
 * flight. Purely presentational — driven by the stage callback emitted
 * by `analyzeFile`.
 */
export function AnalysisProgress({ stage }: Props) {
  const activeIndex = stage ? PIPELINE_STAGES.findIndex((s) => s.id === stage) : -1;

  return (
    <div className="space-y-2.5 animate-fade-in-up">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        Analysis Pipeline
      </div>
      <ul className="space-y-1.5">
        {PIPELINE_STAGES.map((s, i) => {
          const done = i < activeIndex || stage === "complete";
          const active = i === activeIndex && stage !== "complete";
          return (
            <li
              key={s.id}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs border transition-colors ${
                done
                  ? "border-foreground/40 bg-foreground/10 text-foreground"
                  : active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground"
              }`}
            >
              <span className="h-5 w-5 rounded-full flex items-center justify-center shrink-0">
                {done ? (
                  <Check className="h-3.5 w-3.5 text-foreground" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </span>
              <span className="font-medium">{s.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
