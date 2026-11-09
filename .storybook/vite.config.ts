import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Storybook's own Vite config: the site's vite.config.ts carries prerendering and SEO plugins it must not load.
export default defineConfig({
  plugins: [react()],
  // Storybook serves only what main.ts lists in staticDirs, never the site's whole public folder.
  publicDir: false,
  resolve: { alias: { "@": path.resolve(__dirname, "../src") } },
});
