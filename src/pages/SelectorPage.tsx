import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { tools } from "@/data/content";
import { SelectorFormData, UserType, JobRole, MainGoal, AIUsageLevel, SelectedTool } from "@/data/types";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STEPS = 6;

const SelectorPage = () => {
  const { t, prefix } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SelectorFormData>({
    userType: null,
    jobRole: null,
    mainGoal: null,
    currentTools: [],
    aiUsageLevel: null,
    email: "",
    firstName: "",
    marketingOptIn: false,
  });

  const next = () => step < STEPS && setStep(step + 1);
  const prev = () => step > 1 && setStep(step - 1);

  const canNext = () => {
    switch (step) {
      case 1: return !!form.userType;
      case 2: return !!form.jobRole;
      case 3: return !!form.mainGoal;
      case 4: return true;
      case 5: return !!form.aiUsageLevel;
      case 6: return form.email.includes("@") && form.firstName.length > 0;
      default: return false;
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        email: form.email.trim(),
        first_name: form.firstName.trim(),
        user_type: form.userType,
        job_role: form.jobRole,
        main_goal: form.mainGoal,
        current_tools: JSON.stringify(form.currentTools),
        ai_usage_level: form.aiUsageLevel,
        marketing_opt_in: form.marketingOptIn,
        source: "selector",
      } as any);

      if (error) throw error;

      sessionStorage.setItem("tooltrim_selector", JSON.stringify(form));
      navigate(`${prefix}/selector/results`);
    } catch (err) {
      console.error("Error saving lead:", err);
      toast.error(t("Une erreur est survenue. Veuillez réessayer.", "An error occurred. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTool = (toolId: string) => {
    const exists = form.currentTools.find((ct) => ct.toolId === toolId);
    if (exists) {
      setForm({ ...form, currentTools: form.currentTools.filter((ct) => ct.toolId !== toolId) });
    } else {
      setForm({ ...form, currentTools: [...form.currentTools, { toolId, monthlyCost: 0, usage: "medium" }] });
    }
  };

  const updateToolCost = (toolId: string, cost: number) => {
    setForm({
      ...form,
      currentTools: form.currentTools.map((ct) =>
        ct.toolId === toolId ? { ...ct, monthlyCost: cost } : ct
      ),
    });
  };

  const updateToolUsage = (toolId: string, usage: "low" | "medium" | "high") => {
    setForm({
      ...form,
      currentTools: form.currentTools.map((ct) =>
        ct.toolId === toolId ? { ...ct, usage } : ct
      ),
    });
  };

  const OptionCard = ({
    selected,
    onClick,
    emoji,
    label,
    desc,
  }: {
    selected: boolean;
    onClick: () => void;
    emoji: string;
    label: string;
    desc?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-primary bg-accent shadow-sm"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <div>
        <p className="font-medium">{label}</p>
        {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {selected && <Check className="ml-auto h-5 w-5 shrink-0 text-primary" />}
    </button>
  );

  return (
    <div className="min-h-[80vh] py-12">
      <div className="container mx-auto max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("Étape", "Step")} {step}/{STEPS}</span>
            <span>{Math.round((step / STEPS) * 100)}%</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(step / STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: User Type */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold">{t("Quel est votre profil ?", "What's your profile?")}</h2>
            <p className="mt-2 text-muted-foreground">{t("Cela nous aide à personnaliser les recommandations.", "This helps us personalize recommendations.")}</p>
            <div className="mt-6 grid gap-3">
              {([
                { value: "solo" as UserType, emoji: "👤", label: t("Freelance solo", "Solo freelancer"), desc: t("Je travaille seul", "I work alone") },
                { value: "team-2-5" as UserType, emoji: "👥", label: t("Petite équipe (2-5)", "Small team (2-5)"), desc: t("Petite structure", "Small structure") },
                { value: "team-5-10" as UserType, emoji: "👨‍👩‍👧‍👦", label: t("Équipe (5-10)", "Team (5-10)"), desc: t("Équipe moyenne", "Mid-size team") },
                { value: "startup-10+" as UserType, emoji: "🚀", label: t("Startup (10+)", "Startup (10+)"), desc: t("Structure en croissance", "Growing organization") },
              ]).map((opt) => (
                <OptionCard key={opt.value} selected={form.userType === opt.value} onClick={() => setForm({ ...form, userType: opt.value })} {...opt} />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Job Role */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold">{t("Quel est votre métier ?", "What's your job?")}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {([
                { value: "writer" as JobRole, emoji: "✍️", label: t("Rédacteur / Copywriter", "Writer / Copywriter") },
                { value: "consultant" as JobRole, emoji: "💼", label: t("Consultant / Coach", "Consultant / Coach") },
                { value: "tech" as JobRole, emoji: "💻", label: t("Développeur / Tech", "Developer / Tech") },
                { value: "designer" as JobRole, emoji: "🎨", label: t("Designer / Créatif", "Designer / Creative") },
                { value: "content-creator" as JobRole, emoji: "📱", label: t("Créateur de contenu", "Content Creator") },
                { value: "other" as JobRole, emoji: "🔧", label: t("Autre", "Other") },
              ]).map((opt) => (
                <OptionCard key={opt.value} selected={form.jobRole === opt.value} onClick={() => setForm({ ...form, jobRole: opt.value })} {...opt} />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Main Goal */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold">{t("Votre objectif principal ?", "Your main goal?")}</h2>
            <div className="mt-6 grid gap-3">
              {([
                { value: "reduce-costs" as MainGoal, emoji: "💰", label: t("Réduire les coûts", "Reduce costs"), desc: t("Payer moins pour mes outils", "Pay less for my tools") },
                { value: "save-time" as MainGoal, emoji: "⏱️", label: t("Gagner du temps", "Save time"), desc: t("Automatiser et simplifier", "Automate and simplify") },
                { value: "simplify" as MainGoal, emoji: "🧹", label: t("Simplifier la stack", "Simplify the stack"), desc: t("Moins d'outils, plus d'efficacité", "Fewer tools, more efficiency") },
                { value: "find-better" as MainGoal, emoji: "🔍", label: t("Trouver de meilleurs outils", "Find better tools"), desc: t("Découvrir des alternatives", "Discover alternatives") },
              ]).map((opt) => (
                <OptionCard key={opt.value} selected={form.mainGoal === opt.value} onClick={() => setForm({ ...form, mainGoal: opt.value })} {...opt} />
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Current Tools */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold">{t("Quels outils utilisez-vous ?", "Which tools do you use?")}</h2>
            <p className="mt-2 text-muted-foreground">{t("Sélectionnez les outils que vous payez actuellement.", "Select the tools you currently pay for.")}</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {tools.map((tool) => {
                const selected = form.currentTools.find((ct) => ct.toolId === tool.id);
                return (
                  <div key={tool.id}>
                    <button
                      onClick={() => toggleTool(tool.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all ${
                        selected ? "border-primary bg-accent" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span>{tool.logo}</span>
                      <span className="flex-1 font-medium">{tool.name}</span>
                      <span className="text-xs text-muted-foreground">{tool.defaultMonthlyPrice}€</span>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                    {selected && (
                      <div className="mt-1 flex gap-2 px-2">
                        <input
                          type="number"
                          placeholder={t("Coût/mois", "Cost/mo")}
                          value={selected.monthlyCost || ""}
                          onChange={(e) => updateToolCost(tool.id, Number(e.target.value))}
                          className="w-24 rounded border border-input bg-background px-2 py-1 text-xs"
                        />
                        <select
                          value={selected.usage}
                          onChange={(e) => updateToolUsage(tool.id, e.target.value as "low" | "medium" | "high")}
                          className="rounded border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="low">{t("Peu utilisé", "Low use")}</option>
                          <option value="medium">{t("Usage moyen", "Medium use")}</option>
                          <option value="high">{t("Usage intensif", "High use")}</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: AI Usage */}
        {step === 5 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold">{t("Votre usage de l'IA ?", "Your AI usage?")}</h2>
            <div className="mt-6 grid gap-3">
              {([
                { value: "intensive" as AIUsageLevel, emoji: "🚀", label: t("Intensif", "Intensive"), desc: t("J'utilise l'IA tous les jours", "I use AI every day") },
                { value: "occasional" as AIUsageLevel, emoji: "🔄", label: t("Occasionnel", "Occasional"), desc: t("Quelques fois par semaine", "A few times per week") },
                { value: "none" as AIUsageLevel, emoji: "❌", label: t("Pas du tout", "Not at all"), desc: t("Je n'utilise pas d'IA", "I don't use AI") },
                { value: "want_to_start" as AIUsageLevel, emoji: "✨", label: t("Je veux commencer", "I want to start"), desc: t("Je cherche à m'y mettre", "I'm looking to get started") },
              ]).map((opt) => (
                <OptionCard key={opt.value} selected={form.aiUsageLevel === opt.value} onClick={() => setForm({ ...form, aiUsageLevel: opt.value })} {...opt} />
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Email */}
        {step === 6 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold">{t("Recevez vos résultats", "Get your results")}</h2>
            <p className="mt-2 text-muted-foreground">{t("Nous vous envoyons un récapitulatif par email.", "We'll send you a summary by email.")}</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">{t("Prénom", "First name")}</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5"
                  placeholder={t("Votre prénom", "Your first name")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2.5"
                  placeholder="you@example.com"
                />
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.marketingOptIn}
                  onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
                  className="mt-1 rounded border-input"
                />
                <span className="text-sm text-muted-foreground">
                  {t(
                    "J'accepte de recevoir des conseils et comparatifs par email (pas de spam, promis).",
                    "I agree to receive tips and comparisons by email (no spam, promise)."
                  )}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 1}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Retour", "Back")}
          </button>
          {step < STEPS ? (
            <button
              onClick={next}
              disabled={!canNext()}
              className="flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              {t("Suivant", "Next")}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
              className="flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Enregistrement...", "Saving...")}
                </>
              ) : (
                <>
                  {t("Voir mes résultats", "See my results")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectorPage;
