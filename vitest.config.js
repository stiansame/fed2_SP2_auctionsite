import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    exclude: [
      "**/node_modules/**",
      "**test/playwright/**",
      "./js/test/playwright",
    ],
  },
});
