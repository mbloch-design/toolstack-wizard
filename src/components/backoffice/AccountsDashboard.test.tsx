import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizePersonalStack } from "@/lib/personalStack";
import { parseAccountDetail } from "@/lib/backofficeAccounts";
const mocks=vi.hoisted(()=>({list:vi.fn(),detail:vi.fn()}));
vi.mock("@/lib/backofficeAccountsApi",()=>({loadAccountsDashboard:mocks.list,loadAccountDetail:mocks.detail}));
import { AccountsDashboard } from "./AccountsDashboard";
const at="2026-10-20T08:00:00.000Z";
const row={userId:"33333333-3333-4333-8333-333333333333",email:"person@example.test",displayName:"Personne",createdAt:at,hasStack:true,stackUpdatedAt:at};
const dashboard={totals:{accounts:26,accountsWithStack:1,nonemptyStacks:1},topTools:[{toolSlug:"tapstitch",usedAccounts:1,wishlistAccounts:0},{toolSlug:"missing-json-tool",usedAccounts:0,wishlistAccounts:1}],accounts:[row],page:1,pageSize:25,total:26,updatedAt:at};
beforeEach(()=>{vi.resetAllMocks();mocks.list.mockResolvedValue(dashboard);mocks.detail.mockResolvedValue({...row,stack:{state:normalizePersonalStack(null),revision:1,updatedAt:at}});});
describe("accounts dashboard",()=>{
 it("shows global totals and resolves JSON-only catalogue names while preserving missing references",async()=>{
  render(<AccountsDashboard/>); await screen.findByText("Comptes confirmés");
  expect(screen.getByTestId("accounts-total")).toHaveTextContent("26");fireEvent.click(screen.getByRole("button",{name:"Stacks & outils"}));expect(screen.getByRole("link",{name:"Tapstitch"})).toHaveAttribute("href","/fr/tool/tapstitch");
  expect(screen.getByText("missing-json-tool")).toBeVisible();expect(screen.getByText("Référence absente du catalogue JSON")).toBeVisible();
  expect(screen.getByText(/26 comptes/)).toBeInTheDocument();
 });
 it("requests search and pagination on the server instead of filtering the current page",async()=>{
  render(<AccountsDashboard/>);await screen.findByText("Personne");
  fireEvent.click(screen.getByRole("button",{name:"Page suivante"}));await waitFor(()=>expect(mocks.list).toHaveBeenLastCalledWith({search:"",page:2,pageSize:25,includeInsights:true}));
  fireEvent.change(screen.getByRole("searchbox",{name:"Chercher un compte"}),{target:{value:"new@example.test"}});fireEvent.click(screen.getByRole("button",{name:"Rechercher"}));
  await waitFor(()=>expect(mocks.list).toHaveBeenLastCalledWith({search:"new@example.test",page:1,pageSize:25,includeInsights:true}));
 });
 it("shows source unavailability distinctly from a confirmed zero",async()=>{
  mocks.list.mockRejectedValue(new Error("secret SQL"));render(<AccountsDashboard/>);await screen.findByRole("alert");
  expect(screen.getByRole("alert")).toHaveTextContent("Données indisponibles");expect(screen.queryByTestId("accounts-total")).not.toBeInTheDocument();expect(screen.queryByText(/secret SQL/)).not.toBeInTheDocument();
  mocks.list.mockResolvedValue({...dashboard,totals:{accounts:0,accountsWithStack:0,nonemptyStacks:0},accounts:[],topTools:[],total:0});fireEvent.click(screen.getByRole("button",{name:"Réessayer"}));
  expect(await screen.findByTestId("accounts-total")).toHaveTextContent("0");expect(screen.getByText("Aucun compte trouvé.")).toBeVisible();
 });
 it("does not display stale totals when a refresh fails",async()=>{
  render(<AccountsDashboard/>);await screen.findByTestId("accounts-total");mocks.list.mockRejectedValue(new Error("offline"));fireEvent.click(screen.getByRole("button",{name:"Actualiser"}));
  await screen.findByRole("alert");expect(screen.queryByTestId("accounts-total")).not.toBeInTheDocument();
 });
 it("opens the full saved snapshot read-only with personal choices, needs and historical decisions",async()=>{
  const state=normalizePersonalStack({version:4,selection:{version:3,pinnedToolSlugs:["tapstitch","missing-json-tool"],needs:[{id:"custom-print","labelFr":"Imprimer","labelEn":"Print","source":"custom",order:1}],toolEntries:[{toolSlug:"tapstitch",needIds:["custom-print"],intent:"stack",assignmentMode:"manual",addedAt:at},{toolSlug:"missing-json-tool",needIds:[],intent:"wishlist",assignmentMode:"pending",addedAt:at}]},billing:{paid:["tapstitch"],reviewed:["tapstitch"],choices:{tapstitch:{source:"custom",label:"Mon forfait",amount:17.25,currency:"USD",period:"annual",seats:2,perSeat:true}}},decisions:{"old|tapstitch":{kind:"replace",kept:"tapstitch",removed:"old",saving:12,at}}});
  mocks.detail.mockResolvedValue({...row,stack:{state,revision:7,updatedAt:at}});render(<AccountsDashboard/>);await screen.findByText("Personne");fireEvent.click(screen.getByRole("button",{name:"Voir la stack de person@example.test"}));
  const detail=await screen.findByRole("region",{name:"Détail du compte"});await within(detail).findByRole("tab",{name:"Budget déclaré"});fireEvent.click(within(detail).getByRole("tab",{name:"Budget déclaré"}));expect(within(detail).getByText("Mon forfait")).toBeVisible();expect(within(detail).getByText(/17,25/)).toBeVisible();
  expect(within(detail).getByText(/USD/, { selector: "span" })).toBeVisible();fireEvent.click(within(detail).getByRole("tab",{name:"Outils"}));expect(within(detail).getByText(/Imprimer/, { selector: "small" })).toBeVisible();fireEvent.click(within(detail).getByRole("tab",{name:"Décisions"}));expect(within(detail).getByText(/Économie historique/)).toBeVisible();
  expect(within(detail).getByText(/Révision 7/)).toBeVisible();expect(within(detail).queryByRole("button",{name:/Enregistrer|Modifier|Supprimer/})).not.toBeInTheDocument();
 });
 it("keeps detail failures separate from an empty saved stack",async()=>{
  mocks.detail.mockRejectedValue(new Error("offline"));render(<AccountsDashboard/>);await screen.findByText("Personne");fireEvent.click(screen.getByRole("button",{name:"Voir la stack de person@example.test"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("Détail indisponible");expect(screen.queryByText("Aucune stack enregistrée.")).not.toBeInTheDocument();
  mocks.detail.mockResolvedValue({...row,stack:null});fireEvent.click(screen.getByRole("button",{name:"Réessayer le détail"}));expect(await screen.findByText("Aucune stack enregistrée.")).toBeVisible();
 });
 it.each([{}, {version:4,selection:null}])("shows corrupt persisted detail %j as unavailable, never as an empty saved record",async state=>{
  mocks.detail.mockImplementation(async()=>parseAccountDetail({...row,avatarUrl:null,providerLocale:null,oauthProfileSource:null,stack:{state,revision:1,updatedAt:at}}));
  render(<AccountsDashboard/>);await screen.findByText("Personne");fireEvent.click(screen.getByRole("button",{name:"Voir la stack de person@example.test"}));
  const detail=await screen.findByRole("region",{name:"Détail du compte"});expect(await within(detail).findByRole("alert")).toHaveTextContent("Détail indisponible");
  expect(within(detail).queryByText("La stack enregistrée est vide.")).not.toBeInTheDocument();expect(within(detail).queryByText("Toutes les données enregistrées")).not.toBeInTheDocument();
 });
 it("still displays a genuine persisted empty record as empty",async()=>{
  mocks.detail.mockImplementation(async()=>parseAccountDetail({...row,avatarUrl:null,providerLocale:null,oauthProfileSource:null,stack:{state:{version:3,pinnedToolSlugs:[]},revision:2,updatedAt:at}}));
  render(<AccountsDashboard/>);await screen.findByText("Personne");fireEvent.click(screen.getByRole("button",{name:"Voir la stack de person@example.test"}));
  expect(await screen.findByText("La stack enregistrée est vide.")).toBeVisible();expect(screen.queryByRole("alert")).not.toBeInTheDocument();
 });
 it("ignores late detail responses after selecting a different account",async()=>{
  let resolveFirst!:(value:unknown)=>void;mocks.list.mockResolvedValue({...dashboard,accounts:[row,{...row,userId:"44444444-4444-4444-8444-444444444444",email:"second@example.test",displayName:"Deuxième"}]});
  mocks.detail.mockReturnValueOnce(new Promise(resolve=>{resolveFirst=resolve;})).mockResolvedValueOnce({...row,email:"second@example.test",stack:null});
  render(<AccountsDashboard/>);await screen.findByText("Personne");fireEvent.click(screen.getByRole("button",{name:"Voir la stack de person@example.test"}));fireEvent.click(screen.getByRole("button",{name:"Voir la stack de second@example.test"}));
  const detail=await screen.findByRole("region",{name:"Détail du compte"});await within(detail).findByText("second@example.test");await act(async()=>{resolveFirst({...row,stack:null});});expect(within(detail).queryByText("person@example.test")).not.toBeInTheDocument();
 });
});
it('shows initial profile provider and informational locale on the detail only',async()=>{
 mocks.detail.mockResolvedValue({...row,avatarUrl:'https://avatars.githubusercontent.com/u/1',providerLocale:'en-US',oauthProfileSource:'github',stack:null});render(<AccountsDashboard/>);await screen.findByText('Personne');
 fireEvent.click(screen.getByRole('button',{name:'Voir la stack de person@example.test'}));const detail=await screen.findByRole('region',{name:'Détail du compte'});
 await waitFor(()=>expect(within(detail).getByText(/Fournisseur du profil initial : GitHub/)).toBeVisible());expect(within(detail).getByText(/Langue du fournisseur : en-US/)).toBeVisible();expect(detail.querySelector('img')).toHaveAttribute('referrerpolicy','no-referrer');
});
