// ./js/pages/login.js
import { apiPost } from "../api.js";
import { setAuth, maybeRefreshCredit } from "../state.js";
import { navigate } from "../router.js";
import { renderHeader } from "../components/header.js";
import { showFeedback, hideFeedback } from "../ui.js";

export async function loginPage({ query, mountEl }) {
  hideFeedback();

  const mount = mountEl || document.getElementById("appView");
  if (!mount) return;

  const returnTo = query?.returnTo ? decodeURIComponent(query.returnTo) : "/";

  mount.innerHTML = `
    <section class="card card-pad max-w-lg mx-auto">
      <h1>Login</h1>
      <p>Use your registered account to bid and create listings.</p>

      <form id="loginForm" class="mt-4 flex flex-col gap-3">
        <div>
          <label for="email">Email</label>
          <input id="email" type="email" placeholder="name@stud.noroff.no" required />
        </div>

        <div>
          <label for="password">Password</label>
          <input id="password" type="password" placeholder="••••••••" required />
        </div>

        <button class="btn-primary" type="submit">Login</button>

        <p class="text-sm">
          No account? <a href="#/register">Register</a>
        </p>
      </form>
    </section>
  `;

  const form = mount.querySelector("#loginForm");
  form.onsubmit = async (e) => {
    e.preventDefault();
    hideFeedback();

    const email = mount.querySelector("#email").value.trim();
    const password = mount.querySelector("#password").value;

    try {
      const res = await apiPost("/auth/login", { email, password });

      setAuth({
        token: res.accessToken,
        user: { name: res.name, email: res.email },
      });

      const credit = await maybeRefreshCredit();
      renderHeader({ credit });

      navigate(returnTo || "/");
    } catch (err) {
      console.error(err);
      showFeedback(err?.message || "Login failed.");
    }
  };
}
