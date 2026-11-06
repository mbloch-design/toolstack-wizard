import { fireEvent, render, screen } from "@testing-library/react";
import { Profiler, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import toolsIndex from "@/data/tools_index.json";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import type { CatalogTool } from "@/lib/backofficeCatalog";
import { catalogCapabilities } from "@/lib/catalogPolicy";
import { mapToolFromJson } from "@/lib/toolFromJson";
import { ToolDetailPresentation } from "@/pages/ToolDetailPage";
import { CatalogEditorPresentation } from "./CatalogEditingContext";

it("defers advanced controls with the full catalogue and preserves mounted controls on edits", () => {
  const tools = toolsIndex as unknown as ToolSummary[];
  const base: CatalogTool = {
    id: "sample", slug: "sample", name: "Sample", category: "productivity",
    shortDescription: "Before", covers: ["task-management"],
    functional_needs: ["knowledge-management"], personas: ["freelance"],
    host_app: "notion", bundle_parent: "figma", integrates_with: ["notion", "figma"],
    complements: ["slack"], freeAlternative: "notion",
  };
  const durations: number[] = [];
  const changed = vi.fn();
  function Harness() {
    const [value, setValue] = useState(base);
    return <CatalogEditorPresentation context={{
      lang: "fr", value, base, published: base,
      capabilities: catalogCapabilities({ isAdmin: true }), issues: [], tools, categories: [],
      onChange: (path, next) => { changed(path, next); setValue(old => ({ ...old, [path[0]]: next })); },
      onRemove: () => undefined,
    }}>{editing => <ToolDetailPresentation tool={mapToolFromJson(value)} tools={tools}
      categories={[]} lang="fr" currency="EUR" privateMode editing={editing} />}</CatalogEditorPresentation>;
  }
  const { container } = render(<MemoryRouter><Profiler id="full-catalogue"
    onRender={(_, __, duration) => durations.push(duration)}><Harness /></Profiler></MemoryRouter>);
  const initialOptions = container.querySelectorAll("option").length;
  const mountMs = durations.reduce((sum, value) => sum + value, 0);
  durations.length = 0;
  const editStart = performance.now();
  fireEvent.change(screen.getByLabelText("Description courte · français"), { target: { value: "Edited" } });
  const editWallMs = performance.now() - editStart;
  console.info(JSON.stringify({ tools: tools.length, initialOptions, mountMs,
    editRenderMs: durations.reduce((sum, value) => sum + value, 0), editWallMs }));
  expect(container.querySelector('[data-catalog-path="host_app"]')).toBeNull();
  expect(initialOptions).toBeLessThan(tools.length * 2);
  const advanced = screen.getByText("Écosystème et contenus associés").closest("details")!;
  advanced.open = true;
  fireEvent(advanced, new Event("toggle"));
  const field = screen.getByLabelText("Application hôte");
  expect(field).toHaveValue("notion");
  expect(changed).toHaveBeenCalledTimes(1);
  advanced.open = false;
  fireEvent(advanced, new Event("toggle"));
  fireEvent.change(screen.getByLabelText("Description courte · français"), { target: { value: "Still edited" } });
  expect(screen.getByLabelText("Application hôte")).toBe(field);
}, 30000);
