import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  /** Minimum panel height so every empty card keeps the grid aligned. */
  minHeight?: string;
}

/**
 * Premium empty state: a layered, softly glowing brand medallion instead of
 * a bare icon, so untouched panels still look intentional.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  minHeight = "min-h-[300px]",
}: Props) {
  return (
    <div
      className={`relative flex h-full ${minHeight} flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-8 text-center`}
    >
      {/* Ambient brand wash */}
      <div className="pointer-events-none absolute inset-0 cert-guilloche opacity-60" />

      <div className="relative animate-float-soft">
        <span className="absolute inset-0 -m-4 rounded-full bg-primary/10 blur-xl" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-card shadow-[var(--shadow-card)]">
          <span className="absolute inset-1.5 rounded-xl border border-primary/15" />
          <Icon className="relative h-6 w-6 text-primary" strokeWidth={1.8} />
        </span>
      </div>

      <p className="relative mt-5 text-sm font-semibold tracking-tight text-foreground">{title}</p>
      <p className="relative mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="relative mt-4">{action}</div>}
    </div>
  );
}
