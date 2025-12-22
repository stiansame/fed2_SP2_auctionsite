// ./js/components/header.js
import { getAuth, logout } from "../state.js";
import { navigate } from "../router.js";

export function renderHeader({ credit = null } = {}) {
  const header = document.getElementById("site-header");
  const { isLoggedIn, user } = getAuth();

  header.innerHTML = `
    <div class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
      <a href="#/" class="font-semibold text-lg">Auction</a>

      <div class="flex items-center gap-2">
        ${
          !isLoggedIn
            ? `
              <a href="#/login" class="px-3 py-2 rounded-md border">Login</a>
              <a href="#/register" class="px-3 py-2 rounded-md bg-black text-white">Register</a>
            `
            : `
              <span class="px-3 py-2 rounded-full bg-gray-100 text-sm">
                💰 ${credit ?? "—"}
              </span>
              <a href="#/create" class="px-3 py-2 rounded-md border">Create listing</a>
              <a href="#/profile" class="px-3 py-2 rounded-md border">
                ${user?.name ?? "Profile"}
              </a>
              <button id="logoutBtn" class="px-3 py-2 rounded-md bg-black text-white">
                Logout
              </button>
            `
        }
      </div>
    </div>
  `;

  if (isLoggedIn) {
    header.querySelector("#logoutBtn")?.addEventListener("click", () => {
      logout();
      navigate("/"); // back to home
    });
  }
}
