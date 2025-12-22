// ./js/pages/register.js
import { apiPost } from "../api.js";
import { navigate } from "../router.js";
import { showFeedback, hideFeedback } from "../ui.js";

export async function registerPage({ mountEl }) {
  hideFeedback();

  const mount = mountEl || document.getElementById("appView");
  if (!mount) return;

  mount.innerHTML = `
    <section class="card card-pad max-w-lg mx-auto">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1>Register</h1>
          <p>You must register with a <strong>@stud.noroff.no</strong> email.</p>
        </div>
        <a class="btn-secondary" href="#/">Back</a>
      </div>

      <form id="registerForm" class="mt-4 flex flex-col gap-3">
        <div>
          <label for="name">Username</label>
          <input id="name" type="text" placeholder="yourname" required />
        </div>

        <div>
          <label for="email">Email</label>
          <input id="email" type="email" placeholder="name@stud.noroff.no" required />
        </div>

        <div>
          <label for="password">Password</label>
          <input id="password" type="password" placeholder="••••••••" required />
        </div>

        <button class="btn-primary" type="submit">Create account</button>

        <p class="text-sm">
          Already registered? <a href="#/login">Login</a>
        </p>
      </form>
    </section>
  `;

  const form = mount.querySelector("#registerForm");
  form.onsubmit = async (e) => {
    e.preventDefault();
    hideFeedback();

    const name = mount.querySelector("#name").value.trim();
    const email = mount.querySelector("#email").value.trim();
    const password = mount.querySelector("#password").value;

    if (!email.endsWith("@stud.noroff.no")) {
      showFeedback("Email must end with @stud.noroff.no");
      return;
    }

    try {
      await apiPost("/auth/register", { name, email, password });
      navigate("/login");
    } catch (err) {
      console.error(err);
      showFeedback(err?.message || "Registration failed.");
    }
  };
}
