import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  act,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { INITIAL_ACCOUNT_SNAPSHOT } from "@/lib/stackAccountCoordinator";
import AccountSettingsPage from "./AccountSettingsPage";
const mocks = vi.hoisted(() => ({
  account: {} as Record<string, unknown>,
  experience: {} as Record<string, unknown>,
}));
vi.mock("@/hooks/useStackAccount", () => ({
  useStackAccount: () => mocks.account,
}));
vi.mock("@/components/account/AccountExperienceProvider", () => ({
  useAccountExperience: () => mocks.experience,
}));
const user = {
  id: "A",
  email: "a@example.test",
  identities: [{ id: "email", provider: "email" }],
  created_at: "2026-10-20T12:00:00Z",
};
beforeEach(() => {
  mocks.account = {
    ...INITIAL_ACCOUNT_SNAPSHOT,
    enabled: true,
    authInitialized: true,
    user,
    syncStatus: "synced",
    requestPasswordReset: vi.fn(),
  };
  mocks.experience = {
    profile: {
      userId: "A",
      displayName: "Alex",
      email: user.email,
      emailConfirmed: true,
      createdAt: user.created_at,
      canAccessBackoffice: false,
    },
    status: "ready",
    error: null,
    saveDisplayName: vi.fn().mockResolvedValue(true),
    retry: vi.fn(),
    openAuth: vi.fn(),
    requestSignOut: vi.fn(),
    requestDeleteAccount: vi.fn(),
  };
});
afterEach(cleanup);
const selectSection = (name: string) => fireEvent.click(within(screen.getByRole("navigation", { name: "Rubriques des paramètres" })).getByRole("link", { name }));
const view = () =>
  render(
    <MemoryRouter initialEntries={["/fr/compte/parametres"]}>
      <Routes><Route path="/fr/compte/parametres" element={<AccountSettingsPage />} /><Route path="/fr" element={<h1>Accueil public</h1>} /></Routes>
    </MemoryRouter>,
  );
it("shows four settings sections with real identities and device-only preferences", () => {
  view();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { name: "Profil" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Connexion et sécurité" })).not.toBeInTheDocument();
  selectSection("Connexion et sécurité");
  expect(
    screen.getByRole("heading", { name: "Connexion et sécurité" }),
  ).toBeVisible();
  selectSection("Préférences");
  expect(
    screen.getByRole("heading", { name: "Préférences d’affichage" }),
  ).toBeVisible();
  expect(screen.getByText("Ces choix sont enregistrés sur cet appareil.")).toBeVisible();
  selectSection("Stack et données");
  expect(
    screen.getByRole("heading", { name: "Stack et données" }),
  ).toBeVisible();
  selectSection("Connexion et sécurité");
  expect(screen.getByText("E-mail")).toBeVisible();
  expect(screen.queryByText("Google")).not.toBeInTheDocument();
  expect(screen.queryByRole("main")).not.toBeInTheDocument();
});
it("saves an optional display name with confirmation only after success", async () => {
  view();
  fireEvent.change(screen.getByLabelText("Nom d’affichage (facultatif)"), {
    target: { value: "Alex Studio" },
  });
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer le nom" })),
  );
  expect(mocks.experience.saveDisplayName).toHaveBeenCalledWith("Alex Studio");
  expect(screen.getByRole("status", { name: "Profil" })).toHaveTextContent(
    "Nom enregistré",
  );
});
it("redirects an expired session without exposing the profile", () => {
  mocks.account = { ...mocks.account, syncStatus: "session-expired" };
  view();
  expect(screen.getByRole("heading", {name:"Accueil public"})).toBeVisible();
  expect(screen.queryByDisplayValue("Alex")).not.toBeInTheDocument();
});
it("shows profile failure and a retry without inventing a saved name", () => {
  mocks.experience = { ...mocks.experience, profile: null, status: "error" };
  view();
  expect(
    screen.getByRole("button", { name: "Réessayer le profil" }),
  ).toBeVisible();
  expect(screen.queryByDisplayValue("Alex")).not.toBeInTheDocument();
});

import {
  setPersonalStackScope,
  replacePersonalStack,
} from "@/lib/personalStackStore";
import { normalizePersonalStack } from "@/lib/personalStack";
import { pinToolInState } from "@/lib/stackState";
it("exports the active owner version as JSON and warns when it is unsynchronized", async () => {
  vi.stubGlobal("localStorage", window.sessionStorage);
  setPersonalStackScope("A");
  const state = normalizePersonalStack(null);
  state.selection = pinToolInState(state.selection, "notion");
  replacePersonalStack(state);
  mocks.account = { ...mocks.account, syncStatus: "unsaved" };
  let exported: Blob | undefined;
  Object.defineProperty(URL, "createObjectURL", {
    value: vi.fn((blob: Blob) => {
      exported = blob;
      return "blob:test";
    }),
    configurable: true,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    value: vi.fn(),
    configurable: true,
  });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);
  view();
  selectSection("Stack et données");
  expect(screen.getByText(/L’export peut différer/)).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Exporter ma stack en JSON" }),
  );
  expect(click).toHaveBeenCalledOnce();
  const contents = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(exported!);
  });
  expect(JSON.parse(contents)).toEqual(state);
  click.mockRestore();
  setPersonalStackScope("anonymous");
  vi.unstubAllGlobals();
});
it("refuses to export a previous owner scope during an identity transition", () => {
  vi.stubGlobal("localStorage", window.sessionStorage);
  setPersonalStackScope("B");
  view();
  selectSection("Stack et données");
  fireEvent.click(
    screen.getByRole("button", { name: "Exporter ma stack en JSON" }),
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "L’export est indisponible",
  );
  setPersonalStackScope("anonymous");
  vi.unstubAllGlobals();
});
it("redirects an anonymous visitor instead of exposing settings or export", () => {
  mocks.account = { ...mocks.account, user: null, syncStatus: "local" };
  view();
  expect(
    screen.queryByRole("button", { name: "Exporter ma stack en JSON" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText("Nom d’affichage (facultatif)"),
  ).not.toBeInTheDocument();
});
it("identifies unconfirmed email explicitly without claiming a password exists", () => {
  mocks.experience = {
    ...mocks.experience,
    profile: {
      ...(mocks.experience.profile as Record<string, unknown>),
      emailConfirmed: false,
    },
  };
  view();
  expect(screen.getByText("E-mail non confirmé")).toBeVisible();
  selectSection("Connexion et sécurité");
  expect(screen.getByText("E-mail")).toBeVisible();
  expect(screen.queryByText("E-mail et mot de passe")).not.toBeInTheDocument();
});
it('shows the cosmetic photo and informational provider locale without changing UI language',()=>{
 mocks.experience.profile={...(mocks.experience.profile as object),avatarUrl:'https://avatars.githubusercontent.com/u/1',providerLocale:'en-US',oauthProfileSource:'github'};
 const v=view();expect(v.container.querySelector('.ac-profile-summary img')).toHaveAttribute('referrerpolicy','no-referrer');fireEvent.click(screen.getByText('Informations du compte'));expect(screen.getByText('en-US')).toBeVisible();expect(screen.getByRole('heading',{name:'Paramètres du compte'})).toBeVisible();
});
it('never renders a late profile A after the active owner changed to B',()=>{
 mocks.account={...mocks.account,user:{...user,id:'B',email:'b@example.test'}};
 mocks.experience.profile={...(mocks.experience.profile as object),avatarUrl:'https://avatars.githubusercontent.com/u/1',providerLocale:'en-US'};
 const v=view();expect(v.container.querySelector('.ac-profile-summary')).toBeNull();expect(screen.queryByDisplayValue('Alex')).not.toBeInTheDocument();
});
it("provides section navigation without losing an unsaved profile edit", () => {
  view();
  const input = screen.getByLabelText("Nom d’affichage (facultatif)");
  fireEvent.change(input, { target: { value: "Unsaved studio" } });
  const navigation = screen.getByRole("navigation", { name: "Rubriques des paramètres" });
  const security = within(navigation).getByRole("link", { name: "Connexion et sécurité" });
  expect(document.getElementById("ac-security-section")).toHaveAttribute("aria-labelledby", "ac-security");
  fireEvent.click(security);
  expect(input).not.toBeVisible();
  selectSection("Profil");
  expect(input).toBeVisible();
  expect(input).toHaveValue("Unsaved studio");
  expect(mocks.experience.saveDisplayName).not.toHaveBeenCalled();
  expect(screen.queryByRole("navigation", { name: "Fil d’Ariane" })).not.toBeInTheDocument();
});
it("exposes immediate theme and currency choices with an explicit selected state", () => {
  view();
  selectSection("Préférences");
  const dark = screen.getByRole("radio", { name: "Sombre" });
  fireEvent.click(dark);
  expect(dark).toBeChecked();
  expect(screen.getByRole("radio", { name: "Clair" })).not.toBeChecked();
  const euro = screen.getByRole("radio", { name: "EUR" });
  fireEvent.click(euro);
  expect(euro).toBeChecked();
});

it("leaves settings for home when the authenticated user signs out", () => {
  const content = () => <MemoryRouter initialEntries={["/fr/compte/parametres"]}><Routes><Route path="/fr/compte/parametres" element={<AccountSettingsPage />} /><Route path="/fr" element={<h1>Accueil public</h1>} /></Routes></MemoryRouter>;
  const mounted = render(content());
  expect(screen.getByRole("heading", {name:"Profil"})).toBeVisible();
  mocks.account = {...mocks.account, user:null, syncStatus:"local"};
  mounted.rerender(content());
  expect(screen.getByRole("heading", {name:"Accueil public"})).toBeVisible();
  expect(screen.queryByText("Votre espace ToolTrim")).not.toBeInTheDocument();
});
