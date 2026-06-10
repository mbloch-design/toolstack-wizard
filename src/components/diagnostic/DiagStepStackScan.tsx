import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  ChevronRight,
  FileText,
  FolderKanban,
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

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function makeCustomTool(name: string, price: number, moment?: StackMoment): Tool {
  const slug = normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: `custom-${slug || "tool"}-${Date.now()}`,
    name,
    price,
    category: moment?.id || "custom",
    functional_needs: moment ? [moment.fr] : [],
    tool_type: "satellite",
    usage: "medium",
    prescription_quality: "oui",
    force_silence: false,
  };
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
  const initialSelectedTools = useMemo(() => {
    if (session.selectedTools.length > 0 || !fromTool) return session.selectedTools || [];
    const normalizedFromTool = normalize(fromTool);
    const entryTool = tools.find((tool) =>
      normalize(tool.id) === normalizedFromTool ||
      normalize(tool.name) === normalizedFromTool
    );
    return entryTool ? [entryTool] : [];
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

  const selectedIds = useMemo(() => new Set(selectedTools.map((tool) => tool.id)), [selectedTools]);
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
      .filter((tool) => matchesMoment(tool, activeMoment))
      .filter((tool) => !selectedIds.has(tool.id))
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
  const coverageConfidence: NonNullable<SessionState["selectionCoverage"]>["confidence"] =
    coveredCount >= 7 ? "high" : coveredCount >= 4 ? "medium" : "low";
  const toggleTool = (tool: Tool) => {
    setSelectedTools((prev) => {
      const alreadySelected = prev.some((item) => item.id === tool.id);
      if (alreadySelected) {
        onTrack?.("selector_tool_removed", {
          tool_id: tool.id,
          tool_name: tool.name,
          moment_id: activeMoment.id,
          selected_count: Math.max(prev.length - 1, 0),
        });
        return prev.filter((item) => item.id !== tool.id);
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
        source: "suggestion",
        selected_count: prev.length + 1,
      });
      return [...prev, tool];
    });
  };

  const updateSelectedTool = (toolId: string, patch: Partial<Tool>) => {
    setSelectedTools((prev) => prev.map((tool) => tool.id === toolId ? { ...tool, ...patch } : tool));
  };

  const addCustomTool = () => {
    const name = customName.trim();
    if (name.length < 2) return;
    const price = Math.max(0, Number(customPrice) || 0);
    const customTool = makeCustomTool(name, price, activeMoment);
    setSelectedTools((prev) => [...prev, customTool]);
    onTrack?.("selector_custom_tool_added", {
      tool_name: name,
      moment_id: activeMoment.id,
      price,
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

        <div className="grid gap-3 md:grid-cols-3">
          <ReviewMetric label={t("Outils retenus", "Selected tools")} value={String(selectedTools.length)} />
          <ReviewMetric label={t("Zones couvertes", "Covered areas")} value={`${coveredCount}/${STACK_MOMENTS.length}`} />
          <ReviewMetric
            label={t("Confiance", "Confidence")}
            value={coverageConfidence === "high" ? t("Forte", "High") : coverageConfidence === "medium" ? t("Moyenne", "Medium") : t("À affiner", "Low")}
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
                    onRemove={() => toggleTool(tool)}
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
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div className="space-y-3 text-center">
        {toolName && (
          <p className="inline-flex rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            {t(`On part de ${toolName}`, `Starting from ${toolName}`)}
          </p>
        )}
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          {t("On retrouve tes outils, avec ton profil en tête.", "Let's find your tools with your profile in mind.")}
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
          {t(
            "Cherche l’outil que tu utilises vraiment. Les suggestions sont seulement des repères, pas une liste à cocher.",
            "Search for the tool you actually use. Suggestions are only pointers, not a checklist."
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

      <section className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase text-primary">
              {t("Question", "Question")} {Math.max(activeMomentIndex + 1, 1)}/{STACK_MOMENTS.length}
            </p>
            {selectedTools.length > 0 && (
              <button
                type="button"
                onClick={() => openReview("top_count")}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                {selectedTools.length} {t("outil(s)", "tool(s)")}
              </button>
            )}
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(8, Math.round((coverageCount / STACK_MOMENTS.length) * 100))}%` }}
            />
          </div>

          <div className="mt-7 space-y-2">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              {t(activeMoment.questionFr, activeMoment.questionEn)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(activeMoment.hintFr, activeMoment.hintEn)}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <label htmlFor="diagnostic-stack-search" className="text-xs font-semibold uppercase text-muted-foreground">
              {t("Chercher dans le catalogue", "Search the catalog")}
            </label>
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
                placeholder={t("Tape le nom d’un outil : Notion, Slack, Stripe...", "Type a tool name: Notion, Slack, Stripe...")}
                className="h-12 w-full rounded-lg border border-input bg-background pl-10 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <ToolGrid
                title={t("Résultats", "Results")}
                tools={filteredTools.slice(0, 8)}
                selectedIds={selectedIds}
                onToggle={toggleTool}
                t={t}
              />
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
                    selected={selectedIds.has(tool.id)}
                    onToggle={() => toggleTool(tool)}
                    t={t}
                  />
                )) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground sm:col-span-2">
                    {t("Je n'ai pas de suggestion forte ici. Recherche ton outil ou ajoute-le manuellement.", "No strong suggestion here. Search your tool or add it manually.")}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg bg-muted/40 p-3">
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
                <div className="grid gap-2 sm:grid-cols-[1fr_110px_auto]">
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
                    placeholder="€/mois"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={addCustomTool}
                    disabled={customName.trim().length < 2}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                    {t("Ajouter", "Add")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={skipActiveMoment}
              className="h-11 rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t("Pas concerné", "Not relevant")}
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {selectedTools.length > 0 && missingMoments.length === 0 && (
                <button
                  type="button"
                  onClick={() => openReview("all_moments_checked")}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  {t("Vérifier ma stack", "Check my stack")}
                </button>
              )}
              <button
                type="button"
                onClick={moveToNextMoment}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-semibold text-background"
              >
                {selectedInActiveMoment > 0 ? t("Continuer", "Continue") : t("Passer", "Skip")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ToolChoiceButton({
  tool,
  selected,
  onToggle,
  t,
}: {
  tool: Tool;
  selected: boolean;
  onToggle: () => void;
  t: (fr: string, en: string) => string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex min-h-[72px] items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <ToolLogo tool={tool} size={36} className="rounded-md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{tool.name}</p>
        <p className="text-xs text-muted-foreground">
          {tool.price > 0 ? `${tool.price}€/${t("mois", "mo")}` : t("Gratuit", "Free")}
        </p>
      </div>
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
        selected ? "border-primary bg-primary" : "border-border"
      }`}>
        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
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

function ToolGrid({
  title,
  tools,
  selectedIds,
  onToggle,
  t,
}: {
  title: string;
  tools: Tool[];
  selectedIds: Set<string>;
  onToggle: (tool: Tool) => void;
  t: (fr: string, en: string) => string;
}) {
  if (tools.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const selected = selectedIds.has(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onToggle(tool)}
              className={`flex min-h-[74px] items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <ToolLogo tool={tool} size={36} className="rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{tool.name}</p>
                <p className="text-xs text-muted-foreground">
                  {tool.price > 0 ? `${tool.price}€/${t("mois", "mo")}` : t("Gratuit", "Free")}
                </p>
              </div>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                selected ? "border-primary bg-primary" : "border-border"
              }`}>
                {selected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
            </button>
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
      <div className="mt-3 grid grid-cols-[88px_1fr] gap-2">
        <input
          type="number"
          value={tool.price || ""}
          onChange={(event) => onUpdate({ price: Math.max(0, Number(event.target.value) || 0) })}
          placeholder="€/mois"
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
    </div>
  );
}
