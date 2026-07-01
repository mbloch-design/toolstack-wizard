import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, FolderPlus, Pin, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import ToolLogo from "@/components/ToolLogo";
import { useLang } from "@/hooks/useLang";
import { useStackPins } from "@/hooks/useStackPins";
import { useToolSummaries, type ToolSummary } from "@/hooks/useSupabaseData";

const PIN_CATEGORIES = ["Base", "Production", "Vente", "Ops", "Mesure", "Finance"] as const;
type PinCategory = (typeof PIN_CATEGORIES)[number];

function inferPinCategory(tool?: Pick<ToolSummary, "categoryId" | "covers" | "functional_needs" | "name">): PinCategory {
  const text = [tool?.categoryId, tool?.name, ...(tool?.covers || []), ...(tool?.functional_needs || [])].join(" ").toLowerCase();
  if (/crm|sales|vente|lead|email|calendar|rendez|marketing/.test(text)) return "Vente";
  if (/analytics|measure|report|data|tracking|survey/.test(text)) return "Mesure";
  if (/billing|payment|invoice|finance|accounting|paie|factur|stripe/.test(text)) return "Finance";
  if (/automation|workflow|ops|project|task|support|doc|workspace/.test(text)) return "Ops";
  if (/design|content|video|image|code|dev|prototype|editor|writing/.test(text)) return "Production";
  return "Base";
}

const CartPage = () => {
  const { t, lang, prefix } = useLang();
  const { tools } = useToolSummaries();
  const { state, activeBoard, pinTool, unpinTool, toggleToolInBoard, createBoard, updateBoard, setActiveBoard } = useStackPins();
  const [toolQuery, setToolQuery] = useState("");

  const toolBySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug || tool.id, tool])), [tools]);
  const pinnedTools = state.pinnedToolSlugs.map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[];
  const boardTools = (activeBoard?.toolSlugs || []).map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[];

  const suggestedTools = useMemo(() => {
    const q = toolQuery.trim().toLowerCase();
    return tools
      .filter((tool) => {
        const slug = tool.slug || tool.id;
        if (state.pinnedToolSlugs.includes(slug)) return false;
        if (!q) return true;
        return [tool.name, tool.shortDescription, tool.shortDescriptionEn, tool.categoryId, ...(tool.covers || [])].join(" ").toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [state.pinnedToolSlugs, toolQuery, tools]);

  const coveredCategories = new Set(boardTools.map((tool) => inferPinCategory(tool)));
  const missingCategories = PIN_CATEGORIES.filter((category) => !coveredCategories.has(category));
  const monthlyBudget = boardTools.reduce((sum, tool) => sum + (Number(tool.defaultMonthlyPrice) || 0), 0);
  const isCartEmpty = pinnedTools.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <section className="tt-page-hero">
        <div className="tt-page-hero-inner">
          <div style={{ marginBottom: 14 }}>
            <Breadcrumb items={[{ label: t("Panier", "Cart") }]} />
          </div>
          <span className="tt-page-hero-eyebrow">{t("Panier d'outils", "Tool cart")}</span>
          <h1 className="tt-page-hero-title">{t("Pin tes outils dans des tableaux.", "Pin tools into boards.")}</h1>
          <p className="tt-page-hero-desc">
            {t(
              "Ajoute des outils depuis le catalogue, puis organise-les en tableaux pour préparer tes stacks.",
              "Add tools from the catalog, then organize them into boards to prepare your stacks.",
            )}
          </p>
          <div className="tt-page-hero-cta">
            <Link to={`${prefix}/tools`} className="eh-cta-primary">{t("Parcourir les outils", "Browse tools")} <span aria-hidden>→</span></Link>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-container">
          {isCartEmpty ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon"><ShoppingBag size={30} aria-hidden /></div>
              <h2>{t("Ton panier est vide.", "Your cart is empty.")}</h2>
              <p>
                {t(
                  "Va dans le catalogue et pin les outils que tu veux garder pour construire ton stack.",
                  "Go to the catalog and pin the tools you want to keep for building your stack.",
                )}
              </p>
              <Link to={`${prefix}/tools`} className="eh-cta-primary">{t("Voir les outils", "Browse tools")} <span aria-hidden>→</span></Link>
            </div>
          ) : (
            <div className="sb-pinterest-shell">
            <section className="sb-board-wall" aria-label={t("Tableaux", "Boards") as string}>
              <div className="sb-board-grid">
                {state.boards.map((board) => {
                  const previewTools = board.toolSlugs.map((slug) => toolBySlug.get(slug)).filter(Boolean) as ToolSummary[];
                  return (
                    <button key={board.id} type="button" className={`sb-board-card${board.id === activeBoard?.id ? " sb-board-card--active" : ""}`} onClick={() => setActiveBoard(board.id)}>
                      <span className="sb-board-preview">
                        {previewTools.slice(0, 4).map((tool, index) => (
                          <span key={tool.id} className={`sb-board-preview-tile sb-board-preview-tile--${index + 1}`}>
                            <ToolLogo tool={tool} size={index === 0 ? 44 : 30} />
                          </span>
                        ))}
                        {previewTools.length === 0 && <span className="sb-board-preview-empty"><FolderPlus size={24} aria-hidden /></span>}
                      </span>
                      <span className="sb-board-name">{board.name}</span>
                      <span className="sb-board-meta">{board.toolSlugs.length} {t("pins", "pins")}</span>
                    </button>
                  );
                })}
                <button type="button" className="sb-board-card sb-board-card--create" onClick={createBoard}>
                  <span className="sb-board-preview sb-board-preview--create"><FolderPlus size={30} aria-hidden /></span>
                  <span className="sb-board-name">{t("Nouveau tableau", "New board")}</span>
                  <span className="sb-board-meta">{t("Créer une collection", "Create a collection")}</span>
                </button>
              </div>
            </section>

            <div className="sb-pinterest-main">
              <main className="sb-board-focus">
                {activeBoard && (
                  <>
                    <div className="sb-board-header">
                      <div className="sb-board-title-fields">
                        <input className="sb-stack-name" value={activeBoard.name} onChange={(event) => updateBoard(activeBoard.id, { name: event.target.value })} aria-label={t("Nom du tableau", "Board name")} />
                        <textarea className="sb-stack-goal" value={activeBoard.description} onChange={(event) => updateBoard(activeBoard.id, { description: event.target.value })} aria-label={t("Description du tableau", "Board description")} rows={2} />
                      </div>
                      <div className="sb-board-stats">
                        <span>{boardTools.length} {t("pins", "pins")}</span>
                        <span>{monthlyBudget}€/mois</span>
                        <span>{coveredCategories.size}/{PIN_CATEGORIES.length}</span>
                      </div>
                    </div>

                    <div className="sb-gap-list sb-gap-list--inline">
                      {missingCategories.slice(0, 4).map((category) => <span key={category}>{category}</span>)}
                      {missingCategories.length === 0 && <span>{t("Tableau équilibré", "Balanced board")}</span>}
                    </div>

                    <div className="sb-masonry">
                      {boardTools.length > 0 ? boardTools.map((tool, index) => {
                        const slug = tool.slug || tool.id;
                        return (
                          <article key={slug} className={`sb-masonry-pin sb-masonry-pin--${(index % 5) + 1}`}>
                            <div className="sb-masonry-visual">
                              <ToolLogo tool={tool} size={54} />
                              <button type="button" className="sb-pin-remove" onClick={() => toggleToolInBoard(slug)} aria-label={t("Retirer du tableau", "Remove from board")}>
                                <X size={15} aria-hidden />
                              </button>
                            </div>
                            <div className="sb-masonry-body">
                              <strong>{tool.name}</strong>
                              <span>{inferPinCategory(tool)}</span>
                              <p>{lang === "fr" ? tool.shortDescription : (tool.shortDescriptionEn || tool.shortDescription)}</p>
                              <Link to={`${prefix}/tool/${slug}`} className="sb-tool-link">{t("Voir la fiche", "Open page")}</Link>
                            </div>
                          </article>
                        );
                      }) : (
                        <div className="sb-empty-builder">{t("Pin un outil du panier pour commencer ce tableau.", "Pin a cart item to start this board.")}</div>
                      )}
                    </div>
                  </>
                )}
              </main>

              <aside className="sb-cart-dock" aria-label={t("Panier d'outils", "Tool cart") as string}>
                <div className="sb-cart-head">
                  <div>
                    <p className="sb-panel-kicker">{t("Panier", "Cart")}</p>
                    <h3>{pinnedTools.length} {t("outils", "tools")}</h3>
                  </div>
                  <ShoppingBag size={18} aria-hidden />
                </div>
                <div className="sb-cart-pins">
                  {pinnedTools.map((tool) => {
                    const slug = tool.slug || tool.id;
                    const selected = activeBoard?.toolSlugs.includes(slug) || false;
                    return (
                      <div key={slug} className="sb-cart-pin">
                        <ToolLogo tool={tool} size={28} />
                        <span>{tool.name}</span>
                        <button type="button" className={`sb-icon-button${selected ? " sb-icon-button--active" : ""}`} onClick={() => toggleToolInBoard(slug)} aria-label={selected ? t("Retirer du tableau actif", "Remove from active board") : t("Pinner dans le tableau actif", "Pin to active board")}>
                          {selected ? <Check size={15} aria-hidden /> : <Pin size={15} aria-hidden />}
                        </button>
                        <button type="button" className="sb-icon-button" onClick={() => unpinTool(slug)} aria-label={t("Retirer du panier", "Remove from cart")}>
                          <Trash2 size={15} aria-hidden />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="sb-search-block">
                  <label htmlFor="sb-tool-search">{t("Ajouter au panier", "Add to cart")}</label>
                  <input id="sb-tool-search" value={toolQuery} onChange={(event) => setToolQuery(event.target.value)} placeholder={t("Rechercher…", "Search…")} />
                </div>
                <div className="sb-suggestions">
                  {suggestedTools.map((tool) => {
                    const slug = tool.slug || tool.id;
                    return (
                      <button key={slug} type="button" className="sb-suggestion" onClick={() => pinTool(slug)}>
                        <ToolLogo tool={tool} size={24} />
                        <span>{tool.name}</span>
                        <Plus size={14} aria-hidden />
                      </button>
                    );
                  })}
                </div>
            </aside>
          </div>
        </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CartPage;
