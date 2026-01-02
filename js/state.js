// ./js/state.js

import { apiGet } from "./api.js";

const KEY = "auction_auth_v2";

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

export function logout() {
  localStorage.removeItem(KEY);
}

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
