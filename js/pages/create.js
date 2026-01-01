// ./js/pages/create.js
import { apiPost } from "../api.js";
import { navigate } from "../router.js";
import { showFeedback, hideFeedback, showToast, escapeHtml } from "../ui.js";

export async function createListingPage({ mountEl }) {
  hideFeedback();

  const mount = mountEl || document.getElementById("appView");
  if (!mount) return;

  mount.innerHTML = `
    <section class="card card-pad max-w-2xl mx-auto">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1>Create listing</h1>
          <p>Create an auction with a title, description, media URLs, and a deadline.</p>
        </div>
        <a class="btn-secondary hover:no-underline hover:font-semibold" href="#/">← Back</a>
      </div>

      <form id="createForm" class="mt-4 flex flex-col gap-4">
        <div>
          <label for="title">Title</label>
          <input id="title" type="text" required placeholder="Vintage camera" />
        </div>

        <div>
          <label for="description">Description</label>
          <textarea id="description" rows="4" placeholder="Condition, pickup, etc."></textarea>
        </div>

        <div>
          <label for="endsAt">Deadline</label>
          <input id="endsAt" type="datetime-local" required />
          <small>Must be in the future.</small>
        </div>

        <div class="card card-pad">
          <h2>Media URLs</h2>
          <p>Add one or more image URLs (optional).</p>

          <div id="mediaList" class="mt-3 flex flex-col gap-2"></div>

          <div class="mt-3 flex gap-2">
            <input id="mediaUrl" type="url" placeholder="https://example.com/image.jpg" />
            <button id="addMediaBtn" type="button" class="btn-secondary">Add</button>
          </div>
        </div>

        <div class="flex gap-2">
          <button class="btn-primary hover:no-underline hover:font-semibold" type="submit">Create</button>
          <a class="btn-secondary hover:no-underline hover:font-semibold" href="#/">Cancel</a>
        </div>
      </form>
    </section>
  `;

  const mediaListEl = mount.querySelector("#mediaList");
  const mediaUrlEl = mount.querySelector("#mediaUrl");
  const addMediaBtn = mount.querySelector("#addMediaBtn");
  const media = [];

  function renderMedia() {
    mediaListEl.innerHTML = media.length
      ? media
          .map(
            (u, idx) => `
              <div class="flex items-center justify-between gap-2 border border-brand-border rounded-md p-2 bg-white">
                <span class="text-sm break-all">${escapeHtml(u)}</span>
                <button class="btn-secondary hover:no-underline hover:font-semibold" type="button" data-remove="${idx}">Remove</button>
              </div>
            `,
          )
          .join("")
      : `<p class="text-sm text-brand-muted">No media added.</p>`;

    mediaListEl.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-remove"));
        media.splice(i, 1);
        renderMedia();
      });
    });
  }

  addMediaBtn.onclick = () => {
    hideFeedback();
    const url = mediaUrlEl.value.trim();
    if (!url) return;
    media.push(url);
    mediaUrlEl.value = "";
    renderMedia();
  };

  renderMedia();

  const form = mount.querySelector("#createForm");
  form.onsubmit = async (e) => {
    e.preventDefault();
    hideFeedback();

    const title = mount.querySelector("#title").value.trim();
    const description = mount.querySelector("#description").value.trim();
    const endsAtInput = mount.querySelector("#endsAt").value;

    const endsAt = new Date(endsAtInput);
    if (!Number.isFinite(endsAt.getTime()) || endsAt.getTime() <= Date.now()) {
      const msg = "Deadline must be a valid future date/time.";
      showFeedback(msg);
      showToast(msg, "error");
      return;
    }

    try {
      const payload = {
        title,
        description,
        endsAt: endsAt.toISOString(),
        media: media.map((url) => ({ url })),
      };

      const created = await apiPost("/listings", payload);
      const id = created?.id;

      // ✅ toast on success
      showToast("Listing created successfully!");

      navigate(id ? `/listing/${id}` : "/");
    } catch (err) {
      console.error(err);
      const msg = err?.message || "Failed to create listing.";
      showFeedback(msg);
      showToast(msg, "error"); // ✅ toast on error
    }
  };
}
