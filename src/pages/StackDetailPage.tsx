import { useEffect, useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { cleanupSeo, SEO_BASE, setHreflang, setJsonLd, setSeoTags } from "@/lib/seo";
import { STACK_PERSONAS, STACK_STAGES, STACKS, STACK_USES, type StackPersona, type StackStage } from "@/data/stacks";

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

  return (
    <div className="min-h-screen bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">

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

          <p className="mt-4 text-base leading-7 text-muted-foreground max-w-2xl">
            {t(stack.subtitle, stack.subtitleEn)}
          </p>

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

      <div className="mx-auto max-w-3xl px-6">

        {/* ── EDITORIAL ──────────────────────────────────────────────────── */}
        <section className="border-b border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            {t("Le contexte", "The context")}
          </p>
          <p className="text-lg leading-8 text-foreground">
            {t(stack.editorial, stack.editorialEn)}
          </p>
          <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{stack.monthlyBudget}€</span>
              {t("/mois visé", "/month target")}
            </span>
            <span className="text-border">·</span>
            <span>
              {t("Jusqu'à ", "Up to ")}
              <span className="font-semibold text-foreground">+{stack.savings}€</span>
              {t(" d'économies possibles", " in potential savings")}
            </span>
            <span className="text-border">·</span>
            <span>
              <span className="font-semibold text-foreground">{stack.tools.length}</span>
              {t(" outils", " tools")}
            </span>
          </div>
        </section>

        {/* ── PIÈGE ──────────────────────────────────────────────────────── */}
        <section className="border-b border-border py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-destructive/70 mb-3">
            {t("Le piège classique", "The classic trap")}
          </p>
          <p className="text-base leading-7 text-foreground">
            {t(stack.risk, stack.riskEn)}
          </p>
        </section>

        {/* ── OUTILS ─────────────────────────────────────────────────────── */}
        <section className="border-b border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-6">
            {t("La stack", "The stack")}
          </p>
          <div className="space-y-0 divide-y divide-border">
            {stackTools.map(({ slot, tool }) => (
              <Link
                key={slot.slug}
                to={`${prefix}/tool/${tool!.slug}`}
                className="group flex items-start gap-4 py-5 transition-colors hover:text-primary"
              >
                <ToolLogo tool={tool!} size={40} className="mt-0.5 shrink-0 rounded-lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {tool!.name}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t(slot.role, slot.roleEn)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t(slot.reason, slot.reasonEn)}
                  </p>
                </div>
                <ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── CHECKPOINTS ────────────────────────────────────────────────── */}
        <section className="border-b border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-8">
            {t("Avant de décider", "Before you decide")}
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

        {/* ── MON AVIS ───────────────────────────────────────────────────── */}
        <section className="border-b border-border py-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-8">
            {t("Mon avis", "My take")}
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold text-foreground mb-1">{t("Ça vaut le coup si", "Worth it if")}</p>
                <p className="text-sm leading-6 text-muted-foreground">{t(stack.bestFor, stack.bestForEn)}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/50" />
              <div>
                <p className="font-semibold text-foreground mb-1">{t("Je ne le copierais pas si", "I would skip it if")}</p>
                <p className="text-sm leading-6 text-muted-foreground">{t(stack.avoidIf, stack.avoidIfEn)}</p>
              </div>
            </div>
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

export default StackDetailPage;
