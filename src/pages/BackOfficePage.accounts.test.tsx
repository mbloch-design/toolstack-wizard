import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({legacy:vi.fn(),list:vi.fn(),detail:vi.fn(),getSession:vi.fn(),onAuthStateChange:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{auth:{getSession:mocks.getSession,onAuthStateChange:mocks.onAuthStateChange,signOut:vi.fn()}}}));
vi.mock("@/lib/backofficeAccountsApi",()=>({loadAccountsDashboard:mocks.list,loadAccountDetail:mocks.detail}));
vi.mock("@/lib/backofficeApi",()=>({fetchBackofficeDashboard:mocks.legacy,fetchBackofficeSessionDetail:vi.fn(),updateBackofficeEmailJob:vi.fn(),updateBackofficeSessionAdmin:vi.fn()}));
import BackOfficePage from "./BackOfficePage";
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
