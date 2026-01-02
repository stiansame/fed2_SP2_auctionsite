import { API_BASE_URL, AUCTION_PATH, NOROFF_API_KEY } from "./config.js";
import { getAuth } from "./state.js";

// authHeaders
/**
 * Builds the authorization header from the stored auth state.
 * @returns {Object<string, string>} Authorization header object, or an empty object.
 */
function authHeaders() {
  const { token } = getAuth();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// apiKeyHeaders
/**
 * Builds the Noroff API key header if a key is configured.
 * @returns {Object<string, string>} API key header object, or an empty object.
 */
function apiKeyHeaders() {
  // Only add if present; if missing, Noroff will return "No API key header was found".
  return NOROFF_API_KEY ? { "X-Noroff-API-Key": NOROFF_API_KEY } : {};
}

// isAuthEndpoint
/**
 * Checks whether a path targets an auth endpoint.
 * @param {string} path - Relative API path.
 * @returns {boolean} True if the path is an auth endpoint.
 */
function isAuthEndpoint(path) {
  return path.startsWith("/auth/");
}

// buildUrl
/**
 * Resolves a relative API path to a full URL, including the auction prefix.
 * @param {string} path - Relative API path.
 * @returns {string} Fully qualified API URL.
 */
function buildUrl(path) {
  if (!path.startsWith("/")) path = `/${path}`;

  // Auth endpoints live at root: /auth/login, /auth/register
  if (isAuthEndpoint(path)) {
    return `${API_BASE_URL}${path}`;
  }

  // Everything else is under /auction on v2
  const fullPath = path.startsWith(AUCTION_PATH)
    ? path
    : `${AUCTION_PATH}${path}`;
  return `${API_BASE_URL}${fullPath}`;
}

// parseJsonSafe
/**
 * Safely parses a response body as JSON, returning plain text or null on failure.
 * @async
 * @param {Response} res - Fetch response object.
 * @returns {Promise<unknown>} Parsed JSON, plain text, or null.
 */
async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// normalizeErrorMessage
/**
 * Extracts a human-readable error message from an API error payload.
 * @param {number} status - HTTP status code.
 * @param {unknown} payload - Parsed error payload.
 * @returns {string} Normalized error message.
 */
function normalizeErrorMessage(status, payload) {
  if (payload && typeof payload === "object") {
    if (payload.message) return payload.message;
    if (payload.error) return payload.error;
    if (Array.isArray(payload.errors) && payload.errors[0]?.message) {
      return payload.errors[0].message;
    }
  }
  return `Request failed (HTTP ${status}).`;
}

// apiRequest
/**
 * Performs an HTTP request against the Noroff API with auth and API key headers.
 * @async
 * @param {string} method - HTTP verb (GET, POST, PUT, DELETE).
 * @param {string} path - Relative API path.
 * @param {unknown} [body=null] - Optional JSON payload.
 * @param {{ query?: Object<string, unknown>, headers?: Object<string, string> }} [options={}] - Extra request options.
 * @returns {Promise<unknown>} Parsed response payload.
 * @throws {Error} If the response is not OK.
 */
export async function apiRequest(method, path, body = null, options = {}) {
  const { query = null, headers = {} } = options;

  const url = new URL(buildUrl(path));
  if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...apiKeyHeaders(), // ✅ required by Noroff v2
      ...authHeaders(), // ✅ bearer token when logged in
      ...headers,
    },
    body: body ? JSON.stringify(body) : null,
  });

  const payload = await parseJsonSafe(res);

  if (!res.ok) {
    const err = new Error(normalizeErrorMessage(res.status, payload));
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

export const apiGet = (path, options) => apiRequest("GET", path, null, options);
export const apiPost = (path, body, options) =>
  apiRequest("POST", path, body, options);
export const apiPut = (path, body, options) =>
  apiRequest("PUT", path, body, options);
export const apiDelete = (path, options) =>
  apiRequest("DELETE", path, null, options);
