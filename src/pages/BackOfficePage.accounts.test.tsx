import { MemoryRouter } from "react-router-dom";
import { act, fireEvent, render as rtlRender, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({legacy:vi.fn(),list:vi.fn(),detail:vi.fn(),getSession:vi.fn(),onAuthStateChange:vi.fn(),signInWithPassword:vi.fn(),signOut:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{auth:{getSession:mocks.getSession,onAuthStateChange:mocks.onAuthStateChange,signInWithPassword:mocks.signInWithPassword,signOut:mocks.signOut}}}));
vi.mock("@/lib/backofficeAccountsApi",()=>({loadAccountsDashboard:mocks.list,loadAccountDetail:mocks.detail}));
vi.mock("@/lib/backofficeApi",()=>({fetchBackofficeDashboard:mocks.legacy,fetchBackofficeSessionDetail:vi.fn(),updateBackofficeEmailJob:vi.fn(),updateBackofficeSessionAdmin:vi.fn()}));
import { StackAccountProvider } from "@/hooks/useStackAccount";
import type { ReactNode } from "react";
const render = (ui: ReactNode) => rtlRender(<MemoryRouter><StackAccountProvider enabled={false}>{ui}</StackAccountProvider></MemoryRouter>);
import BackOfficePage from "./BackOfficePage";
import { LangContext } from "@/hooks/useLang";
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks();vi.unstubAllGlobals();vi.restoreAllMocks();});
describe("back-office accounts entry",()=>{
 it("loads accounts by default and never fetches or polls diagnostic data before explicit selection",async()=>{
  vi.useFakeTimers();vi.stubGlobal("localStorage",window.sessionStorage);
  mocks.getSession.mockResolvedValue({data:{session:{access_token:"admin-session",user:{email:"admin@example.test"}}}});
  mocks.onAuthStateChange.mockReturnValue({data:{subscription:{unsubscribe:vi.fn()}}});
  mocks.list.mockResolvedValue({totals:{accounts:26,accountsWithStack:0,nonemptyStacks:0},topTools:[],accounts:[],page:1,pageSize:25,total:26,updatedAt:"2026-10-20T12:00:00Z"});
  mocks.legacy.mockResolvedValue({sessions:[],emailHealth:[],recentEmailJobs:[],recentRestitutions:[],meta:{days:30,limit:150,persona:null,fetchedAt:"2026-10-20T12:00:00Z"}});
  render(<BackOfficePage/>);await act(async()=>{});
  expect(screen.getByTestId("accounts-total")).toHaveTextContent("26");expect(mocks.legacy).not.toHaveBeenCalled();
  await act(async()=>{vi.advanceTimersByTime(31000);});expect(mocks.legacy).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Diagnostic historique"}));await act(async()=>{});expect(mocks.legacy).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button",{name:"Comptes et stacks"}));await act(async()=>{});await act(async()=>{vi.advanceTimersByTime(31000);});expect(mocks.legacy).toHaveBeenCalledTimes(1);
 });
});


describe("accessible administrator entry", () => {
 it.each(["fr", "en"] as const)("submits the labelled %s sign-in form through the existing password action", async lang => {
  vi.stubGlobal("localStorage", window.sessionStorage);
  mocks.getSession.mockResolvedValue({ data: { session: null } });
  mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  mocks.signInWithPassword.mockResolvedValue({ data: { session: { access_token: "new-admin-session", user: { email: "admin@example.test" } } }, error: null });
  mocks.list.mockResolvedValue({ totals: { accounts: 26, accountsWithStack: 0, nonemptyStacks: 0 }, topTools: [], accounts: [], page: 1, pageSize: 25, total: 26, updatedAt: "2026-10-20T12:00:00Z" });
  render(<LangContext.Provider value={{ lang, prefix: `/${lang}`, t: (fr, en) => lang === "en" ? en : fr }}><BackOfficePage /></LangContext.Provider>);
  await act(async () => {});
  const email = screen.getByLabelText(lang === "fr" ? "E-mail administrateur" : "Admin email");
  const password = screen.getByLabelText(lang === "fr" ? "Mot de passe" : "Password");
  expect(email).toHaveAttribute("autocomplete", "username");
  expect(password).toHaveAttribute("autocomplete", "current-password");
  fireEvent.change(email, { target: { value: "admin@example.test" } });
  fireEvent.change(password, { target: { value: "test-password" } });
  fireEvent.submit(screen.getByRole("form", { name: lang === "fr" ? "Connexion administrateur" : "Administrator sign-in" }));
  await act(async () => {});
  expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "admin@example.test", password: "test-password" });
  expect(screen.getByTestId("accounts-total")).toHaveTextContent("26");
  expect(mocks.legacy).not.toHaveBeenCalled();
 });
});

describe("feature-disabled administrator logout", () => {
 it.each([false, true])("keeps password admin logout usable; SDK failure=%s", async failed => {
  vi.stubGlobal("localStorage", window.sessionStorage);
  mocks.getSession.mockResolvedValue({data:{session:{access_token:"admin-session",user:{email:"admin@example.test"}}}});
  mocks.onAuthStateChange.mockReturnValue({data:{subscription:{unsubscribe:vi.fn()}}});
  mocks.list.mockResolvedValue({totals:{accounts:26,accountsWithStack:0,nonemptyStacks:0},topTools:[],accounts:[],page:1,pageSize:25,total:26,updatedAt:"2026-10-20T12:00:00Z"});
  mocks.signOut.mockResolvedValue({ error: failed ? new Error("SDK refused") : null });
  render(<BackOfficePage />); await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Fermer" })); await act(async () => {});
  if (failed) { expect(screen.getByTestId("accounts-total")).toHaveTextContent("26"); expect(screen.getByRole("alert")).toHaveTextContent("déconnexion a échoué"); }
  else expect(screen.getByRole("form", { name: "Connexion administrateur" })).toBeInTheDocument();
 });
});

it("reports blocked local cleanup after successful admin signout without claiming auth failed", async () => {
 vi.stubGlobal("localStorage", window.sessionStorage);
 mocks.getSession.mockResolvedValue({data:{session:{access_token:"admin-session",user:{email:"admin@example.test"}}}});
 mocks.onAuthStateChange.mockReturnValue({data:{subscription:{unsubscribe:vi.fn()}}});
 mocks.list.mockResolvedValue({totals:{accounts:26,accountsWithStack:0,nonemptyStacks:0},topTools:[],accounts:[],page:1,pageSize:25,total:26,updatedAt:"2026-10-20T12:00:00Z"});
 mocks.signOut.mockResolvedValue({ error: null });
 render(<BackOfficePage />); await act(async () => {});
 vi.stubGlobal("localStorage", { removeItem: () => { throw new Error("storage blocked"); } });
 fireEvent.click(screen.getByRole("button", { name: "Fermer" })); await act(async () => {});
 expect(screen.getByRole("form", { name: "Connexion administrateur" })).toBeInTheDocument();
 expect(screen.getByRole("alert")).toHaveTextContent("le navigateur a bloqué une partie du nettoyage");
 expect(screen.queryByText("La déconnexion a échoué. Réessayez.")).not.toBeInTheDocument();
});

it.each(["fr", "en"] as const)("keeps the %s administrator form disabled while pending and restores fields after an error", async lang => {
 vi.stubGlobal("localStorage", window.sessionStorage);
 mocks.getSession.mockResolvedValue({ data: { session: null } });
 mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
 let finish: (value: unknown) => void;
 mocks.signInWithPassword.mockReturnValue(new Promise(resolve => { finish = resolve; }));
 render(<LangContext.Provider value={{ lang, prefix: `/${lang}`, t: (fr, en) => lang === "en" ? en : fr }}><BackOfficePage /></LangContext.Provider>);
 await act(async () => {});
 const email = screen.getByLabelText(lang === "fr" ? "E-mail administrateur" : "Admin email");
 const password = screen.getByLabelText(lang === "fr" ? "Mot de passe" : "Password");
 expect(email).toHaveClass("ui-input"); expect(password).toHaveClass("ui-input");
 email.focus(); expect(email).toHaveFocus();
 fireEvent.change(email, { target: { value: "admin@example.test" } });
 fireEvent.change(password, { target: { value: "wrong-password" } });
 fireEvent.submit(screen.getByRole("form"));
 const submit = screen.getByRole("button", { name: lang === "fr" ? "Connexion…" : "Signing in…" });
 expect(submit).toHaveClass("ui-button"); expect(submit).toHaveAttribute("aria-busy", "true");
 expect(submit).toBeDisabled(); expect(email).toBeDisabled(); expect(password).toBeDisabled();
 await act(async () => { finish!({ data: { session: null }, error: new Error("Denied") }); });
 expect(email).toBeEnabled(); expect(password).toBeEnabled();
 const error = screen.getByRole("alert"); expect(error).toHaveTextContent("Denied");
 expect(email).toHaveAttribute("aria-describedby", error.id);
});

it.each(["fr", "en"] as const)("keeps %s historical diagnostics on shared controls and preserves period filtering", async lang => {
 vi.stubGlobal("localStorage", window.sessionStorage);
 mocks.getSession.mockResolvedValue({ data: { session: { access_token: "admin-session", user: { email: "admin@example.test" } } } });
 mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
 mocks.list.mockResolvedValue({ totals: { accounts: 0, accountsWithStack: 0, nonemptyStacks: 0 }, topTools: [], accounts: [], page: 1, pageSize: 25, total: 0, updatedAt: "2026-10-20T12:00:00Z" });
 mocks.legacy.mockResolvedValue({ sessions: [], emailHealth: [], recentEmailJobs: [], recentRestitutions: [], meta: { days: 30, limit: 150, persona: null, fetchedAt: "2026-10-20T12:00:00Z" } });
 render(<LangContext.Provider value={{ lang, prefix: `/${lang}`, t: (fr, en) => lang === "en" ? en : fr }}><BackOfficePage /></LangContext.Provider>);
 await act(async () => {});
 fireEvent.click(screen.getByRole("button", { name: lang === "fr" ? "Diagnostic historique" : "Historical diagnostic" }));
 await act(async () => {});
 const period = screen.getByRole("combobox", { name: lang === "fr" ? "Période" : "Period" });
 expect(period).toHaveClass("ui-select");
 expect(screen.getByRole("searchbox", { name: lang === "fr" ? "Chercher une session" : "Search sessions" })).toHaveClass("ui-input");
 fireEvent.change(period, { target: { value: "7" } });
 await act(async () => {});
 expect(mocks.legacy).toHaveBeenLastCalledWith("admin-session", { days: 7, limit: 150, persona: null });
 const quality = screen.getByRole("button", { name: lang === "fr" ? "Qualité" : "Quality" });
 expect(quality).toHaveClass("ui-button"); fireEvent.click(quality);
 expect(quality).toHaveAttribute("aria-pressed", "true");
});
