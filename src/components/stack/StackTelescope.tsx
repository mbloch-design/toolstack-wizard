import { useLayoutEffect, useMemo, useRef, useState } from "react";
import ToolLogo from "@/components/ToolLogo";
import type { ToolSummary } from "@/hooks/useSupabaseData";
import { ChevronLeft } from "@/lib/icons";
import { pack, type Bubble } from "@/components/stack/StackUsageExplorer";
import { AREA_COLORS, AreaCard, PriceKinds, type Territory } from "@/components/stack/StackAreaBoard";

/**
 * Vue « Par usage » de Ma stack, en télescope à deux niveaux.
 *
 * 1. Vue d'ensemble : une bulle par domaine, sa taille suit le nombre d'outils.
 *    C'est là que les bulles apportent quelque chose : le poids de chaque
 *    domaine se voit d'un coup d'œil.
 * 2. Un clic zoome sur le domaine, qui s'ouvre en carte lisible (usages,
 *    outils, prix, recoupements). Les bulles du deuxième niveau se lisaient
 *    mal : quelques bulles serrées, libellés qui débordent, outil caché
 *    derrière le nom de son usage.
 *
 * Disposition des bulles reprise de StackUsageExplorer (déterministe). Aucune
 * somme de prix : un prix catalogue n'est pas une dépense.
 */

interface Props {
  territories: Territory[];
  lang: "fr" | "en";
  selectedId?: string;
  onSelect: (slug: string) => void;
  overlaps?: Map<string, ToolSummary[]>;
}

export default function StackTelescope({ territories, lang, selectedId, onSelect, overlaps }: Props) {
  const en = lang === "en";
  const [openId, setOpenId] = useState<string | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const moving = useRef(false);
  const origin = useRef<{ x: number; y: number; scale: number }>({ x: 50, y: 50, scale: 3 });
  const pending = useRef<"in" | "out" | null>(null);

  const colorOf = (id: string) => AREA_COLORS[Math.max(0, territories.findIndex((t) => t.id === id)) % AREA_COLORS.length];
  const bubbles = useMemo(() => pack(territories.map((t): Bubble => ({ id: t.id, label: t.label, weight: t.tools.length, tools: t.tools })), false), [territories]);
  const open = territories.find((t) => t.id === openId) || null;
  const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function zoomTo(id: string | null) {
    if (moving.current) return;
    const bubble = id ? bubbles.find((b) => b.item.id === id) : null;
    if (bubble) origin.current = { x: bubble.left + bubble.diameter / 2, y: bubble.top + bubble.diameter / 2, scale: 100 / bubble.diameter };
    const leaving = id ? fieldRef.current : detailRef.current;
    if (leaving && !reduced()) {
      moving.current = true;
      const { x, y, scale } = origin.current;
      const frames = id
        ? [{ transform: "none", opacity: 1 }, { transform: `translate(${50 - x}%, ${50 - y}%) scale(${scale})`, opacity: 0 }]
        : [{ transform: "none", opacity: 1 }, { transform: "scale(.92)", opacity: 0 }];
      leaving.style.transformOrigin = id ? `${x}% ${y}%` : "50% 0%";
      const animation = leaving.animate(frames, { duration: 220, easing: "cubic-bezier(.3,0,.7,1)", fill: "forwards" });
      try { await animation.finished; } catch { /* interrupted */ }
      animation.cancel();
      moving.current = false;
    }
    pending.current = id ? "in" : "out";
    setOpenId(id);
  }

  // Entrance of the new level: the area grows out of its bubble, or the
  // bubbles come back from the area that was open.
  useLayoutEffect(() => {
    const direction = pending.current;
    pending.current = null;
    if (!direction || reduced()) return;
    const target = direction === "in" ? detailRef.current : fieldRef.current;
    if (!target) return;
    const { x, y, scale } = origin.current;
    target.style.transformOrigin = direction === "in" ? "50% 0%" : `${x}% ${y}%`;
    target.animate(direction === "in"
      ? [{ transform: "scale(.9) translateY(12px)", opacity: 0 }, { transform: "none", opacity: 1 }]
      : [{ transform: `translate(${50 - x}%, ${50 - y}%) scale(${scale})`, opacity: 0 }, { transform: "none", opacity: 1 }],
    { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
  }, [openId]);

  return (
    <section className="ms-telescope" aria-label={en ? "My tools by use" : "Mes outils par usage"}>
      <PriceKinds tools={territories.flatMap((t) => t.tools)} lang={lang} />
      <div className="ms-telescope-stage">
        <header className="ms-telescope-head">
          {open ? (
            <button type="button" className="ms-telescope-backlink" onClick={() => zoomTo(null)}>
              <ChevronLeft size={16} aria-hidden />{en ? "All uses" : "Tous les usages"}
            </button>
          ) : (
            <p className="ms-telescope-hint">{en ? "Bubble size: number of tools. Click an area to open it." : "Taille des bulles : nombre d’outils. Cliquez sur un domaine pour l’ouvrir."}</p>
          )}
        </header>
        {open ? (
          <div ref={detailRef} className="ms-telescope-detail">
            <AreaCard territory={open} color={colorOf(open.id)} lang={lang} selectedId={selectedId} onSelect={onSelect} overlaps={overlaps} />
          </div>
        ) : (
          <div className="ms-telescope-canvas">
            <div ref={fieldRef} className="ms-telescope-field">
              {bubbles.map((b, index) => (
                <button
                  key={b.item.id}
                  type="button"
                  className="ms-telescope-bubble"
                  style={{ left: `${b.left}%`, top: `${b.top}%`, width: `${b.diameter}%`, height: `${b.diameter}%`, ["--bubble-color" as string]: colorOf(b.item.id), ["--bubble-delay" as string]: `${index * 50}ms` }}
                  aria-label={`${b.item.label}, ${b.item.weight} ${en ? (b.item.weight === 1 ? "tool" : "tools") : (b.item.weight === 1 ? "outil" : "outils")}`}
                  onClick={() => zoomTo(b.item.id)}
                >
                  <span className="ms-telescope-logos" aria-hidden="true">{b.item.tools?.slice(0, 3).map((tool) => <ToolLogo key={tool.id} tool={tool} size={30} />)}</span>
                  <strong>{b.item.label}</strong>
                  <span className="ms-telescope-count">{en ? `${b.item.weight} ${b.item.weight === 1 ? "tool" : "tools"}` : `${b.item.weight} outil${b.item.weight > 1 ? "s" : ""}`}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
