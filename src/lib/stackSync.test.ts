import { describe, expect, it } from "vitest";
import { createDefaultToolCartState, saveToolSelectionInState, createCustomNeedInState } from "@/lib/stackState";
import { mergeToolCartStates } from "@/lib/stackSync";

describe("mergeToolCartStates", () => {
  it("fusionne les outils locaux et distants sans doublon", () => {
    const remote = saveToolSelectionInState(createDefaultToolCartState(), "figma", ["design"], "stack");
    const local = saveToolSelectionInState(createDefaultToolCartState(), "notion", ["organisation"], "wishlist");
    const merged = mergeToolCartStates(local, remote);

    expect(merged.toolEntries.map((entry) => entry.toolSlug).sort()).toEqual(["figma", "notion"]);
    expect(merged.pinnedToolSlugs.sort()).toEqual(["figma", "notion"]);
  });

  it("conserve les collections personnalisées des deux appareils", () => {
    const remoteResult = createCustomNeedInState(createDefaultToolCartState(), "Clients");
    const localResult = createCustomNeedInState(createDefaultToolCartState(), "Création");
    const merged = mergeToolCartStates(localResult.state, remoteResult.state);

    expect(merged.needs.some((need) => need.labelFr === "Clients")).toBe(true);
    expect(merged.needs.some((need) => need.labelFr === "Création")).toBe(true);
  });
});
