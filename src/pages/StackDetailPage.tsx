import { useEffect, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Layers3 } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import { STACK_PERSONAS, STACK_STAGES, STACKS, STACK_USES, type StackPersona, type StackStage } from "@/data/stacks";

const STACK_LAYERS = [
  {
    id: "sell",
    titleFr: "Acquisition & vente",
    titleEn: "Acquisition & sales",
    match: ["pipeline", "rendez-vous", "qualification", "formulaire", "email", "social", "vente", "crm", "seo", "prospection"],
  },
  {
    id: "create",
    titleFr: "Production & livraison",
    titleEn: "Production & delivery",
    match: ["création", "design", "contenu", "base de travail", "fichiers", "déploiement", "repo", "produit", "asset", "prototype", "handoff", "feedback", "plugin"],
  },
  {
    id: "ops",
    titleFr: "Ops & automatisation",
    titleEn: "Ops & automation",
    match: ["pilotage", "automatisation", "base", "documentation", "workspace", "operations", "stockage", "projet", "coordination", "planning"],
  },
  {
    id: "money",
    titleFr: "Finance & admin",
    titleEn: "Finance & admin",
    match: ["paiement", "facturation", "billing", "payment"],
  },
  {
    id: "measure",
    titleFr: "Mesure & support",
    titleEn: "Measurement & support",
    match: ["analytics", "mesure", "support", "ux", "reporting", "tracking", "recherche"],
  },
];

const StackDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const stack = STACKS.find((item) => item.slug === slug);
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);

  useEffect(() => {
    if (!stack) return;
    const title = lang === "fr"
      ? `${stack.title} : outils, usages et budget | ToolTrim`
      : `${stack.titleEn}: tools, use cases and budget | ToolTrim`;
    const description = lang === "fr"
      ? `${stack.subtitle} Budget cible : ${stack.monthlyBudget}€/mois.`
      : `${stack.subtitleEn} Target budget: €${stack.monthlyBudget}/month.`;
    setSeoTags({ title, description, url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/stacks/${stack.slug}`);
    setJsonLd("stack-detail-jsonld", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      url: `${SEO_BASE}/${lang}/stacks/${stack.slug}`,
      about: stack.tools.map((slot) => toolBySlug.get(slot.slug)?.name || slot.slug),
    });
    return () => cleanupSeo(["stack-detail-jsonld"]);
  }, [lang, stack, toolBySlug]);

  if (!stack) return <Navigate to={`${prefix}/stacks`} replace />;

  const uses = STACK_USES[stack.id] || [];
  const stackTools = stack.tools.map((slot) => ({ slot, tool: toolBySlug.get(slot.slug) })).filter((item) => item.tool);
  const toolDecisionStats = stack.tools.reduce(
    (stats, slot) => {
      const status = getToolDecisionStatus(slot.role).key;
      stats[status] += 1;
      return stats;
    },
    { core: 0, conditional: 0, challenge: 0 }
  );
  const stackLayersBase = STACK_LAYERS.map((layer) => ({
    ...layer,
    tools: stackTools.filter(({ slot }) => {
      const role = `${slot.role} ${slot.roleEn}`.toLowerCase();
      return layer.match.some((keyword) => role.includes(keyword));
    }),
  })).filter((layer) => layer.tools.length > 0);
  const assignedSlugs = new Set(stackLayersBase.flatMap((layer) => layer.tools.map(({ slot }) => slot.slug)));
  const unassignedTools = stackTools.filter(({ slot }) => !assignedSlugs.has(slot.slug));
  const stackLayers = unassignedTools.length > 0
    ? [
      ...stackLayersBase,
      {
        id: "other",
        titleFr: "Autres outils utiles",
        titleEn: "Other useful tools",
        match: [],
        tools: unassignedTools,
      },
    ]
    : stackLayersBase;

  return (
    <div className="min-h-screen bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">

          <Link
            to={`${prefix}/stacks`}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("Toutes les stacks", "All stacks")}
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              {t(personaLabel(stack.persona, "fr"), personaLabel(stack.persona, "en"))}
            </span>
            <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              {t(stageLabel(stack.stage, "fr"), stageLabel(stack.stage, "en"))}
            </span>
            <span className="rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
              {stack.monthlyBudget}€/mois
            </span>
          </div>

          <h1
            className="font-display text-foreground"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.15 }}
          >
            {t(stack.title, stack.titleEn)}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            {t(stack.editorial, stack.editorialEn)}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StackMetric label={t("Outils cartographiés", "Mapped tools")} value={`${stack.tools.length}`} />
            <StackMetric label={t("Budget repère", "Budget baseline")} value={`${stack.monthlyBudget}€/${t("mois", "mo")}`} />
            <StackMetric label={t("Économie repère", "Savings baseline")} value={`${stack.savings}€/${t("mois", "mo")}`} />
            <StackMetric
              label={t("Décisions", "Decisions")}
              value={`${toolDecisionStats.core}/${toolDecisionStats.conditional}/${toolDecisionStats.challenge}`}
              hint={t("socle · conditionnel · à challenger", "core · conditional · challenge")}
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-lg">
              <Link to={`${prefix}/selector`}>
                {t("Analyser ma stack", "Analyze my stack")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-lg">
              <a href="#utilisations">{t("Voir les cas d'usage", "See use cases")}</a>
            </Button>
          </div>

        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 py-3 text-sm font-semibold text-muted-foreground">
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#overview">
            {t("Synthèse", "Summary")}
          </a>
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#stack">
            {t("Cartographie", "Map")}
          </a>
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#questions">
            {t("Questions", "Questions")}
          </a>
          <a className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 transition-colors hover:border-primary hover:text-primary" href="#utilisations">
            {t("Scénarios", "Scenarios")}
          </a>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6">

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        <section id="overview" className="scroll-mt-24 border-b border-border py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-6">
                {t("Stack par couche", "Stack by layer")}
              </p>
              <div className="space-y-4">
                {stackLayers.map((layer) => {
                  const percent = Math.round((layer.tools.length / stack.tools.length) * 100);
                  return (
                    <div key={layer.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                        <span className="font-semibold text-foreground">{t(layer.titleFr, layer.titleEn)}</span>
                        <span className="font-mono text-muted-foreground">{layer.tools.length} · {percent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(percent, 8)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg bg-secondary/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {t("Lecture ToolTrim", "ToolTrim read")}
              </p>
              <div className="grid gap-4">
                <DecisionNote title={t("À copier si", "Copy it if")} text={t(stack.bestFor, stack.bestForEn)} />
                <DecisionNote title={t("À surveiller", "Watch")} text={t(stack.risk, stack.riskEn)} />
                <DecisionNote title={t("À éviter si", "Skip it if")} text={t(stack.avoidIf, stack.avoidIfEn)} />
              </div>
            </div>
          </div>
        </section>

        {/* ── OUTILS ─────────────────────────────────────────────────────── */}
        <section id="stack" className="scroll-mt-24 border-b border-border py-12">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              {t("Cartographie", "Map")}
            </p>
            <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
              {t("Les outils rangés par rôle, avec le niveau de décision.", "Tools grouped by role, with the decision level.")}
            </h2>
          </div>

          <div className="space-y-10">
            {stackLayers.map((layer) => (
              <div key={layer.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
                      {t(layer.titleFr, layer.titleEn)}
                    </h3>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {layer.tools.length} {t("outils", "tools")}
                  </span>
                </div>
                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {layer.tools.map(({ slot, tool }) => (
                    <Link
                      key={slot.slug}
                      to={`${prefix}/tool/${tool!.slug}`}
                      className="group grid gap-4 p-4 transition-colors hover:bg-primary/5 md:grid-cols-[1.05fr_0.95fr_1.25fr_auto] md:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <ToolLogo tool={tool!} size={36} className="shrink-0 rounded-md" />
                        <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                          {tool!.name}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{t(slot.role, slot.roleEn)}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{t(slot.reason, slot.reasonEn)}</p>
                      <ToolStatusBadge status={getToolDecisionStatus(slot.role)} t={t} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CHECKPOINTS ────────────────────────────────────────────────── */}
        <section id="questions" className="scroll-mt-24 border-b border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-8">
            {t("Questions à trancher", "Questions to answer")}
          </p>
          <div className="space-y-10">
            {stack.checkpoints.map((cp, i) => (
              <div key={i} className="grid grid-cols-[2rem_1fr] gap-4">
                <span
                  className="font-mono text-2xl font-bold leading-none"
                  style={{ color: "hsl(var(--muted-foreground) / 0.25)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-base font-semibold leading-6 text-foreground">
                    {t(cp.q, cp.qEn)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(cp.hint, cp.hintEn)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CAS D'USAGE ────────────────────────────────────────────────── */}
        <section id="utilisations" className="scroll-mt-24 border-b border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-8">
            {t("Dans la vraie vie", "In real life")}
          </p>
          <div className="space-y-12">
            {uses.map((use, index) => {
              const useTools = use.toolSlugs.map((toolSlug) => toolBySlug.get(toolSlug)).filter(Boolean);
              return (
                <article key={use.title}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground mb-1">
                        {t("Scénario", "Scenario")} {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3
                        className="font-display text-foreground"
                        style={{ fontSize: "clamp(1.125rem, 2vw, 1.375rem)", fontWeight: 600, letterSpacing: "-0.015em" }}
                      >
                        {t(use.title, use.titleEn)}
                      </h3>
                    </div>
                    <div className="flex -space-x-2 shrink-0">
                      {useTools.map((tool) => (
                        <ToolLogo key={tool!.id} tool={tool!} size={32} className="rounded-md border-2 border-background bg-background" />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-muted-foreground mb-6">
                    {t(use.description, use.descriptionEn)}
                  </p>

                  <ol className="space-y-3 border-l-2 border-border pl-5">
                    {(lang === "fr" ? use.workflow : use.workflowEn).map((step, stepIndex) => (
                      <li key={step} className="relative">
                        <span className="absolute -left-[1.65rem] flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
                          <span className="font-mono text-[10px] font-bold text-primary">
                            {String(stepIndex + 1)}
                          </span>
                        </span>
                        <p className="text-sm leading-6 text-foreground">{step}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {useTools.map((tool) => (
                      <Link
                        key={tool!.id}
                        to={`${prefix}/tool/${tool!.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        <ToolLogo tool={tool!} size={14} className="rounded" />
                        {tool!.name}
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            {t("Diagnostic", "Diagnostic")}
          </p>
          <h2
            className="font-display text-foreground mb-4"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            {t("Ce guide part d'un profil type. Toi, tu as déjà une stack.", "This guide starts from a typical profile. You already have a stack.")}
          </h2>
          <p className="text-sm leading-7 text-muted-foreground mb-8 max-w-xl">
            {t(
              "Le diagnostic personnalisé regarde ce que tu paies vraiment — outils actifs vs dormants, doublons, plans surévalués. Résultat en moins de 3 minutes.",
              "The personalized diagnostic looks at what you actually pay — active vs dormant tools, duplicates, overpriced plans. Result in under 3 minutes."
            )}
          </p>
          <Button asChild size="lg" className="rounded-lg">
            <Link to={`${prefix}/selector`}>
              {t("Analyser ma stack", "Analyze my stack")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

      </div>
    </div>
  );
};

function personaLabel(persona: StackPersona, locale: "fr" | "en") {
  const item = STACK_PERSONAS.find((option) => option.value === persona);
  return locale === "fr" ? item?.label || persona : item?.labelEn || persona;
}

function stageLabel(stage: StackStage, locale: "fr" | "en") {
  const item = STACK_STAGES.find((option) => option.value === stage);
  return locale === "fr" ? item?.label || stage : item?.labelEn || stage;
}

function StackMetric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs font-medium text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DecisionNote({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function ToolStatusBadge({
  status,
  t,
}: {
  status: ReturnType<typeof getToolDecisionStatus>;
  t: (fr: string, en?: string) => string;
}) {
  return (
    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
      {t(status.labelFr, status.labelEn)}
    </span>
  );
}

function getToolDecisionStatus(role: string) {
  const normalizedRole = role.toLowerCase();
  const challengeKeywords = [
    "avancé",
    "advanced",
    "suite",
    "backlinks",
    "connecteurs",
    "connectors",
    "handoff",
    "vectoriel",
    "photo",
    "crm agence",
  ];
  const optionalKeywords = [
    "plugin",
    "feedback",
    "prospection",
    "social",
    "seo",
    "ux",
    "workshop",
    "atelier",
    "prototype",
    "ia",
  ];

  if (challengeKeywords.some((keyword) => normalizedRole.includes(keyword))) {
    return {
      key: "challenge" as const,
      labelFr: "À challenger",
      labelEn: "Challenge",
      className: "border-destructive/25 bg-destructive/8 text-destructive",
    };
  }

  if (optionalKeywords.some((keyword) => normalizedRole.includes(keyword))) {
    return {
      key: "conditional" as const,
      labelFr: "Conditionnel",
      labelEn: "Conditional",
      className: "border-primary/25 bg-primary/8 text-primary",
    };
  }

  return {
    key: "core" as const,
    labelFr: "Socle",
    labelEn: "Core",
    className: "border-keep/25 bg-keep/10 text-keep",
  };
}

export default StackDetailPage;
