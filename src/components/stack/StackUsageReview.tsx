import { useEffect, useRef, useState, type ReactNode } from "react";
import ToolLogo from "@/components/ToolLogo";
import { CheckCircle2, ListChecks } from "@/lib/icons";
import { Button } from "./StackKit";
import type { FitRow } from "./StackFindings";
const LEVELS = [
  ["Usage faible", "Low use"], ["Usage occasionnel", "Occasional use"],
  ["Usage régulier", "Regular use"], ["Usage soutenu", "Frequent use"], ["Usage intensif", "Intensive use"],
];
/** Declared use is evidence to revisit, never a verdict about product suitability. */
export default function StackUsageReview({ rows, lang, format, complete, history, onReviewTools }: {
  rows: FitRow[]; lang: "fr" | "en"; format: (n: number) => string; complete: boolean;
  history?: ReactNode; onReviewTools: () => void;
}) {
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  const [review, setReview] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const pending = rows.find(row => !row.usage);
  const hasUsage = rows.length > 0;
  const answered = rows.filter(row => row.usage).length;
  const heading = useRef<HTMLHeadingElement>(null);
  const previous = useRef(pending?.tool.id);
  const previousReview = useRef(review);
  const lastEdited = useRef<string | null>(null);
  const choiceFocus = useRef<HTMLButtonElement>(null);
  const editReturn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if ((previous.current && previous.current !== pending?.tool.id) || previousReview.current !== review) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView?.({ block: "nearest" });
    }
    previous.current = pending?.tool.id;
    previousReview.current = review;
  }, [pending?.tool.id, review]);
  useEffect(() => {
    if (editing) choiceFocus.current?.focus({ preventScroll: true });
    else if (lastEdited.current) editReturn.current?.focus({ preventScroll: true });
  }, [editing]);
  return <article className="mf-card mf-fit mu-card" data-open="" aria-label={t("Vos usages et vos choix", "Your use and choices")}>
    <p className="mu-kicker"><ListChecks size={18} aria-hidden />{t(complete || !hasUsage ? "Vos choix" : "Vos usages", complete || !hasUsage ? "Your choices" : "Your use")}</p>
    <h2 ref={heading} tabIndex={-1}>{pending ? t("Comment utilisez-vous cet outil ?", "How much do you use this tool?") : review ? t("Vos réponses restent à vous.", "Your answers, your call.") : complete ? t("Tout est renseigné.", "Everything is filled in.") : hasUsage ? t("Vos usages sont renseignés.", "Your use is recorded.") : t("Vos choix précédents.", "Your previous choices.")}</h2>
    {!pending && !review ? <>
      <p className="mu-copy">{complete
        ? t("Budget, doublons et usages : vous avez répondu aux questions disponibles. Revenez sur vos choix quand vos besoins changent.", "Budget, overlaps and use: you’ve answered the available questions. Revisit your choices as your needs change.")
        : hasUsage ? t("Vos réponses décrivent votre usage. Vous pouvez les modifier à tout moment.", "Your answers describe your use. You can change them at any time.") : t("Retrouvez les décisions déjà prises. Les questions restantes vous attendent à côté.", "Revisit your earlier decisions. The remaining questions are alongside.")}</p>
      <p className="mu-confirm"><CheckCircle2 size={18} aria-hidden />{t("Vos choix restent modifiables.", "Your choices stay editable.")}</p>
      <div className="mu-actions"><Button variant="primary" onClick={() => setReview(true)}>{t(complete || !hasUsage ? "Revoir mes choix" : "Revoir mes usages", complete || !hasUsage ? "Review my choices" : "Review my use")}</Button></div>
    </> : <>
      <p className="mu-copy">{pending
        ? t(`${answered} sur ${rows.length} usages renseignés pour vos outils payants. Choisissez la réponse qui vous ressemble.`, `Use recorded for ${answered} of ${rows.length} paid tools. Pick the answer that fits your use.`)
        : t("Un usage peut changer. Ajustez votre réponse sans perdre vos autres choix.", "Use can change. Update an answer without losing your other choices.")}</p>
      <ul className="mu-rows">{(pending ? [pending] : rows).map(row => <li key={row.tool.id} role="group" aria-label={t(`Usage de ${row.tool.name}`, `Use of ${row.tool.name}`)}>
        <div className="mu-tool"><ToolLogo tool={row.tool} size={36} /><div><h3>{row.tool.name}</h3><p>{format(row.cost)}{t("/mois", "/mo")}</p></div></div>
        {!row.usage || editing === row.tool.id ? <div className="mu-options" aria-label={t("Choisir un usage", "Choose use")}>
          {LEVELS.map(([fr,en],index) => <button key={index} type="button" ref={row.usage === index + 1 ? choiceFocus : undefined} aria-pressed={row.usage === index + 1} onClick={() => {row.setUsage(index + 1);setEditing(null);}}>{t(fr,en)}</button>)}
        </div> : <div className="mu-answer"><span>{t(...LEVELS[row.usage - 1] as [string,string])}</span><Button variant="secondary" ref={lastEdited.current === row.tool.id ? editReturn : undefined} onClick={() => {lastEdited.current = row.tool.id;setEditing(row.tool.id);}}>{t("Modifier l’usage", "Edit use")}</Button></div>}
      </li>)}</ul>
      {review && !pending && <>
        {rows.length === 0 && <p className="mu-copy">{t("Aucun abonnement payant à renseigner.", "No paid plans to record.")}</p>}
        {history && <div className="mu-history">{history}</div>}
        <p className="mu-copy">{t("Pour modifier une formule ou un tarif, ouvrez l’outil dans votre stack.", "To edit a plan or price, open the tool in your stack.")}</p>
        <div className="mu-actions"><Button variant="secondary" onClick={onReviewTools}>{t("Voir mes outils", "View my tools")}</Button><Button variant="secondary" onClick={() => {setReview(false);setEditing(null);}}>{t("Revenir au résumé", "Back to summary")}</Button></div>
      </>}
    </>}
  </article>;
}
