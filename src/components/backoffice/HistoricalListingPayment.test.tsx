import {fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,expect,it,vi} from "vitest";
import {LangContext} from "@/hooks/useLang";
import HistoricalListingPayment from "./HistoricalListingPayment";
afterEach(()=>vi.unstubAllGlobals());
const getToken=async()=>"admin";
it("preserves receipt input after failure and never treats an unsuccessful reconciliation as paid",async()=>{
  const onAttached=vi.fn();
  const fetch=vi.fn(async(_url:unknown,options?:RequestInit)=>options?.method==="POST"
    ? Response.json({error:{code:"CMS_RECEIPT_ALREADY_USED"}},{status:409})
    : Response.json({listingId:"listing",websiteUrl:"https://example.org",reviewRequested:true,paid:false}));
  vi.stubGlobal("fetch",fetch);
  render(<LangContext.Provider value={{lang:"en",prefix:"/en",t:(_fr,en)=>en}}><HistoricalListingPayment listingId="listing" getToken={getToken} disabled={false} onAttached={onAttached}/></LangContext.Provider>);
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Match a previous payment"}));
  fireEvent.change(await screen.findByLabelText("Creem checkout ID"),{target:{value:"ch_old"}});
  fireEvent.change(screen.getByLabelText("Original submission reference"),{target:{value:"old-reference"}});
  fireEvent.change(screen.getByLabelText("How did you verify the representative and purchaser?"),{target:{value:"Confirmed original purchaser from provider invoice."}});
  fireEvent.click(screen.getByRole("button",{name:"Verify and attach payment"}));
  expect(await screen.findByRole("alert")).toHaveTextContent("already attached");
  expect(screen.getByLabelText("Creem checkout ID")).toHaveValue("ch_old");
  expect(onAttached).not.toHaveBeenCalled();
  expect(JSON.parse(String(fetch.mock.calls[1][1]?.body))).toEqual({listingId:"listing",checkoutId:"ch_old",paymentReference:"old-reference",reviewNote:"Confirmed original purchaser from provider invoice."});
  fetch.mockResolvedValueOnce(Response.json({state:"paid"}));
  fireEvent.click(screen.getByRole("button",{name:"Verify and attach payment"}));
  await waitFor(()=>expect(onAttached).toHaveBeenCalledTimes(1));
});
