// ./js/pages/profile.js
import { apiGet, apiPut } from "../api.js";
import { getAuth, setCredit, maybeRefreshCredit } from "../state.js";
import { renderHeader } from "../components/header.js";
import { showFeedback, hideFeedback } from "../ui.js";

export async function profilePage({ mountEl }) {
  hideFeedback();

  const mount = mountEl || document.getElementById("appView");
  if (!mount) return;

  const { user } = getAuth();
  if (!user?.name) return;

  mount.innerHTML = `
    <section class="card card-pad max-w-2xl mx-auto">
      <h1>Profile</h1>
      <p>Loading profile…</p>
    </section>
  `;

  try {
    const profile = await apiGet(`/profiles/${user.name}`);
    const credit = profile?.credits ?? profile?.credit ?? null;
    if (credit !== null) setCredit(credit);

    renderHeader({ credit: credit ?? (await maybeRefreshCredit()) });

    const avatar = profile?.avatar ?? profile?.media?.avatar ?? "";

    mount.innerHTML = `
      <section class="card card-pad max-w-2xl mx-auto">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1>${escapeHtml(user.name)}</h1>
            <p>Total credit: <span class="font-semibold text-brand-ink">${credit ?? "—"}</span></p>
          </div>
          <a href="#/" class="btn-secondary">Back</a>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-[120px_1fr]">
          <div>
            <div class="aspect-square overflow-hidden rounded-xl bg-slate-100 border border-brand-border">
              ${
                avatar
                  ? `<img src="${avatar}" alt="Avatar" class="h-full w-full object-cover" />`
                  : `<div class="h-full w-full flex items-center justify-center text-sm text-brand-muted">No avatar</div>`
              }
            </div>
          </div>

          <div>
            <h2>Update avatar</h2>
            <form id="avatarForm" class="mt-2 flex flex-col gap-3">
              <div>
                <label for="avatarUrl">Avatar URL</label>
                <input id="avatarUrl" type="url" placeholder="https://..." value="${escapeAttr(avatar)}" />
                <small>Tip: use a direct image URL (ends with .jpg/.png).</small>
              </div>
              <button class="btn-primary" type="submit">Save avatar</button>
            </form>
          </div>
        </div>
      </section>
    `;

    const avatarForm = mount.querySelector("#avatarForm");
    avatarForm.onsubmit = async (e) => {
      e.preventDefault();
      hideFeedback();

      const avatarUrl = mount.querySelector("#avatarUrl").value.trim();
      if (!avatarUrl) {
        showFeedback("Please enter an avatar URL.");
        return;
      }

      try {
        await apiPut(`/profiles/${user.name}/media`, { avatar: avatarUrl });
        await profilePage({ mountEl: mount }); // rerender in same mount
      } catch (err) {
        console.error(err);
        showFeedback(err?.message || "Failed to update avatar.");
      }
    };
  } catch (err) {
    console.error(err);
    showFeedback(err?.message || "Failed to load profile.");
    mount.innerHTML = `
      <section class="card card-pad max-w-2xl mx-auto">
        <h1>Profile</h1>
        <p>${escapeHtml(err?.message || "Unknown error")}</p>
        <a href="#/" class="btn-secondary mt-3 inline-flex">Back</a>
      </section>
    `;
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("\n", "");
}
