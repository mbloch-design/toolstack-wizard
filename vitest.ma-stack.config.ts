import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/lib/stackState.test.ts", "src/lib/stackAutoClassification.test.ts", "src/lib/toolExploration.test.ts", "src/test/ma-stack/**/*.{test,spec}.{ts,tsx}"],
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
  },
});
