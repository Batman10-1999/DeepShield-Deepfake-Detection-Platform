import { Images, ShieldCheck, AlertOctagon, Gauge, type LucideIcon } from "lucide-react";

interface Stat {
  icon: LucideIcon;
  title: string;
  value: string;
  sub: string;
  tint: string;
  iconColor: string;
}

interface Props {
  total: number;
  real: number;
  fake: number;
  avgConfidence: number;
}

export function StatsCards({ total, real, fake, avgConfidence }: Props) {
  const pct = (n: number) => (total > 0 ? ((n / total) * 100).toFixed(2) : "0.00");

  const stats: Stat[] = [
    {
      icon: Images,
      title: "Analyses Performed",
      value: String(total),
      sub: "Total Files Analyzed",
      tint: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      icon: ShieldCheck,
      title: "Real Content",
      value: String(real),
      sub: `${pct(real)}% Real Files`,
      tint: "bg-foreground/10",
      iconColor: "text-foreground",
    },
    {
      icon: AlertOctagon,
      title: "Fake Content",
      value: String(fake),
      sub: `${pct(fake)}% Fake Files`,
      tint: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      icon: Gauge,
      title: "Average Confidence",
      value: `${avgConfidence.toFixed(2)}%`,
      sub: "Across All Analyses",
      tint: "bg-muted",
      iconColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((s) => (
        <div key={s.title} className="surface-card flex items-center gap-3.5 p-4">
          <div
            className={`h-12 w-12 rounded-xl ${s.tint} flex items-center justify-center shrink-0`}
          >
            <s.icon className={`h-6 w-6 ${s.iconColor}`} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-muted-foreground">{s.title}</div>
            <div className="text-2xl font-bold text-foreground leading-tight">{s.value}</div>
            <div className="text-[11px] text-muted-foreground truncate">{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
