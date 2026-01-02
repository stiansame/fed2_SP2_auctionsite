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

  // AVATAR + DROPDOWN MENU
  const profileMenuHtml = isLoggedIn
    ? `
      <div class="relative inline-block text-left">
        <button
          type="button"
          id="profileMenuButton"
          class="inline-flex items-center justify-center"
          title="Open profile menu"
          aria-haspopup="true"
          aria-expanded="false"
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
        </button>

        <div
          id="profileMenu"
          class="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black/5 z-20
                 transform transition ease-out duration-150
                 opacity-0 scale-95 pointer-events-none"
          role="menu"
          aria-labelledby="profileMenuButton"
        >
          <a
            href="#/profile"
            class="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 no-underline hover:no-underline"
            role="menuitem"
          >
            Profile
          </a>
          <button
            type="button"
            id="logoutBtn"
            class="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 no-underline hover:no-underline"
            role="menuitem"
          >
            Logout
          </button>
        </div>
      </div>
    `
    : "";

  header.innerHTML = `
    <div class="container-page py-3 flex items-center justify-between gap-3">
<a href="#/" class="font-heading text-lg font-semibold tracking-tight text-brand-ink no-underline hover:no-underline">
  Noroff TradeHub
</a>


      <nav class="flex items-center gap-2" aria-label="Primary navigation">
        ${
          !isLoggedIn
            ? `
              <a href="#/login" class="btn-secondary hover:no-underline hover:font-semibold">Login</a>
              <a href="#/register" class="btn-primary hover:no-underline hover:font-semibold">Register</a>
            `
            : `
              ${creditsBadgeHtml}
              ${createListingHtml}
              ${profileMenuHtml}
            `
        }
      </nav>
    </div>
  `;

  if (isLoggedIn) {
    const menuButton = header.querySelector("#profileMenuButton");
    const menu = header.querySelector("#profileMenu");
    const logoutBtn = header.querySelector("#logoutBtn");

    let menuOpen = false;

    function openMenu() {
      if (!menu || !menuButton || menuOpen) return;

      menu.classList.remove("opacity-0", "scale-95", "pointer-events-none");
      menu.classList.add("opacity-100", "scale-100", "pointer-events-auto");
      menuButton.setAttribute("aria-expanded", "true");
      menuOpen = true;

      // Close on outside click / Esc
      document.addEventListener("click", onDocumentClick);
      document.addEventListener("keydown", onKeydown);
    }

    function closeMenu() {
      if (!menu || !menuButton || !menuOpen) return;

      menu.classList.add("opacity-0", "scale-95", "pointer-events-none");
      menu.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
      menuButton.setAttribute("aria-expanded", "false");
      menuOpen = false;

      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeydown);
    }

    function onDocumentClick(event) {
      if (!header.contains(event.target)) {
        closeMenu();
      }
    }

    function onKeydown(event) {
      if (event.key === "Escape") {
        closeMenu();
        menuButton?.focus();
      }
    }

    menuButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      if (menuOpen) closeMenu();
      else openMenu();
    });

    // Prevent clicks inside the menu from bubbling and instantly closing it
    menu?.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    logoutBtn?.addEventListener("click", () => {
      logout();

      // Re-render header as logged-out (no credit, no username)
      renderHeader({ credit: null });

      // Navigate back to home (router will load listings)
      navigate("/");
    });
  }
}
