import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, R as Route$5, s as setRememberSession, a as supabase } from "./router-BhrJ7AGX.mjs";
import { l as logoUrl } from "./deepshield-logo-BbcsavlP.mjs";
import { U as User, M as Mail, L as Lock, E as EyeOff, a as Eye, b as LoaderCircle, S as ShieldCheck } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/unenv.mjs";


import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/tslib.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/zod.mjs";
function passwordStrength(value) {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  if (!value) return {
    label: "",
    score: 0
  };
  if (score <= 2) return {
    label: "Weak",
    score: 1
  };
  if (score <= 3) return {
    label: "Medium",
    score: 2
  };
  return {
    label: "Strong",
    score: 3
  };
}
function safePath(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
function AuthPage() {
  const {
    user,
    loading
  } = useAuth();
  const {
    redirect
  } = Route$5.useSearch();
  const navigate = useNavigate();
  const target = safePath(redirect);
  const [mode, setMode] = reactExports.useState("signin");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [displayName, setDisplayName] = reactExports.useState("");
  const [remember, setRemember] = reactExports.useState(true);
  const [busy, setBusy] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [notice, setNotice] = reactExports.useState(null);
  const [showPassword, setShowPassword] = reactExports.useState(false);
  const strength = passwordStrength(password);
  reactExports.useEffect(() => {
    if (!loading && user) void navigate({
      to: target,
      replace: true
    });
  }, [loading, user, navigate, target]);
  const submit = async (e) => {
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
    setRememberSession(remember);
    try {
      if (mode === "signup") {
        const {
          error: err
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${target}`,
            data: {
              display_name: displayName.trim() || email.split("@")[0]
            }
          }
        });
        if (err) throw err;
        setNotice("Account created. Signing you in…");
      } else {
        const {
          error: err
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (err) throw err;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setError(/invalid login credentials/i.test(message) ? "That email and password combination is not correct." : /already registered/i.test(message) ? "An account with this email already exists. Sign in instead." : message);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4 py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-col items-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logoUrl, alt: "DeepShield", className: "h-12 w-12 rounded-xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "brand-wordmark mt-3 text-3xl leading-none", children: "DeepShield" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-sm text-sm text-muted-foreground", children: "Sign in to run deepfake detection and keep your verification certificates private to your account." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-5 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1", children: ["signin", "signup"].map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
        setMode(m);
        setError(null);
        setNotice(null);
      }, className: `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === m ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground"}`, children: m === "signin" ? "Sign in" : "Create account" }, m)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "flex flex-col gap-3", children: [
        mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground", children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: displayName, onChange: (e) => setDisplayName(e.target.value), placeholder: "Your name", autoComplete: "name", className: "w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@company.com", autoComplete: "email", className: "w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground", children: "Password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: showPassword ? "text" : "password", required: true, minLength: 8, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "At least 8 characters", autoComplete: mode === "signup" ? "new-password" : "current-password", className: "w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary/60" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowPassword((v) => !v), "aria-label": showPassword ? "Hide password" : "Show password", className: "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground", children: showPassword ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) })
          ] }),
          password && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-1 flex-1 gap-1", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-1 flex-1 rounded-full ${i <= strength.score ? "bg-primary" : "bg-secondary"}` }, i)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-semibold text-muted-foreground", children: strength.label })
          ] })
        ] }),
        mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground", children: "Confirm password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: showPassword ? "text" : "password", required: true, minLength: 8, value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "Re-enter your password", autoComplete: "new-password", className: "w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary/60" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-1 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: remember, onChange: (e) => setRemember(e.target.checked), className: "h-4 w-4 accent-[var(--color-primary)]" }),
          "Remember me on this device"
        ] }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive", children: error }),
        notice && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary", children: notice }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: busy, className: "mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60", children: [
          busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4" }),
          mode === "signin" ? "Sign in" : "Create account"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-center text-[11px] leading-relaxed text-muted-foreground", children: "Your analyses, history and certificates are private to your account and are never shared with other users." })
  ] }) });
}
export {
  AuthPage as component
};
