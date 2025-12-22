import { getAuth } from "./state.js";
import { navigate } from "./router.js";

function onBidAttempt(listingId) {
  const { isLoggedIn } = getAuth();
  if (!isLoggedIn) {
    navigate(`/login?returnTo=${encodeURIComponent(`/listing/${listingId}`)}`);
    return;
  }
  // else show bid form / submit bid
}
