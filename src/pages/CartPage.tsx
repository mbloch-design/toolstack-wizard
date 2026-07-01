import { useMemo, type KeyboardEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useCategories, useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";

type StackBoard = {
  id: string;
  labelFr: string;
  labelEn: string;
  pattern: RegExp;
};

type StackObjective = StackBoard & {
  tools: ToolSummary[];
};

type StackSubdomain = {
  id: string;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  descriptionEn: string;
  order: number;
  pattern?: RegExp;
};

type StackSubdomainGroup = StackSubdomain & {
  tools: ToolSummary[];
};

const STACK_BOARDS: StackBoard[] = [
  {
    id: "ia",
    labelFr: "IA",
    labelEn: "AI",
    pattern: /\bia\b|ai|gpt|llm|claude|chatgpt|midjourney|generation|generative|assistant|prompt/i,
  },
  {
    id: "organisation",
    labelFr: "Organisation",
    labelEn: "Organization",
    pattern: /organis|project|projet|task|todo|kanban|note|doc|wiki|calendar|agenda|workspace|collaboration|meeting/i,
  },
  {
    id: "design",
    labelFr: "Design",
    labelEn: "Design",
    pattern: /design|figma|prototype|photo|image|visual|visuel|canvas|creative|creation|brand|logo|video|3d/i,
  },
  {
    id: "automation",
    labelFr: "Automatisation",
    labelEn: "Automation",
    pattern: /automat|workflow|zapier|make|n8n|integration|api|nocode|no-code|trigger|connector/i,
  },
  {
    id: "marketing",
    labelFr: "Marketing",
    labelEn: "Marketing",
    pattern: /marketing|seo|content|contenu|social|newsletter|email|campaign|ads|analytics|audience|growth/i,
  },
  {
    id: "vente",
    labelFr: "Vente",
    labelEn: "Sales",
    pattern: /crm|sales|vente|client|lead|prospect|pipeline|ecommerce|shop|payment|checkout|stripe|booking/i,
  },
  {
    id: "finance",
    labelFr: "Finance",
    labelEn: "Finance",
    pattern: /finance|account|compta|invoice|factur|billing|budget|expense|payroll|bank|tax/i,
  },
  {
    id: "dev",
    labelFr: "Dev",
    labelEn: "Dev",
    pattern: /dev|code|github|git|deploy|hosting|database|data|backend|frontend|monitoring|security|securite/i,
  },
];

const STACK_SUBDOMAINS: StackSubdomain[] = [
  {
    id: "ia-generative",
    labelFr: "IA générative",
    labelEn: "Generative AI",
    descriptionFr: "Assistants, modèles généralistes, génération et aide à la production.",
    descriptionEn: "Assistants, general models, generation and production support.",
    order: 5,
    pattern: /gpt|llm|claude|chatgpt|gemini|deepseek|mistral|perplexity|copilot|assistant|prompt/i,
  },
  {
    id: "retouche-photo",
    labelFr: "Retouche photo",
    labelEn: "Photo editing",
    descriptionFr: "Outils pour corriger, composer, préparer et organiser les images.",
    descriptionEn: "Tools to correct, compose, prepare and organize images.",
    order: 10,
    pattern: /retouche-photo|photo|photographe|photoshop|lightroom|raw|compositing|image-edit|upscale|background/i,
  },
  {
    id: "montage-video",
    labelFr: "Montage vidéo",
    labelEn: "Video editing",
    descriptionFr: "Montage, sous-titrage, export et production vidéo quotidienne.",
    descriptionEn: "Editing, subtitles, export and day-to-day video production.",
    order: 20,
    pattern: /montage-video|video|vidéo|premiere|davinci|capcut|subtitle|sous-titre|review-client-video|rendu-video/i,
  },
  {
    id: "motion-3d",
    labelFr: "Motion / 3D",
    labelEn: "Motion / 3D",
    descriptionFr: "Animation, modélisation, rendu et effets visuels.",
    descriptionEn: "Animation, modeling, rendering and visual effects.",
    order: 30,
    pattern: /motion|3d|animation-2d-3d|motion-design|modelisation|modélisation|rendu-3d|after-effects|blender|spline|sketchup|cinema|enscape|v-ray|twinmotion|d5-render/i,
  },
  {
    id: "audio-podcast",
    labelFr: "Audio / podcast",
    labelEn: "Audio / podcast",
    descriptionFr: "Enregistrement, amélioration audio, montage et diffusion podcast.",
    descriptionEn: "Recording, audio enhancement, editing and podcast publishing.",
    order: 40,
    pattern: /audio|podcast|montage-audio|qualite-podcast|qualité-podcast|hebergement-audio|distribution-podcast|voice|transcription/i,
  },
  {
    id: "design-system",
    labelFr: "Design system",
    labelEn: "Design system",
    descriptionFr: "Composants, tokens, librairies, cohérence UI et handoff.",
    descriptionEn: "Components, tokens, libraries, UI consistency and handoff.",
    order: 50,
    pattern: /design-system|ui-components|component|tokens|handoff|dev mode|accessibility|version-control|library|librairie/i,
  },
  {
    id: "prototypage",
    labelFr: "Prototypage",
    labelEn: "Prototyping",
    descriptionFr: "Maquettes, prototypes, parcours, collaboration et validation.",
    descriptionEn: "Mockups, prototypes, flows, collaboration and validation.",
    order: 60,
    pattern: /prototype|prototyping|wireframe|mockup|figma|framer|webflow|design-collaboration|commenting|feedback/i,
  },
  {
    id: "creation-visuelle",
    labelFr: "Création visuelle",
    labelEn: "Visual creation",
    descriptionFr: "Création graphique, identité, contenus et déclinaisons visuelles.",
    descriptionEn: "Graphic creation, identity, content and visual variations.",
    order: 70,
    pattern: /design-visuel|graphic design|brand|branding|logo|illustration|creative|creation|création|canva|presentation|présentation|image/i,
  },
  {
    id: "automation",
    labelFr: "Automation",
    labelEn: "Automation",
    descriptionFr: "Connexions, workflows, API et tâches répétitives automatisées.",
    descriptionEn: "Connections, workflows, APIs and automated repetitive tasks.",
    order: 80,
    pattern: /automation|automatisation|workflow|api|integration|intégration|zapier|make|n8n|connector|trigger/i,
  },
  {
    id: "marketing",
    labelFr: "Marketing / contenu",
    labelEn: "Marketing / content",
    descriptionFr: "Publication, SEO, social, campagnes, newsletter et mesure.",
    descriptionEn: "Publishing, SEO, social, campaigns, newsletter and measurement.",
    order: 90,
    pattern: /marketing|seo|content|contenu|social|newsletter|email|ads|campaign|audience|analytics|growth/i,
  },
  {
    id: "gestion",
    labelFr: "Gestion / organisation",
    labelEn: "Management / organization",
    descriptionFr: "Projets, notes, clients, fichiers, calendrier et coordination.",
    descriptionEn: "Projects, notes, clients, files, calendar and coordination.",
    order: 100,
    pattern: /project|projet|task|todo|kanban|note|doc|wiki|calendar|agenda|crm|client|workspace|collaboration/i,
  },
];

const TOOL_TYPE_LABELS: Record<string, { fr: string; en: string }> = {
  ia: { fr: "IA", en: "AI" },
  metier: { fr: "Métier", en: "Core" },
  gestion: { fr: "Gestion", en: "Management" },
  plugin: { fr: "Plugin", en: "Plugin" },
  satellite: { fr: "Satellite", en: "Satellite" },
};

const NEED_LABEL_OVERRIDES: Record<string, { fr: string; en: string }> = {
  "retouche-photo": { fr: "Retouche photo", en: "Photo editing" },
  "montage-video": { fr: "Montage vidéo", en: "Video editing" },
  "motion-video": { fr: "Motion vidéo", en: "Motion video" },
  "motion-design": { fr: "Motion design", en: "Motion design" },
  "animation-2d-3d": { fr: "Animation 2D / 3D", en: "2D / 3D animation" },
  "modelisation-3d": { fr: "Modélisation 3D", en: "3D modeling" },
  "rendu-3d": { fr: "Rendu 3D", en: "3D rendering" },
  "montage-audio": { fr: "Montage audio", en: "Audio editing" },
  "qualite-podcast": { fr: "Qualité podcast", en: "Podcast quality" },
  "distribution-podcast": { fr: "Distribution podcast", en: "Podcast distribution" },
  "design-system": { fr: "Design system", en: "Design system" },
  "design-visuel": { fr: "Design visuel", en: "Visual design" },
  "design-collaboration": { fr: "Collaboration design", en: "Design collaboration" },
  "ui-components": { fr: "Composants UI", en: "UI components" },
  "project-management": { fr: "Gestion de projet", en: "Project management" },
  "email-marketing": { fr: "Email marketing", en: "Email marketing" },
  "api-integration": { fr: "Intégrations API", en: "API integrations" },
  "ai-generation": { fr: "Génération IA", en: "AI generation" },
  "ai-image": { fr: "Image IA", en: "AI image" },
  "ai-writing": { fr: "Rédaction IA", en: "AI writing" },
  "ai-coding": { fr: "Code IA", en: "AI coding" },
};

function toolSearchText(tool: ToolSummary, categoryLabel = "") {
  return [
    tool.name,
    tool.categoryId,
    categoryLabel,
    tool.shortDescription,
    tool.shortDescriptionEn,
    tool.tool_type,
    ...(tool.covers || []),
    ...(tool.functional_needs || []),
    ...(tool.verticals || []),
  ].join(" ");
}

function getBoardForTool(tool: ToolSummary, categoryLabel: string) {
  const text = toolSearchText(tool, categoryLabel);
  return STACK_BOARDS.find((board) => board.pattern.test(text)) || STACK_BOARDS[1];
}

function getSubdomainForTool(tool: ToolSummary, categoryLabel: string): StackSubdomain {
  const text = toolSearchText(tool, categoryLabel);
  const matchedSubdomain = STACK_SUBDOMAINS.find((subdomain) => subdomain.pattern?.test(text));
  if (matchedSubdomain) return matchedSubdomain;

  const fallbackLabel = categoryLabel || cleanCategoryLabel(tool.categoryId) || "Autres outils";
  return {
    id: `category-${slugify(fallbackLabel)}`,
    labelFr: fallbackLabel,
    labelEn: fallbackLabel,
    descriptionFr: "Outils utiles à cet objectif, regroupés depuis leur catégorie catalogue.",
    descriptionEn: "Useful tools for this goal, grouped from their catalog category.",
    order: 900,
  };
}

function cleanCategoryLabel(label?: string) {
  return (label || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "autres";
}

function getToolKey(tool: ToolSummary) {
  return tool.slug || tool.id;
}

function formatToolCount(count: number, lang: string) {
  if (lang === "en") return `${count} ${count === 1 ? "tool" : "tools"}`;
  return `${count} outil${count > 1 ? "s" : ""}`;
}

function formatSubdomainCount(count: number, lang: string) {
  if (lang === "en") return `${count} ${count === 1 ? "area" : "areas"}`;
  return `${count} domaine${count > 1 ? "s" : ""}`;
}

function formatMonthlyPrice(value: number | undefined, lang: string) {
  const price = Math.max(0, Math.round(Number(value) || 0));
  if (lang === "en") return `€${price}/mo`;
  return `${price} €/mois`;
}

function getToolTypeLabel(tool: ToolSummary, lang: string) {
  const label = TOOL_TYPE_LABELS[tool.tool_type || "satellite"];
  if (!label) return tool.tool_type || (lang === "en" ? "Tool" : "Outil");
  return lang === "en" ? label.en : label.fr;
}

function slugToLabel(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/^\p{L}/u, (letter) => letter.toUpperCase());
}

function getNeedLabel(slug: string, lang: string) {
  const override = NEED_LABEL_OVERRIDES[slug];
  if (override) return lang === "en" ? override.en : override.fr;
  return slugToLabel(slug);
}

function getToolNeedLabels(tool: ToolSummary, lang: string) {
  return Array.from(new Set([...(tool.functional_needs || []), ...(tool.covers || []), ...(tool.verticals || [])]))
    .filter(Boolean)
    .slice(0, 5)
    .map((need) => getNeedLabel(need, lang));
}

function slugMatches(toolSlug = "", relationValue = "") {
  return toolSlug === relationValue ||
    toolSlug.endsWith(`-${relationValue}`) ||
    toolSlug.replace(/^[^-]+-/, "") === relationValue;
}

function getToolRelation(tool: ToolSummary, allTools: ToolSummary[], lang: string) {
  const toolSlug = getToolKey(tool);
  const hostApp = tool.host_app
    ? allTools.find((candidate) => slugMatches(getToolKey(candidate), tool.host_app || ""))
    : null;

  if (hostApp) {
    return lang === "en" ? `Plugin for ${hostApp.name}` : `Plugin pour ${hostApp.name}`;
  }

  const bundleParent = tool.bundle_parent
    ? allTools.find((candidate) => getToolKey(candidate) === tool.bundle_parent || candidate.id === tool.bundle_parent)
    : null;

  if (bundleParent) {
    return lang === "en" ? `Included in ${bundleParent.name}` : `Inclus dans ${bundleParent.name}`;
  }

  const childPlugins = allTools.filter((candidate) =>
    candidate.tool_type === "plugin" &&
    !!candidate.host_app &&
    slugMatches(toolSlug, candidate.host_app)
  );

  if (childPlugins.length > 0) {
    if (lang === "en") return `${childPlugins.length} ${childPlugins.length === 1 ? "plugin" : "plugins"} available`;
    return `${childPlugins.length} plugin${childPlugins.length > 1 ? "s" : ""} associé${childPlugins.length > 1 ? "s" : ""}`;
  }

  return "";
}

const CartPage = () => {
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { categories } = useCategories();
  const { state, unpinTool } = useStackPins();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryById = useMemo(() => new Map(categories.map((category: any) => [category.id, category])), [categories]);
  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);
  const selectedTools = state.pinnedToolSlugs.map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[];

  const boards = useMemo(() => {
    const grouped = new Map<string, ToolSummary[]>();
    STACK_BOARDS.forEach((board) => grouped.set(board.id, []));

    selectedTools.forEach((tool) => {
      const category = categoryById.get(tool.categoryId);
      const categoryLabel = category
        ? cleanCategoryLabel(lang === "en" ? category.nameEn || category.name : category.name)
        : "";
      const board = getBoardForTool(tool, categoryLabel);
      grouped.get(board.id)?.push(tool);
    });

    return STACK_BOARDS.map((board) => ({
      ...board,
      tools: grouped.get(board.id) || [],
    }));
  }, [categoryById, lang, selectedTools]);
  const activeBoards = boards.filter((board) => board.tools.length > 0) as StackObjective[];
  const zoomObjectiveId = searchParams.get("objectif");
  const zoomedBoard = activeBoards.find((board) => board.id === zoomObjectiveId) || null;
  const zoomedBudget = zoomedBoard?.tools.reduce((sum, tool) => sum + (Number(tool.defaultMonthlyPrice) || 0), 0) || 0;

  function getCategoryLabel(tool: ToolSummary) {
    const category = categoryById.get(tool.categoryId) as any;
    return category
      ? cleanCategoryLabel(lang === "en" ? category.nameEn || category.name : category.name)
      : cleanCategoryLabel(tool.categoryId);
  }

  const zoomedSubdomains = useMemo(() => {
    if (!zoomedBoard) return [] as StackSubdomainGroup[];
    const groups = new Map<string, StackSubdomainGroup>();

    zoomedBoard.tools.forEach((tool) => {
      const subdomain = getSubdomainForTool(tool, getCategoryLabel(tool));
      const existing = groups.get(subdomain.id) || { ...subdomain, tools: [] };
      existing.tools.push(tool);
      groups.set(subdomain.id, existing);
    });

    return Array.from(groups.values()).sort((a, b) => a.order - b.order || a.labelFr.localeCompare(b.labelFr));
  }, [categoryById, lang, zoomedBoard]);

  function openObjective(boardId: string) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("objectif", boardId);
    setSearchParams(nextParams);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function closeObjective() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("objectif");
    setSearchParams(nextParams);
  }

  function handleBoardKeyDown(event: KeyboardEvent<HTMLElement>, boardId: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openObjective(boardId);
  }

  function removeToolFromZoom(toolSlug: string) {
    const shouldClose = !!zoomedBoard && zoomedBoard.tools.length <= 1;
    unpinTool(toolSlug);
    if (shouldClose) closeObjective();
  }

  return (
    <div className={`stack-boards-page${zoomedBoard ? " stack-boards-page--zoomed" : ""}`}>
      <header className="stack-boards-header">
        <div>
          <div className="cart-breadcrumb">
            <Breadcrumb items={[{ label: t("Ma stack", "My stack") }]} />
          </div>
          <span className="cart-eyebrow">{t("Stack en construction", "Stack in progress")}</span>
          <h1>{t("Mes objectifs", "My goals")}</h1>
          <p>{t("Chaque objectif regroupe les outils que vous avez mis de côté pour composer votre stack.", "Each goal groups the tools you saved to compose your stack.")}</p>
        </div>
        <Link to={`${prefix}/tools`} className="cart-primary-link">{t("Ajouter des outils", "Add tools")}</Link>
      </header>

      {zoomedBoard ? (
        <main className="stack-objective-detail" aria-label={t(`Détail ${zoomedBoard.labelFr}`, `${zoomedBoard.labelEn} detail`) as string}>
          <button type="button" className="stack-zoom-back" onClick={closeObjective}>
            <ArrowLeft size={17} aria-hidden />
            {t("Retour aux objectifs", "Back to goals")}
          </button>

          <section className={`stack-objective-hero stack-board-card--${zoomedBoard.id}`}>
            <div className="stack-objective-hero-copy">
              <span>{t("Objectif zoomé", "Zoomed goal")}</span>
              <h2>{t(zoomedBoard.labelFr, zoomedBoard.labelEn)}</h2>
              <p>
                {t(
                  "Vue d'ensemble des outils sélectionnés, classés par usage concret pour comprendre ce que chacun apporte à votre stack.",
                  "Overview of selected tools, grouped by practical use so you can see what each one brings to your stack.",
                )}
              </p>
            </div>
            <div className="stack-objective-stats" aria-label={t("Résumé de l'objectif", "Goal summary") as string}>
              <div>
                <strong>{zoomedBoard.tools.length}</strong>
                <span>{t("outils", "tools")}</span>
              </div>
              <div>
                <strong>{zoomedSubdomains.length}</strong>
                <span>{t("domaines", "areas")}</span>
              </div>
              <div>
                <strong>{formatMonthlyPrice(zoomedBudget, lang)}</strong>
                <span>{t("budget estimé", "estimated budget")}</span>
              </div>
            </div>
          </section>

          <div className="stack-subdomain-grid">
            {zoomedSubdomains.map((group) => (
              <section key={group.id} className="stack-subdomain-section">
                <div className="stack-subdomain-heading">
                  <span>{formatToolCount(group.tools.length, lang)}</span>
                  <h3>{t(group.labelFr, group.labelEn)}</h3>
                  <p>{t(group.descriptionFr, group.descriptionEn)}</p>
                </div>

                <div className="stack-detail-tool-grid">
                  {group.tools.map((tool) => {
                    const toolSlug = getToolKey(tool);
                    const needs = getToolNeedLabels(tool, lang);
                    const relation = getToolRelation(tool, tools, lang);
                    const categoryLabel = getCategoryLabel(tool);
                    const description = lang === "en" ? tool.shortDescriptionEn || tool.shortDescription : tool.shortDescription;

                    return (
                      <article key={toolSlug} className="stack-detail-tool-card">
                        <div className="stack-detail-tool-head">
                          <ToolLogo tool={tool} size={42} />
                          <div>
                            <span>{getToolTypeLabel(tool, lang)}</span>
                            <h4>{tool.name}</h4>
                          </div>
                        </div>

                        {description && <p className="stack-detail-tool-desc">{description}</p>}

                        <div className="stack-detail-tool-meta">
                          {categoryLabel && <span>{categoryLabel}</span>}
                          <span>{formatMonthlyPrice(tool.defaultMonthlyPrice, lang)}</span>
                          {relation && <span>{relation}</span>}
                        </div>

                        {needs.length > 0 && (
                          <div className="stack-detail-chip-row">
                            {needs.map((need) => (
                              <span key={need}>{need}</span>
                            ))}
                          </div>
                        )}

                        <div className="stack-detail-tool-actions">
                          <Link to={`${prefix}/tool/${toolSlug}`}>
                            {t("Voir la fiche", "Open page")}
                            <ArrowRight size={14} aria-hidden />
                          </Link>
                          <button type="button" onClick={() => removeToolFromZoom(toolSlug)}>
                            <X size={14} aria-hidden />
                            {t("Retirer", "Remove")}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </main>
      ) : (
        <main className="stack-board-grid" aria-label={t("Objectifs de stack", "Stack goals") as string}>
          {activeBoards.map((board) => {
            const visibleTools = board.tools.slice(0, 6);
            const overflowCount = Math.max(0, board.tools.length - visibleTools.length);
            return (
              <section
                key={board.id}
                className={`stack-board-card stack-board-card--${board.id} stack-board-card--openable`}
                role="button"
                tabIndex={0}
                onClick={() => openObjective(board.id)}
                onKeyDown={(event) => handleBoardKeyDown(event, board.id)}
                aria-label={t(`Zoomer dans ${board.labelFr}`, `Zoom into ${board.labelEn}`) as string}
              >
                <div
                  className="stack-board-preview"
                  role="list"
                  aria-label={t(`Outils ${board.labelFr}`, `${board.labelEn} tools`) as string}
                >
                  {visibleTools.map((tool, index) => (
                    <span
                      key={getToolKey(tool)}
                      className={`stack-board-logo stack-board-logo--${index + 1}`}
                      data-tool-slug={getToolKey(tool)}
                      role="listitem"
                    >
                      <ToolLogo tool={tool} size={42} className="stack-board-logo-mark" />
                      <button
                        type="button"
                        className="stack-board-remove"
                        onClick={(event) => {
                          event.stopPropagation();
                          unpinTool(getToolKey(tool));
                        }}
                        aria-label={t(`Retirer ${tool.name} de ma stack`, `Remove ${tool.name} from my stack`) as string}
                        title={t("Retirer de ma stack", "Remove from my stack") as string}
                      >
                        <X size={13} aria-hidden />
                      </button>
                    </span>
                  ))}
                  {overflowCount > 0 && <span className="stack-board-overflow">+{overflowCount}</span>}
                </div>

                <div className="stack-board-footer">
                  <div>
                    <h2>{t(board.labelFr, board.labelEn)}</h2>
                    <p>{formatSubdomainCount(
                      new Set(board.tools.map((tool) => getSubdomainForTool(tool, getCategoryLabel(tool)).id)).size,
                      lang,
                    )}</p>
                  </div>
                  <span>{formatToolCount(board.tools.length, lang)}</span>
                </div>
              </section>
            );
          })}
          <section className="stack-board-card stack-board-card--create">
            <Link
              to={`${prefix}/tools`}
              className="stack-board-create-preview"
              aria-label={t("Créer un nouvel objectif", "Create a new goal") as string}
            >
              <span className="stack-board-create-tile stack-board-create-tile--main" />
              <span className="stack-board-create-tile stack-board-create-tile--side-top" />
              <span className="stack-board-create-tile stack-board-create-tile--side-bottom" />
              <span className="stack-board-create-button">
                <Plus size={18} aria-hidden />
                {t("Créer", "Create")}
              </span>
            </Link>

            <div className="stack-board-footer">
              <div>
                <h2>{t("Nouvel objectif", "New goal")}</h2>
              </div>
              <span>{t("Ajouter", "Add")}</span>
            </div>
          </section>
        </main>
      )}
    </div>
  );
};

export default CartPage;
