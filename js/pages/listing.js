// ./js/pages/listing.js
import { apiGet, apiPost } from "../api.js";
import { getAuth } from "../state.js";
import { navigate } from "../router.js";
import {
  showFeedback,
  hideFeedback,
  formatEndsAt,
  isEnded,
  highestBidAmount,
  escapeHtml,
  escapeAttr,
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
    // v2: response is { data: { ...listing }, meta: {} }
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

    // Bids: included when _bids=true
    const bids = Array.isArray(listing?.bids) ? listing.bids : [];
    const current = highestBidAmount({ bids });

    // Media: [{ url, alt }]
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
      <section class="mb-4 flex items-center justify-between">
        <a href="#/" class="btn-secondary">← Back</a>
        <span class="${ended ? "badge-neutral" : "badge-warning"}">
          ${ended ? "Ended" : "Active"}
        </span>
      </section>

      <section class="card card-pad">
        <div class="flex flex-col gap-2">
          <h1>${escapeHtml(title)}</h1>
          <p>
            Seller:
            <span class="text-brand-ink font-medium">
              ${escapeHtml(sellerName)}
            </span>
          </p>

          <div class="mt-2 grid gap-3 sm:grid-cols-2">
            <div class="card card-pad">
              <h3 class="text-base">Ends</h3>
              <p>${escapeHtml(formatEndsAt(endsAt))}</p>
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

    // Wire events
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
          // v2: POST /auction/listings/{id}/bids with { amount }
          await apiPost(`/listings/${id}/bids`, { amount });
          // Reload listing page to show new bid
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
                  ${escapeHtml(b?.bidder?.name ?? "—")}
                </td>
                <td class="p-3 font-semibold">
                  ${Number(b.amount || 0)}
                </td>
                <td class="p-3 text-brand-muted">
                  ${escapeHtml(
                    b?.created ? new Date(b.created).toLocaleString() : "",
                  )}
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
