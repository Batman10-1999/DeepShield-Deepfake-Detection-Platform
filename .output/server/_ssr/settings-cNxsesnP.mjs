import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { S as SectionCard } from "./SectionCard-C9B8xn4y.mjs";
import { b as useAnalysisHistory, u as useAuth, d as analysisStore } from "./router-BhrJ7AGX.mjs";
import { N as Palette, Q as Sun, R as Moon, U as User, f as LogOut, V as Trash2 } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__react-router.mjs";
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
const THEME_STORAGE_KEY = "deepshield.theme";
const DEFAULT_THEME = "dark";
function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}
function readStored() {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : DEFAULT_THEME;
}
function useTheme() {
  const [theme, setThemeState] = reactExports.useState(DEFAULT_THEME);
  reactExports.useEffect(() => {
    const stored = readStored();
    setThemeState(stored);
    applyTheme(stored);
  }, []);
  const setTheme = reactExports.useCallback((next) => {
    setThemeState(next);
    applyTheme(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);
  return { theme, setTheme };
}
const THEMES = [{
  id: "light",
  label: "Light",
  hint: "Original DeepShield palette",
  icon: Sun
}, {
  id: "dark",
  label: "Dark",
  hint: "Black & white monochrome",
  icon: Moon
}];
function SettingsPage() {
  const history = useAnalysisHistory();
  const {
    theme,
    setTheme
  } = useTheme();
  const {
    user,
    displayName,
    signOut
  } = useAuth();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 lg:grid-cols-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { icon: Palette, title: "Appearance", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Choose how DeepShield looks. Your selection is remembered on this device." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "radiogroup", "aria-label": "Theme", className: "grid grid-cols-2 gap-3", children: THEMES.map((t) => {
        const active = theme === t.id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { role: "radio", "aria-checked": active, onClick: () => setTheme(t.id), className: `flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(t.icon, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold", children: t.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-[11px]", children: t.hint })
          ] })
        ] }, t.id);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { icon: User, title: "Account", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 border-b border-border py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-semibold text-foreground", children: displayName || "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-semibold text-foreground", children: user?.email ?? "—" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => void signOut(), className: "inline-flex items-center justify-center gap-2 self-start rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
        " Sign out"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { icon: Trash2, title: "Data & Privacy", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Analysis history and certificates are stored privately against your account and are never visible to other users. Clearing removes every saved prediction (",
        history.length,
        " ",
        "stored). Uploaded media itself is never persisted by DeepShield."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
        if (confirm("Clear all analysis history from your account?")) analysisStore.clear();
      }, disabled: history.length === 0, className: "inline-flex items-center justify-center gap-2 self-start rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }),
        " Clear analysis history"
      ] })
    ] }) })
  ] });
}
export {
  SettingsPage as component
};
