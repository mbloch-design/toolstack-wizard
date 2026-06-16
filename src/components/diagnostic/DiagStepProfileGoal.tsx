import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, Camera, Check, Clapperboard, Code2, Compass, Cuboid, Gauge, Layers3, MonitorSmartphone, Palette, PenLine, Scissors, Sparkles, Workflow } from "lucide-react";
import type { CreativeSpecialty, Persona, SessionState, Tool } from "@/types/diagnostic";

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

type CreativeSpecialtyMeta = {
  id: CreativeSpecialty;
  Icon: typeof Palette;
  labelFr: string;
  labelEn: string;
  hintFr: string;
  hintEn: string;
};

const CREATIVE_SPECIALTIES: CreativeSpecialtyMeta[] = [
  { id: "brand_identity", Icon: Palette, labelFr: "Identité / DA", labelEn: "Brand / Art direction", hintFr: "logos, marques, supports", hintEn: "logos, brands, collateral" },
  { id: "ui_product", Icon: MonitorSmartphone, labelFr: "UI / Produit", labelEn: "UI / Product", hintFr: "interfaces, design system, prototypes", hintEn: "interfaces, design systems, prototypes" },
  { id: "motion_video", Icon: Clapperboard, labelFr: "Motion / Vidéo", labelEn: "Motion / Video", hintFr: "montage, animation, formats courts", hintEn: "editing, animation, short-form" },
  { id: "photo_retouch", Icon: Camera, labelFr: "Photo / Retouche", labelEn: "Photo / Retouching", hintFr: "RAW, presets, galeries client", hintEn: "RAW, presets, client galleries" },
  { id: "content_social", Icon: PenLine, labelFr: "Contenu social", labelEn: "Social content", hintFr: "posts, newsletters, ads, planning", hintEn: "posts, newsletters, ads, planning" },
  { id: "illustration_3d", Icon: Cuboid, labelFr: "Illustration / 3D", labelEn: "Illustration / 3D", hintFr: "dessin, rendu, assets 3D", hintEn: "drawing, rendering, 3D assets" },
  { id: "creative_ops", Icon: Layers3, labelFr: "Studio / Ops créa", labelEn: "Studio / Creative ops", hintFr: "droits, validation, licences, clients", hintEn: "rights, review, licenses, clients" },
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
  const [profileStep, setProfileStep] = useState<"persona" | "specialty" | "goal" | "details">("persona");
  const [firstName, setFirstName] = useState(session.firstName || "");
  const [email, setEmail] = useState(session.email || "");
  const [emailError, setEmailError] = useState("");
  const [persona, setPersona] = useState<Persona>(session.persona || inferred.persona);
  const [primarySpecialty, setPrimarySpecialty] = useState<CreativeSpecialty>((session.primarySpecialty as CreativeSpecialty) || "brand_identity");
  const [stackGoal, setStackGoal] = useState<NonNullable<SessionState["stackGoal"]>>(session.stackGoal || "reduce_costs");
  const [tjm, setTjm] = useState<number>(session.tjm || 0);

  const isIntro = variant === "intro";
  const isCreativePersona = persona === "SOFIA";
  const emailValue = email.trim();
  const isValidEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const stepOrder = isCreativePersona
    ? (["persona", "specialty", "goal", "details"] as const)
    : (["persona", "goal", "details"] as const);
  const stepIndex = Math.max(0, (stepOrder as readonly string[]).indexOf(profileStep));
  const stepTitle =
    profileStep === "persona"
      ? t("Tu fais surtout quoi au quotidien ?", "What do you mostly do day to day?")
      : profileStep === "specialty"
        ? t("Dans la création, tu fais surtout quoi ?", "What kind of creative work do you mostly do?")
        : profileStep === "goal"
          ? t("Tu veux améliorer quoi en priorité ?", "What do you want to improve first?")
          : t("Deux détails utiles, mais optionnels.", "Two useful details, but optional.");
  const stepSubtitle =
    profileStep === "persona"
      ? t(
          "Choisis l’angle le plus proche. Ce n’est pas une étiquette définitive, c’est juste le point de départ du diagnostic.",
          "Pick the closest angle. It is not a permanent label, just the starting point for the diagnostic."
        )
      : profileStep === "specialty"
        ? t(
            "Je m’en sers pour prioriser les bonnes zones : plugins Figma, photo, motion, droits, validation ou mesure.",
            "I use it to prioritize the right areas: Figma plugins, photo, motion, rights, review or measurement."
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
    profileStep === "persona"
      ? t("Point de départ", "Starting point")
      : profileStep === "specialty"
        ? t("Métier créatif", "Creative craft")
        : profileStep === "goal"
          ? t("Priorité", "Priority")
          : t("Personnalisation", "Personalization");
  const stepHelp =
    profileStep === "persona"
      ? t("Si tu hésites, prends le rôle qui décrit le mieux tes missions récentes.", "If unsure, choose the role that best describes your recent work.")
      : profileStep === "specialty"
        ? t("Si tu fais plusieurs choses, choisis ce qui représente le plus tes missions récentes.", "If you do several things, pick what best represents your recent work.")
        : profileStep === "goal"
          ? t("Un même outil peut être bon à garder, à réduire ou à remplacer selon ton intention.", "The same tool can be worth keeping, reducing, or replacing depending on your intent.")
          : t("Ces infos restent privées au diagnostic et peuvent être ignorées.", "These details stay private to the diagnostic and can be skipped.");

  useEffect(() => {
    if (profileStep === "specialty" && !isCreativePersona) setProfileStep("goal");
  }, [isCreativePersona, profileStep]);

  const goBackWithinIntro = () => {
    if (profileStep === "details") return setProfileStep("goal");
    if (profileStep === "goal") return setProfileStep(isCreativePersona ? "specialty" : "persona");
    if (profileStep === "specialty") return setProfileStep("persona");
    return onPrev?.();
  };

  const handlePrimary = () => {
    if (profileStep === "persona") return setProfileStep(isCreativePersona ? "specialty" : "goal");
    if (profileStep === "specialty") return setProfileStep("goal");
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
      primarySpecialty: persona === "SOFIA" ? primarySpecialty : undefined,
      complementarySkills,
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
            <span>{stepIndex + 1}/{stepOrder.length}</span>
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

        {profileStep === "specialty" && (
          <section className="mx-auto grid max-w-3xl gap-2 sm:grid-cols-2">
            {CREATIVE_SPECIALTIES.map((item) => {
              const Icon = item.Icon;
              const selected = item.id === primarySpecialty;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPrimarySpecialty(item.id)}
                  className={`group flex min-h-[92px] items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    selected ? "border-foreground bg-card shadow-md" : "border-border bg-card hover:border-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${selected ? "bg-foreground text-background" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-foreground">{t(item.labelFr, item.labelEn)}</span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-foreground" />}
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-muted-foreground">{t(item.hintFr, item.hintEn)}</span>
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
              className="diagnostic-primary-action inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold"
            >
              {profileStep === "details" ? t("Trouver mes outils", "Find my tools") : t("Continuer", "Continue")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </footer>
      </main>
    </div>
  );
}
