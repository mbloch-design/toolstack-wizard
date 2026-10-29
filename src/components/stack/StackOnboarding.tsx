import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import StackStarter, { readStarterDraft, useStackReading } from "@/components/stack/StackStarter";
import ToolLogo from "@/components/ToolLogo";
import { ArrowLeft, ArrowRight, Briefcase, Check, Code2, Minus, Palette, Plus, Rocket, Video, Workflow, type IconComponent } from "@/lib/icons";
import { useCurrency } from "@/hooks/useCurrency";
import { convertAmount, formatAmount } from "@/lib/currencyRates";
import type { DailyRate } from "@/lib/personalStack";
import { useLang } from "@/hooks/useLang";
import { useStackAccount } from "@/hooks/useStackAccount";
import { firstNameOf } from "@/components/stack/StackPersonalWelcome";
import { useAccountExperience } from "@/components/account/AccountExperienceProvider";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";
import { TRADE_TOOLS } from "@/data/tradeTools";
import type { StackPersona } from "@/data/stacks";
import { toolKey } from "@/lib/stackView";
import { playHello } from "@/components/stack/helloMotion";
import { useStackTrade } from "@/hooks/useStackTrade";

/**
 * Signed in with an empty stack (23/10/2026): the person arrives in their own
 * space and sets it up in four short steps, like a device setup assistant.
 * A hello in a few languages that lands on their name (asked once when the
 * account has none: the only free field, because it is the only thing we do
 * not know), their trade with a wink, the tools that fit that trade (from
 * ToolTrim's curated stacks, never invented), then a small celebration with a
 * first reading. Nothing is pinned until "Open my space", so going back is free.
 */
type Step = "hello" | "trade" | "rate" | "tools" | "ready";
const STEPS: Step[] = ["trade", "rate", "tools", "ready"];
/** Daily rates offered as one tap; the stepper covers everything else. */
const RATES = [200, 300, 400, 500, 600, 700, 800, 1000];
/** A working day, stated on screen wherever the hourly value is shown. */
const HOURS_PER_DAY = 7;
const HELLOS = ["Hello", "Hola", "Ciao", "Hallo", "Olá"];
const TRADES: Array<{ id: StackPersona; icon: IconComponent; fr: string; en: string; peopleFr: string; peopleEn: string; quipFr: string; quipEn: string }> = [
  { id: "dev", icon: Code2, fr: "Développement", en: "Development", peopleFr: "développeurs", peopleEn: "developers", quipFr: "Plus d’onglets ouverts que d’outils payés ? Vérifions.", quipEn: "More open tabs than paid tools? Let’s check." },
  { id: "designer", icon: Palette, fr: "Design", en: "Design", peopleFr: "designers", peopleEn: "designers", quipFr: "Adobe, Figma, Canva… On ne juge pas. Enfin, un peu.", quipEn: "Adobe, Figma, Canva… No judgement. Well, a little." },
  { id: "consultant", icon: Briefcase, fr: "Conseil", en: "Consulting", peopleFr: "consultants", peopleEn: "consultants", quipFr: "Un tableur pour tout ? On a des solutions. Et des tableurs.", quipEn: "A spreadsheet for everything? We have answers. And spreadsheets." },
  { id: "content", icon: Video, fr: "Création de contenu", en: "Content creation", peopleFr: "créateurs de contenu", peopleEn: "content creators", quipFr: "Tourner, monter, publier. Et payer chaque étape.", quipEn: "Shoot, edit, publish. And pay for every step." },
  { id: "ops", icon: Workflow, fr: "Opérations", en: "Operations", peopleFr: "responsables des opérations", peopleEn: "operations leads", quipFr: "Vous savez où est tout. Même les abonnements ?", quipEn: "You know where everything is. Even the subscriptions?" },
  { id: "solo", icon: Rocket, fr: "Un peu de tout", en: "A bit of everything", peopleFr: "indépendants touche-à-tout", peopleEn: "all-round freelancers", quipFr: "Une casquette par métier. Et un abonnement par casquette.", quipEn: "One hat per job. And one subscription per hat." },
];
const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Counts up to a figure once, for the satisfaction of seeing it land. */
function useCountUp(target: number, run: boolean) {
  const [value, setValue] = useState(run && !reduced() ? 0 : target);
  useEffect(() => {
    if (!run || reduced()) { setValue(target); return; }
    let frame = 0; const start = performance.now();
    const tick = (now: number) => { const p = Math.min(1, (now - start) / 900); setValue(target * (1 - Math.pow(1 - p, 3))); if (p < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, run]);
  return value;
}

export default function StackOnboarding({ onOpen }: { onOpen: (slugs: string[], welcome: string) => void }) {
  const { t, lang } = useLang();
  const { currency } = useCurrency();
  const account = useStackAccount();
  const experience = useAccountExperience();
  const { tools } = useToolSummaries();
  const [handed] = useState(() => readStarterDraft());
  const [step, setStep] = useState<Step>("hello");
  // A trade chosen before (another device, an earlier visit) is already selected.
  const saved = useStackTrade();
  const [trade, setTrade] = useState<StackPersona | null>(saved.trade);
  // Shown in the site currency; a rate saved in another currency is converted for display.
  const [rate, setRate] = useState<number | null>(() => saved.dailyRate ? Math.round(convertAmount(saved.dailyRate.amount, saved.dailyRate.currency, currency)) : null);
  const [picks, setPicks] = useState<string[]>(handed);
  const [typed, setTyped] = useState("");
  const [given, setGiven] = useState<string | null>(null);
  const byKey = useMemo(() => new Map(tools.map((tool) => [toolKey(tool), tool])), [tools]);
  const known = (slugs: string[]) => slugs.map((slug) => byKey.get(slug)).filter((tool): tool is ToolSummary => !!tool);
  const picked = known(picks);
  const reading = useStackReading(picked);

  // Only the name chosen on the account; a provider handle or an address is never used as a name.
  const profile = experience.profile?.userId === account.user?.id ? experience.profile : null;
  const fromAccount = firstNameOf(profile?.displayName);
  const name = given || fromAccount;
  const hour = new Date().getHours();
  const greeting = lang === "en" ? (hour < 12 && hour >= 5 ? "Good morning" : hour < 18 && hour >= 5 ? "Good afternoon" : "Good evening") : (hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour");

  // The hello melts through a few languages (CSS only) and lands on the person's own; the rest follows.
  // The rest follows while the greeting is still settling, so the screen never sits idle.
  const [landed, setLanded] = useState(() => reduced());
  const nameField = useRef<HTMLInputElement>(null);
  const helloRef = useRef<HTMLSpanElement>(null);
  const landedOnce = useRef(landed);
  // Played once, before the first paint so the greeting never flashes; coming back to this step shows it settled.
  useLayoutEffect(() => {
    if (step !== "hello" || !helloRef.current || landedOnce.current) return;
    landedOnce.current = true;
    return playHello(helloRef.current, () => setLanded(true));
  }, [step]);
  useEffect(() => { if (landed && step === "hello") nameField.current?.focus({ preventScroll: true }); }, [landed, step]);

  const current = TRADES.find((item) => item.id === trade);
  const index = STEPS.indexOf(step);
  const s = (n: number) => (n > 1 ? "s" : "");
  const tally = useCountUp(picked.length, step === "ready");
  const cost = useCountUp(reading.known, step === "ready");
  const doubles = useCountUp(reading.pairs.length, step === "ready");

  const begin = () => {
    const clean = typed.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!fromAccount && clean) { setGiven(firstNameOf(clean) ?? clean.split(" ")[0]); void experience.saveDisplayName?.(clean); }
    setStep("trade");
  };
  const progress = index >= 0 && <div className="so-progress" aria-label={t(`Étape ${index + 1} sur ${STEPS.length}`, `Step ${index + 1} of ${STEPS.length}`)}>
    <button type="button" className="so-back" onClick={() => setStep(index === 0 ? "hello" : STEPS[index - 1])}><ArrowLeft size={16} aria-hidden />{t("Retour", "Back")}</button>
    <span className="so-bars" aria-hidden="true">{STEPS.map((item, at) => <i key={item} data-on={at <= index ? "" : undefined} />)}</span>
  </div>;

  const fmt = (amount: number) => formatAmount(Math.round(amount), currency, lang);
  const hourly = rate ? rate / HOURS_PER_DAY : null;
  const nudge = (delta: number) => setRate((value) => Math.min(100000, Math.max(50, Math.round(((value ?? 400) + delta) / 25) * 25)));
  const keepRate = (value: number | null) => saved.setDailyRate(value ? { amount: value, currency } satisfies DailyRate : null);

  const verdict = reading.pairs.length > 1
    ? t(`${reading.pairs.length} paires à départager. Certains vont devoir se justifier.`, `${reading.pairs.length} pairs to settle. Some tools have explaining to do.`)
    : reading.pairs.length === 1 ? t("Une paire à départager. L’un des deux a du souci à se faire.", "One pair to settle. One of them should be worried.")
    : t("Zéro doublon. C’est rare, et ça se fête.", "Zero overlaps. That’s rare, and worth a little party.");

  return <section className="so" data-step={step} aria-labelledby="ss-title">
    {step === "hello" && <div className="so-hello" key="hello">
      {handed.length > 0 && <span className="so-cluster" aria-hidden="true">{known(handed).slice(0, 5).map((tool, at) => <span key={tool.id} style={{ animationDelay: `${120 + at * 80}ms` }}><ToolLogo tool={tool} size={34} /></span>)}</span>}
      <h1 id="ss-title">
        <span className="sr-only">{name ? `${greeting}, ${name}.` : `${greeting}.`}</span>
        <span className="so-greet" aria-hidden="true" ref={helloRef}>
          <span className="so-hello-line">
            {HELLOS.map((word) => <span key={word} className="so-hw">{[...word].map((letter, at) => <i key={at}>{letter}</i>)}</span>)}
            <span className="so-hello-final">
              {greeting.split(" ").map((word, at, all) => <span key={at}>{word}{at === all.length - 1 ? (name ? "," : ".") : ""}</span>)}
              <span className="so-wave">👋</span>
              {name && <><span><em>{name}<i /></em></span><span className="so-dot">.</span></>}
            </span>
          </span>
        </span>
      </h1>
      <div className="so-hello-rest" data-on={landed ? "" : undefined}>
        <p className="so-lead">{handed.length > 0
          ? t(`Bienvenue chez vous. Vos ${handed.length} outil${s(handed.length)} ${handed.length > 1 ? "ont" : "a"} déjà pris place. Deux questions, et l’espace est à votre image.`, `Welcome home. Your ${handed.length} tool${handed.length > 1 ? "s have" : " has"} already moved in. Two questions, and this space is yours.`)
          : t("Bienvenue chez vous. Deux questions, et l’espace est à votre image. Promis, pas de formulaire de 12 pages.", "Welcome home. Two questions, and this space is yours. No 12-page form, promise.")}</p>
        {!fromAccount && <label className="so-name">
          <span>{t("Comment doit-on vous appeler ?", "What should we call you?")}</span>
          <input ref={nameField} type="text" value={typed} maxLength={40} autoComplete="given-name" placeholder={t("Votre prénom", "Your first name")} onChange={(event) => setTyped(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") begin(); }} />
        </label>}
        <button type="button" className="so-primary" onClick={begin}>{t("C’est parti", "Let’s go")}<ArrowRight size={18} aria-hidden /></button>
      </div>
    </div>}

    {step === "trade" && <div className="so-step" key="trade">
      {progress}
      <h1 id="ss-title">{name ? t(`Que faites-vous, ${name} ?`, `What do you do, ${name}?`) : t("Que faites-vous ?", "What do you do?")}</h1>
      <p className="so-lead">{t("Vos outils de métier passeront en premier. Les autres attendront leur tour, sans rancune.", "The tools of your trade go first. The rest can wait their turn, no hard feelings.")}</p>
      <ul className="so-trades">{TRADES.map((item, at) => { const Icon = item.icon; return <li key={item.id} style={{ animationDelay: `${at * 50}ms` }}>
        <button type="button" aria-pressed={trade === item.id} onClick={() => { setTrade(item.id); setStep("rate"); }}>
          <span className="so-trade-icon" aria-hidden="true"><Icon size={22} /></span>
          <b>{t(item.fr, item.en)}</b>
          <span className="so-trade-logos" aria-hidden="true">{known(TRADE_TOOLS[item.id]).slice(0, 3).map((tool) => <ToolLogo key={tool.id} tool={tool} size={20} />)}</span>
        </button>
      </li>; })}</ul>
    </div>}

    {step === "rate" && <div className="so-step" key="rate">
      {progress}
      <h1 id="ss-title">{name ? t(`Et votre tarif journalier, ${name} ?`, `And your day rate, ${name}?`) : t("Et votre tarif journalier ?", "And your day rate?")}</h1>
      <p className="so-lead">{t("Promis, ça reste entre nous. Il sert à chiffrer ce que vos outils vous font gagner. Ou perdre.", "Promise, it stays between us. It prices what your tools save you. Or cost you.")}</p>
      <div className="so-rate">
        <div className="so-rate-dial">
          <button type="button" className="so-rate-step" onClick={() => nudge(-25)} aria-label={t("Baisser de 25", "Lower by 25")}><Minus size={20} aria-hidden /></button>
          <output className="so-rate-value" aria-live="off" key={rate ?? "none"}>{rate ? <>{fmt(rate)}<small>{t("/jour", "/day")}</small></> : <span className="so-rate-empty">{t("Choisissez", "Pick one")}</span>}</output>
          <button type="button" className="so-rate-step" onClick={() => nudge(25)} aria-label={t("Augmenter de 25", "Raise by 25")}><Plus size={20} aria-hidden /></button>
        </div>
        <div className="so-rate-chips" role="group" aria-label={t("Tarifs courants", "Common rates")}>{RATES.map((value) => <button key={value} type="button" aria-pressed={rate === value} onClick={() => setRate(value)}>{fmt(value)}</button>)}</div>
        <p className="so-rate-hint">{hourly
          ? t(`Votre heure vaut environ ${fmt(hourly)}, sur une journée de ${HOURS_PER_DAY} heures.`, `Your hour is worth about ${fmt(hourly)}, on a ${HOURS_PER_DAY}-hour day.`)
          : t("Un ordre de grandeur suffit.", "A ballpark is enough.")}</p>
      </div>
      <button type="button" className="so-primary" disabled={!rate} onClick={() => { keepRate(rate); setStep("tools"); }}>{t("Continuer", "Continue")}<ArrowRight size={18} aria-hidden /></button>
      <button type="button" className="so-skip" onClick={() => { setRate(null); keepRate(null); setStep("tools"); }}>{t("Je préfère ne pas le dire", "I’d rather not say")}</button>
    </div>}

    {step === "tools" && current && <div className="so-step" key="tools">
      {progress}
      <StackStarter mode="member" initial={picks} wall={[...new Set([...picks, ...TRADE_TOOLS[current.id]])]}
        cta={t("Continuer", "Continue")} onPicksChange={setPicks} onFinish={(slugs) => { setPicks(slugs); setStep("ready"); }}
        intro={<>
          <p className="ss-eyebrow">{t(current.fr, current.en)}</p>
          <h1 id="ss-title">{t("Vos trois premiers outils.", "Your first three tools.")}</h1>
          <p className="ss-lead">{t(current.quipFr, current.quipEn)} {t(`On commence par trois, choisis parmi ceux qui reviennent le plus dans nos stacks de ${current.peopleFr}. Le reste viendra tout seul.`, `We start with three, from the ones that come up most in our ${current.peopleEn} stacks. The rest will follow.`)}</p>
        </>} />
    </div>}

    {step === "ready" && <div className="so-ready" key="ready">
      {progress}
      {/* The moment of satisfaction: a check that draws itself, a burst, the logos landing. */}
      <span className="so-done" aria-hidden="true">
        {Array.from({ length: 12 }, (_, at) => <i key={at} style={{ ["--a" as string]: `${at * 30}deg` }} />)}
        <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg>
      </span>
      <span className="so-cluster so-cluster--land" aria-hidden="true">{picked.slice(0, 8).map((tool, at) => <span key={tool.id} style={{ animationDelay: `${500 + at * 70}ms`, ["--x" as string]: `${(at % 2 ? 1 : -1) * (40 + at * 14)}px` }}><ToolLogo tool={tool} size={40} /></span>)}</span>
      <h1 id="ss-title">{name ? t(`C’est prêt, ${name}.`, `All set, ${name}.`) : t("C’est prêt.", "All set.")}</h1>
      <p className="so-lead">{verdict}</p>
      <dl className="so-facts">
        <div><dt>{t("Outils", "Tools")}</dt><dd>{Math.round(tally)}</dd></div>
        <div><dt>{t("Coût connu", "Known cost")}</dt><dd>{reading.known > 0 ? <>{reading.money(cost)}<small>{t("/mois", "/mo")}</small></> : <span className="ss-tbd">{t("à préciser", "to confirm")}</span>}</dd></div>
        <div data-alert={reading.pairs.length > 0 ? "" : undefined}><dt>{t("Doublons", "Duplicates")}</dt><dd>{Math.round(doubles)}</dd></div>
      </dl>
      {reading.known > 0 && <p className="so-year">{t(`Au moins ${reading.money(reading.known * 12)} par an, d’après les prix publics. On regarde ça de près ensemble.`, `At least ${reading.money(reading.known * 12)} a year, from public prices. We’ll look at it closely together.`)}</p>}
      {hourly && <p className="so-hour"><b>{t(`Votre heure vaut environ ${fmt(hourly)}.`, `Your hour is worth about ${fmt(hourly)}.`)}</b> {t(`Un outil qui vous fait gagner une heure par mois est rentable sous ${fmt(hourly)}/mois.`, `A tool that saves you one hour a month pays for itself under ${fmt(hourly)}/month.`)}</p>}
      {reading.shownPairs.length > 0 && <ul className="so-pairs">{reading.shownPairs.map(({ shown, other, why }) => <li key={`${shown.id}|${other.id}`}>
        <span className="so-pair-logos" aria-hidden="true"><ToolLogo tool={shown} size={26} /><i>{t("ou", "or")}</i><ToolLogo tool={other} size={26} /></span>
        <span><b>{t(`${shown.name} ou ${other.name}`, `${shown.name} or ${other.name}`)}</b><small>{why}</small></span>
      </li>)}</ul>}
      <p className="so-next">{t("La suite ? Ajoutez vos autres outils quand vous voulez. Et maintenant, profitez.", "What’s next? Add your other tools whenever you like. Now, enjoy.")}</p>
      <button type="button" className="so-primary" onClick={() => { if (trade) saved.setTrade(trade); onOpen(picks, name ? t(`Bienvenue chez vous, ${name}. Profitez-en.`, `Welcome home, ${name}. Enjoy.`) : t("Bienvenue chez vous. Profitez-en.", "Welcome home. Enjoy.")); }}>
        <Check size={18} aria-hidden />{t("Ouvrir mon espace", "Open my space")}
      </button>
    </div>}
  </section>;
}
