import { apiGet, apiPost, apiPut, apiDelete } from "../api.js";
import { getAuth, maybeRefreshCredit } from "../state.js";
import { navigate } from "../router.js";
import {
  showFeedback,
  hideFeedback,
  formatTimeLeft,
  isEnded,
  highestBidAmount,
  escapeHtml,
  escapeAttr,
  timeAgo,
  showToast,
  setPageTitle,
  setupModal,
  setupMediaList,
} from "../ui.js";

// listingPage
/**
 * Renders a single listing page, including bids, media, and actions.
 * @async
 * @param {{ params?: { id?: string }, mountEl?: HTMLElement }} param0 - Router view options and route params.
 * @returns {Promise<void>}
 */
export async function listingPage({ params, mountEl }) {
  hideFeedback();

  const mount = mountEl || document.getElementById("appView");
  if (!mount) return;

  const id = params?.id;
  if (!id) {
    showFeedback("Missing listing id.");
    navigate("/");
    return;
  }

  // Simple loading state
  mount.innerHTML = `
    <section class="card card-pad">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1>Listing</h1>
          <p>Loading…</p>
        </div>
        <a href="#/" class="btn-secondary hover:no-underline hover:font-semibold">← Back</a>
      </div>
    </section>
  `;

  try {
    const res = await apiGet(`/listings/${id}`, {
      query: { _bids: true, _seller: true },
    });

    const listing = res?.data ?? res;

    if (!listing) {
      showFeedback("Listing not found.");
      mount.innerHTML = `
        <section class="card card-pad">
          <div class="flex items-start justify-between mb-4">
            <h1>Not found</h1>
            <a href="#/" class="btn-secondary hover:no-underline hover:font-semibold">← Back</a>
          </div>
          <p>This listing does not exist.</p>
        </section>
      `;
      return;
    }

    const title = listing?.title ?? "Untitled";
    const description = listing?.description ?? "";
    const endsAt = listing?.endsAt ?? null;
    const ended = isEnded(endsAt);

    const sellerName =
      listing?.seller?.name ?? listing?.seller?.email ?? "Unknown seller";

    const sellerAvatarUrl = listing?.seller?.avatar?.url || null;
    const sellerAvatarAlt =
      listing?.seller?.avatar?.alt || sellerName || "Seller avatar";

    const sellerProfileHref = sellerName
      ? `#/profile/${encodeURIComponent(sellerName)}`
      : null;

    const bids = Array.isArray(listing?.bids) ? listing.bids : [];
    const current = highestBidAmount(listing);

    const media = listing?.media;
    const mediaItems = Array.isArray(media)
      ? media
          .map((m) => (typeof m === "string" ? { url: m, alt: "" } : (m ?? {})))
          .filter((m) => m.url)
      : [];

    const { isLoggedIn, user } = getAuth();
    const isSeller =
      !!isLoggedIn && !!user?.name && listing?.seller?.name === user.name;

    const endsAtLocal = toLocalDateTimeValue(endsAt);

    setPageTitle(`ITEM | ${title}`);

    mount.innerHTML = `
      <section class="card card-pad">
<div class="flex items-start justify-between gap-4">
  <div>
    <span class="${ended ? "badge-neutral" : "badge-warning"}">
      ${ended ? "Ended" : "Active"}
    </span>
  </div>
  <div class="flex items-center gap-2">
    ${
      isSeller
        ? `
        <button
          id="deleteListingBtn"
          type="button"
          class="btn-secondary inline-flex items-center gap-2 
                  bg-state-danger/30 text-black 
                  hover:bg-state-danger/90 hover:text-white"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            class="h-4 w-4"
          >
            <path
              d="M6 5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h2a1 1 0 1 1 0 2h-1.1l-.7 7.1A2 2 0 0 1 12.2 17H8.8a2 2 0 0 1-1.99-1.9L6.1 8H5a1 1 0 1 1 0-2h1V5zm2.1 3 0.7 7h3.2l0.7-7H8.1zM8 4a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H9A1 1 0 0 1 8 4z"
              fill="currentColor"
            />
          </svg>
          <span>Delete item</span>
        </button>
        <button
          id="editListingBtn"
          type="button"
          class="btn-secondary inline-flex items-center gap-2 
                  bg-state-warning/30 text-black 
                  hover:bg-state-warning/90 hover:text-white"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            class="h-4 w-4"
          >
            <path
              d="M4 13.5V16h2.5l7-7-2.5-2.5-7 7zM14.9 7.1l-2-2a1 1 0 0 1 1.4-1.4l2 2a1 1 0 0 1-1.4 1.4z"
              fill="currentColor"
            />
          </svg>
          <span>Edit item</span>
        </button>
      `
        : ""
    }
    <a href="#/" class="btn-secondary hover:no-underline hover:font-semibold">← Back</a>
  </div>
</div>


        <div class="flex flex-col gap-2 mt-4">
          <h1>${escapeHtml(title)}</h1>
          <p>
            ${
              sellerProfileHref
                ? `
                <a
                  href="${sellerProfileHref}"
                  class="group inline-flex items-center gap-2 text-brand-ink font-medium hover:no-underline hover:font-semibold"
                >
                  ${
                    sellerAvatarUrl
                      ? `
                      <img
                        src="${sellerAvatarUrl}"
                        alt="${escapeAttr(sellerAvatarAlt)}"
                        class="h-12 w-12 rounded-full object-cover border border-brand-border transition-colors group-hover:border-brand-accent"
                        loading="lazy"
                      />
                    `
                      : ""
                  }
                  <span class="group-hover:font-semibold">${escapeHtml(sellerName)}</span>
                </a>
              `
                : `
                <span class="inline-flex items-center gap-2 text-brand-ink font-medium">
                  ${
                    sellerAvatarUrl
                      ? `
                      <img
                        src="${sellerAvatarUrl}"
                        alt="${escapeAttr(sellerAvatarAlt)}"
                        class="h-8 w-8 rounded-full object-cover"
                        loading="lazy"
                      />
                    `
                      : ""
                  }
                  <span>${escapeHtml(sellerName)}</span>
                </span>
              `
            }
          </p>

          ${
            description
              ? `
              <div class="mt-3">
                <h2>Description</h2>
                <p>${escapeHtml(description)}</p>
              </div>
            `
              : ""
          }

          <!-- MAIN LAYOUT: LEFT CAROUSEL + RIGHT INFO -->
          <div class="mt-4 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <!-- LEFT: IMAGE CAROUSEL -->
            <div class="space-y-3">
              ${
                mediaItems.length
                  ? `
                    <div class="w-full flex justify-center">
                      <div class="inline-block max-w-full rounded-2xl overflow-hidden card">
                        <img
                          id="mainListingImage"
                          src="${mediaItems[0].url}"
                          alt="${escapeAttr(mediaItems[0].alt || title)}"
                          class="block max-h-[28rem] max-w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    <div class="flex gap-2 overflow-x-auto pt-1">
                      ${mediaItems
                        .map(
                          (m, idx) => `
                                                       <button
                              type="button"
                              class="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 ${
                                idx === 0
                                  ? "border-brand-accent opacity-100"
                                  : "border-brand-border opacity-80 hover:opacity-100"
                              }"
                              data-media-index="${idx}"
                              aria-label="Show image ${idx + 1}"
                            >
                              <img
                                src="${m.url}"
                                alt="${escapeAttr(m.alt || title)}"
                                class="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          `,
                        )
                        .join("")}
                    </div>
                  `
                  : `
                    <div class="rounded-2xl bg-slate-50 p-4 text-sm text-brand-muted">
                      No images provided.
                    </div>
                  `
              }
            </div>

            <!-- RIGHT: ENDS / HIGHEST BID / PLACE BID / BIDDERS -->
            <div class="flex flex-col gap-4">
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="card card-pad">
                  <h3 class="text-base">Ends</h3>
                  <p>${escapeHtml(formatTimeLeft(endsAt))}</p>
                </div>
                <div class="card card-pad">
                  <h3 class="text-base">Highest bid</h3>
                  <p>
                    <span class="text-brand-ink font-semibold">
                      ${current} credits
                    </span>
                  </p>
                </div>
              </div>

              <div class="card card-pad">
                <h2>Place a bid</h2>
                ${
                  !isLoggedIn
                    ? `
                      <p>You must log in to place a bid.</p>
                      <button id="goLoginBtn" class="btn-primary mt-2">
                        Login to bid
                      </button>
                    `
                    : isSeller
                      ? `<p>You can’t bid on your own listing.</p>`
                      : ended
                        ? `<p>This auction has ended.</p>`
                        : `
                      <form
                        id="bidForm"
                        class="mt-2 flex flex-col gap-1 sm:gap-2"
                      >
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div class="flex-1">
                            <label for="bidAmount">Bid amount</label>
                            <input
                              id="bidAmount"
                              type="number"
                              min="${current + 1}"
                              step="1"
                              placeholder="e.g. ${current + 1}"
                            />
                          </div>
                          <button
                            class="btn-primary sm:ml-3 sm:flex-shrink-0"
                            type="submit"
                          >
                            Place bid
                          </button>
                        </div>
                        <small>Must be higher than ${current} credits.</small>
                      </form>
                    `
                }
              </div>

              <div class="card card-pad">
                <h2>Bidders</h2>
                ${renderBids(bids)}
              </div>
            </div>
          </div>
        </div>
      </section>

      ${
        isSeller
          ? `
        <!-- Edit listing modal -->
        <div
          id="editListingModal"
          class="fixed inset-0 z-50 hidden bg-black/40 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div class="card card-pad w-full max-w-2xl mx-4 relative">
            <button
              id="editListingClose"
              type="button"
              class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-border bg-white text-sm hover:bg-slate-50"
            >
              ✕
              <span class="sr-only">Close</span>
            </button>

            <h2>Edit listing</h2>
            <p class="text-sm text-brand-muted mb-4">
              Update the title, description, deadline, and media URLs for this listing.
            </p>

            <form id="editListingForm" class="mt-2 flex flex-col gap-4">
              <div>
                <label for="editTitle">Title</label>
                <input
                  id="editTitle"
                  type="text"
                  required
                  value="${escapeAttr(title)}"
                />
              </div>

              <div>
                <label for="editDescription">Description</label>
                <textarea
                  id="editDescription"
                  rows="4"
                >${escapeHtml(description)}</textarea>
              </div>

                <div class="flex flex-col gap-1">
                  <label for="editEndsAt">Deadline</label>
                  <div class="w-1/2 max-w-full overflow-x-auto rounded">
                  <input
                    id="editEndsAt"
                    type="datetime-local"
                    value="${escapeAttr(endsAtLocal)}"
                    disabled
                  />
                  </div>
                  <small>This deadline can't be changed after the listing is created.</small>
                </div>


              <div class="card card-pad">
                <h3 class="text-base">Media URLs</h3>
                <p class="text-sm text-brand-muted">Add, remove, or re-order image URLs.</p>

                <div id="editMediaList" class="mt-3 flex flex-col gap-2"></div>

                <div class="mt-3 flex gap-2">
                  <input
                    id="editMediaUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    class="flex-1"
                  />
                  <button
                    id="editAddMediaBtn"
                    type="button"
                    class="btn-secondary"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  id="editListingCancel"
                  class="btn-secondary"
                >
                  Cancel
                </button>
                <button class="btn-primary" type="submit">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      `
          : ""
      }
    `;

    // Go to login when not logged in
    const goLoginBtn = mount.querySelector("#goLoginBtn");
    if (goLoginBtn) {
      goLoginBtn.addEventListener("click", () => {
        navigate(`/login?returnTo=${encodeURIComponent(`/listing/${id}`)}`);
      });
    }

    // Bid form handling
    const bidForm = mount.querySelector("#bidForm");
    if (bidForm) {
      bidForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideFeedback();

        const amountInput = bidForm.querySelector("#bidAmount");
        const rawValue = amountInput?.value?.trim();
        const amount = Number(rawValue);

        if (!Number.isFinite(amount) || amount <= current) {
          const msg = `Bid must be higher than ${current} credits.`;
          showFeedback(msg);
          showToast(msg, "error");
          return;
        }

        try {
          await apiPost(`/listings/${id}/bids`, { amount });

          await maybeRefreshCredit();

          // ✅ Toast success
          showToast("Bid placed successfully!");

          await listingPage({ params, mountEl: mount });
        } catch (error) {
          console.error(error);
          const msg = error?.message || "Failed to place bid.";
          showFeedback(msg);
          showToast(msg, "error");
        }
      });
    }

    // Image carousel behavior
    if (mediaItems.length > 0) {
      const mainImg = mount.querySelector("#mainListingImage");
      const thumbButtons = mount.querySelectorAll("[data-media-index]");

      thumbButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-media-index") || "0");
          const item = mediaItems[idx];

          if (mainImg && item) {
            mainImg.src = item.url;
            mainImg.alt = item.alt || title;
          }

          thumbButtons.forEach((b) => {
            b.classList.remove("border-brand-accent", "opacity-100");
            b.classList.add("border-brand-border", "opacity-80");
          });
          btn.classList.remove("border-brand-border", "opacity-80");
          btn.classList.add("border-brand-accent", "opacity-100");
        });
      });
    }

    // Edit / delete listing (seller only)
    if (isSeller) {
      const editBtn = mount.querySelector("#editListingBtn");
      const deleteBtn = mount.querySelector("#deleteListingBtn");
      const modal = mount.querySelector("#editListingModal");
      const modalForm = mount.querySelector("#editListingForm");

      const editMediaListEl = modal?.querySelector("#editMediaList");
      const editMediaUrlEl = modal?.querySelector("#editMediaUrl");
      const editAddMediaBtn = modal?.querySelector("#editAddMediaBtn");

      // Use setupMediaList to manage media URLs in the edit modal
      const mediaManager = setupMediaList({
        listElement: editMediaListEl,
        initialItems: mediaItems.map((m) => m.url),
      });

      const modalApi = setupModal({
        modal,
        openButton: editBtn,
        closeButtons: [
          mount.querySelector("#editListingClose"),
          mount.querySelector("#editListingCancel"),
        ],
      });

      // Delete listing
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
          const ok = window.confirm(
            "Are you sure you want to delete this listing? This cannot be undone.",
          );
          if (!ok) return;

          try {
            await apiDelete(`/listings/${id}`);
            showToast("Listing deleted successfully!");
            navigate("/profile");
          } catch (err) {
            console.error(err);
            const msg = err?.message || "Failed to delete listing.";
            showFeedback(msg);
            showToast(msg, "error");
          }
        });
      }

      // Add media URL button (using mediaManager)
      if (editAddMediaBtn && editMediaUrlEl) {
        editAddMediaBtn.addEventListener("click", () => {
          hideFeedback();
          const url = editMediaUrlEl.value.trim();
          if (!url) return;
          mediaManager.add(url);
          editMediaUrlEl.value = "";
        });
      }

      // Edit form submit – PUT listing + close modal via helper
      if (modalForm) {
        modalForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          hideFeedback();

          const newTitle =
            modalForm.querySelector("#editTitle")?.value.trim() || "";
          const newDescription =
            modalForm.querySelector("#editDescription")?.value.trim() || "";
          const endsAtInput =
            modalForm.querySelector("#editEndsAt")?.value || "";

          const endsAtDate = new Date(endsAtInput);
          if (
            !Number.isFinite(endsAtDate.getTime()) ||
            endsAtDate.getTime() <= Date.now()
          ) {
            const msg = "Deadline must be a valid future date/time.";
            showFeedback(msg);
            showToast(msg, "error");
            return;
          }

          const currentMediaUrls = mediaManager.getItems();

          const payload = {
            title: newTitle,
            description: newDescription,
            endsAt: endsAtDate.toISOString(),
            media: currentMediaUrls.map((url) => ({ url })),
          };

          try {
            await apiPut(`/listings/${id}`, payload);
            modalApi.close();
            showToast("Listing updated successfully!");
            await listingPage({ params, mountEl: mount });
          } catch (err) {
            console.error(err);
            const msg = err?.message || "Failed to update listing.";
            showFeedback(msg);
            showToast(msg, "error");
          }
        });
      }
    }
  } catch (err) {
    console.error(err);
    showFeedback(err?.message || "Failed to load listing.");
    mount.innerHTML = `
      <section class="card card-pad">
        <h1>Could not load listing</h1>
        <p>${escapeHtml(err?.message || "Unknown error")}</p>
        <a href="#/" class="btn-secondary mt-3 inline-flex hover:no-underline hover:font-semibold">
          Back to home
        </a>
      </section>
    `;
  }
}
// toLocalDateTimeValue
/**
 * Converts an ISO date string into a local datetime-local input value.
 * @param {string | null} iso - ISO 8601 datetime string.
 * @returns {string} Local datetime string in "YYYY-MM-DDTHH:mm" format, or empty string.
 */
function toLocalDateTimeValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// renderBids
/**
 * Renders a table of bids for a listing as an HTML string.
 * @param {Array<Object>} [bids=[]] - Bids array from the API.
 * @returns {string} HTML string representing the bids table or an empty state.
 */
function renderBids(bids = []) {
  if (!Array.isArray(bids) || bids.length === 0) {
    return `<p class="text-sm text-brand-muted">No bids yet.</p>`;
  }

  const sorted = [...bids].sort(
    (a, b) => Number(b.amount || 0) - Number(a.amount || 0),
  );

  return `
    <div class="mt-2 overflow-hidden rounded-lg border border-brand-border bg-white">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left">
          <tr>
            <th class="p-3">Bidder</th>
            <th class="p-3">Amount</th>
            <th class="p-3">Time</th>
          </tr>
        </thead>
        <tbody>
          ${sorted
            .map(
              (b) => `
              <tr class="border-t border-brand-border">
                <td class="p-3">
                  ${
                    b?.bidder?.name
                      ? `
                      <a
                        href="#/profile/${encodeURIComponent(b.bidder.name)}"
                        class="group flex items-center gap-2 hover:no-underline"
                      >
                        ${
                          b?.bidder?.avatar?.url
                            ? `
                            <img
                              src="${b.bidder.avatar.url}"
                              alt="${escapeAttr(
                                b.bidder.avatar.alt ||
                                  b.bidder.name ||
                                  "Bidder avatar",
                              )}"
                              class="h-8 w-8 rounded-full object-cover border border-brand-border transition-colors group-hover:border-brand-accent"
                              loading="lazy"
                            />
                          `
                            : `
                            <div class="h-8 w-8 rounded-full bg-slate-200 border border-brand-border transition-colors group-hover:border-brand-accent"></div>
                          `
                        }
                        <span class="group-hover:font-semibold">${escapeHtml(b.bidder.name)}</span>
                      </a>
                    `
                      : `
                      <div class="flex items-center gap-2">
                        ${
                          b?.bidder?.avatar?.url
                            ? `
                            <img
                              src="${b.bidder.avatar.url}"
                              alt="${escapeAttr(
                                b.bidder.avatar.alt || "Bidder avatar",
                              )}"
                              class="h-8 w-8 rounded-full object-cover"
                              loading="lazy"
                            />
                          `
                            : `
                            <div class="h-8 w-8 rounded-full bg-slate-200"></div>
                          `
                        }
                        <span>${escapeHtml(b?.bidder?.name ?? "—")}</span>
                      </div>
                    `
                  }
                </td>

                <td class="p-3 font-semibold">
                  ${Number(b.amount || 0)} credits
                </td>
                <td class="p-3 text-brand-muted">
                  ${escapeHtml(b?.created ? timeAgo(b.created) : "")}
                </td>
              </tr>
            `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}
