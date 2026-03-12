import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import {
  SelectorFormData, MainGoal, AIUsageLevel, SelectedTool,
  PERSONAS, TJM_OPTIONS, PHASE_OPTIONS, MATURITY_OPTIONS,
  Persona, TjmRange, ProjectPhase, TechMaturity,
} from "@/data/types";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolSelectionStep from "@/components/selector/ToolSelectionStep";
import ProfileRecapPanel from "@/components/selector/ProfileRecapPanel";
import { useIsMobile } from "@/hooks/use-mobile";

const STEPS = 8;

const INITIAL_FORM: SelectorFormData = {
  persona: null,
  mainGoal: null,
  currentTools: [],
  aiUsageLevel: null,
  tjm: null,
  projectPhase: null,
  techMaturity: null,
  email: "",
  firstName: "",
  marketingOptIn: false,
};

const SelectorPage = () => {
  const { t, prefix, lang } = useLang();
  const navigate = useNavigate();
  const { tools } = useTools();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SelectorFormData>({ ...INITIAL_FORM });

  const goToStep = (s: number) => setStep(s);
  const next = () => step < STEPS && setStep(step + 1);
  const prev = () => step > 1 && setStep(step - 1);

  const canNext = () => {
    switch (step) {
      case 1: return !!form.persona;
      case 2: return !!form.tjm;
      case 3: return !!form.projectPhase;
      case 4: return !!form.techMaturity;
      case 5: return !!form.mainGoal;
      case 6: return true;
      case 7: return !!form.aiUsageLevel;
      case 8: return form.email.includes("@") && form.firstName.length > 0;
      default: return false;
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const tjmMedian = TJM_OPTIONS.find((o) => o.value === form.tjm)?.median || 0;
      const { error } = await supabase.from("leads").insert({
        email: form.email.trim(),
        first_name: form.firstName.trim(),
        user_type: form.persona,
        job_role: form.persona,
        main_goal: form.mainGoal,
        current_tools: JSON.stringify(form.currentTools),
        ai_usage_level: form.aiUsageLevel,
        marketing_opt_in: form.marketingOptIn,
        tjm: tjmMedian,
        project_phase: form.projectPhase,
        tech_maturity: form.techMaturity,
        source: "selector-v2",
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

  const handleReset = () => {
    setForm({ ...INITIAL_FORM });
    setStep(1);
  };

  const OptionCard = ({
    selected, onClick, emoji, label, desc,
  }: {
    selected: boolean; onClick: () => void; emoji: string; label: string; desc?: string;
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
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {selected && <Check className="ml-auto h-5 w-5 shrink-0 text-primary" />}
    </button>
  );

  const showRecap = step > 1;

  return (
    <div className={`min-h-[80vh] py-12 ${isMobile && showRecap ? "pb-28" : ""}`}>
      <div className="container mx-auto">
        <div className={`flex gap-8 ${showRecap ? "max-w-4xl mx-auto" : "max-w-2xl mx-auto"}`}>
          {/* Main content */}
          <div className="flex-1 min-w-0">
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

            {/* Step 1: Persona */}
            {step === 1 && (
              <div className="animate-fade-in">
                <h2 className="font-heading text-2xl font-bold">{t("Qui êtes-vous ?", "Who are you?")}</h2>
                <p className="mt-2 text-muted-foreground">{t("Choisissez le profil qui vous ressemble le plus.", "Choose the profile that best fits you.")}</p>
                <div className="mt-6 grid gap-3">
                  {PERSONAS.map((p) => (
                    <OptionCard
                      key={p.value}
                      selected={form.persona === p.value}
                      onClick={() => setForm({ ...form, persona: p.value })}
                      emoji={p.emoji}
                      label={p.name}
                      desc={lang === "en" ? p.descEn : p.desc}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: TJM */}
            {step === 2 && (
              <div className="animate-fade-in">
                <h2 className="font-heading text-2xl font-bold">{t("Votre taux journalier moyen ?", "Your average daily rate?")}</h2>
                <p className="mt-2 text-muted-foreground">{t("Utilisé pour calculer la valeur réelle de chaque outil.", "Used to calculate the real value of each tool.")}</p>
                <div className="mt-6 grid gap-3">
                  {TJM_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.value}
                      selected={form.tjm === o.value}
                      onClick={() => setForm({ ...form, tjm: o.value })}
                      emoji="💰"
                      label={lang === "en" ? o.labelEn : o.label}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Project Phase */}
            {step === 3 && (
              <div className="animate-fade-in">
                <h2 className="font-heading text-2xl font-bold">{t("Où en êtes-vous dans votre activité ?", "Where are you in your business?")}</h2>
                <div className="mt-6 grid gap-3">
                  {PHASE_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.value}
                      selected={form.projectPhase === o.value}
                      onClick={() => setForm({ ...form, projectPhase: o.value })}
                      emoji={o.emoji}
                      label={lang === "en" ? o.labelEn : o.label}
                      desc={lang === "en" ? o.descEn : o.desc}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Tech Maturity */}
            {step === 4 && (
              <div className="animate-fade-in">
                <h2 className="font-heading text-2xl font-bold">{t("Votre rapport aux outils ?", "Your relationship with tools?")}</h2>
                <div className="mt-6 grid gap-3">
                  {MATURITY_OPTIONS.map((o) => (
                    <OptionCard
                      key={o.value}
                      selected={form.techMaturity === o.value}
                      onClick={() => setForm({ ...form, techMaturity: o.value })}
                      emoji={o.emoji}
                      label={lang === "en" ? o.labelEn : o.label}
                      desc={lang === "en" ? o.descEn : o.desc}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Main Goal */}
            {step === 5 && (
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

            {/* Step 6: Current Tools — new component */}
            {step === 6 && (
              <ToolSelectionStep
                tools={tools}
                currentTools={form.currentTools}
                onToggleTool={toggleTool}
                onUpdateCost={updateToolCost}
                onUpdateUsage={updateToolUsage}
              />
            )}

            {/* Step 7: AI Usage */}
            {step === 7 && (
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

            {/* Step 8: Email */}
            {step === 8 && (
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
                      {t("Analyse en cours...", "Analyzing...")}
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

          {/* Desktop recap panel */}
          {showRecap && !isMobile && (
            <ProfileRecapPanel
              form={form}
              tools={tools}
              currentStep={step}
              onGoToStep={goToStep}
              onReset={handleReset}
            />
          )}
        </div>
      </div>

      {/* Mobile recap panel */}
      {showRecap && isMobile && (
        <ProfileRecapPanel
          form={form}
          tools={tools}
          currentStep={step}
          onGoToStep={goToStep}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default SelectorPage;
