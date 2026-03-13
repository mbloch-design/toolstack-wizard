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
import { getToolLogoUrl, getToolLogoUrlHD } from "@/hooks/useSupabaseData";
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

/* ─── Tool Type Labels ─── */
const TOOL_TYPE_LABELS: Record<string, { label: string; labelEn: string; color: string }> = {
  metier: { label: "Métier", labelEn: "Core", color: "bg-primary/10 text-primary" },
  plugin: { label: "Plugin", labelEn: "Plugin", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  ia: { label: "IA", labelEn: "AI", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  gestion: { label: "Gestion", labelEn: "Mgmt", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  satellite: { label: "Satellite", labelEn: "Misc", color: "bg-muted text-muted-foreground" },
};

/* ─── Multi-fallback Logo ─── */
function ToolLogo({ tool, size = 28 }: { tool: Tool; size?: number }) {
  const googleUrl = getToolLogoUrl(tool);
  const hdUrl = getToolLogoUrlHD(tool);
  const [src, setSrc] = useState<string | null>(hdUrl || googleUrl);
  const [failed, setFailed] = useState(0);

  const handleError = () => {
    if (failed === 0 && hdUrl && googleUrl) {
      setSrc(googleUrl);
      setFailed(1);
    } else {
      setFailed(2);
    }
  };

  if (!src || failed >= 2) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground font-bold"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {tool.name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${tool.name} logo`}
      className="shrink-0 rounded-lg object-contain bg-white dark:bg-secondary/50"
      style={{ width: size, height: size }}
      loading="lazy"
      onError={handleError}
    />
  );
}

/* ─── Compact Tool Row ─── */
function ToolRow({ tool, selected, onToggle, lang, highlighted }: { tool: Tool; selected: boolean; onToggle: () => void; lang: string; highlighted?: boolean }) {
  const typeInfo = TOOL_TYPE_LABELS[tool.tool_type || "satellite"] || TOOL_TYPE_LABELS.satellite;
  return (
    <button
      onClick={onToggle}
      className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all w-full ${
        selected
          ? "bg-accent ring-1 ring-primary/20"
          : highlighted
          ? "bg-primary/[0.03] hover:bg-primary/[0.06]"
          : "hover:bg-secondary/60"
      }`}
    >
      <ToolLogo tool={tool} size={28} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{tool.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide ${typeInfo.color}`}>
            {lang === "en" ? typeInfo.labelEn : typeInfo.label}
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {tool.defaultMonthlyPrice > 0 ? `${tool.defaultMonthlyPrice}€` : lang === "en" ? "Free" : "Gratuit"}
          </span>
        </div>
      </div>
      {selected ? (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary transition-transform group-hover:scale-110"><Check className="h-3 w-3 text-primary-foreground" /></div>
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-border transition-colors group-hover:border-primary/40" />
      )}
    </button>
  );
}

/* ─── Mini Logo for chips ─── */
function ToolMiniLogo({ tool }: { tool: Tool }) {
  return <ToolLogo tool={tool} size={16} />;
}

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

  /* ─── Vertical label helper ─── */
  const verticalLabel = (id: string) => {
    const allActivities = Object.values(FAMILY_ACTIVITIES).flat();
    for (const a of allActivities) {
      if (a.verticals.includes(id)) return lang === "en" ? a.labelEn : a.label;
    }
    return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const family = VERTICAL_FAMILIES.find((f) => f.value === form.family);

  return (
    <div className="min-h-[80vh] py-8 md:py-12">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">

        {/* ─── Step Navigation ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-1 mb-3">
            {stepLabels.map((label, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isDone = step > stepNum;
              return (
                <button key={i} onClick={() => isDone && setStep(stepNum)} disabled={!isDone} className="flex-1 group">
                  <div className={`h-1 rounded-full transition-all ${isActive ? "bg-primary" : isDone ? "bg-primary/40" : "bg-secondary"}`} />
                  <p className={`mt-1.5 text-[10px] font-medium text-center transition-colors ${isActive ? "text-primary" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                    {!isMobile && label}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t("Étape", "Step")} {step}/{STEPS}</p>
            {step > 1 && (
              <button onClick={handleReset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw className="h-3 w-3" /> {t("Recommencer", "Reset")}
              </button>
            )}
          </div>
        </div>

        {/* ═══ STEP 1 — Family + Activities ═══ */}
        {step === 1 && (
          <div className="animate-fade-in space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">{t("Quelle est votre famille d'activité ?", "What's your activity family?")}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("Choisissez la famille qui correspond le mieux.", "Choose the family that fits best.")}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {VERTICAL_FAMILIES.map((f) => (
                  <button key={f.value} onClick={() => { setForm({ ...form, family: f.value, verticals: [] }); setSelectedActivities([]); }}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${form.family === f.value ? "border-primary bg-accent text-primary shadow-sm ring-1 ring-primary/20" : "border-border bg-card text-foreground hover:border-primary/30"}`}>
                    <span>{f.emoji}</span>
                    {lang === "en" ? f.labelEn : f.label}
                  </button>
                ))}
              </div>
            </div>
            {form.family && (
              <div className="animate-fade-in">
                <h3 className="font-heading text-lg font-semibold">{t("Quelles sont vos activités concrètes ?", "What are your actual activities?")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("Sélectionnez jusqu'à 5 activités.", "Select up to 5 activities.")}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {FAMILY_ACTIVITIES[form.family].map((activity) => {
                    const isSelected = selectedActivities.includes(activity.label);
                    return (
                      <OptionCard key={activity.label} compact selected={isSelected} onClick={() => toggleActivity(activity.label)}
                        emoji={isSelected ? "✅" : "○"} label={lang === "en" ? activity.labelEn : activity.label} />
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{selectedActivities.length}/5 {t("sélectionnées", "selected")}</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2 — Time Allocation ═══ */}
        {step === 2 && form.verticals.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold tracking-tight">{t("Répartition de votre temps", "Time allocation")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("Pour chaque activité, indiquez son importance dans votre quotidien.", "For each activity, indicate its importance in your daily work.")}</p>
            <div className="mt-6 space-y-3">
              {form.verticals.map((v) => (
                <div key={v.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-medium text-sm mb-3">{verticalLabel(v.id)}</p>
                  <div className="flex gap-2">
                    {TIME_WEIGHT_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => updateVerticalWeight(v.id, opt.value)}
                        className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${v.timeWeight === opt.value ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                        {lang === "en" ? opt.labelEn : opt.label}
                        <span className="block text-[10px] opacity-70 mt-0.5">{lang === "en" ? opt.descEn : opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 3 — Business Profile ═══ */}
        {step === 3 && (
          <div className="animate-fade-in space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight">{t("Votre profil business", "Your business profile")}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("Ces informations affinent la pertinence des recommandations.", "These details refine the relevance of recommendations.")}</p>
              <h3 className="mt-6 text-sm font-semibold text-foreground">{t("Taux journalier moyen", "Average daily rate")}</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {TJM_OPTIONS.map((o) => (
                  <OptionCard key={o.value} compact selected={form.tjm === o.value} onClick={() => setForm({ ...form, tjm: o.value })} emoji="💰" label={lang === "en" ? o.labelEn : o.label} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("Phase de développement", "Development phase")}</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {PHASE_OPTIONS.map((o) => (
                  <OptionCard key={o.value} compact selected={form.projectPhase === o.value} onClick={() => setForm({ ...form, projectPhase: o.value })} emoji={o.emoji} label={lang === "en" ? o.labelEn : o.label} desc={lang === "en" ? o.descEn : o.desc} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t("Maturité technique", "Technical maturity")}</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {MATURITY_OPTIONS.map((o) => (
                  <OptionCard key={o.value} compact selected={form.techMaturity === o.value} onClick={() => setForm({ ...form, techMaturity: o.value })} emoji={o.emoji} label={lang === "en" ? o.labelEn : o.label} desc={lang === "en" ? o.descEn : o.desc} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4 — Main Goal ═══ */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold tracking-tight">{t("Quel est votre objectif principal ?", "What's your main goal?")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("Cela détermine le type de recommandations prioritaires.", "This determines the type of priority recommendations.")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
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

        {/* ═══ STEP 5 — Smart Tools Selection ═══ */}
        {step === 5 && (
          <div className="animate-fade-in">
            <h2 className="font-heading text-2xl font-bold tracking-tight">{t("Quels outils utilisez-vous ?", "Which tools do you use?")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("Sélectionnez les outils que vous payez actuellement. Optionnel.", "Select the tools you currently pay for. Optional.")}</p>

            {/* Search — prominent */}
            <div className="relative mt-5">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={toolSearch} onChange={(e) => setToolSearch(e.target.value)} placeholder={t("Rechercher parmi 300+ outils...", "Search among 300+ tools...")} className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              {toolSearch && <button onClick={() => setToolSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
            </div>

            {/* Selected tools — always visible as chips */}
            {selectedToolObjects.length > 0 && (
              <div className="mt-4 rounded-xl border border-primary/10 bg-primary/[0.02] p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("Ma stack", "My stack")} ({selectedToolObjects.length})</p>
                  <span className="text-xs font-bold tabular-nums text-primary">{totalCost}€/{t("mois", "mo")}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedToolObjects.map((tool) => (
                    <button key={tool.id} onClick={() => toggleTool(tool.id)} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 group">
                      <ToolMiniLogo tool={tool} />
                      <span className="max-w-[100px] truncate">{tool.name}</span>
                      <X className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View toggle */}
            {!toolSearch.trim() && (
              <div className="mt-4 flex gap-1 rounded-lg bg-secondary/50 p-0.5">
                <button onClick={() => setActiveView("smart")} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeView === "smart" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  <Sparkles className="inline h-3 w-3 mr-1 -mt-0.5" />{t("Pour vous", "For you")}
                </button>
                <button onClick={() => setActiveView("layers")} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${activeView === "layers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {t("Par type", "By type")}
                </button>
              </div>
            )}

            {/* Search results — single column for density */}
            {toolSearch.trim() && (
              <div className="mt-3 rounded-xl border border-border bg-card overflow-hidden">
                <div className="max-h-[50vh] overflow-y-auto divide-y divide-border/50">
                  {filteredTools.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">{t("Aucun outil trouvé", "No tool found")}</div>
                  )}
                  {filteredTools.slice(0, 50).map((tool) => (
                    <ToolRow key={tool.id} tool={tool} selected={false} onToggle={() => toggleTool(tool.id)} lang={lang} />
                  ))}
                </div>
                {filteredTools.length > 50 && (
                  <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">{t("Affinez votre recherche pour voir plus de résultats", "Refine your search to see more results")}</div>
                )}
              </div>
            )}

            {/* Smart view */}
            {!toolSearch.trim() && activeView === "smart" && (
              <div className="mt-4 space-y-5">
                {/* Suggestions */}
                {suggestedTools.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10"><Sparkles className="h-3 w-3 text-primary" /></div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("Recommandés pour votre profil", "Recommended for your profile")}</p>
                    </div>
                    <div className="rounded-xl border border-primary/10 bg-card overflow-hidden divide-y divide-border/50">
                      {suggestedTools.map((tool) => (
                        <ToolRow key={tool.id} tool={tool} selected={false} onToggle={() => toggleTool(tool.id)} lang={lang} highlighted />
                      ))}
                    </div>
                  </div>
                )}

                {/* All tools — alphabetical, in a card */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    {t("Tous les outils", "All tools")} ({tools.filter((t) => !selectedIds.has(t.id)).length})
                  </p>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="max-h-[35vh] overflow-y-auto divide-y divide-border/50">
                      {tools
                        .filter((t) => !selectedIds.has(t.id) && !suggestedTools.some((s) => s.id === t.id))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((tool) => (
                          <ToolRow key={tool.id} tool={tool} selected={false} onToggle={() => toggleTool(tool.id)} lang={lang} />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Layer view */}
            {!toolSearch.trim() && activeView === "layers" && (
              <div className="mt-4 space-y-2">
                {TOOL_LAYERS.map((layer) => {
                  const layerTools = (toolsByLayer[layer.type] || []).sort((a, b) => a.name.localeCompare(b.name));
                  if (layerTools.length === 0) return null;
                  const isExpanded = expandedLayers.has(layer.type);
                  return (
                    <div key={layer.type} className="rounded-xl border border-border bg-card overflow-hidden">
                      <button onClick={() => toggleLayer(layer.type)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors">
                        <span className="text-base">{layer.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight">{lang === "en" ? layer.labelEn : layer.label}</p>
                          <p className="text-[11px] text-muted-foreground">{lang === "en" ? layer.descEn : layer.desc}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">{layerTools.length}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border">
                          <div className="max-h-[40vh] overflow-y-auto divide-y divide-border/50">
                            {layerTools.map((tool) => (
                              <ToolRow key={tool.id} tool={tool} selected={selectedIds.has(tool.id)} onToggle={() => toggleTool(tool.id)} lang={lang} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

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
