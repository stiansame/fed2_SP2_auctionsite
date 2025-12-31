// ./js/config.js
// Keep this file tiny and boring—easy to change later.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://v2.api.noroff.dev";
export const AUCTION_PATH = "/auction";
export const NOROFF_API_KEY = import.meta.env.VITE_NOROFF_API_KEY || "";

/**
 * For LIVE-Server TESTING!
 * Noroff v2 requires an API key header: "X-Noroff-API-Key".
 *
 * Recommended (so you don't commit secrets):
 * 1) Run once in DevTools console:
 *    localStorage.setItem("NOROFF_API_KEY", "YOUR_KEY_HERE");
 * 2) This reads it at runtime.

export const NOROFF_API_KEY = localStorage.getItem("NOROFF_API_KEY") || "";
 */
