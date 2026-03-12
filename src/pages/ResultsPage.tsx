import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, getToolLogoUrl } from "@/hooks/useSupabaseData";
import {
  SelectorFormData, ScoredTool, SelectorResults,
  TJM_OPTIONS, PERSONAS, PHASE_OPTIONS, MATURITY_OPTIONS,
} from "@/data/types";
import { generateScoringResults } from "@/lib/scoring";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowRight, AlertTriangle, CheckCircle2, ArrowUpRight,
  Copy, ExternalLink, Info, Sparkles, Pencil, BarChart3,
  TrendingUp, Wallet, User, ChevronRight,
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

/* ════════════════ Sub-components ════════════════ */

const InfoTip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex">
          <Info className="h-3.5 w-3.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ToolLogo = ({ tool, size = 36 }: { tool: ScoredTool["tool"]; size?: number }) => {
  const logoUrl = getToolLogoUrl(tool);
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed)
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-foreground"
        style={{ width: size, height: size }}
      >
        {tool.name.charAt(0).toUpperCase()}
      </span>
    );
  return (
    <img
      src={logoUrl} alt="" loading="lazy"
      className="shrink-0 rounded-xl bg-secondary object-contain"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
};

/* Stat card for header */
const StatBlock = ({
  label, icon: Icon, children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
      <Icon className="h-4.5 w-4.5 text-white/50" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">{label}</p>
      {children}
    </div>
  </div>
);

/* Tool recommendation card */
const RecoCard = ({
  s, tjmMedian, prefix, t, compact = false,
}: {
  s: ScoredTool; tjmMedian: number; prefix: string;
  t: (fr: string, en: string) => string; compact?: boolean;
}) => {
  const scoreBadge = s.finalScore > 80
    ? { text: "Excellent", cls: "bg-keep/10 text-keep border-keep/20" }
    : { text: t("Bon", "Good"), cls: "bg-primary/10 text-primary border-primary/20" };

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5">
      <div className="flex items-start gap-3.5">
        <ToolLogo tool={s.tool} size={compact ? 32 : 40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-semibold leading-tight ${compact ? "text-sm" : "text-base"}`}>{s.tool.name}</h3>
            <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${scoreBadge.cls}`}>
              {scoreBadge.text}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{s.tool.shortDescription}</p>
          {tjmMedian > 0 && s.valueCreated > 0 && (
            <p className="mt-2 text-sm font-semibold tabular-nums text-keep">
              {t(`Vaut ~${s.valueCreated}€/mois pour votre profil`, `Worth ~€${s.valueCreated}/mo for your profile`)}
            </p>
          )}
          {s.tool.verdict?.threshold && (
            <p className="mt-1 text-xs italic text-muted-foreground/50">{s.tool.verdict.threshold}</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        {s.tool.affiliateLink ? (
          <a
            href={s.tool.affiliateLink} target="_blank" rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-all duration-200 hover:opacity-90"
          >
            {t("Essayer gratuitement", "Try for free")}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <Link
            to={`${prefix}/tool/${s.tool.slug}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-all duration-200 hover:opacity-90"
          >
            {t("Voir la fiche", "View details")}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

/* ════════════════ Main Page ════════════════ */

const ResultsPage = () => {
  const { t, prefix, lang } = useLang();
  const navigate = useNavigate();
  const { tools } = useTools();
  const [results, setResults] = useState<SelectorResults | null>(null);
  const [form, setForm] = useState<SelectorFormData | null>(null);
  const [copied, setCopied] = useState(false);

  const tjmMedian = useMemo(() => {
    if (!form?.tjm) return 0;
    return TJM_OPTIONS.find((o) => o.value === form.tjm)?.median || 0;
  }, [form]);

  useEffect(() => {
    if (tools.length === 0) return;
    const data = sessionStorage.getItem("tooltrim_selector");
    if (!data) { navigate(`${prefix}/selector`); return; }
    const parsed: SelectorFormData = JSON.parse(data);
    setForm(parsed);
    const r = generateScoringResults(parsed, tools, lang);
    setResults(r);

    supabase.from("selector_results").insert({
      persona: parsed.persona || "unknown",
      stack_health_score: r.stackHealthScore >= 0 ? r.stackHealthScore : null,
      recommended_tools: r.recommended.map((s) => ({ id: s.tool.id, score: s.finalScore })),
      tools_to_cancel: r.toCancel.map((s) => ({ id: s.tool.id, score: s.finalScore, saving: s.tool.defaultMonthlyPrice })),
      estimated_savings_monthly: r.totalSavingsMonthly,
      roi_analysis: r.recommended.map((s) => ({ id: s.tool.id, valueIndex: s.valueIndex, valueCreated: s.valueCreated })),
    } as any).select("share_token").single().then(({ data: row }) => {
      if (row) sessionStorage.setItem("tooltrim_share_token", (row as any).share_token);
    });
  }, [navigate, prefix, tools, lang]);

  const handleShare = async () => {
    const token = sessionStorage.getItem("tooltrim_share_token");
    const url = token
      ? `${window.location.origin}${prefix}/results/${token}`
      : `${window.location.origin}${prefix}/selector/results`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("Lien copié !", "Link copied!"));
    setTimeout(() => setCopied(false), 2000);
  };

  const quadrantData = useMemo(() => {
    if (!results) return [];
    return results.scoredTools
      .filter((s) => s.tool.defaultMonthlyPrice > 0 || (s.tool.timeGainedHoursPerMonth || 0) > 0)
      .map((s) => ({
        name: s.tool.name,
        x: s.tool.defaultMonthlyPrice,
        y: s.tool.timeGainedHoursPerMonth || 0,
        valueIndex: s.valueIndex,
        valueCreated: s.valueCreated,
        fill: s.action === "recommend"
          ? "hsl(var(--keep))"
          : s.action === "cancel"
          ? "hsl(var(--cancel))"
          : "hsl(var(--muted-foreground))",
        r: s.action === "neutral" ? 5 : 7,
      }));
  }, [results]);

  const roiData = useMemo(() => {
    if (!results || tjmMedian === 0) return [];
    return results.recommended
      .filter((s) => s.valueCreated > 0)
      .map((s) => ({
        name: s.tool.name,
        tool: s.tool,
        cost: s.tool.defaultMonthlyPrice,
        hours: s.tool.timeGainedHoursPerMonth || 0,
        valueCreated: s.valueCreated,
        valueIndex: s.valueIndex,
        verdict: s.finalScore > 80 ? "Excellent" : s.finalScore > 60 ? t("Bon", "Good") : t("Neutre", "Neutral"),
      }));
  }, [results, tjmMedian, t]);

  if (!results || !form) return null;

  const healthColor =
    results.stackHealthScore > 80 ? "text-keep" :
    results.stackHealthScore >= 50 ? "text-primary" :
    "text-cancel";
  const healthBadge =
    results.stackHealthScore > 80
      ? { text: t("Optimisée", "Optimized"), cls: "border-keep/30 bg-keep/10 text-keep" }
      : results.stackHealthScore >= 50
      ? { text: t("À revoir", "Needs review"), cls: "border-primary/30 bg-primary/10 text-primary" }
      : { text: t("Dette détectée", "Debt detected"), cls: "border-cancel/30 bg-cancel/10 text-cancel" };

  const persona = PERSONAS.find((p) => p.value === form.persona);
  const phase = PHASE_OPTIONS.find((p) => p.value === form.projectPhase);
  const tjmLabel = TJM_OPTIONS.find((o) => o.value === form.tjm);
  const stackCost = form.currentTools.reduce((sum, ct) => sum + ct.monthlyCost, 0);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">

      {/* ═══════════════════════════════════════════
          ZONE 1 — Dark header bar
          ═══════════════════════════════════════════ */}
      <header className="shrink-0 bg-[hsl(0,0%,4%)] text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-5 md:px-8 lg:px-10">
          {/* Top row: stats + share */}
          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
            <div className="flex flex-wrap items-start gap-x-8 gap-y-4 md:gap-x-10 lg:gap-x-14">

              {/* Stack Health */}
              {results.hasCurrentTools && results.stackHealthScore >= 0 && (
                <StatBlock label="Stack Health" icon={BarChart3}>
                  <p className={`mt-0.5 font-heading text-3xl font-extrabold tabular-nums leading-none md:text-4xl ${healthColor}`}>
                    {results.stackHealthScore}
                  </p>
                  <span className={`mt-1.5 inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${healthBadge.cls}`}>
                    {results.stackHealthScore < 50 && <AlertTriangle className="h-3 w-3" />}
                    {results.stackHealthScore > 80 && <CheckCircle2 className="h-3 w-3" />}
                    {healthBadge.text}
                  </span>
                </StatBlock>
              )}

              {/* Savings */}
              <StatBlock label={t("Économies identifiées", "Savings identified")} icon={Wallet}>
                <p className={`mt-0.5 font-heading text-3xl font-extrabold tabular-nums leading-none md:text-4xl ${results.totalSavingsMonthly > 0 ? "text-keep" : "text-white/30"}`}>
                  {results.totalSavingsMonthly}€
                  <span className="text-base font-normal text-white/30">/{t("mois", "mo")}</span>
                </p>
                {results.totalSavingsMonthly > 0 && (
                  <p className="mt-1 text-xs text-white/30 tabular-nums">
                    {t("soit", "i.e.")} {results.totalSavingsAnnual}€/{t("an", "yr")}
                  </p>
                )}
              </StatBlock>

              {/* Current stack */}
              <StatBlock label={t("Stack actuelle", "Current stack")} icon={TrendingUp}>
                <p className="mt-0.5 text-lg font-semibold leading-tight tabular-nums">
                  {form.currentTools.length} {t("outils", "tools")}
                  <span className="mx-1.5 text-white/20">·</span>
                  {stackCost}€/{t("mois", "mo")}
                </p>
              </StatBlock>

              {/* Profile */}
              <StatBlock label={t("Profil", "Profile")} icon={User}>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <p className="text-lg font-semibold leading-tight">{persona?.name || "—"}</p>
                  <button
                    onClick={() => navigate(`${prefix}/selector`)}
                    className="rounded-lg p-1 transition-colors hover:bg-white/10"
                  >
                    <Pencil className="h-3 w-3 text-white/40" />
                  </button>
                </div>
                <p className="mt-0.5 text-xs text-white/30">
                  {tjmLabel ? (lang === "fr" ? tjmLabel.label : tjmLabel.labelEn) : "—"}
                  <span className="mx-1 text-white/15">·</span>
                  {phase ? (lang === "fr" ? phase.label : phase.labelEn) : "—"}
                </p>
              </StatBlock>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white/90"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? t("Copié !", "Copied!") : t("Partager", "Share")}
            </button>
          </div>

          {/* Persona message */}
          {results.personaMessage && (
            <p className="mt-4 border-t border-white/[0.06] pt-3 text-[13px] leading-relaxed text-white/35">
              {results.personaMessage}
            </p>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          ZONE 2 + 3 — Scrollable body
          ═══════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto bg-secondary/40 dark:bg-[hsl(0,0%,6.5%)]">
        <div className="mx-auto max-w-[1440px] px-5 py-6 md:px-8 md:py-8 lg:px-10">

          {/* ── Zone 2: Two-column grid ── */}
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">

            {/* LEFT — Savings */}
            <section className="flex flex-col rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <h2 className="text-[15px] font-bold">{t("Économies identifiées", "Savings identified")}</h2>
                <InfoTip text={t(
                  "Outils à score < 40 ou remplaçables par une alternative gratuite couvrant les mêmes besoins.",
                  "Tools scoring < 40 or replaceable by a free alternative covering the same needs."
                )} />
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: "calc(50vh - 60px)" }}>
                {results.toCancel.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-keep/10">
                      <CheckCircle2 className="h-6 w-6 text-keep/60" />
                    </div>
                    <p className="mt-4 max-w-[240px] text-sm text-muted-foreground">
                      {t("Votre stack semble déjà optimisée pour votre profil.", "Your stack seems already optimized for your profile.")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.toCancel.map((s) => (
                      <div
                        key={s.tool.id}
                        className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30"
                      >
                        {/* Red left accent */}
                        <div className="absolute inset-y-0 left-0 w-[3px] bg-cancel" />
                        <div className="flex items-start gap-3 pl-2">
                          <ToolLogo tool={s.tool} size={32} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold">{s.tool.name}</h3>
                              <span className="rounded-lg border border-cancel/20 bg-cancel/8 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-cancel">
                                -{s.tool.defaultMonthlyPrice}€/{t("mois", "mo")}
                              </span>
                            </div>
                            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{s.cancelReason}</p>
                            {s.freeAlt && s.freeAlt.slug !== s.tool.slug && (
                              <Link
                                to={`${prefix}/tool/${s.freeAlt.slug}`}
                                className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-primary transition-colors hover:text-primary/80"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                {t("Alternative gratuite :", "Free alternative:")} {s.freeAlt.name}
                              </Link>
                            )}
                          </div>
                          <span className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums text-cancel">
                            -{s.tool.defaultMonthlyPrice * 12}€/{t("an", "yr")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT — Top 3 */}
            <section className="flex flex-col rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <h2 className="text-[15px] font-bold">{t("Meilleurs outils pour vous", "Best tools for you")}</h2>
                <InfoTip text={t(
                  "Score = pertinence profil (60%) + indice de valeur monétaire (40%). Top 3 outils.",
                  "Score = profile pertinence (60%) + monetary value index (40%). Top 3 tools."
                )} />
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: "calc(50vh - 60px)" }}>
                {results.recommended.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary/60" />
                    </div>
                    <p className="mt-4 max-w-[260px] text-sm text-muted-foreground">
                      {!results.hasCurrentTools
                        ? t("Ajoutez vos outils actuels pour une analyse complète.", "Add your current tools for a complete analysis.")
                        : t("Votre stack semble déjà bien optimisée.", "Your stack seems well optimized.")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.recommended.slice(0, 3).map((s) => (
                      <RecoCard key={s.tool.id} s={s} tjmMedian={tjmMedian} prefix={prefix} t={t} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ── Zone 3: Tabs ── */}
          <div className="mt-8">
            <Tabs defaultValue="all">
              <TabsList className="mb-1 gap-1 rounded-xl bg-secondary/60 p-1 dark:bg-card">
                <TabsTrigger value="all" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm dark:data-[state=active]:bg-secondary">
                  {t("Toutes les recommandations", "All recommendations")}
                </TabsTrigger>
                {results.hasCurrentTools && form.currentTools.length >= 3 && (
                  <TabsTrigger value="quadrant" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm dark:data-[state=active]:bg-secondary">
                    {t("Quadrant Efficacité", "Efficiency Quadrant")}
                  </TabsTrigger>
                )}
                <TabsTrigger value="roi" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm dark:data-[state=active]:bg-secondary">
                  {t("Analyse ROI", "ROI Analysis")}
                </TabsTrigger>
              </TabsList>

              {/* All reco */}
              <TabsContent value="all">
                {results.recommended.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    {t("Aucune recommandation disponible.", "No recommendations available.")}
                  </p>
                ) : (
                  <div className="grid gap-5 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                    {results.recommended.map((s) => (
                      <RecoCard key={s.tool.id} s={s} tjmMedian={tjmMedian} prefix={prefix} t={t} compact />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Quadrant */}
              {results.hasCurrentTools && form.currentTools.length >= 3 && (
                <TabsContent value="quadrant">
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <ResponsiveContainer width="100%" height={400}>
                      <ScatterChart margin={{ top: 15, right: 25, bottom: 35, left: 15 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" dataKey="x"
                          label={{ value: t("Coût (€/mois)", "Cost (€/mo)"), position: "bottom", offset: 10, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis type="number" dataKey="y"
                          label={{ value: t("h gagnées/mois", "h gained/mo"), angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <RechartsTooltip content={({ payload }) => {
                          if (!payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                              <p className="font-semibold text-popover-foreground">{d.name}</p>
                              <p className="text-muted-foreground">{t("Indice :", "Index:")} {d.valueIndex}</p>
                              {d.valueCreated > 0 && <p className="font-medium text-keep">{t(`~${d.valueCreated}€/mois`, `~€${d.valueCreated}/mo`)}</p>}
                            </div>
                          );
                        }} />
                        <ReferenceLine
                          segment={[{ x: 0, y: 0 }, { x: 100, y: 40 }]}
                          stroke="hsl(var(--muted-foreground))" strokeDasharray="6 4"
                          label={{ value: t("Frontière d'efficience", "Efficiency frontier"), position: "end", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
                        />
                        <Scatter data={quadrantData} />
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-keep" /> {t("Recommandé", "Recommended")}</span>
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cancel" /> {t("À annuler", "To cancel")}</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> {t("Neutre", "Neutral")}</span>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* ROI */}
              <TabsContent value="roi">
                {tjmMedian === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
                    <p className="text-sm text-muted-foreground">
                      {t("Renseignez votre TJM pour accéder à l'analyse ROI.", "Enter your daily rate to access ROI analysis.")}
                    </p>
                    <button
                      onClick={() => navigate(`${prefix}/selector`)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                    >
                      {t("Retour au sélecteur", "Back to selector")} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : roiData.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    {t("Aucune donnée ROI disponible.", "No ROI data available.")}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/40">
                            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Outil", "Tool")}</th>
                            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Coût/mois", "Cost/mo")}</th>
                            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("h gagnées", "h gained")}</th>
                            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Valeur créée", "Value created")}</th>
                            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Indice", "Index")}</th>
                            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Verdict", "Verdict")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roiData.map((row, i) => (
                            <tr key={row.name} className={`border-b border-border/50 last:border-0 transition-colors hover:bg-secondary/20 ${i % 2 === 1 ? "bg-secondary/15" : ""}`}>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <ToolLogo tool={row.tool} size={24} />
                                  <span className="font-medium">{row.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-right tabular-nums">{row.cost}€</td>
                              <td className="px-5 py-3.5 text-right tabular-nums">{row.hours}h</td>
                              <td className="px-5 py-3.5 text-right tabular-nums font-medium text-keep">{row.valueCreated}€</td>
                              <td className="px-5 py-3.5 text-right tabular-nums font-bold">{row.valueIndex}</td>
                              <td className="px-5 py-3.5 text-right">
                                <span className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                                  row.verdict === "Excellent"
                                    ? "border-keep/20 bg-keep/10 text-keep"
                                    : row.verdict === t("Bon", "Good")
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "text-muted-foreground"
                                }`}>{row.verdict}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 pb-4">
            <Link
              to={`${prefix}/tools`}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:opacity-90"
            >
              {t("Catalogue des outils", "Tool catalog")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={`${prefix}/selector`}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              {t("Refaire le test", "Retake the test")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
