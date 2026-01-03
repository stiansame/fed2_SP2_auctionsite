// ./js/components/listingCard.js
import {
  formatTimeLeft,
  isEnded,
  highestBidAmount,
  escapeHtml,
  timeAgo,
  escapeAttr,
} from "../ui.js";

// safeImg
/**
 * Normalizes an image URL value to a safe string.
 * @param {unknown} url - Potential image URL value.
 * @returns {string} Valid URL string or an empty string.
 */
function safeImg(url) {
  return url && typeof url === "string" ? url : "";
}

// listingCardHTML
/**
 * Builds a listing card HTML string for use in grids and lists.
 * @param {Object} listing - Listing object returned from the API.
 * @returns {string} HTML string for the listing card anchor.
 */
export function listingCardHTML(listing) {
  const id = listing?.id;
  const title = listing?.title ?? "Untitled";

  const endsAt = listing?.endsAt || listing?.ends_at || listing?.deadline;

  // ✅ Prefer Noroff's "_active" flag if present, fall back to date-based check
  const hasActiveFlag = typeof listing?._active === "boolean";
  const ended = hasActiveFlag ? !listing._active : isEnded(endsAt);

  // Noroff listings often have `media: [{url: "..."}]` or `media: ["..."]`
  const media = listing?.media;
  const firstUrl =
    Array.isArray(media) && media.length
      ? typeof media[0] === "string"
        ? media[0]
        : media[0]?.url
      : "";

  const imgUrl = safeImg(firstUrl);
  const current = highestBidAmount(listing);
  const hasBids = Array.isArray(listing?.bids) && listing.bids.length > 0;

  return `
            <a
          href="#/listing/${id}"
          class="card card-pad block
                border border-brand-border
                hover:border-brand-accent
                transition-colors duration-150
                hover:shadow-lg
                no-underline hover:no-underline"
        >
      <div class="aspect-[16/10] overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
        ${
          imgUrl
            ? `<img src="${imgUrl}" alt="${escapeHtml(title)}" class="h-full w-full object-cover" loading="lazy" />`
            : `<span class="text-sm text-brand-muted">No image</span>`
        }
      </div>

      <div class="mt-4 flex items-start justify-between gap-3">
        <h3 class="text-base font-semibold text-brand-ink">${escapeHtml(title)}</h3>
        <span class="${ended ? "badge-neutral" : "badge-warning"}">
          ${ended ? "Ended" : "Active"}
        </span>
      </div>

      ${
        hasBids
          ? `
        <div class="mt-2 flex items-center justify-between">
          <span class="text-sm text-brand-muted">Highest bid</span>
          <span class="text-sm font-semibold text-brand-ink">${current} credits</span>
        </div>
        `
          : `
        <div class="mt-2 text-sm font-semibold text-brand-muted">
          NO BID YET!
        </div>
        `
      }

      <div class="mt-1 flex items-center justify-between">
        <span class="text-sm text-brand-muted">Ends in</span>
        <span class="text-sm text-brand-ink">${escapeHtml(formatTimeLeft(endsAt))}</span>
      </div>
    </a>
  `;
}

// bidCardHTML
/**
 * Builds a bid history card HTML string for a single bid.
 * @param {Object} bid - Bid object enriched with listing and status info.
 * @returns {string} HTML string for the bid card.
 */
export function bidCardHTML(bid) {
  const amount = Number(bid?.amount || 0);
  const created = bid?.created || null;
  const listing = bid?.listing ?? {};
  const listingTitle = listing?.title || "Listing";
  const listingId = listing?.id ?? null;

  const mediaArray = Array.isArray(listing?.media) ? listing.media : [];
  const thumb = mediaArray[0] ?? null;
  const thumbUrl = thumb?.url || "";
  const thumbAlt = thumb?.alt || listingTitle;

  const timeText = created ? timeAgo(created) : "";

  // endsAt -> for "Ends in" time left
  const endsAt =
    listing?.endsAt || listing?.ends_at || listing?.deadline || null;
  const endsInText = endsAt ? formatTimeLeft(endsAt) : "";

  // status badge based on `_status`
  let statusLabel = "";
  let statusClasses = "";

  switch (bid?._status) {
    case "won":
      statusLabel = "Won";
      statusClasses = "bg-emerald-100 text-emerald-800 border-emerald-200";
      break;
    case "lost":
      statusLabel = "Lost";
      statusClasses = "bg-slate-100 text-slate-600 border-slate-200";
      break;
    case "leading":
      statusLabel = "Leading";
      statusClasses = "bg-blue-100 text-blue-800 border-blue-200";
      break;
    case "outbid":
      statusLabel = "Outbid";
      statusClasses = "bg-amber-100 text-amber-800 border-amber-200";
      break;
    default:
      statusLabel = "";
      statusClasses = "";
  }

  const badgeHtml = statusLabel
    ? `<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClasses}">
         ${statusLabel}
       </span>`
    : "";

  if (!listingId) {
    // Fallback non-clickable
    return `
            <article
              class="card card-pad flex gap-3 items-center
                    border border-brand-border
                    hover:border-brand-accent
                    transition-colors"
            >
          ${
            thumbUrl
              ? `<img src="${thumbUrl}" alt="${escapeAttr(thumbAlt)}" class="h-full w-full object-cover" />`
              : `<div class="h-full w-full flex items-center justify-center text-xs text-brand-muted">No image</div>`
          }
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-1">
            <h3 class="font-semibold text-sm break-words">
              ${escapeHtml(listingTitle)}
            </h3>
            ${badgeHtml}
          </div>
          <p class="text-sm">
            Bid: <span class="font-semibold">${amount} Credits</span>
          </p>
          ${
            endsInText
              ? `<p class="text-xs text-brand-muted">
                   Ends in ${escapeHtml(endsInText)}
                 </p>`
              : ""
          }
          <p class="text-xs text-brand-muted">
            Bid placed ${escapeHtml(timeText)}
          </p>
        </div>
      </article>
    `;
  }

  // Clickable card
  return `
<a
  href="#/listing/${listingId}"
  class="card card-pad flex gap-3 items-center
         border border-brand-border
         hover:border-brand-accent
         transition-colors
         no-underline hover:no-underline"
>

      <div class="h-16 w-16 rounded-md overflow-hidden bg-slate-200 flex-shrink-0">
        ${
          thumbUrl
            ? `<img src="${thumbUrl}" alt="${escapeAttr(thumbAlt)}" class="h-full w-full object-cover" />`
            : `<div class="h-full w-full flex items-center justify-center text-xs text-brand-muted">No image</div>`
        }
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2 mb-1">
          <h3 class="font-semibold text-sm break-words">
            ${escapeHtml(listingTitle)}
          </h3>
          ${badgeHtml}
        </div>
        <p class="text-sm">
          Bid: <span class="font-semibold">${amount} Credits</span>
        </p>
        ${
          endsInText
            ? `<p class="text-xs text-brand-muted">
                 Ends in ${escapeHtml(endsInText)}
               </p>`
            : ""
        }
        <p class="text-xs text-brand-muted">
          Bid placed ${escapeHtml(timeText)}
        </p>
      </div>
    </a>
  `;
}
