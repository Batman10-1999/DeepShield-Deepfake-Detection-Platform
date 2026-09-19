import { j as jsxRuntimeExports } from "../_libs/react.mjs";
function SectionCard({
  step,
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
  className = ""
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: `surface-card flex h-full flex-col p-6 animate-fade-in-up ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 pb-4 mb-5 border-b border-border/70", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-10 w-10 shrink-0 rounded-xl bg-accent flex items-center justify-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-[18px] w-[18px] text-primary" }),
        step !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-[var(--shadow-card)]", children: step })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "truncate text-[15px] font-semibold leading-tight tracking-tight text-foreground", children: title }),
        subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-xs leading-relaxed text-muted-foreground", children: subtitle })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0", children: badge })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-0 flex-1 flex-col", children })
  ] });
}
export {
  SectionCard as S
};
