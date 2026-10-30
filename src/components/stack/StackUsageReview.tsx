import { useEffect, useLayoutEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import ToolLogo from "@/components/ToolLogo";
import { Activity, Moon, Rocket, Zap, CheckCircle2, ChevronLeft, ChevronRight, Clock, ListChecks } from "@/lib/icons";
import type { FitRow } from "./StackFindings";

const LEVELS = [
  { label: ["Usage faible", "Low use"], short: ["Peu", "Rarely"], icon: Moon, joke: ["Il fait surtout de la figuration.", "Mostly a cameo."] },
  { label: ["Usage occasionnel", "Occasional use"], short: ["Parfois", "At times"], icon: Clock, joke: ["Il passe faire coucou.", "Drops by to say hello."] },
  { label: ["Usage régulier", "Regular use"], short: ["Régulier", "Regular"], icon: Activity, joke: ["Un habitué de votre bureau.", "A regular at your desk."] },
  { label: ["Usage soutenu", "Frequent use"], short: ["Souvent", "Often"], icon: Zap, joke: ["Il a presque son propre bureau.", "It practically has its own desk."] },
  { label: ["Usage intensif", "Intensive use"], short: ["À fond", "A lot"], icon: Rocket, joke: ["Il connaît vos raccourcis par cœur.", "It knows your shortcuts by heart."] },
] as const;

type View = "question" | "summary" | "history";
/** At most this many tiles in the summary line-up; the rest open from a "+N" tile. */
const LINEUP = 7;

/** A five-step meter, the same shape as the question's, for one answer. */
function Mini({ value }: { value: number }) {
  return <span className="mu-mini" aria-hidden>{LEVELS.map((_, i) => <i key={i} data-on={i < value || undefined} />)}</span>;
}

/** One line read from the answers: who has the lead role, who is an extra. */
function castingLine(rows: FitRow[], t: (fr: string, en: string) => string) {
  const answered = rows.filter(row => !!row.usage);
  if (answered.length < 2) return null;
  const sorted = [...answered].sort((a, b) => (b.usage ?? 0) - (a.usage ?? 0));
  const lead = sorted[0], last = sorted[sorted.length - 1];
  if (lead.usage === last.usage) return t("Tout le monde bosse autant. Belle équipe.", "Everyone pulls the same weight. Nice crew.");
  return (last.usage ?? 0) <= 2
    ? t(`${lead.tool.name} tient le premier rôle, ${last.tool.name} fait de la figuration.`, `${lead.tool.name} has the lead, ${last.tool.name} is an extra.`)
    : t(`${lead.tool.name} tient le premier rôle, ${last.tool.name} le plus petit.`, `${lead.tool.name} has the lead, ${last.tool.name} the smallest part.`);
}
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
  const [hover, setHover] = useState<{ id: string; level: number } | null>(null);
  // Removing a tool cannot leave a stale answer handler pointing at it.
  const current = rows.find(row => row.tool.id === activeId) ?? pending ?? rows[0];
  const index = current ? rows.findIndex(row => row.tool.id === current.tool.id) : -1;
  const question = view === "question" && !!current;
  const selected = current?.usage ?? 0;
  const shown = hover && hover.id === current?.tool.id ? hover.level : selected > 0 ? selected - 1 : null;
  const level = shown === null ? null : LEVELS[shown];
  const next = review ? index + 1 : rows.findIndex((row, i) => i > index && !row.usage);
  const hasNext = next >= 0 && next < rows.length;
  const heading = useRef<HTMLHeadingElement>(null);
  const summaryHeading = useRef<HTMLHeadingElement>(null);
  const toolHeading = useRef<HTMLHeadingElement>(null);
  const focusRequested = useRef(false);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const questionHadFocus = useRef(false);
  const captionId = useId();
  const hadRows = useRef(rows.length > 0);

  useEffect(() => {
    if (!hadRows.current && rows.length > 0 && pending) {
      setActiveId(pending.tool.id); setView("question"); setReview(false); setHover(null);
    }
    hadRows.current = rows.length > 0;
  }, [rows.length, pending?.tool.id]);

  useLayoutEffect(() => {
    if (!focusRequested.current && !(questionHadFocus.current && document.activeElement === document.body)) return;
    (question ? toolHeading.current : view === "history" ? heading.current : summaryHeading.current)?.focus({ preventScroll: true });
    focusRequested.current = false;
  }, [view, current?.tool.id, question]);

  const scene = (nextView: View) => { focusRequested.current = true; setView(nextView); setHover(null); };
  const openTool = (target: number, reviewing: boolean) => {
    if (!rows[target]) return;
    focusRequested.current = true; setActiveId(rows[target].tool.id); setReview(reviewing); setView("question"); setHover(null);
  };
  const advance = () => hasNext ? openTool(next, review) : scene("summary");
  const preview = (level: number) => setHover(current ? { id: current.tool.id, level } : null);
  // Répondre fait avancer (Michael, 30/10/2026) : un clic de souris ou de
  // doigt enregistre, laisse lire la phrase, puis passe à l'outil suivant.
  // Au clavier, les flèches choisissent sans avancer ; le bouton du bout de
  // la bande fait avancer.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);
  const choose = (value: number, fromPointer = false) => {
    current?.setUsage(value + 1); preview(value);
    if (!fromPointer) return;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    advanceTimer.current = setTimeout(() => { advanceTimer.current = null; advance(); }, reduce ? 0 : 700);
  };
  const arrow = (event: KeyboardEvent<HTMLButtonElement>, from: number) => {
    let to: number;
    if (event.key === "Home") to = 0;
    else if (event.key === "End") to = 4;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") to = (from + 1) % 5;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") to = (from + 4) % 5;
    else return;
    event.preventDefault(); choose(to); radios.current[to]?.focus({ preventScroll: true });
  };

  return <article className="mf-card mf-fit mu-card tt-usage" data-open="" data-view={question ? "question" : view === "history" ? "history" : "summary"} aria-label={t("Vos usages et vos choix", "Your use and choices")}>
    <header className="tt-usage-head">
      <span className="tt-usage-where">
        <h2 ref={heading} tabIndex={-1} className="tt-eyebrow">{t(view === "history" || rows.length === 0 ? "Vos choix" : "Vos usages", view === "history" || rows.length === 0 ? "Your choices" : "Your use")}</h2>
      {rows.length > 0 && <span className="mu-count tt-steps" aria-label={question ? t(`Outil ${index + 1} sur ${rows.length}`, `Tool ${index + 1} of ${rows.length}`) : t(`${answered} usages renseignés sur ${rows.length}`, `Use recorded for ${answered} of ${rows.length}`)}>{question && rows.length <= 12 && <span className="tt-steps-track" aria-hidden>{rows.map((row, i) => <i key={row.tool.id} data-on={i <= index || undefined} />)}</span>}{question ? t(`${index + 1} sur ${rows.length}`, `${index + 1} of ${rows.length}`) : t(`${answered} sur ${rows.length}`, `${answered} of ${rows.length}`)}</span>}
      </span>
      {question && <span className="tt-usage-acts">
        <button type="button" className="tt-usage-back" disabled={index <= 0} aria-label={t("Outil précédent", "Previous tool")} onClick={() => openTool(index - 1, review)}><ChevronLeft size={16} aria-hidden /></button>
        <button type="button" className="tt-usage-later" onClick={() => scene("summary")}>{review ? t("Résumé", "Summary") : t("Faire une pause", "Take a break")}</button>
      </span>}
    </header>

    {question ? <div key={current.tool.id} className="mu-scene mu-question" onFocusCapture={() => { questionHadFocus.current = true; }} onBlurCapture={event => { if (event.target.isConnected && !event.currentTarget.contains(event.relatedTarget as Node)) questionHadFocus.current = false; }} role="group" aria-label={t(`Usage de ${current.tool.name}`, `Use of ${current.tool.name}`)}>
      <div className="tt-usage-tool"><ToolLogo tool={current.tool} size={48} className="tt-logo-tile" /><div className="tt-usage-tool-text"><h3 ref={toolHeading} tabIndex={-1} title={current.tool.name} className="tt-title-m">{current.tool.name}</h3><p className="tt-note">{format(current.cost)}{t("/mois", "/mo")} · {t("vous l’utilisez…", "you use it…")}</p></div></div>
      <div className="tt-usage-band">
      <div className="tt-scale" role="radiogroup" aria-label={t("Choisir un usage", "Choose use")} aria-describedby={captionId} data-preview={hover && hover.id === current.tool.id ? hover.level + 1 : undefined} onPointerLeave={() => setHover(null)}>
        {LEVELS.map((item, i) => <button key={i} ref={node => { radios.current[i] = node; }} type="button" role="radio" data-filled={i < selected || undefined} data-on={i < selected || undefined} data-lit={(shown !== null && i <= shown) || undefined} style={{ ["--h" as string]: [14, 32, 52, 74, 100][i], ["--i" as string]: i }} aria-label={`${t(item.short[0], item.short[1])} — ${t(item.label[0], item.label[1])}`} aria-checked={selected === i + 1}
          tabIndex={i === (selected > 0 ? selected - 1 : 0) ? 0 : -1}
          onPointerEnter={() => preview(i)} onFocus={() => preview(i)} onBlur={() => setHover(null)} onKeyDown={event => arrow(event, i)} onClick={event => choose(i, event.detail > 0)}>
          <span className="tt-scale-bar" aria-hidden /><span className="tt-scale-label" aria-hidden>{t(item.short[0], item.short[1])}</span>
        </button>)}
      </div>
      {/* Le bout de la bande : passer, ou avancer au clavier. La souris ne quitte pas la rangée. */}
      <button type="button" className="tt-usage-skip" aria-label={!selected ? t("Passer cet outil", "Skip this tool") : undefined} onClick={advance}><i aria-hidden="true" /><span>{!selected ? t("Passer", "Skip") : hasNext ? t("Suivant", "Next") : t("Terminer", "Finish")}</span></button>
      </div>
      <div className="tt-usage-feedback"><p className="tt-note" id={captionId}>{level ? <>{hover && hover.id === current.tool.id && hover.level !== selected - 1 && <span className="mu-preview">{t("Et là… ", "Preview: ")}</span>}<span>{t(level.joke[0], level.joke[1])}</span></> : <span>{t("Du figurant au copilote : à vous de caster.", "From cameo to co-pilot. You’re casting.")}</span>}</p></div>
    </div> : view === "history" ? <div className="mu-scene mu-history" role="region" aria-label={t("Historique des choix", "Choice history")} tabIndex={0}>
      {history || <p className="mu-copy">{t("Le carnet de choix attend sa première ligne.", "Your choice notebook is waiting for its first entry.")}</p>}
    </div> : <div className="mu-scene mu-summary">
      <div className="mu-summary-heading">{pending ? <Clock size={22} aria-hidden /> : <CheckCircle2 size={22} aria-hidden />}<h3 ref={summaryHeading} tabIndex={-1}>{rows.length === 0 ? freeOnly ? t("Votre stack, sans abonnement payant.", "Your stack has no paid plans.") : t("Personne à faire auditionner.", "No auditions today.") : pending ? t("On garde votre place.", "Your spot is saved.") : complete ? t("Casting au complet.", "That's the whole cast.") : t("Vos usages sont dans la boîte.", "Usage: that's a wrap.")}</h3></div>
      <p className="mu-copy">{rows.length === 0 ? t("Pas d’outil payant à évaluer. Vos choix restent accessibles.", "No paid tools to review. Your choices are still here.") : pending ? t(`${answered} sur ${rows.length} usages renseignés. La suite quand vous voulez.`, `Use recorded for ${answered} of ${rows.length}. Pick it up whenever you like.`) : castingLine(rows, t) ?? t("Tout est renseigné et reste modifiable.", "All filled in and still editable.")}</p>
      {rows.length > 0 && <ul className="mu-answer-list" aria-label={t("Résumé des usages", "Usage summary")}>
        {rows.slice(0, rows.length > LINEUP + 1 ? LINEUP : LINEUP + 1).map((row, target) => <li key={row.tool.id} style={{ ["--i" as string]: target }}><button type="button" onClick={() => openTool(target, true)} data-pending={!row.usage || undefined} aria-label={row.usage ? t(`Modifier l’usage de ${row.tool.name} : ${LEVELS[row.usage - 1].short[0]}`, `Edit use of ${row.tool.name}: ${LEVELS[row.usage - 1].short[1]}`) : t(`Renseigner l’usage de ${row.tool.name}`, `Record use of ${row.tool.name}`)}>
          <ToolLogo tool={row.tool} size={28} /><span className="mu-answer-text"><span className="mu-answer-name">{row.tool.name}</span><span className="mu-answer-value">{row.usage ? <><Mini value={row.usage} />{t(LEVELS[row.usage - 1].short[0], LEVELS[row.usage - 1].short[1])}</> : t("À renseigner", "Not set")}</span></span>
        </button></li>)}
        {rows.length > LINEUP + 1 && <li style={{ ["--i" as string]: LINEUP }}><button type="button" className="mu-answer-more" onClick={() => openTool(LINEUP, true)} aria-label={t(`Voir les ${rows.length - LINEUP} autres outils`, `See the other ${rows.length - LINEUP} tools`)}>+{rows.length - LINEUP}</button></li>}
      </ul>}
    </div>}

    <footer className="mu-footer">
      {question ? null : view === "history" ? <>
        <button type="button" className="mu-quiet" onClick={onReviewTools}>{t("Voir mes outils", "View my tools")}</button>
        <button type="button" className="mu-next" onClick={() => scene("summary")}><ChevronLeft size={16} aria-hidden />{t("Résumé", "Summary")}</button>
      </> : <>
        <div className="mu-secondary-actions">
          {rows.length > 0 && <button type="button" className="mu-quiet" onClick={onReviewTools}>{t("Voir mes outils", "View my tools")}</button>}
          {history && <button type="button" className="mu-quiet" onClick={() => scene("history")}>{rows.length ? t("Historique", "History") : t("Revoir mes choix", "Review my choices")}</button>}
        </div>
        {rows.length > 0 ? <button type="button" className={pending ? "mu-next" : "mu-next mu-skip"} onClick={() => openTool(pending ? rows.indexOf(pending) : 0, !pending)}>{pending ? t("Reprendre", "Resume") : t("Revoir mes usages", "Review my use")}<ChevronRight size={16} aria-hidden /></button>
          : <button type="button" className="mu-next" onClick={onReviewTools}>{t("Voir mes outils", "View my tools")}<ChevronRight size={16} aria-hidden /></button>}
      </>}
    </footer>
  </article>;
}
