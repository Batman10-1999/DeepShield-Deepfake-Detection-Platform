import {
  Upload,
  Cog,
  Brain,
  CheckCircle2,
  FileCheck2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface Stage {
  icon: LucideIcon;
  title: string;
  sub: string;
  color: string;
  bg: string;
}

const stages: Stage[] = [
  {
    icon: Upload,
    title: "Upload",
    sub: "Media uploaded",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  {
    icon: Cog,
    title: "Preprocessing",
    sub: "Data prepared",
    color: "text-foreground",
    bg: "bg-foreground/10",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    sub: "Deep learning model",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  {
    icon: CheckCircle2,
    title: "Results",
    sub: "Prediction generated",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  {
    icon: FileCheck2,
    title: "Certificate",
    sub: "Verification ready",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
];

export function WorkflowStrip() {
  return (
    <div className="surface-card mt-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-y-4">
        {stages.map((s, i) => (
          <div key={s.title} className="flex items-center gap-2 flex-1 min-w-[150px]">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-foreground">{s.title}</div>
                <div className="text-[11px] text-muted-foreground">{s.sub}</div>
              </div>
            </div>
            {i < stages.length - 1 && (
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
