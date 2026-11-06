import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Storybook's own Vite config: the site's vite.config.ts carries prerendering and SEO plugins it must not load.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "../src") } },
});
