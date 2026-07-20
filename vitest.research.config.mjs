import { defineConfig } from "vitest/config";

// Config dédiée aux tests du collecteur RESEARCH_ONLY (scripts/), la config
// principale ne couvrant que src/**. Tests sur fixtures locales : aucun réseau,
// aucune DB, aucune écriture.
export default defineConfig({
  test: {
    include: ["scripts/**/*.test.mjs"],
    environment: "node",
  },
});
