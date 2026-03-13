import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import {
  SelectorFormData, MainGoal, SelectedTool,
  TJM_OPTIONS, PHASE_OPTIONS, MATURITY_OPTIONS,
  TjmRange, ProjectPhase, TechMaturity,
  VERTICAL_FAMILIES, FAMILY_ACTIVITIES, VerticalFamily,
  TIME_WEIGHT_OPTIONS, TimeWeight, VerticalWeight,
  ToolType,
} from "@/data/types";
import { verticals as VERTICALS_MAP } from "@/data/content";
import { ArrowLeft, ArrowRight, Check, Loader2, Search, X, RotateCcw, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getToolLogoUrl } from "@/hooks/useSupabaseData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tool } from "@/data/types";

const STEPS = 6;

const STEP_LABELS_FR = ["Profil", "Pondération", "Business", "Objectif", "Outils", "Email"];
const STEP_LABELS_EN = ["Profile", "Weighting", "Business", "Goal", "Tools", "Email"];

const TOOL_LAYERS: { type: ToolType; emoji: string; label: string; labelEn: string; desc: string; descEn: string }[] = [
  { type: "metier", emoji: "🏗️", label: "Outils métier", labelEn: "Core tools", desc: "Logiciels essentiels à votre activité", descEn: "Essential software for your activity" },
  { type: "plugin", emoji: "🔌", label: "Plugins & extensions", labelEn: "Plugins & extensions", desc: "Extensions qui enrichissent vos outils métier", descEn: "Extensions that enhance your core tools" },
  { type: "ia", emoji: "🤖", label: "Intelligence artificielle", labelEn: "Artificial intelligence", desc: "Assistants et agents IA", descEn: "AI assistants and agents" },
  { type: "gestion", emoji: "📋", label: "Gestion & organisation", labelEn: "Management & organization", desc: "Suivi projet, facturation, communication", descEn: "Project tracking, billing, communication" },
  { type: "satellite", emoji: "🛰️", label: "Satellites", labelEn: "Satellites", desc: "Outils complémentaires et utilitaires", descEn: "Complementary tools and utilities" },
];

const INITIAL_FORM: SelectorFormData = {
  family: null,
  verticals: [],
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

/* ─── Compact Tool Card ─── */
function ToolCard({ tool, selected, onToggle }: { tool: Tool; selected: boolean; onToggle: () => void }) {
  const logoUrl = getToolLogoUrl(tool);
  const [logoFailed, setLogoFailed] = useState(false);
  return (
    <button onClick={onToggle} className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${selected ? "border-primary bg-accent shadow-sm ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/30 hover:shadow-sm"}`}>
      {logoUrl && !logoFailed ? (
        <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-contain" loading="lazy" onError={() => setLogoFailed(true)} />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-foreground">{tool.name.charAt(0).toUpperCase()}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{tool.name}</p>
        <p className="text-xs text-muted-foreground">{tool.defaultMonthlyPrice > 0 ? `${tool.defaultMonthlyPrice}€/mois` : "Gratuit"}</p>
      </div>
      {selected ? (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary"><Check className="h-3 w-3 text-primary-foreground" /></div>
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-border group-hover:border-primary/50 transition-colors" />
      )}
    </button>
  );
}

/* ─── Option Card ─── */
function OptionCard({ selected, onClick, emoji, label, desc, compact }: {
  selected: boolean; onClick: () => void; emoji: string; label: string; desc?: string; compact?: boolean;
}) {
  return (
    <button onClick={onClick} className={`flex items-start gap-3 rounded-xl border text-left transition-all ${compact ? "p-3" : "p-4"} ${selected ? "border-primary bg-accent shadow-sm ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/30"}`}>
      <span className={compact ? "text-lg" : "text-xl"}>{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${compact ? "text-sm" : ""}`}>{label}</p>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      {selected && <Check className="ml-auto h-4 w-4 shrink-0 text-primary mt-0.5" />}
    </button>
  );
}

const SelectorPage = () => {
  const { t, prefix, lang } = useLang();
  const navigate = useNavigate();
  const { tools } = useTools();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SelectorFormData>({ ...INITIAL_FORM });
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toolSearch, setToolSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const stepLabels = lang === "en" ? STEP_LABELS_EN : STEP_LABELS_FR;

  const next = () => step < STEPS && setStep(step + 1);
  const prev = () => step > 1 && setStep(step - 1);

  const canNext = () => {
    switch (step) {
      case 1: return !!form.family && selectedActivities.length > 0;
      case 2: return form.verticals.length > 0;
      case 3: return !!form.tjm && !!form.projectPhase && !!form.techMaturity;
      case 4: return !!form.mainGoal;
      case 5: return true; // tools optional
      case 6: return form.email.includes("@") && form.firstName.length > 0;
      default: return false;
    }
  };

  // When moving from step 1 to 2, flatten selected activities into verticals
  const handleNext = () => {
    if (step === 1 && form.family) {
      const activities = FAMILY_ACTIVITIES[form.family];
      const allVerticalIds: string[] = [];
      for (const activityLabel of selectedActivities) {
        const activity = activities.find((a) => a.label === activityLabel);
        if (activity) allVerticalIds.push(...activity.verticals);
      }
      const uniqueIds = [...new Set(allVerticalIds)];
      const weights: VerticalWeight[] = uniqueIds.map((id) => ({
        id, weight: 1.0, timeWeight: "principal" as TimeWeight,
      }));
      setForm({ ...form, verticals: weights });
    }
    next();
  };

  const toggleActivity = (label: string) => {
    if (selectedActivities.includes(label)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== label));
    } else if (selectedActivities.length < 5) {
      setSelectedActivities([...selectedActivities, label]);
    }
  };

  const updateVerticalWeight = (verticalId: string, timeWeight: TimeWeight) => {
    setForm({
      ...form,
      verticals: form.verticals.map((v) =>
        v.id === verticalId
          ? { ...v, timeWeight, weight: { principal: 1.0, secondaire: 0.5, occasionnel: 0.2 }[timeWeight] }
          : v
      ),
    });
  };

  const toggleTool = (toolId: string) => {
    const exists = form.currentTools.find((ct) => ct.toolId === toolId);
    if (exists) {
      setForm({ ...form, currentTools: form.currentTools.filter((ct) => ct.toolId !== toolId) });
    } else {
      setForm({ ...form, currentTools: [...form.currentTools, { toolId, monthlyCost: 0, usage: "medium" }] });
    }
  };

  const handleReset = () => {
    if (window.confirm(t("Remettre le formulaire à zéro ?", "Reset the form?"))) {
      setForm({ ...INITIAL_FORM });
      setSelectedActivities([]);
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const tjmMedian = TJM_OPTIONS.find((o) => o.value === form.tjm)?.median || 0;
      const leadData = {
        email: form.email.trim(),
        first_name: form.firstName.trim() || null,
        user_type: form.family || null,
        job_role: form.verticals.map((v) => v.id).join(",") || null,
        main_goal: form.mainGoal || null,
        current_tools: JSON.stringify(form.currentTools),
        ai_usage_level: form.aiUsageLevel || null,
        marketing_opt_in: form.marketingOptIn ?? false,
        tjm: tjmMedian,
        project_phase: form.projectPhase || null,
        tech_maturity: form.techMaturity || null,
        source: "selector-v4",
      };
      const { error } = await supabase.from("leads").insert(leadData as any);
      if (error) throw error;
      sessionStorage.setItem("tooltrim_selector", JSON.stringify(form));
      navigate(`${prefix}/selector/results`);
    } catch (err: any) {
      console.error("Error saving lead:", err?.message || err);
      toast.error(t("Une erreur est survenue. Veuillez réessayer.", "An error occurred. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Tool selection helpers ─── */
  const selectedIds = new Set(form.currentTools.map((ct) => ct.toolId));
  const totalCost = form.currentTools.reduce((sum, ct) => {
    const tool = tools.find((t) => t.id === ct.toolId);
    return sum + (ct.monthlyCost || tool?.defaultMonthlyPrice || 0);
  }, 0);
  const selectedToolObjects = useMemo(() => tools.filter((t) => selectedIds.has(t.id)), [tools, selectedIds]);

  /* Smart suggestions: tools matching user's verticals, sorted by functional_needs overlap */
  const suggestedTools = useMemo(() => {
    const userVerticalIds = form.verticals.map((v) => v.id);
    if (userVerticalIds.length === 0) return [];

    // Gather all functional_needs from user's verticals
    const userNeeds = new Set<string>();
    for (const vId of userVerticalIds) {
      const vertical = VERTICALS_MAP[vId];
      if (vertical) vertical.functional_needs.forEach((n: string) => userNeeds.add(n));
    }

    // Score each tool by overlap with user needs + vertical match
    const scored = tools
      .filter((t) => !selectedIds.has(t.id))
      .map((t) => {
        let score = 0;
        // Vertical match
        const verticalMatch = t.verticals?.some((v: string) => userVerticalIds.includes(v));
        if (verticalMatch) score += 3;
        // Functional needs overlap
        const needsOverlap = (t.functional_needs || []).filter((n: string) => userNeeds.has(n)).length;
        score += needsOverlap;
        // Boost core tools
        if (t.tool_type === "metier") score += 2;
        if (t.tool_type === "ia") score += 1;
        return { tool: t, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    return scored.map((s) => s.tool);
  }, [tools, form.verticals, selectedIds]);

  /* Tools grouped by layer (tool_type) */
  const toolsByLayer = useMemo(() => {
    let pool = tools.filter((t) => !selectedIds.has(t.id));
    if (toolSearch.trim()) {
      const q = toolSearch.toLowerCase().trim();
      pool = pool.filter((t) => t.name.toLowerCase().includes(q));
    }
    const grouped: Record<ToolType, Tool[]> = { metier: [], plugin: [], ia: [], gestion: [], satellite: [] };
    for (const t of pool) {
      const type = (t.tool_type || "satellite") as ToolType;
      if (grouped[type]) grouped[type].push(t);
      else grouped.satellite.push(t);
    }
    return grouped;
  }, [tools, toolSearch, selectedIds]);

  const [expandedLayers, setExpandedLayers] = useState<Set<ToolType>>(new Set());
  const toggleLayer = (type: ToolType) => {
    const next = new Set(expandedLayers);
    if (next.has(type)) next.delete(type); else next.add(type);
    setExpandedLayers(next);
  };
  const [activeView, setActiveView] = useState<"smart" | "layers">("smart");

  const filteredTools = useMemo(() => {
    let filtered = tools.filter((t) => !selectedIds.has(t.id));
    if (toolSearch.trim()) {
      const q = toolSearch.toLowerCase().trim();
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [tools, toolSearch, selectedIds]);
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{form.currentTools.length}</span> {t("outils sélectionnés", "tools selected")}</span>
                <span className="font-heading text-sm font-bold">{t("Total", "Total")} : <span className="text-primary">{totalCost}€/mois</span></span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 6 — Email ═══ */}
        {step === 6 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold tracking-tight">{t("Recevez vos résultats", "Get your results")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("Nous vous envoyons un récapitulatif par email.", "We'll send you a summary by email.")}</p>

            {/* Quick profile summary */}
            <div className="mt-5 rounded-xl border border-border bg-secondary/30 p-4 text-sm space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("Récapitulatif", "Summary")}</p>
              {family && <p><span className="text-muted-foreground">{t("Famille", "Family")} :</span> {family.emoji} {lang === "en" ? family.labelEn : family.label}</p>}
              {form.verticals.length > 0 && <p><span className="text-muted-foreground">{t("Activités", "Activities")} :</span> {form.verticals.map((v) => verticalLabel(v.id)).join(", ")}</p>}
              {form.currentTools.length > 0 && <p><span className="text-muted-foreground">{t("Outils", "Tools")} :</span> {form.currentTools.length} {t("outils", "tools")} · {totalCost}€/{t("mois", "mo")}</p>}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">{t("Prénom", "First name")}</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder={t("Votre prénom", "Your first name")} />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="you@example.com" />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.marketingOptIn} onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })} className="mt-1 rounded border-input accent-primary" />
                <span className="text-sm text-muted-foreground">{t("J'accepte de recevoir des conseils et comparatifs par email (pas de spam, promis).", "I agree to receive tips and comparisons by email (no spam, promise).")}</span>
              </label>
            </div>
          </div>
        )}

        {/* ─── Navigation ─── */}
        <div className="mt-8 flex items-center justify-between">
          <button onClick={prev} disabled={step === 1} className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30">
            <ArrowLeft className="h-4 w-4" /> {t("Retour", "Back")}
          </button>
          {step < STEPS ? (
            <button onClick={handleNext} disabled={!canNext()} className="flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 shadow-sm shadow-primary/20">
              {t("Suivant", "Next")} <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canNext() || submitting} className="flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 shadow-sm shadow-primary/20">
              {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> {t("Analyse en cours...", "Analyzing...")}</>) : (<>{t("Voir mes résultats", "See my results")} <ArrowRight className="h-4 w-4" /></>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectorPage;
