import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, e as useRouterState, O as Outlet, L as Link } from "../_libs/tanstack__react-router.mjs";
import { l as logoUrl } from "./deepshield-logo-BbcsavlP.mjs";
import { u as useAuth } from "./router-BhrJ7AGX.mjs";
import { b as LoaderCircle, S as ShieldCheck, P as PanelLeftOpen, c as PanelLeftClose, d as LayoutDashboard, F as FileCheckCorner, H as History, e as Settings, U as User, C as ChevronDown, f as LogOut } from "../_libs/lucide-react.mjs";

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
const COLLAPSED_KEY = "deepshield.sidebar.collapsed";
const groups = [
  {
    label: "Overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard", to: "/" }]
  },
  {
    label: "Records",
    items: [
      { icon: FileCheckCorner, label: "Verification Certificate", to: "/certificate" },
      { icon: History, label: "Analysis History", to: "/history" }
    ]
  },
  {
    label: "System",
    items: [{ icon: Settings, label: "Settings", to: "/settings" }]
  }
];
function Sidebar() {
  const [collapsed, setCollapsed] = reactExports.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  reactExports.useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSED_KEY) === "1");
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      window.localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1");
      return !c;
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "aside",
    {
      className: `sidebar-surface sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/70 transition-[width] duration-300 ease-out md:flex ${collapsed ? "w-[5.5rem]" : "w-[17rem]"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2.5 px-4 pt-7 pb-6 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: logoUrl,
              alt: "DeepShield",
              className: `logo-glow object-contain transition-all duration-300 ${collapsed ? "h-10 w-10" : "h-[4.5rem] w-[4.5rem]"}`
            }
          ),
          !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "brand-wordmark text-2xl leading-none", children: "DeepShield" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground", children: "Trust Platform" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `px-4 pb-4 flex ${collapsed ? "justify-center" : "justify-end"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: toggle,
            "aria-label": collapsed ? "Expand sidebar" : "Collapse sidebar",
            "aria-pressed": collapsed,
            title: collapsed ? "Expand sidebar" : "Collapse sidebar",
            className: "h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-hover transition-colors",
            children: collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx(PanelLeftOpen, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(PanelLeftClose, { className: "h-4 w-4" })
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex-1 overflow-y-auto px-3 pb-4", children: groups.map((group, gi) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: gi === 0 ? "" : "mt-5", children: [
          !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "section-label px-3 pb-2", children: group.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1", children: group.items.map((it) => {
            const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Link,
              {
                to: it.to,
                title: collapsed ? it.label : void 0,
                "aria-current": active ? "page" : void 0,
                className: `nav-item ${active ? "nav-item-active font-semibold" : ""} ${collapsed ? "justify-center px-0" : ""}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    it.icon,
                    {
                      className: "h-[18px] w-[18px] shrink-0",
                      strokeWidth: active ? 2.3 : 1.9
                    }
                  ),
                  !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: it.label })
                ]
              },
              it.to
            );
          }) })
        ] }, group.label)) })
      ]
    }
  );
}
function Header() {
  const { user, displayName, signOut } = useAuth();
  const [open, setOpen] = reactExports.useState(false);
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 mb-7", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "brand-wordmark text-4xl md:text-5xl leading-none", children: "DeepShield" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2.5 text-sm text-muted-foreground max-w-xl leading-relaxed", children: "A Multi-Modal AI System for Deepfake Detection and Trust Verification" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", ref, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setOpen((v) => !v),
          "aria-expanded": open,
          className: "h-10 pl-1 pr-3 rounded-full bg-card border border-border flex items-center gap-2 shadow-[var(--shadow-card)] hover:border-primary/40 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-7 w-7 rounded-full bg-secondary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3.5 w-3.5 text-muted-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[140px] truncate text-sm font-medium text-foreground", children: displayName || "Account" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3.5 w-3.5 text-muted-foreground" })
          ]
        }
      ),
      open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border px-3 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-sm font-semibold text-foreground", children: displayName || "Signed in" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[11px] text-muted-foreground", children: user?.email })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              setOpen(false);
              void signOut();
            },
            className: "flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-destructive",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
              " Sign out"
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
const SESSION_KEY = "deepshield.intro.seen";
const DISABLED_KEY = "deepshield.intro.disabled";
const DURATION = 5200;
const STAGES = [
  "Initializing secure workspace",
  "Loading detection models",
  "Calibrating trust engine",
  "Workspace ready"
];
function IntroExperience({ onDone }) {
  const [leaving, setLeaving] = reactExports.useState(false);
  const [stage, setStage] = reactExports.useState(0);
  const [dontShow, setDontShow] = reactExports.useState(false);
  const particles = reactExports.useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({
      id: i,
      left: `${i * 37 % 100}%`,
      top: `${i * 61 % 100}%`,
      size: 2 + i * 7 % 4,
      dx: `${(i % 5 - 2) * 26}px`,
      dy: `${-40 - i * 13 % 90}px`,
      delay: `${i % 9 * 260}ms`,
      duration: `${3200 + i * 191 % 2600}ms`
    })),
    []
  );
  const finish = () => {
    if (leaving) return;
    if (dontShow) {
      try {
        window.localStorage.setItem(DISABLED_KEY, "1");
      } catch {
      }
    }
    setLeaving(true);
    window.setTimeout(onDone, 520);
  };
  reactExports.useEffect(() => {
    const steps = STAGES.map(
      (_, i) => window.setTimeout(() => setStage(i), i * (DURATION / STAGES.length))
    );
    const t = window.setTimeout(finish, DURATION);
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Enter") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      steps.forEach(window.clearTimeout);
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      role: "dialog",
      "aria-label": "DeepShield introduction",
      className: `fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background transition-opacity duration-500 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(700px_420px_at_50%_45%,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent_70%)]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0", children: particles.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "absolute rounded-full bg-primary/70",
            style: {
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              // @ts-expect-error custom properties drive the CSS keyframes
              "--dx": p.dx,
              "--dy": p.dy,
              animation: `intro-drift ${p.duration} linear ${p.delay} infinite`
            }
          },
          p.id
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-x-0 h-24 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--color-primary)_30%,transparent),transparent)]",
            style: { animation: "intro-scan 2.4s ease-in-out 0.35s 2" }
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-col items-center px-6 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-6 flex h-32 w-32 items-center justify-center", children: [
            [0, 1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "absolute h-24 w-24 rounded-full border border-primary/50",
                style: { animation: `intro-pulse 2.6s ease-out ${i * 0.6}s infinite` }
              },
              i
            )),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: logoUrl,
                alt: "DeepShield",
                className: "logo-glow intro-fade relative h-24 w-24 object-contain"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "brand-wordmark intro-fade text-4xl sm:text-5xl",
              style: { animationDelay: "250ms" },
              children: "DeepShield"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              className: "intro-fade mt-4 max-w-md text-balance text-sm text-muted-foreground sm:text-base",
              style: { animationDelay: "900ms" },
              children: "Trust what you see. Verify what you don't."
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "intro-fade mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary",
              style: { animationDelay: "1500ms" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3.5 w-3.5" }),
                " ",
                STAGES[stage]
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 h-1 w-56 overflow-hidden rounded-full bg-border/60", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
              style: { width: `${(stage + 1) / STAGES.length * 100}%` }
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: finish,
              className: "intro-fade mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90",
              style: { animationDelay: "1800ms" },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4" }),
                " Enter dashboard"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "absolute bottom-8 left-6 flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground sm:bottom-10 sm:left-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              checked: dontShow,
              onChange: (e) => setDontShow(e.target.checked),
              className: "h-3.5 w-3.5 accent-[var(--color-primary)]"
            }
          ),
          "Don't show this again"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: finish,
            className: "absolute bottom-8 right-6 rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary sm:bottom-10 sm:right-10",
            children: "Skip intro"
          }
        )
      ]
    }
  );
}
function useIntro() {
  const [show, setShow] = reactExports.useState(false);
  reactExports.useEffect(() => {
    try {
      const disabled = window.localStorage.getItem(DISABLED_KEY) === "1";
      if (!disabled && !window.sessionStorage.getItem(SESSION_KEY)) setShow(true);
    } catch {
    }
  }, []);
  const dismiss = () => {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
    }
    setShow(false);
  };
  return { show, dismiss };
}
function AuthenticatedLayout() {
  const {
    user,
    loading
  } = useAuth();
  const intro = useIntro();
  const navigate = useNavigate();
  const initialHref = useRouterState({
    select: (s) => s.location.href
  });
  const intended = reactExports.useRef(initialHref);
  const redirected = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (loading || user || redirected.current) return;
    redirected.current = true;
    const target = intended.current.startsWith("/auth") ? "/" : intended.current;
    void navigate({
      to: "/auth",
      search: {
        redirect: target
      },
      replace: true
    });
  }, [loading, user, navigate]);
  if (loading || !user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
      " Checking your session…"
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen", children: [
    intro.show && /* @__PURE__ */ jsxRuntimeExports.jsx(IntroExperience, { onDone: intro.dismiss }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto w-full max-w-[1600px] flex-1 px-5 py-6 md:px-8 md:py-7", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {})
    ] })
  ] });
}
export {
  AuthenticatedLayout as component
};
