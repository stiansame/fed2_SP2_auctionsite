// ./js/components/header.js
import { getAuth, logout } from "../state.js";
import { navigate } from "../router.js";
import { escapeAttr } from "../ui.js";

export function renderHeader({
  credit = null,
  avatar = null,
  name = null,
} = {}) {
  const header = document.getElementById("site-header");
  if (!header) return;

  const { isLoggedIn, user } = getAuth() || {};

  const displayName = name || user?.name || "Profile";

  // Prefer the avatar passed in (from profile.js), fall back to auth.user.avatar if it exists
  const avatarUrl = avatar?.url || user?.avatar?.url || "";
  const avatarAlt =
    avatar?.alt ||
    user?.avatar?.alt ||
    (displayName ? `${displayName} avatar` : "User avatar");

  const creditsBadgeHtml = isLoggedIn
    ? `
  <span
    class="badge-accent inline-flex items-center gap-2 px-3 h-9 rounded-full text-sm leading-none"
    title="Available credits"
  >
    <svg aria-hidden="true" viewBox="0 0 20 20" class="h-4 w-4">
      <path
        d="M3 6a2 2 0 0 1 2-2h9a1 1 0 1 1 0 2H5a1 1 0 0 0 0 2h11a1 1 0 0 1 1 1v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zm11 4a1 1 0 1 0 0 2h3v-2h-3z"
        fill="currentColor"
      />
    </svg>
    ${credit ?? "—"}
  </span>
`
    : "";

  // PLUS ICON BUTTON FOR CREATE LISTING
  const createListingHtml = isLoggedIn
    ? `
      <a
        href="#/create"
        class="inline-flex h-9 w-9 items-center justify-center
               rounded-full border border-brand-border bg-white
               shadow
               hover:bg-slate-50
               hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 hover:ring-offset-white
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white
               text-[10px]"
        title="Create listing"
        aria-label="Create listing"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" class="h-3.5 w-3.5">
          <path
            d="M10 4v12M4 10h12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </a>
    `
    : "";

  // AVATAR LIKE IN profile.js, JUST SMALLER
  const profileAvatarHtml = isLoggedIn
    ? `
      <a
        href="#/profile"
        class="inline-flex items-center justify-center"
        title="View profile"
      >
        <div class="w-9 h-9 rounded-full overflow-hidden bg-slate-200 border border-brand-border">
          ${
            avatarUrl
              ? `<img
                   src="${avatarUrl}"
                   alt="${escapeAttr(avatarAlt)}"
                   class="h-full w-full object-cover"
                 />`
              : `<div class="h-full w-full flex items-center justify-center text-xs text-brand-muted">
                   ${displayName ? escapeAttr(displayName[0].toUpperCase()) : "?"}
                 </div>`
          }
        </div>
        <span class="sr-only">${escapeAttr(displayName)}</span>
      </a>
    `
    : "";

  header.innerHTML = `
    <div class="container-page py-3 flex items-center justify-between gap-3">
      <a href="#/" class="font-heading text-lg font-semibold tracking-tight text-brand-ink">
        Noroff Auctionsite
      </a>

      <nav class="flex items-center gap-2" aria-label="Primary navigation">
        ${
          !isLoggedIn
            ? `
              <a href="#/login" class="btn-secondary">Login</a>
              <a href="#/register" class="btn-primary">Register</a>
            `
            : `
              ${creditsBadgeHtml}
              ${createListingHtml}
              ${profileAvatarHtml}
              <button id="logoutBtn" type="button" class="btn-primary">
                Logout
              </button>
            `
        }
      </nav>
    </div>
  `;

  if (isLoggedIn) {
    header.querySelector("#logoutBtn")?.addEventListener("click", () => {
      logout();

      // Re-render header as logged-out (no credit, no username)
      renderHeader({ credit: null });

      // Navigate back to home (router will load listings)
      navigate("/");
    });
  }
}
