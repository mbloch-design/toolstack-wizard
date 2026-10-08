import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, X } from "@/lib/icons";
import ToolLogo from "@/components/ToolLogo";
import ValueChange from "@/components/motion/ValueChange";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useCategories, useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { HERO_CLUSTER_SLOTS } from "@/lib/heroCluster";
import { stackRelations } from "@/lib/stackUsage";
import { readStackSnapshot, type StackSnapshot } from "@/lib/stackSnapshot";
import { toolKey } from "@/lib/stackView";
import { trackEvent } from "@/lib/analytics";

/**
 * « La pile » (design review, 8 Oct 2026): the home lets people do the
 * product's verb before reading about it. Ten real tools lie in a messy pile;
 * tap the ones you use, they line up in the tray, and two that do the same
 * job meet side by side with ⇄ so you keep one, or both. "Continuer dans Ma
 * stack" pins what you kept and opens Ma stack. Nothing is pinned before.
 *
 * Pairs are never asserted here: they come from stackRelations on the live
 * catalogue (each pair below is listed as an alternative of the other).
 * No money on the home: prices depend on plans and the freemium question,
 * which belong to Ma stack.
 */

// Ordered so the five pairs are spread across the pile, never adjacent.
const PILE = ["notion", "chatgpt", "figma", "make", "dropbox", "clickup", "claude", "canva", "zapier", "google-drive"];
const FALLBACK_NAMES: Record<string, string> = {
  notion: "Notion", chatgpt: "ChatGPT", figma: "Figma", make: "Make", dropbox: "Dropbox",
  clickup: "ClickUp", claude: "Claude", canva: "Canva", zapier: "Zapier", "google-drive": "Google Drive",
};
const FRAME = { w: 440, h: 380 };

type Pair = { a: string; b: string };

export default function StackPile() {
  const { t, lang, prefix } = useLang();
  const navigate = useNavigate();
  const { tools } = useToolSummaries({ refreshRemote: false });
  const { categories } = useCategories();
  const { state, pinTool } = useStackPins();
  const [picked, setPicked] = useState<string[]>([]);
  const [keptBoth, setKeptBoth] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState<StackSnapshot | null>(null);
  useEffect(() => { setSnapshot(readStackSnapshot()); }, []);

  const bySlug = useMemo(() => new Map(tools.map((tool) => [toolKey(tool), tool])), [tools]);
  const tool = (slug: string): ToolSummary | { id: string; slug: string; name: string } =>
    bySlug.get(slug) || { id: slug, slug, name: FALLBACK_NAMES[slug] || slug };
  const name = (slug: string) => tool(slug).name;

  // Pairs among the picked tools, confirmed by the catalogue.
  const pairs = useMemo<Pair[]>(() => {
    const selected = picked.map((slug) => bySlug.get(slug)).filter(Boolean) as ToolSummary[];
    const found: Pair[] = [];
    const used = new Set<string>();
    for (const source of selected) {
      const a = toolKey(source);
      if (used.has(a)) continue;
      const match = stackRelations(source, selected, categories, lang).find((relation) => relation.explicit && !used.has(toolKey(relation.tool)));
      if (!match) continue;
      const b = toolKey(match.tool);
      used.add(a); used.add(b);
      found.push(picked.indexOf(a) < picked.indexOf(b) ? { a, b } : { a: b, b: a });
    }
    return found;
  }, [picked, bySlug, categories, lang]);
  const pairKey = (pair: Pair) => [pair.a, pair.b].sort().join("|");
  const inPair = new Set(pairs.flatMap((pair) => [pair.a, pair.b]));
  const open = pairs.filter((pair) => !keptBoth.includes(pairKey(pair)));
  const singles = picked.filter((slug) => !inPair.has(slug));

  // FLIP: the picked logo travels from its place in the pile to the tray.
  const from = useRef<{ slug: string; rect: DOMRect } | null>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const start = from.current;
    from.current = null;
    if (!start || !trayRef.current || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const target = trayRef.current.querySelector<HTMLElement>(`[data-pile-id="${start.slug}"]`);
    if (!target) return;
    const end = target.getBoundingClientRect();
    target.animate([
      { transform: `translate(${start.rect.left - end.left}px, ${start.rect.top - end.top}px) scale(${start.rect.width / end.width})`, opacity: 0.6 },
      { transform: "none", opacity: 1 },
    ], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
  }, [picked]);

  function toggle(slug: string, element: HTMLElement) {
    if (picked.includes(slug)) {
      setPicked(picked.filter((item) => item !== slug));
      setMessage(t(`${name(slug)} retiré.`, `${name(slug)} removed.`));
      return;
    }
    from.current = { slug, rect: element.getBoundingClientRect() };
    const next = [...picked, slug];
    setPicked(next);
    const partner = next.find((other) => other !== slug && (bySlug.get(slug) && bySlug.get(other)
      ? stackRelations(bySlug.get(slug)!, [bySlug.get(other)!], categories, lang).some((relation) => relation.explicit)
      : false));
    setMessage(partner
      ? t(`${name(partner)} et ${name(slug)} font le même travail.`, `${name(partner)} and ${name(slug)} do the same job.`)
      : t(`${name(slug)} ajouté.`, `${name(slug)} added.`));
    if (next.length === 1) trackEvent("home_pile_start", {});
  }
  function keepOne(pair: Pair, keep: string) {
    const drop = keep === pair.a ? pair.b : pair.a;
    setPicked(picked.filter((slug) => slug !== drop));
    setMessage(t(`Vous gardez ${name(keep)}, ${name(drop)} retourne dans la pile.`, `You keep ${name(keep)}, ${name(drop)} goes back to the pile.`));
    trackEvent("home_pile_keep_one", { kept: keep, removed: drop });
  }
  function keepBoth(pair: Pair) {
    setKeptBoth([...keptBoth, pairKey(pair)]);
    setMessage(t(`Vous gardez ${name(pair.a)} et ${name(pair.b)}.`, `You keep ${name(pair.a)} and ${name(pair.b)}.`));
    trackEvent("home_pile_keep_both", { a: pair.a, b: pair.b });
  }
  function proceed() {
    const already = new Set(state.pinnedToolSlugs);
    for (const slug of picked) if (!already.has(slug)) pinTool(slug);
    trackEvent("home_pile_continue", { tools: picked.length, overlaps_open: open.length });
    navigate(`${prefix}/ma-stack`);
  }

  const chip = (slug: string, removable = true) => (
    <span key={slug} className="pile-chip" data-pile-id={slug}>
      <ToolLogo tool={tool(slug) as ToolSummary} size={32} className="pile-chip-logo" />
      <span className="pile-chip-name">{name(slug)}</span>
      {removable && <button type="button" className="pile-chip-remove" aria-label={t(`Retirer ${name(slug)}`, `Remove ${name(slug)}`)}
        onClick={() => { setPicked(picked.filter((item) => item !== slug)); setMessage(t(`${name(slug)} retiré.`, `${name(slug)} removed.`)); }}><X aria-hidden /></button>}
    </span>
  );

  const count = picked.length;
  const status = count === 0
    ? t("Aucun outil choisi pour l’instant.", "No tool picked yet.")
    : `${t(`${count} outil${count > 1 ? "s" : ""}`, `${count} tool${count > 1 ? "s" : ""}`)} · ${open.length > 0
      ? t(`${open.length} doublon${open.length > 1 ? "s" : ""} à trancher`, `${open.length} overlap${open.length > 1 ? "s" : ""} to settle`)
      : t("aucun doublon", "no overlap")}`;

  return (
    <section className="pile-root" aria-labelledby="pile-title">
      <div className="v2-container pile-grid">
        <div className="pile-copy">
          <h2 id="pile-title" className="pile-title">{t("Qu’est-ce que vous payez deux fois ?", "What are you paying for twice?")}</h2>
          <p className="pile-lead">{t(
            "Touchez les outils que vous utilisez. Ceux qui font le même travail se retrouvent côte à côte : à vous de trancher.",
            "Tap the tools you use. The ones that do the same job end up side by side, and you decide.",
          )}</p>

          <div className="pile-tray" ref={trayRef}>
            <p className="pile-status"><ValueChange value={status}>{status}</ValueChange></p>
            {open.map((pair) => (
              <div key={pairKey(pair)} className="pile-pair">
                <div className="pile-pair-tools">
                  {chip(pair.a, false)}
                  <span className="pile-pair-swap" aria-hidden="true">⇄</span>
                  {chip(pair.b, false)}
                </div>
                <p className="pile-pair-why">{t("Alternatives l’un de l’autre au catalogue.", "Listed as alternatives to each other.")}</p>
                <div className="pile-pair-actions">
                  <button type="button" onClick={() => keepOne(pair, pair.a)}>{t(`Garder ${name(pair.a)}`, `Keep ${name(pair.a)}`)}</button>
                  <button type="button" onClick={() => keepOne(pair, pair.b)}>{t(`Garder ${name(pair.b)}`, `Keep ${name(pair.b)}`)}</button>
                  <button type="button" className="pile-pair-both" onClick={() => keepBoth(pair)}>{t("Les deux", "Both")}</button>
                </div>
              </div>
            ))}
            {(singles.length > 0 || pairs.length > open.length) && <div className="pile-chips">
              {singles.map((slug) => chip(slug))}
              {pairs.filter((pair) => keptBoth.includes(pairKey(pair))).flatMap((pair) => [chip(pair.a), chip(pair.b)])}
            </div>}
          </div>

          <div className="pile-actions">
            {count > 0
              ? <button type="button" className="pile-cta" onClick={proceed}>{t("Continuer dans Ma stack", "Continue in My stack")}<ArrowRight aria-hidden /></button>
              : <Link className="pile-cta pile-cta--quiet" to={`${prefix}/ma-stack`}>{t("Ou partir de zéro dans Ma stack", "Or start from scratch in My stack")}<ArrowRight aria-hidden /></Link>}
            {snapshot && <Link className="pile-resume" to={`${prefix}/ma-stack`}>{t(`Votre stack : ${snapshot.tools} outils, reprendre`, `Your stack: ${snapshot.tools} tools, resume`)}</Link>}
          </div>
          <p className="sr-only" aria-live="polite">{message}</p>
        </div>

        <div className="pile-stage" role="group" aria-label={t("La pile d’outils", "The pile of tools")}>
          {PILE.map((slug, index) => {
            const slot = HERO_CLUSTER_SLOTS[index];
            const on = picked.includes(slug);
            return (
              <button key={slug} type="button" className="pile-tile" aria-pressed={on}
                aria-label={on ? t(`${name(slug)}, choisi`, `${name(slug)}, picked`) : name(slug)}
                style={{
                  left: `${(slot.x / FRAME.w) * 100}%`, top: `${(slot.y / FRAME.h) * 100}%`,
                  width: `${(slot.s / FRAME.w) * 100}%`, "--r": `${slot.r}deg`, zIndex: on ? 1 : 10 - index,
                } as React.CSSProperties}
                onClick={(event) => toggle(slug, event.currentTarget)}>
                <ToolLogo tool={tool(slug) as ToolSummary} size={96} className="pile-tile-logo" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
