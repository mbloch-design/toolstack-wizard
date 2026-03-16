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
import { ArrowLeft, ArrowRight, Check, Loader2, Search, X, RotateCcw, ChevronDown, ChevronUp, Sparkles, Package, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getToolLogoUrl, getToolLogoUrlHD } from "@/hooks/useSupabaseData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tool } from "@/data/types";

const STEPS = 5;

const STEP_META_FR = [
  { label: "Profil", sub: "Activité" },
  { label: "Temps", sub: "Pondération" },
  { label: "Business", sub: "Contexte" },
  { label: "Outils", sub: "Stack actuelle" },
  { label: "Résultats", sub: "Email" },
];
const STEP_META_EN = [
  { label: "Profile", sub: "Activity" },
  { label: "Time", sub: "Weighting" },
  { label: "Business", sub: "Context" },
  { label: "Tools", sub: "Current stack" },
  { label: "Results", sub: "Email" },
];

const TOOL_LAYERS: { type: ToolType; emoji: string; label: string; labelEn: string; desc: string; descEn: string }[] = [
  { type: "metier", emoji: "🏗️", label: "Outils métier", labelEn: "Core tools", desc: "Logiciels essentiels à votre activité", descEn: "Essential software for your activity" },
  { type: "plugin", emoji: "🔌", label: "Plugins & extensions", labelEn: "Plugins & extensions", desc: "Extensions qui enrichissent vos outils métier", descEn: "Extensions that enhance your core tools" },
  { type: "ia", emoji: "🤖", label: "Intelligence artificielle", labelEn: "Artificial intelligence", desc: "Assistants et agents IA", descEn: "AI assistants and agents" },
  { type: "gestion", emoji: "📋", label: "Gestion & organisation", labelEn: "Management & organization", desc: "Suivi projet, facturation, communication", descEn: "Project tracking, billing, communication" },
  { type: "satellite", emoji: "🛰️", label: "Satellites", labelEn: "Satellites", desc: "Outils complémentaires et utilitaires", descEn: "Complementary tools and utilities" },
];

const INITIAL_FORM: SelectorFormData = {
  family: null, verticals: [], persona: null, mainGoal: null,
  currentTools: [], aiUsageLevel: null, tjm: null, projectPhase: null,
  techMaturity: null, email: "", firstName: "", marketingOptIn: false,
};

/* ─── Tool Type Visual Tokens ─── */
const TYPE_TOKENS: Record<string, { label: string; labelEn: string; dot: string }> = {
  metier:    { label: "Métier",    labelEn: "Core",   dot: "bg-primary" },
  plugin:    { label: "Plugin",    labelEn: "Plugin",  dot: "bg-violet-500" },
  ia:        { label: "IA",        labelEn: "AI",      dot: "bg-amber-500" },
  gestion:   { label: "Gestion",   labelEn: "Mgmt",    dot: "bg-cyan-500" },
  satellite: { label: "Satellite", labelEn: "Misc",    dot: "bg-muted-foreground/40" },
};

/* ─── Multi-fallback Logo ─── */
function ToolLogo({ tool, size = 28 }: { tool: Tool; size?: number }) {
  const googleUrl = getToolLogoUrl(tool);
  const hdUrl = getToolLogoUrlHD(tool);
  const [src, setSrc] = useState<string | null>(hdUrl || googleUrl);
  const [failed, setFailed] = useState(0);
  const handleError = () => {
    if (failed === 0 && hdUrl && googleUrl) { setSrc(googleUrl); setFailed(1); }
    else setFailed(2);
  };
  if (!src || failed >= 2) {
    return (
      <div className="flex shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground font-mono font-medium"
        style={{ width: size, height: size, fontSize: size * 0.4 }}>
        {tool.name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img src={src} alt={`${tool.name} logo`}
      className="shrink-0 rounded-md object-contain bg-white dark:bg-secondary/60 border border-border/50"
      style={{ width: size, height: size }} loading="lazy" onError={handleError} />
  );
}

/* ─── Tool Row — clean, airy ─── */
function ToolRow({ tool, selected, onToggle, lang, highlighted }: {
  tool: Tool; selected: boolean; onToggle: () => void; lang: string; highlighted?: boolean;
}) {
  const tt = TYPE_TOKENS[tool.tool_type || "satellite"] || TYPE_TOKENS.satellite;
  return (
    <button onClick={onToggle}
      className={`group flex items-center gap-3 px-4 py-3 text-left transition-all w-full
        ${selected
          ? "bg-accent/60"
          : highlighted
          ? "hover:bg-accent/30"
          : "hover:bg-secondary/40"
        }`}>
      <ToolLogo tool={tool} size={32} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate leading-snug">{tool.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`h-1.5 w-1.5 rounded-full ${tt.dot}`} />
          <span className="text-[11px] text-muted-foreground">{lang === "en" ? tt.labelEn : tt.label}</span>
          <span className="text-[11px] text-muted-foreground/60">·</span>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {tool.defaultMonthlyPrice > 0 ? `${tool.defaultMonthlyPrice}€` : lang === "en" ? "Free" : "Gratuit"}
          </span>
        </div>
      </div>
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all
        ${selected
          ? "bg-primary shadow-sm"
          : "border border-border group-hover:border-primary/40"
        }`}>
        {selected && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
      </div>
    </button>
  );
}

/* ─── Selection Chip Card ─── */
function SelectionCard({ selected, onClick, emoji, label, desc, compact }: {
  selected: boolean; onClick: () => void; emoji: string; label: string; desc?: string; compact?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`relative flex items-start gap-3 rounded-lg text-left transition-all
        ${compact ? "px-3.5 py-3" : "px-4 py-4"}
        ${selected
          ? "bg-accent/80 shadow-[0_0_0_1.5px_hsl(var(--primary))]"
          : "bg-card border border-border hover:border-primary/30 hover:shadow-sm"
        }`}>
      <span className={`${compact ? "text-lg" : "text-xl"} leading-none mt-0.5`}>{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-medium leading-snug ${compact ? "text-[13px]" : "text-sm"}`}>{label}</p>
        {desc && <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{desc}</p>}
      </div>
      {selected && (
        <div className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
          <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

/* ─── Section Header ─── */
function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-heading text-xl md:text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
    </div>
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

  const stepMeta = lang === "en" ? STEP_META_EN : STEP_META_FR;

  const next = () => step < STEPS && setStep(step + 1);
  const prev = () => step > 1 && setStep(step - 1);

  const canNext = () => {
    switch (step) {
      case 1: return !!form.family && selectedActivities.length > 0;
      case 2: return form.verticals.length > 0;
      case 3: return !!form.tjm && !!form.projectPhase && !!form.techMaturity;
      case 4: return true; // Tools step is optional
      case 5: return form.email.includes("@") && form.firstName.length > 0;
      default: return false;
    }
  };

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
    if (selectedActivities.includes(label)) setSelectedActivities(selectedActivities.filter((a) => a !== label));
    else if (selectedActivities.length < 5) setSelectedActivities([...selectedActivities, label]);
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
    if (exists) setForm({ ...form, currentTools: form.currentTools.filter((ct) => ct.toolId !== toolId) });
    else setForm({ ...form, currentTools: [...form.currentTools, { toolId, monthlyCost: 0, usage: "medium" }] });
  };

  const handleReset = () => {
    if (window.confirm(t("Remettre le formulaire à zéro ?", "Reset the form?"))) {
      setForm({ ...INITIAL_FORM }); setSelectedActivities([]); setStep(1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const tjmMedian = TJM_OPTIONS.find((o) => o.value === form.tjm)?.median || 0;
      const leadData = {
        email: form.email.trim(), first_name: form.firstName.trim() || null,
        user_type: form.family || null, job_role: form.verticals.map((v) => v.id).join(",") || null,
        main_goal: form.mainGoal || null, current_tools: JSON.stringify(form.currentTools),
        ai_usage_level: form.aiUsageLevel || null, marketing_opt_in: form.marketingOptIn ?? false,
        tjm: tjmMedian, project_phase: form.projectPhase || null,
        tech_maturity: form.techMaturity || null, source: "selector-v10",
      };
      const { error } = await supabase.from("leads").insert(leadData as any);
      if (error) throw error;
      sessionStorage.setItem("tooltrim_selector", JSON.stringify(form));
      navigate(`${prefix}/selector/results`);
    } catch (err: any) {
      console.error("Error saving lead:", err?.message || err);
      toast.error(t("Une erreur est survenue. Veuillez réessayer.", "An error occurred. Please try again."));
    } finally { setSubmitting(false); }
  };

  /* ─── Tool helpers ─── */
  const selectedIds = new Set(form.currentTools.map((ct) => ct.toolId));
  const totalCost = form.currentTools.reduce((sum, ct) => {
    const tool = tools.find((t) => t.id === ct.toolId);
    return sum + (ct.monthlyCost || tool?.defaultMonthlyPrice || 0);
  }, 0);
  const selectedToolObjects = useMemo(() => tools.filter((t) => selectedIds.has(t.id)), [tools, selectedIds]);

  const suggestedTools = useMemo(() => {
    const userVerticalIds = form.verticals.map((v) => v.id);
    if (userVerticalIds.length === 0) return [];
    const userNeeds = new Set<string>();
    for (const vId of userVerticalIds) {
      const vertical = VERTICALS_MAP[vId];
      if (vertical) vertical.functional_needs.forEach((n: string) => userNeeds.add(n));
    }
    return tools
      .filter((t) => !selectedIds.has(t.id))
      .map((t) => {
        let score = 0;
        if (t.verticals?.some((v: string) => userVerticalIds.includes(v))) score += 3;
        score += (t.functional_needs || []).filter((n: string) => userNeeds.has(n)).length;
        if (t.tool_type === "metier") score += 2;
        if (t.tool_type === "ia") score += 1;
        return { tool: t, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((s) => s.tool);
  }, [tools, form.verticals, selectedIds]);

  const toolsByLayer = useMemo(() => {
    let pool = tools.filter((t) => !selectedIds.has(t.id));
    if (toolSearch.trim()) pool = pool.filter((t) => t.name.toLowerCase().includes(toolSearch.toLowerCase().trim()));
    const grouped: Record<ToolType, Tool[]> = { metier: [], plugin: [], ia: [], gestion: [], satellite: [] };
    for (const t of pool) {
      const type = (t.tool_type || "satellite") as ToolType;
      if (grouped[type]) grouped[type].push(t); else grouped.satellite.push(t);
    }
    return grouped;
  }, [tools, toolSearch, selectedIds]);

  const [expandedLayers, setExpandedLayers] = useState<Set<ToolType>>(new Set());
  const toggleLayer = (type: ToolType) => {
    const n = new Set(expandedLayers);
    if (n.has(type)) n.delete(type); else n.add(type);
    setExpandedLayers(n);
  };
  const [activeView, setActiveView] = useState<"smart" | "layers">("smart");

  const filteredTools = useMemo(() => {
    let filtered = tools.filter((t) => !selectedIds.has(t.id));
    if (toolSearch.trim()) filtered = filtered.filter((t) => t.name.toLowerCase().includes(toolSearch.toLowerCase().trim()));
    return filtered;
  }, [tools, toolSearch, selectedIds]);

  const verticalLabel = (id: string) => {
    const allActivities = Object.values(FAMILY_ACTIVITIES).flat();
    for (const a of allActivities) {
      if (a.verticals.includes(id)) return lang === "en" ? a.labelEn : a.label;
    }
    return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const family = VERTICAL_FAMILIES.find((f) => f.value === form.family);

  return (
    <div className="min-h-[80vh] py-6 md:py-10">
      <div className="container mx-auto max-w-2xl px-4 md:px-6">

        {/* ═══ Step Indicator — minimal numbered dots ═══ */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {stepMeta.map((meta, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isDone = step > stepNum;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <button
                    onClick={() => isDone && setStep(stepNum)}
                    disabled={!isDone}
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-medium transition-all
                      ${isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                        : isDone
                        ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                        : "bg-secondary text-muted-foreground/50"
                      }`}>
                    {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : stepNum}
                  </button>
                  {!isMobile && (
                    <span className={`text-[10px] font-medium transition-colors text-center leading-tight
                      ${isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                      {meta.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Progress bar below dots */}
          <div className="mt-3 flex gap-1">
            {stepMeta.map((_, i) => (
              <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300
                ${step > i + 1 ? "bg-primary/50" : step === i + 1 ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground font-mono tabular-nums">{step}/{STEPS}</p>
            {step > 1 && (
              <button onClick={handleReset} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw className="h-3 w-3" /> {t("Recommencer", "Reset")}
              </button>
            )}
          </div>
        </div>

        {/* ═══ STEP 1 — Family + Activities ═══ */}
        {step === 1 && (
          <div className="animate-fade-in space-y-10">
            <div>
              <SectionHead
                title={t("Quelle est votre famille d'activité ?", "What's your activity family?")}
                subtitle={t("Choisissez la catégorie qui correspond le mieux à votre quotidien.", "Choose the category that best matches your daily work.")}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VERTICAL_FAMILIES.map((f) => (
                  <button key={f.value}
                    onClick={() => { setForm({ ...form, family: f.value, verticals: [] }); setSelectedActivities([]); }}
                    className={`flex flex-col items-center gap-2 rounded-lg px-3 py-4 text-center transition-all
                      ${form.family === f.value
                        ? "bg-accent/80 shadow-[0_0_0_1.5px_hsl(var(--primary))]"
                        : "bg-card border border-border hover:border-primary/30 hover:shadow-sm"
                      }`}>
                    <span className="text-2xl">{f.emoji}</span>
                    <span className="text-[13px] font-medium leading-tight">{lang === "en" ? f.labelEn : f.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {form.family && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading text-base font-semibold">{t("Vos activités concrètes", "Your actual activities")}</h3>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{t("Sélectionnez jusqu'à 5 activités.", "Select up to 5 activities.")}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{selectedActivities.length}/5</span>
                </div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {FAMILY_ACTIVITIES[form.family].map((activity) => {
                    const isSelected = selectedActivities.includes(activity.label);
                    return (
                      <SelectionCard key={activity.label} compact selected={isSelected}
                        onClick={() => toggleActivity(activity.label)}
                        emoji={isSelected ? "✓" : "○"}
                        label={lang === "en" ? activity.labelEn : activity.label} />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2 — Time Allocation ═══ */}
        {step === 2 && form.verticals.length > 0 && (
          <div className="animate-fade-in">
            <SectionHead
              title={t("Répartition de votre temps", "Time allocation")}
              subtitle={t("Pour chaque activité, indiquez son importance dans votre quotidien.", "For each activity, indicate its importance in your daily work.")}
            />
            <div className="space-y-3">
              {form.verticals.map((v) => (
                <div key={v.id} className="rounded-lg bg-card border border-border p-4">
                  <p className="text-[13px] font-medium mb-3">{verticalLabel(v.id)}</p>
                  <div className="flex gap-1.5">
                    {TIME_WEIGHT_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => updateVerticalWeight(v.id, opt.value)}
                        className={`flex-1 rounded-md px-2 py-2 text-center transition-all
                          ${v.timeWeight === opt.value
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}>
                        <span className="block text-xs font-medium">{lang === "en" ? opt.labelEn : opt.label}</span>
                        <span className="block text-[10px] opacity-60 mt-0.5 leading-tight">{lang === "en" ? opt.descEn : opt.desc}</span>
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
            <SectionHead
              title={t("Votre profil business", "Your business profile")}
              subtitle={t("Ces informations affinent la pertinence des recommandations.", "These details refine the relevance of recommendations.")}
            />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("Taux journalier moyen", "Average daily rate")}</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {TJM_OPTIONS.map((o) => (
                  <SelectionCard key={o.value} compact selected={form.tjm === o.value}
                    onClick={() => setForm({ ...form, tjm: o.value })} emoji="💰"
                    label={lang === "en" ? o.labelEn : o.label} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("Phase de développement", "Development phase")}</p>
              <div className="grid gap-1.5 sm:grid-cols-3">
                {PHASE_OPTIONS.map((o) => (
                  <SelectionCard key={o.value} compact selected={form.projectPhase === o.value}
                    onClick={() => setForm({ ...form, projectPhase: o.value })} emoji={o.emoji}
                    label={lang === "en" ? o.labelEn : o.label} desc={lang === "en" ? o.descEn : o.desc} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("Maturité technique", "Technical maturity")}</p>
              <div className="grid gap-1.5 sm:grid-cols-3">
                {MATURITY_OPTIONS.map((o) => (
                  <SelectionCard key={o.value} compact selected={form.techMaturity === o.value}
                    onClick={() => setForm({ ...form, techMaturity: o.value })} emoji={o.emoji}
                    label={lang === "en" ? o.labelEn : o.label} desc={lang === "en" ? o.descEn : o.desc} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4 — Tools (was step 5) ═══ */}
        {step === 4 && (
          <div className="animate-fade-in">
            <SectionHead
              title={t("Quels outils utilisez-vous ?", "Which tools do you use?")}
              subtitle={t("Sélectionnez les outils que vous payez actuellement. Cette étape est optionnelle.", "Select the tools you currently pay for. This step is optional.")}
            />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <input type="text" value={toolSearch} onChange={(e) => setToolSearch(e.target.value)}
                placeholder={t("Rechercher un outil…", "Search for a tool…")}
                className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring transition-shadow" />
              {toolSearch && (
                <button onClick={() => setToolSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Selected stack — horizontal chips */}
            {selectedToolObjects.length > 0 && (
              <div className="mt-4 rounded-lg border border-primary/15 bg-accent/30 p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {t("Ma stack", "My stack")}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-medium text-primary tabular-nums">
                    {selectedToolObjects.length} {t("outils", "tools")} · {totalCost}€/{t("mois", "mo")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedToolObjects.map((tool) => (
                    <button key={tool.id} onClick={() => toggleTool(tool.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium transition-colors hover:bg-destructive/5 hover:border-destructive/30 hover:text-destructive group">
                      <ToolLogo tool={tool} size={14} />
                      <span className="max-w-[80px] truncate">{tool.name}</span>
                      <X className="h-2.5 w-2.5 opacity-30 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View toggle */}
            {!toolSearch.trim() && (
              <div className="mt-4 flex rounded-lg border border-border bg-secondary/30 p-0.5">
                <button onClick={() => setActiveView("smart")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all
                    ${activeView === "smart" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  <Sparkles className="h-3 w-3" />{t("Pour vous", "For you")}
                </button>
                <button onClick={() => setActiveView("layers")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all
                    ${activeView === "layers" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {t("Par type", "By type")}
                </button>
              </div>
            )}

            {/* Search results */}
            {toolSearch.trim() && (
              <div className="mt-3 rounded-lg border border-border bg-card overflow-hidden">
                <div className="max-h-[45vh] overflow-y-auto divide-y divide-border/40">
                  {filteredTools.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground">{t("Aucun outil trouvé", "No tool found")}</div>
                  )}
                  {filteredTools.slice(0, 50).map((tool) => (
                    <ToolRow key={tool.id} tool={tool} selected={false} onToggle={() => toggleTool(tool.id)} lang={lang} />
                  ))}
                </div>
                {filteredTools.length > 50 && (
                  <div className="border-t border-border px-4 py-2 text-center text-[11px] text-muted-foreground">
                    {t("Affinez votre recherche pour voir plus de résultats", "Refine your search to see more results")}
                  </div>
                )}
              </div>
            )}

            {/* Smart view */}
            {!toolSearch.trim() && activeView === "smart" && (
              <div className="mt-4 space-y-5">
                {suggestedTools.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        {t("Recommandés pour votre profil", "Recommended for your profile")}
                      </p>
                    </div>
                    <div className="rounded-lg border border-primary/10 bg-card overflow-hidden divide-y divide-border/30">
                      {suggestedTools.map((tool) => (
                        <ToolRow key={tool.id} tool={tool} selected={selectedIds.has(tool.id)} onToggle={() => toggleTool(tool.id)} lang={lang} highlighted />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    {t("Tous les outils", "All tools")} <span className="font-mono">({tools.filter((t) => !selectedIds.has(t.id)).length})</span>
                  </p>
                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="max-h-[32vh] overflow-y-auto divide-y divide-border/30">
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
              <div className="mt-4 space-y-1.5">
                {TOOL_LAYERS.map((layer) => {
                  const layerTools = (toolsByLayer[layer.type] || []).sort((a, b) => a.name.localeCompare(b.name));
                  if (layerTools.length === 0) return null;
                  const isExpanded = expandedLayers.has(layer.type);
                  return (
                    <div key={layer.type} className="rounded-lg border border-border bg-card overflow-hidden">
                      <button onClick={() => toggleLayer(layer.type)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors">
                        <span className="text-base">{layer.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium leading-tight">{lang === "en" ? layer.labelEn : layer.label}</p>
                          <p className="text-[11px] text-muted-foreground">{lang === "en" ? layer.descEn : layer.desc}</p>
                        </div>
                        <span className="shrink-0 font-mono rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                          {layerTools.length}
                        </span>
                        {isExpanded
                          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border">
                          <div className="max-h-[40vh] overflow-y-auto divide-y divide-border/30">
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

        {/* ═══ STEP 5 — Email (was step 6) ═══ */}
        {step === 5 && (
          <div className="animate-fade-in">
            <SectionHead
              title={t("Recevez votre diagnostic", "Get your diagnostic")}
              subtitle={t("Nous analysons votre stack et préparons des recommandations personnalisées.", "We analyze your stack and prepare personalized recommendations.")}
            />

            {/* Profile recap */}
            <div className="rounded-lg border border-border bg-card p-4 mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("Récapitulatif", "Summary")}</p>
              <div className="space-y-2 text-[13px]">
                {family && (
                  <div className="flex items-center gap-2">
                    <span className="text-base">{family.emoji}</span>
                    <span className="text-muted-foreground">{t("Famille", "Family")}</span>
                    <span className="font-medium ml-auto">{lang === "en" ? family.labelEn : family.label}</span>
                  </div>
                )}
                {form.verticals.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-px">📋</span>
                    <span className="text-muted-foreground shrink-0">{t("Activités", "Activities")}</span>
                    <span className="font-medium ml-auto text-right">{form.verticals.map((v) => verticalLabel(v.id)).join(", ")}</span>
                  </div>
                )}
                {form.currentTools.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <span className="text-base">🧰</span>
                    <span className="text-muted-foreground">{t("Stack", "Stack")}</span>
                    <span className="font-mono font-medium ml-auto tabular-nums">
                      {form.currentTools.length} {t("outils", "tools")} · <span className="text-primary">{totalCost}€/{t("mois", "mo")}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-foreground">{t("Prénom", "First name")}</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                  placeholder={t("Votre prénom", "Your first name")} />
              </div>
              <div>
                <label className="text-[13px] font-medium text-foreground">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
                  placeholder="you@example.com" />
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input type="checkbox" checked={form.marketingOptIn} onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
                  className="mt-0.5 rounded border-input accent-primary h-4 w-4" />
                <span className="text-[12px] text-muted-foreground leading-relaxed">
                  {t("J'accepte de recevoir des conseils et comparatifs par email (pas de spam, promis).",
                    "I agree to receive tips and comparisons by email (no spam, promise).")}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ═══ Navigation Footer ═══ */}
        <div className={`mt-8
          ${step === 4
            ? "sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 pb-4 pt-3 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-2px_12px_-4px_hsl(var(--foreground)/0.06)]"
            : ""
          }`}>
          {step === 4 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] text-muted-foreground">
                <span className="font-mono font-medium text-foreground">{form.currentTools.length}</span> {t("outils sélectionnés", "tools selected")}
              </span>
              <span className="font-mono text-[12px] font-medium tabular-nums">
                {t("Total", "Total")} : <span className="text-primary">{totalCost}€/{t("mois", "mo")}</span>
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button onClick={prev} disabled={step === 1}
              className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-0 disabled:pointer-events-none">
              <ArrowLeft className="h-3.5 w-3.5" /> {t("Retour", "Back")}
            </button>
            {step < STEPS ? (
              <button onClick={handleNext} disabled={!canNext()}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25">
                {t("Continuer", "Continue")} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!canNext() || submitting}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25">
                {submitting
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("Analyse…", "Analyzing…")}</>
                  : <>{t("Voir mes résultats", "See my results")} <ArrowRight className="h-3.5 w-3.5" /></>
                }
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SelectorPage;
