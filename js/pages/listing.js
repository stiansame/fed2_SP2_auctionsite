// ./js/pages/listing.js
import { apiGet, apiPost } from "../api.js";
import { getAuth } from "../state.js";
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
} from "../ui.js";

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

  // Initial skeleton
  mount.innerHTML = `
    <section class="card card-pad">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1>Listing</h1>
          <p>Loading…</p>
        </div>
        <a href="#/" class="btn-secondary">Back</a>
      </div>
    </section>
  `;

  try {
    const res = await apiGet(`/listings/${id}`, {
      query: { _bids: true, _seller: true },
    });

    const listing = res?.data ?? res;

    const title = listing?.title ?? "Untitled";
    const description = listing?.description ?? "";
    const endsAt = listing?.endsAt;
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
    const current = highestBidAmount({ bids });

    const media = listing?.media;
    const mediaItems = Array.isArray(media)
      ? media
          .map((m) => (typeof m === "string" ? { url: m, alt: "" } : (m ?? {})))
          .filter((m) => m.url)
      : [];

    const { isLoggedIn, user } = getAuth();
    const isSeller =
      isLoggedIn && user?.name && listing?.seller?.name === user.name;

    mount.innerHTML = `
      <section class="card card-pad">
        <div class="flex items-start justify-between gap-4">
          <div>
                      <span class="${ended ? "badge-neutral" : "badge-warning"}">
            ${ended ? "Ended" : "Active"}
          </span>
          </div>
          <a href="#/" class="btn-secondary">Back</a>
        </div>


        <div class="flex flex-col gap-2 mt-4">
          <h1>${escapeHtml(title)}</h1>
<p>
  ${
    sellerProfileHref
      ? `
      <a
        href="${sellerProfileHref}"
        class="inline-flex items-center gap-2 text-brand-ink font-medium"
      >
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

          <div class="mt-2 grid gap-3 sm:grid-cols-2">
            <div class="card card-pad">
              <h3 class="text-base">Ends</h3>
              <p>${escapeHtml(formatTimeLeft(endsAt))}</p>
            </div>
            <div class="card card-pad">
              <h3 class="text-base">Highest bid</h3>
              <p>
                <span class="text-brand-ink font-semibold">
                  ${current}
                </span>
              </p>
            </div>
          </div>

          ${
            mediaItems.length
              ? `
                <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  ${mediaItems
                    .map(
                      (m) => `
                    <div class="aspect-[16/10] overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src="${m.url}"
                        alt="${escapeAttr(m.alt || title)}"
                        class="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  `,
                    )
                    .join("")}
                </div>
              `
              : `
                <div class="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-brand-muted">
                  No images provided.
                </div>
              `
          }

          ${
            description
              ? `
                <div class="mt-4">
                  <h2>Description</h2>
                  <p>${escapeHtml(description)}</p>
                </div>
              `
              : ""
          }

          <div class="mt-6">
            <h2>Bids</h2>
            ${renderBids(bids)}
          </div>

          <div class="mt-6">
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
                    class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end"
                  >
                    <div class="flex-1">
                      <label for="bidAmount">Bid amount</label>
                      <input
                        id="bidAmount"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g. ${current + 1}"
                      />
                      <small>Must be higher than ${current}.</small>
                    </div>
                    <button class="btn-primary" type="submit">
                      Place bid
                    </button>
                  </form>
                `
            }
          </div>
        </div>
      </section>
    `;

    const goLoginBtn = mount.querySelector("#goLoginBtn");
    if (goLoginBtn) {
      goLoginBtn.onclick = () =>
        navigate(`/login?returnTo=${encodeURIComponent(`/listing/${id}`)}`);
    }

    const bidForm = mount.querySelector("#bidForm");
    if (bidForm) {
      bidForm.onsubmit = async (e) => {
        e.preventDefault();
        hideFeedback();

        const amount = Number(mount.querySelector("#bidAmount")?.value);
        if (!Number.isFinite(amount) || amount <= current) {
          showFeedback(`Bid must be higher than ${current}.`);
          return;
        }

        try {
          await apiPost(`/listings/${id}/bids`, { amount });
          navigate(`/listing/${id}`);
        } catch (err) {
          console.error(err);
          showFeedback(err?.message || "Failed to place bid.");
        }
      };
    }
  } catch (err) {
    console.error(err);
    showFeedback(err?.message || "Failed to load listing.");
    mount.innerHTML = `
      <section class="card card-pad">
        <h1>Could not load listing</h1>
        <p>${escapeHtml(err?.message || "Unknown error")}</p>
        <a href="#/" class="btn-secondary mt-3 inline-flex">
          Back to home
        </a>
      </section>
    `;
  }
}

function renderBids(bids) {
  if (!Array.isArray(bids) || bids.length === 0) {
    return `<p>No bids yet.</p>`;
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
        class="flex items-center gap-2"
      >
        ${
          b?.bidder?.avatar?.url
            ? `
            <img
              src="${b.bidder.avatar.url}"
              alt="${escapeAttr(
                b.bidder.avatar.alt || b.bidder.name || "Bidder avatar",
              )}"
              class="h-8 w-8 rounded-full object-cover"
              loading="lazy"
            />
          `
            : `
            <div class="h-8 w-8 rounded-full bg-slate-200"></div>
          `
        }
        <span>${escapeHtml(b.bidder.name)}</span>
      </a>
    `
      : `
      <div class="flex items-center gap-2">
        ${
          b?.bidder?.avatar?.url
            ? `
            <img
              src="${b.bidder.avatar.url}"
              alt="${escapeAttr(b.bidder.avatar.alt || "Bidder avatar")}"
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
                  ${Number(b.amount || 0)}
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
