// ./js/router.js
import { getAuth } from "./state.js";

export function navigate(path) {
  window.location.hash = `#${path}`;
}

function parseQuery(queryString) {
  const params = new URLSearchParams(queryString || "");
  return Object.fromEntries(params.entries());
}

function matchRoute(path, routePath) {
  // routePath supports /listing/:id
  const pathParts = path.split("/").filter(Boolean);
  const routeParts = routePath.split("/").filter(Boolean);

  if (pathParts.length !== routeParts.length) return null;

  const params = {};
  for (let i = 0; i < routeParts.length; i++) {
    const rp = routeParts[i];
    const pp = pathParts[i];
    if (rp.startsWith(":")) params[rp.slice(1)] = pp;
    else if (rp !== pp) return null;
  }
  return params;
}

export function createRouter(routes) {
  async function handleRoute() {
    const hash = window.location.hash || "#/";
    const [rawPath, rawQuery] = hash.slice(1).split("?");
    const path = rawPath || "/";
    const query = parseQuery(rawQuery);

    for (const r of routes) {
      const params = matchRoute(path, r.path);
      if (!params) continue;

      // Guard
      if (r.protected) {
        const { isLoggedIn } = getAuth();
        if (!isLoggedIn) {
          const returnTo = encodeURIComponent(path);
          navigate(`/login?returnTo=${returnTo}`);
          return;
        }
      }

      await r.view({ params, query, path });
      return;
    }

    // fallback
    navigate("/");
  }

  window.addEventListener("hashchange", handleRoute);
  window.addEventListener("load", handleRoute);
}
