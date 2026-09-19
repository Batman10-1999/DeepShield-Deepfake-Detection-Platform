import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { S as SectionCard } from "./SectionCard-C9B8xn4y.mjs";
import { C as CertificateCard } from "./CertificateCard-B0ojZzQd.mjs";
import { f as Route, b as useAnalysisHistory, g as useLatestAnalysis, d as analysisStore } from "./router-BhrJ7AGX.mjs";
import "../_libs/qrcode.mjs";
import "../_libs/jspdf.mjs";
import { S as ShieldCheck, g as Upload, W as ArrowLeft } from "../_libs/lucide-react.mjs";

import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/unenv.mjs";


import "../_libs/seroval-plugins.mjs";


import "../_libs/react-dom.mjs";
import "../_libs/isbot.mjs";
import "./deepshield-logo-BbcsavlP.mjs";
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
import "../_libs/dijkstrajs.mjs";

import "../_libs/pngjs.mjs";



import "../_libs/babel__runtime.mjs";
import "../_libs/fflate.mjs";
import "../_libs/fast-png.mjs";
import "../_libs/iobuffer.mjs";
import "../_libs/pako.mjs";
function CertificatePage() {
  const {
    id
  } = Route.useSearch();
  useAnalysisHistory();
  const latest = useLatestAnalysis();
  const entry = id ? analysisStore.byCertificateId(id) : latest;
  if (!entry) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { icon: ShieldCheck, title: "Verification Certificate", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center gap-4 py-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-6 w-6 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-base font-semibold text-foreground", children: id ? "Certificate not found" : "No analysis yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground max-w-sm", children: id ? "This certificate ID is not in your local history." : "Run a deepfake analysis to generate your first verification certificate." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
        " Analyze on Dashboard"
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCard, { icon: ShieldCheck, title: "Verification Certificate", badge: id ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/history", className: "inline-flex items-center gap-1 rounded-full bg-secondary text-muted-foreground hover:text-primary px-2.5 py-1 text-[11px] font-semibold transition-colors", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3 w-3" }),
    " History"
  ] }) : void 0, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CertificateCard, { entry, full: true }) });
}
export {
  CertificatePage as component
};
