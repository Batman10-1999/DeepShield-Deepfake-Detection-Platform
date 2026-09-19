import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { c as createRouter, u as useRouter, a as createRootRoute, b as createFileRoute, l as lazyRouteComponent, H as HeadContent, S as Scripts, O as Outlet, L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";

import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/unenv.mjs";


import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/tslib.mjs";
import "../_libs/supabase__functions-js.mjs";
function brokeredPreviewStorage() {
  if (typeof window === "undefined") return void 0;
  const host = location.hostname;
  const PREVIEW_ZONES = ["lovableproject.com", "lovableproject-dev.com", "lovable.app", "gpt-eng.com", "gptengineer.run"];
  const onPreviewZone = PREVIEW_ZONES.some((z2) => host === z2 || host.endsWith("." + z2));
  const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  const projectId = onPreviewZone ? host.match(new RegExp("^(?:id-preview(?:-[a-z0-9]+)?|project)--(" + UUID + ")(?:-dev)?(?=\\.|$)", "i"))?.[1] ?? host.match(new RegExp("^(" + UUID + ")(?=[.-])", "i"))?.[1] : void 0;
  const framed = window.parent && window.parent !== window;
  if (!projectId || !framed) return localStorage;
  const dev = host.endsWith(".lovableproject-dev.com") || host.endsWith(".gpt-eng.com");
  const EDITOR = dev ? /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$|^http:\/\/localhost:3000$/ : /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$/;
  const ancestor = location.ancestorOrigins && location.ancestorOrigins[0] || (document.referrer ? new URL(document.referrer).origin : "");
  const editorOrigins = ancestor && EDITOR.test(ancestor) ? [ancestor] : dev ? ["https://lovable.dev", "http://localhost:3000"] : ["https://lovable.dev"];
  const RESULT = "lovable-preview-auth:result";
  const TIMEOUT = 2e3;
  const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  const request = (type, key, value) => new Promise((resolve) => {
    const requestId = newId();
    let done = false;
    let timer;
    const finish = (r) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(r);
    };
    const onMessage = (e) => {
      if (editorOrigins.indexOf(e.origin) < 0) return;
      const d = e.data;
      if (d && d.type === RESULT && d.requestId === requestId) finish(d);
    };
    window.addEventListener("message", onMessage);
    const msg = { type, requestId, projectId, key };
    if (value !== void 0) msg["value"] = value;
    for (const origin of editorOrigins) window.parent.postMessage(msg, origin);
    timer = setTimeout(() => finish(null), TIMEOUT);
  });
  let firstGet = true;
  const RETRY_DELAY = 250;
  return {
    getItem: async (key) => {
      let res = await request("lovable-preview-auth:get", key);
      if (!res && firstGet) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        res = await request("lovable-preview-auth:get", key);
      }
      firstGet = false;
      if (res && res.ok && typeof res.value === "string") {
        if (res.value === "") {
          localStorage.removeItem(key);
          return null;
        }
        return res.value;
      }
      return localStorage.getItem(key);
    },
    setItem: (key, value) => {
      localStorage.setItem(key, value);
      return request("lovable-preview-auth:set", key, value).then(() => void 0);
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
      return request("lovable-preview-auth:remove", key).then(() => void 0);
    }
  };
}
function isNewSupabaseApiKey(value) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}
function createSupabaseFetch(supabaseKey) {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : void 0
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}
function createSupabaseClient() {
  const SUPABASE_URL = "https://vzzjjhvnobcqfybhorys.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rg7Z-lbECZRymax0Q2_Bpw_KgC8Babm";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY)
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
function generateCertificateId(date = /* @__PURE__ */ new Date()) {
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DS-${y}${m}${d}-${hh}${mm}${ss}-${rand}`;
}
function determineVerificationStatus(result) {
  const isReal = String(result.prediction).toUpperCase() === "REAL";
  return isReal ? {
    status: "Verified Authentic",
    tone: "success",
    description: "Media passed DeepShield's authenticity checks."
  } : {
    status: "Potential Deepfake",
    tone: "danger",
    description: "Media shows indicators of AI manipulation."
  };
}
function coerceVerificationStatus(status, prediction) {
  if (status === "Verified Authentic" || status === "Potential Deepfake") return status;
  return String(prediction ?? "").toUpperCase() === "REAL" ? "Verified Authentic" : "Potential Deepfake";
}
function buildVerificationUrl(certificateId) {
  const origin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "https://deepshield.app";
  return `${origin}/certificate?id=${encodeURIComponent(certificateId)}`;
}
const MAX_ENTRIES = 50;
const listeners = /* @__PURE__ */ new Set();
let userId = null;
let cache = [];
let currentId = null;
function historyKey() {
  return `deepshield.history.v1:${userId ?? "anon"}`;
}
function currentKey() {
  return `deepshield.current.v1:${userId ?? "anon"}`;
}
function notify() {
  listeners.forEach((l) => l());
}
function normalizeEntry(e) {
  const when = e.analyzedAt ? new Date(e.analyzedAt) : /* @__PURE__ */ new Date();
  const certificateId = e.certificateId ?? generateCertificateId(when);
  const prediction = String(e.prediction ?? e.result?.prediction ?? "FAKE").toUpperCase();
  const binaryPrediction = prediction === "REAL" ? "REAL" : "FAKE";
  return {
    ...e,
    certificateId,
    prediction: binaryPrediction,
    verificationStatus: coerceVerificationStatus(e.verificationStatus, binaryPrediction)
  };
}
function readLocal() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(historyKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.map(normalizeEntry);
  } catch {
    return [];
  }
}
function writeLocal(next) {
  if (typeof window === "undefined") return;
  const attempts = [
    next,
    next.map((e, i) => i === 0 ? e : { ...e, previewDataUrl: null }),
    next.slice(0, 10).map((e, i) => i === 0 ? e : { ...e, previewDataUrl: null })
  ];
  for (const candidate of attempts) {
    try {
      window.localStorage.setItem(historyKey(), JSON.stringify(candidate));
      return;
    } catch {
    }
  }
}
function persist(next) {
  cache = next;
  writeLocal(next);
  notify();
}
function writeCurrentId(id) {
  currentId = id;
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(currentKey(), id);
    else window.localStorage.removeItem(currentKey());
  } catch {
  }
}
function readCurrentId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(currentKey());
  } catch {
    return null;
  }
}
async function syncFromCloud() {
  if (!userId) return;
  const scoped = userId;
  const { data, error } = await supabase.from("analyses").select(
    "id, certificate_id, file_name, file_type, prediction, verification_status, model_confidence, authenticity_score, analyzed_at, result"
  ).order("analyzed_at", { ascending: false }).limit(MAX_ENTRIES);
  if (error || !data || scoped !== userId) return;
  const previews = new Map(cache.map((e) => [e.certificateId, e.previewDataUrl]));
  const merged = data.map(
    (row) => normalizeEntry({
      id: row.id,
      certificateId: row.certificate_id,
      verificationStatus: row.verification_status,
      fileName: row.file_name,
      fileType: row.file_type,
      prediction: row.prediction,
      modelConfidence: Number(row.model_confidence),
      authenticityScore: Number(row.authenticity_score),
      analyzedAt: new Date(row.analyzed_at).toISOString(),
      previewDataUrl: previews.get(row.certificate_id) ?? null,
      result: row.result
    })
  );
  persist(merged);
}
async function pushToCloud(entry) {
  if (!userId) return;
  const { error } = await supabase.from("analyses").insert({
    id: entry.id,
    user_id: userId,
    certificate_id: entry.certificateId,
    file_name: entry.fileName,
    file_type: entry.fileType,
    prediction: entry.prediction,
    verification_status: entry.verificationStatus,
    model_confidence: entry.modelConfidence,
    authenticity_score: entry.authenticityScore,
    analyzed_at: entry.analyzedAt,
    result: entry.result
  });
  if (error) console.error("Failed to save analysis to the backend:", error.message);
}
function buildAnalysisEntry(input) {
  const when = input.analyzedAt ?? (input.result.timestamp ? new Date(input.result.timestamp) : /* @__PURE__ */ new Date());
  const badge = determineVerificationStatus(input.result);
  const certificateId = input.result.certificateId ?? generateCertificateId(when);
  return {
    id: crypto.randomUUID(),
    certificateId,
    verificationStatus: badge.status,
    fileName: input.fileName,
    fileType: input.fileType,
    prediction: String(input.result.prediction).toUpperCase(),
    modelConfidence: input.result.modelConfidence,
    authenticityScore: input.result.authenticityScore,
    analyzedAt: when.toISOString(),
    previewDataUrl: input.previewDataUrl,
    result: input.result
  };
}
const analysisStore = {
  /** Rebinds the store to the signed-in user; clears everything on sign-out. */
  setUser(id) {
    if (id === userId) return;
    userId = id;
    if (!id) {
      cache = [];
      currentId = null;
      notify();
      return;
    }
    cache = readLocal();
    currentId = readCurrentId();
    notify();
    void syncFromCloud();
  },
  all() {
    return cache;
  },
  latest() {
    return cache[0] ?? null;
  },
  byCertificateId(id) {
    return cache.find((e) => e.certificateId === id) ?? null;
  },
  /** The analysis currently pinned to the dashboard, if it still exists. */
  current() {
    if (!currentId) return null;
    return cache.find((e) => e.id === currentId) ?? null;
  },
  /** Adds an entry to history and pins it as the current dashboard analysis. */
  add(entry) {
    writeCurrentId(entry.id);
    persist([entry, ...cache].slice(0, MAX_ENTRIES));
    void pushToCloud(entry);
  },
  /** Pins an existing history entry to the dashboard. */
  setCurrent(id) {
    writeCurrentId(id);
    notify();
  },
  /** Clears only the dashboard analysis — history is untouched. */
  clearCurrent() {
    writeCurrentId(null);
    notify();
  },
  /** Clears history (explicit user action) and the current pin with it. */
  clear() {
    writeCurrentId(null);
    persist([]);
    if (userId) {
      void supabase.from("analyses").delete().eq("user_id", userId).then(({ error }) => {
        if (error) console.error("Failed to clear cloud history:", error.message);
      });
    }
  },
  subscribe(l) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }
};
const EMPTY = [];
function useAnalysisHistory() {
  return reactExports.useSyncExternalStore(
    analysisStore.subscribe,
    () => cache,
    () => EMPTY
  );
}
function useLatestAnalysis() {
  const all = useAnalysisHistory();
  return all[0] ?? null;
}
function useCurrentAnalysis() {
  return reactExports.useSyncExternalStore(
    analysisStore.subscribe,
    () => analysisStore.current(),
    () => null
  );
}
const REMEMBER_KEY = "deepshield.auth.remember";
const BROWSER_SESSION_KEY = "deepshield.auth.browser-session";
function setRememberSession(remember) {
  try {
    window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    window.sessionStorage.setItem(BROWSER_SESSION_KEY, "1");
  } catch {
  }
}
function isRememberSession() {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) !== "0";
  } catch {
    return true;
  }
}
function shouldDiscardStoredSession() {
  if (isRememberSession()) return false;
  try {
    const sameBrowserSession = window.sessionStorage.getItem(BROWSER_SESSION_KEY) === "1";
    window.sessionStorage.setItem(BROWSER_SESSION_KEY, "1");
    return !sameBrowserSession;
  } catch {
    return false;
  }
}
function clearRememberSession() {
  try {
    window.localStorage.removeItem(REMEMBER_KEY);
    window.sessionStorage.removeItem(BROWSER_SESSION_KEY);
  } catch {
  }
}
const AuthContext = reactExports.createContext({
  session: null,
  user: null,
  displayName: "",
  loading: true,
  signOut: async () => {
  }
});
function AuthProvider({ children }) {
  const [session, setSession] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
      analysisStore.setUser(next?.user?.id ?? null);
    });
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session && shouldDiscardStoredSession()) {
        await supabase.auth.signOut();
        setSession(null);
        setLoading(false);
        analysisStore.setUser(null);
        return;
      }
      setSession(data.session);
      setLoading(false);
      analysisStore.setUser(data.session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  const value = reactExports.useMemo(() => {
    const user = session?.user ?? null;
    const meta = user?.user_metadata ?? {};
    const displayName = typeof meta["display_name"] === "string" && meta["display_name"] || typeof meta["full_name"] === "string" && meta["full_name"] || (user?.email ? user.email.split("@")[0] : "") || "";
    return {
      session,
      user,
      displayName,
      loading,
      signOut: async () => {
        analysisStore.setUser(null);
        clearRememberSession();
        await supabase.auth.signOut();
      }
    };
  }, [session, loading]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthContext.Provider, { value, children });
}
function useAuth() {
  return reactExports.useContext(AuthContext);
}
const appCss = "/assets/styles-D8irOD2V.css";
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
const Route$6 = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DeepShield – Deepfake Detection & Trust Verification" },
      {
        name: "description",
        content: "DeepShield is an AI system that detects deepfakes in images and video and issues verification certificates."
      },
      { property: "og:title", content: "DeepShield – Deepfake Detection & Trust Verification" },
      {
        property: "og:description",
        content: "AI system for image and video deepfake detection and trust verification."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@1,700;1,800;1,900&family=Inter:wght@400;500;600;700&display=swap"
      }
    ],
    scripts: [
      {
        // Applies the persisted theme before first paint to avoid a flash.
        children: `(function(){try{var t=localStorage.getItem("deepshield.theme");var d=t!=="light";document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", suppressHydrationWarning: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) });
}
const $$splitComponentImporter$5 = () => import("./auth-DbdE8oCU.mjs");
const search$1 = objectType({
  redirect: stringType().optional()
});
const Route$5 = createFileRoute("/auth")({
  validateSearch: search$1,
  component: lazyRouteComponent($$splitComponentImporter$5, "component"),
  head: () => ({
    meta: [{
      title: "Sign in — DeepShield"
    }, {
      name: "description",
      content: "Sign in to DeepShield to run deepfake analyses and access your private verification certificates."
    }, {
      property: "og:title",
      content: "Sign in to DeepShield"
    }, {
      property: "og:description",
      content: "Secure access to your private deepfake analysis history and verification certificates."
    }, {
      property: "og:type",
      content: "website"
    }, {
      name: "twitter:card",
      content: "summary"
    }]
  })
});
const $$splitComponentImporter$4 = () => import("./route-Dp-Ul79U.mjs");
const Route$4 = createFileRoute("/_authenticated")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./index-Cq3V_cbr.mjs");
const Route$3 = createFileRoute("/_authenticated/")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component"),
  head: () => ({
    meta: [{
      title: "Dashboard — DeepShield"
    }, {
      name: "description",
      content: "Run deepfake detection and view results, explainability and verification certificates."
    }, {
      property: "og:title",
      content: "DeepShield Dashboard — Deepfake Detection"
    }, {
      property: "og:description",
      content: "Upload media, get a binary REAL/FAKE verdict, Grad-CAM evidence and a verification certificate."
    }, {
      property: "og:type",
      content: "website"
    }, {
      name: "twitter:card",
      content: "summary"
    }]
  })
});
const $$splitComponentImporter$2 = () => import("./settings-cNxsesnP.mjs");
const Route$2 = createFileRoute("/_authenticated/settings")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component"),
  head: () => ({
    meta: [{
      title: "Settings — DeepShield"
    }, {
      name: "description",
      content: "Manage DeepShield appearance, your account and stored analysis history."
    }, {
      property: "og:title",
      content: "DeepShield Settings"
    }, {
      property: "og:description",
      content: "Appearance, account and data controls."
    }, {
      property: "og:type",
      content: "website"
    }, {
      name: "twitter:card",
      content: "summary"
    }]
  })
});
const $$splitComponentImporter$1 = () => import("./history-zwsbhDSr.mjs");
const Route$1 = createFileRoute("/_authenticated/history")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component"),
  head: () => ({
    meta: [{
      title: "Analysis History — DeepShield"
    }, {
      name: "description",
      content: "Review previous DeepShield deepfake detection analyses."
    }, {
      property: "og:title",
      content: "Analysis History — DeepShield"
    }, {
      property: "og:description",
      content: "Browse every DeepShield analysis with verdicts, confidence and certificates."
    }, {
      property: "og:type",
      content: "website"
    }, {
      name: "twitter:card",
      content: "summary"
    }]
  })
});
const $$splitComponentImporter = () => import("./certificate-CIvDCo0u.mjs");
const search = objectType({
  id: stringType().optional()
});
const Route = createFileRoute("/_authenticated/certificate")({
  validateSearch: search,
  component: lazyRouteComponent($$splitComponentImporter, "component"),
  head: () => ({
    meta: [{
      title: "Verification Certificate — DeepShield"
    }, {
      name: "description",
      content: "Download the DeepShield verification certificate for any analysis."
    }, {
      property: "og:title",
      content: "DeepShield Verification Certificate"
    }, {
      property: "og:description",
      content: "Tamper-evident PDF certificate with SHA-256 hash, verdict and confidence for each analysis."
    }, {
      property: "og:type",
      content: "website"
    }, {
      name: "twitter:card",
      content: "summary"
    }]
  })
});
const AuthRoute = Route$5.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$6
});
const AuthenticatedRouteRoute = Route$4.update({
  id: "/_authenticated",
  getParentRoute: () => Route$6
});
const AuthenticatedIndexRoute = Route$3.update({
  id: "/",
  path: "/",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedSettingsRoute = Route$2.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedHistoryRoute = Route$1.update({
  id: "/history",
  path: "/history",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedCertificateRoute = Route.update({
  id: "/certificate",
  path: "/certificate",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedRouteRouteChildren = {
  AuthenticatedCertificateRoute,
  AuthenticatedHistoryRoute,
  AuthenticatedSettingsRoute,
  AuthenticatedIndexRoute
};
const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren);
const rootRouteChildren = {
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AuthRoute
};
const routeTree = Route$6._addFileChildren(rootRouteChildren)._addFileTypes();
function DefaultErrorComponent({ error, reset }) {
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        className: "h-8 w-8 text-destructive",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: 2,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            d: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight text-foreground", children: "Something went wrong" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "An unexpected error occurred. Please try again." }),
    false,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$5 as R,
  supabase as a,
  useAnalysisHistory as b,
  useCurrentAnalysis as c,
  analysisStore as d,
  buildAnalysisEntry as e,
  Route as f,
  useLatestAnalysis as g,
  buildVerificationUrl as h,
  router as r,
  setRememberSession as s,
  useAuth as u
};
