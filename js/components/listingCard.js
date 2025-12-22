// ./js/components/listingCard.js
import { formatEndsAt, isEnded, highestBidAmount } from "../ui.js";

function safeImg(url) {
  return url && typeof url === "string" ? url : "";
}

export function listingCardHTML(listing) {
  const id = listing?.id;
  const title = listing?.title ?? "Untitled";
  const endsAt = listing?.endsAt || listing?.ends_at || listing?.deadline;
  const ended = isEnded(endsAt);

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

  return `
    <a href="#/listing/${id}" class="card card-pad block hover:shadow-lg transition-shadow">
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

      <div class="mt-2 flex items-center justify-between">
        <span class="text-sm text-brand-muted">Highest bid</span>
        <span class="text-sm font-semibold text-brand-ink">${current}</span>
      </div>

      <div class="mt-1 flex items-center justify-between">
        <span class="text-sm text-brand-muted">Ends</span>
        <span class="text-sm text-brand-ink">${escapeHtml(formatEndsAt(endsAt))}</span>
      </div>
    </a>
  `;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
