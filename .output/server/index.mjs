globalThis.__nitro_main__ = import.meta.url;
import "./_libs/unenv.mjs";

import { H as HookableCore } from "./_libs/hookable.mjs";
import { d as defineLazyEventHandler, H as HTTPError, a as H3Core } from "./_libs/h3.mjs";
import { d as FastResponse } from "./_libs/srvx.mjs";


import "./_libs/react.mjs";
import "./_libs/rou3.mjs";





function lazyService(loader) {
  let promise, mod;
  return {
    fetch(req) {
      if (mod) {
        return mod.fetch(req);
      }
      if (!promise) {
        promise = loader().then((_mod) => mod = _mod.default || _mod);
      }
      return promise.then((mod2) => mod2.fetch(req));
    }
  };
}
const services = {
  ["ssr"]: lazyService(() => import("./_ssr/index.mjs"))
};
globalThis.__nitro_vite_envs__ = services;
const assets = {
  "/assets/auth-BgaTlBaA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1fd8-3aBlompyWr/bnQ4pJtIK6wnPQLg"',
    "mtime": "2026-09-17T04:59:11.845Z",
    "size": 8152,
    "path": "../public/assets/auth-BgaTlBaA.js"
  },
  "/assets/certificate-C1Novf4E.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"708-thlmVpMgggW7Yl01btWYwfZHjhY"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 1800,
    "path": "../public/assets/certificate-C1Novf4E.js"
  },
  "/assets/createLucideIcon-B1C-mbrK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4b2-/+qKMvWUgkANMdnM0lHrF2DvK9I"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 1202,
    "path": "../public/assets/createLucideIcon-B1C-mbrK.js"
  },
  "/assets/deepshield-logo-oKHoHxj6.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"17c-uPCbOifKo8ELDDa6j44d/NEnAP8"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 380,
    "path": "../public/assets/deepshield-logo-oKHoHxj6.js"
  },
  "/assets/file-check-corner-CUSiBuCY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"147-JMwY4EXt2uihTz9yxZ5XOaaJdpo"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 327,
    "path": "../public/assets/file-check-corner-CUSiBuCY.js"
  },
  "/assets/history-DO34g5OI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f9-KizqSReLEjp+zSQfEP5CXg2NI0c"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 249,
    "path": "../public/assets/history-DO34g5OI.js"
  },
  "/assets/history-UhQossYF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"103d-KCT4i8OkQtXxeP3Q7EQUBrwFOSU"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 4157,
    "path": "../public/assets/history-UhQossYF.js"
  },
  "/assets/html2canvas.esm-DXEQVQnt.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"31151-TyUyRNm9rR2JDwpyAxcruTmmr6A"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 201041,
    "path": "../public/assets/html2canvas.esm-DXEQVQnt.js"
  },
  "/assets/CertificateCard-C4uxwVQb.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"67c22-uB44v+5Lpk2PK61/1ycTKsM4ow4"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 424994,
    "path": "../public/assets/CertificateCard-C4uxwVQb.js"
  },
  "/assets/index-C5-dnWje.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"150dd-GdyQ+jFvH4CEX8okgcwYs4Ax/Hw"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 86237,
    "path": "../public/assets/index-C5-dnWje.js"
  },
  "/assets/loader-circle-BurPXHpA.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"97-VB5jDLwOi5u2nysojZeniZFNuoQ"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 151,
    "path": "../public/assets/loader-circle-BurPXHpA.js"
  },
  "/assets/log-out-DFws4IOB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f2-OG3ZNDtXEbzqNVp0nCWHhXzUzYg"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 242,
    "path": "../public/assets/log-out-DFws4IOB.js"
  },
  "/assets/index.es-fwHWMuPu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"26d51-sRaj3eQA2VRo6qBM6d5gNy7f7hg"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 159057,
    "path": "../public/assets/index.es-fwHWMuPu.js"
  },
  "/assets/purify.es-Cz4mVeUR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"7132-kJaMURdZoikP0IeH1c227cT21Mc"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 28978,
    "path": "../public/assets/purify.es-Cz4mVeUR.js"
  },
  "/assets/SectionCard-DJSmuYne.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"484-Thv7yu+1JogaXxVn/RKrZOkNfrU"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 1156,
    "path": "../public/assets/SectionCard-DJSmuYne.js"
  },
  "/assets/route-CYQOTOgE.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2ca0-393jxvOwdGgCqKHCuZt7LP4H8w0"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 11424,
    "path": "../public/assets/route-CYQOTOgE.js"
  },
  "/assets/settings-BKJ0D1eh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1357-clqng0Lp8Z9YTvDHtvuC5/7mSt8"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 4951,
    "path": "../public/assets/settings-BKJ0D1eh.js"
  },
  "/assets/trash-2-Bn74HN9s.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"154-brgOYCIVY5Ggxhj8s/lz7a7BQio"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 340,
    "path": "../public/assets/trash-2-Bn74HN9s.js"
  },
  "/assets/upload-C1LoF9mI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"20e-YtWs1WE/Yt7g09dXklHiNXhmCw4"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 526,
    "path": "../public/assets/upload-C1LoF9mI.js"
  },
  "/assets/user-Dond81gs.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"cb-2ACWETGsF+6KJHwAs/WmOTNMNwk"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 203,
    "path": "../public/assets/user-Dond81gs.js"
  },
  "/assets/styles-D8irOD2V.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"1880d-aXQfOlee2/as2h1l/bBw++j5aMA"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 100365,
    "path": "../public/assets/styles-D8irOD2V.css"
  },
  "/assets/index-CCVrVZZ5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"945b1-Vnmwvd7LLD5EtqJ6mEnJ2zySEnc"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 607665,
    "path": "../public/assets/index-CCVrVZZ5.js"
  },
  "/assets/deepshield-logo-BnnXRouz.png": {
    "type": "image/png",
    "etag": '"10ce0f-uKkXkL//ZtkI1jR1es5HoWgxAwU"',
    "mtime": "2026-09-17T04:59:11.846Z",
    "size": 1101327,
    "path": "../public/assets/deepshield-logo-BnnXRouz.png"
  }
};
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
  if (assets[id]) {
    return true;
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) {
      return true;
    }
  }
  return false;
}
const headers = ((m) => function headersRouteRule(event) {
  for (const [key, value] of Object.entries(m.options || {})) {
    event.res.headers.set(key, value);
  }
});
const findRouteRules = /* @__PURE__ */ (() => {
  const $0 = [{ name: "headers", route: "/assets/**", handler: headers, options: { "cache-control": "public, max-age=31536000, immutable" } }];
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    let s = p.split("/"), l = s.length;
    if (l > 1) {
      if (s[1] === "assets") {
        r.unshift({ data: $0, params: { "_": s.slice(2).join("/") } });
      }
    }
    return r;
  };
})();
const _lazy_blzNU1 = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
const findRoute = /* @__PURE__ */ (() => {
  const data = { route: "/**", handler: _lazy_blzNU1 };
  return ((_m, p) => {
    return { data, params: { "_": p.slice(1) } };
  });
})();
const errorHandler$1 = (error, event) => {
  const res = defaultHandler(error, event);
  return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
  const unhandled = error.unhandled ?? !HTTPError.isError(error);
  const { status = 500, statusText = "" } = unhandled ? {} : error;
  if (status === 404) {
    const url = event.url || new URL(event.req.url);
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      return {
        status: 302,
        headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
      };
    }
  }
  const headers2 = new Headers(unhandled ? {} : error.headers);
  headers2.set("content-type", "application/json; charset=utf-8");
  const jsonBody = unhandled ? {
    status,
    unhandled: true
  } : typeof error.toJSON === "function" ? error.toJSON() : {
    status,
    statusText,
    message: error.message
  };
  return {
    status,
    statusText,
    headers: headers2,
    body: {
      error: true,
      ...jsonBody
    }
  };
}
const errorHandlers = [errorHandler$1];
async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch (error2) {
      console.error(error2);
    }
  }
}
function createNitroApp() {
  const captureError = (error, errorCtx) => {
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) {
        errors.push({ error, context: errorCtx });
      }
    }
  };
  const h3App = createH3App({
    onError(error, event) {
      return errorHandler(error, event);
    }
  });
  let appHandler = (req) => {
    req.context ||= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    return h3App.fetch(req);
  };
  return {
    fetch: appHandler,
    h3: h3App,
    hooks: void 0,
    captureError
  };
}
function createH3App(config) {
  const h3App = new H3Core(config);
  h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
  h3App["~getMiddleware"] = (event, route) => {
    const pathname = event.url.pathname;
    const method = event.req.method;
    const middleware = [];
    const routeRules = getRouteRules(method, pathname);
    event.context.routeRules = routeRules?.routeRules;
    if (routeRules?.routeRuleMiddleware.length) {
      middleware.push(...routeRules.routeRuleMiddleware);
    }
    if (route?.data?.middleware?.length) {
      middleware.push(...route.data.middleware);
    }
    return middleware;
  };
  return h3App;
}
const APP_ID = "default";
function useNitroApp() {
  let instance = useNitroApp._instance;
  if (instance) {
    return instance;
  }
  instance = useNitroApp._instance = createNitroApp();
  globalThis.__nitro__ = globalThis.__nitro__ || {};
  globalThis.__nitro__[APP_ID] = instance;
  return instance;
}
function useNitroHooks() {
  const nitroApp = useNitroApp();
  const hooks = nitroApp.hooks;
  if (hooks) {
    return hooks;
  }
  return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
  const m = findRouteRules(method, pathname);
  if (!m?.length) {
    return { routeRuleMiddleware: [] };
  }
  const routeRules = {};
  for (const layer of m) {
    for (const rule of layer.data) {
      const currentRule = routeRules[rule.name];
      if (currentRule) {
        if (rule.options === false) {
          delete routeRules[rule.name];
          continue;
        }
        if (typeof currentRule.options === "object" && typeof rule.options === "object") {
          currentRule.options = {
            ...currentRule.options,
            ...rule.options
          };
        } else {
          currentRule.options = rule.options;
        }
        currentRule.route = rule.route;
        currentRule.params = {
          ...currentRule.params,
          ...layer.params
        };
      } else if (rule.options !== false) {
        routeRules[rule.name] = {
          ...rule,
          params: layer.params
        };
      }
    }
  }
  const middleware = [];
  const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
  for (const rule of orderedRules) {
    if (rule.options === false || !rule.handler) {
      continue;
    }
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}
function createHandler(hooks) {
  const nitroApp = useNitroApp();
  const nitroHooks = useNitroHooks();
  return {
    async fetch(request, env, context) {
      globalThis.__env__ = env;
      augmentReq(request, {
        env,
        context
      });
      const ctxExt = {};
      const url = new URL(request.url);
      if (hooks.fetch) {
        const res = await hooks.fetch(request, env, context, url, ctxExt);
        if (res) {
          return res;
        }
      }
      return await nitroApp.fetch(request);
    },
    scheduled(controller, env, context) {
      globalThis.__env__ = env;
      context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
        controller,
        env,
        context
      }) || Promise.resolve());
    },
    email(message, env, context) {
      globalThis.__env__ = env;
      context.waitUntil(nitroHooks.callHook("cloudflare:email", {
        message,
        event: message,
        env,
        context
      }) || Promise.resolve());
    },
    queue(batch, env, context) {
      globalThis.__env__ = env;
      context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
        batch,
        event: batch,
        env,
        context
      }) || Promise.resolve());
    },
    tail(traces, env, context) {
      globalThis.__env__ = env;
      context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
        traces,
        env,
        context
      }) || Promise.resolve());
    },
    trace(traces, env, context) {
      globalThis.__env__ = env;
      context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
        traces,
        env,
        context
      }) || Promise.resolve());
    }
  };
}
function augmentReq(cfReq, ctx) {
  const req = cfReq;
  req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
  req.runtime ??= { name: "cloudflare" };
  req.runtime.cloudflare = {
    ...req.runtime.cloudflare,
    ...ctx
  };
  req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
const cloudflareModule = createHandler({ fetch(cfRequest, env, context, url) {
  if (env.ASSETS && isPublicAssetURL(url.pathname)) {
    return env.ASSETS.fetch(cfRequest);
  }
} });
export {
  cloudflareModule as default
};
