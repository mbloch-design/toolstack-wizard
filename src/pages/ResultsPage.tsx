import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import {
  SelectorFormData, ScoredTool, SelectorResults, Fiche,
  TJM_OPTIONS, PHASE_OPTIONS, VERTICAL_FAMILIES, Tool,
} from "@/data/types";
import { generateScoringResults, needsMaturityWarning } from "@/lib/scoring";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowRight, AlertTriangle, CheckCircle2, ArrowUpRight,
  Copy, ExternalLink, Pencil, ChevronRight, Shield,
  Wallet, Layers, TrendingDown, Zap,
  ArrowDownCircle, RefreshCw, ChevronDown, ChevronUp, Sparkles,
  BadgeCheck, Clock, Info, HelpCircle,
} from "lucide-react";
import { setNoindex } from "@/lib/seo";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { getToolLogoUrl, getToolLogoUrlHD } from "@/hooks/useSupabaseData";

/* ═══════════ Helpers ═══════════ */

const Tip = ({ text }: { text: string }) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex opacity-40 hover:opacity-70 transition-opacity">
          <span className="text-xs text-muted-foreground">ⓘ</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-xs">{text}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const Logo = ({ tool, size = 36 }: { tool: Tool; size?: number }) => {
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

  // Fallback: colored initial
  if (!src || failed >= 2) {
    let hash = 0;
    for (let i = 0; i < tool.name.length; i++) hash = tool.name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
        style={{ width: size, height: size, minWidth: size, minHeight: size, backgroundColor: `hsl(${hue}, 55%, 45%)` }}
      >
        {tool.name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return <img src={src} alt={`${tool.name} logo`} loading="lazy" fetchPriority="low" className="shrink-0 rounded-xl bg-white dark:bg-secondary/50 object-contain" style={{ width: size, height: size, minWidth: size, minHeight: size }} onError={handleError} />;
};

const BADGE_STYLES: Record<string, string> = {
  "Doublon": "bg-primary/10 text-primary border-primary/20",
  "Doublon IA": "bg-primary/10 text-primary border-primary/20",
  "Dormant": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "Inadapté": "bg-cancel/10 text-cancel border-cancel/20",
};

const PRESCRIPTION_ICONS: Record<string, typeof ArrowDownCircle> = {
  cancel: ArrowDownCircle,
  "replace-cheaper": RefreshCw,
  "replace-better": ArrowUpRight,
  downgrade: ChevronDown,
};

/* ═══════════ QUESTION CONFIG ═══════════ */

const QUESTION_CONFIG: Record<string, {
  label: string;
  options: { value: string; label: string }[];
}> = {
  'check_if_user_is_on_free_tier': {
    label: 'Tu utilises la version gratuite ou payante ?',
    options: [
      { value: 'free', label: 'Gratuite' },
      { value: 'paid', label: 'Payante' },
    ]
  },
  'primary_ai_tasks': {
    label: "Tu l'utilises principalement pour quoi ?",
    options: [
      { value: 'writing', label: 'Rédiger et reformuler' },
      { value: 'research', label: 'Recherche et veille' },
      { value: 'code', label: 'Coder' },
      { value: 'images', label: 'Générer des visuels' },
      { value: 'other', label: 'Autre usage' },
    ]
  },
  'daily_usage_intensity': {
    label: "Combien de fois par semaine l'utilises-tu ?",
    options: [
      { value: 'daily', label: 'Tous les jours' },
      { value: 'few', label: '2 à 3 fois' },
      { value: 'rarely', label: 'Rarement' },
    ]
  },
  'team_requirement': {
    label: "C'est un outil solo ou partagé avec une équipe ?",
    options: [
      { value: 'solo', label: 'Solo uniquement' },
      { value: 'team', label: 'Partagé en équipe' },
    ]
  },
  'check_if_free_alternative_covers_needs': {
    label: "As-tu essayé l'alternative gratuite disponible ?",
    options: [
      { value: 'yes_works', label: 'Oui, elle fonctionne bien' },
      { value: 'yes_not', label: 'Oui, mais elle ne suffit pas' },
      { value: 'no', label: 'Non, pas encore' },
    ]
  },
  'check_current_plan_vs_usage': {
    label: 'Utilises-tu toutes les fonctions de ton plan actuel ?',
    options: [
      { value: 'all', label: 'Oui, pleinement' },
      { value: 'some', label: 'En partie' },
      { value: 'few', label: 'Très peu' },
    ]
  },
  'already_paying_for_chat_model': {
    label: 'As-tu déjà un abonnement à un outil IA généraliste ?',
    options: [
      { value: 'both', label: 'Oui, Claude et ChatGPT' },
      { value: 'one', label: "Oui, l'un ou l'autre" },
      { value: 'none', label: 'Non' },
    ]
  },
  'writing_volume': {
    label: "Combien d'heures par semaine écris-tu avec cet outil ?",
    options: [
      { value: 'heavy', label: 'Plus de 5h' },
      { value: 'medium', label: '1 à 5h' },
      { value: 'light', label: "Moins d'1h" },
    ]
  },
  'storage_gb': {
    label: 'Combien de données stockes-tu ?',
    options: [
      { value: 'heavy', label: 'Plus de 100 Go' },
      { value: 'medium', label: '10 à 100 Go' },
      { value: 'light', label: 'Moins de 10 Go' },
    ]
  },
  'browser_integration_needed': {
    label: "As-tu besoin de l'extension navigateur ?",
    options: [
      { value: 'yes', label: "Oui, je l'utilise" },
      { value: 'no', label: 'Non' },
    ]
  },
  'large_files': {
    label: 'Travailles-tu avec des fichiers lourds (vidéo, RAW, 3D) ?',
    options: [
      { value: 'yes', label: 'Oui, régulièrement' },
      { value: 'no', label: 'Non' },
    ]
  },
  'offline_requirement': {
    label: "As-tu besoin d'accéder à tes fichiers sans connexion ?",
    options: [
      { value: 'yes', label: 'Oui' },
      { value: 'no', label: 'Non' },
    ]
  },
  'monthly_revenue': {
    label: "Ton chiffre d'affaires mensuel est dans quelle fourchette ?",
    options: [
      { value: 'lt2k', label: 'Moins de 2 000€' },
      { value: '2k10k', label: '2 000€ à 10 000€' },
      { value: 'gt10k', label: 'Plus de 10 000€' },
    ]
  },
  'country_compliance': {
    label: 'As-tu des contraintes réglementaires spécifiques ?',
    options: [
      { value: 'yes', label: 'Oui (RGPD, conformité sectorielle)' },
      { value: 'no', label: 'Non' },
    ]
  },
  'bank_sync_needed': {
    label: 'As-tu besoin de synchronisation bancaire automatique ?',
    options: [
      { value: 'yes', label: 'Oui' },
      { value: 'no', label: 'Non' },
    ]
  },
  'brand_assets_needed': {
    label: 'As-tu besoin de créer des assets de marque ?',
    options: [
      { value: 'yes', label: 'Oui' },
      { value: 'no', label: 'Non' },
    ]
  },
  'presentation_requirement': {
    label: "L'utilises-tu pour des présentations clients ?",
    options: [
      { value: 'yes', label: 'Oui' },
      { value: 'no', label: 'Non' },
    ]
  },
  'languages_used': {
    label: 'Écris-tu en plusieurs langues ?',
    options: [
      { value: 'yes', label: 'Oui' },
      { value: 'no', label: 'Non' },
    ]
  },
  'version_history_requirement': {
    label: "As-tu besoin d'un historique de versions ?",
    options: [
      { value: 'yes', label: 'Oui' },
      { value: 'no', label: 'Non' },
    ]
  },
  'database_usage': {
    label: "L'utilises-tu comme base de données ?",
    options: [
      { value: 'yes', label: 'Oui' },
      { value: 'no', label: 'Non' },
    ]
  },
  'ai_requirement': {
    label: 'Utilises-tu les fonctions IA de cet outil ?',
    options: [
      { value: 'yes', label: 'Oui' },
      { value: 'no', label: 'Non' },
    ]
  },
  'team_collaboration': {
    label: 'Combien de personnes partagent cet outil ?',
    options: [
      { value: 'solo', label: 'Moi seul' },
      { value: 'small', label: '2-5 personnes' },
      { value: 'large', label: 'Plus de 5' },
    ]
  },
};

/* ═══════════ Verdict computation after answering questions ═══════════ */

interface QuestionVerdict {
  type: 'ferme' | 'silence';
  message: string;
  gain?: number;
  replacement?: string;
}

function computeQuestionVerdict(
  tool: Tool, answers: Record<string, string>,
  allTools: Tool[], currentToolIds: string[]
): QuestionVerdict {
  const price = tool.pricing_v5?.compare_price_monthly_eur ?? tool.defaultMonthlyPrice ?? 0;

  // Rule 1: Rarely used + free tier → downgrade
  if (answers['daily_usage_intensity'] === 'rarely' && tool.pricing_v5?.compare_plan_kind !== 'free') {
    return {
      type: 'ferme',
      message: "Tu l'utilises rarement — passe au plan gratuit.",
      gain: price,
    };
  }

  // Rule 2: Doublon with existing AI subscription
  if (answers['already_paying_for_chat_model'] === 'both' || answers['already_paying_for_chat_model'] === 'one') {
    const sameCluster = allTools.filter(t =>
      t.substitution_cluster_v2 === tool.substitution_cluster_v2 &&
      currentToolIds.includes(t.id) &&
      t.id !== tool.id
    );
    if (sameCluster.length > 0) {
      return {
        type: 'ferme',
        message: `${sameCluster[0].name} couvre déjà cet usage dans ta stack.`,
        gain: price,
      };
    }
  }

  // Rule 3: Daily usage → keep
  if (answers['daily_usage_intensity'] === 'daily') {
    return {
      type: 'silence',
      message: "Usage quotidien confirmé — cet outil mérite sa place dans ta stack.",
    };
  }

  // Rule 4: Free alternative works
  if (answers['check_if_free_alternative_covers_needs'] === 'yes_works') {
    const alt = allTools.find(t => t.id === tool.freeAlternative);
    return {
      type: 'ferme',
      message: "L'alternative gratuite couvre tes besoins.",
      gain: price,
      replacement: alt?.name,
    };
  }

  // Rule 5: Under-used features → downgrade
  if (answers['check_current_plan_vs_usage'] === 'few') {
    return {
      type: 'ferme',
      message: "Tu n'utilises pas tout — le plan gratuit suffit.",
      gain: price,
    };
  }

  // Default: keep
  return {
    type: 'silence',
    message: "Ton usage justifie cet outil. Rien à changer.",
  };
}

/* ═══════════ Check if timeGainedHoursPerMonth is reliable ═══════════ */

function isReliableTimeGained(tool: Tool): boolean {
  const t = tool.timeGainedHoursPerMonth || 0;
  if (t === 0) return false;
  const genericValues = [1.5, 2.0, 2.5, 3.0, 4.0, 4.5, 5.0];
  return !genericValues.includes(t);
}

/* ═══════════ Get tool price with bundle awareness ═══════════ */

function getToolDisplayPrice(tool: Tool, currentToolObjs: Tool[], t: (fr: string, en: string) => string): string {
  const bundleParent = tool.bundle_parent;
  if (bundleParent) {
    const bundleInStack = currentToolObjs.some(ct => ct.id === bundleParent);
    if (bundleInStack) {
      const parent = currentToolObjs.find(ct => ct.id === bundleParent);
      return t(`Inclus dans ${parent?.name || bundleParent}`, `Included in ${parent?.name || bundleParent}`);
    }
  }
  const price = tool.pricing_v5?.compare_price_monthly_eur ?? tool.defaultMonthlyPrice ?? 0;
  if (price === 0) return t("Gratuit", "Free");
  return `${Math.round(price * 100) / 100}€/${t("mois", "mo")}`;
}

/* ═══════════ Main ═══════════ */

const ResultsPage = () => {
  const { t, prefix, lang } = useLang();
  const navigate = useNavigate();
  const { tools } = useTools();
  const [results, setResults] = useState<SelectorResults | null>(null);
  const [form, setForm] = useState<SelectorFormData | null>(null);
  const [copied, setCopied] = useState(false);
  const [fichesExpanded, setFichesExpanded] = useState(true);
  const [showAllRecs, setShowAllRecs] = useState(false);

  // Question card states: { [toolId]: { answers: Record<string, string>, verdict: QuestionVerdict | null, open: boolean } }
  const [questionStates, setQuestionStates] = useState<Record<string, {
    answers: Record<string, string>;
    verdict: QuestionVerdict | null;
    open: boolean;
  }>>({});

  // Track newly certified savings from answered questions
  const [extraSavings, setExtraSavings] = useState(0);
  const [resolvedToolIds, setResolvedToolIds] = useState<Set<string>>(new Set());

  const tjmMedian = useMemo(() => {
    if (!form?.tjm) return 0;
    return TJM_OPTIONS.find((o) => o.value === form.tjm)?.median || 0;
  }, [form]);

  // currentToolObjs for bundle price display — must be before early return (hooks rules)
  const currentToolObjs = useMemo(() =>
    (form?.currentTools || []).map(ct => tools.find(t => t.id === ct.toolId)).filter(Boolean) as Tool[],
    [form?.currentTools, tools]
  );

  /* ── init ── */
  useEffect(() => {
    setNoindex(); // Dynamic results should not be indexed
    if (tools.length === 0) return;
    const data = sessionStorage.getItem("tooltrim_selector");
    if (!data) { navigate(`${prefix}/selector`); return; }
    const parsed: SelectorFormData = JSON.parse(data);
    setForm(parsed);
    const r = generateScoringResults(parsed, tools, lang);
    setResults(r);
    supabase.from("selector_results").insert({
      persona: parsed.family || parsed.persona || "unknown",
      stack_health_score: r.stackHealthScore >= 0 ? r.stackHealthScore : null,
      recommended_tools: r.recommended.map((s) => ({ id: s.tool.id, score: s.finalScore })),
      tools_to_cancel: r.toCancel.map((s) => ({ id: s.tool.id, score: s.finalScore, saving: s.tool.defaultMonthlyPrice })),
      estimated_savings_monthly: r.totalSavingsMonthly,
      roi_analysis: r.recommended.map((s) => ({ id: s.tool.id, valueIndex: s.valueIndex, valueCreated: s.valueCreated })),
      verticals_composite: parsed.verticals,
      user_stack: parsed.currentTools,
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

  if (!results || !form) return null;

  const family = VERTICAL_FAMILIES.find((f) => f.value === form.family);
  const phase = PHASE_OPTIONS.find((p) => p.value === form.projectPhase);
  const tjmLabel = TJM_OPTIONS.find((o) => o.value === form.tjm);

  // Total stack cost from scoring (pricing_v5 + bundle dedup)
  const stackCost = Math.round((results.totalStackCost ?? 0) * 100) / 100;
  const displayName = form.firstName?.trim() || t("votre profil", "your profile");

  const healthPct = results.stackHealthScore;
  const healthColor = healthPct >= 80 ? "text-keep" : healthPct >= 60 ? "text-optimize" : healthPct >= 40 ? "text-orange-500" : "text-cancel";
  const healthLabel = healthPct >= 80
    ? t("Optimisée", "Optimized")
    : healthPct >= 60 ? t("Correcte", "Correct")
    : healthPct >= 40 ? t("À revoir", "Needs review") : t("Critique", "Critical");

  const recsToShow = showAllRecs ? results.recommended : results.recommended.slice(0, 6);

  // Split prescriptions: Bloc 1 = ferme (économies), Bloc 2 = question (verdicts en attente)
  const fermeFiches = results.fiches.filter((f) => f.tool.prescription_quality === "ferme");
  const upgradeFiches = fermeFiches.filter(f => (f.gainMonthly ?? f.gain) < 0);
  const savingsFiches = fermeFiches.filter(f => (f.gainMonthly ?? f.gain) >= 0);

  // Savings total: only positive gains from ferme + extra from resolved questions
  const certifiedSavings = results.totalSavingsMonthly + extraSavings;
  const certifiedSavingsAnnual = Math.round(certifiedSavings * 12);

  // Question tools (not yet resolved)
  const activeQuestionTools = (results.questionTools || []).filter(t => !resolvedToolIds.has(t.id));

  const fermeCount = savingsFiches.length + upgradeFiches.length;
  const questionCount = activeQuestionTools.length;

  // currentToolObjs for bundle price display
  const currentToolObjs = useMemo(() =>
    form.currentTools.map(ct => tools.find(t => t.id === ct.toolId)).filter(Boolean) as Tool[],
    [form.currentTools, tools]
  );

  // Handle question answer
  const handleAnswer = (toolId: string, questionKey: string, value: string) => {
    setQuestionStates(prev => {
      const state = prev[toolId] || { answers: {}, verdict: null, open: true };
      return {
        ...prev,
        [toolId]: { ...state, answers: { ...state.answers, [questionKey]: value } },
      };
    });
  };

  // Submit verdict for a question tool
  const handleSubmitVerdict = (tool: Tool) => {
    const state = questionStates[tool.id];
    if (!state) return;
    const verdict = computeQuestionVerdict(
      tool, state.answers, tools, form.currentTools.map(ct => ct.toolId)
    );
    setQuestionStates(prev => ({
      ...prev,
      [tool.id]: { ...prev[tool.id], verdict },
    }));
    if (verdict.type === 'ferme' && verdict.gain && verdict.gain > 0) {
      setExtraSavings(prev => prev + verdict.gain!);
    }
    setResolvedToolIds(prev => new Set([...prev, tool.id]));
  };

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="min-h-screen bg-background">

      {/* ─── HERO ─── */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-12">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{t("Votre analyse", "Your analysis")}</p>
              <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">{t("Stack Diagnostic", "Stack Diagnostic")}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => navigate(`${prefix}/selector`)} className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary">
                <Pencil className="h-3.5 w-3.5" /> {t("Modifier", "Edit")}
              </button>
              <button onClick={handleShare} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary">
                <Copy className="h-3.5 w-3.5" />
                {copied ? t("Copié !", "Copied!") : t("Partager", "Share")}
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {/* Stack Health */}
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg shadow-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 opacity-70" />
                <p className="text-xs font-medium uppercase tracking-wider opacity-80">Stack Health</p>
              </div>
              <p className="font-heading text-4xl font-extrabold tabular-nums leading-none">
                {results.hasCurrentTools && healthPct >= 0 ? healthPct : "—"}
              </p>
              <p className="mt-2 text-xs font-medium opacity-80">
                {results.hasCurrentTools ? healthLabel : t("Ajoutez vos outils", "Add your tools")}
              </p>
            </div>

            {/* Savings — always positive, always green */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-keep" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("Économies", "Savings")}</p>
              </div>
              <p className={`font-heading text-4xl font-extrabold tabular-nums leading-none ${certifiedSavings > 0 ? "text-keep" : "text-muted-foreground/30"}`}>
                {certifiedSavings > 0 ? `+${Math.round(certifiedSavings)}€` : "0€"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {results.isStackFree ? t("Stack 100% gratuite", "100% free stack") : certifiedSavings > 0 ? `${certifiedSavingsAnnual}€/${t("an", "yr")}` : t("Aucune économie", "No savings")}
              </p>
            </div>

            {/* Stack */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("Stack actuelle", "Current Stack")}</p>
              </div>
              <p className="font-heading text-4xl font-extrabold tabular-nums leading-none">{form.currentTools.length}</p>
              <p className="mt-2 text-xs text-muted-foreground">{t("outils", "tools")} · {stackCost}€/{t("mois", "mo")}</p>
            </div>

            {/* Profile */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("Profil", "Profile")}</p>
              </div>
              <p className="font-heading text-lg font-bold leading-tight">{family ? `${family.emoji} ${lang === "en" ? family.labelEn : family.label}` : "—"}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {tjmLabel ? (lang === "fr" ? tjmLabel.label : tjmLabel.labelEn) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-10 space-y-10">

        {/* ─── "Analysé pour toi" Block ─── */}
        {results.hasCurrentTools && (
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold">{t("Analysé pour toi", "Analyzed for you")}</h2>
                <p className="text-xs text-muted-foreground">{t("Résumé de notre diagnostic", "Summary of our diagnostic")}</p>
              </div>
            </div>

            {/* Profile influence text */}
            <div className="space-y-2 mb-4 rounded-xl bg-secondary/30 border border-border p-4">
              {(() => {
                const lines: string[] = [];
                if (form.tjm === 'gt600' || form.tjm === '400-600')
                  lines.push(t("⏱️ Avec ton TJM, ton temps vaut plus que tes abonnements. On a mis en avant ce qui te fait gagner des heures, pas juste quelques euros.", "⏱️ With your daily rate, your time is worth more than your subscriptions. We prioritized time savings over small cost cuts."));
                else if (form.tjm === 'lt200' || form.tjm === '200-400')
                  lines.push(t("💸 On a cherché les économies les plus concrètes en premier — chaque ligne de ta stack doit vraiment gagner sa place.", "💸 We looked for the most concrete savings first — every line in your stack must earn its place."));
                else
                  lines.push(t("📋 Sans TJM, on t'a classé les recommandations par économie directe — tu ajustes selon ta réalité.", "📋 Without a daily rate, we ranked recommendations by direct savings — adjust to your reality."));

                if (form.projectPhase === 'lancement')
                  lines.push(t("🌱 Tu construis encore — on a cherché à alléger, pas à optimiser. Les alternatives gratuites passent avant tout.", "🌱 You're still building — we focused on reducing costs, not optimizing. Free alternatives come first."));
                else if (form.projectPhase === 'croissance')
                  lines.push(t("📈 En croissance, les doublons et les outils fantômes coûtent cher en attention autant qu'en argent. On les a traqués.", "📈 While growing, duplicates and ghost tools cost attention as much as money. We tracked them down."));
                else
                  lines.push(t("⚡ Ta stack est installée. Avant de tout changer, on t'a cherché des downgrades de plan indolores.", "⚡ Your stack is set. Before changing everything, we looked for painless plan downgrades."));

                if (form.techMaturity === 'zero-config')
                  lines.push(t("🎯 On a écarté les alternatives qui demandent une config technique — les recommandations doivent marcher sans friction.", "🎯 We excluded alternatives requiring technical setup — recommendations must work friction-free."));
                else if (form.techMaturity === 'expert')
                  lines.push(t("🔧 Profil technique : on t'a tout montré, y compris les options qui demandent un peu de mise en place.", "🔧 Technical profile: we showed everything, including options that require some setup."));

                return lines.map((line, i) => (
                  <p key={i} className="text-[13px] text-foreground/80 leading-relaxed">{line}</p>
                ));
              })()}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl bg-keep/5 border border-keep/10 p-3">
                <BadgeCheck className="h-5 w-5 text-keep shrink-0" />
                <div>
                  <p className="text-2xl font-heading font-bold tabular-nums text-keep">{fermeCount}</p>
                  <p className="text-[11px] text-muted-foreground">{t("prescriptions certifiées", "certified prescriptions")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
                <HelpCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-2xl font-heading font-bold tabular-nums text-amber-600">{questionCount}</p>
                  <p className="text-[11px] text-muted-foreground">{t("verdicts en attente", "pending verdicts")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-keep/5 border border-keep/10 p-3">
                <Clock className="h-5 w-5 text-keep shrink-0" />
                <div>
                  <p className="text-sm font-heading font-bold text-keep">
                    {results.latestVerifiedOn || t("Non vérifié", "Not verified")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{t("dernière vérification prix", "last price check")}</p>
                </div>
              </div>
            </div>
            {certifiedSavings > 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t(
                  `Économie certifiée : +${Math.round(certifiedSavings)}€/mois (+${certifiedSavingsAnnual}€/an), uniquement basée sur des prescriptions vérifiées.`,
                  `Certified savings: +${Math.round(certifiedSavings)}€/mo (+${certifiedSavingsAnnual}€/yr), based only on verified prescriptions.`
                )}
              </p>
            )}
          </section>
        )}

        {/* ─── Banners ─── */}
        {results.hasAiDoublon && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3">
            <Zap className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-primary font-medium">{t("⚡ Doublon IA détecté — Vous utilisez plusieurs outils IA pour le même usage.", "⚡ AI Duplicate detected — You're using multiple AI tools for the same purpose.")}</p>
          </div>
        )}

        {!results.hasCurrentTools && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground max-w-xs">{t("Ajoutez vos outils dans le sélecteur pour obtenir une analyse complète de votre stack.", "Add your tools in the selector to get a complete stack analysis.")}</p>
            <Link to={`${prefix}/selector`} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 shadow-sm shadow-primary/20">
              {t("Ajouter mes outils", "Add my tools")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* ─── BLOC 1: ÉCONOMIES CERTIFIÉES (ferme only) ─── */}
        {results.hasCurrentTools && savingsFiches.length > 0 && (
          <section>
            <button onClick={() => setFichesExpanded(!fichesExpanded)} className="flex w-full items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{t("Économies certifiées", "Certified Savings")}</h2>
                <span className="rounded-full bg-keep/10 px-2.5 py-0.5 text-xs font-semibold text-keep tabular-nums">
                  +{Math.round(savingsFiches.reduce((s, f) => s + Math.max(f.gainMonthly ?? f.gain, 0), 0))}€/{t("mois", "mo")}
                </span>
                <Tip text={t("Actions concrètes vérifiées pour optimiser ta stack.", "Verified concrete actions to optimize your stack.")} />
              </div>
              {fichesExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {fichesExpanded && (
              <div className="space-y-3">
                {savingsFiches.map((fiche) => {
                  const Icon = PRESCRIPTION_ICONS[fiche.type] || ArrowDownCircle;
                  const badgeStyle = BADGE_STYLES[fiche.badge || ""] || "bg-muted text-muted-foreground";
                  return (
                    <FicheCard key={fiche.tool.id} fiche={fiche} Icon={Icon} badgeStyle={badgeStyle} prefix={prefix} t={t} lang={lang} currentToolObjs={currentToolObjs} />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Upgrades section (negative gain = quality upgrade, NOT savings) */}
        {results.hasCurrentTools && upgradeFiches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold">{t("Upgrades recommandés", "Recommended Upgrades")}</h2>
              <Tip text={t("Ces remplacements améliorent la qualité, pas le prix.", "These replacements improve quality, not price.")} />
            </div>
            <div className="space-y-3">
              {upgradeFiches.map((fiche) => {
                const Icon = PRESCRIPTION_ICONS[fiche.type] || ArrowUpRight;
                return (
                  <FicheCard key={fiche.tool.id} fiche={fiche} Icon={Icon} badgeStyle="bg-optimize/10 text-optimize border-optimize/20" prefix={prefix} t={t} lang={lang} currentToolObjs={currentToolObjs} />
                );
              })}
            </div>
          </section>
        )}

        {/* No prescriptions message */}
        {results.hasCurrentTools && fermeFiches.length === 0 && activeQuestionTools.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-keep/20 bg-keep/5 px-5 py-4">
            <CheckCircle2 className="h-5 w-5 text-keep shrink-0" />
            <p className="text-sm font-medium text-keep">{t("Ta stack est déjà solide sur les points qu'on peut certifier.", "Your stack is already solid on the points we can certify.")}</p>
          </div>
        )}

        {/* ─── BLOC 2: VERDICTS EN ATTENTE (question tools) ─── */}
        {results.hasCurrentTools && activeQuestionTools.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold">{t("Verdicts en attente", "Pending Verdicts")}</h2>
              <Tip text={t("Réponds à quelques questions pour débloquer ton verdict.", "Answer a few questions to unlock your verdict.")} />
            </div>
            <div className="space-y-3">
              {activeQuestionTools.map((tool) => (
                <QuestionToolCard
                  key={tool.id}
                  tool={tool}
                  state={questionStates[tool.id] || { answers: {}, verdict: null, open: false }}
                  onToggle={() => setQuestionStates(prev => ({
                    ...prev,
                    [tool.id]: { ...prev[tool.id] || { answers: {}, verdict: null, open: false }, open: !(prev[tool.id]?.open) },
                  }))}
                  onAnswer={(q, v) => handleAnswer(tool.id, q, v)}
                  onSubmit={() => handleSubmitVerdict(tool)}
                  t={t}
                  currentToolObjs={currentToolObjs}
                />
              ))}
            </div>
          </section>
        )}

        {/* Resolved question verdicts */}
        {resolvedToolIds.size > 0 && (
          <section>
            <div className="space-y-2">
              {Array.from(resolvedToolIds).map(toolId => {
                const tool = tools.find(t => t.id === toolId);
                const state = questionStates[toolId];
                if (!tool || !state?.verdict) return null;
                const v = state.verdict;
                return (
                  <div key={toolId} className={`flex items-center gap-3 rounded-xl border p-4 ${v.type === 'ferme' ? 'border-keep/20 bg-keep/5' : 'border-border bg-card'}`}>
                    <Logo tool={tool} size={28} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold">{tool.name}</h3>
                      <p className="text-xs text-muted-foreground">{v.message}</p>
                    </div>
                    {v.type === 'ferme' && v.gain && v.gain > 0 && (
                      <span className="rounded-lg bg-keep/10 px-2.5 py-1 text-sm font-bold tabular-nums text-keep">+{Math.round(v.gain)}€</span>
                    )}
                    {v.type === 'silence' && (
                      <span className="rounded-md bg-keep/10 border border-keep/20 px-2 py-0.5 text-[11px] font-semibold text-keep">✓ {t("Conservé", "Kept")}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── SILENCE TOOLS (core tools, no prescription) ─── */}
        {results.hasCurrentTools && (() => {
          const silenceTools = form.currentTools
            .map((ct) => results.scoredTools.find((s) => s.tool.id === ct.toolId))
            .filter((s): s is ScoredTool => {
              if (!s) return false;
              // Show tools that are silence/metier/plugin and NOT already prescribed
              const eff = s.tool.prescription_quality;
              const isCore = eff === "silence" || s.tool.tool_type === "metier" || s.tool.tool_type === "plugin";
              return isCore && s.action !== "cancel";
            });
          if (silenceTools.length === 0) return null;
          return (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold">{t("Outils métier", "Core tools")}</h2>
                <Tip text={t("Ces outils sont essentiels à ton activité. Aucune prescription.", "These tools are essential to your work. No prescription.")} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {silenceTools.map((s) => (
                  <div key={s.tool.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <Logo tool={s.tool} size={28} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold">{s.tool.name}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {s.tool.tool_type === "metier" ? t("Outil métier", "Core tool") : s.tool.tool_type === "plugin" ? "Plugin" : t("Outil de production", "Production tool")}
                      </p>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {getToolDisplayPrice(s.tool, currentToolObjs, t)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* ─── RECOMMENDATIONS ─── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-xl font-bold">{t("Meilleurs outils pour vous", "Best tools for you")}</h2>
            <Tip text={t("Score = pertinence (60%) + valeur (40%).", "Score = pertinence (60%) + value (40%).")} />
          </div>

          {results.recommended.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-12 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground max-w-xs">{t("Aucune recommandation pour le moment.", "No recommendations yet.")}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recsToShow.map((s) => (
                  <RecCard key={s.tool.id} s={s} prefix={prefix} t={t} isTjmZero={results.isTjmZero} form={form} userTools={form.currentTools} />
                ))}
              </div>
              {results.recommended.length > 6 && !showAllRecs && (
                <div className="mt-4 text-center">
                  <button onClick={() => setShowAllRecs(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    {t(`Voir les ${results.recommended.length - 6} autres`, `See ${results.recommended.length - 6} more`)} <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ─── ROI Summary — hide unreliable "value created" ─── */}
        {results.hasCurrentTools && !results.isTjmZero && results.recommended.filter((s) => s.valueCreated > 0 && isReliableTimeGained(s.tool)).length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">{t("Analyse ROI", "ROI Analysis")}</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Outil", "Tool")}</th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Coût", "Cost")}</th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Temps gagné", "Time saved")}</th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Verdict", "Verdict")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.recommended.filter((s) => s.valueCreated > 0 && isReliableTimeGained(s.tool)).slice(0, 10).map((s, i) => (
                      <tr key={s.tool.id} className={`border-b border-border/40 last:border-0 transition-colors hover:bg-secondary/10 ${i % 2 === 1 ? "bg-secondary/5" : ""}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Logo tool={s.tool} size={24} />
                            <span className="font-medium">{s.tool.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                          {(s.tool.pricing_v5?.compare_price_monthly_eur ?? s.tool.defaultMonthlyPrice) > 0
                            ? `${s.tool.pricing_v5?.compare_price_monthly_eur ?? s.tool.defaultMonthlyPrice}€/${t("mois", "mo")}`
                            : t("Gratuit", "Free")}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold text-keep">
                          {t(`Jusqu'à ${s.tool.timeGainedHoursPerMonth}h/mois`, `Up to ${s.tool.timeGainedHoursPerMonth}h/mo`)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${s.valueIndex > 80 ? "bg-keep/10 text-keep" : s.valueIndex > 40 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {s.valueIndex > 80 ? "Excellent" : s.valueIndex > 40 ? t("Bon", "Good") : t("Faible", "Low")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TJM zero → show hours (only reliable) */}
        {results.hasCurrentTools && results.isTjmZero && results.recommended.filter((s) => isReliableTimeGained(s.tool)).length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">{t("Temps gagné", "Time saved")}</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Outil", "Tool")}</th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Coût", "Cost")}</th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("Heures gagnées", "Hours saved")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.recommended.filter((s) => isReliableTimeGained(s.tool)).map((s, i) => (
                      <tr key={s.tool.id} className={`border-b border-border/40 last:border-0 transition-colors hover:bg-secondary/10 ${i % 2 === 1 ? "bg-secondary/5" : ""}`}>
                        <td className="px-5 py-3"><div className="flex items-center gap-2.5"><Logo tool={s.tool} size={24} /><span className="font-medium">{s.tool.name}</span></div></td>
                        <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{(s.tool.pricing_v5?.compare_price_monthly_eur ?? s.tool.defaultMonthlyPrice) > 0 ? `${s.tool.pricing_v5?.compare_price_monthly_eur ?? s.tool.defaultMonthlyPrice}€` : t("Gratuit", "Free")}</td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold text-keep">{s.tool.timeGainedHoursPerMonth}h/{t("mois", "mo")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

/* ═══════════ Sub-components ═══════════ */

function FicheCard({ fiche, Icon, badgeStyle, prefix, t, lang, currentToolObjs }: {
  fiche: Fiche; Icon: typeof ArrowDownCircle; badgeStyle: string; prefix: string;
  t: (fr: string, en: string) => string; lang: string; currentToolObjs: Tool[];
}) {
  const [open, setOpen] = useState(false);
  const isFerme = fiche.tool.prescription_quality === "ferme";
  const gain = fiche.gainMonthly ?? fiche.gain;
  const isUpgrade = gain < 0;

  // Contextual badge message
  const contextBadge = (() => {
    const po = fiche.tool.prescription_output;
    if (!po) return null;
    if (fiche.tool.substitution_cluster_v2?.startsWith('ai-') && gain > 0)
      return t("Tu paies deux fois pour le même usage IA", "You're paying twice for the same AI use case");
    if (po.price_alt_eur === 0)
      return t("Il existe une alternative gratuite qui fait le même boulot", "There's a free alternative that does the same job");
    if (gain < 0)
      return t("Pas une économie — un meilleur outil pour ce que tu fais", "Not a saving — a better tool for what you do");
    if (gain >= 8)
      return t("Économie directe et sans friction", "Direct and frictionless saving");
    return t("Un remplacement qui tient la route", "A solid replacement");
  })();

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-all hover:shadow-sm ${isFerme ? "border-primary/30" : "border-border"}`}>
      {contextBadge && (
        <div className={`px-4 py-1.5 text-[11px] font-medium ${isFerme ? "bg-primary/5 text-primary" : "bg-secondary/50 text-muted-foreground"}`}>
          {contextBadge}
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <Logo tool={fiche.tool} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">{fiche.tool.name}</h3>
            {fiche.badge && <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${badgeStyle}`}>{fiche.badge}</span>}
            {isFerme && (
              <span className="rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary flex items-center gap-0.5">
                <BadgeCheck className="h-2.5 w-2.5" /> {t("Vérifié", "Verified")}
              </span>
            )}
            {isUpgrade && (
              <span className="rounded-md bg-optimize/10 border border-optimize/20 px-1.5 py-0.5 text-[10px] font-semibold text-optimize">
                {t("Upgrade recommandé", "Recommended upgrade")}
              </span>
            )}
            {fiche.maturityWarning && (
              <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" /> {t("Niveau technique", "Tech level")}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{fiche.diagnostic}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isUpgrade ? (
            <span className="rounded-lg bg-optimize/10 px-2.5 py-1 text-sm font-bold tabular-nums text-optimize">↑ {t("Upgrade", "Upgrade")}</span>
          ) : gain > 0 ? (
            <span className="rounded-lg bg-keep/10 px-2.5 py-1 text-sm font-bold tabular-nums text-keep">+{Math.round(gain)}€</span>
          ) : null}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 space-y-3 bg-secondary/20">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("Diagnostic", "Diagnosis")}</p>
            <p className="text-sm text-foreground/80">{fiche.diagnostic}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("Prescription", "Prescription")}</p>
            <p className="text-sm font-medium text-primary">{fiche.prescription}</p>
          </div>
          {fiche.priceTool != null && fiche.priceAlt != null && (
            <div className="flex gap-4 text-sm tabular-nums">
              <span className="text-muted-foreground">{fiche.tool.name}: <span className="font-semibold">{fiche.priceTool}€/{t("mois", "mo")}</span></span>
              <span className="text-primary">{fiche.alternative?.name || "Alt"}: <span className="font-semibold">{fiche.priceAlt}€/{t("mois", "mo")}</span></span>
            </div>
          )}
          {gain > 0 && (
            <p className="text-sm font-semibold tabular-nums text-keep">
              {t("Économie", "Savings")} : +{Math.round(gain)}€/{t("mois", "mo")} · +{Math.round(fiche.gainAnnual ?? gain * 12)}€/{t("an", "yr")}
            </p>
          )}
          {gain < 0 && (
            <p className="text-sm font-semibold tabular-nums text-optimize">
              {t("Surcoût", "Extra cost")} : {Math.round(Math.abs(gain))}€/{t("mois", "mo")} {t("pour un outil plus adapté", "for a better-suited tool")}
            </p>
          )}
          {fiche.verifiedOn && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <BadgeCheck className="h-3 w-3 text-primary" /> {t("Prix vérifié le", "Price verified on")} {fiche.verifiedOn}
            </p>
          )}
          {fiche.alternative && (
            <Link to={`${prefix}/tool/${fiche.alternative.slug || fiche.alternative.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              <ArrowUpRight className="h-3.5 w-3.5" /> {t("Voir l'alternative", "See alternative")} : {fiche.alternative.name}
            </Link>
          )}
          {fiche.migrationGuide && (
            <div className="rounded-lg bg-background border border-border p-3 text-xs space-y-1">
              <p className="font-semibold text-muted-foreground">{t("Guide de migration", "Migration guide")}</p>
              {fiche.migrationGuide.steps.map((step, i) => (
                <p key={i} className="text-muted-foreground">{i + 1}. {step}</p>
              ))}
              <p className="text-muted-foreground/70">⏱ {fiche.migrationGuide.timeEstimate}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════ Question Tool Card ═══════════ */

function QuestionToolCard({ tool, state, onToggle, onAnswer, onSubmit, t, currentToolObjs }: {
  tool: Tool;
  state: { answers: Record<string, string>; verdict: QuestionVerdict | null; open: boolean };
  onToggle: () => void;
  onAnswer: (questionKey: string, value: string) => void;
  onSubmit: () => void;
  t: (fr: string, en: string) => string;
  currentToolObjs: Tool[];
}) {
  // Get mapped questions (max 3)
  const questions = (tool.prescription_context_questions || [])
    .filter(q => QUESTION_CONFIG[q])
    .slice(0, 3);

  const answeredCount = questions.filter(q => state.answers[q]).length;
  const allAnswered = answeredCount === questions.length && questions.length > 0;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-card overflow-hidden">
      {/* Header — always visible */}
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
        <Logo tool={tool} size={32} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold">{tool.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{tool.shortDescription}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
            {t("Verdict en attente", "Pending verdict")}
          </span>
          {state.open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded: questions */}
      {state.open && questions.length > 0 && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-amber-500/5">
          {questions.map((qKey) => {
            const config = QUESTION_CONFIG[qKey];
            if (!config) return null;
            return (
              <div key={qKey}>
                <p className="text-sm font-medium mb-2">{config.label}</p>
                <div className="flex flex-wrap gap-2">
                  {config.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onAnswer(qKey, opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        state.answers[qKey] === opt.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {allAnswered && (
            <button
              onClick={onSubmit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("Obtenir mon verdict", "Get my verdict")} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* No mapped questions fallback */}
      {state.open && questions.length === 0 && (
        <div className="border-t border-border px-4 py-4 bg-amber-500/5">
          <p className="text-sm text-muted-foreground">{t("Analyse manuelle nécessaire — nous ne pouvons pas encore automatiser ce verdict.", "Manual analysis needed — we can't automate this verdict yet.")}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════ Recommendation Card ═══════════ */

function RecCard({ s, prefix, t, isTjmZero, form, userTools }: {
  s: ScoredTool; prefix: string; t: (fr: string, en: string) => string; isTjmZero?: boolean;
  form: SelectorFormData; userTools: SelectorFormData["currentTools"];
}) {
  const scoreBadge = s.finalScore > 80
    ? { text: "Excellent", cls: "bg-keep/10 text-keep border-keep/20" }
    : s.finalScore > 60
    ? { text: t("Bon", "Good"), cls: "bg-primary/10 text-primary border-primary/20" }
    : { text: t("Pertinent", "Relevant"), cls: "bg-muted text-muted-foreground border-border" };

  // "Pourquoi cet outil ?" — personalized reasoning
  const whyLines: string[] = [];
  const isSolo = form.family === "creatif" || form.family === "content" || form.family === "tech";
  const price = s.tool.pricing_v5?.compare_price_monthly_eur ?? s.tool.defaultMonthlyPrice ?? 0;

  if (isSolo && s.tool.soloRelevance)
    whyLines.push(s.tool.soloRelevance);
  else if (!isSolo && s.tool.teamRelevance)
    whyLines.push(s.tool.teamRelevance);

  if (form.mainGoal === "reduce_costs" || form.projectPhase === "lancement") {
    if (price === 0) whyLines.push(t("✅ 100% gratuit — parfait pour réduire les coûts.", "✅ 100% free — perfect for cutting costs."));
    else if (price < 15) whyLines.push(t(`💰 Seulement ${Math.round(price)}€/mois — investissement minimal.`, `💰 Only ${Math.round(price)}€/mo — minimal investment.`));
  }

  // Only show time gained if reliable
  if (isReliableTimeGained(s.tool)) {
    whyLines.push(t(`⏱️ Jusqu'à ${s.tool.timeGainedHoursPerMonth}h gagnées par mois.`, `⏱️ Up to ${s.tool.timeGainedHoursPerMonth}h saved per month.`));
  }

  // Maturity warning badge
  const showMaturityWarning = needsMaturityWarning(s.tool.id, form.techMaturity);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md hover:shadow-primary/5">
      <div className="flex items-start gap-3 mb-3">
        <Logo tool={s.tool} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold truncate">{s.tool.name}</h3>
            <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${scoreBadge.cls}`}>{scoreBadge.text}</span>
            {showMaturityWarning && (
              <span className="shrink-0 rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" /> {t("Config technique", "Tech setup")}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">{s.tool.shortDescription}</p>
        </div>
      </div>

      {/* Price */}
      <p className="text-xs tabular-nums text-muted-foreground mb-2">
        {price > 0 ? `${Math.round(price * 100) / 100}€/${t("mois", "mo")}` : t("Gratuit", "Free")}
      </p>

      {/* Pros as bullet points */}
      {s.tool.pros && Array.isArray(s.tool.pros) && s.tool.pros.length > 0 && (
        <ul className="mb-3 space-y-1">
          {(s.tool.pros as string[]).slice(0, 3).map((pro, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-keep shrink-0 mt-0.5" />
              <span className="line-clamp-1">{typeof pro === 'string' ? pro : ''}</span>
            </li>
          ))}
        </ul>
      )}

      {/* "Pourquoi cet outil ?" pedagogical block */}
      {whyLines.length > 0 && (
        <div className="mb-3 rounded-lg bg-primary/5 border border-primary/10 p-3">
          <p className="text-[11px] font-semibold text-primary mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> {t("Pourquoi cet outil ?", "Why this tool?")}
          </p>
          {whyLines.map((line, i) => (
            <p key={i} className="text-[12px] text-foreground/70 leading-relaxed">{line}</p>
          ))}
        </div>
      )}

      <div className="mt-auto">
        {s.tool.affiliateLink ? (
          <a href={s.tool.affiliateLink} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/5 border border-primary/20 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
            {t("Essayer", "Try it")} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <Link to={`${prefix}/tool/${s.tool.slug}`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            {t("Voir la fiche", "Details")} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default ResultsPage;
