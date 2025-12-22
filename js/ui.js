// ./js/ui.js

export function showFeedback(message) {
  const box = document.getElementById("feedback");
  const text = document.getElementById("feedbackText");
  if (!box || !text) return;

  text.textContent = message || "Something went wrong.";
  box.classList.remove("hidden");
}

export function hideFeedback() {
  const box = document.getElementById("feedback");
  if (!box) return;
  box.classList.add("hidden");
}

export function setHomeViewState({
  loading = false,
  hasResults = true,
  showEmpty = false,
} = {}) {
  const loadingEl = document.getElementById("listingsLoading");
  const gridEl = document.getElementById("listingsGrid");
  const emptyEl = document.getElementById("listingsEmpty");

  if (loadingEl)
    loading
      ? loadingEl.classList.remove("hidden")
      : loadingEl.classList.add("hidden");
  if (gridEl)
    loading || !hasResults
      ? gridEl.classList.add("hidden")
      : gridEl.classList.remove("hidden");
  if (emptyEl)
    showEmpty
      ? emptyEl.classList.remove("hidden")
      : emptyEl.classList.add("hidden");
}

export function formatEndsAt(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString();
}

export function isEnded(isoString) {
  const d = new Date(isoString);
  return Number.isFinite(d.getTime()) ? d.getTime() <= Date.now() : false;
}

export function highestBidAmount(listing) {
  const bids = listing?.bids || listing?._bids || [];
  if (!Array.isArray(bids) || bids.length === 0) return 0;
  return Math.max(...bids.map((b) => Number(b.amount || 0)));
}
