import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import Logo from "../Logo/Logo";
import type { LogoTool } from "@/lib/useToolLogoSource";
import Button, { TextButton } from "../Button/Button";
import Amount from "../Amount/Amount";
import Chip from "../Chip/Chip";
import styles from "./UsagePlay.module.css";

/** One paid tool of the stack: what it costs, the answer so far (5, 3 or 1), and how to record one. */
export type UsageRow = { tool: LogoTool & { id: string }; cost: number; usage?: number; setUsage: (value: number | null) => void };

/**
 * « Vos usages », une partie de cartes (validée le 31/10/2026, reconstruite dans src/ds le 09/11/2026).
 * Une question à la fois, toujours l'usage : la carte du dessus, trois réponses, la carte file
 * vers sa pile ; un logo d'une pile se touche pour rejouer la carte. À la fin, le tableau des
 * scores. Les réponses s'enregistrent sur l'échelle historique à cinq niveaux (5, 3, 1) ; les
 * réponses déjà données se relisent (4-5, 2-3, 1).
 */
type Pick = "daily" | "sometimes" | "cut";
const PICKS: { id: Pick; level: number; label: [string, string]; key: string; pile: [string, string]; joke: [string, string] }[] = [
  { id: "daily", level: 5, label: ["Tous les jours", "Every day"], key: "←", pile: ["Au quotidien", "Daily"], joke: ["Il connaît vos raccourcis par cœur.", "It knows your shortcuts by heart."] },
  { id: "sometimes", level: 3, label: ["Parfois", "Sometimes"], key: "↓", pile: ["De passage", "Now and then"], joke: ["Il passe faire coucou.", "Drops by to say hello."] },
  { id: "cut", level: 1, label: ["Prend la poussière", "Gathers dust"], key: "→", pile: ["La poussière", "Dust"], joke: ["Il fait surtout de la figuration.", "Mostly a cameo."] },
];
const pickOf = (usage?: number): Pick | null => !usage ? null : usage >= 4 ? "daily" : usage >= 2 ? "sometimes" : "cut";
const KEYS: Record<string, Pick> = { ArrowLeft: "daily", ArrowDown: "sometimes", ArrowRight: "cut" };

export default function UsagePlay({ rows, lang, format, freeOnly = false, history, onReviewTools, localLogosOnly = false, dense = false }: {
  /** Inside an opened bento tile: the game on the left, the piles on the right. */
  dense?: boolean;
  rows: UsageRow[]; lang: "fr" | "en"; format: (n: number) => string; freeOnly?: boolean; history?: ReactNode; onReviewTools: () => void;
  /** Logos load from our own files only (Storybook, tests). */
  localLogosOnly?: boolean;
}) {
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  const tr = (pair: [string, string]) => lang === "fr" ? pair[0] : pair[1];
  // The deck: the most expensive first; answered cards sit in their pile.
  const deck = [...rows].sort((a, b) => b.cost - a.cost);
  const queue = deck.filter((row) => !row.usage);
  const [undo, setUndo] = useState<string[]>([]);
  const [say, setSay] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [flying, setFlying] = useState<Pick | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [bump, setBump] = useState<Pick | null>(null);
  const [score, setScore] = useState(0);
  const timer = useRef(0);
  const drag = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const done = rows.length > 0 && queue.length === 0;
  const dust = deck.filter((row) => pickOf(row.usage) === "cut");
  const dustTotal = dust.reduce((sum, row) => sum + row.cost, 0);
  const reduced = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // The score counts up when the game ends.
  useEffect(() => {
    if (!done) { setScore(0); return; }
    if (reduced || dustTotal === 0) { setScore(dustTotal); return; }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => { const k = Math.min(1, (now - start) / 700); setScore(dustTotal * (1 - Math.pow(1 - k, 3))); if (k < 1) frame = requestAnimationFrame(step); };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [done, dustTotal, reduced]);

  const answer = (pick: Pick) => {
    const row = queue[0];
    if (!row || paused || flying) return;
    const choice = PICKS.find((p) => p.id === pick)!;
    setSay(tr(choice.joke));
    const commit = () => { row.setUsage(choice.level); setUndo((list) => [...list, row.tool.id]); setFlying(null); setBump(pick); window.setTimeout(() => setBump(null), 420); };
    if (reduced) { commit(); return; }
    setFlying(pick);
    timer.current = window.setTimeout(commit, 300);
  };
  const replay = (row: UsageRow) => {
    row.setUsage(null);
    setUndo((list) => list.filter((id) => id !== row.tool.id));
    setSay(t(`On rejoue ${row.tool.name}.`, `Replaying ${row.tool.name}.`));
  };
  const replayAll = () => { rows.forEach((row) => row.setUsage(null)); setUndo([]); setSay(t("Nouvelle partie. Les mêmes acteurs, un nouveau casting.", "New game. Same cast, new casting.")); };
  const onKey = (event: KeyboardEvent<HTMLElement>) => { const pick = KEYS[event.key]; if (pick && !done) { event.preventDefault(); answer(pick); } };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => { drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.dataset.drag = ""; };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => { if (!drag.current) return; const dx = event.clientX - drag.current.x, dy = Math.max(0, event.clientY - drag.current.y); event.currentTarget.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)`; };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
    drag.current = null; delete event.currentTarget.dataset.drag; event.currentTarget.style.transform = "";
    if (dx < -70) answer("daily"); else if (dx > 70) answer("cut"); else if (dy > 70) answer("sometimes");
  };

  if (rows.length === 0) return <article className={styles.play} data-card="usage" aria-label={t("Vos usages", "Your use")}>
    <div className={styles.head}><h2 className={styles.eyebrow}>{t("Vos usages", "Your use")}</h2></div>
    <p className={styles.titleM}>{freeOnly ? t("Votre stack, sans abonnement payant.", "Your stack has no paid plans.") : t("Personne à faire auditionner.", "No auditions today.")}</p>
    <p className={styles.text}>{t("Pas d’outil payant à évaluer.", "No paid tools to review.")}</p>
    {history && <div className={styles.history}>{history}</div>}
  </article>;

  const left = queue.length;
  const quip = dust.length === 1 ? t("Un figurant payé à ne rien faire.", "One extra paid to do nothing.")
    : dust.length === 2 ? t("Deux figurants payés à ne rien faire.", "Two extras paid to do nothing.")
    : t(`${dust.length} figurants payés à ne rien faire. Le tournage coûte cher.`, `${dust.length} extras paid to do nothing. Expensive shoot.`);

  return <article className={styles.play} data-card="usage" data-done={done ? "" : undefined} data-paused={paused ? "" : undefined} data-dense={dense || undefined} aria-label={t("Vos usages", "Your use")} onKeyDown={onKey}>
    <div className={styles.head}>
      <h2 className={styles.eyebrow}>{t("Vos usages", "Your use")}</h2>
      <span className={styles.note}>{done ? t("Partie terminée", "Game over") : t(`Il reste ${left} carte${left > 1 ? "s" : ""}`, `${left} card${left > 1 ? "s" : ""} left`)}</span>
      {!done && <TextButton onClick={() => { setPaused((value) => !value); setSay(paused ? t("On reprend la partie.", "Back to the game.") : t("Partie en pause, vos cartes sont gardées. Reprenez quand vous voulez.", "Game paused, your cards are kept. Pick it up whenever you like.")); }}>{paused ? t("Reprendre", "Resume") : t("Plus tard", "Later")}</TextButton>}
    </div>

    {showHistory && history ? <div className={styles.history}>{history}<TextButton onClick={() => setShowHistory(false)}>{t("Retour à la partie", "Back to the game")}</TextButton></div> : <div className={styles.stage}>
      {!done && <>
        <div className={styles.table}>
          <div className={styles.deck} aria-live="polite">
            {queue.slice(0, 3).map((row, depth) => ({ row, depth })).reverse().map(({ row, depth }) =>
              <div key={row.tool.id} className={styles.card} data-depth={depth} data-fly={depth === 0 && flying ? flying : undefined}
                {...(depth === 0 ? { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } : {})}>
                <Logo tool={row.tool} size={40} localOnly={localLogosOnly} />
                <span className={styles.cardText}><span className={styles.titleM}>{t(`${row.tool.name}, vous vous en servez…`, `${row.tool.name}, how often do you use it…`)}</span><span className={styles.note}>{t(`${format(row.cost)} par mois`, `${format(row.cost)} a month`)}</span></span>
              </div>)}
          </div>
        </div>
        <div className={styles.picks} role="group" aria-label={t("Votre réponse", "Your answer")}>
          {PICKS.map((pick) => <Chip key={pick.id} size="md" tone={pick.id === "cut" ? "cut" : "ink"} data-pick={pick.id} disabled={paused} onClick={() => answer(pick.id)}>
            {pick.id !== "cut" && <kbd aria-hidden="true">{pick.key}</kbd>}{tr(pick.label)}{pick.id === "cut" && <kbd aria-hidden="true">{pick.key}</kbd>}
          </Chip>)}
        </div>
        <div className={styles.reply}><p className={styles.note} aria-live="polite">{say ?? t("Du figurant au copilote : à vous de distribuer les rôles.", "From cameo to co-pilot: you’re casting.")}</p>
          {undo.length > 0 && <TextButton onClick={() => { const row = deck.find((r) => r.tool.id === undo[undo.length - 1]); if (row) replay(row); }}>{t("Annuler", "Undo")}</TextButton>}</div>
      </>}
      {done && <div className={styles.end}>
        <span className={styles.eyebrow}>{t("Casting au complet", "Full cast")}</span>
        {dust.length > 0 ? <>
          <p className={styles.score}><Amount size="figure" tone="overlap" value={format(Math.round(score))} unit={t("/mois", "/mo")} /></p>
          <p className={styles.text}>{t("prennent la poussière chez ", "gathering dust with ")}{dust.map((row, i) => <span key={row.tool.id}>{i > 0 && (i === dust.length - 1 ? t(" et ", " and ") : ", ")}<b className={styles.strong}>{row.tool.name}</b></span>)}{t(`, soit ${format(dustTotal * 12)} par an.`, `, that is ${format(dustTotal * 12)} a year.`)}</p>
          <p className={styles.note}>{quip}</p>
        </> : <>
          <p className={styles.titleM}>{t("Toute la troupe joue.", "The whole cast is working.")}</p>
          <p className={styles.text}>{t("Rien ne prend la poussière : chaque abonnement mérite son cachet.", "Nothing gathers dust: every subscription earns its fee.")}</p>
        </>}
        <div className={styles.endActs}>
          <Button variant="primary" onClick={onReviewTools}>{t("Voir ce que ça change", "See what it changes")}</Button>
          <TextButton onClick={replayAll}>{t("Rejouer", "Play again")}</TextButton>
          {history && <TextButton onClick={() => setShowHistory(true)}>{t("Mes choix", "My choices")}</TextButton>}
        </div>
      </div>}
    </div>}

    <div className={styles.piles}>
      {PICKS.map((pick) => { const pile = deck.filter((row) => pickOf(row.usage) === pick.id);
        return <section key={pick.id} className={styles.pile} data-pile={pick.id} data-bump={bump === pick.id ? "" : undefined} aria-label={tr(pick.pile)}>
          <span className={styles.pileHead}><span>{tr(pick.pile)}</span><b>{pile.length}</b></span>
          <ul>{pile.map((row) => <li key={row.tool.id}><button type="button" aria-label={t(`Rejouer la carte ${row.tool.name}`, `Replay the ${row.tool.name} card`)} title={row.tool.name} onClick={() => replay(row)}><Logo tool={row.tool} size={24} localOnly={localLogosOnly} /></button></li>)}</ul>
        </section>; })}
    </div>
  </article>;
}
