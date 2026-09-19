import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { S as SectionCard } from "./SectionCard-C9B8xn4y.mjs";
import { b as useAnalysisHistory, d as analysisStore } from "./router-BhrJ7AGX.mjs";
import { H as History, g as Upload, V as Trash2, h as CircleCheck, p as CircleX } from "../_libs/lucide-react.mjs";

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
function verdictBadge(pred) {
  return pred === "REAL" ? {
    icon: CircleCheck,
    cls: "bg-foreground/10 text-foreground"
  } : {
    icon: CircleX,
    cls: "bg-muted text-muted-foreground"
  };
}
function HistoryPage() {
  const history = useAnalysisHistory();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { icon: History, title: "Analysis History", badge: history.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
    if (confirm("Clear all analysis history?")) analysisStore.clear();
  }, className: "inline-flex items-center gap-1 rounded-full bg-secondary text-muted-foreground hover:text-destructive px-2.5 py-1 text-[11px] font-semibold transition-colors", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }),
    " Clear"
  ] }) : void 0, children: history.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center gap-4 py-10 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-6 w-6 text-muted-foreground" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-base font-semibold text-foreground", children: "No history yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground max-w-sm", children: "Your analyses will appear here after you run detection." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
      " Analyze on Dashboard"
    ] })
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 px-3 font-semibold", children: "File" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 px-3 font-semibold", children: "Verdict" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 px-3 font-semibold", children: "Confidence" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 px-3 font-semibold", children: "Authenticity" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 px-3 font-semibold", children: "Certificate ID" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 px-3 font-semibold", children: "When" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2.5 px-3 font-semibold text-right", children: "Actions" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: history.map((h) => {
      const {
        icon: Icon,
        cls
      } = verdictBadge(h.prediction);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/60 hover:bg-secondary/50 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          h.previewDataUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: h.previewDataUrl, alt: "", className: "h-9 w-9 rounded-md object-cover border border-border" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-md bg-secondary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-foreground truncate max-w-[220px]", children: h.fileName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: h.fileType ?? "—" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-3 px-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3 w-3" }),
            " ",
            h.prediction
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground mt-1", children: h.verificationStatus })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-3 px-3 tabular-nums text-foreground", children: [
          h.modelConfidence.toFixed(1),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-3 px-3 tabular-nums text-foreground", children: [
          h.authenticityScore.toFixed(0),
          "/100"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-3 font-mono text-[11px] text-muted-foreground", children: h.certificateId }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-3 text-muted-foreground", children: new Date(h.analyzedAt).toLocaleString() }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/certificate", search: {
          id: h.certificateId
        }, className: "inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 text-[11px] font-semibold transition-colors", children: "View" }) })
      ] }, h.id);
    }) })
  ] }) }) });
}
export {
  HistoryPage as component
};
