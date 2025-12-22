// ./js/components/header.js
import { getAuth, logout } from "../state.js";
import { navigate } from "../router.js";

export function renderHeader({ credit = null } = {}) {
  const header = document.getElementById("site-header");
  const { isLoggedIn, user } = getAuth();

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
              <span class="badge-accent" title="Available credits">
                💰 ${credit ?? "—"}
              </span>

              <a href="#/create" class="btn-secondary">Create listing</a>

              <a href="#/profile" class="btn-secondary" title="View profile">
                ${user?.name ?? "Profile"}
              </a>

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
      navigate("/"); // back to home
    });
  }
}
