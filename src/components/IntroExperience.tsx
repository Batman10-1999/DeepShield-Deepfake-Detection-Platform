import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { logoUrl } from "@/lib/logo";

/**
 * Cinematic opener shown once per browser session.
 *
 * It exists to give DeepShield a trust-signal first impression (scan sweep +
 * shield pulse) before the analyst reaches the workspace. It is deliberately
 * session-scoped and skippable so it never becomes friction for repeat use,
 * and every effect is CSS-driven so it costs nothing on the main thread.
 */
const SESSION_KEY = "deepshield.intro.seen";
const DISABLED_KEY = "deepshield.intro.disabled";
const DURATION = 5200;

/** Narrated boot stages — purely cosmetic, but they make the wait legible. */
const STAGES = [
  "Initializing secure workspace",
  "Loading detection models",
  "Calibrating trust engine",
  "Workspace ready",
] as const;

interface Props {
  onDone: () => void;
}

export function IntroExperience({ onDone }: Props) {
  const [leaving, setLeaving] = useState(false);
  const [stage, setStage] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 61) % 100}%`,
        size: 2 + ((i * 7) % 4),
        dx: `${((i % 5) - 2) * 26}px`,
        dy: `${-40 - ((i * 13) % 90)}px`,
        delay: `${(i % 9) * 260}ms`,
        duration: `${3200 + ((i * 191) % 2600)}ms`,
      })),
    [],
  );

  const finish = () => {
    if (leaving) return;
    if (dontShow) {
      try {
        window.localStorage.setItem(DISABLED_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    setLeaving(true);
    window.setTimeout(onDone, 520);
  };

  useEffect(() => {
    const steps = STAGES.map((_, i) =>
      window.setTimeout(() => setStage(i), i * (DURATION / STAGES.length)),
    );
    const t = window.setTimeout(finish, DURATION);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      steps.forEach(window.clearTimeout);
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-label="DeepShield introduction"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Ambient depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_420px_at_50%_45%,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent_70%)]" />

      {/* Drifting particles */}
      <div className="pointer-events-none absolute inset-0">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-primary/70"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              // @ts-expect-error custom properties drive the CSS keyframes
              "--dx": p.dx,
              "--dy": p.dy,
              animation: `intro-drift ${p.duration} linear ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Security scan sweep */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
        <div
          className="absolute inset-x-0 h-24 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--color-primary)_30%,transparent),transparent)]"
          style={{ animation: "intro-scan 2.4s ease-in-out 0.35s 2" }}
        />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center">
        {/* Shield pulse rings */}
        <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute h-24 w-24 rounded-full border border-primary/50"
              style={{ animation: `intro-pulse 2.6s ease-out ${i * 0.6}s infinite` }}
            />
          ))}
          <img
            src={logoUrl}
            alt="DeepShield"
            className="logo-glow intro-fade relative h-24 w-24 object-contain"
          />
        </div>

        <div
          className="brand-wordmark intro-fade text-4xl sm:text-5xl"
          style={{ animationDelay: "250ms" }}
        >
          DeepShield
        </div>

        <p
          className="intro-fade mt-4 max-w-md text-balance text-sm text-muted-foreground sm:text-base"
          style={{ animationDelay: "900ms" }}
        >
          Trust what you see. Verify what you don't.
        </p>

        <div
          className="intro-fade mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary"
          style={{ animationDelay: "1500ms" }}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> {STAGES[stage]}
        </div>

        {/* Boot progress */}
        <div className="mt-5 h-1 w-56 overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
          />
        </div>

        <button
          onClick={finish}
          className="intro-fade mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90"
          style={{ animationDelay: "1800ms" }}
        >
          <ShieldCheck className="h-4 w-4" /> Enter dashboard
        </button>
      </div>

      <label className="absolute bottom-8 left-6 flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground sm:bottom-10 sm:left-10">
        <input
          type="checkbox"
          checked={dontShow}
          onChange={(e) => setDontShow(e.target.checked)}
          className="h-3.5 w-3.5 accent-[var(--color-primary)]"
        />
        Don&apos;t show this again
      </label>

      <button
        onClick={finish}
        className="absolute bottom-8 right-6 rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary sm:bottom-10 sm:right-10"
      >
        Skip intro
      </button>
    </div>
  );
}

/** Session-scoped gate so the opener plays once per visit, not per navigation. */
export function useIntro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const disabled = window.localStorage.getItem(DISABLED_KEY) === "1";
      if (!disabled && !window.sessionStorage.getItem(SESSION_KEY)) setShow(true);
    } catch {
      /* storage blocked — skip the intro rather than risking a loop */
    }
  }, []);

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return { show, dismiss };
}
