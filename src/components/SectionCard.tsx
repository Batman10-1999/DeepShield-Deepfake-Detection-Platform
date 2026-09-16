import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  step?: number;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Standard DeepShield panel. Every dashboard card uses the same padding,
 * header rhythm and radius so the grid reads as one system.
 */
export function SectionCard({
  step,
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
  className = "",
}: Props) {
  return (
    <section className={`surface-card flex h-full flex-col p-6 animate-fade-in-up ${className}`}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 pb-4 mb-5 border-b border-border/70">
        <div className="relative h-10 w-10 shrink-0 rounded-xl bg-accent flex items-center justify-center">
          <Icon className="h-[18px] w-[18px] text-primary" />
          {step !== undefined && (
            <span className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-[var(--shadow-card)]">
              {step}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 truncate text-xs leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        <div className="shrink-0">{badge}</div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}
