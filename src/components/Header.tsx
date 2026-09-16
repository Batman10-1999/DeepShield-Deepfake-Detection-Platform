import { ChevronDown, LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, displayName, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 mb-7">
      <div className="min-w-0">
        <h1 className="brand-wordmark text-4xl md:text-5xl leading-none">DeepShield</h1>
        <p className="mt-2.5 text-sm text-muted-foreground max-w-xl leading-relaxed">
          A Multi-Modal AI System for Deepfake Detection and Trust Verification
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="h-10 pl-1 pr-3 rounded-full bg-card border border-border flex items-center gap-2 shadow-[var(--shadow-card)] hover:border-primary/40 transition-colors"
          >
            <span className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <span className="max-w-[140px] truncate text-sm font-medium text-foreground">
              {displayName || "Account"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {open && (
            <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="border-b border-border px-3 py-3">
                <div className="truncate text-sm font-semibold text-foreground">
                  {displayName || "Signed in"}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">{user?.email}</div>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-destructive"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
