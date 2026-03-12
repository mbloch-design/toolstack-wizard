import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, getToolLogoUrl } from "@/hooks/useSupabaseData";
import { SelectorFormData, ScoredTool, SelectorResults, TJM_OPTIONS, PERSONAS, PHASE_OPTIONS, MATURITY_OPTIONS } from "@/data/types";
import { generateScoringResults } from "@/lib/scoring";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowRight, TrendingDown, AlertTriangle, CheckCircle2,
  ArrowUpRight, Copy, ExternalLink, Info, Sparkles, Pencil,
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

/* ─────────────── helpers ─────────────── */

const InfoTip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ToolLogoSmall = ({ tool, size = 36 }: { tool: ScoredTool["tool"]; size?: number }) => {
  const logoUrl = getToolLogoUrl(tool);
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed)
    return (
      <span className="flex shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold" style={{ width: size, height: size }}>
        {tool.name.charAt(0)}
      </span>
    );
  return <img src={logoUrl} alt="" className="shrink-0 rounded-lg object-contain" style={{ width: size, height: size }} onError={() => setFailed(true)} />;
};

/* ─────────────── main ─────────────── */

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
    const url = token ? `${window.location.origin}${prefix}/results/${token}` : `${window.location.origin}${prefix}/selector/results`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("Lien copié !", "Link copied!"));
    setTimeout(() => setCopied(false), 2000);
  };

  /* quadrant data */
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
        fill: s.action === "recommend" ? "#22C55E" : s.action === "cancel" ? "#EF4444" : "#6B7280",
        r: s.action === "neutral" ? 6 : 8,
      }));
  }, [results]);

  /* roi table */
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
        verdict: s.finalScore > 80 ? "Excellent" : s.finalScore > 60 ? "Bon" : "Neutre",
      }));
  }, [results, tjmMedian]);

  if (!results || !form) return null;

  const healthLabel = results.stackHealthScore > 80
    ? { text: t("Optimisée", "Optimized"), cls: "bg-keep/15 text-keep" }
    : results.stackHealthScore >= 50
    ? { text: t("À revoir", "Needs review"), cls: "bg-primary/15 text-primary" }
    : { text: t("Dette détectée", "Debt detected"), cls: "bg-cancel/15 text-cancel" };

  const persona = PERSONAS.find((p) => p.value === form.persona);
  const phase = PHASE_OPTIONS.find((p) => p.value === form.projectPhase);
  const maturity = MATURITY_OPTIONS.find((m) => m.value === form.techMaturity);
  const tjmLabel = TJM_OPTIONS.find((o) => o.value === form.tjm);
  const stackCost = form.currentTools.reduce((s, ct) => s + ct.monthlyCost, 0);
  const fewRecommendations = results.recommended.length < 3 && results.toCancel.length === 0;

  /* ─────────────── RENDER ─────────────── */
  return (
    <div className="flex min-h-screen flex-col">

      {/* ══════════ ZONE 1 — Header fixe ══════════ */}
      <header className="shrink-0 border-b border-border/20 bg-[#0A0A0A] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10 md:py-6">
          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6 md:gap-10">

            {/* Bloc 1 — Stack Health Score */}
            {results.hasCurrentTools && results.stackHealthScore >= 0 && (
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-widest text-gray-500">Stack Health</span>
                <span className="mt-1 font-heading text-4xl font-bold tabular-nums md:text-5xl">
                  {results.stackHealthScore}
                </span>
                <span className={`mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${healthLabel.cls}`}>
                  {results.stackHealthScore < 50 && <AlertTriangle className="h-3 w-3" />}
                  {results.stackHealthScore > 80 && <CheckCircle2 className="h-3 w-3" />}
                  {healthLabel.text}
                </span>
              </div>
            )}

            {/* Separator */}
            {results.hasCurrentTools && results.stackHealthScore >= 0 && (
              <div className="hidden h-14 w-px bg-white/10 md:block" />
            )}

            {/* Bloc 2 — Économies */}
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-widest text-gray-500">
                {t("Économies identifiées", "Savings identified")}
              </span>
              <span className={`mt-1 font-heading text-4xl font-bold tabular-nums md:text-5xl ${results.totalSavingsMonthly > 0 ? "text-[#22C55E]" : "text-gray-500"}`}>
                {results.totalSavingsMonthly}€<span className="text-lg font-normal text-gray-500">/{t("mois", "mo")}</span>
              </span>
              {results.totalSavingsMonthly > 0 && (
                <span className="text-[13px] text-gray-500">
                  {t("soit", "i.e.")} {results.totalSavingsAnnual}€/{t("an", "yr")}
                </span>
              )}
            </div>

            <div className="hidden h-14 w-px bg-white/10 md:block" />

            {/* Bloc 3 — Stack actuelle */}
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-widest text-gray-500">
                {t("Votre stack actuelle", "Your current stack")}
              </span>
              <span className="mt-1 font-heading text-lg font-semibold tabular-nums">
                {form.currentTools.length} {t("outils", "tools")} · {stackCost}€/{t("mois", "mo")}
              </span>
            </div>

            <div className="hidden h-14 w-px bg-white/10 md:block" />

            {/* Bloc 4 — Profil */}
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-widest text-gray-500">
                {t("Votre profil", "Your profile")}
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-heading text-lg font-semibold">
                  {persona?.name || "—"}
                </span>
                <button onClick={() => navigate(`${prefix}/selector`)} className="rounded p-1 transition-colors hover:bg-white/10">
                  <Pencil className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
              <span className="text-[13px] text-gray-500">
                {tjmLabel ? (lang === "fr" ? tjmLabel.label : tjmLabel.labelEn) : "—"} · {phase ? (lang === "fr" ? phase.label : phase.labelEn) : "—"}
              </span>
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? t("Copié !", "Copied!") : t("Partager", "Share")}
          </button>
        </div>

        {/* Persona message */}
        {results.personaMessage && (
          <div className="border-t border-white/5 bg-white/[0.02] px-6 py-3 md:px-10">
            <p className="mx-auto max-w-7xl text-sm text-gray-400">{results.personaMessage}</p>
          </div>
        )}
      </header>

      {/* ══════════ ZONE 2 — Grid principale ══════════ */}
      <div className="flex-1 overflow-hidden bg-secondary/30 dark:bg-[#111111]">
        <div className="mx-auto grid h-full max-w-7xl gap-6 p-6 md:grid-cols-2 md:p-8 lg:gap-8" style={{ minHeight: 0 }}>

          {/* ── Colonne gauche : Économies ── */}
          <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <h2 className="text-base font-bold">{t("Économies identifiées", "Savings identified")}</h2>
              <InfoTip text={t("Outils avec score < 40 ou remplaçables par une alternative gratuite.", "Tools scoring < 40 or replaceable by a free alternative.")} />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {results.toCancel.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("Votre stack semble déjà optimisée pour votre profil.", "Your stack seems already optimized for your profile.")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.toCancel.map((s) => (
                    <div key={s.tool.id} className="rounded-xl border-l-[3px] border-l-cancel bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                      <div className="flex items-start gap-3">
                        <ToolLogoSmall tool={s.tool} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{s.tool.name}</h3>
                            <span className="rounded-full bg-cancel/10 px-2 py-0.5 text-xs font-medium tabular-nums text-cancel">
                              -{s.tool.defaultMonthlyPrice}€/{t("mois", "mo")}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] text-muted-foreground">{s.cancelReason}</p>
                          {s.freeAlt && s.freeAlt.slug !== s.tool.slug && (
                            <Link to={`${prefix}/tool/${s.freeAlt.slug}`} className="mt-1.5 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              {t("Alternative gratuite :", "Free alternative:")} <strong>{s.freeAlt.name}</strong>
                            </Link>
                          )}
                        </div>
                        <span className="shrink-0 text-right font-bold tabular-nums text-cancel">
                          -{s.tool.defaultMonthlyPrice * 12}€/{t("an", "yr")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Colonne droite : Top 3 recommandations ── */}
          <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <h2 className="text-base font-bold">{t("Meilleurs outils pour vous", "Best tools for you")}</h2>
              <InfoTip text={t("Score = pertinence (60%) + indice de valeur (40%). Top 3.", "Score = pertinence (60%) + value index (40%). Top 3.")} />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {results.recommended.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {!results.hasCurrentTools
                      ? t("Ajoutez vos outils actuels pour obtenir une analyse complète.", "Add your current tools for a complete analysis.")
                      : t("Votre stack semble déjà bien optimisée.", "Your stack seems well optimized.")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.recommended.slice(0, 3).map((s) => {
                    const scoreBadge = s.finalScore > 80
                      ? { text: "Excellent", cls: "bg-keep/10 text-keep" }
                      : { text: t("Bon", "Good"), cls: "bg-primary/10 text-primary" };
                    return (
                      <div key={s.tool.id} className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all hover:border-primary/30">
                        <div className="flex items-start gap-3">
                          <ToolLogoSmall tool={s.tool} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-base font-semibold">{s.tool.name}</h3>
                              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${scoreBadge.cls}`}>
                                {scoreBadge.text}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{s.tool.shortDescription}</p>
                            {tjmMedian > 0 && s.valueCreated > 0 && (
                              <p className="mt-1.5 text-sm font-semibold tabular-nums text-[#22C55E]">
                                {t(`Vaut ~${s.valueCreated}€/mois pour votre profil`, `Worth ~€${s.valueCreated}/mo for your profile`)}
                              </p>
                            )}
                            {s.tool.verdict?.threshold && (
                              <p className="mt-1 text-xs italic text-muted-foreground/60">{s.tool.verdict.threshold}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          {s.tool.affiliateLink ? (
                            <a
                              href={s.tool.affiliateLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0A0A0A] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a1a1a] dark:bg-white dark:text-[#0A0A0A] dark:hover:bg-white/90"
                            >
                              {t("Essayer gratuitement", "Try for free")}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <Link
                              to={`${prefix}/tool/${s.tool.slug}`}
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0A0A0A] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a1a1a] dark:bg-white dark:text-[#0A0A0A] dark:hover:bg-white/90"
                            >
                              {t("Voir la fiche", "View details")}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ══════════ ZONE 3 — Onglets ══════════ */}
      <div className="shrink-0 border-t border-border bg-card">
        <Tabs defaultValue="all" className="mx-auto max-w-7xl">
          <TabsList className="mx-6 mt-4 md:mx-8">
            <TabsTrigger value="all">{t("Toutes les recommandations", "All recommendations")}</TabsTrigger>
            {results.hasCurrentTools && form.currentTools.length >= 3 && (
              <TabsTrigger value="quadrant">{t("Quadrant Efficacité", "Efficiency Quadrant")}</TabsTrigger>
            )}
            <TabsTrigger value="roi">{t("Analyse ROI", "ROI Analysis")}</TabsTrigger>
          </TabsList>

          {/* ── Tab: All recommendations ── */}
          <TabsContent value="all" className="max-h-[50vh] overflow-y-auto px-6 pb-6 md:px-8 md:pb-8">
            {results.recommended.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {fewRecommendations
                  ? t("Votre stack semble déjà bien optimisée pour votre profil.", "Your stack seems well optimized for your profile.")
                  : t("Aucune recommandation disponible.", "No recommendations available.")}
              </p>
            ) : (
              <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.recommended.map((s) => {
                  const scoreBadge = s.finalScore > 80
                    ? { text: "Excellent", cls: "bg-keep/10 text-keep" }
                    : { text: t("Bon", "Good"), cls: "bg-primary/10 text-primary" };
                  return (
                    <div key={s.tool.id} className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all hover:border-primary/30">
                      <div className="flex items-start gap-3">
                        <ToolLogoSmall tool={s.tool} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold">{s.tool.name}</h3>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${scoreBadge.cls}`}>{scoreBadge.text}</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{s.tool.shortDescription}</p>
                          {tjmMedian > 0 && s.valueCreated > 0 && (
                            <p className="mt-1.5 text-sm font-semibold tabular-nums text-[#22C55E]">
                              {t(`Vaut ~${s.valueCreated}€/mois`, `Worth ~€${s.valueCreated}/mo`)}
                            </p>
                          )}
                          {s.tool.verdict?.threshold && (
                            <p className="mt-1 text-xs italic text-muted-foreground/60">{s.tool.verdict.threshold}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        {s.tool.affiliateLink ? (
                          <a href={s.tool.affiliateLink} target="_blank" rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0A0A0A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a1a1a] dark:bg-white dark:text-[#0A0A0A] dark:hover:bg-white/90">
                            {t("Essayer gratuitement", "Try for free")} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <Link to={`${prefix}/tool/${s.tool.slug}`}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0A0A0A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a1a1a] dark:bg-white dark:text-[#0A0A0A] dark:hover:bg-white/90">
                            {t("Voir la fiche", "View details")} <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Tab: Quadrant ── */}
          {results.hasCurrentTools && form.currentTools.length >= 3 && (
            <TabsContent value="quadrant" className="px-6 pb-6 md:px-8 md:pb-8">
              <div className="pt-4">
                <ResponsiveContainer width="100%" height={380}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="x" name={t("Coût (€/mois)", "Cost (€/mo)")}
                      label={{ value: t("Coût (€/mois)", "Cost (€/mo)"), position: "bottom", offset: 5, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis type="number" dataKey="y" name={t("Heures gagnées/mois", "Hours gained/mo")}
                      label={{ value: t("h/mois", "h/mo"), angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <RechartsTooltip content={({ payload }) => {
                      if (!payload || payload.length === 0) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg bg-[#0A0A0A] px-3 py-2 text-xs text-white shadow-lg">
                          <p className="font-medium">{d.name}</p>
                          <p className="text-gray-400">{t("Indice :", "Index:")} {d.valueIndex}</p>
                          {d.valueCreated > 0 && <p className="text-[#22C55E]">{t(`Vaut ~${d.valueCreated}€/mois`, `Worth ~€${d.valueCreated}/mo`)}</p>}
                        </div>
                      );
                    }} />
                    <ReferenceLine
                      segment={[{ x: 0, y: 0 }, { x: 100, y: 40 }]}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      label={{ value: t("Frontière d'efficience", "Efficiency frontier"), position: "end", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
                    />
                    <Scatter data={quadrantData} />
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22C55E" }} /> {t("Recommandé", "Recommended")}</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#EF4444" }} /> {t("À annuler", "To cancel")}</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#6B7280" }} /> {t("Neutre", "Neutral")}</span>
                </div>
              </div>
            </TabsContent>
          )}

          {/* ── Tab: ROI ── */}
          <TabsContent value="roi" className="px-6 pb-6 md:px-8 md:pb-8">
            {tjmMedian === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("Renseignez votre TJM pour accéder à l'analyse ROI complète.", "Enter your daily rate to access the full ROI analysis.")}
                </p>
                <button onClick={() => navigate(`${prefix}/selector`)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary">
                  {t("Retour au sélecteur", "Back to selector")} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : roiData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t("Aucune donnée ROI disponible.", "No ROI data available.")}
              </p>
            ) : (
              <div className="overflow-x-auto pt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium">{t("Outil", "Tool")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Coût/mois", "Cost/mo")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("h gagnées", "h gained")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Valeur créée", "Value created")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Indice", "Index")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Verdict", "Verdict")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roiData.map((row, i) => (
                      <tr key={row.name} className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-secondary/30" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ToolLogoSmall tool={row.tool} size={24} />
                            <span className="font-medium">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.cost}€</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.hours}h</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.valueCreated}€</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{row.valueIndex}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.verdict === "Excellent" ? "bg-keep/10 text-keep" : row.verdict === "Bon" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                          }`}>{row.verdict}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer links */}
      <div className="border-t border-border bg-card px-6 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3">
          <Link to={`${prefix}/tools`} className="inline-flex items-center gap-1 rounded-lg bg-[#0A0A0A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a1a1a] dark:bg-white dark:text-[#0A0A0A] dark:hover:bg-white/90">
            {t("Catalogue des outils", "Tool catalog")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to={`${prefix}/selector`} className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary">
            {t("Refaire le test", "Retake the test")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
