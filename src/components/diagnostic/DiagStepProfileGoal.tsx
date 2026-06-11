import { useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Check, Code2, Compass, Gauge, Palette, PenLine, Scissors, Sparkles, Workflow } from "lucide-react";
import type { Persona, SessionState, Tool } from "@/types/diagnostic";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev?: () => void;
  variant?: "intro" | "confirm";
  t: (fr: string, en: string) => string;
}

type PersonaMeta = {
  id: Persona;
  Icon: typeof Code2;
  labelFr: string;
  labelEn: string;
  hintFr: string;
  hintEn: string;
};

const PERSONAS: PersonaMeta[] = [
  { id: "THEO", Icon: Code2, labelFr: "Tech / Dev", labelEn: "Tech / Dev", hintFr: "produit, code, infra", hintEn: "product, code, infra" },
  { id: "SOFIA", Icon: Palette, labelFr: "Créatif", labelEn: "Creative", hintFr: "design, vidéo, marque", hintEn: "design, video, brand" },
  { id: "MARC", Icon: BriefcaseBusiness, labelFr: "Conseil", labelEn: "Consulting", hintFr: "clients, vente, livrables", hintEn: "clients, sales, delivery" },
  { id: "ALIX", Icon: PenLine, labelFr: "Content", labelEn: "Content", hintFr: "contenu, audience, newsletter", hintEn: "content, audience, newsletter" },
  { id: "CLAIRE", Icon: Workflow, labelFr: "Ops / Business", labelEn: "Ops / Business", hintFr: "process, finance, pilotage", hintEn: "process, finance, operations" },
];

const GOALS: Array<{
  value: NonNullable<SessionState["stackGoal"]>;
  Icon: typeof Scissors;
  fr: string;
  en: string;
  detailFr: string;
  detailEn: string;
  algoFr: string;
  algoEn: string;
}> = [
  {
    value: "reduce_costs",
    Icon: Scissors,
    fr: "Réduire les coûts",
    en: "Reduce costs",
    detailFr: "Je classe d’abord les économies directes, doublons et plans trop chers.",
    detailEn: "I rank direct savings, duplicates, and oversized plans first.",
    algoFr: "Priorité aux montants récupérables et aux downgrades.",
    algoEn: "Prioritizes recoverable spend and downgrades.",
  },
  {
    value: "simplify",
    Icon: Compass,
    fr: "Simplifier",
    en: "Simplify",
    detailFr: "Je privilégie les arbitrages qui réduisent la dispersion de ta stack.",
    detailEn: "I favor decisions that reduce stack fragmentation.",
    algoFr: "Priorité aux doublons, recouvrements et outils satellites.",
    algoEn: "Prioritizes overlaps, redundancy, and satellite tools.",
  },
  {
    value: "save_time",
    Icon: Gauge,
    fr: "Gagner du temps",
    en: "Save time",
    detailFr: "Je protège davantage les outils utiles, même s’ils coûtent un peu.",
    detailEn: "I protect useful tools more, even when they cost a bit.",
    algoFr: "Priorité aux frictions, outils peu adaptés et actions rapides.",
    algoEn: "Prioritizes friction, poor-fit tools, and quick actions.",
  },
  {
    value: "quality",
    Icon: Sparkles,
    fr: "Mieux choisir",
    en: "Choose better",
    detailFr: "Je compare surtout fit métier, pertinence et bon niveau d’abonnement.",
    detailEn: "I compare business fit, relevance, and the right subscription tier.",
    algoFr: "Priorité au fit, au bon palier d’offre et aux alternatives utiles.",
    algoEn: "Prioritizes fit, right plan tier, and useful alternatives.",
  },
];

const TJM_OPTIONS = [
  { label: tLabel("< 300€", "< 300€"), value: 250 },
  { label: tLabel("300€ - 500€", "300€ - 500€"), value: 400 },
  { label: tLabel("500€ - 800€", "500€ - 800€"), value: 650 },
  { label: tLabel("800€ - 1 200€", "800€ - 1,200€"), value: 1000 },
  { label: tLabel("> 1 200€", "> 1,200€"), value: 1500 },
] as const;

function tLabel(fr: string, en: string) {
  return { fr, en };
}

function inferPersona(tools: Tool[]) {
  const scores = new Map<Persona, number>();
  PERSONAS.forEach((persona) => scores.set(persona.id, 0));

  tools.forEach((tool) => {
    PERSONAS.forEach((persona) => {
      const explicit = tool.pertinence_by_persona?.[persona.id] || 0;
      const categoryBoost =
        persona.id === "THEO" && /dev|deploy|code|automation|ai/i.test(tool.category) ? 18 :
        persona.id === "SOFIA" && /design|video|creation|asset/i.test(tool.category) ? 18 :
        persona.id === "MARC" && /crm|sales|client|proposal/i.test(tool.category) ? 18 :
        persona.id === "ALIX" && /content|newsletter|social|creation/i.test(tool.category) ? 18 :
        persona.id === "CLAIRE" && /finance|project|ops|organization/i.test(tool.category) ? 18 :
        0;
      scores.set(persona.id, (scores.get(persona.id) || 0) + explicit + categoryBoost);
    });
  });

  const ranked = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
  const [primary, primaryScore] = ranked[0] || ["THEO", 0];
  const [, secondaryScore] = ranked[1] || ["SOFIA", 0];
  const gap = primaryScore - secondaryScore;
  const confidence: NonNullable<SessionState["personaConfidence"]> =
    tools.length < 3 || gap < 70 ? "hybrid" : "clear";

  return { persona: primary as Persona, confidence, ranked };
}

export default function DiagStepProfileGoal({ session, onUpdate, onNext, onPrev, variant = "confirm", t }: Props) {
  const inferred = useMemo(() => inferPersona(session.selectedTools), [session.selectedTools]);
  const [profileStep, setProfileStep] = useState<"persona" | "goal" | "details">("persona");
  const [firstName, setFirstName] = useState(session.firstName || "");
  const [email, setEmail] = useState(session.email || "");
  const [emailError, setEmailError] = useState("");
  const [persona, setPersona] = useState<Persona>(session.persona || inferred.persona);
  const [stackGoal, setStackGoal] = useState<NonNullable<SessionState["stackGoal"]>>(session.stackGoal || "reduce_costs");
  const [tjm, setTjm] = useState<number>(session.tjm || 0);

  const inferredMeta = PERSONAS.find((item) => item.id === inferred.persona) || PERSONAS[0];
  const selectedMeta = PERSONAS.find((item) => item.id === persona) || inferredMeta;
  const selectedGoal = GOALS.find((goal) => goal.value === stackGoal) || GOALS[0];
  const SelectedGoalIcon = selectedGoal.Icon;
  const isIntro = variant === "intro";
  const emailValue = email.trim();
  const isValidEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const stepIndex = profileStep === "persona" ? 0 : profileStep === "goal" ? 1 : 2;
  const stepTitle =
    profileStep === "persona"
      ? t("Je calibre d'abord ton audit.", "First, I calibrate your audit.")
      : profileStep === "goal"
        ? t("Qu'est-ce qui compte le plus dans la lecture ?", "What matters most in the read?")
        : t("Deux détails utiles, rien d'obligatoire.", "Two useful details, nothing required.");
  const stepSubtitle =
    profileStep === "persona"
      ? t(
          "Je m’en sers pour éviter les suggestions hors sujet. Choisis le profil le plus proche, même si ce n’est pas parfait.",
          "I use this to avoid irrelevant suggestions. Pick the closest profile, even if it is not perfect."
        )
      : profileStep === "goal"
        ? t(
            "Tu peux continuer avec la lecture proposée. Change-la seulement si ton intention principale est différente.",
            "You can continue with the suggested read. Change it only if your main intent is different."
          )
        : t(
            "Tu peux tout laisser vide. Ces infos servent juste à personnaliser le rapport et les estimations.",
            "You can leave everything blank. These only personalize the report and estimates."
          );
  const stepEyebrow =
    profileStep === "persona"
      ? t("Profil de travail", "Work profile")
      : profileStep === "goal"
        ? t("Objectif du diagnostic", "Diagnostic goal")
        : t("Personnalisation", "Personalization");
  const stepHelp =
    profileStep === "persona"
      ? t(
          "On ne cherche pas une identité parfaite. On cherche l’angle qui évitera les mauvaises suggestions.",
          "We are not looking for a perfect identity. We are looking for the angle that avoids bad suggestions."
        )
      : profileStep === "goal"
        ? t(
            "Le même outil ne se juge pas pareil si tu veux économiser, simplifier ou gagner du temps.",
            "The same tool is not judged the same way if you want to save money, simplify, or save time."
          )
        : t(
            "Ces informations restent optionnelles. Elles rendent surtout le rapport plus parlant.",
            "These details stay optional. They mostly make the report more useful."
          );

  const goBackWithinIntro = () => {
    if (profileStep === "details") return setProfileStep("goal");
    if (profileStep === "goal") return setProfileStep("persona");
    return onPrev?.();
  };

  const handlePrimary = () => {
    if (profileStep === "persona") return setProfileStep("goal");
    if (profileStep === "goal") return setProfileStep("details");
    return handleNext();
  };

  const handleNext = () => {
    if (!isValidEmail(emailValue)) {
      setEmailError(t("Email invalide", "Invalid email"));
      return;
    }
    const complementarySkills = inferred.ranked
      .filter(([id]) => id !== persona)
      .slice(0, inferred.confidence === "hybrid" ? 1 : 0)
      .map(([id]) => id as Persona);

    onUpdate({
      firstName: firstName.trim(),
      email: emailValue || undefined,
      persona,
      personaConfidence: isIntro ? "clear" : persona === inferred.persona ? inferred.confidence : "hybrid",
      stackGoal,
      tjm,
      complementarySkills,
    });
    onNext();
  };

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <main className="space-y-6">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                <span>{t("Audit guidé", "Guided audit")}</span>
                <span className="text-primary/40">·</span>
                <span>{stepIndex + 1}/3</span>
              </div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                {stepEyebrow}
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-bold leading-[0.98] text-foreground md:text-5xl">
                {stepTitle}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {stepSubtitle}
              </p>
            </div>
            <div className="flex max-w-sm gap-2" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <span
                  key={item}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${item <= stepIndex ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          </header>

          {profileStep === "persona" && (
            <section className="grid gap-3 sm:grid-cols-2">
          {PERSONAS.map((item) => {
            const Icon = item.Icon;
            const selected = item.id === persona;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPersona(item.id)}
                className={`group flex min-h-[96px] w-full items-center gap-4 rounded-lg border px-4 text-left transition-all ${
                  selected ? "border-primary bg-primary/5 text-foreground shadow-sm" : "border-border bg-card hover:border-foreground/30 hover:bg-muted/30"
                }`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-foreground">{t(item.labelFr, item.labelEn)}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{t(item.hintFr, item.hintEn)}</span>
                </span>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"
                }`}>
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
            </section>
          )}

          {profileStep === "goal" && (
            <section className="space-y-4">
              <div className="rounded-lg border border-primary bg-primary/5 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <SelectedGoalIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-primary">
                        {t("Lecture retenue", "Selected read")}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-foreground">
                        {t(selectedGoal.fr, selectedGoal.en)}
                      </h2>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        {t(selectedGoal.detailFr, selectedGoal.detailEn)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                    {t("Actif", "Active")}
                  </span>
                </div>
                <div className="mt-4 rounded-md bg-background/80 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t("Impact dans l’algo", "Algorithm impact")}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {t(selectedGoal.algoFr, selectedGoal.algoEn)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("Changer seulement si besoin", "Change only if needed")}
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {GOALS.filter((goal) => goal.value !== stackGoal).map((goal) => {
                    const Icon = goal.Icon;
                    return (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => setStackGoal(goal.value)}
                        className="group flex min-h-[72px] items-center gap-3 rounded-lg border border-border bg-card px-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted/30"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-foreground">{t(goal.fr, goal.en)}</span>
                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{t(goal.algoFr, goal.algoEn)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {profileStep === "details" && (
            <section className="space-y-5 rounded-lg border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">{t("Ton prénom", "Your first name")}</span>
              <input
                id="diagnostic-first-name-compact"
                name="first-name"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder={t("Ex. Sofia", "E.g. Sofia")}
                className="h-12 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">{t("Email optionnel", "Optional email")}</span>
              <input
                id="diagnostic-email-early"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError("");
                }}
                placeholder={t("Pour recevoir le rapport", "To receive the report")}
                className="h-12 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>
          {emailError && <p className="text-sm text-destructive">{emailError}</p>}

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t("Ton tarif jour, si tu veux affiner le calcul", "Your day rate, if you want a sharper estimate")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Tu peux choisir “Pas utile” sans pénaliser le diagnostic.", "You can choose “Not needed” without hurting the diagnostic.")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TJM_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTjm(option.value)}
                  className={`h-11 rounded-md border px-2 text-sm font-medium ${
                    tjm === option.value ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(option.label.fr, option.label.en)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTjm(0)}
                className={`h-11 rounded-md border px-2 text-sm font-medium ${
                  tjm === 0 ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("Pas utile", "Not needed")}
              </button>
            </div>
          </div>
            </section>
          )}

          <footer className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            {profileStep === "persona" && !onPrev ? (
              <p className="text-sm text-muted-foreground">
                {t("Pas besoin d’être exact : tu pourras corriger ensuite.", "No need to be exact: you can adjust later.")}
              </p>
            ) : (
              <button
                type="button"
                onClick={goBackWithinIntro}
                className="h-11 rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {t("Retour", "Back")}
              </button>
            )}
            <button
              type="button"
              onClick={handlePrimary}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/90"
            >
              {profileStep === "details" ? t("Trouver mes outils", "Find my tools") : t("Continuer", "Continue")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </footer>
        </main>

        <ProfileContextPanel
          selectedMeta={selectedMeta}
          selectedGoal={selectedGoal}
          stepHelp={stepHelp}
          profileStep={profileStep}
          stackGoal={stackGoal}
          tjm={tjm}
          t={t}
        />
      </div>
    </div>
  );
}

function ProfileContextPanel({
  selectedMeta,
  selectedGoal,
  stepHelp,
  profileStep,
  stackGoal,
  tjm,
  t,
}: {
  selectedMeta: PersonaMeta;
  selectedGoal: (typeof GOALS)[number];
  stepHelp: string;
  profileStep: "persona" | "goal" | "details";
  stackGoal: NonNullable<SessionState["stackGoal"]>;
  tjm: number;
  t: (fr: string, en: string) => string;
}) {
  const Icon = profileStep === "goal" ? selectedGoal.Icon : selectedMeta.Icon;
  const goalLabel = GOALS.find((goal) => goal.value === stackGoal);
  return (
    <aside className="lg:sticky lg:top-28">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase text-primary">
          {t("Pourquoi maintenant", "Why now")}
        </p>
        <div className="mt-4 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">
              {profileStep === "goal" ? t(selectedGoal.fr, selectedGoal.en) : t(selectedMeta.labelFr, selectedMeta.labelEn)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stepHelp}</p>
          </div>
        </div>

        {profileStep === "goal" && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-semibold uppercase text-primary">
              {t("Ce que l’algo change", "What the algorithm changes")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              {t(selectedGoal.algoFr, selectedGoal.algoEn)}
            </p>
          </div>
        )}

        <div className="mt-5 space-y-2 border-t border-border pt-4">
          <ContextLine
            label={t("Profil", "Profile")}
            value={t(selectedMeta.labelFr, selectedMeta.labelEn)}
            active={profileStep === "persona"}
          />
          <ContextLine
            label={t("Priorité", "Priority")}
            value={goalLabel ? t(goalLabel.fr, goalLabel.en) : t("À choisir", "To choose")}
            active={profileStep === "goal"}
          />
          <ContextLine
            label={t("Estimation", "Estimate")}
            value={tjm > 0 ? `${tjm}€/${t("jour", "day")}` : t("Optionnelle", "Optional")}
            active={profileStep === "details"}
          />
        </div>

        <div className="mt-5 rounded-lg bg-muted/50 p-3">
          <p className="text-sm font-medium text-foreground">
            {t("Promesse de cette étape", "Promise of this step")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t(
              "On calibre le regard avant de regarder les outils. C'est ce qui evite les recommandations hors sujet.",
              "We calibrate the lens before looking at tools. That is what avoids irrelevant recommendations."
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}

function ContextLine({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-md px-2 py-2 ${
      active ? "bg-primary/5" : ""
    }`}>
      <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
