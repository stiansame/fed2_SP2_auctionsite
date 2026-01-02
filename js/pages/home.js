import { apiGet } from "../api.js";
import {
  hideFeedback,
  showFeedback,
  setHomeViewState,
  isEnded,
  setPageTitle,
} from "../ui.js";
import { listingCardHTML } from "../components/listingCard.js";

const PAGE_SIZE = 9;
let scrollHandlerAttached = false;

// homePage
/**
 * Initializes the home page: search, filters, pagination, and listing grid.
 * @async
 * @returns {Promise<void>}
 */
export async function homePage() {
  hideFeedback();

  setPageTitle("Home & Listings");

  const grid = document.getElementById("listingsGrid");
  const form = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const statusSelect = document.getElementById("statusSelect");
  const clearBtn = document.getElementById("clearSearchBtn");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const backToTopBtn = document.getElementById("backToTopBtn");

  if (!grid || !form) return;

  let page = 1;
  let hasMore = false;

  // --- Back to top wiring ---
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    if (!scrollHandlerAttached) {
      window.addEventListener("scroll", () => {
        const showAt = 400;
        if (window.scrollY > showAt) {
          backToTopBtn.classList.remove("hidden");
        } else {
          backToTopBtn.classList.add("hidden");
        }
      });
      scrollHandlerAttached = true;
    }

    backToTopBtn.classList.add("hidden");
  }

  // --- Form submit (search button / Enter) ---
  form.onsubmit = async (e) => {
    e.preventDefault();
    page = 1;
    await loadListings({ reset: true });
  };

  // --- Clear search button (below empty state) ---
  if (clearBtn) {
    clearBtn.onclick = async () => {
      if (searchInput) searchInput.value = "";
      if (sortSelect) sortSelect.value = "created_desc";
      if (statusSelect) statusSelect.value = "active"; // default: Active only
      page = 1;
      await loadListings({ reset: true });
    };
  }

  // --- Auto reload when status changes ---
  if (statusSelect) {
    statusSelect.addEventListener("change", async () => {
      page = 1;
      await loadListings({ reset: true });
    });
  }

  // --- Auto reload when sort changes ---
  if (sortSelect) {
    sortSelect.addEventListener("change", async () => {
      page = 1;
      await loadListings({ reset: true });
    });
  }

  // --- Auto reload when search is cleared (backspace or built-in X) ---
  if (searchInput) {
    let lastValue = (searchInput.value || "").trim();

    const maybeReloadOnClear = async () => {
      const currentValue = (searchInput.value || "").trim();

      // Only trigger when going from non-empty -> empty
      if (lastValue && !currentValue) {
        page = 1;
        await loadListings({ reset: true });
      }

      lastValue = currentValue;
    };

    // Fires on typing / deleting
    searchInput.addEventListener("input", maybeReloadOnClear);
    // Fires on "X" clear for type="search"
    searchInput.addEventListener("search", maybeReloadOnClear);
  }

  // --- Load more button ---
  if (loadMoreBtn) {
    loadMoreBtn.onclick = async () => {
      if (!hasMore) return;
      page += 1;
      await loadListings({ reset: false });
    };
  }

  // Initial load
  await loadListings({ reset: true });

  // loadListings
  /**
   * Loads listings from the API and updates the grid and controls.
   * @async
   * @param {{ reset?: boolean }} [options={}] - Whether to reset the grid before loading.
   * @returns {Promise<void>}
   */
  async function loadListings({ reset = false } = {}) {
    hideFeedback();

    const q = (searchInput?.value || "").trim();
    const sort = sortSelect?.value || "created_desc";
    const status = statusSelect?.value || "active";

    if (reset) {
      grid.innerHTML = "";
      setHomeViewState({ loading: true, hasResults: true, showEmpty: false });
    } else if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = "Loading…";
    }

    try {
      const { sortKey, sortOrder } = mapSort(sort);

      // Base query for /listings
      const baseQuery = {
        sort: sortKey,
        sortOrder,
        _seller: true,
        _bids: true,
        limit: PAGE_SIZE,
        page,
      };

      // Hint the API with _active; we still filter client-side too
      if (status === "active") baseQuery._active = true;
      if (status === "ended") baseQuery._active = false;

      let res;
      let listRaw;

      if (q && status !== "ended") {
        // For All / Active + search → use search endpoint
        const searchQuery = {
          q,
          sort: sortKey,
          sortOrder,
          limit: PAGE_SIZE,
          page,
          _seller: true,
          _bids: true,
        };

        if (status === "active") searchQuery._active = true;

        res = await apiGet("/listings/search", { query: searchQuery });
        listRaw = Array.isArray(res) ? res : (res?.data ?? []);
      } else {
        // For Ended (with or without search), and non-search requests
        res = await apiGet("/listings", { query: baseQuery });
        listRaw = Array.isArray(res) ? res : (res?.data ?? []);
      }

      // --- Client-side status filtering ---
      let list = listRaw.filter((item) => matchesStatus(item, status));

      // Optional text filter for Ended + search
      if (status === "ended" && q) {
        const qLower = q.toLowerCase();
        list = list.filter((item) => {
          const title = (item?.title || "").toLowerCase();
          const desc = (item?.description || "").toLowerCase();
          return title.includes(qLower) || desc.includes(qLower);
        });
      }

      // --- Client-side sort to enforce the 3 modes ---
      list = sortListings(list, sort);

      if (reset && (!list || list.length === 0)) {
        grid.innerHTML = "";
        hasMore = false;
        if (loadMoreBtn) {
          loadMoreBtn.classList.add("hidden");
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = "Load more";
        }
        setHomeViewState({
          loading: false,
          hasResults: false,
          showEmpty: true,
        });
        return;
      }

      const cardsHtml = list.map(listingCardHTML).join("");
      grid.innerHTML = reset ? cardsHtml : grid.innerHTML + cardsHtml;

      // "Has more" still based on raw server page size
      hasMore = listRaw.length === PAGE_SIZE;

      if (loadMoreBtn) {
        if (hasMore) {
          loadMoreBtn.classList.remove("hidden");
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = "Load more";
        } else {
          loadMoreBtn.classList.add("hidden");
          loadMoreBtn.disabled = false;
          loadMoreBtn.textContent = "Load more";
        }
      }

      setHomeViewState({
        loading: false,
        hasResults: true,
        showEmpty: false,
      });
    } catch (err) {
      console.error(err);
      hasMore = false;

      if (loadMoreBtn) {
        loadMoreBtn.classList.add("hidden");
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = "Load more";
      }

      setHomeViewState({ loading: false, hasResults: false, showEmpty: true });
      showFeedback(err?.message || "Something went wrong.");
    }
  }
}

// --- Status filter helper ---
// matchesStatus
/**
 * Checks if a listing matches the selected status filter.
 * @param {Object} listing - Listing item from the API.
 * @param {"all" | "active" | "ended"} status - Desired status filter.
 * @returns {boolean} True if the listing matches the status.
 */
function matchesStatus(listing, status) {
  if (status === "all") return true;

  const endsAt = listing?.endsAt || listing?.ends_at || listing?.deadline;
  const hasFlag = typeof listing?._active === "boolean";

  // Trust Noroff's _active if present; otherwise derive from date
  const isActive = hasFlag ? listing._active : !isEnded(endsAt);

  if (status === "active") return isActive;
  if (status === "ended") return !isActive;

  return true;
}

// --- Sort helpers ---
// sortListings
/**
 * Sorts a list of listings according to the selected sort mode.
 * @param {Array<Object>} list - Listings to sort.
 * @param {"created_desc" | "ends_asc" | "bids_desc"} sortValue - Sort mode identifier.
 * @returns {Array<Object>} New sorted array.
 */
function sortListings(list, sortValue) {
  if (!Array.isArray(list) || list.length === 0) return list.slice();

  const sorted = list.slice();

  switch (sortValue) {
    case "ends_asc":
      // Ending soon → least time left first
      sorted.sort((a, b) => {
        const aTime = getEndsTime(a);
        const bTime = getEndsTime(b);
        return aTime - bTime;
      });
      break;

    case "bids_desc":
      // Most bids → highest number of bids first
      sorted.sort((a, b) => {
        const aCount = getBidsCount(a);
        const bCount = getBidsCount(b);
        return bCount - aCount;
      });
      break;

    case "created_desc":
    default:
      // Newest → newest created first
      sorted.sort((a, b) => {
        const aTime = getCreatedTime(a);
        const bTime = getCreatedTime(b);
        return bTime - aTime;
      });
      break;
  }

  return sorted;
}

// getEndsTime
/**
 * Gets the end time of a listing as a comparable timestamp.
 * @param {Object} item - Listing item.
 * @returns {number} Milliseconds since epoch, or Infinity if missing.
 */
function getEndsTime(item) {
  const endsAt = item?.endsAt || item?.ends_at || item?.deadline;
  const d = endsAt ? new Date(endsAt) : null;
  const t = d && Number.isFinite(d.getTime()) ? d.getTime() : Infinity;
  return t;
}

// getCreatedTime
/**
 * Gets the creation time of a listing as a comparable timestamp.
 * @param {Object} item - Listing item.
 * @returns {number} Milliseconds since epoch, or 0 if missing.
 */
function getCreatedTime(item) {
  const created = item?.created || item?.createdAt;
  const d = created ? new Date(created) : null;
  const t = d && Number.isFinite(d.getTime()) ? d.getTime() : 0;
  return t;
}

// getBidsCount
/**
 * Returns the number of bids on a listing using count or bids array.
 * @param {Object} item - Listing item.
 * @returns {number} Number of bids.
 */
function getBidsCount(item) {
  const fromCount =
    item && item._count && typeof item._count.bids === "number"
      ? item._count.bids
      : 0;

  // Fallback to actual bids array length if present
  const fromArray = Array.isArray(item?.bids) ? item.bids.length : 0;

  return fromCount || fromArray;
}

// --- API sort hint (safe keys only) ---
// mapSort
/**
 * Maps a UI sort value to API sort key and order.
 * @param {"created_desc" | "ends_asc" | "bids_desc"} value - Selected sort value.
 * @returns {{ sortKey: string, sortOrder: "asc" | "desc" }} API sort hint.
 */
function mapSort(value) {
  switch (value) {
    case "ends_asc":
      return { sortKey: "endsAt", sortOrder: "asc" };

    case "bids_desc":
      return { sortKey: "created", sortOrder: "desc" };

    case "created_desc":
    default:
      return { sortKey: "created", sortOrder: "desc" };
  }
}
