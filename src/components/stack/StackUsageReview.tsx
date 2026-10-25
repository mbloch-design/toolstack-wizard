import { useEffect, useLayoutEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import ToolLogo from "@/components/ToolLogo";
import { Activity, Moon, Rocket, Zap, CheckCircle2, ChevronLeft, ChevronRight, Clock, ListChecks } from "@/lib/icons";
import { Button } from "./StackKit";
import type { FitRow } from "./StackFindings";

const LEVELS = [
  { label: ["Usage faible", "Low use"], short: ["Faible", "Rarely"], icon: Moon, joke: ["Il fait surtout de la figuration.", "Mostly a cameo."] },
  { label: ["Usage occasionnel", "Occasional use"], short: ["Parfois", "At times"], icon: Clock, joke: ["Il passe faire coucou.", "Drops by to say hello."] },
  { label: ["Usage régulier", "Regular use"], short: ["Régulier", "Regular"], icon: Activity, joke: ["Un habitué de votre bureau.", "A regular at your desk."] },
  { label: ["Usage soutenu", "Frequent use"], short: ["Soutenu", "Often"], icon: Zap, joke: ["Il a presque son propre bureau.", "It practically has its own desk."] },
  { label: ["Usage intensif", "Intensive use"], short: ["Intensif", "A lot"], icon: Rocket, joke: ["Il connaît vos raccourcis par cœur.", "It knows your shortcuts by heart."] },
] as const;

type View = "question" | "summary" | "history";
/** A single tool occupies the original fixed-size scene; answers remain editable. */
export default function StackUsageReview({ rows, lang, format, complete, freeOnly = false, history, onReviewTools }: {
  rows: FitRow[]; lang: "fr" | "en"; format: (n: number) => string; complete: boolean; freeOnly?: boolean;
  history?: ReactNode; onReviewTools: () => void;
}) {
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  const pending = rows.find(row => !row.usage);
  const answered = rows.filter(row => !!row.usage).length;
  const [view, setView] = useState<View>(() => pending ? "question" : "summary");
  const [activeId, setActiveId] = useState<string | undefined>(() => pending?.tool.id ?? rows[0]?.tool.id);
  const [review, setReview] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  // Removing a tool cannot leave a stale answer handler pointing at it.
  const current = rows.find(row => row.tool.id === activeId) ?? pending ?? rows[0];
  const index = current ? rows.findIndex(row => row.tool.id === current.tool.id) : -1;
  const question = view === "question" && !!current;
  const selected = current?.usage ?? 0;
  const shown = hover ?? (selected > 0 ? selected - 1 : null);
  const level = shown === null ? null : LEVELS[shown];
  const next = review ? index + 1 : rows.findIndex((row, i) => i > index && !row.usage);
  const hasNext = next >= 0 && next < rows.length;
  const heading = useRef<HTMLHeadingElement>(null);
  const summaryHeading = useRef<HTMLHeadingElement>(null);
  const toolHeading = useRef<HTMLHeadingElement>(null);
  const focusRequested = useRef(false);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const captionId = useId();
  const hadRows = useRef(rows.length > 0);

  useEffect(() => {
    if (!hadRows.current && rows.length > 0 && pending) {
      setActiveId(pending.tool.id); setView("question"); setReview(false); setHover(null);
    }
    hadRows.current = rows.length > 0;
  }, [rows.length, pending?.tool.id]);

  useLayoutEffect(() => {
    if (!focusRequested.current) return;
    (question ? toolHeading.current : view === "history" ? heading.current : summaryHeading.current)?.focus({ preventScroll: true });
    focusRequested.current = false;
  }, [view, current?.tool.id, question]);

  const scene = (nextView: View) => { focusRequested.current = true; setView(nextView); setHover(null); };
  const openTool = (target: number, reviewing: boolean) => {
    if (!rows[target]) return;
    focusRequested.current = true; setActiveId(rows[target].tool.id); setReview(reviewing); setView("question"); setHover(null);
  };
  const advance = () => hasNext ? openTool(next, review) : scene("summary");
  const choose = (value: number) => { current?.setUsage(value + 1); setHover(value); };
  const arrow = (event: KeyboardEvent<HTMLButtonElement>, from: number) => {
    let to: number;
    if (event.key === "Home") to = 0;
    else if (event.key === "End") to = 4;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") to = (from + 1) % 5;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = (from + 4) % 5;
    else return;
    event.preventDefault(); choose(to); radios.current[to]?.focus({ preventScroll: true });
  };

  return <article className="mf-card mf-fit mu-card" data-open="" data-view={question ? "question" : view === "history" ? "history" : "summary"} aria-label={t("Vos usages et vos choix", "Your use and choices")}>
    <header className="mu-header">
      <h2 ref={heading} tabIndex={-1}>{!question && <ListChecks size={18} aria-hidden />}{question ? t("Son rythme chez vous ?", "How often do you use it?") : t(view === "history" || rows.length === 0 ? "Vos choix" : "Vos usages", view === "history" || rows.length === 0 ? "Your choices" : "Your use")}</h2>
      {rows.length > 0 && <span className="mu-count" aria-label={t(`${answered} usages renseignés sur ${rows.length}`, `Use recorded for ${answered} of ${rows.length}`)}>{answered} / {rows.length}</span>}
    </header>

    {question ? <div key={current.tool.id} className="mu-scene mu-question" role="group" aria-label={t(`Usage de ${current.tool.name}`, `Use of ${current.tool.name}`)}>
      <div className="mu-tool"><ToolLogo tool={current.tool} size={32} /><div className="mu-tool-label"><h3 ref={toolHeading} tabIndex={-1} title={current.tool.name}>{current.tool.name}</h3></div><p>{format(current.cost)}{t("/mois", "/mo")}</p></div>
      <div className="mu-gauge" role="radiogroup" aria-label={t("Choisir un usage", "Choose use")} aria-describedby={captionId} onPointerLeave={() => setHover(null)}>
        {LEVELS.map((item, i) => <button key={i} ref={node => { radios.current[i] = node; }} type="button" role="radio" aria-label={t(item.label[0], item.label[1])} aria-checked={selected === i + 1}
          tabIndex={i === (selected > 0 ? selected - 1 : 0) ? 0 : -1} data-lit={shown !== null && i <= shown ? "" : undefined}
          onPointerEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} onKeyDown={event => arrow(event, i)} onClick={() => choose(i)}>
          <span className="mu-option-icon" aria-hidden><item.icon size={22} /></span><small aria-hidden>{t(item.short[0], item.short[1])}</small>{selected === i + 1 && <CheckCircle2 size={11} className="mu-option-check" aria-hidden />}
        </button>)}
      </div>
      <p className="mu-caption" id={captionId}>{level ? <><strong>{t(level.short[0], level.short[1])}</strong><span> — {t(level.joke[0], level.joke[1])}</span></> : <span>{t("Du figurant au copilote : à vous de caster.", "From cameo to co-pilot. You’re casting.")}</span>}</p>
    </div> : view === "history" ? <div className="mu-scene mu-history" role="region" aria-label={t("Historique des choix", "Choice history")} tabIndex={0}>
      {history || <p className="mu-copy">{t("Le carnet de choix attend sa première ligne.", "Your choice notebook is waiting for its first entry.")}</p>}
    </div> : <div className="mu-scene mu-summary">
      {pending ? <Clock size={28} aria-hidden /> : <CheckCircle2 size={28} aria-hidden />}
      <h3 ref={summaryHeading} tabIndex={-1}>{rows.length === 0 ? freeOnly ? t("Votre stack, sans abonnement payant.", "Your stack has no paid plans.") : t("Personne à faire auditionner.", "No auditions today.") : pending ? t("On garde votre place.", "Your spot is saved.") : complete ? t("Casting au complet.", "That's the whole cast.") : t("Vos usages sont dans la boîte.", "Usage: that's a wrap.")}</h3>
      <p className="mu-copy">{rows.length === 0 ? t("Pas d’outil payant à évaluer. Vos choix restent accessibles.", "No paid tools to review. Your choices are still here.") : pending ? t(`${answered} sur ${rows.length} usages renseignés. La suite quand vous voulez.`, `Use recorded for ${answered} of ${rows.length}. Pick it up whenever you like.`) : complete ? t("Budget, doublons, usages : tout est renseigné et reste modifiable.", "Budget, overlaps, use: all filled in and still editable.") : t("Les autres questions vous attendent à côté. Vos réponses restent modifiables.", "The other questions are alongside. Your answers stay editable.")}</p>
    </div>}

    <footer className="mu-footer">
      {question ? <>
        {index > 0 && <button type="button" className="mu-nav" aria-label={t("Outil précédent", "Previous tool")} onClick={() => openTool(index - 1, review)}><ChevronLeft size={18} aria-hidden /></button>}
        <button type="button" className="mu-quiet" onClick={() => review || selected > 0 ? scene("summary") : advance()}>{review ? t("Résumé", "Summary") : selected > 0 ? t("Faire une pause", "Take a break") : t("Passer cet outil", "Skip this tool")}</button>
        <button type="button" className="mu-next" disabled={!selected} onClick={advance}>{hasNext ? t("Suivant", "Next") : t("Terminer", "Finish")}<ChevronRight size={16} aria-hidden /></button>
      </> : view === "history" ? <><Button variant="secondary" onClick={() => scene("summary")}>{t("Résumé", "Summary")}</Button><Button variant="secondary" onClick={onReviewTools}>{t("Voir mes outils", "View my tools")}</Button></> : <>
        {pending ? <Button variant="secondary" onClick={() => openTool(rows.indexOf(pending), false)}>{t("Reprendre", "Resume")}</Button> : rows.length > 0 ? <Button variant="secondary" onClick={() => openTool(0, true)}>{t("Revoir mes usages", "Review my use")}</Button> : history ? <Button variant="secondary" onClick={() => scene("history")}>{t("Revoir mes choix", "Review my choices")}</Button> : null}
        {history && rows.length > 0 && <Button variant="secondary" onClick={() => scene("history")}>{t("Historique", "History")}</Button>}
        <Button variant="secondary" onClick={onReviewTools}>{t("Voir mes outils", "View my tools")}</Button>
      </>}
    </footer>
  </article>;
}
