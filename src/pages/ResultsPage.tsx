import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, getToolLogoUrl } from "@/hooks/useSupabaseData";
import {
  SelectorFormData, ScoredTool, SelectorResults,
  TJM_OPTIONS, PERSONAS, PHASE_OPTIONS,
} from "@/data/types";
import { generateScoringResults } from "@/lib/scoring";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowRight, AlertTriangle, CheckCircle2, ArrowUpRight,
  Copy, ExternalLink, Info, Sparkles, Pencil,
  ChevronRight, Shield, Wallet, Layers, UserCircle, TrendingDown,
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

/* ═══════════════ Tiny helpers ═══════════════ */

const Tip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex"><Info className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" /></button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-xs">{text}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const Logo = ({ tool, size = 36 }: { tool: ScoredTool["tool"]; size?: number }) => {
  const url = getToolLogoUrl(tool);
  const [err, setErr] = useState(false);
  if (!url || err) return (
    <span className="flex shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold" style={{ width: size, height: size }}>
      {tool.name.charAt(0)}
    </span>
  );
  return <img src={url} alt="" loading="lazy" className="shrink-0 rounded-xl bg-muted object-contain" style={{ width: size, height: size }} onError={() => setErr(true)} />;
};

/* ═══════════════ Main ═══════════════ */

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

  /* ── init ── */
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
    const url = token ? `${window.location.origin}${prefix}/results/${token}` : `${window.location.origin}${prefix}/selector/results`;
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
        name: s.tool.name, x: s.tool.defaultMonthlyPrice, y: s.tool.timeGainedHoursPerMonth || 0,
        valueIndex: s.valueIndex, valueCreated: s.valueCreated,
        fill: s.action === "recommend" ? "hsl(var(--keep))" : s.action === "cancel" ? "hsl(var(--cancel))" : "hsl(var(--muted-foreground))",
      }));
  }, [results]);

  const roiData = useMemo(() => {
    if (!results || tjmMedian === 0) return [];
    return results.recommended.filter((s) => s.valueCreated > 0).map((s) => ({
      name: s.tool.name, tool: s.tool, cost: s.tool.defaultMonthlyPrice,
      hours: s.tool.timeGainedHoursPerMonth || 0, valueCreated: s.valueCreated,
      valueIndex: s.valueIndex, verdict: s.finalScore > 80 ? "Excellent" : s.finalScore > 60 ? t("Bon", "Good") : t("Neutre", "Neutral"),
    }));
  }, [results, tjmMedian, t]);

  if (!results || !form) return null;

  const persona = PERSONAS.find((p) => p.value === form.persona);
  const phase = PHASE_OPTIONS.find((p) => p.value === form.projectPhase);
  const tjmLabel = TJM_OPTIONS.find((o) => o.value === form.tjm);
  const stackCost = form.currentTools.reduce((s, ct) => s + ct.monthlyCost, 0);

  const healthPct = results.stackHealthScore;
  const healthTag = healthPct > 80
    ? { label: t("Optimisée", "Optimized"), cls: "text-keep" }
    : healthPct >= 50
    ? { label: t("À revoir", "Needs review"), cls: "text-primary" }
    : { label: t("Dette détectée", "Debt detected"), cls: "text-cancel" };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="min-h-screen bg-background">

      {/* ────────────────────────────────────────────
          HEADER — Title + Share
          ──────────────────────────────────────────── */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              {t("Analyse de votre stack", "Stack Analysis")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{results.personaMessage}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`${prefix}/selector`)}
              className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary md:inline-flex"
            >
              <Pencil className="h-3.5 w-3.5" /> {t("Modifier", "Edit")}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? t("Copié !", "Copied!") : t("Partager", "Share")}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 md:px-10 md:py-8">

        {/* ────────────────────────────────────────────
            KPI CARDS ROW — Colored gradient cards
            ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">

          {/* Card 1 — Stack Health */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg shadow-primary/10">
            <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">Stack Health</p>
            <p className="mt-2 font-heading text-4xl font-extrabold tabular-nums leading-none">
              {results.hasCurrentTools && healthPct >= 0 ? healthPct : "—"}
            </p>
            <p className="mt-1.5 flex items-center gap-1 text-xs font-medium opacity-90">
              {healthPct < 50 && <AlertTriangle className="h-3 w-3" />}
              {healthPct > 80 && <CheckCircle2 className="h-3 w-3" />}
              {results.hasCurrentTools ? healthTag.label : t("Non calculé", "Not calculated")}
            </p>
          </div>

          {/* Card 2 — Savings */}
          <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 shadow-sm">
            <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cancel/10">
              <TrendingDown className="h-4.5 w-4.5 text-cancel" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("Économies", "Savings")}
            </p>
            <p className={`mt-2 font-heading text-4xl font-extrabold tabular-nums leading-none ${results.totalSavingsMonthly > 0 ? "text-cancel" : "text-muted-foreground/30"}`}>
              {results.totalSavingsMonthly}€
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {results.totalSavingsMonthly > 0
                ? `${t("soit", "i.e.")} ${results.totalSavingsAnnual}€/${t("an", "yr")}`
                : t("Aucune économie détectée", "No savings detected")}
            </p>
          </div>

          {/* Card 3 — Current Stack */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-keep to-keep/80 p-5 text-keep-foreground shadow-lg shadow-keep/10">
            <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">
              {t("Stack actuelle", "Current Stack")}
            </p>
            <p className="mt-2 font-heading text-4xl font-extrabold tabular-nums leading-none">
              {form.currentTools.length}
            </p>
            <p className="mt-1.5 text-xs font-medium opacity-90">
              {t("outils", "tools")} · {stackCost}€/{t("mois", "mo")}
            </p>
          </div>

          {/* Card 4 — Profile */}
          <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 shadow-sm">
            <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <UserCircle className="h-4.5 w-4.5 text-primary" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("Profil", "Profile")}
            </p>
            <p className="mt-2 font-heading text-xl font-bold leading-tight">
              {persona?.name || "—"}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {tjmLabel ? (lang === "fr" ? tjmLabel.label : tjmLabel.labelEn) : "—"}
              <span className="mx-1 opacity-30">·</span>
              {phase ? (lang === "fr" ? phase.label : phase.labelEn) : "—"}
            </p>
          </div>
        </div>

        {/* ────────────────────────────────────────────
            MAIN CONTENT — Two columns
            ──────────────────────────────────────────── */}
        <div className="mt-8 grid gap-6 lg:grid-cols-5 lg:gap-8">

          {/* LEFT COLUMN — Savings (2/5) */}
          <section className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold">{t("Économies identifiées", "Savings identified")}</h2>
              <Tip text={t("Outils à score < 40 ou remplaçables par une alternative gratuite.", "Tools scoring < 40 or replaceable by a free alternative.")} />
            </div>

            {results.toCancel.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-keep/10">
                  <CheckCircle2 className="h-7 w-7 text-keep" />
                </div>
                <p className="mt-4 max-w-[220px] text-sm text-muted-foreground">
                  {t("Votre stack semble déjà optimisée.", "Your stack seems already optimized.")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Total savings mini-banner */}
                <div className="flex items-center justify-between rounded-xl bg-cancel/5 border border-cancel/15 px-4 py-3">
                  <span className="text-sm font-medium text-cancel">
                    {t("Total économisable", "Total saveable")}
                  </span>
                  <span className="font-heading text-lg font-bold tabular-nums text-cancel">
                    -{results.totalSavingsMonthly}€/{t("mois", "mo")}
                  </span>
                </div>

                {results.toCancel.map((s) => (
                  <div key={s.tool.id} className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/20">
                    <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-cancel" />
                    <div className="flex items-start gap-3 pl-1.5">
                      <Logo tool={s.tool} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold">{s.tool.name}</h3>
                          <span className="rounded-md bg-cancel/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-cancel">
                            -{s.tool.defaultMonthlyPrice}€/{t("mois", "mo")}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{s.cancelReason}</p>
                        {s.freeAlt && s.freeAlt.slug !== s.tool.slug && (
                          <Link to={`${prefix}/tool/${s.freeAlt.slug}`} className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            {t("Alternative :", "Alternative:")} {s.freeAlt.name}
                          </Link>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-cancel">
                        -{s.tool.defaultMonthlyPrice * 12}€/{t("an", "yr")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT COLUMN — Top Recommendations (3/5) */}
          <section className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold">{t("Meilleurs outils pour vous", "Best tools for you")}</h2>
              <Tip text={t("Score = pertinence (60%) + valeur (40%). Top 3.", "Score = pertinence (60%) + value (40%). Top 3.")} />
            </div>

            {results.recommended.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <p className="mt-4 max-w-[260px] text-sm text-muted-foreground">
                  {!results.hasCurrentTools
                    ? t("Ajoutez vos outils actuels pour une analyse complète.", "Add your current tools for a complete analysis.")
                    : t("Votre stack semble déjà bien optimisée.", "Your stack seems well optimized.")}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                {results.recommended.slice(0, 3).map((s) => {
                  const badge = s.finalScore > 80
                    ? { text: "Excellent", cls: "border-keep/20 bg-keep/10 text-keep" }
                    : { text: t("Bon", "Good"), cls: "border-primary/20 bg-primary/10 text-primary" };
                  return (
                    <div key={s.tool.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md hover:shadow-primary/5">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <Logo tool={s.tool} size={44} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold">{s.tool.name}</h3>
                            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>{badge.text}</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{s.tool.shortDescription}</p>
                          {tjmMedian > 0 && s.valueCreated > 0 && (
                            <p className="mt-1.5 text-sm font-semibold tabular-nums text-keep">
                              {t(`Vaut ~${s.valueCreated}€/mois`, `Worth ~€${s.valueCreated}/mo`)}
                            </p>
                          )}
                          {s.tool.verdict?.threshold && (
                            <p className="mt-1 text-xs italic text-muted-foreground/50">{s.tool.verdict.threshold}</p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 sm:w-44">
                        {s.tool.affiliateLink ? (
                          <a href={s.tool.affiliateLink} target="_blank" rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
                            {t("Essayer", "Try it")} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <Link to={`${prefix}/tool/${s.tool.slug}`}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                            {t("Voir la fiche", "Details")} <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ────────────────────────────────────────────
            TABS — All reco / Quadrant / ROI
            ──────────────────────────────────────────── */}
        <div className="mt-10">
          <Tabs defaultValue="all">
            <TabsList className="gap-1 rounded-xl border border-border bg-card p-1">
              <TabsTrigger value="all" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-secondary data-[state=active]:shadow-sm">
                {t("Toutes les recommandations", "All recommendations")}
              </TabsTrigger>
              {results.hasCurrentTools && form.currentTools.length >= 3 && (
                <TabsTrigger value="quadrant" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-secondary data-[state=active]:shadow-sm">
                  {t("Quadrant", "Quadrant")}
                </TabsTrigger>
              )}
              <TabsTrigger value="roi" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-secondary data-[state=active]:shadow-sm">
                {t("Analyse ROI", "ROI Analysis")}
              </TabsTrigger>
            </TabsList>

            {/* All */}
            <TabsContent value="all">
              {results.recommended.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">{t("Aucune recommandation.", "No recommendations.")}</p>
              ) : (
                <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.recommended.map((s) => {
                    const badge = s.finalScore > 80
                      ? { text: "Excellent", cls: "border-keep/20 bg-keep/10 text-keep" }
                      : { text: t("Bon", "Good"), cls: "border-primary/20 bg-primary/10 text-primary" };
                    return (
                      <div key={s.tool.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md hover:shadow-primary/5">
                        <div className="flex items-start gap-3">
                          <Logo tool={s.tool} size={32} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold">{s.tool.name}</h3>
                              <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>{badge.text}</span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{s.tool.shortDescription}</p>
                            {tjmMedian > 0 && s.valueCreated > 0 && (
                              <p className="mt-1.5 text-sm font-semibold tabular-nums text-keep">~{s.valueCreated}€/{t("mois", "mo")}</p>
                            )}
                            {s.tool.verdict?.threshold && (
                              <p className="mt-1 text-xs italic text-muted-foreground/50">{s.tool.verdict.threshold}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-auto pt-4">
                          {s.tool.affiliateLink ? (
                            <a href={s.tool.affiliateLink} target="_blank" rel="noopener noreferrer"
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
                              {t("Essayer", "Try it")} <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <Link to={`${prefix}/tool/${s.tool.slug}`}
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                              {t("Voir la fiche", "Details")} <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Quadrant */}
            {results.hasCurrentTools && form.currentTools.length >= 3 && (
              <TabsContent value="quadrant">
                <div className="mt-2 rounded-2xl border border-border bg-card p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 15, right: 25, bottom: 35, left: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" dataKey="x"
                        label={{ value: t("Coût (€/mois)", "Cost (€/mo)"), position: "bottom", offset: 10, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis type="number" dataKey="y"
                        label={{ value: t("h/mois", "h/mo"), angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <RechartsTooltip content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                            <p className="font-semibold text-popover-foreground">{d.name}</p>
                            <p className="text-muted-foreground">{t("Indice :", "Index:")} {d.valueIndex}</p>
                            {d.valueCreated > 0 && <p className="font-medium text-keep">~{d.valueCreated}€/{t("mois", "mo")}</p>}
                          </div>
                        );
                      }} />
                      <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 40 }]} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 4"
                        label={{ value: t("Frontière d'efficience", "Efficiency frontier"), position: "end", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
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
                <div className="mt-2 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                  <Wallet className="h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">{t("Renseignez votre TJM pour l'analyse ROI.", "Enter your daily rate for ROI analysis.")}</p>
                  <button onClick={() => navigate(`${prefix}/selector`)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary">
                    {t("Retour", "Back")} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : roiData.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">{t("Aucune donnée.", "No data.")}</p>
              ) : (
                <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Outil", "Tool")}</th>
                          <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Coût/mois", "Cost/mo")}</th>
                          <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("h gagnées", "h gained")}</th>
                          <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Valeur", "Value")}</th>
                          <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Indice", "Index")}</th>
                          <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Verdict", "Verdict")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roiData.map((row, i) => (
                          <tr key={row.name} className={`border-b border-border/40 last:border-0 transition-colors hover:bg-secondary/10 ${i % 2 === 1 ? "bg-secondary/10" : ""}`}>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <Logo tool={row.tool} size={24} />
                                <span className="font-medium">{row.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums">{row.cost}€</td>
                            <td className="px-5 py-3.5 text-right tabular-nums">{row.hours}h</td>
                            <td className="px-5 py-3.5 text-right tabular-nums font-medium text-keep">{row.valueCreated}€</td>
                            <td className="px-5 py-3.5 text-right tabular-nums font-bold">{row.valueIndex}</td>
                            <td className="px-5 py-3.5 text-right">
                              <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                                row.verdict === "Excellent" ? "border-keep/20 bg-keep/10 text-keep"
                                : row.verdict === t("Bon", "Good") ? "border-primary/20 bg-primary/10 text-primary"
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

        {/* Footer */}
        <div className="mt-10 mb-6 flex flex-wrap items-center justify-center gap-3">
          <Link to={`${prefix}/tools`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            {t("Catalogue des outils", "Tool catalog")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to={`${prefix}/selector`} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary">
            {t("Refaire le test", "Retake test")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
