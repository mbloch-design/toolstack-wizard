import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({legacy:vi.fn(),list:vi.fn(),detail:vi.fn(),getSession:vi.fn(),onAuthStateChange:vi.fn(),signInWithPassword:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{auth:{getSession:mocks.getSession,onAuthStateChange:mocks.onAuthStateChange,signInWithPassword:mocks.signInWithPassword,signOut:vi.fn()}}}));
vi.mock("@/lib/backofficeAccountsApi",()=>({loadAccountsDashboard:mocks.list,loadAccountDetail:mocks.detail}));
vi.mock("@/lib/backofficeApi",()=>({fetchBackofficeDashboard:mocks.legacy,fetchBackofficeSessionDetail:vi.fn(),updateBackofficeEmailJob:vi.fn(),updateBackofficeSessionAdmin:vi.fn()}));
import BackOfficePage from "./BackOfficePage";
import { LangContext } from "@/hooks/useLang";
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks();vi.unstubAllGlobals();});
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
