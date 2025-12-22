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

function setView(path) {
  const homeView = document.getElementById("homeView");
  const appView = document.getElementById("appView");

  // If you haven't added the wrappers yet, fail gracefully.
  if (!homeView || !appView)
    return { mountEl: document.getElementById("main") };

  const isHome = path === "/" || path === "";

  if (isHome) {
    homeView.classList.remove("hidden");
    appView.classList.add("hidden");
    appView.innerHTML = ""; // clean old page
    return { mountEl: null }; // home does not render into appView
  }

  homeView.classList.add("hidden");
  appView.classList.remove("hidden");
  return { mountEl: appView };
}

export function createRouter(routes) {
  async function handleRoute() {
    const hash = window.location.hash || "#/";
    const [rawPath, rawQuery] = hash.slice(1).split("?");
    const path = rawPath || "/";
    const query = parseQuery(rawQuery);

    // Toggle home vs app view
    const { mountEl } = setView(path);

    for (const r of routes) {
      const params = matchRoute(path, r.path);
      if (!params) continue;

      // Guard protected routes
      if (r.protected) {
        const { isLoggedIn } = getAuth();
        if (!isLoggedIn) {
          const returnTo = encodeURIComponent(path);
          navigate(`/login?returnTo=${returnTo}`);
          return;
        }
      }

      // Render
      await r.view({ params, query, path, mountEl });
      return;
    }

    navigate("/");
  }

  window.addEventListener("hashchange", handleRoute);
  window.addEventListener("load", handleRoute);
}
