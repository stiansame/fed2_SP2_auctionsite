// showFeedback
/**
 * Displays a feedback message in the global feedback area.
 * @param {string} message - Message to show to the user.
 * @returns {void}
 */
export function showFeedback(message) {
  const box = document.getElementById("feedback");
  const text = document.getElementById("feedbackText");
  if (!box || !text) return;

  text.textContent = message || "Something went wrong.";
  box.classList.remove("hidden");
}

// hideFeedback
/**
 * Hides the global feedback area if it is visible.
 * @returns {void}
 */
export function hideFeedback() {
  const box = document.getElementById("feedback");
  if (!box) return;
  box.classList.add("hidden");
}

// setHomeViewState
/**
 * Toggles loading, results, and empty-state elements on the home view.
 * @param {{ loading?: boolean, hasResults?: boolean, showEmpty?: boolean }} state - Home view state flags.
 * @returns {void}
 */
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

// isEnded
/**
 * Determines whether a given ISO date has already passed.
 * @param {string} isoString - ISO 8601 datetime string.
 * @returns {boolean} True if the date is in the past or invalid.
 */
export function isEnded(isoString) {
  const d = new Date(isoString);
  return Number.isFinite(d.getTime()) ? d.getTime() <= Date.now() : false;
}

// highestBidAmount
/**
 * Returns the highest bid amount from a listing-like object.
 * @param {{ bids?: Array<{ amount: number }>, _bids?: Array<{ amount: number }> }} listing - Listing with bids.
 * @returns {number} Highest bid amount, or 0 if there are no bids.
 */
export function highestBidAmount(listing) {
  const bids = listing?.bids || listing?._bids || [];
  if (!Array.isArray(bids) || bids.length === 0) return 0;
  return Math.max(...bids.map((b) => Number(b.amount || 0)));
}

// --- Toast helpers ---

let toastIdCounter = 0;
let activeToasts = [];

// showToast
/**
 * Shows a transient toast notification.
 * @param {string} [message="Success!"] - Toast message text.
 * @param {"success" | "error"} [type="success"] - Toast type for styling.
 * @param {number} [timeout=3000] - Auto-dismiss timeout in milliseconds.
 * @returns {void}
 */
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

// escapeHtml
/**
 * Escapes a string for safe insertion into HTML content.
 * @param {string} str - Raw string value.
 * @returns {string} Escaped HTML-safe string.
 */
export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// timeAgo
/**
 * Formats an ISO datetime as a human-readable "time ago" string.
 * @param {string} isoString - ISO 8601 datetime string.
 * @returns {string} Human-friendly relative time label.
 */
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

// formatTimeLeft
/**
 * Formats the remaining time until an end date as a short label.
 * @param {string} endsAt - ISO 8601 end datetime string.
 * @returns {string} Remaining time label, or "Ended" if already passed.
 */
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

// escapeAttr
/**
 * Escapes a string for safe use inside HTML attributes.
 * @param {string} str - Raw attribute value.
 * @returns {string} Escaped attribute-safe value.
 */
export function escapeAttr(str) {
  return escapeHtml(str).replaceAll("\n", "");
}

// setPageTitle
/**
 * Sets the document title with the Noroff TradeHub prefix.
 * @param {string} [text="Home"] - Page-specific title segment.
 * @returns {void}
 */
export function setPageTitle(text = "Home") {
  document.title = `Noroff TradeHub | ${text}`;
}

// Reusable modal helper: backdrop click + Esc + open/close buttons
// setupModal
/**
 * Wires up a modal element with open/close behavior and returns a small API.
 * @param {{ modal?: HTMLElement | null, openButton?: HTMLElement | null, closeButtons?: HTMLElement[], onOpen?: Function, onClose?: Function }} [options={}] - Modal configuration.
 * @returns {{ open: Function, close: Function, destroy: Function }} Modal control API.
 */
export function setupModal({
  modal,
  openButton,
  closeButtons = [],
  onOpen,
  onClose,
} = {}) {
  if (!modal) {
    // Fail-safe: return no-op API if modal element is missing
    const noop = () => {};
    return { open: noop, close: noop, destroy: noop };
  }

  let isOpen = false;

  const open = () => {
    if (isOpen) return;
    isOpen = true;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    if (typeof onOpen === "function") onOpen();
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    if (typeof onClose === "function") onClose();
  };

  const handleBackdropClick = (event) => {
    if (event.target === modal) {
      close();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      close();
    }
  };

  modal.addEventListener("click", handleBackdropClick);
  document.addEventListener("keydown", handleKeyDown);

  if (openButton) {
    openButton.addEventListener("click", open);
  }

  closeButtons.forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", close);
  });

  const destroy = () => {
    modal.removeEventListener("click", handleBackdropClick);
    document.removeEventListener("keydown", handleKeyDown);
    if (openButton) {
      openButton.removeEventListener("click", open);
    }
    closeButtons.forEach((btn) => {
      if (!btn) return;
      btn.removeEventListener("click", close);
    });
  };

  return { open, close, destroy };
}

// Reusable media list helper: add/remove URLs + render
// setupMediaList
/**
 * Manages a dynamic list of media URLs and keeps the DOM in sync.
 * @param {{ listElement?: HTMLElement | null, inputElement?: HTMLInputElement | null, addButtonElement?: HTMLElement | null, initialItems?: string[], onChange?: Function }} options - Media list configuration.
 * @returns {{ getItems: () => string[], setItems: (items: string[]) => void, clear: () => void, add: (url: string) => void, render: () => void }} Media list API.
 */
export function setupMediaList({
  listElement,
  inputElement,
  addButtonElement,
  initialItems = [],
  onChange,
} = {}) {
  if (!listElement) {
    // No DOM node? Return a safe stub so code doesn't crash.
    return {
      getItems: () => [...initialItems],
      setItems: () => {},
      clear: () => {},
      add: () => {},
      render: () => {},
    };
  }

  let items = Array.isArray(initialItems) ? [...initialItems] : [];

  const notifyChange = () => {
    if (typeof onChange === "function") {
      onChange([...items]);
    }
  };

  const render = () => {
    if (!items.length) {
      listElement.innerHTML =
        '<p class="text-sm text-brand-muted">No media added.</p>';
      return;
    }

    listElement.innerHTML = items
      .map(
        (url, index) => `
          <div class="flex items-center justify-between gap-2 border border-brand-border rounded-md p-2 bg-white">
            <span class="text-sm break-all">${escapeHtml(url)}</span>
            <button
              type="button"
              class="btn-secondary hover:no-underline hover:font-semibold"
              data-remove="${index}"
            >
              Remove
            </button>
          </div>
        `,
      )
      .join("");

    listElement.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.getAttribute("data-remove"));
        if (Number.isNaN(index)) return;
        items.splice(index, 1);
        render();
        notifyChange();
      });
    });
  };

  const addItem = (value) => {
    const url = String(value || "").trim();
    if (!url) return;
    items.push(url);
    render();
    notifyChange();
  };

  if (addButtonElement && inputElement) {
    addButtonElement.addEventListener("click", () => {
      addItem(inputElement.value);
      inputElement.value = "";
    });
  }

  // Initial render
  render();

  return {
    getItems: () => [...items],
    setItems(nextItems) {
      items = Array.isArray(nextItems) ? [...nextItems] : [];
      render();
      notifyChange();
    },
    clear() {
      items = [];
      render();
      notifyChange();
    },
    add: addItem,
    render,
  };
}
