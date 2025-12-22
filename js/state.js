// /js/state.js
import { apiGet } from "./api.js";

const KEY = "auction_auth";

export function getAuth() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { isLoggedIn: false, user: null, token: null, credit: null };
  const parsed = JSON.parse(raw);
  return {
    isLoggedIn: !!parsed?.token,
    user: parsed?.user ?? null,
    token: parsed?.token ?? null,
    credit: parsed?.credit ?? null,
  };
}

export function setAuth({ token, user }) {
  localStorage.setItem(KEY, JSON.stringify({ token, user, credit: null }));
}

export function setCredit(credit) {
  const auth = getAuth();
  if (!auth.token) return;
  localStorage.setItem(
    KEY,
    JSON.stringify({ token: auth.token, user: auth.user, credit }),
  );
}

export function logout() {
  localStorage.removeItem(KEY);
}

export async function maybeRefreshCredit() {
  const auth = getAuth();
  if (!auth.isLoggedIn || !auth.user?.name) return null;

  try {
    const profile = await apiGet(`/profiles/${auth.user.name}`);
    const credit = profile?.credits ?? profile?.credit ?? null; // depends on API field name
    if (credit !== null) setCredit(credit);
    return credit;
  } catch {
    return auth.credit ?? null;
  }
}
