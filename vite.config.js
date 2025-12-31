import { defineConfig } from "vite";

export default defineConfig({
  root: ".", // folder where index.html lives
  build: {
    outDir: "dist", // what Netlify expects
  },
});
