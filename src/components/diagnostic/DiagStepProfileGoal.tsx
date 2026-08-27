import { useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Check, Code2, Compass, Gauge, Palette, PenLine, Plus, Scissors, Sparkles, Workflow } from "@/lib/icons";
import type { Persona, SessionState, Tool } from "@/types/diagnostic";
import {
  buildCreativeQuestions,
  CREATIVE_OUTPUTS,
} from "@/lib/creativeAdaptiveEngine";

interface Props {
  session: SessionState;
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev?: () => void;
  variant?: "intro" | "confirm" | "creative-edit";
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
  const isCreativeEdit = variant === "creative-edit" && session.persona === "SOFIA";
  const [profileStep, setProfileStep] = useState<"persona" | "creative-output" | "goal" | "details">(
    isCreativeEdit ? "creative-output" : "persona"
  );
  const [firstName, setFirstName] = useState(session.firstName || "");
  const [email, setEmail] = useState(session.email || "");
  const [emailError, setEmailError] = useState("");
  const [persona, setPersona] = useState<Persona>(session.persona || inferred.persona);
  const [primaryCreativeOutput, setPrimaryCreativeOutput] = useState(session.primarySpecialty || "");
  const [secondaryCreativeOutputs, setSecondaryCreativeOutputs] = useState<string[]>(session.complementarySpecialties || []);
  const [showSecondaryCreativeOutputs, setShowSecondaryCreativeOutputs] = useState(
    (session.complementarySpecialties || []).length > 0
  );
  const [stackGoal, setStackGoal] = useState<NonNullable<SessionState["stackGoal"]>>(session.stackGoal || "reduce_costs");
  const [tjm, setTjm] = useState<number>(session.tjm || 0);

  const isIntro = variant === "intro";
  const emailValue = email.trim();
  const isValidEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isCreative = persona === "SOFIA";
  const stepIndex = profileStep === "persona"
    ? 0
    : profileStep === "creative-output"
      ? 1
      : profileStep === "goal"
        ? isCreative ? 2 : 1
        : isCreative ? 3 : 2;
  const totalProfileSteps = isCreativeEdit ? 1 : 3;
  const displayedStepIndex = isCreativeEdit ? 0 : stepIndex;
  const stepTitle =
    profileStep === "persona"
      ? t("Tu fais surtout quoi au quotidien ?", "What do you mostly do day to day?")
      : profileStep === "creative-output"
        ? t("Qu’est-ce que tu produis le plus souvent ?", "What do you produce most often?")
      : profileStep === "goal"
        ? t("Tu veux améliorer quoi en priorité ?", "What do you want to improve first?")
        : t("Deux détails utiles, mais optionnels.", "Two useful details, but optional.");
  const stepSubtitle =
    profileStep === "persona"
      ? t(
          "Choisis l’angle le plus proche. Ce n’est pas une étiquette définitive, c’est juste le point de départ du diagnostic.",
          "Pick the closest angle. It is not a permanent label, just the starting point for the diagnostic."
        )
      : profileStep === "creative-output"
        ? t(
            "On part de ton travail réel, puis on cherchera les outils qui couvrent chaque besoin — sans imposer Figma, Adobe, Canva ou Blender.",
            "We start from your real work, then find the tools covering each need — without assuming Figma, Adobe, Canva or Blender."
          )
      : profileStep === "goal"
        ? t(
            "Cette réponse change l’ordre des recommandations : économies, simplicité, temps gagné ou qualité de choix.",
            "This answer changes the order of recommendations: savings, simplicity, saved time, or decision quality."
          )
        : t(
            "Tu peux tout laisser vide. Le rapport restera utilisable, ces champs servent seulement à le rendre plus personnel.",
            "You can leave everything blank. The report will still work; these fields only make it more personal."
          );
  const stepEyebrow =
    isCreativeEdit
      ? t("Production créative", "Creative output")
      : profileStep === "persona"
      ? t("Point de départ", "Starting point")
      : profileStep === "creative-output"
        ? t("Production créative", "Creative output")
      : profileStep === "goal"
        ? t("Priorité", "Priority")
        : t("Personnalisation", "Personalization");
  const stepHelp =
    isCreativeEdit
      ? t(
          "Change seulement ce qui a évolué. Les outils liés uniquement à une production retirée sortiront du diagnostic actuel.",
          "Only change what has evolved. Tools tied only to a removed output will leave the current diagnostic."
        )
      : profileStep === "persona"
      ? t("Si tu hésites, prends le rôle qui décrit le mieux tes missions récentes.", "If unsure, choose the role that best describes your recent work.")
      : profileStep === "creative-output"
        ? t("Choisis une production principale. Tu peux ajouter les autres qui occupent réellement une place dans ton quotidien.", "Choose one primary output. Add others that genuinely matter in your day-to-day work.")
      : profileStep === "goal"
        ? t("Un même outil peut être bon à garder, à réduire ou à remplacer selon ton intention.", "The same tool can be worth keeping, reducing, or replacing depending on your intent.")
        : t("Ces infos restent privées au diagnostic et peuvent être ignorées.", "These details stay private to the diagnostic and can be skipped.");

  const goBackWithinIntro = () => {
    if (isCreativeEdit) return onPrev?.();
    if (profileStep === "details") return setProfileStep("goal");
    if (profileStep === "goal") return setProfileStep(isCreative ? "creative-output" : "persona");
    if (profileStep === "creative-output") return setProfileStep("persona");
    return onPrev?.();
  };

  const handlePrimary = () => {
    if (profileStep === "persona") return setProfileStep(persona === "SOFIA" ? "creative-output" : "goal");
    if (profileStep === "creative-output") {
      if (!primaryCreativeOutput) return;
      if (isCreativeEdit) return handleNext();
      return setProfileStep("goal");
    }
    if (profileStep === "goal") {
      if (isCreative) return handleNext();
      return setProfileStep("details");
    }
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
    const creativeOutputIds = [
      primaryCreativeOutput,
      ...secondaryCreativeOutputs.filter((id) => id !== primaryCreativeOutput),
    ].filter(Boolean);
    let selectedTools = session.selectedTools;
    let toolUsageMap = session.toolUsageMap;
    let workflowUsages = session.workflowUsages;
    let commercialContracts = session.commercialContracts;
    let selectionCoverage = session.selectionCoverage;

    if (isCreativeEdit) {
      const baseQuestions = buildCreativeQuestions(
        creativeOutputIds,
        [],
        session.selectedTools
      );
      const baseQuestionIds = new Set(baseQuestions.map((question) => question.id));
      const activeHosts = session.selectedTools.filter((tool) =>
        (session.toolUsageMap?.[tool.id] || []).some((objectiveId) =>
          baseQuestionIds.has(objectiveId)
        )
      );
      const activeQuestionIds = new Set(
        buildCreativeQuestions(
          creativeOutputIds,
          activeHosts,
          session.selectedTools
        ).map((question) => question.id)
      );
      const nextToolUsageMap = Object.fromEntries(
        Object.entries(session.toolUsageMap || {}).flatMap(([toolId, objectiveIds]) => {
          const keptObjectiveIds = objectiveIds.filter((objectiveId) =>
            activeQuestionIds.has(objectiveId)
          );
          return keptObjectiveIds.length > 0 ? [[toolId, keptObjectiveIds]] : [];
        })
      );
      const toolsWithDeclaredUsage = new Set(Object.keys(session.toolUsageMap || {}));
      const keptToolIds = new Set(
        session.selectedTools
          .filter((tool) =>
            !toolsWithDeclaredUsage.has(tool.id) ||
            (nextToolUsageMap[tool.id] || []).length > 0
          )
          .map((tool) => tool.id)
      );

      selectedTools = session.selectedTools.filter((tool) => keptToolIds.has(tool.id));
      toolUsageMap = nextToolUsageMap;
      workflowUsages = (session.workflowUsages || []).filter((usage) =>
        activeQuestionIds.has(usage.objectiveId)
      );
      commercialContracts = (session.commercialContracts || []).flatMap((contract) => {
        const productIds = contract.productIds.filter((toolId) => keptToolIds.has(toolId));
        return productIds.length > 0 ? [{ ...contract, productIds }] : [];
      });
      selectionCoverage = session.selectionCoverage
        ? {
            ...session.selectionCoverage,
            covered: session.selectionCoverage.covered.filter((id) => activeQuestionIds.has(id)),
            skipped: session.selectionCoverage.skipped.filter((id) => activeQuestionIds.has(id)),
          }
        : undefined;
    }

    onUpdate({
      firstName: firstName.trim(),
      email: emailValue || undefined,
      persona,
      personaConfidence: isCreativeEdit
        ? session.personaConfidence || "clear"
        : isIntro
          ? "clear"
          : persona === inferred.persona
            ? inferred.confidence
            : "hybrid",
      stackGoal,
      tjm,
      complementarySkills: isCreativeEdit ? session.complementarySkills : complementarySkills,
      primarySpecialty: persona === "SOFIA" ? primaryCreativeOutput || undefined : session.primarySpecialty,
      complementarySpecialties: persona === "SOFIA"
        ? secondaryCreativeOutputs.filter((id) => id !== primaryCreativeOutput)
        : session.complementarySpecialties,
      selectedTools,
      toolUsageMap,
      workflowUsages,
      commercialContracts,
      selectionCoverage,
    });
    onNext();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-10">
      <main className="space-y-6">
        <header className="mx-auto max-w-3xl space-y-5 text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
            <span>{stepEyebrow}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{displayedStepIndex + 1}/{totalProfileSteps}</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-[0.98] text-foreground md:text-5xl">
              {stepTitle}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {stepSubtitle}
            </p>
          </div>
          <p className="mx-auto max-w-xl rounded-2xl bg-muted/60 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {stepHelp}
          </p>
        </header>

        {profileStep === "persona" && (
          <section className="mx-auto grid max-w-3xl gap-2">
            {PERSONAS.map((item) => {
              const Icon = item.Icon;
              const selected = item.id === persona;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPersona(item.id)}
                  className={`group grid min-h-[76px] w-full grid-cols-[42px_1fr_24px] items-center gap-4 rounded-2xl border px-4 text-left transition-all ${
                    selected ? "border-foreground bg-card text-foreground shadow-md" : "border-border bg-card hover:border-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-foreground">{t(item.labelFr, item.labelEn)}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{t(item.hintFr, item.hintEn)}</span>
                  </span>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-foreground bg-foreground text-background" : "border-border text-transparent"
                  }`}>
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </section>
        )}

        {profileStep === "goal" && (
          <section className="mx-auto grid max-w-3xl gap-2 sm:grid-cols-2">
            {GOALS.map((goal) => {
              const Icon = goal.Icon;
              const selected = goal.value === stackGoal;
              return (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => setStackGoal(goal.value)}
                  className={`group flex min-h-[112px] items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    selected ? "border-foreground bg-card shadow-md" : "border-border bg-card hover:border-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                    selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground group-hover:text-foreground"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-foreground">{t(goal.fr, goal.en)}</span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-foreground" />}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-muted-foreground">{t(goal.detailFr, goal.detailEn)}</span>
                    <span className="mt-3 block border-t border-border pt-2 text-xs leading-snug text-muted-foreground">{t(goal.algoFr, goal.algoEn)}</span>
                  </span>
                </button>
              );
            })}
          </section>
        )}

        {profileStep === "creative-output" && (
          <section className="mx-auto max-w-3xl space-y-5">
            <div className="grid grid-cols-2 gap-2">
              {CREATIVE_OUTPUTS.map((output) => {
                const selected = output.id === primaryCreativeOutput;
                return (
                  <button
                    key={output.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setPrimaryCreativeOutput(output.id);
                      setSecondaryCreativeOutputs((current) => current.filter((id) => id !== output.id));
                    }}
                    className={`flex min-h-[76px] items-center gap-3 rounded-2xl border p-3 text-left transition-all sm:min-h-[92px] sm:p-4 ${
                      selected
                        ? "border-foreground bg-card shadow-md"
                        : "border-border bg-card hover:border-foreground/30 hover:bg-muted/30"
                    }`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      selected ? "border-foreground bg-foreground text-background" : "border-border text-transparent"
                    }`}>
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {t(output.labelFr, output.labelEn)}
                      </span>
                      <span className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">
                        {t(output.detailFr, output.detailEn)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {primaryCreativeOutput && !showSecondaryCreativeOutputs && (
              <button
                type="button"
                onClick={() => setShowSecondaryCreativeOutputs(true)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("J’ai aussi d’autres productions", "I also produce other things")}
              </button>
            )}

            {primaryCreativeOutput && showSecondaryCreativeOutputs && (
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">
                  {t("Tu produis aussi régulièrement :", "You also regularly produce:")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CREATIVE_OUTPUTS.filter((output) => output.id !== primaryCreativeOutput).map((output) => {
                    const selected = secondaryCreativeOutputs.includes(output.id);
                    return (
                      <button
                        key={output.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSecondaryCreativeOutputs((current) =>
                          current.includes(output.id)
                            ? current.filter((id) => id !== output.id)
                            : [...current, output.id]
                        )}
                        className={`rounded-full border px-3 py-2 text-xs font-medium ${
                          selected
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {selected ? "✓ " : ""}{t(output.labelFr, output.labelEn)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {profileStep === "details" && (
          <section className="diagnostic-card mx-auto max-w-3xl space-y-5 p-5">
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
                    className={`h-11 rounded-xl border px-2 text-sm font-medium ${
                      tjm === option.value ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(option.label.fr, option.label.en)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTjm(0)}
                  className={`h-11 rounded-xl border px-2 text-sm font-medium ${
                    tjm === 0 ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("Pas utile", "Not needed")}
                </button>
              </div>
            </div>
          </section>
        )}

          <footer className="mx-auto flex max-w-3xl flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            {profileStep === "persona" && !onPrev ? (
              <p className="text-sm text-muted-foreground">
                {t("Pas besoin d’être exact : tu pourras corriger ensuite.", "No need to be exact: you can adjust later.")}
              </p>
            ) : (
              <button
                type="button"
                onClick={goBackWithinIntro}
                className="h-11 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
              >
                {t("Retour", "Back")}
              </button>
            )}
            <button
              type="button"
              onClick={handlePrimary}
              disabled={profileStep === "creative-output" && !primaryCreativeOutput}
              className="diagnostic-primary-action inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-40"
            >
              {isCreativeEdit
                ? t("Mettre à jour mon parcours", "Update my workflow")
                : profileStep === "goal" && isCreative
                  ? t("Cartographier ma façon de travailler", "Map how I work")
                  : profileStep === "details"
                    ? t("Commencer la cartographie", "Start mapping")
                    : t("Continuer", "Continue")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </footer>
      </main>
    </div>
  );
}
