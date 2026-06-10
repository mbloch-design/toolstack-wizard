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
}> = [
  { value: "reduce_costs", Icon: Scissors, fr: "Réduire les coûts", en: "Reduce costs" },
  { value: "simplify", Icon: Compass, fr: "Simplifier", en: "Simplify" },
  { value: "save_time", Icon: Gauge, fr: "Gagner du temps", en: "Save time" },
  { value: "quality", Icon: Sparkles, fr: "Mieux choisir", en: "Choose better" },
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
  const isIntro = variant === "intro";
  const emailValue = email.trim();
  const isValidEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const stepIndex = profileStep === "persona" ? 0 : profileStep === "goal" ? 1 : 2;
  const stepTitle =
    profileStep === "persona"
      ? t("Pour commencer, tu fais surtout quoi ?", "First, what do you mostly do?")
      : profileStep === "goal"
        ? t("Qu’est-ce que tu veux améliorer en priorité ?", "What do you want to improve first?")
        : t("Deux détails, seulement si tu veux.", "Two details, only if you want.");
  const stepSubtitle =
    profileStep === "persona"
      ? t(
          "Je m’en sers pour éviter les suggestions hors sujet. Choisis le profil le plus proche, même si ce n’est pas parfait.",
          "I use this to avoid irrelevant suggestions. Pick the closest profile, even if it is not perfect."
        )
      : profileStep === "goal"
        ? t(
            "Ça m’aide à classer les recommandations : économies, simplicité, temps gagné ou meilleur choix.",
            "This helps me rank recommendations: savings, simplicity, saved time or better choices."
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
                <span>{t("Diagnostic guidé", "Guided diagnostic")}</span>
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
            <section className="grid gap-3 sm:grid-cols-2">
          {GOALS.map((goal) => {
            const Icon = goal.Icon;
            const selected = goal.value === stackGoal;
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => setStackGoal(goal.value)}
                className={`group flex min-h-[86px] w-full items-center gap-4 rounded-lg border px-4 text-left transition-all ${
                  selected ? "border-primary bg-primary/5 text-foreground shadow-sm" : "border-border bg-card hover:border-foreground/30 hover:bg-muted/30"
                }`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{t(goal.fr, goal.en)}</span>
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
  stepHelp,
  profileStep,
  stackGoal,
  tjm,
  t,
}: {
  selectedMeta: PersonaMeta;
  stepHelp: string;
  profileStep: "persona" | "goal" | "details";
  stackGoal: NonNullable<SessionState["stackGoal"]>;
  tjm: number;
  t: (fr: string, en: string) => string;
}) {
  const Icon = selectedMeta.Icon;
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
            <p className="text-base font-semibold text-foreground">{t(selectedMeta.labelFr, selectedMeta.labelEn)}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stepHelp}</p>
          </div>
        </div>

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
              "On calibre d’abord le regard. Ensuite seulement, on te demande tes outils.",
              "We calibrate the lens first. Only then do we ask for your tools."
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
