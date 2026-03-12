import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { SelectorFormData, SelectorResults, ToolRecommendation, Tool } from "@/data/types";
import { ArrowRight, TrendingDown, Check, X, ArrowUpRight, RefreshCw } from "lucide-react";

function generateResults(form: SelectorFormData, tools: Tool[]): SelectorResults {
  const recommended: ToolRecommendation[] = [];
  const toCancel: ToolRecommendation[] = [];
  const toKeep: ToolRecommendation[] = [];
  const toAdd: ToolRecommendation[] = [];
  let totalSavings = 0;

  // Analyze current tools
  for (const ct of form.currentTools) {
    const tool = tools.find((t) => t.id === ct.toolId);
    if (!tool) continue;

    const isRelevant = form.jobRole ? tool.relevantFor.includes(form.jobRole) : true;
    const cost = ct.monthlyCost || tool.defaultMonthlyPrice;

    if (ct.usage === "low" && cost > 5) {
      toCancel.push({
        tool,
        score: 30,
        reason: `Usage faible pour ${cost}€/mois — envisagez de résilier ou passer au plan gratuit.`,
        action: "cancel",
        savingsMonthly: cost,
      });
      totalSavings += cost;
    } else if (!isRelevant && cost > 0) {
      toCancel.push({
        tool,
        score: 40,
        reason: `Peu pertinent pour votre profil (${form.jobRole}). Économisez ${cost}€/mois.`,
        action: "cancel",
        savingsMonthly: cost,
      });
      totalSavings += cost;
    } else {
      toKeep.push({
        tool,
        score: 80,
        reason: tool.verdict.keepIf,
        action: "keep",
      });
    }
  }

  // Check for switches (e.g., Calendly -> Cal.com)
  const hasCalendly = form.currentTools.find((ct) => ct.toolId === "calendly");
  const hasCalcom = form.currentTools.find((ct) => ct.toolId === "calcom");
  if (hasCalendly && !hasCalcom) {
    const calcom = tools.find((t) => t.id === "calcom");
    const calendly = tools.find((t) => t.id === "calendly");
    if (calcom && calendly) {
      const idx = toKeep.findIndex((r) => r.tool.id === "calendly");
      if (idx >= 0) toKeep.splice(idx, 1);
      const cancelIdx = toCancel.findIndex((r) => r.tool.id === "calendly");
      if (cancelIdx < 0) {
        const cost = hasCalendly.monthlyCost || calendly.defaultMonthlyPrice;
        toCancel.push({
          tool: calendly,
          score: 60,
          reason: `Cal.com offre les mêmes fonctionnalités gratuitement.`,
          action: "switch",
          switchTo: calcom,
          savingsMonthly: cost,
        });
        totalSavings += cost;
      }
    }
  }

  // Recommend tools based on profile
  const currentToolIds = form.currentTools.map((ct) => ct.toolId);
  for (const tool of tools) {
    if (currentToolIds.includes(tool.id)) continue;
    const isRelevant = form.jobRole ? tool.relevantFor.includes(form.jobRole) : false;
    if (isRelevant && (tool.pricing === "free" || tool.pricing === "freemium")) {
      toAdd.push({
        tool,
        score: 70,
        reason: `Recommandé pour les ${form.jobRole}s. ${tool.pricing === "free" ? "Gratuit !" : "Plan gratuit disponible."}`,
        action: "add",
      });
    }
  }

  return {
    recommended: [...toKeep, ...toAdd],
    toCancel,
    toKeep,
    toAdd: toAdd.slice(0, 5),
    totalSavingsMonthly: totalSavings,
  };
}

const ResultsPage = () => {
  const { t, prefix } = useLang();
  const navigate = useNavigate();
  const [results, setResults] = useState<SelectorResults | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("tooltrim_selector");
    if (!data) {
      navigate(`${prefix}/selector`);
      return;
    }
    const form: SelectorFormData = JSON.parse(data);
    setResults(generateResults(form));
  }, [navigate, prefix]);

  if (!results) return null;

  return (
    <div className="py-12">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="animate-fade-in text-center">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">
            {t("Vos résultats personnalisés", "Your personalized results")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("Voici nos recommandations basées sur votre profil.", "Here are our recommendations based on your profile.")}
          </p>
        </div>

        {/* Savings Banner */}
        {results.totalSavingsMonthly > 0 && (
          <div className="mt-8 animate-slide-up rounded-2xl bg-primary p-6 text-center text-primary-foreground">
            <TrendingDown className="mx-auto h-8 w-8" />
            <p className="mt-2 font-heading text-4xl font-bold">{results.totalSavingsMonthly}€<span className="text-lg font-normal opacity-80">/{t("mois", "mo")}</span></p>
            <p className="mt-1 opacity-90">{t("d'économies estimées", "in estimated savings")}</p>
            <p className="mt-1 text-sm opacity-70">{t("Soit", "That's")} {results.totalSavingsMonthly * 12}€/{t("an", "year")}</p>
          </div>
        )}

        {/* To Cancel */}
        {results.toCancel.length > 0 && (
          <div className="mt-10 animate-slide-up">
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
              <X className="h-5 w-5 text-cancel" />
              {t("Outils à résilier ou remplacer", "Tools to cancel or replace")}
            </h2>
            <div className="mt-4 space-y-3">
              {results.toCancel.map((rec) => (
                <div key={rec.tool.id} className="rounded-xl border border-cancel/20 bg-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{rec.tool.logo}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rec.tool.name}</h3>
                        {rec.savingsMonthly && (
                          <span className="rounded-full bg-cancel/10 px-2 py-0.5 text-xs font-medium text-cancel">
                            -{rec.savingsMonthly}€/{t("mois", "mo")}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{rec.reason}</p>
                      {rec.switchTo && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                          <RefreshCw className="h-3.5 w-3.5" />
                          {t("Remplacer par", "Replace with")} <strong>{rec.switchTo.name}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* To Keep */}
        {results.toKeep.length > 0 && (
          <div className="mt-10 animate-slide-up">
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
              <Check className="h-5 w-5 text-keep" />
              {t("Outils à garder", "Tools to keep")}
            </h2>
            <div className="mt-4 space-y-3">
              {results.toKeep.map((rec) => (
                <div key={rec.tool.id} className="rounded-xl border border-keep/20 bg-card p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{rec.tool.logo}</span>
                    <div>
                      <h3 className="font-semibold">{rec.tool.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{rec.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended to Add */}
        {results.toAdd.length > 0 && (
          <div className="mt-10 animate-slide-up">
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              {t("Outils recommandés", "Recommended tools")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {results.toAdd.map((rec) => (
                <Link
                  key={rec.tool.id}
                  to={`${prefix}/tool/${rec.tool.slug}`}
                  className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{rec.tool.logo}</span>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary">{rec.tool.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{rec.reason}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-border bg-secondary/50 p-6 text-center">
          <p className="text-muted-foreground">{t("Explorez le catalogue complet pour en savoir plus.", "Explore the full catalog to learn more.")}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link to={`${prefix}/tools`} className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {t("Catalogue des outils", "Tool catalog")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to={`${prefix}/selector`} className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
              {t("Refaire le test", "Retake the test")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
