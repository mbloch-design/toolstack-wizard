import { Input, Button } from "@/components/ui/primitives";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Check, Eye, Lock, Plus, Search, X } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { useCurrency } from "@/hooks/useCurrency";
import { useCategories, useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { scoreOverlapPairs } from "@/components/stack/StackOverlapPairs";
import { toolMonthlyCost } from "@/lib/stackCost";
import { convertAmount, formatAmount } from "@/lib/currencyRates";
import { toolKey } from "@/lib/stackView";

/**
 * The first minute of Ma stack, signed out or with an empty stack (23/10/2026).
 * A tiny first step (tap the tools you use), then a live reading of the stack,
 * computed from the catalogue only: real counts, nothing invented. Short,
 * declarative copy. Signed out, the reading names one tool of each overlapping
 * pair and keeps the other for the account (an honest curiosity gap); nothing is pinned, the picks are a
 * draft handed to the account after sign-up. Signed in, everything is shown
 * and the picks become the stack in one tap.
 */
export const STARTER_DRAFT_KEY = "tooltrim-stack-starter-draft";
const DRAFT_DAYS = 7;
/** Well-known tools to recognise at a glance; only those in the catalogue are shown. */
const WALL = ["notion", "figma", "slack", "chatgpt", "canva", "google-workspace", "trello", "asana", "zoom", "hubspot", "claude", "miro", "adobe-photoshop", "linear", "zapier"];
const GOAL = 3;
const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function readStarterDraft(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STARTER_DRAFT_KEY) || "null") as { slugs?: unknown; at?: unknown } | null;
    if (!raw || !Array.isArray(raw.slugs) || typeof raw.at !== "number" || Date.now() - raw.at > DRAFT_DAYS * 864e5) return [];
    return raw.slugs.filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  } catch { return []; }
}
export function writeStarterDraft(slugs: string[]) {
  try {
    if (slugs.length) localStorage.setItem(STARTER_DRAFT_KEY, JSON.stringify({ slugs, at: Date.now() }));
    else localStorage.removeItem(STARTER_DRAFT_KEY);
  } catch { /* private mode: the draft lives for this page only */ }
}

type Props = {
  mode: "guest" | "member";
  /** Guest: keep the draft and open sign-up. Member: pin the picks. */
  onFinish: (slugs: string[]) => void;
  /** Guest only: open sign-in for an existing account. */
  onSignIn?: () => void;
  /** Guest: lets the landing below follow the picks. */
  onPicksChange?: (slugs: string[]) => void;
  busy?: boolean;
  expired?: boolean;
  /** Tools already picked: the anonymous draft (guest) or an earlier step (onboarding). */
  initial?: string[];
  /** Member: the tools to show first, e.g. the ones that fit the person's trade. */
  wall?: string[];
  /** Member: replaces the default heading block (onboarding steps). */
  intro?: ReactNode;
  /** Member: replaces the default action label. */
  cta?: string;
};

/** The reading of a set of tools, from the catalogue only: what is surely paid, and the tools doing the same job. */
export function useStackReading(picked: ToolSummary[]) {
  const { t, lang } = useLang();
  const { currency } = useCurrency();
  const { categories } = useCategories();
  const free = () => false;
  const known = picked.reduce((sum, tool) => { const cost = toolMonthlyCost(tool, free, lang); return sum + (cost.kind === "paid" ? convertAmount(cost.monthly, cost.currency, currency) : 0); }, 0);
  const pairs = picked.length > 1 ? scoreOverlapPairs(picked, categories, free, currency, lang).pairs : [];
  // Each row names a different tool where possible, and says what the two share.
  const revealed = new Set<string>();
  const shownPairs = pairs.slice(0, 3).map((pair) => {
    const shown = !revealed.has(pair.a.id) ? pair.a : !revealed.has(pair.b.id) ? pair.b : pair.a;
    revealed.add(shown.id);
    const why = pair.shared[0] || t("Alternatives l’un de l’autre", "Alternatives to each other");
    return { shown, other: shown === pair.a ? pair.b : pair.a, why };
  });
  const money = (amount: number) => formatAmount(Math.round(amount), currency, lang);
  return { known, pairs, shownPairs, money };
}

export default function StackStarter({ mode, onFinish, onSignIn, onPicksChange, busy, expired, initial = [], wall: wallSlugs, intro, cta: ctaLabel }: Props) {
  const { t, lang } = useLang();
  const { tools, loading } = useToolSummaries();
  const guest = mode === "guest";
  // Picks made before signing in are already selected once signed in.
  const [handed] = useState(() => readStarterDraft());
  const [picks, setPicks] = useState<string[]>(() => [...new Set([...handed, ...initial])]);
  const [query, setQuery] = useState("");
  // A guest's picks survive a reload or the sign-up round trip.
  useEffect(() => { if (guest) writeStarterDraft(picks); onPicksChange?.(picks); }, [guest, picks, onPicksChange]);

  const byKey = useMemo(() => new Map(tools.map((tool) => [toolKey(tool), tool])), [tools]);
  const wall = (wallSlugs ?? WALL).map((slug) => byKey.get(slug)).filter((tool): tool is ToolSummary => !!tool);
  const picked = picks.map((slug) => byKey.get(slug)).filter((tool): tool is ToolSummary => !!tool);
  const term = normalize(query);
  const results = term ? tools.filter((tool) => normalize(`${tool.name} ${toolKey(tool)}`).includes(term))
    .sort((a, b) => Number(!normalize(a.name).startsWith(term)) - Number(!normalize(b.name).startsWith(term)) || a.name.localeCompare(b.name, lang)).slice(0, 6) : [];
  const toggle = (tool: ToolSummary) => setPicks((current) => current.includes(toolKey(tool)) ? current.filter((slug) => slug !== toolKey(tool)) : [...current, toolKey(tool)]);

  const { known, pairs, shownPairs, money } = useStackReading(picked);
  const left = Math.max(0, GOAL - picked.length);
  const s = (n: number) => (n > 1 ? "s" : "");
  // Signed in, the reading counts to three with a smile, then lets the person go.
  const memberReading = picked.length === 0 ? t("Trois outils, et on s’occupe du reste.", "Three tools, and we handle the rest.")
    : picked.length === 1 ? t("Un. Bon début.", "One. Good start.")
    : picked.length === 2 ? t("Deux. Plus qu’un.", "Two. One to go.")
    : pairs.length > 0 ? t(pairs.length > 1 ? `${pairs.length} paires font le même travail. On en reparle.` : "Deux outils font le même travail. On en reparle.", pairs.length > 1 ? `${pairs.length} pairs do the same job. We’ll talk.` : "Two tools do the same job. We’ll talk.")
    : picked.length === 3 ? t("Trois. Parfait, on peut y aller.", "Three. Perfect, off we go.")
    : t("Vous êtes lancé. Personne ne vous arrête.", "You’re on a roll. Nobody’s stopping you.");
  const reading = !guest ? memberReading : pairs.length > 0
    ? t(pairs.length > 1 ? `${pairs.length} paires font le même travail.` : "Deux outils font le même travail.", pairs.length > 1 ? `${pairs.length} pairs do the same job.` : "Two tools do the same job.")
    : picked.length === 0 ? t("Choisissez trois outils pour commencer.", "Pick three tools to begin.")
    : picked.length === 1 ? t("Encore deux.", "Two more.")
    : picked.length === 2 ? t("Encore un.", "One more.")
    : t("Aucun doublon en vue.", "No overlaps in sight.");

  const tile = (tool: ToolSummary) => {
    const on = picks.includes(toolKey(tool));
    return <button key={tool.id} type="button" className="ss-tile" aria-pressed={on} onClick={() => toggle(tool)}
      aria-label={on ? t(`Retirer ${tool.name}`, `Remove ${tool.name}`) : t(`J’utilise ${tool.name}`, `I use ${tool.name}`)}>
      <span className="ss-tile-logo"><ToolLogo tool={tool} size={36} />{on && <span className="ss-tile-check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>}</span>
      <span className="ss-tile-name">{tool.name}</span>
    </button>;
  };
  const cta = guest ? (expired ? t("Se reconnecter", "Sign in again") : t("Voir le diagnostic complet", "See the full diagnosis")) : ctaLabel ?? t(`Créer ma stack (${picked.length})`, `Create my stack (${picked.length})`);

  return <section className="ss" aria-labelledby="ss-title" data-mode={mode}>
    <div className="ss-pick" id="ss-pick">
      {guest ? <>
        <p className="ss-eyebrow">{t("Gratuit. En trente secondes.", "Free. In thirty seconds.")}</p>
        <h1 id="ss-title">{t("Payez ce qui sert.", "Pay for what works.")} <span className="ss-h1-accent">{t("Rien de plus.", "Nothing more.")}</span></h1>
        <p className="ss-lead">{t("Touchez les outils que vous utilisez. ToolTrim repère les doublons et fait les comptes.", "Tap the tools you use. ToolTrim spots the overlaps and does the maths.")}</p>
        <h2 className="ss-ask">{t("Quels outils utilisez-vous ?", "Which tools do you use?")}</h2>
      </> : intro ?? <>
        <p className="ss-eyebrow">{handed.length ? t(`Vos ${handed.length} outil${s(handed.length)} vous attendent`, `Your ${handed.length} tool${handed.length > 1 ? "s are" : " is"} waiting`) : t("Votre stack est prête à démarrer", "Your stack is ready to start")}</p>
        <h1 id="ss-title">{t("Quels outils utilisez-vous ?", "Which tools do you use?")}</h1>
        <p className="ss-lead">{t("Touchez ceux que vous utilisez. ToolTrim fait le reste.", "Tap the ones you use. ToolTrim does the rest.")}</p>
      </>}
      <label className="ss-search">
        <Search size={18} aria-hidden />
        <Input appearance="stack-search-small" id="ss-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Un autre outil ? Cherchez-le", "Another tool? Search for it")} aria-label={t("Chercher un outil", "Search for a tool")} />
        {query && <button type="button" className="ss-search-clear" onClick={() => setQuery("")} aria-label={t("Effacer", "Clear")}><X size={16} aria-hidden /></button>}
      </label>
      {term
        ? <ul className="ss-results">{results.length === 0 ? <li className="ss-empty">{t("Aucun outil trouvé.", "No tools found.")}</li> : results.map((tool) => { const on = picks.includes(toolKey(tool)); return <li key={tool.id}>
            <button type="button" aria-pressed={on} onClick={() => { toggle(tool); setQuery(""); }}><ToolLogo tool={tool} size={24} /><span>{tool.name}</span>{on ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}</button>
          </li>; })}</ul>
        : <div className="ss-wall" role="group" aria-label={t("Outils courants", "Common tools")} aria-busy={loading}>{wall.map(tile)}</div>}
    </div>

    {/* The reading: the person's own logos, one sentence, then what the catalogue already knows. */}
    <aside className="ss-stack" data-count={picked.length} aria-labelledby="ss-reading-k">
      <p className="ss-stack-k" id="ss-reading-k"><Eye size={15} aria-hidden />{t("Votre stack", "Your stack")}</p>
      {picked.length > 0 && <ul className="ss-stack-logos">{picked.map((tool) => <li key={tool.id}><button type="button" onClick={() => toggle(tool)} aria-label={t(`Retirer ${tool.name}`, `Remove ${tool.name}`)} title={tool.name}><ToolLogo tool={tool} size={32} /></button></li>)}</ul>}
      {/* No aria-live here: Radix keeps live regions out of the modal's aria-hidden, with the whole page around them. The tiles announce their own state. */}
      <p className="ss-reading" key={reading}>{reading}</p>
      {/* Guest: one side of each pair, the other one waits for the account. Member: both. */}
      {pairs.length > 0 && <ul className="ss-pairs">{shownPairs.map(({ shown, other, why }) => <li key={`${shown.id}|${other.id}`}>
        <span className="ss-pair-logos"><ToolLogo tool={shown} size={24} />{guest ? <span className="ss-pair-hidden" aria-hidden="true">?</span> : <ToolLogo tool={other} size={24} />}</span>
        <span className="ss-pair-text"><b>{guest ? t(`${shown.name} et un autre outil`, `${shown.name} and another tool`) : t(`${shown.name} et ${other.name}`, `${shown.name} and ${other.name}`)}</b><small>{why}</small></span>
      </li>)}</ul>}
      <dl className="ss-facts">
        <div><dt>{t("Outils", "Tools")}</dt><dd>{picked.length}</dd></div>
        <div><dt>{t("Coût connu", "Known cost")}</dt><dd>{picked.length === 0 ? "–" : known > 0 ? <>{money(known)}<small>{t("/mois", "/mo")}</small></> : <span className="ss-tbd">{t("à préciser", "to confirm")}</span>}</dd></div>
        <div data-locked={pairs.length > 0 ? "" : undefined}><dt>{t("Doublons", "Duplicates")}</dt><dd>{picked.length < 2 ? "–" : pairs.length}</dd></div>
      </dl>
      {/* A monthly price reads small; the year is the honest size of the same number. */}
      {known > 0 && <p className="ss-year">{t(`Au moins ${money(known * 12)} par an, d’après les prix publics.`, `At least ${money(known * 12)} a year, from public prices.`)}</p>}
      {left > 0 ? <div className="ss-goal" aria-label={t(`${picked.length} sur ${GOAL}`, `${picked.length} of ${GOAL}`)}>
        <span className="ss-goal-dots" aria-hidden="true">{Array.from({ length: GOAL }, (_, index) => <i key={index} data-on={index < picked.length ? "" : undefined} />)}</span>
        <span>{picked.length === 0 ? t("Trois outils suffisent.", "Three tools are enough.") : t(`${picked.length} sur ${GOAL}.`, `${picked.length} of ${GOAL}.`)}</span>
      </div> : !guest ? <p className="ss-goal-done"><Check size={15} aria-hidden />{t("Le reste ? Quand vous voulez, depuis votre espace.", "The rest? Whenever you like, from your space.")}</p> : <div className="ss-unlock">
        <p>{t("Avec un compte", "With an account")}</p>
        <ul>
          <li><Lock size={13} aria-hidden />{t("Les doublons, nommés.", "Overlaps, named.")}</li>
          <li><Lock size={13} aria-hidden />{t("Le bon choix, offre par offre.", "The right pick, plan by plan.")}</li>
          <li><Lock size={13} aria-hidden />{t("Les outils sous-utilisés.", "The tools you barely use.")}</li>
        </ul>
      </div>}
      <Button appearance="account-welcome" variant="primary" type="button" className=" ss-cta" disabled={picked.length === 0 || busy} onClick={() => onFinish(picks)}>{cta}<ArrowRight size={18} aria-hidden /></Button>
      {guest && <p className="ss-reassure">{t("Gratuit. Sans carte bancaire.", "Free. No card needed.")}
        {onSignIn && <> <Button appearance="account" variant="quiet" type="button"  onClick={onSignIn}>{t("J’ai déjà un compte", "I already have an account")}</Button></>}</p>}
    </aside>

    {/* Phone: the reading and the action stay under the thumb while choosing. */}
    {picked.length > 0 && <div className="ss-dock" aria-hidden="true">
      <span className="ss-dock-logos">{picked.slice(0, 4).map((tool) => <span key={tool.id}><ToolLogo tool={tool} size={22} /></span>)}</span>
      <span className="ss-dock-text"><b>{t(`${picked.length} outil${s(picked.length)}`, `${picked.length} tool${s(picked.length)}`)}</b>{pairs.length > 0 ? t(` · ${pairs.length} doublon${s(pairs.length)}`, ` · ${pairs.length} duplicate${s(pairs.length)}`) : ""}</span>
      <Button appearance="stack-dock" variant="secondary" type="button" tabIndex={-1} className="ss-dock-cta" disabled={busy} onClick={() => onFinish(picks)}>{guest ? t("Voir", "See") : ctaLabel ?? t("Créer", "Create")}<ArrowRight size={16} aria-hidden /></Button>
    </div>}
  </section>;
}
