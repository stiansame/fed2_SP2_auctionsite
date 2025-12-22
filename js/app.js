// ./js/app.js
import { createRouter } from "./router.js";
import { routes } from "./routes.js";
import { renderHeader } from "./components/header.js";
import { maybeRefreshCredit } from "./state.js";

async function boot() {
  const credit = await maybeRefreshCredit();
  renderHeader({ credit });
  createRouter(routes);
}

boot();
