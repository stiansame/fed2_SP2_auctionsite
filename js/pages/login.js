// ./js/pages/login.js
import { apiPost } from "../api.js";
import { setAuth, maybeRefreshCredit } from "../state.js";
import { navigate } from "../router.js";
import { renderHeader } from "../components/header.js";
import { showFeedback, hideFeedback, showToast, setPageTitle } from "../ui.js";

export async function loginPage({ query, mountEl }) {
  hideFeedback();

  setPageTitle("Login");

  const mount = mountEl || document.getElementById("appView");
  if (!mount) return;

  const returnTo = query?.returnTo ? decodeURIComponent(query.returnTo) : "/";

  mount.innerHTML = `
<section class="card card-pad max-w-lg mx-auto">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1>Login</h1>
      <p>Use your registered account to bid and create listings.</p>
    </div>

    <a class="btn-secondary hover:no-underline hover:font-semibold" href="#/">← Back</a>
  </div>

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

      // ✅ Handle both response shapes: res or res.data
      const payload = res?.data ?? res;

      const token = payload?.accessToken || payload?.token;
      const name = payload?.name;
      const userEmail = payload?.email ?? email;

      if (!token) {
        console.log("Login response payload:", res);
        throw new Error("Login succeeded but no access token was returned.");
      }

      setAuth({
        token,
        user: { name, email: userEmail },
      });

      const credit = await maybeRefreshCredit();
      renderHeader({ credit });

      // ✅ toast on success
      showToast("Logged in successfully!");

      navigate(returnTo || "/");
    } catch (err) {
      console.error(err);
      const msg = err?.message || "Login failed.";
      showFeedback(msg);
      showToast(msg, "error"); // ✅ toast on error
    }
  };
}
