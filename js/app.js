import { createRouter } from "./router.js";
import { routes } from "./routes.js";
import { renderHeader } from "./components/header.js";
import { maybeRefreshCredit } from "./state.js";

// boot
/**
 * Bootstraps the app: renders the header, refreshes credit, and starts the router.
 * @async
 * @returns {Promise<void>}
 */
async function boot() {
  // Always show header, even if credit fetch fails
  renderHeader({ credit: null });

  let credit = null;
  try {
    credit = await maybeRefreshCredit();
  } catch (err) {
    console.warn("Credit refresh failed during boot:", err);
  }

  renderHeader({ credit });
  createRouter(routes);
}

boot();
