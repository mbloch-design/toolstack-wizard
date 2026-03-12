import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools, getToolLogoUrl } from "@/hooks/useSupabaseData";
import { SelectorFormData, ScoredTool, SelectorResults, TJM_OPTIONS, PERSONAS } from "@/data/types";
import { generateScoringResults } from "@/lib/scoring";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowRight, TrendingDown, AlertTriangle, CheckCircle2,
  ArrowUpRight, Copy, ChevronDown, ExternalLink, Info, Sparkles,
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

const ResultsPage = () => {
  const { t, prefix, lang } = useLang();
  const navigate = useNavigate();
  const { tools } = useTools();
  const [results, setResults] = useState<SelectorResults | null>(null);
  const [form, setForm] = useState<SelectorFormData | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQuadrant, setShowQuadrant] = useState(false);
  const [showRoi, setShowRoi] = useState(false);

  const tjmMedian = useMemo(() => {
    if (!form?.tjm) return 0;
    return TJM_OPTIONS.find((o) => o.value === form.tjm)?.median || 0;
  }, [form]);

  useEffect(() => {
    if (tools.length === 0) return;
    const data = sessionStorage.getItem("tooltrim_selector");
    if (!data) {
      navigate(`${prefix}/selector`);
      return;
    }
    const parsed: SelectorFormData = JSON.parse(data);
    setForm(parsed);
    const r = generateScoringResults(parsed, tools, lang);
    setResults(r);

    // Save results to Supabase (fire-and-forget)
    supabase.from("selector_results").insert({
      persona: parsed.persona || "unknown",
      stack_health_score: r.stackHealthScore >= 0 ? r.stackHealthScore : null,
      recommended_tools: r.recommended.map((s) => ({ id: s.tool.id, score: s.finalScore })),
      tools_to_cancel: r.toCancel.map((s) => ({ id: s.tool.id, score: s.finalScore, saving: s.tool.defaultMonthlyPrice })),
      estimated_savings_monthly: r.totalSavingsMonthly,
      roi_analysis: r.recommended.map((s) => ({ id: s.tool.id, valueIndex: s.valueIndex, valueCreated: s.valueCreated })),
    } as any).select("share_token").single().then(({ data: row }) => {
      if (row) setShareToken((row as any).share_token);
    });
  }, [navigate, prefix, tools, lang]);

  const handleShare = async () => {
    const url = `${window.location.origin}${prefix}/selector/results`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("Lien copié !", "Link copied!"));
    setTimeout(() => setCopied(false), 2000);
  };

  // Quadrant data
  const quadrantData = useMemo(() => {
    if (!results) return [];
    return results.scoredTools
      .filter((s) => s.tool.defaultMonthlyPrice > 0 || (s.tool.timeGainedHoursPerMonth || 0) > 0)
      .map((s) => ({
        name: s.tool.name,
        x: s.tool.defaultMonthlyPrice,
        y: s.tool.timeGainedHoursPerMonth || 0,
        valueIndex: s.valueIndex,
        fill: s.action === "recommend" ? "hsl(142, 60%, 40%)" : s.action === "cancel" ? "hsl(0, 72%, 55%)" : "hsl(220, 9%, 46%)",
      }));
  }, [results]);

  // ROI table data
  const roiData = useMemo(() => {
    if (!results || tjmMedian === 0) return [];
    return results.recommended
      .filter((s) => s.valueCreated > 0)
      .map((s) => ({
        name: s.tool.name,
        cost: s.tool.defaultMonthlyPrice,
        hours: s.tool.timeGainedHoursPerMonth || 0,
        valueCreated: s.valueCreated,
        valueIndex: s.valueIndex,
        verdict: s.finalScore > 80 ? "Excellent" : s.finalScore > 60 ? "Bon" : "Neutre",
      }));
  }, [results, tjmMedian]);

  if (!results || !form) return null;

  const healthLabel = results.stackHealthScore > 80
    ? { text: t("Optimisée", "Optimized"), color: "text-keep" }
    : results.stackHealthScore >= 50
    ? { text: t("À revoir", "Needs review"), color: "text-primary" }
    : { text: t("Dette détectée", "Debt detected"), color: "text-cancel" };

  const personaName = PERSONAS.find((p) => p.value === form.persona)?.name || "";
  const fewRecommendations = results.recommended.length < 3 && results.toCancel.length === 0;

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto max-w-4xl">

        {/* ── Hero: Stack Health Score ── */}
        {results.hasCurrentTools && results.stackHealthScore >= 0 && (
          <div className="animate-fade-in rounded-2xl bg-card border border-border p-6 md:p-10">
            <div className="flex flex-col items-center text-center">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                {t("Stack Health Score", "Stack Health Score")}
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`font-heading text-6xl font-bold tabular-nums ${healthLabel.color}`}>
                  {results.stackHealthScore}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                results.stackHealthScore < 50 ? "bg-cancel/10 text-cancel" : results.stackHealthScore <= 80 ? "bg-primary/10 text-primary" : "bg-keep/10 text-keep"
              }`}>
                {results.stackHealthScore < 50 && <AlertTriangle className="h-3.5 w-3.5" />}
                {results.stackHealthScore > 80 && <CheckCircle2 className="h-3.5 w-3.5" />}
                {healthLabel.text}
              </span>
              <p className="mt-4 max-w-lg text-sm text-muted-foreground">{results.personaMessage}</p>
            </div>

            {/* Savings hero */}
            {results.totalSavingsMonthly > 0 && (
              <div className="mt-8 flex flex-col items-center rounded-xl bg-secondary/50 p-6">
                <TrendingDown className="h-6 w-6 text-primary" />
                <p className="mt-2 font-heading text-4xl font-bold tabular-nums text-foreground">
                  {results.totalSavingsMonthly}€<span className="text-lg font-normal text-muted-foreground">/{t("mois", "mo")}</span>
                </p>
                <p className="text-muted-foreground">{t("d'économies potentielles", "in potential savings")}</p>
                <p className="text-sm text-muted-foreground">{t("Soit", "That's")} <strong>{results.totalSavingsAnnual}€</strong>/{t("an", "year")}</p>
              </div>
            )}
          </div>
        )}

        {/* No current tools message */}
        {!results.hasCurrentTools && (
          <div className="animate-fade-in rounded-2xl bg-card border border-border p-6 md:p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h1 className="mt-4 font-heading text-3xl font-bold">
              {t(`Bonjour ${personaName}, voici vos recommandations`, `Hello ${personaName}, here are your recommendations`)}
            </h1>
            <p className="mt-3 text-muted-foreground">{results.personaMessage}</p>
            <p className="mt-4 text-sm text-muted-foreground/70">
              {t("Ajoutez vos outils actuels pour obtenir une analyse complète de votre stack.", "Add your current tools to get a complete stack analysis.")}
            </p>
          </div>
        )}

        {/* Well-optimized stack message */}
        {fewRecommendations && results.hasCurrentTools && (
          <div className="mt-6 animate-fade-in rounded-xl border border-keep/20 bg-keep/5 p-5 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-keep" />
            <p className="mt-2 font-medium">{t("Votre stack semble déjà bien optimisée pour votre profil.", "Your stack seems already well-optimized for your profile.")}</p>
          </div>
        )}

        {/* ── Outils à annuler ── */}
        {results.toCancel.length > 0 && (
          <div className="mt-10 animate-slide-up">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl font-bold">{t("Économies identifiées", "Savings identified")}</h2>
              <span className="group relative">
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                <span className="pointer-events-none absolute left-6 top-0 z-10 w-64 rounded-lg bg-popover p-3 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {t("Score final < 40 ou alternative gratuite couvrant les mêmes besoins.", "Final score < 40 or free alternative covering the same needs.")}
                </span>
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {results.toCancel.map((s) => {
                const logoUrl = getToolLogoUrl(s.tool);
                return (
                  <div key={s.tool.id} className="rounded-xl border border-cancel/20 bg-card p-4">
                    <div className="flex items-start gap-3">
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="h-8 w-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs">💳</span>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{s.tool.name}</h3>
                          <span className="rounded-full bg-cancel/10 px-2 py-0.5 text-xs font-medium text-cancel tabular-nums">
                            -{s.tool.defaultMonthlyPrice}€/{t("mois", "mo")}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{s.cancelReason}</p>
                        {s.freeAlt && (
                          <Link
                            to={`${prefix}/tool/${s.freeAlt.slug}`}
                            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            {t("Alternative gratuite :", "Free alternative:")} <strong>{s.freeAlt.name}</strong>
                          </Link>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums text-cancel">-{s.tool.defaultMonthlyPrice * 12}€/{t("an", "yr")}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Outils recommandés ── */}
        {results.recommended.length > 0 && (
          <div className="mt-10 animate-slide-up">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl font-bold">
                {t("Outils recommandés pour vous", "Recommended tools for you")}
              </h2>
              <span className="group relative">
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                <span className="pointer-events-none absolute left-6 top-0 z-10 w-64 rounded-lg bg-popover p-3 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {t("Score de pertinence (60%) + Indice de Valeur (40%). Top 6 outils > 60/100.", "Pertinence score (60%) + Value Index (40%). Top 6 tools > 60/100.")}
                </span>
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {results.recommended.map((s) => {
                const logoUrl = getToolLogoUrl(s.tool);
                const scoreBadge = s.finalScore > 80
                  ? { text: "Excellent", cls: "bg-keep/10 text-keep" }
                  : { text: "Bon", cls: "bg-primary/10 text-primary" };

                return (
                  <div key={s.tool.id} className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="flex items-start gap-3">
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="h-8 w-8 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs">🔧</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{s.tool.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${scoreBadge.cls}`}>
                            {scoreBadge.text}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.tool.shortDescription}</p>
                        {tjmMedian > 0 && s.valueCreated > 0 && (
                          <p className="mt-1.5 text-xs text-primary tabular-nums">
                            {t(`Vaut ~${s.valueCreated}€/mois pour votre profil`, `Worth ~€${s.valueCreated}/mo for your profile`)}
                          </p>
                        )}
                        {s.tool.verdict?.threshold && (
                          <p className="mt-1 text-xs text-muted-foreground/60 line-clamp-1">
                            {s.tool.verdict.threshold}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      {s.tool.affiliateLink ? (
                        <a
                          href={s.tool.affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          {t("Essayer gratuitement", "Try for free")}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link
                          to={`${prefix}/tool/${s.tool.slug}`}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
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
          </div>
        )}

        {/* ── Quadrant ── */}
        {results.hasCurrentTools && form.currentTools.length >= 3 && (
          <div className="mt-10 animate-slide-up">
            <button
              onClick={() => setShowQuadrant(!showQuadrant)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showQuadrant ? "rotate-180" : ""}`} />
              {t("Voir le quadrant Efficacité vs Investissement", "View Efficiency vs Investment quadrant")}
            </button>
            <div className={`${showQuadrant ? "block" : "hidden"} md:block`}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-heading text-xl font-bold">{t("Efficacité vs Investissement", "Efficiency vs Investment")}</h2>
                <span className="group relative">
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  <span className="pointer-events-none absolute left-6 top-0 z-10 w-64 rounded-lg bg-popover p-3 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {t("Axe X : coût mensuel. Axe Y : heures gagnées. Vert : recommandé. Rouge : à annuler.", "X axis: monthly cost. Y axis: hours gained. Green: recommended. Red: to cancel.")}
                  </span>
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number" dataKey="x" name={t("Coût (€/mois)", "Cost (€/mo)")}
                      label={{ value: t("Coût (€/mois)", "Cost (€/mo)"), position: "bottom", offset: 0, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      type="number" dataKey="y" name={t("Heures gagnées/mois", "Hours gained/mo")}
                      label={{ value: t("h/mois", "h/mo"), angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <RechartsTooltip
                      content={({ payload }) => {
                        if (!payload || payload.length === 0) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg bg-popover p-2 text-xs text-popover-foreground shadow-lg border border-border">
                            <p className="font-medium">{d.name}</p>
                            <p>{t("Indice de Valeur :", "Value Index:")} {d.valueIndex}</p>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine
                      segment={[{ x: 0, y: 0 }, { x: 100, y: 40 }]}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      label={{ value: t("Frontière d'efficience", "Efficiency frontier"), position: "end", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
                    />
                    <Scatter data={quadrantData} fill="hsl(var(--primary))" />
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-keep" /> {t("Recommandé", "Recommended")}</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-cancel" /> {t("À annuler", "To cancel")}</span>
                  <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" /> {t("Neutre", "Neutral")}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ROI Table ── */}
        {tjmMedian > 0 && roiData.length > 0 && (
          <div className="mt-10 animate-slide-up">
            <button
              onClick={() => setShowRoi(!showRoi)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showRoi ? "rotate-180" : ""}`} />
              {t("Voir l'analyse ROI complète", "View full ROI analysis")}
            </button>
            <div className={`${showRoi ? "block" : "hidden"} md:block`}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-heading text-xl font-bold">{t("Analyse ROI complète", "Full ROI Analysis")}</h2>
                <span className="group relative">
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  <span className="pointer-events-none absolute left-6 top-0 z-10 w-64 rounded-lg bg-popover p-3 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {t("Valeur créée = heures gagnées × TJM horaire. Indice = valeur / coût.", "Value created = hours gained × hourly rate. Index = value / cost.")}
                  </span>
                </span>
              </div>
              <div className="rounded-xl border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-3 text-left font-medium">{t("Outil", "Tool")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Coût/mois", "Cost/mo")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("h gagnées", "h gained")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Valeur créée", "Value created")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Indice", "Index")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Verdict", "Verdict")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roiData.map((row) => (
                      <tr key={row.name} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.cost}€</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.hours}h</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.valueCreated}€</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">{row.valueIndex}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.verdict === "Excellent" ? "bg-keep/10 text-keep" : row.verdict === "Bon" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                          }`}>
                            {row.verdict}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer CTA ── */}
        <div className="mt-12 flex flex-col items-center gap-4 rounded-xl border border-border bg-secondary/30 p-6 text-center">
          <p className="text-muted-foreground">{t("Explorez le catalogue complet pour en savoir plus.", "Explore the full catalog to learn more.")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to={`${prefix}/tools`} className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {t("Catalogue des outils", "Tool catalog")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to={`${prefix}/selector`} className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
              {t("Refaire le test", "Retake the test")}
            </Link>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? t("Copié !", "Copied!") : t("Partager mes résultats", "Share my results")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
