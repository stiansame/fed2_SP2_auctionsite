// ./js/pages/profile.js
import { apiGet, apiPut } from "../api.js";
import { getAuth, setCredit } from "../state.js";
import { renderHeader } from "../components/header.js";
import {
  showFeedback,
  hideFeedback,
  showToast,
  escapeAttr,
  escapeHtml,
} from "../ui.js";
import { listingCardHTML, bidCardHTML } from "../components/listingCard.js";

export async function profilePage({ mountEl }) {
  hideFeedback();

  const mount = mountEl || document.getElementById("appView");
  if (!mount) return;

  const { user } = getAuth();
  if (!user?.name) return;

  // Initial skeleton
  mount.innerHTML = `
    <section class="card card-pad max-w-5xl mx-auto">
      <h1>Profile</h1>
      <p>Loading profile…</p>
    </section>
  `;

  try {
    // Fetch profile + user listings + wins + bids in parallel
    const [profileRes, listingsRes, winsRes, bidsRes] = await Promise.all([
      apiGet(`/profiles/${user.name}`),
      apiGet(`/profiles/${user.name}/listings`),
      apiGet(`/profiles/${user.name}/wins`),
      apiGet(`/profiles/${user.name}/bids`, { query: { _listings: true } }),
    ]);

    const profile = profileRes?.data ?? profileRes;
    const listings = listingsRes?.data ?? listingsRes ?? [];
    const wins = winsRes?.data ?? winsRes ?? [];
    const rawBids = bidsRes?.data ?? bidsRes ?? [];

    // Get unique listing ids from bids
    const listingIds = [
      ...new Set(rawBids.map((b) => b?.listing?.id).filter(Boolean)),
    ];

    // Fetch full listing details with bids & seller
    const listingDetailResponses = await Promise.all(
      listingIds.map((id) =>
        apiGet(`/listings/${id}`, { query: { _seller: true, _bids: true } }),
      ),
    );

    const listingMap = new Map();
    listingDetailResponses.forEach((res) => {
      const listing = res?.data ?? res;
      if (listing?.id) {
        listingMap.set(listing.id, listing);
      }
    });

    // Enrich bids with status (`_status`)
    const bids = enrichBidsWithStatus(rawBids, listingMap, user.name);

    const name = profile?.name || user.name;
    const email = profile?.email || user.email;
    const bio = profile?.bio || "";

    const avatarUrl = profile?.avatar?.url || "";
    const avatarAlt = profile?.avatar?.alt || "";

    const bannerUrl = profile?.banner?.url || "";
    const bannerAlt = profile?.banner?.alt || "";

    const credits = typeof profile?.credits === "number" ? profile.credits : 0;

    // Persist credits + sync header badge
    setCredit(credits);
    renderHeader({ credit: credits });

    mount.innerHTML = `
      <section class="card card-pad max-w-5xl mx-auto">

        <div class="mb-4 flex items-center justify-between">
          <h1>Profile</h1>
          <a href="#/" class="btn-secondary">← Back</a>
        </div>

        ${
          bannerUrl
            ? `
          <div class="rounded-xl overflow-hidden mb-4 border border-brand-border">
            <img
              src="${bannerUrl}"
              alt="${escapeAttr(bannerAlt || name + " banner")}"
              class="w-full h-48 object-cover"
            />
          </div>
        `
            : ""
        }

        <div class="flex items-start gap-4 flex-wrap">
          <div class="relative">
            <div class="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border border-brand-border">
              ${
                avatarUrl
                  ? `<img src="${avatarUrl}" alt="${escapeAttr(
                      avatarAlt || name + " avatar",
                    )}" class="h-full w-full object-cover" />`
                  : `<div class="h-full w-full flex items-center justify-center text-sm text-brand-muted">No avatar</div>`
              }
            </div>

            <!-- EDIT BUTTON OVERLAPPING AVATAR -->
            <button
              id="editProfileBtn"
              type="button"
              class="absolute -bottom-1 -right-1 h-8 w-8
                     inline-flex items-center justify-center
                     rounded-full border border-brand-border bg-white
                     shadow
                     hover:bg-slate-50
                     hover:ring-2 hover:ring-slate-300 hover:ring-offset-2 hover:ring-offset-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white
                     text-[10px]"
              aria-label="Edit profile visuals"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" class="h-3.5 w-3.5">
                <path
                  d="M4 13.5V16h2.5l7-7-2.5-2.5-7 7zM14.9 7.1l-2-2a1 1 0 0 1 1.4-1.4l2 2a1 1 0 0 1-1.4 1.4z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          <div>
            <h2 class="text-lg font-semibold">${escapeHtml(name)}</h2>
            <p class="text-sm text-brand-muted">${escapeHtml(email)}</p>
            <p class="mt-1 text-sm font-medium">
              💰 ${credits}
            </p>
          </div>
        </div>

        ${
          bio
            ? `
          <div class="mt-6">
            <h2>Bio</h2>
            <p>${escapeHtml(bio)}</p>
          </div>
        `
            : ""
        }

        <!-- TABS / FOLDERS -->
        <div class="mt-10">
          <div class="flex flex-wrap gap-2 border-b border-brand-border mb-4">
            <button
              type="button"
              data-tab="listings"
              class="px-3 py-1 text-sm font-medium border-b-2 border-brand-ink text-brand-ink"
            >
              Your listings
            </button>
            <button
              type="button"
              data-tab="wins"
              class="px-3 py-1 text-sm font-medium border-b-2 border-transparent text-brand-muted hover:text-brand-ink hover:border-b-brand-border"
            >
              Auctions you've won
            </button>
            <button
              type="button"
              data-tab="bids"
              class="px-3 py-1 text-sm font-medium border-b-2 border-transparent text-brand-muted hover:text-brand-ink hover:border-b-brand-border"
            >
              Bid history
            </button>
          </div>

          <!-- PANEL: LISTINGS -->
          <div id="panelListings">
            <div class="flex items-center justify-between gap-2 mb-3">
              <h2 class="text-base font-semibold">Your listings</h2>
            </div>

            ${
              listings.length
                ? `
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  ${listings.map(listingCardHTML).join("")}
                </div>
              `
                : `<p class="text-sm text-brand-muted">You haven’t created any listings yet.</p>`
            }
          </div>

          <!-- PANEL: WINS -->
          <div id="panelWins" class="hidden">
            <h2 class="text-base font-semibold mb-3">Auctions you've won</h2>
            ${
              wins.length
                ? `
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  ${wins.map(listingCardHTML).join("")}
                </div>
              `
                : `<p class="text-sm text-brand-muted">You haven’t won any auctions yet.</p>`
            }
          </div>

          <!-- PANEL: BIDS -->
          <div id="panelBids" class="hidden">
            <h2 class="text-base font-semibold mb-3">Bid history</h2>
            ${
              bids.length
                ? `
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  ${bids.map(bidCardHTML).join("")}
                </div>
              `
                : `<p class="text-sm text-brand-muted">You haven’t placed any bids yet.</p>`
            }
          </div>
        </div>
      </section>

      <!-- Edit modal -->
      <div
        id="editProfileModal"
        class="fixed inset-0 z-50 hidden bg-black/40 flex items-center justify-center"
        aria-modal="true"
        role="dialog"
      >
        <div class="card card-pad w-full max-w-lg mx-4 relative">
          <button
            id="editModalClose"
            type="button"
            class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-border bg-white text-sm hover:bg-slate-50"
          >
            ✕
            <span class="sr-only">Close</span>
          </button>

          <h2>Edit profile visuals</h2>
          <p class="text-sm text-brand-muted mb-4">
            Update your avatar and banner images using direct image URLs.
          </p>

          <form id="editProfileForm" class="flex flex-col gap-4">
            <div>
              <label for="modalAvatarUrl">Avatar URL</label>
              <input
                id="modalAvatarUrl"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value="${escapeAttr(avatarUrl)}"
              />
              <small>Recommended: square image, will be shown as a circle.</small>
            </div>

            <div>
              <label for="modalBannerUrl">Banner URL</label>
              <input
                id="modalBannerUrl"
                type="url"
                placeholder="https://example.com/banner.jpg"
                value="${escapeAttr(bannerUrl)}"
              />
              <small>Recommended: wide image, will be cropped to 16:9.</small>
            </div>

            <div class="mt-2 flex justify-end gap-2">
              <button type="button" id="editModalCancel" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                Save changes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // ----- Tabs / folders -----
    const tabButtons = mount.querySelectorAll("[data-tab]");
    const panelListings = mount.querySelector("#panelListings");
    const panelWins = mount.querySelector("#panelWins");
    const panelBids = mount.querySelector("#panelBids");

    function setActiveTab(name) {
      tabButtons.forEach((btn) => {
        const isActive = btn.dataset.tab === name;
        if (isActive) {
          btn.classList.add("border-b-brand-ink", "text-brand-ink");
          btn.classList.remove("text-brand-muted", "border-transparent");
        } else {
          btn.classList.remove("border-b-brand-ink", "text-brand-ink");
          btn.classList.add("text-brand-muted", "border-transparent");
        }
      });

      if (panelListings)
        panelListings.classList.toggle("hidden", name !== "listings");
      if (panelWins) panelWins.classList.toggle("hidden", name !== "wins");
      if (panelBids) panelBids.classList.toggle("hidden", name !== "bids");
    }

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        setActiveTab(btn.dataset.tab);
      });
    });

    // default active tab
    setActiveTab("listings");

    // ----- Modal wiring -----
    const editBtn = mount.querySelector("#editProfileBtn");
    const modal = document.getElementById("editProfileModal");
    const modalClose = document.getElementById("editModalClose");
    const modalCancel = document.getElementById("editModalCancel");
    const modalForm = document.getElementById("editProfileForm");

    function openModal() {
      if (!modal) return;
      modal.classList.remove("hidden");
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.add("hidden");
    }

    if (editBtn) editBtn.addEventListener("click", openModal);
    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (modalCancel) modalCancel.addEventListener("click", closeModal);

    // Close on backdrop click
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
    }

    // ESC key closes modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    });

    // Handle avatar + banner updates in one go
    if (modalForm) {
      modalForm.onsubmit = async (e) => {
        e.preventDefault();
        hideFeedback();

        const newAvatar = modal.querySelector("#modalAvatarUrl").value.trim();
        const newBanner = modal.querySelector("#modalBannerUrl").value.trim();

        if (!newAvatar && !newBanner) {
          showFeedback("Please enter at least one URL to update.");
          showToast("Please enter at least one URL to update.", "error");
          return;
        }

        if (newAvatar && !isValidUrl(newAvatar)) {
          const msg = "Avatar URL must start with http or https.";
          showFeedback(msg);
          showToast(msg, "error");
          return;
        }

        if (newBanner && !isValidUrl(newBanner)) {
          const msg = "Banner URL must start with http or https.";
          showFeedback(msg);
          showToast(msg, "error");
          return;
        }

        try {
          const payload = {};

          if (newAvatar) {
            payload.avatar = {
              url: newAvatar,
              alt: profile?.avatar?.alt || "",
            };
          }

          if (newBanner) {
            payload.banner = {
              url: newBanner,
              alt: profile?.banner?.alt || "",
            };
          }

          await apiPut(`/profiles/${name}`, payload);

          closeModal();
          showToast("Profile updated successfully!");
          await profilePage({ mountEl: mount }); // re-render updated profile
        } catch (err) {
          console.error(err);
          const msg = err?.message || "Failed to update profile visuals.";
          showFeedback(msg);
          showToast(msg, "error");
        }
      };
    }
  } catch (err) {
    console.error(err);
    const msg = err?.message || "Failed to load profile.";
    showFeedback(msg);
    mount.innerHTML = `
      <section class="card card-pad max-w-5xl mx-auto">
        <h1>Profile</h1>
        <p>${escapeHtml(msg)}</p>
        <a href="#/" class="btn-secondary mt-3 inline-flex">Back</a>
      </section>
    `;
  }
}

function enrichBidsWithStatus(bids, listingMap, userName) {
  if (!Array.isArray(bids)) return [];

  const now = Date.now();

  return bids.map((bid) => {
    const listingId = bid?.listing?.id;
    const listing = listingId ? listingMap.get(listingId) : null;

    let status = null;

    if (listing && Array.isArray(listing.bids) && listing.bids.length > 0) {
      const sorted = [...listing.bids].sort(
        (a, b) => Number(b.amount || 0) - Number(a.amount || 0),
      );
      const top = sorted[0];
      const isTopBidder = top?.bidder?.name === userName;

      const endsAtMs = listing.endsAt
        ? new Date(listing.endsAt).getTime()
        : null;
      const ended =
        endsAtMs !== null && !Number.isNaN(endsAtMs) && endsAtMs < now;

      if (ended && isTopBidder) {
        status = "won";
      } else if (ended && !isTopBidder) {
        status = "lost";
      } else if (isTopBidder) {
        status = "leading";
      } else {
        status = "outbid";
      }
    }

    return { ...bid, _status: status };
  });
}

function isValidUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
