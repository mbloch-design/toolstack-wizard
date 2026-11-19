import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import PublisherPage from "./PublisherPage";

const mocks = vi.hoisted(() => ({ dashboard: vi.fn(), tool: vi.fn() }));
vi.mock("@/hooks/useStackAccount", () => ({
  useStackAccount: () => ({
    enabled: true, authInitialized: true,
    user: { id: "publisher", email_confirmed_at: "2026-11-18T08:00:00Z" },
    getAccessToken: async () => "session-token",
  }),
}));
vi.mock("@/components/publisher/PublisherDashboard", () => ({
  default: () => { mocks.dashboard(); return <p>Workspace</p>; },
}));
vi.mock("./PublisherToolPage", () => ({
  default: () => { mocks.tool(); return <p>Tool editor</p>; },
}));

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.clearAllMocks(); sessionStorage.clear(); });

function view(path: string) {
  render(<MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/fr/publisher" element={<PublisherPage />} />
      <Route path="/fr/publisher/tools/:slug" element={<PublisherPage />} />
      <Route path="/fr/publisher/invitations/:invitationToken" element={<PublisherPage />} />
    </Routes>
  </MemoryRouter>);
}

it("keeps direct workspace and tool routes closed until the frontend CMS is enabled", () => {
  vi.stubEnv("VITE_PUBLISHER_CMS_ENABLED", "false");
  for (const path of ["/fr/publisher", "/fr/publisher/tools/atelier"]) {
    view(path);
    expect(screen.getByText("L’espace éditeur est indisponible pour le moment.")).toBeVisible();
    expect(mocks.dashboard).not.toHaveBeenCalled();
    expect(mocks.tool).not.toHaveBeenCalled();
    cleanup();
  }
});

it("does not consume an invitation through a disabled workspace", () => {
  vi.stubEnv("VITE_PUBLISHER_CMS_ENABLED", "false");
  view("/fr/publisher/invitations/" + "5".repeat(43));
  expect(screen.getByText("L’espace éditeur est indisponible pour le moment.")).toBeVisible();
  expect(sessionStorage.getItem("tooltrim:publisher-invitation")).toBeNull();
});

it("opens a confirmed account's workspace when enabled", () => {
  vi.stubEnv("VITE_PUBLISHER_CMS_ENABLED", "true");
  view("/fr/publisher");
  expect(screen.getByText("Workspace")).toBeVisible();
});
