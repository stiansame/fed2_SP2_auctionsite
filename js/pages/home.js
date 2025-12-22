// ./js/pages/home.js
import { apiGet } from "../api.js";
import { hideFeedback, showFeedback, setHomeViewState } from "../ui.js";
import { listingCardHTML } from "../components/listingCard.js";

export async function homePage() {
  hideFeedback();

  // Home page lives in index.html (homeView). This file wires up events + loads listings.
  const grid = document.getElementById("listingsGrid");
  const form = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const statusSelect = document.getElementById("statusSelect");
  const clearBtn = document.getElementById("clearSearchBtn");

  if (!grid || !form) return;

  // Ensure defaults align with API-driven behavior:
  // status dropdown should ideally default to "all" if you want "all listings"
  // (your HTML currently defaults to "active"; we handle both safely)
  form.onsubmit = async (e) => {
    e.preventDefault();
    await loadListings({
      q: searchInput?.value || "",
      sort: sortSelect?.value || "created_desc",
      status: statusSelect?.value || "all",
    });
  };

  if (clearBtn) {
    clearBtn.onclick = async () => {
      if (searchInput) searchInput.value = "";
      if (sortSelect) sortSelect.value = "created_desc";
      if (statusSelect) statusSelect.value = "all"; // clear should show ALL
      await loadListings({ q: "", sort: "created_desc", status: "all" });
    };
  }

  // Initial load
  await loadListings({
    q: searchInput?.value || "",
    sort: sortSelect?.value || "created_desc",
    status: statusSelect?.value || "all",
  });

  async function loadListings({
    q = "",
    sort = "created_desc",
    status = "all",
  } = {}) {
    hideFeedback();
    setHomeViewState({ loading: true });

    try {
      const { sortKey, sortOrder } = mapSort(sort);

      // Swagger-supported query params for GET /auction/listings:
      // sort, sortOrder, limit, page, _seller, _bids, _tag, _active
      const query = {
        sort: sortKey,
        sortOrder,
        _seller: true,
        _bids: true,
      };

      // Status is API-driven via _active:
      // active => _active=true
      // ended  => _active=false
      // all    => omit _active entirely
      if (status === "active") query._active = true;
      if (status === "ended") query._active = false;

      let res;

      if (q && q.trim().length > 0) {
        // Search endpoint: keep it API-driven as far as the endpoint allows.
        // Note: If /listings/search does NOT support _active, it will be ignored or error.
        // If you see errors, remove _active from search requests only.
        res = await apiGet("/listings/search", {
          query: {
            q: q.trim(),
            sort: sortKey,
            sortOrder,
            _seller: true,
            _bids: true,
            ...(status === "active" ? { _active: true } : {}),
            ...(status === "ended" ? { _active: false } : {}),
          },
        });
      } else {
        // Load ALL listings (no limit)
        res = await apiGet("/listings", { query });
      }

      const list = Array.isArray(res) ? res : (res?.data ?? []);

      if (!list.length) {
        grid.innerHTML = "";
        setHomeViewState({
          loading: false,
          hasResults: false,
          showEmpty: true,
        });
        return;
      }

      grid.innerHTML = list.map(listingCardHTML).join("");
      setHomeViewState({ loading: false, hasResults: true, showEmpty: false });
    } catch (err) {
      console.error(err);
      setHomeViewState({ loading: false, hasResults: false, showEmpty: true });
      showFeedback(err?.message || "Failed to load listings.");
    }
  }
}

function mapSort(value) {
  switch (value) {
    case "ends_asc":
      return { sortKey: "endsAt", sortOrder: "asc" };
    case "bids_desc":
      return { sortKey: "bids", sortOrder: "desc" };
    case "created_desc":
    default:
      return { sortKey: "created", sortOrder: "desc" };
  }
}
