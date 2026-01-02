import { apiGet } from "./api.js";
import { showToast } from "./ui.js";

const KEY = "auction_auth_v2";

// getAuth
/**
 * Reads and normalizes the stored auth state from localStorage.
 * @returns {{ isLoggedIn: boolean, token: string | null, user: Object | null, credit: number | null }}
 * Current authentication state.
 */
export function getAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { isLoggedIn: false, token: null, user: null, credit: null };
    }

    const parsed = JSON.parse(raw);
    const token = parsed?.token || null;
    const user = parsed?.user || null;
    const credit = parsed?.credit ?? null;

    return {
      isLoggedIn: Boolean(token),
      token,
      user,
      credit,
    };
  } catch (e) {
    console.warn("Auth storage corrupted. Clearing.", e);
    localStorage.removeItem(KEY);
    return { isLoggedIn: false, token: null, user: null, credit: null };
  }
}

// setAuth
/**
 * Stores the auth token and user in localStorage, resetting credit.
 * @param {{ token: string, user?: Object }} param0 - Auth payload with token and user info.
 * @returns {void}
 */
export function setAuth({ token, user }) {
  if (!token) throw new Error("setAuth called without token");
  localStorage.setItem(
    KEY,
    JSON.stringify({
      token,
      user: user ?? null,
      credit: null,
    }),
  );
}

// setUser
/**
 * Updates the stored user object while preserving token and credit.
 * @param {Object} userUpdate - Partial user data to merge into the stored user.
 * @returns {void}
 */
export function setUser(userUpdate) {
  const auth = getAuth();
  if (!auth.token) return;

  const nextUser = {
    ...(auth.user || {}),
    ...(userUpdate || {}),
  };

  localStorage.setItem(
    KEY,
    JSON.stringify({
      token: auth.token,
      user: nextUser,
      credit: auth.credit,
    }),
  );
}

// setCredit
/**
 * Updates the stored credit amount for the current user.
 * @param {number | null} credit - New credit value.
 * @returns {void}
 */
export function setCredit(credit) {
  const auth = getAuth();
  if (!auth.token) return;
  localStorage.setItem(
    KEY,
    JSON.stringify({
      token: auth.token,
      user: auth.user,
      credit,
    }),
  );
}

// logout
/**
 * Clears all stored authentication state and logs the user out.
 * @returns {void}
 */
export function logout() {
  localStorage.removeItem(KEY);
  showToast("Logout Successful!");
}

// maybeRefreshCredit
/**
 * Optionally refreshes the user's profile and credit if logged in.
 * @async
 * @returns {Promise<number | null>} Latest credit value, or null if unavailable.
 */
export async function maybeRefreshCredit() {
  const auth = getAuth();
  if (!auth.isLoggedIn || !auth.user?.name) return null;

  try {
    const res = await apiGet(`/profiles/${auth.user.name}`);

    // Swagger response: { data: { name, email, avatar, credits, ... }, meta: {} }
    const profile = res?.data || {};

    // Update stored user with whatever we got back (incl. avatar)
    setUser({
      name: profile.name ?? auth.user.name,
      email: profile.email ?? auth.user.email,
      avatar: profile.avatar ?? auth.user.avatar,
    });

    const credit = profile.credits ?? null;

    if (typeof credit === "number") {
      setCredit(credit);
      return credit;
    }

    return auth.credit ?? null;
  } catch (err) {
    console.warn("maybeRefreshCredit failed:", err);
    return auth.credit ?? null;
  }
}
