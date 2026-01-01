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

// --- Toast helpers ---

let toastIdCounter = 0;
let activeToasts = [];

export function showToast(
  message = "Success!",
  type = "success",
  timeout = 3000,
) {
  const root = document.getElementById("toastRoot");
  if (!root) return;

  const id = ++toastIdCounter;

  activeToasts.push({
    id,
    message: String(message ?? ""),
    type,
    timeout,
  });

  // keep only the last 3 toasts
  if (activeToasts.length > 3) {
    activeToasts = activeToasts.slice(-3);
  }

  renderToasts(root);

  if (timeout && timeout > 0) {
    setTimeout(() => {
      removeToast(id);
    }, timeout);
  }
}

export function clearToasts() {
  activeToasts = [];
  const root = document.getElementById("toastRoot");
  if (root) root.innerHTML = "";
}

function removeToast(id) {
  const root = document.getElementById("toastRoot");
  if (!root) return;
  activeToasts = activeToasts.filter((t) => t.id !== id);
  renderToasts(root);
}

function renderToasts(root) {
  root.innerHTML = "";

  activeToasts.forEach((toast) => {
    const el = document.createElement("div");

    const colorClasses =
      toast.type === "error"
        ? "bg-red-100 border-red-300 text-red-900"
        : "bg-green-100 border-green-300 text-green-900";

    el.className = `
      pointer-events-auto max-w-sm w-full sm:w-auto
      rounded-lg border px-4 py-3 shadow
      flex items-start gap-3
      ${colorClasses}
    `;

    el.innerHTML = `
      <span class="flex-1 text-sm">${escapeHtml(toast.message)}</span>
      <button
        type="button"
        class="rounded-md border bg-white/60 px-2 text-xs hover:bg-white"
        aria-label="Close notification"
      >
        ✕
      </button>
    `;

    const closeBtn = el.querySelector("button");
    closeBtn.addEventListener("click", () => removeToast(toast.id));

    root.appendChild(el);
  });
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Function to display time ago
export function timeAgo(isoString) {
  try {
    const then = new Date(isoString).getTime();
    const now = Date.now();
    if (Number.isNaN(then)) return "";

    const diffMs = Math.max(0, now - then);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

    const months = Math.floor(diffDay / 30);
    if (months < 12) {
      return `${months} month${months === 1 ? "" : "s"} ago`;
    }

    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  } catch {
    return "";
  }
}

//Function to display time left
export function formatTimeLeft(endsAt) {
  if (!endsAt) return "";

  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return "";

  const diffMs = end.getTime() - Date.now();

  if (diffMs <= 0) {
    return "Ended";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function escapeAttr(str) {
  return escapeHtml(str).replaceAll("\n", "");
}

export function setPageTitle(text = "Home") {
  document.title = `Noroff TradeHub | ${text}`;
}
