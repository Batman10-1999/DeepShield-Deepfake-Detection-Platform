import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, ShieldCheck, Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { setRememberSession } from "@/lib/session";
import logo from "@/assets/deepshield-logo.png";

/** Informational only — a "Weak" score never blocks sign-up or sign-in. */
function passwordStrength(value: string): { label: string; score: number } {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  if (!value) return { label: "", score: 0 };
  if (score <= 2) return { label: "Weak", score: 1 };
  if (score <= 3) return { label: "Medium", score: 2 };
  return { label: "Strong", score: 3 };
}

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — DeepShield" },
      {
        name: "description",
        content:
          "Sign in to DeepShield to run deepfake analyses and access your private verification certificates.",
      },
      { property: "og:title", content: "Sign in to DeepShield" },
      {
        property: "og:description",
        content:
          "Secure access to your private deepfake analysis history and verification certificates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/** Only ever follow same-origin relative paths after authentication. */
function safePath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function AuthPage() {
  const { user, loading } = useAuth();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const target = safePath(redirect);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const strength = passwordStrength(password);

  useEffect(() => {
    if (!loading && user) void navigate({ to: target, replace: true });
  }, [loading, user, navigate, target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (password.length < 8) {
      setError("Please use a password of at least 8 characters.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    // Recorded before the auth call so the session listener applies the right
    // persistence policy the moment the session lands.
    setRememberSession(remember);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${target}`,
            data: { display_name: displayName.trim() || email.split("@")[0] },
          },
        });
        if (err) throw err;
        setNotice("Account created. Signing you in…");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setError(
        /invalid login credentials/i.test(message)
          ? "That email and password combination is not correct."
          : /already registered/i.test(message)
            ? "An account with this email already exists. Sign in instead."
            : message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="DeepShield" className="h-12 w-12 rounded-xl" />
          <h1 className="brand-wordmark mt-3 text-3xl leading-none">DeepShield</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Sign in to run deepfake detection and keep your verification certificates private to
            your account.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setNotice(null);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Name</span>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                  />
                </div>
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="flex items-center gap-2">
                  <div className="flex h-1 flex-1 gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i <= strength.score ? "bg-primary" : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {strength.label}
                  </span>
                </div>
              )}
            </label>

            {mode === "signup" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Confirm password
                </span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                  />
                </div>
              </label>
            )}

            <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Remember me on this device
            </label>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          Your analyses, history and certificates are private to your account and are never shared
          with other users.
        </p>
      </div>
    </div>
  );
}
