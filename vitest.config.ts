import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Design system tests need a real browser: vitest.ds.config.ts.
    exclude: ["src/ds/**/*.browser.test.ts", "node_modules/**"],
  },
  resolve: {
    alias: { "@/routes/detailPages": path.resolve(__dirname, "./src/routes/detailPages.client.ts"), "@": path.resolve(__dirname, "./src") },
  },
});
