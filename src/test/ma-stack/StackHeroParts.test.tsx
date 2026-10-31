// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import StackFindings, { type Finding } from "@/components/stack/StackFindings";
import { MemoryRouter } from "react-router-dom";
import { setPersonalStackScope } from "@/lib/personalStackStore";
import type { ToolSummary } from "@/hooks/useSupabaseData";

const tool = (id: string) => ({ id, slug: id, name: id, categoryId: "x", pricing: { free: "", paid: "" } } as ToolSummary);
afterEach(() => {cleanup(); setPersonalStackScope("anonymous");});

describe("StackFindings", () => {
  it("offers keeping both inside the same decision group as either tool", async () => {
    const keepBoth = vi.fn();
    const { container } = module([{ ...pair, actions: [...pair.actions,
      { label: "Garder Linear", onClick: vi.fn() },
      { label: "Garder les deux", onClick: keepBoth },
    ] }]);
    const both = screen.getByRole("button", { name: "Garder les deux" });
    expect(container.querySelector(".mf-duel")?.contains(both)).toBe(true);
    expect([...container.querySelectorAll(".mf-duel > button")].map(button => button.getAttribute("aria-label"))).toEqual(["Garder Asana", "Garder Linear", "Garder les deux"]);
    expect(container.querySelector(".mf-links")?.contains(both)).toBe(false);
    fireEvent.click(both);
    await waitFor(() => expect(keepBoth).toHaveBeenCalledOnce());
  });
  const card = (key: string, onClick = vi.fn()): Finding => ({ key, kind: "freemium", tools: [tool(key)], title: `Payez-vous ${key} ?`, detail: "", actions: [{ label: "Oui, payant", primary: true, onClick }] });
  const pair: Finding = { key: "pair", kind: "pair", tools: [tool("Asana"), tool("Linear")], title: "Asana ou Linear ?", detail: "", costs: [33, 40], stake: 33, actions: [{ label: "Garder Asana", onClick: vi.fn() }] };
  const module = (items: Finding[], extra: Partial<Parameters<typeof StackFindings>[0]> = {}) => render(<MemoryRouter><StackFindings lang="fr" total={446} format={(n) => `${Math.round(n)} €`} toolCount={4}
    spend={[{ tool: tool("Workable"), amount: 257 }, { tool: tool("SysAid"), amount: 76 }]} areas={[{ id: "rh", label: "RH", amount: 257, color: "#2A78D6" }, { id: "it", label: "IT", amount: 76, color: "#EDA100" }, { id: "ia", label: "IA", amount: 0, color: "#6250D6" }]} fit={[]} items={items} saved={0} toReview={33} resolved={[]} onAddTool={vi.fn()} onReviewTools={vi.fn()} {...extra} /></MemoryRouter>);

  it("reads the price first, then one decision at a time", () => {
    module([card("Canva"), card("Slack"), card("Notion")]);
    expect(screen.getByRole("text", { name: "446 €" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Prochaine décision" })).toBeTruthy();
    expect(screen.getByText("Payez-vous Canva ?")).toBeTruthy();
    expect(screen.getByText("1 outil sur 4 renseigné")).toBeTruthy();
    expect(screen.getByLabelText("Étape 1 sur 3")).toBeTruthy();
  });
  it("labels incomplete costs as partial and shows a split for two areas", () => {
    const { container } = module([card("Figma"), card("Grammarly")], { total: 29, areas: [{ id: "create", label: "Créer", amount: 29, color: "blue" }, { id: "communicate", label: "Communiquer", amount: 0, color: "orange" }] });
    expect(screen.getByText("Budget partiel renseigné")).toBeTruthy();
    expect(screen.getByText("2 outils sur 4 renseignés")).toBeTruthy();
    expect(screen.queryByText(/fiable à|Total exact/)).toBeNull();
    expect(container.querySelector(".tt-split-body")).not.toBeNull();
    expect(screen.queryByText(/dès trois domaines/)).toBeNull();
  });
  it("accounts for all four tools when only two have a paid cost", () => {
    const { container } = module([], { total: 41, spend: [{tool:tool("Motion Array"),amount:29},{tool:tool("Grammarly"),amount:12}], freeTools:[tool("Figma"),tool("Audacity")] });
    expect(screen.getByText("2 outils gratuits · sans coût ajouté")).toBeTruthy();
    expect(screen.getByText("Figma")).toBeTruthy();
    expect(screen.getByText("Audacity")).toBeTruthy();
    expect(container.querySelectorAll("[data-free-tools] > li")).toHaveLength(2);
    expect(screen.queryByText(/autres/)).toBeNull();
  });
  it("does not invent a zero budget before the first plan is selected", () => {
    const {container}=module([card("Notion")],{total:0,toolCount:1,spend:[],areas:[],fit:[]});
    expect(screen.getByText("On fait les comptes ?")).toBeTruthy();
    expect(screen.queryByRole("text",{name:"0 €"})).toBeNull();
    expect(container.querySelector(".mf-balance")).toBeNull();
    expect(container.querySelector(".mf-fit")).toBeNull();
  });
  it("defers a question even after selecting it from the budget", () => {
    module([card("Canva"),card("Slack")]);
    fireEvent.click(screen.getByRole("button",{name:"Plus tard"}));
    fireEvent.click(screen.getByRole("button",{name:/outil.*sur/}));
    expect(screen.getByText("Payez-vous Canva ?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Plus tard"}));
    expect(screen.getByText("Payez-vous Slack ?")).toBeTruthy();
  });
  it("does not apply an animated answer to a different account", async () => {
    setPersonalStackScope("timer-account-a");
    const answer=vi.fn(); module([{...card("Canva"),plans:[{key:"paid",label:"Payant",monthly:21,pick:answer}]}]);
    fireEvent.click(screen.getByRole("radio",{name:/Payant/}));
    setPersonalStackScope("timer-account-b");
    await new Promise(resolve=>setTimeout(resolve,800));
    expect(answer).not.toHaveBeenCalled();
  });
  it("cancels an animated answer when leaving the bento", async () => {
    const answer=vi.fn();const view=module([{...card("Canva"),plans:[{key:"paid",label:"Payant",monthly:21,pick:answer}]}]);
    fireEvent.click(screen.getByRole("radio",{name:/Payant/}));view.unmount();
    await new Promise(resolve=>setTimeout(resolve,800));
    expect(answer).not.toHaveBeenCalled();
  });
  it("guides the first paid tool instead of showing a full dashboard",()=>{
    const add=vi.fn();const{container}=module([],{toolCount:1,total:11,spend:[{tool:tool("Notion"),amount:11}],onAddTool:add});
    expect(container.querySelector('.mf-balance')).toBeNull();
    expect(screen.getByText('Votre stack prend forme.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Ajouter un autre outil'}));expect(add).toHaveBeenCalledOnce();
  });
  it("shows the budget by vertical as a radar", () => {
    module([card("Canva")]);
    expect(screen.getByRole("img", { name: "RH 58 %, IT 17 %" })).toBeTruthy();
    expect(screen.getByText("RH prend 58 % du budget renseigné.")).toBeTruthy();
  });
  it("shows a pair as two faces, each with what it saves, and tags the cheaper one", () => {
    const { container } = module([pair]);
    expect([...container.querySelectorAll(".mf-choice--keep")].map((node) => node.textContent)).toEqual(["Garder AsanaLe moins cherLinear quitte la stack · seul, 33 €/mois−40 €/mois", "Garder LinearAsana quitte la stack · seul, 40 €/mois−33 €/mois"]);
  });
  it("answers the decision on top", () => {
    const onClick = vi.fn();
    module([card("Canva", onClick), card("Slack")]);
    fireEvent.click(screen.getByRole("button", { name: "Oui, payant" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("brings the question picked in the reliability card to the top", () => {
    module([{ ...card("Fly"), kind: "price" }, card("Canva")], { toolCount: 2 });
    fireEvent.click(screen.getByRole("button", { name: "Plus tard" }));
    expect(screen.getByText("Payez-vous Canva ?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /outil.*sur/ }));
    expect(screen.getByText(/Combien vous coûte Fly par mois/)).toBeTruthy();
  });
  it("asks free or paid with two tiles, not bars, when the catalogue has no plan", async () => {
    const paid = vi.fn(), free = vi.fn();
    const item: Finding = { ...card("Canva"), options: [{ label: "Version gratuite", amount: 0 }, { label: "Plan payant", amount: 21 }],
      actions: [{ label: "Non, version gratuite", onClick: free }, { label: "Oui, payant", primary: true, onClick: paid }] };
    const { container } = module([item]);
    expect(container.querySelector(".mf-vs")).toBeNull();
    expect(container.querySelectorAll(".mf-plan")).toHaveLength(2);
    fireEvent.click(screen.getByRole("radio", { name: /Payant/ }));
    // The answer goes through once the pick animation has played.
    await waitFor(() => expect(paid).toHaveBeenCalledOnce());
    expect(free).not.toHaveBeenCalled();
  });
  it("sends a decision to the back", () => {
    module([card("Canva"), card("Slack")]);
    fireEvent.click(screen.getByRole("button", { name: "Plus tard" }));
    expect(screen.getByText("Payez-vous Slack ?")).toBeTruthy();
  });
  it("drops the decision card once nothing is left, the saving stays on the price card", () => {
    const { container } = module([], { saved: 67, total: 379, toReview: 0 });
    expect(container.querySelector(".mf-now")).toBeNull();
    expect(container.querySelector('[data-card="price"]')?.textContent).toMatch(/Budget estimé allégé de 67 € par mois/);
  });
});

describe("StackKit", () => {
  it("shows each amount as its share of the total", async () => {
    const { RankedBars } = await import("@/components/stack/StackKit");
    const { container } = render(<RankedBars rows={[{ id: "a", tool: tool("A"), label: "30 €", share: .75 }, { id: "b", tool: tool("B"), label: "10 €", share: .25 }]} />);
    expect(screen.getByText("75 %")).toBeTruthy();
    expect((container.querySelector("li") as HTMLElement).style.getPropertyValue("--w")).toBe("75%");
  });
  it("makes a pair row a link to one place", async () => {
    const { LinkRow } = await import("@/components/stack/StackKit");
    render(<MemoryRouter><LinkRow to="/fr/comparatif/figma-vs-canva" lead={null} title="Figma et Canva" sub="Alternatives" /></MemoryRouter>);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/fr/comparatif/figma-vs-canva");
  });
});

describe("Donut and Legend", () => {
  it("names every area in the ring and keeps the three that weigh most", async () => {
    const { Donut, Legend } = await import("@/components/stack/StackKit");
    const slices = ["IA", "Gérer", "Créer", "Analyser"].map((label, index) => ({ id: label, label, amount: 40 - index * 10, color: "#000", value: `${40 - index * 10} €` }));
    render(<><Donut slices={slices} label="IA 40 €, Gérer 30 €" /><Legend slices={slices} more={(n) => `+ ${n} autre`} /></>);
    expect(screen.getByRole("img", { name: "IA 40 €, Gérer 30 €" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("40 %")).toBeTruthy();
    expect(screen.getByText("+ 1 autre")).toBeTruthy();
  });
});
