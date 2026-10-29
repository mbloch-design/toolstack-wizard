import { Button } from "@/components/ui/primitives";
import { useCallback, useMemo, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import StackStarter from "@/components/stack/StackStarter";
import ToolLogo from "@/components/ToolLogo";
import { ArrowRight, Check, CreditCard, Eye, HelpCircle, Scissors, ShieldCheck, Users } from "@/lib/icons";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { useStackPins } from "@/hooks/useStackPins";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import { toolKey } from "@/lib/stackView";

/**
 * Signed out (23/10/2026): a landing page whose hero is the product itself.
 * The visitor tries first and the account comes last, once there is something
 * of theirs to keep. Below the hero: the three frictions, each shown through a
 * piece of the product (illustrations, not data), three steps, three questions,
 * then a last call in colour carrying the visitor's own logos. No dark greys.
 * Nothing here is a figure ToolTrim cannot back.
 */
export default function StackWelcome() {
  const { t } = useLang();
  const account = useStackAccount();
  const experience = useAccountExperience();
  const { state } = useStackPins();
  const { tools } = useToolSummaries();
  const expired = account.syncStatus === "session-expired";
  const [picks, setPicks] = useState<string[]>([]);
  const follow = useCallback((slugs: string[]) => setPicks(slugs), []);
  const reveal = () => experience.openAuth(expired ? "signin" : "signup");
  const start = () => {
    document.getElementById("ss-pick")?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("ss-search")?.focus({ preventScroll: true });
  };
  const byKey = useMemo(() => new Map(tools.map((tool) => [toolKey(tool), tool])), [tools]);
  const logo = (slug: string) => byKey.get(slug);
  const mine = picks.map(logo).filter((tool): tool is ToolSummary => !!tool);
  const count = mine.length;
  // The Venn shows two well-known tools that share a job in the catalogue.
  const [left, right, zoom] = [logo("notion"), logo("trello"), logo("zoom")];

  return <div className="ms-page ms-welcome">
    <Breadcrumb items={[{ label: t("Ma stack", "My stack") }]} includeSchema={false} />
    <StackStarter mode="guest" initial={state.pinnedToolSlugs} expired={expired} busy={!account.authInitialized}
      onPicksChange={follow} onFinish={reveal}
      onSignIn={expired ? undefined : () => experience.openAuth("signin")} />

    {/* 1. The friction: each card shows a piece of the product at work (an illustration, not data). */}
    <section className="sl-band" aria-labelledby="sl-friction">
      <p className="sl-kicker">{t("Le problème", "The problem")}</p>
      <h2 id="sl-friction">{t("Une stack grossit toute seule.", "Stacks grow on their own.")}<span>{t(" Rarement l’inverse.", " Rarely the other way round.")}</span></h2>
      <ul className="sl-frictions">
        <li data-tone="accent">
          <div className="sl-art" aria-hidden="true">
            <div className="sl-faceoff">
              <span className="sl-fo-tile" data-win="">{left && <ToolLogo tool={left} size={36} />}<b>{left?.name}</b><i><Check size={11} strokeWidth={3} /></i></span>
              <span className="sl-fo-or">{t("ou", "or")}</span>
              <span className="sl-fo-tile">{right && <ToolLogo tool={right} size={36} />}<b>{right?.name}</b></span>
            </div>
          </div>
          <h3>{t("Les doublons.", "Duplicates.")}</h3>
          <p>{t("Deux outils, un seul travail.", "Two tools. One job.")}</p>
          <p className="sl-fix">{t("Face à face, vous tranchez.", "Face to face, you decide.")}</p>
        </li>
        <li data-tone="alert">
          <div className="sl-art" aria-hidden="true">
            <div className="sl-usage">
              <span className="sl-usage-tool">{zoom && <ToolLogo tool={zoom} size={28} />}<b>{zoom?.name}</b><em>{t("À peine", "Barely")}</em></span>
              <span className="sl-usage-pips">{[0, 1, 2, 3, 4].map((index) => <i key={index} style={{ animationDelay: `${(4 - index) * 140}ms` }} data-keep={index === 0 ? "" : undefined} />)}</span>
            </div>
          </div>
          <h3>{t("Les abonnements oubliés.", "Forgotten subscriptions.")}</h3>
          <p>{t("Renouvelés chaque mois. À peine ouverts.", "Renewed every month. Barely opened.")}</p>
          <p className="sl-fix">{t("Cinq niveaux d’usage pour le voir.", "Five levels of use make it obvious.")}</p>
        </li>
        <li data-tone="good">
          <div className="sl-art" aria-hidden="true">
            <div className="sl-seats">
              {["A", "M", "L", null, null].map((initial, index) => <span key={index} data-empty={initial ? undefined : ""} style={{ animationDelay: `${index * 90}ms` }}>{initial ?? <Users size={15} />}</span>)}
            </div>
          </div>
          <h3>{t("Les sièges vides.", "Empty seats.")}</h3>
          <p>{t("Payés pour personne.", "Paid for. Unused.")}</p>
          <p className="sl-fix">{t("Chaque siège, compté.", "Every seat, counted.")}</p>
        </li>
      </ul>
    </section>

    {/* 2. Three steps on a line: the rhythm of the product. */}
    <section className="sl-band" aria-labelledby="sl-how">
      <p className="sl-kicker">{t("Comment ça marche", "How it works")}</p>
      <h2 id="sl-how">{t("Trois étapes.", "Three steps.")}<span>{t(" Aucune surprise.", " No surprises.")}</span></h2>
      <ol className="sl-steps">
        {[
          { icon: Check, title: t("Choisissez.", "Pick."), text: t("Trente secondes, sans formulaire.", "Thirty seconds. No form.") },
          { icon: Eye, title: t("Lisez.", "Read."), text: t("Doublons, coûts, usage.", "Overlaps, costs, usage.") },
          { icon: Scissors, title: t("Décidez.", "Decide."), text: t("Rien ne change sans vous.", "Nothing changes without you.") },
        ].map(({ icon: Icon, title, text }, index) => <li key={title}>
          <span className="sl-step-n" aria-hidden="true"><Icon size={22} /><b>{index + 1}</b></span>
          <h3>{title}</h3><p>{text}</p>
        </li>)}
      </ol>
    </section>

    {/* 3. The questions people ask before an account, each with its picto. */}
    <section className="sl-band sl-band--soft" aria-labelledby="sl-faq">
      <p className="sl-kicker">{t("Questions fréquentes", "Questions")}</p>
      <h2 id="sl-faq">{t("Simple.", "Simple.")}<span>{t(" Et sans engagement.", " And no strings attached.")}</span></h2>
      <dl className="sl-faq">
        {[
          { icon: HelpCircle, q: t("Pourquoi un compte ?", "Why an account?"), a: t("Pour retrouver votre stack et vos décisions sur tous vos appareils.", "To find your stack and your decisions on every device.") },
          { icon: CreditCard, q: t("C’est payant ?", "Does it cost anything?"), a: t("Non. C’est gratuit, sans carte bancaire.", "No. It’s free, no card needed.") },
          { icon: ShieldCheck, q: t("Et mes données ?", "What about my data?"), a: t("Elles restent à vous. Supprimez-les quand vous voulez.", "They stay yours. Delete them whenever you like.") },
        ].map(({ icon: Icon, q, a }) => <div key={q}><span className="sl-faq-icon" aria-hidden="true"><Icon size={18} /></span><dt>{q}</dt><dd>{a}</dd></div>)}
      </dl>
    </section>

    {/* The last call carries the visitor's own logos: what they built is waiting. */}
    <section className="sl-final" aria-labelledby="sl-final-title">
      {count > 0 && <span className="sl-final-logos" aria-hidden="true">{mine.slice(0, 6).map((tool, index) => <span key={tool.id} style={{ animationDelay: `${index * 70}ms` }}><ToolLogo tool={tool} size={30} /></span>)}</span>}
      <h2 id="sl-final-title">{count > 1 ? t(`Vos ${count} outils vous attendent.`, `Your ${count} tools are waiting.`) : count === 1 ? t("Votre outil vous attend.", "Your tool is waiting.") : t("Prêt en trente secondes.", "Ready in thirty seconds.")}</h2>
      <Button appearance="stack-welcome-final" variant="secondary" type="button" className="sl-final-cta" disabled={count > 0 && !account.authInitialized} onClick={count > 0 ? reveal : start}>
        {count > 0 ? t("Voir mon diagnostic", "See my diagnosis") : t("Commencer", "Start")}<ArrowRight size={18} aria-hidden />
      </Button>
    </section>
  </div>;
}
