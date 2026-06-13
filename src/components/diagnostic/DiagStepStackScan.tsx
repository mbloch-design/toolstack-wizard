import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  ChevronRight,
  FileText,
  FolderKanban,
  Layers3,
  MessageSquare,
  Palette,
  Plus,
  Receipt,
  Search,
  Shield,
  Video,
  Workflow,
  X,
} from "lucide-react";
import ToolLogo from "@/components/ToolLogo";
import type { SessionState, Tool } from "@/types/diagnostic";
import {
  formatMonthlyEur,
  formatMonthlyTotal,
  formatToolMonthlyBudget,
  formatToolMonthlyPrice,
  getMonthlyBudgetBreakdown,
  getPricingAudit,
  getPricingCaptureSummary,
} from "@/utils/diagnosticPricing";

interface Props {
  session: SessionState;
  tools: Tool[];
  onUpdate: (patch: Partial<SessionState>) => void;
  onNext: () => void;
  onPrev?: () => void;
  onTrack?: (eventName: string, eventPayload?: Record<string, unknown>) => void;
  t: (fr: string, en: string) => string;
  fromTool?: string;
}

const STACK_MOMENTS = [
  {
    id: "ai-assistant",
    Icon: Brain,
    fr: "IA et recherche",
    en: "AI and research",
    questionFr: "Quels assistants IA ou outils de recherche utilises-tu vraiment ?",
    questionEn: "Which AI assistants or research tools do you really use?",
    hintFr: "ChatGPT, Claude, Perplexity, Gemini, Copilot...",
    hintEn: "ChatGPT, Claude, Perplexity, Gemini, Copilot...",
    pattern: /ai|ia|chatgpt|claude|perplexity|gemini|copilot|deepseek|mistral|research|recherche/i,
    ids: ["chatgpt", "claude", "perplexity", "gemini", "github-copilot", "deepseek"],
  },
  {
    id: "docs-knowledge",
    Icon: FileText,
    fr: "Docs et connaissance",
    en: "Docs and knowledge",
    questionFr: "Où écris-tu, ranges-tu tes notes, docs, briefs ou contenus ?",
    questionEn: "Where do you write and organize notes, docs, briefs or content?",
    hintFr: "Notion, Google Drive, Docs, Airtable, Coda...",
    hintEn: "Notion, Google Drive, Docs, Airtable, Coda...",
    pattern: /doc|docs|notion|drive|airtable|coda|knowledge|wiki|content|writing|redaction|document|note/i,
    ids: ["notion", "google-drive", "airtable", "coda", "google-docs"],
  },
  {
    id: "creative-production",
    Icon: Palette,
    fr: "Création visuelle",
    en: "Creative production",
    questionFr: "Quels outils te servent à créer, designer, monter ou produire des visuels ?",
    questionEn: "Which tools do you use to design, edit or produce visuals?",
    hintFr: "Canva, Figma, Adobe, Midjourney, Runway, CapCut...",
    hintEn: "Canva, Figma, Adobe, Midjourney, Runway, CapCut...",
    pattern: /design|figma|canva|adobe|midjourney|runway|video|image|visual|creative|creation|capcut|photo/i,
    ids: ["canva", "figma", "midjourney", "runway", "capcut", "adobe-creative-cloud"],
  },
  {
    id: "automation",
    Icon: Workflow,
    fr: "Automatisation",
    en: "Automation",
    questionFr: "As-tu des automatisations ou connecteurs entre tes outils ?",
    questionEn: "Do you use automations or connectors between tools?",
    hintFr: "Make, Zapier, n8n, Airtable automations...",
    hintEn: "Make, Zapier, n8n, Airtable automations...",
    pattern: /automation|automatisation|workflow|make|zapier|n8n|connector|integration|api/i,
    ids: ["make", "zapier", "n8n", "airtable"],
  },
  {
    id: "communication",
    Icon: MessageSquare,
    fr: "Communication client",
    en: "Client communication",
    questionFr: "Comment échanges-tu avec tes clients, prospects ou équipes ?",
    questionEn: "How do you communicate with clients, leads or teams?",
    hintFr: "Slack, Gmail, WhatsApp, Teams, Discord...",
    hintEn: "Slack, Gmail, WhatsApp, Teams, Discord...",
    pattern: /slack|gmail|mail|email|teams|discord|whatsapp|communication|chat|inbox|messaging/i,
    ids: ["slack", "gmail", "microsoft-teams", "discord"],
  },
  {
    id: "project-delivery",
    Icon: FolderKanban,
    fr: "Projet et livraison",
    en: "Project and delivery",
    questionFr: "Qu’est-ce qui pilote tes tâches, projets, tickets ou livrables ?",
    questionEn: "What manages your tasks, projects, tickets or deliverables?",
    hintFr: "Trello, Asana, Linear, Jira, ClickUp, Monday...",
    hintEn: "Trello, Asana, Linear, Jira, ClickUp, Monday...",
    pattern: /project|projet|task|ticket|delivery|kanban|trello|asana|linear|jira|clickup|monday/i,
    ids: ["trello", "asana", "linear", "jira", "clickup", "monday"],
  },
  {
    id: "meetings-video",
    Icon: Video,
    fr: "Rendez-vous et vidéo",
    en: "Meetings and video",
    questionFr: "Quels outils utilises-tu pour les rendez-vous, démos ou enregistrements ?",
    questionEn: "Which tools do you use for calls, demos or recordings?",
    hintFr: "Calendly, Zoom, Loom, Google Meet...",
    hintEn: "Calendly, Zoom, Loom, Google Meet...",
    pattern: /calendar|calendly|zoom|meet|loom|meeting|call|video|recording|demo|rdv|rendez/i,
    ids: ["calendly", "zoom", "loom", "google-meet"],
  },
  {
    id: "security-admin",
    Icon: Shield,
    fr: "Sécurité et accès",
    en: "Security and access",
    questionFr: "Comment gères-tu les mots de passe, accès, signatures ou fichiers sensibles ?",
    questionEn: "How do you manage passwords, access, signatures or sensitive files?",
    hintFr: "1Password, Dashlane, DocuSign, Dropbox...",
    hintEn: "1Password, Dashlane, DocuSign, Dropbox...",
    pattern: /password|security|securite|access|signature|sign|1password|dashlane|docusign|dropbox|vault/i,
    ids: ["1password", "dashlane", "docusign", "dropbox"],
  },
  {
    id: "finance-admin",
    Icon: Receipt,
    fr: "Facturation et admin",
    en: "Billing and admin",
    questionFr: "Quels outils servent à facturer, encaisser, signer ou suivre l’administratif ?",
    questionEn: "Which tools handle invoicing, payments, signatures or admin?",
    hintFr: "Stripe, Pennylane, QuickBooks, Indy, PayPal...",
    hintEn: "Stripe, Pennylane, QuickBooks, Indy, PayPal...",
    pattern: /invoice|billing|facturation|payment|stripe|paypal|finance|accounting|admin|compta|quickbooks|pennylane|indy/i,
    ids: ["stripe", "paypal", "quickbooks", "pennylane", "indy"],
  },
  {
    id: "analytics-growth",
    Icon: BarChart3,
    fr: "Analytics et croissance",
    en: "Analytics and growth",
    questionFr: "Mesures-tu ton site, tes conversions, tes emails ou tes prospects ?",
    questionEn: "Do you measure your site, conversions, emails or leads?",
    hintFr: "GA4, PostHog, Hotjar, Brevo, HubSpot...",
    hintEn: "GA4, PostHog, Hotjar, Brevo, HubSpot...",
    pattern: /analytics|growth|conversion|tracking|posthog|hotjar|hubspot|brevo|mailerlite|ga4|google analytics|crm|lead/i,
    ids: ["google-analytics", "posthog", "hotjar", "brevo", "hubspot", "mailerlite"],
  },
] as const;

type StackMoment = (typeof STACK_MOMENTS)[number];
type StackFeedAnimation = {
  id: string;
  tool: Tool;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const OFFER_OPTIONS: Array<{
  value: NonNullable<Tool["selectedOffer"]>;
  fr: string;
  en: string;
}> = [
  { value: "free", fr: "Gratuit", en: "Free" },
  { value: "paid", fr: "Payant", en: "Paid" },
  { value: "team", fr: "Équipe", en: "Team" },
  { value: "unknown", fr: "Pas sûr", en: "Unsure" },
];

function getPlanLabel(tool: Tool, offer: NonNullable<Tool["selectedOffer"]>, t: (fr: string, en: string) => string) {
  if (offer === "free") return t("Gratuit", "Free");
  if (offer === "team") return tool.pricing_v5?.compare_plan_kind === "team"
    ? tool.pricing_v5?.compare_plan_name || "Team"
    : "Team";
  if (offer === "unknown") return t("Je ne sais pas", "I don’t know");
  return tool.pricing_v5?.compare_plan_name || "Pro";
}

function makeCustomTool(name: string, price: number, moment?: StackMoment, currency?: string): Tool {
  const slug = normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: `custom-${slug || "tool"}-${Date.now()}`,
    name,
    price,
    priceCurrency: currency || undefined,
    category: moment?.id || "custom",
    functional_needs: moment ? [moment.fr] : [],
    tool_type: "satellite",
    usage: "medium",
    prescription_quality: "oui",
    catalogMonthlyPrice: price,
    catalogMonthlyPriceCurrency: currency || undefined,
    selectedOffer: price > 0 ? "paid" : "free",
    selectedPriceIsEstimate: false,
    force_silence: false,
  };
}

function withDefaultOffer(tool: Tool): Tool {
  const catalogMonthlyPrice = tool.pricing_v5?.compare_price_monthly_eur ?? tool.catalogMonthlyPrice ?? Number(tool.price || 0);
  const catalogMonthlyPriceCurrency = tool.pricing_v5?.compare_price_monthly_eur != null
    ? "EUR"
    : tool.catalogMonthlyPriceCurrency || tool.priceCurrency;
  return {
    ...tool,
    catalogMonthlyPrice,
    catalogMonthlyPriceCurrency,
    selectedOffer: tool.selectedOffer || (catalogMonthlyPrice > 0 ? "paid" : "free"),
    selectedPriceIsEstimate: tool.selectedPriceIsEstimate ?? true,
    priceCurrency: tool.priceCurrency || catalogMonthlyPriceCurrency,
  };
}

function offerPrice(tool: Tool, offer: NonNullable<Tool["selectedOffer"]>) {
  if (offer === "free") return 0;
  return Number(tool.catalogMonthlyPrice ?? tool.price ?? 0);
}

function offerLabel(tool: Tool, t: (fr: string, en: string) => string) {
  if (tool.selectedOffer === "free") return t("Gratuit", "Free");
  if (tool.selectedOffer === "team") return getPlanLabel(tool, "team", t);
  if (tool.selectedOffer === "unknown") return t("À préciser", "To clarify");
  return getPlanLabel(tool, "paid", t);
}

function toolText(tool: Tool) {
  return [
    tool.id,
    tool.name,
    tool.name_en,
    tool.category,
    tool.ia_use_case,
    ...(tool.functional_needs || []),
  ].filter(Boolean).join(" ");
}

function matchesMoment(tool: Tool, moment: StackMoment) {
  const normalizedId = normalize(tool.id);
  if (moment.ids.some((id) => normalize(id) === normalizedId)) return true;
  return moment.pattern.test(toolText(tool));
}

function nextMomentId(coveredIds: Set<string>, skippedIds: Set<string>, currentId: string) {
  const currentIndex = STACK_MOMENTS.findIndex((moment) => moment.id === currentId);
  const ordered = [
    ...STACK_MOMENTS.slice(currentIndex + 1),
    ...STACK_MOMENTS.slice(0, currentIndex + 1),
  ];
  return ordered.find((moment) => !coveredIds.has(moment.id) && !skippedIds.has(moment.id))?.id || null;
}

export default function DiagStepStackScan({ session, tools, onUpdate, onNext, onPrev, onTrack, t, fromTool }: Props) {
  const [search, setSearch] = useState("");
  const questionRef = useRef<HTMLHeadingElement | null>(null);
  const stackDropRef = useRef<HTMLDivElement | null>(null);
  const initialSelectedTools = useMemo(() => {
    if (session.selectedTools.length > 0 || !fromTool) {
      return (session.selectedTools || []).map(withDefaultOffer);
    }
    const normalizedFromTool = normalize(fromTool);
    const entryTool = tools.find((tool) =>
      normalize(tool.id) === normalizedFromTool ||
      normalize(tool.name) === normalizedFromTool
    );
    return entryTool ? [withDefaultOffer(entryTool)] : [];
  }, [fromTool, session.selectedTools, tools]);
  const [selectedTools, setSelectedTools] = useState<Tool[]>(initialSelectedTools);
  const [activeMomentId, setActiveMomentId] = useState<string>(() => {
    const covered = new Set((session.selectionCoverage?.covered || []));
    const skipped = new Set((session.selectionCoverage?.skipped || []));
    return STACK_MOMENTS.find((moment) => !covered.has(moment.id) && !skipped.has(moment.id))?.id || STACK_MOMENTS[0].id;
  });
  const [skippedMomentIds, setSkippedMomentIds] = useState<Set<string>>(
    () => new Set(session.selectionCoverage?.skipped || [])
  );
  const [showCatalog, setShowCatalog] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [pendingToolId, setPendingToolId] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<"suggestion" | "search">("suggestion");
  const [lastConfirmedToolId, setLastConfirmedToolId] = useState<string | null>(null);
  const [feedAnimation, setFeedAnimation] = useState<StackFeedAnimation | null>(null);

  const selectedIds = useMemo(() => new Set(selectedTools.map((tool) => tool.id)), [selectedTools]);
  const selectedToolsById = useMemo(
    () => new Map(selectedTools.map((tool) => [tool.id, tool])),
    [selectedTools]
  );
  const allKnownTools = useMemo(() => {
    const map = new Map<string, Tool>();
    tools.forEach((tool) => map.set(tool.id, tool));
    selectedTools.forEach((tool) => map.set(tool.id, tool));
    return Array.from(map.values());
  }, [selectedTools, tools]);

  const filteredTools = useMemo(() => {
    const q = normalize(search);
    return allKnownTools
      .filter((tool) => {
        if (selectedIds.has(tool.id)) return false;
        if (!q) return true;
        return normalize(tool.name).includes(q) || normalize(tool.category || "").includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allKnownTools, search, selectedIds]);

  const momentCoverage = useMemo(() => {
    return STACK_MOMENTS.map((moment) => {
      const selected = selectedTools.filter((tool) => matchesMoment(tool, moment));
      return {
        ...moment,
        selected,
        covered: selected.length > 0,
        skipped: skippedMomentIds.has(moment.id),
      };
    });
  }, [selectedTools, skippedMomentIds]);

  const coveredMomentIds = useMemo(
    () => new Set(momentCoverage.filter((moment) => moment.covered).map((moment) => moment.id)),
    [momentCoverage]
  );

  const activeMoment = momentCoverage.find((moment) => moment.id === activeMomentId) || momentCoverage[0];
  const activeMomentIndex = STACK_MOMENTS.findIndex((moment) => moment.id === activeMoment.id);
  const activeMomentSuggestions = useMemo(() => {
    return tools
      .filter((tool) => matchesMoment(tool, activeMoment) && !selectedIds.has(tool.id))
      .sort((a, b) => {
        const aKnown = activeMoment.ids.includes(a.id);
        const bKnown = activeMoment.ids.includes(b.id);
        if (aKnown !== bKnown) return aKnown ? -1 : 1;
        return (b.pertinence_by_persona?.[session.persona] || 0) - (a.pertinence_by_persona?.[session.persona] || 0);
      })
      .slice(0, 6);
  }, [activeMoment, selectedIds, session.persona, tools]);

  const coverageCount = momentCoverage.filter((moment) => moment.covered || moment.skipped).length;
  const coveredCount = momentCoverage.filter((moment) => moment.covered).length;
  const missingMoments = momentCoverage.filter((moment) => !moment.covered && !moment.skipped);
  const selectedInActiveMoment = activeMoment.selected.length;
  const selectedMonthlyCostLabel = formatMonthlyTotal(selectedTools, t);
  const pricingSummary = useMemo(() => getPricingCaptureSummary(selectedTools), [selectedTools]);
  const budgetBreakdown = useMemo(() => getMonthlyBudgetBreakdown(selectedTools), [selectedTools]);
  const firstPricingIssueTool = useMemo(
    () => selectedTools.find((tool) => getPricingAudit(tool, t).needsVerification) || null,
    [selectedTools, t]
  );
  const coverageConfidence: NonNullable<SessionState["selectionCoverage"]>["confidence"] =
    coveredCount >= 7 ? "high" : coveredCount >= 4 ? "medium" : "low";

  useEffect(() => {
    setSearch("");
    setShowCatalog(false);
    setCustomName("");
    setCustomPrice("");
    setPendingToolId(null);
    const focusTimer = window.setTimeout(() => questionRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [activeMomentId]);

  useEffect(() => {
    if (!lastConfirmedToolId) return undefined;
    const timer = window.setTimeout(() => setLastConfirmedToolId(null), 1400);
    return () => window.clearTimeout(timer);
  }, [lastConfirmedToolId]);

  useEffect(() => {
    if (!feedAnimation) return undefined;
    const timer = window.setTimeout(() => setFeedAnimation(null), 760);
    return () => window.clearTimeout(timer);
  }, [feedAnimation]);

  const toggleTool = (tool: Tool, source: "suggestion" | "search" | "review" | "companion" = "suggestion") => {
    setSelectedTools((prev) => {
      const alreadySelected = prev.some((item) => item.id === tool.id);
      if (alreadySelected) {
        if (pendingToolId === tool.id) setPendingToolId(null);
        onTrack?.("selector_tool_removed", {
          tool_id: tool.id,
          tool_name: tool.name,
          moment_id: activeMoment.id,
          source,
          selected_count: Math.max(prev.length - 1, 0),
        });
        return prev.filter((item) => item.id !== tool.id);
      }

      if (pendingToolId === tool.id) {
        setPendingToolId(null);
        return prev;
      }

      setPendingToolId(tool.id);
      setPendingSource(source === "search" ? "search" : "suggestion");
      onTrack?.("selector_tool_plan_opened", {
        tool_id: tool.id,
        tool_name: tool.name,
        moment_id: activeMoment.id,
        source,
        selected_count: prev.length,
      });
      return prev;
    });
  };

  const confirmToolWithOffer = (
    tool: Tool,
    offer: NonNullable<Tool["selectedOffer"]>,
    source: "suggestion" | "search" = pendingSource
  ) => {
    const sourceElement = document.querySelector<HTMLElement>(`[data-stack-tool-card-id="${tool.id}"]`);
    const targetElement = stackDropRef.current;
    const sourceRect = sourceElement?.getBoundingClientRect();
    const targetRect = targetElement?.getBoundingClientRect();

    setSelectedTools((prev) => {
      if (prev.some((item) => item.id === tool.id)) {
        return prev.map((item) => {
          if (item.id !== tool.id) return item;
          return {
            ...item,
            selectedOffer: offer,
            price: offerPrice(item, offer),
            priceCurrency: item.catalogMonthlyPriceCurrency || item.priceCurrency,
            selectedPriceIsEstimate: offer !== "free",
          };
        });
      }

      const nextSkipped = new Set(skippedMomentIds);
      STACK_MOMENTS.forEach((moment) => {
        if (matchesMoment(tool, moment)) nextSkipped.delete(moment.id);
      });
      setSkippedMomentIds(nextSkipped);
      onTrack?.("selector_tool_added", {
        tool_id: tool.id,
        tool_name: tool.name,
        moment_id: activeMoment.id,
        source,
        selected_count: prev.length + 1,
      });
      const baseTool = withDefaultOffer(tool);
      const selectedTool = {
        ...baseTool,
        selectedOffer: offer,
        price: offerPrice(baseTool, offer),
        priceCurrency: baseTool.catalogMonthlyPriceCurrency || baseTool.priceCurrency,
        selectedPriceIsEstimate: offer !== "free",
      };
      setPendingToolId(null);
      setLastConfirmedToolId(tool.id);
      if (sourceRect && targetRect) {
        setFeedAnimation({
          id: `${tool.id}-${Date.now()}`,
          tool: selectedTool,
          fromX: sourceRect.left + sourceRect.width / 2,
          fromY: sourceRect.top + 34,
          toX: targetRect.left + targetRect.width / 2,
          toY: targetRect.top + targetRect.height / 2,
        });
      }
      return [...prev, selectedTool];
    });
    onTrack?.("selector_tool_offer_selected", {
      tool_id: tool.id,
      offer,
      moment_id: activeMoment.id,
      source,
    });
  };

  const updateSelectedTool = (toolId: string, patch: Partial<Tool>) => {
    setSelectedTools((prev) => prev.map((tool) => tool.id === toolId ? { ...tool, ...patch } : tool));
  };

  const updateSelectedToolOffer = (toolId: string, offer: NonNullable<Tool["selectedOffer"]>) => {
    setSelectedTools((prev) => prev.map((tool) => {
      if (tool.id !== toolId) return tool;
      return {
        ...tool,
        selectedOffer: offer,
        price: offerPrice(tool, offer),
        priceCurrency: tool.catalogMonthlyPriceCurrency || tool.priceCurrency,
        selectedPriceIsEstimate: offer !== "free",
      };
    }));
    onTrack?.("selector_tool_offer_selected", {
      tool_id: toolId,
      offer,
      moment_id: activeMoment.id,
    });
  };

  const addCustomTool = () => {
    const name = customName.trim();
    if (name.length < 2) return;
    const price = Math.max(0, Number(customPrice) || 0);
    const customTool = withDefaultOffer(makeCustomTool(name, price, activeMoment, "EUR"));
    setSelectedTools((prev) => [...prev, customTool]);
    setLastConfirmedToolId(customTool.id);
    onTrack?.("selector_custom_tool_added", {
      tool_name: name,
      moment_id: activeMoment.id,
      price,
      currency: "EUR",
    });
    setCustomName("");
    setCustomPrice("");
    setSearch("");
  };

  const handleNext = () => {
    onTrack?.("selector_review_confirmed", {
      selected_count: selectedTools.length,
      covered_count: coveredCount,
      skipped_count: skippedMomentIds.size,
      confidence: coverageConfidence,
      pricing_unknown_count: pricingSummary.unknownPlanCount,
      pricing_estimate_count: pricingSummary.estimateCount,
      pricing_missing_currency_count: pricingSummary.missingCurrencyCount,
    });
    onUpdate({
      selectedTools,
      selectionCoverage: {
        covered: momentCoverage.filter((moment) => moment.covered).map((moment) => moment.id),
        skipped: Array.from(skippedMomentIds),
        confidence: coverageConfidence,
      },
    });
    onNext();
  };

  const moveToNextMoment = () => {
    onTrack?.("selector_moment_next", {
      moment_id: activeMoment.id,
      selected_in_moment: selectedInActiveMoment,
      selected_count: selectedTools.length,
      covered_count: coveredCount,
    });
    const next = nextMomentId(coveredMomentIds, skippedMomentIds, activeMoment.id);
    if (next) {
      setActiveMomentId(next);
    } else {
      openReview("all_moments_checked");
    }
  };

  const skipActiveMoment = () => {
    const nextSkipped = new Set(skippedMomentIds);
    nextSkipped.add(activeMoment.id);
    onTrack?.("selector_moment_skipped", {
      moment_id: activeMoment.id,
      selected_count: selectedTools.length,
      skipped_count: nextSkipped.size,
    });
    setSkippedMomentIds(nextSkipped);
    const next = nextMomentId(coveredMomentIds, nextSkipped, activeMoment.id);
    if (next) {
      setActiveMomentId(next);
    } else {
      openReview("all_moments_checked");
    }
  };

  const scrollToPricingTool = (toolId: string) => {
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(`[data-pricing-tool-id="${toolId}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus?.();
    }, 80);
  };

  const scrollToFirstPricingIssue = () => {
    if (!firstPricingIssueTool) return;
    const targetMoment = momentCoverage.find((moment) =>
      moment.selected.some((tool) => tool.id === firstPricingIssueTool.id)
    );

    if (targetMoment && targetMoment.id !== activeMoment.id) {
      setActiveMomentId(targetMoment.id);
    }
    scrollToPricingTool(firstPricingIssueTool.id);
  };

  const openReview = (reason: string) => {
    onTrack?.("selector_review_opened", {
      reason,
      selected_count: selectedTools.length,
      covered_count: coveredCount,
      missing_count: missingMoments.length,
    });
    setReviewMode(true);
  };

  const toggleSearchPanel = () => {
    const next = !showCatalog;
    setShowCatalog(next);
    if (next) {
      onTrack?.("selector_manual_tool_opened", {
        moment_id: activeMoment.id,
        selected_count: selectedTools.length,
      });
    }
  };

  const toolName = fromTool
    ? fromTool.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : null;

  if (reviewMode) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3 text-center">
          <p className="inline-flex rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase text-primary">
            {t("Dernière vérification", "Final check")}
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {t("Voilà ce que j’ai compris de ta stack.", "Here is what I understood about your stack.")}
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            {t(
              "Corrige un oubli maintenant si besoin. Après ça, je passe au profil et au scoring.",
              "Fix any omission now if needed. After this, I move to profile and scoring."
            )}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <ReviewMetric label={t("Outils retenus", "Selected tools")} value={String(selectedTools.length)} />
          <ReviewMetric label={t("Zones couvertes", "Covered areas")} value={`${coveredCount}/${STACK_MOMENTS.length}`} />
          <ReviewMetric
            label={t("Confiance", "Confidence")}
            value={coverageConfidence === "high" ? t("Forte", "High") : coverageConfidence === "medium" ? t("Moyenne", "Medium") : t("À affiner", "Low")}
          />
          <ReviewMetric
            label={t("Prix à vérifier", "Prices to check")}
            value={String(pricingSummary.needsVerificationCount)}
          />
        </div>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">{t("Zones de travail", "Work areas")}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {momentCoverage.map((moment) => {
                const Icon = moment.Icon;
                return (
                  <button
                    key={moment.id}
                    type="button"
                    onClick={() => {
                      setActiveMomentId(moment.id);
                      setReviewMode(false);
                      onTrack?.("selector_review_area_reopened", {
                        moment_id: moment.id,
                        covered: moment.covered,
                        skipped: moment.skipped,
                      });
                    }}
                    className="flex min-h-12 items-center gap-3 rounded-lg border border-border px-3 text-left text-sm hover:border-primary/40"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-foreground">{t(moment.fr, moment.en)}</span>
                    {moment.covered ? (
                      <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{moment.selected.length}</span>
                    ) : moment.skipped ? (
                      <span className="text-xs text-muted-foreground">{t("ignorée", "skipped")}</span>
                    ) : (
                      <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">{t("à vérifier", "check")}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">{t("Ajuster les outils", "Adjust tools")}</p>
            {selectedTools.length === 0 ? (
              <p className="mt-4 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                {t("Aucun outil pour l’instant.", "No tool yet.")}
              </p>
            ) : (
              <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {selectedTools.map((tool) => (
                  <SelectedToolRow
                    key={tool.id}
                    tool={tool}
                    onRemove={() => toggleTool(tool, "review")}
                    onUpdate={(patch) => updateSelectedTool(tool.id, patch)}
                    t={t}
                  />
                ))}
              </div>
            )}
            {missingMoments.length > 0 && (
              <div className="mt-5 rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {t("Zones encore non vérifiées", "Areas not checked yet")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {missingMoments.slice(0, 4).map((moment) => t(moment.fr, moment.en)).join(", ")}
                  {missingMoments.length > 4 ? "..." : ""}
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => {
              onTrack?.("selector_review_back_to_edit", {
                selected_count: selectedTools.length,
                missing_count: missingMoments.length,
              });
              setReviewMode(false);
            }}
            className="h-11 rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t("Ajouter un oubli", "Add something missing")}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedTools.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            {t("Confirmer et continuer", "Confirm and continue")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-32">
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        {toolName && (
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            {t(`On part de ${toolName}`, `Starting from ${toolName}`)}
          </p>
        )}
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          {t("Construis ta stack réelle.", "Build your real stack.")}
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
          {t(
            "Une zone à la fois. Clique un outil, choisis son plan, puis il rejoint ta stack.",
            "One area at a time. Click a tool, choose its plan, then it joins your stack."
          )}
        </p>
        {onPrev && (
          <button
            type="button"
            onClick={onPrev}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("Modifier mon profil", "Edit my profile")}
          </button>
        )}
      </div>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="diagnostic-card p-5 md:p-6">
          <StackMomentStepper
            moments={momentCoverage}
            activeMomentId={activeMoment.id}
            onSelect={(moment) => {
              setActiveMomentId(moment.id);
              onTrack?.("selector_moment_stepper_clicked", {
                moment_id: moment.id,
                covered: moment.covered,
                skipped: moment.skipped,
                selected_count: selectedTools.length,
              });
            }}
            t={t}
          />

          <div
            key={activeMoment.id}
            className="mt-6 space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
          >
            <h2
              ref={questionRef}
              tabIndex={-1}
              className="text-2xl font-bold text-foreground outline-none md:text-3xl"
            >
              {t(activeMoment.questionFr, activeMoment.questionEn)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(activeMoment.hintFr, activeMoment.hintEn)}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="diagnostic-stack-search"
                name="stack-search"
                type="text"
                value={search}
                onChange={(event) => {
                  if (!search.trim()) {
                    onTrack?.("selector_search_opened", {
                      moment_id: activeMoment.id,
                      selected_count: selectedTools.length,
                    });
                  }
                  setSearch(event.target.value);
                }}
                placeholder={t(
                  "Chercher un outil…",
                  "Search a tool…"
                )}
                className="h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-10 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label={t("Effacer", "Clear")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {search.trim() && (
              filteredTools.length > 0 ? (
                <ToolGrid
                  title={t("Résultats", "Results")}
                  tools={filteredTools.slice(0, 8)}
                  selectedToolsById={selectedToolsById}
                  pendingToolId={pendingToolId}
                  onToggle={(tool) => toggleTool(tool, "search")}
                  onOfferChange={updateSelectedToolOffer}
                  onConfirmOffer={(tool, offer) => confirmToolWithOffer(tool, offer, "search")}
                  t={t}
                />
              ) : (
                <NoSearchResult
                  query={search}
                  onOpenManual={() => {
                    setCustomName(search.trim());
                    setShowCatalog(true);
                    onTrack?.("selector_manual_tool_prefilled", {
                      moment_id: activeMoment.id,
                      query: search.trim(),
                    });
                  }}
                  t={t}
                />
              )
            )}
          </div>

          {!search.trim() && (
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t("Suggestions fréquentes", "Common suggestions")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {activeMomentSuggestions.length > 0 ? activeMomentSuggestions.map((tool) => (
                  <ToolChoiceButton
                    key={tool.id}
                    tool={tool}
                    selectedTool={selectedToolsById.get(tool.id)}
                    pending={pendingToolId === tool.id}
                    onToggle={() => toggleTool(tool, "suggestion")}
                    onOfferChange={(offer) => updateSelectedToolOffer(tool.id, offer)}
                    onConfirmOffer={(offer) => confirmToolWithOffer(tool, offer, "suggestion")}
                    t={t}
                  />
                )) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground sm:col-span-2">
                    {t("Je n'ai pas de suggestion forte ici. Recherche ton outil ou ajoute-le manuellement.", "No strong suggestion here. Search your tool or add it manually.")}
                  </div>
                )}
              </div>
              {selectedInActiveMoment === 0 && (
                <button
                  type="button"
                  onClick={skipActiveMoment}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t("Je n’utilise rien pour ça", "I don’t use anything for this")}
                </button>
              )}
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-muted/50 p-3">
            <button
              type="button"
              onClick={toggleSearchPanel}
              className="inline-flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-foreground"
            >
              <span>{t("Je ne trouve pas mon outil", "I can’t find my tool")}</span>
              <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>

            {showCatalog && (
              <div className="mt-4 space-y-4">
                <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                  <input
                    id="diagnostic-custom-tool"
                    name="custom-tool"
                    type="text"
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    placeholder={t("Ou ajoute un nom", "Or add a name")}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <input
                    id="diagnostic-custom-price"
                    name="custom-price"
                    type="number"
                    value={customPrice}
                    onChange={(event) => setCustomPrice(event.target.value)}
                    placeholder={t("€/mois", "€/mo")}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={addCustomTool}
                    disabled={customName.trim().length < 2}
                    className="diagnostic-primary-action inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                    {t("Ajouter", "Add")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {(selectedInActiveMoment > 0 || (selectedTools.length > 0 && missingMoments.length === 0)) && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex flex-col gap-2 sm:flex-row">
              {selectedTools.length > 0 && missingMoments.length === 0 && (
                <button
                  type="button"
                  onClick={() => openReview("all_moments_checked")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  {t("Vérifier ma stack", "Check my stack")}
                </button>
              )}
              <button
                type="button"
                onClick={moveToNextMoment}
                disabled={selectedInActiveMoment === 0}
                className="diagnostic-primary-action inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-40"
              >
                {t("Zone suivante", "Next area")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          )}
        </div>

        <StackCompanion
          selectedTools={selectedTools}
          budgetBreakdown={budgetBreakdown}
          pricingSummary={pricingSummary}
          coverageComplete={coverageCount >= STACK_MOMENTS.length}
          highlightToolId={lastConfirmedToolId}
          stackDropRef={stackDropRef}
          onPricingReview={scrollToFirstPricingIssue}
          onReview={() => openReview("stack_companion")}
          onRemove={(tool) => toggleTool(tool, "companion")}
          t={t}
        />
      </section>

      <StackFeedMotion animation={feedAnimation} />

      <MobileStackBar
        selectedTools={selectedTools}
        coveredCount={coveredCount}
        totalMoments={STACK_MOMENTS.length}
        monthlyCostLabel={selectedMonthlyCostLabel}
        onReview={() => openReview("mobile_stack_bar")}
        t={t}
      />
    </div>
  );
}

function ToolChoiceButton({
  tool,
  selectedTool,
  pending = false,
  onToggle,
  onOfferChange,
  onConfirmOffer,
  t,
}: {
  tool: Tool;
  selectedTool?: Tool;
  pending?: boolean;
  onToggle: () => void;
  onOfferChange: (offer: NonNullable<Tool["selectedOffer"]>) => void;
  onConfirmOffer: (offer: NonNullable<Tool["selectedOffer"]>) => void;
  t: (fr: string, en: string) => string;
}) {
  const selected = Boolean(selectedTool);
  const displayTool = selectedTool || withDefaultOffer(tool);
  const pricingAudit = getPricingAudit(displayTool, t);

  return (
    <div
      title={pricingAudit.detail}
      data-stack-tool-card-id={tool.id}
      data-pricing-tool-id={tool.id}
      tabIndex={-1}
      className={`group h-[118px] rounded-2xl border p-3 shadow-sm transition-colors duration-200 ${
        selected
          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
          : pending
            ? "border-foreground bg-card"
          : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected || pending}
        className="flex h-[54px] w-full items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ToolLogo tool={displayTool} size={36} className="rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayTool.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {selected
              ? `${offerLabel(displayTool, t)} · ${formatToolMonthlyPrice(displayTool, t)}`
              : pending
                ? t("Plan utilisé ?", "Which plan?")
              : displayTool.price > 0
                ? formatToolMonthlyPrice(displayTool, t, { approximate: true, catalog: true })
                : t("Gratuit possible", "Free possible")}
          </p>
        </div>
        {selected ? (
          <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary p-1.5 text-primary-foreground">
            <Check className="h-3.5 w-3.5" />
          </span>
        ) : pending ? (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-foreground text-foreground">
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
            <Plus className="h-4 w-4" />
          </span>
        )}
      </button>

      <div className="mt-2 h-8">
        {selected ? (
          <OfferSelector tool={displayTool} onChange={onOfferChange} compact t={t} />
        ) : pending ? (
          <OfferSelector tool={displayTool} onChange={onConfirmOffer} compact currentOffer={null} t={t} />
        ) : (
          <span className="flex h-8 items-center justify-between rounded-xl bg-muted/35 px-2 text-xs font-semibold text-foreground transition-colors group-hover:bg-muted/60">
            <span>{t("Choisir le plan", "Choose plan")}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        )}
      </div>
    </div>
  );
}

function StackMomentStepper({
  moments,
  activeMomentId,
  onSelect,
  t,
}: {
  moments: Array<StackMoment & { selected: Tool[]; covered: boolean; skipped: boolean }>;
  activeMomentId: string;
  onSelect: (moment: StackMoment & { selected: Tool[]; covered: boolean; skipped: boolean }) => void;
  t: (fr: string, en: string) => string;
}) {
  const activeIndex = Math.max(0, moments.findIndex((moment) => moment.id === activeMomentId));

  return (
    <div className="diagnostic-soft-card px-3 py-3">
      <p className="text-sm font-semibold text-foreground">
        {t(moments[activeIndex]?.fr || "", moments[activeIndex]?.en || "")}
      </p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label={t("Étapes de capture de stack", "Stack capture steps")}>
        {moments.map((moment, index) => {
          const Icon = moment.Icon;
          const active = moment.id === activeMomentId;
          const done = moment.covered;
          const skipped = moment.skipped;
          const statusLabel = done
            ? t("remplie", "filled")
            : skipped
              ? t("marquée vide", "marked empty")
              : t("à vérifier", "to check");
          const stepLabel = `${index + 1}. ${t(moment.fr, moment.en)} · ${statusLabel}`;
          return (
            <button
              key={moment.id}
              type="button"
              onClick={() => onSelect(moment)}
              title={stepLabel}
              aria-current={active ? "step" : undefined}
              aria-label={stepLabel}
              className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : done
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : skipped
                      ? "border-border bg-muted/50 text-muted-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {done && !active && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
              {skipped && !done && !active && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground text-background">
                  <X className="h-2.5 w-2.5" />
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-background px-1 font-mono text-[9px] font-bold text-muted-foreground">
                {index + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OfferSelector({
  tool,
  onChange,
  compact = false,
  currentOffer,
  t,
}: {
  tool: Tool;
  onChange: (offer: NonNullable<Tool["selectedOffer"]>) => void;
  compact?: boolean;
  currentOffer?: NonNullable<Tool["selectedOffer"]> | null;
  t: (fr: string, en: string) => string;
}) {
  const activeOffer = currentOffer === undefined
    ? tool.selectedOffer || (tool.price > 0 ? "paid" : "free")
    : currentOffer;
  return (
    <div className={`grid w-full grid-cols-4 gap-1 rounded-xl border border-border bg-muted/30 p-1 ${
      compact ? "" : "lg:w-[280px]"
    }`}>
      {OFFER_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`${compact ? "h-6 px-1 text-[10px]" : "h-8 px-2 text-xs"} whitespace-nowrap rounded-[5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            activeOffer === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-background hover:text-foreground"
          }`}
        >
          {getPlanLabel(tool, option.value, t)}
        </button>
      ))}
    </div>
  );
}

function StackCompanion({
  selectedTools,
  budgetBreakdown,
  pricingSummary,
  coverageComplete,
  highlightToolId,
  stackDropRef,
  onPricingReview,
  onReview,
  onRemove,
  t,
}: {
  selectedTools: Tool[];
  budgetBreakdown: ReturnType<typeof getMonthlyBudgetBreakdown>;
  pricingSummary: ReturnType<typeof getPricingCaptureSummary>;
  coverageComplete: boolean;
  highlightToolId?: string | null;
  stackDropRef: RefObject<HTMLDivElement>;
  onPricingReview: () => void;
  onReview: () => void;
  onRemove: (tool: Tool) => void;
  t: (fr: string, en: string) => string;
}) {
  const visibleTools = selectedTools.slice(-8);

  return (
    <aside className="hidden lg:sticky lg:top-24 lg:block">
      <div className="diagnostic-dark-panel overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">
                {t("Ta stack", "Your stack")}
              </p>
              <h3 className="mt-1 text-lg font-bold text-foreground">
                {selectedTools.length === 0
                  ? t("Rien ajouté pour l’instant", "Nothing added yet")
                  : t("Ta sélection", "Your selection")}
              </h3>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--diag-yellow))] text-[hsl(var(--diag-ink))]">
              <Layers3 className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {selectedTools.length === 0
              ? t(
                  "Choisis un outil puis son plan.",
                  "Choose a tool, then its plan."
                )
              : t(
                  "Ce récapitulatif se met à jour après confirmation du plan.",
                  "This recap updates after plan confirmation."
                )}
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-2xl border border-border bg-background p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{t("Budget", "Budget")}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-foreground">
              ≈ {formatMonthlyEur(budgetBreakdown.confirmedEur)}
            </p>
            {budgetBreakdown.hasToVerify && (
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                + {formatMonthlyEur(budgetBreakdown.toVerifyEur).replace("/mois", "")} {t("à préciser", "to clarify")}
              </p>
            )}
          </div>
          {pricingSummary.needsVerificationCount > 0 && (
            <button
              type="button"
              onClick={onPricingReview}
              className="w-full rounded-2xl border border-[hsl(var(--diag-yellow))] bg-[hsl(var(--diag-yellow)/0.14)] px-3 py-2 text-left text-xs font-semibold text-[hsl(var(--diag-yellow))] transition-colors hover:bg-[hsl(var(--diag-yellow)/0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t(
                `${pricingSummary.needsVerificationCount} plan${pricingSummary.needsVerificationCount > 1 ? "s" : ""} à préciser`,
                `${pricingSummary.needsVerificationCount} plan${pricingSummary.needsVerificationCount > 1 ? "s" : ""} to clarify`
              )}
            </button>
          )}

          {selectedTools.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                {t("Ajoute ton premier outil", "Add your first tool")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("Le diagnostic devient plus précis à chaque ajout.", "The diagnostic gets sharper with every add.")}
              </p>
            </div>
          ) : (
            <div className="space-y-3" aria-live="polite">
              <div ref={stackDropRef} className="flex min-h-[38px] flex-wrap gap-2">
                {visibleTools.map((tool) => {
                  const highlighted = tool.id === highlightToolId;
                  return (
                  <div
                    key={tool.id}
                    className={`group relative animate-in zoom-in-95 duration-200 ${
                      highlighted ? "scale-[1.03] rounded-lg ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : ""
                    }`}
                    title={tool.name}
                  >
                    <ToolLogo
                      tool={tool}
                      size={38}
                      className={`rounded-lg border bg-background shadow-sm transition-colors ${
                        highlighted ? "border-primary/40 bg-primary/10" : "border-border"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => onRemove(tool)}
                      aria-label={t(`Retirer ${tool.name}`, `Remove ${tool.name}`)}
                      className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm group-hover:flex"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  );
                })}
                {selectedTools.length > visibleTools.length && (
                  <span className="flex h-[38px] items-center rounded-lg border border-border bg-background px-3 text-xs font-semibold text-muted-foreground">
                    +{selectedTools.length - visibleTools.length}
                  </span>
                )}
              </div>

              <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                {selectedTools.slice(-5).map((tool) => {
                  const pricingAudit = getPricingAudit(tool, t);
                  const highlighted = tool.id === highlightToolId;
                  return (
                    <div
                      key={tool.id}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                        highlighted ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/40"
                      }`}
                      title={pricingAudit.detail}
                    >
                      <ToolLogo tool={tool} size={24} className="rounded-md" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{tool.name}</span>
                      <span className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {offerLabel(tool, t)}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatToolMonthlyBudget(tool, t)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onReview}
            disabled={selectedTools.length === 0}
            className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-40 ${
              coverageComplete
                ? "bg-[hsl(var(--diag-yellow))] text-[hsl(var(--diag-ink))]"
                : "border border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {t("Voir ma stack complète", "View full stack")}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function StackFeedMotion({ animation }: { animation: StackFeedAnimation | null }) {
  if (!animation) return null;

  const translateX = animation.toX - animation.fromX;
  const translateY = animation.toY - animation.fromY;

  return (
    <div
      key={animation.id}
      aria-hidden="true"
      className="pointer-events-none fixed z-[80] hidden h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-background shadow-2xl ring-4 ring-primary/15 lg:flex"
      style={{
        left: animation.fromX - 24,
        top: animation.fromY - 24,
        animation: "tooltrim-stack-feed 720ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        ["--stack-feed-x" as string]: `${translateX}px`,
        ["--stack-feed-y" as string]: `${translateY}px`,
      }}
    >
      <ToolLogo tool={animation.tool} size={34} className="rounded-lg" />
      <style>{`
        @keyframes tooltrim-stack-feed {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.82);
          }
          14% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          72% {
            opacity: 1;
            transform: translate3d(calc(var(--stack-feed-x) * 0.88), calc(var(--stack-feed-y) * 0.88), 0) scale(0.72);
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--stack-feed-x), var(--stack-feed-y), 0) scale(0.42);
          }
        }
      `}</style>
    </div>
  );
}

function MobileStackBar({
  selectedTools,
  coveredCount,
  totalMoments,
  monthlyCostLabel,
  onReview,
  t,
}: {
  selectedTools: Tool[];
  coveredCount: number;
  totalMoments: number;
  monthlyCostLabel: string;
  onReview: () => void;
  t: (fr: string, en: string) => string;
}) {
  if (selectedTools.length === 0) return null;
  const logos = selectedTools.slice(-4).reverse();

  return (
    <button
      type="button"
      onClick={onReview}
      className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-xl border border-primary/20 bg-background/95 p-3 text-left shadow-lg backdrop-blur lg:hidden"
    >
      <div className="flex -space-x-2">
        {logos.map((tool) => (
          <ToolLogo key={tool.id} tool={tool} size={32} className="rounded-lg border-2 border-background bg-background" />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {selectedTools.length} {t("outil(s) dans ta stack", "tool(s) in your stack")}
        </p>
        <p className="text-xs text-muted-foreground">
          {coveredCount}/{totalMoments} {t("zones", "areas")} · {monthlyCostLabel}/{t("mois", "mo")}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="font-mono text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function NoSearchResult({
  query,
  onOpenManual,
  t,
}: {
  query: string;
  onOpenManual: () => void;
  t: (fr: string, en: string) => string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">
        {t(`Je ne trouve pas “${query}”.`, `I cannot find “${query}”.`)}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {t(
          "Ce n’est pas bloquant : ajoute-le avec son budget approximatif, et je le prendrai dans l’analyse.",
          "That is not blocking: add it with an approximate budget, and I will include it in the analysis."
        )}
      </p>
      <button
        type="button"
        onClick={onOpenManual}
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-xs font-semibold text-background"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("Ajouter cet outil", "Add this tool")}
      </button>
    </div>
  );
}

function ToolGrid({
  title,
  tools,
  selectedToolsById,
  pendingToolId,
  onToggle,
  onOfferChange,
  onConfirmOffer,
  t,
}: {
  title: string;
  tools: Tool[];
  selectedToolsById: Map<string, Tool>;
  pendingToolId: string | null;
  onToggle: (tool: Tool) => void;
  onOfferChange: (toolId: string, offer: NonNullable<Tool["selectedOffer"]>) => void;
  onConfirmOffer: (tool: Tool, offer: NonNullable<Tool["selectedOffer"]>) => void;
  t: (fr: string, en: string) => string;
}) {
  if (tools.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          return (
            <ToolChoiceButton
              key={tool.id}
              tool={tool}
              selectedTool={selectedToolsById.get(tool.id)}
              pending={pendingToolId === tool.id}
              onToggle={() => onToggle(tool)}
              onOfferChange={(offer) => onOfferChange(tool.id, offer)}
              onConfirmOffer={(offer) => onConfirmOffer(tool, offer)}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}

function SelectedToolRow({
  tool,
  onRemove,
  onUpdate,
  t,
}: {
  tool: Tool;
  onRemove: () => void;
  onUpdate: (patch: Partial<Tool>) => void;
  t: (fr: string, en: string) => string;
}) {
  const pricingAudit = getPricingAudit(tool, t);
  const pricingToneClass =
    pricingAudit.tone === "warning"
      ? "text-amber-700"
      : pricingAudit.tone === "ok"
        ? "text-emerald-700"
        : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ToolLogo tool={tool} size={34} className="rounded-md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{tool.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{tool.category || t("Autre", "Other")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label={t("Retirer", "Remove")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-[96px_1fr] gap-2">
        <input
          type="number"
          value={tool.price || ""}
          onChange={(event) => {
            const price = Math.max(0, Number(event.target.value) || 0);
            onUpdate({
              price,
              priceCurrency: "EUR",
              catalogMonthlyPriceCurrency: "EUR",
              selectedOffer: price <= 0 ? "free" : tool.selectedOffer === "free" ? "paid" : tool.selectedOffer,
              selectedPriceIsEstimate: false,
            });
          }}
          placeholder={t("€/mois", "€/mo")}
          className="h-9 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="grid grid-cols-3 rounded-md border border-border p-0.5">
          {(["high", "medium", "low"] as const).map((usage) => (
            <button
              key={usage}
              type="button"
              onClick={() => onUpdate({ usage })}
              className={`h-8 rounded-[5px] text-[11px] font-medium ${
                tool.usage === usage
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {usage === "high" ? t("Souvent", "Often") : usage === "medium" ? t("Parfois", "Sometimes") : t("Rare", "Rare")}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2">
        <OfferSelector
          tool={tool}
          onChange={(offer) => onUpdate({
            selectedOffer: offer,
            price: offerPrice(tool, offer),
            priceCurrency: tool.catalogMonthlyPriceCurrency || tool.priceCurrency,
            selectedPriceIsEstimate: offer !== "free",
          })}
          t={t}
        />
      </div>
      <p className={`mt-2 min-h-4 text-[11px] font-medium ${pricingToneClass}`}>
        {pricingAudit.detail}
      </p>
    </div>
  );
}
