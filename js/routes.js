// /js/routes.js
import { homePage } from "./pages/home.js";
import { listingPage } from "./pages/listing.js";
import { loginPage } from "./pages/login.js";
import { registerPage } from "./pages/register.js";
import { profilePage } from "./pages/profile.js";
import { createListingPage } from "./pages/create.js";

export const routes = [
  { path: "/", view: homePage, protected: false },
  { path: "/listing/:id", view: listingPage, protected: false },
  { path: "/login", view: loginPage, protected: false },
  { path: "/register", view: registerPage, protected: false },

  // Your own profile (must be logged in)
  { path: "/profile", view: profilePage, protected: true },

  // Public profile by name (for seller/bidder links)
  { path: "/profile/:name", view: profilePage, protected: false },

  { path: "/create", view: createListingPage, protected: true },
];
