import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import SubmitToolPage from "../pages/SubmitToolPage";

const draft = { toolName: "Sample", toolUrl: "https://example.com/", email: "ada@example.com", name: "Ada", submitterRole: "founder", message: "A useful tool", badgeUrl: "", verificationToken: "", paymentReference: "7ec2090a-9157-43c9-9238-f8931667420d" };
const request = vi.fn<typeof fetch>();
beforeEach(() => {
  const values = new Map<string,string>();
  vi.stubGlobal("localStorage", { getItem:(key:string)=>values.get(key) ?? null, setItem:(key:string,value:string)=>values.set(key,value), removeItem:(key:string)=>values.delete(key), clear:()=>values.clear(), key:(index:number)=>Array.from(values.keys())[index] ?? null, get length(){return values.size;} });
  window.localStorage.clear(); window.localStorage.setItem("tt_submit_draft", JSON.stringify(draft));
  request.mockReset().mockImplementation(async () => new Response(JSON.stringify({error:"payment_verification_unavailable"}), {status:503}));
  vi.stubGlobal("fetch", request);
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); window.localStorage.clear(); vi.unstubAllGlobals(); });
function mount(url = "/fr/submit?paid=1&checkout_id=ch_local123") {
  return render(<MemoryRouter initialEntries={[url]}><HelmetProvider><SubmitToolPage /></HelmetProvider></MemoryRouter>);
}
it("keeps the draft and does not confirm an unverifiable payment return", async () => {
  mount();
  await waitFor(() => expect(screen.queryByText("Paiement confirmé : publication prioritaire")).not.toBeInTheDocument());
  expect(window.localStorage.getItem("tt_submit_draft")).not.toBeNull();
});
it("verifies a return without paid=1 and removes the draft only after a successful final send", async () => {
  request.mockImplementation(async url => new Response(JSON.stringify({success:true,verified:true})));
  mount("/fr/submit?checkout_id=ch_local123");
  await screen.findByText("Paiement confirmé : publication prioritaire");
  expect(window.localStorage.getItem("tt_submit_draft")).not.toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Envoyer pour revue →"}));
  await screen.findByText("Ta publication prioritaire est lancée.");
  expect(window.localStorage.getItem("tt_submit_draft")).toBeNull();
  const sent = JSON.parse(String(request.mock.calls.find(([url])=>String(url).endsWith("/api/contact"))?.[1]?.body));
  expect(sent.checkoutId).toBe("ch_local123"); expect(sent.paymentReference).toBe("7ec2090a-9157-43c9-9238-f8931667420d"); expect(sent.paid).toBe(true);
});
it("retries verification without starting another checkout", async () => {
 mount(); await screen.findByRole("button",{name:"Réessayer la vérification"});
 expect(screen.queryByRole("link",{name:/Payer/})).not.toBeInTheDocument();
 request.mockResolvedValue(new Response(JSON.stringify({verified:true})));
 fireEvent.click(screen.getByRole("button",{name:"Réessayer la vérification"}));
 await screen.findByText("Paiement confirmé : publication prioritaire");
});
it("keeps all final details after an unsuccessful final send and restores them on reload", async () => {
 request.mockImplementation(async url=>new Response(JSON.stringify(String(url).endsWith("/api/contact")?{error:"payment_verification_unavailable"}:{verified:true}),{status:String(url).endsWith("/api/contact")?503:200}));
 const view=mount(); await screen.findByText("Paiement confirmé : publication prioritaire");
 fireEvent.change(screen.getByLabelText("Ce que nous devons comprendre"),{target:{value:"Updated description"}});
 fireEvent.click(screen.getByRole("button",{name:"Envoyer pour revue →"}));
 await screen.findByRole("alert");
 expect(JSON.parse(window.localStorage.getItem("tt_submit_draft")!).message).toBe("Updated description");
 view.unmount(); mount("/fr/submit");
 await screen.findByText("Paiement confirmé : publication prioritaire");
 expect(screen.getByLabelText("Ce que nous devons comprendre")).toHaveValue("Updated description");
});
it("does not trust paid=1 with a legacy draft lacking proof", async () => {
 const {paymentReference,...legacy}=draft; window.localStorage.setItem("tt_submit_draft",JSON.stringify(legacy));
 mount("/fr/submit?paid=1");
 await screen.findByRole("alert"); expect(request).not.toHaveBeenCalled();
 expect(window.localStorage.getItem("tt_submit_draft")).not.toBeNull();
 expect(screen.queryByText("Paiement confirmé : publication prioritaire")).not.toBeInTheDocument();
});

it("attaches a recoverable reference and tool URL to the existing checkout link", async () => {
 request.mockImplementation(async()=>new Response(JSON.stringify({success:true})));
 mount("/fr/submit");
 fireEvent.click(screen.getAllByRole("button",{name:"Publier ma fiche · 29 $"})[0]);
 fireEvent.change(screen.getByLabelText("Site officiel"),{target:{value:"example.com"}});
 fireEvent.change(screen.getByLabelText("Nom de l'outil"),{target:{value:"Sample"}});
 fireEvent.change(screen.getByLabelText("Email"),{target:{value:"ada@example.com"}});
 fireEvent.click(screen.getByRole("button",{name:"Continuer vers le paiement →"}));
 const link=await screen.findByRole("link",{name:"Payer 29 $ et lancer ma fiche"});
 const url=new URL(link.getAttribute("href")!);
 expect(url.origin+url.pathname).toBe("https://www.creem.io/payment/prod_2LMoN4zyRhNAb53r3rWpwX");
 expect(url.searchParams.get("metadata[tooltrim_tool_url]")).toBe("https://example.com/");
 const reference=url.searchParams.get("metadata[tooltrim_submission_id]"); expect(reference).toMatch(/^[a-f0-9-]{36}$/);
 expect(JSON.parse(window.localStorage.getItem("tt_submit_draft")!).paymentReference).toBe(reference);
 // Prevent actual navigation; the draft must already exist when Creem opens.
 link.addEventListener("click",event=>event.preventDefault()); fireEvent.click(link);
 expect(JSON.parse(window.localStorage.getItem("tt_submit_draft")!).paymentReference).toBe(reference);
});
it("never confirms payment from a malformed verification success response",async()=>{
 request.mockResolvedValue(new Response(JSON.stringify({success:true})));
 mount(); await screen.findByRole("alert");expect(screen.queryByText("Paiement confirmé : publication prioritaire")).not.toBeInTheDocument();
});
it("keeps the accepted success screen even if clearing storage fails",async()=>{
 request.mockImplementation(async()=>new Response(JSON.stringify({verified:true,success:true})));
 mount(); await screen.findByText("Paiement confirmé : publication prioritaire");
 window.localStorage.removeItem=()=>{throw new DOMException("blocked","SecurityError");};
 fireEvent.click(screen.getByRole("button",{name:"Envoyer pour revue →"}));
 await screen.findByText("Ta publication prioritaire est lancée.");
 await act(async()=>{await new Promise(resolve=>setTimeout(resolve,30));});
 expect(screen.getByText("Ta publication prioritaire est lancée.")).toBeInTheDocument();
});
it("binds payments started from a free-plan upgrade",async()=>{
 request.mockImplementation(async()=>new Response(JSON.stringify({success:true})));
 mount("/fr/submit");fireEvent.click(screen.getByRole("button",{name:"Rejoindre la revue standard →"}));
 fireEvent.change(screen.getByLabelText("Site officiel"),{target:{value:"https://example.com/"}});
 fireEvent.change(screen.getByLabelText("Nom de l'outil"),{target:{value:"Sample"}});
 fireEvent.change(screen.getByLabelText("Email"),{target:{value:"ada@example.com"}});
 fireEvent.click(screen.getByRole("button",{name:"Continuer vers le badge →"}));
 fireEvent.click(await screen.findByRole("button",{name:"Choisir la formule à 29 $ →"}));
 const link=await screen.findByRole("link",{name:"Payer 29 $ et lancer ma fiche"});
 expect(new URL(link.getAttribute("href")!).searchParams.get("metadata[tooltrim_submission_id]")).toMatch(/^[a-f0-9-]{36}$/);
});

it("recovers an earlier checkout after another draft has been started",async()=>{
 const earlier={...draft,paymentReference:"be43674d-33c4-41d0-9490-82b9695b7c7a",toolName:"Earlier",toolUrl:"https://earlier.example/"};
 window.localStorage.setItem("tt_submit_draft:"+earlier.paymentReference,JSON.stringify(earlier));
 request.mockImplementation(async (_url,options)=>new Response(JSON.stringify(JSON.parse(String(options?.body)).paymentReference===earlier.paymentReference?{verified:true}:{error:"payment_verification_required"}),{status:JSON.parse(String(options?.body)).paymentReference===earlier.paymentReference?200:400}));
 mount(); await screen.findByText("Paiement confirmé : publication prioritaire");
 expect(JSON.parse(window.localStorage.getItem("tt_submit_draft")!).toolName).toBe("Earlier");
});
it("blocks checkout exposure when saving the recovery draft is impossible",async()=>{
 request.mockImplementation(async()=>new Response(JSON.stringify({success:true})));
 mount("/fr/submit");fireEvent.click(screen.getAllByRole("button",{name:"Publier ma fiche · 29 $"})[0]);
 fireEvent.change(screen.getByLabelText("Site officiel"),{target:{value:"example.com"}});
 fireEvent.change(screen.getByLabelText("Nom de l'outil"),{target:{value:"Sample"}});
 fireEvent.change(screen.getByLabelText("Email"),{target:{value:"ada@example.com"}});
 window.localStorage.setItem=()=>{throw new DOMException("blocked","SecurityError");};
 fireEvent.click(screen.getByRole("button",{name:"Continuer vers le paiement →"}));
 await screen.findByRole("alert");expect(screen.queryByRole("link",{name:/Payer/})).not.toBeInTheDocument();
});
it("does not crash or trust malformed saved fields",async()=>{
 window.localStorage.setItem("tt_submit_draft",JSON.stringify({...draft,email:{invalid:true}}));
 mount();await screen.findByRole("alert");expect(request).not.toHaveBeenCalled();
});

it('legacy_paid_reference_preserved_as_stable_submission_id',async()=>{
 request.mockImplementation(async()=>new Response(JSON.stringify({verified:true,success:true})));
 mount();await screen.findByText('Paiement confirmé : publication prioritaire');
 fireEvent.click(screen.getByRole('button',{name:'Envoyer pour revue →'}));await screen.findByText('Ta publication prioritaire est lancée.');
 const sent=request.mock.calls.find(([url])=>String(url).endsWith('/api/contact'));
 expect(JSON.parse(String(sent?.[1]?.body)).submissionId).toBe(draft.paymentReference);
});
it('free_draft_id_survives_reload_and_retry',async()=>{
 window.localStorage.clear();request.mockImplementation(async()=>new Response(JSON.stringify({success:true})));
 const page=mount('/fr/submit');fireEvent.click(screen.getAllByRole('button',{name:/Rejoindre la revue standard/})[0]);
 fireEvent.change(screen.getByLabelText('Site officiel'),{target:{value:'example.com'}});fireEvent.change(screen.getByLabelText("Nom de l'outil"),{target:{value:'Sample'}});fireEvent.change(screen.getByLabelText('Email'),{target:{value:'ada@example.com'}});
 fireEvent.click(screen.getByRole('button',{name:/Continuer/}));
 await waitFor(()=>expect(JSON.parse(window.localStorage.getItem('tt_submit_draft')||'{}').submissionId).toMatch(/^[a-f0-9-]{36}$/));
 const id=JSON.parse(window.localStorage.getItem('tt_submit_draft')!).submissionId;
 page.unmount();mount('/fr/submit');fireEvent.click(screen.getAllByRole('button',{name:/Rejoindre la revue standard/})[0]);
 expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
 fireEvent.click(screen.getByRole('button',{name:/Continuer/}));
 await waitFor(()=>expect(JSON.parse(window.localStorage.getItem('tt_submit_draft')!).submissionId).toBe(id));
});
