import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useTools } from "@/hooks/useSupabaseData";
import { setSeoTags, setJsonLd, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";
import ToolLogo from "@/components/ToolLogo";
import type { Tool } from "@/data/types";
import { FEATURED_COMPARISONS } from "@/data/comparisons";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function findTool(tools: Tool[], idOrSlug: string): Tool | undefined {
  return tools.find(t => t.id === idOrSlug || t.slug === idOrSlug);
}

function getPriceLabel(tool: Tool, t: (fr: string, en: string) => string): string {
  const v5 = tool.pricing_v5?.compare_price_monthly_eur;
  const price = v5 != null && v5 > 0 ? v5 : tool.defaultMonthlyPrice;
  if (price > 0) return `${price}€/${t("mois", "mo")}`;
  return t("Gratuit", "Free");
}

/* ─── Slug matching (bidirectional) ──────────────────────────────────────── */
function findExistingComparison(
  slugA: string,
  slugB: string,
): { exists: boolean; slugPair: string | null } {
  const ab = `${slugA}-vs-${slugB}`;
  const ba = `${slugB}-vs-${slugA}`;
  const found = FEATURED_COMPARISONS.find(c => c.slugPair === ab || c.slugPair === ba);
  return { exists: !!found, slugPair: found?.slugPair ?? null };
}

/* ─── Category detection ─────────────────────────────────────────────────── */
type CompareCategoryId = "all" | "ia" | "productivite" | "design" | "crm" | "automatisation";

function getSlugCategory(slugPair: string): CompareCategoryId {
  if (
    ["chatgpt", "claude", "gemini", "copilot", "cursor", "midjourney", "deepseek",
     "firefly", "grammarly", "prowritingaid"].some(k => slugPair.includes(k))
  ) return "ia";
  if (
    ["notion", "asana", "clickup", "linear", "jira", "trello", "todoist",
     "basecamp", "wrike", "hive", "smartsuite", "obsidian", "coda"].some(k => slugPair.includes(k))
  ) return "productivite";
  if (
    ["figma", "canva", "visme", "prezi", "pitch", "webflow", "framer"].some(k => slugPair.includes(k))
  ) return "design";
  if (
    ["zapier", "make", "albato"].some(k => slugPair.includes(k))
  ) return "automatisation";
  if (
    ["pipedrive", "salesforce", "zoho", "close-vs", "vs-close", "capsule"].some(k => slugPair.includes(k))
  ) return "crm";
  return "productivite";
}

const COMPARE_CATEGORY_FILTERS: { id: CompareCategoryId; label: string; labelEn: string }[] = [
  { id: "all",            label: "Tous",          labelEn: "All" },
  { id: "ia",             label: "IA",            labelEn: "AI" },
  { id: "productivite",   label: "Productivité",  labelEn: "Productivity" },
  { id: "design",         label: "Design",        labelEn: "Design" },
  { id: "automatisation", label: "Automatisation",labelEn: "Automation" },
  { id: "crm",            label: "CRM / Ventes",  labelEn: "CRM / Sales" },
];

/* ─── Popular suggestions ────────────────────────────────────────────────── */
const POPULAR_SUGGESTIONS = [
  { label: "Notion vs Airtable", slugPair: "notion-vs-airtable" },
  { label: "ChatGPT vs Claude",  slugPair: "chatgpt-vs-claude" },
  { label: "Zapier vs Make",     slugPair: "zapier-vs-make" },
  { label: "Figma vs Canva",     slugPair: "figma-vs-canva" },
  { label: "Linear vs Jira",     slugPair: "linear-vs-jira" },
];

/* ─── Card description ───────────────────────────────────────────────────── */
function deriveCardDesc(a: Tool, b: Tool, lang: "fr" | "en"): string {
  const keepA = lang === "fr"
    ? (a.verdict?.keepIf || [])[0]
    : (a.verdictEn?.keepIf || a.verdict?.keepIf || [])[0];
  const keepB = lang === "fr"
    ? (b.verdict?.keepIf || [])[0]
    : (b.verdictEn?.keepIf || b.verdict?.keepIf || [])[0];
  if (keepA && keepB) {
    return lang === "fr"
      ? `${a.name} si ${keepA.toLowerCase()}. ${b.name} si ${keepB.toLowerCase()}.`
      : `${a.name} if ${keepA.toLowerCase()}. ${b.name} if ${keepB.toLowerCase()}.`;
  }
  const sd = lang === "fr"
    ? (a.shortDescription || "") + (b.shortDescription ? ` vs ${b.shortDescription}` : "")
    : (a.shortDescriptionEn || a.shortDescription || "");
  return sd || (lang === "fr"
    ? `Comparer ${a.name} et ${b.name} selon ton usage.`
    : `Compare ${a.name} and ${b.name} based on your use case.`);
}
function getCardDecisionQuestion(a: Tool, b: Tool, lang: "fr" | "en"): string {
  const keepA = lang === "fr"
    ? (a.verdict?.keepIf || [])[0]
    : (a.verdictEn?.keepIf || a.verdict?.keepIf || [])[0];
  const keepB = lang === "fr"
    ? (b.verdict?.keepIf || [])[0]
    : (b.verdictEn?.keepIf || b.verdict?.keepIf || [])[0];
  if (keepA && keepB) {
    return lang === "fr"
      ? `Plutôt ${a.name} pour ${keepA.toLowerCase()}, ou ${b.name} pour ${keepB.toLowerCase()} ?`
      : `${a.name} for ${keepA.toLowerCase()}, or ${b.name} for ${keepB.toLowerCase()}?`;
  }
  return lang === "fr"
    ? `Quel outil colle le mieux à ton usage réel ?`
    : `Which tool best fits your real use case?`;
}
function getCardBestFor(a: Tool, b: Tool, lang: "fr" | "en"): string {
  const keepA = lang === "fr"
    ? (a.verdict?.keepIf || [])[0]
    : (a.verdictEn?.keepIf || a.verdict?.keepIf || [])[0];
  const keepB = lang === "fr"
    ? (b.verdict?.keepIf || [])[0]
    : (b.verdictEn?.keepIf || b.verdict?.keepIf || [])[0];
  if (keepA && keepB) return `${a.name}: ${keepA}. ${b.name}: ${keepB}.`;
  return deriveCardDesc(a, b, lang);
}
function getCardRisk(a: Tool, b: Tool, lang: "fr" | "en"): string {
  const avoidA = lang === "fr"
    ? (a.verdict?.avoidIf || [])[0]
    : (a.verdictEn?.avoidIf || a.verdict?.avoidIf || [])[0];
  const avoidB = lang === "fr"
    ? (b.verdict?.avoidIf || [])[0]
    : (b.verdictEn?.avoidIf || b.verdict?.avoidIf || [])[0];
  if (avoidA || avoidB) {
    return [avoidA && `${a.name}: ${avoidA}`, avoidB && `${b.name}: ${avoidB}`].filter(Boolean).join(". ");
  }
  return lang === "fr"
    ? "Risque : choisir au nombre de fonctions plutôt qu'au besoin réel."
    : "Risk: choosing by feature count instead of real need.";
}

/* ─── ToolInput — autocomplete with keyboard nav ─────────────────────────── */
interface ToolInputProps {
  inputId: string;
  label: string;
  placeholder: string;
  value: string;
  selected: Tool | null;
  suggestions: Tool[];
  onInput: (v: string) => void;
  onSelect: (tool: Tool) => void;
  onClear: () => void;
  t: (fr: string, en: string) => string;
}

function ToolInput({
  inputId, label, placeholder, value,
  selected, suggestions, onInput, onSelect, onClear, t,
}: ToolInputProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Reset highlight when suggestions list changes */
  useEffect(() => { setHighlighted(-1); }, [suggestions.length]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0 && suggestions[highlighted]) {
      e.preventDefault();
      onSelect(suggestions[highlighted]);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (selected) {
    return (
      <div className="cix-vs-selected">
        <div className="cix-vs-selected-logo">
          <ToolLogo tool={selected} size={18} />
        </div>
        <span className="cix-vs-selected-name">{selected.name}</span>
        <button
          type="button"
          onClick={onClear}
          className="cix-vs-selected-clear"
          aria-label={t("Effacer", "Clear")}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="cix-vs-input-wrap">
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        className="cix-vs-input-field"
        onChange={e => { onInput(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-haspopup="listbox"
      />
      {open && suggestions.length > 0 && (
        <div className="cix-vs-dropdown" role="listbox" aria-label={label}>
          {suggestions.map((tool, i) => (
            <button
              key={tool.id}
              type="button"
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={() => { onSelect(tool); setOpen(false); }}
              onMouseEnter={() => setHighlighted(i)}
              className={`cix-vs-option${i === highlighted ? " cix-vs-option--highlighted" : ""}`}
            >
              <div className="cix-vs-option-logo">
                <ToolLogo tool={tool} size={16} />
              </div>
              <span className="cix-vs-option-name">{tool.name}</span>
              {tool.categoryId && (
                <span className="cix-vs-option-cat">{tool.categoryId}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
const ComparesIndexPage = () => {
  const { lang, t, prefix } = useLang();
  const { tools, loading } = useTools();
  const navigate = useNavigate();

  /* VS module state */
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [selectedA, setSelectedA] = useState<Tool | null>(null);
  const [selectedB, setSelectedB] = useState<Tool | null>(null);

  /* Listing state */
  const [categoryFilter, setCategoryFilter] = useState<CompareCategoryId>("all");

  /* Autocomplete suggestions */
  const suggestionsA = useMemo(() => {
    if (!searchA.trim()) return [];
    const q = searchA.toLowerCase();
    return tools
      .filter(tool => (tool.name ?? "").toLowerCase().includes(q) && tool.id !== selectedB?.id)
      .slice(0, 7);
  }, [searchA, tools, selectedB]);

  const suggestionsB = useMemo(() => {
    if (!searchB.trim()) return [];
    const q = searchB.toLowerCase();
    return tools
      .filter(tool => (tool.name ?? "").toLowerCase().includes(q) && tool.id !== selectedA?.id)
      .slice(0, 7);
  }, [searchB, tools, selectedA]);

  /* Resolved comparison list */
  const resolvedComparisons = useMemo(() =>
    FEATURED_COMPARISONS.map(c => ({
      ...c,
      toolAData: findTool(tools, c.toolA),
      toolBData: findTool(tools, c.toolB),
    })).filter(c => c.toolAData && c.toolBData),
    [tools],
  );

  /* Determine VS module state */
  type CompareState =
    | "idle"         // nothing selected
    | "one"          // one tool selected
    | "found"        // both selected, comparison exists
    | "unavailable"; // both selected, comparison doesn't exist

  const compareState = useMemo((): CompareState => {
    if (!selectedA && !selectedB) return "idle";
    if (!selectedA || !selectedB) return "one";
    const slugA = selectedA.slug || selectedA.id;
    const slugB = selectedB.slug || selectedB.id;
    const { exists } = findExistingComparison(slugA, slugB);
    return exists ? "found" : "unavailable";
  }, [selectedA, selectedB]);

  /* Filtered listing */
  const filteredComparisons = useMemo(() => {
    let result = resolvedComparisons;

    /* Cas C — one tool selected: show only comparisons involving that tool */
    if (compareState === "one") {
      const sel = selectedA || selectedB;
      if (sel) {
        const id = sel.id;
        const slug = sel.slug || sel.id;
        result = result.filter(c =>
          c.toolA === id || c.toolA === slug ||
          c.toolB === id || c.toolB === slug,
        );
      }
    }

    /* Category filter */
    if (categoryFilter !== "all") {
      result = result.filter(c => getSlugCategory(c.slugPair) === categoryFilter);
    }

    return result;
  }, [resolvedComparisons, compareState, selectedA, selectedB, categoryFilter]);

  /* Related comparisons for "unavailable" state */
  const relatedComparisons = useMemo(() => {
    if (compareState !== "unavailable") return [];
    const ids = [selectedA?.id, selectedA?.slug, selectedB?.id, selectedB?.slug].filter(Boolean);
    return resolvedComparisons.filter(c => ids.includes(c.toolA) || ids.includes(c.toolB)).slice(0, 4);
  }, [compareState, resolvedComparisons, selectedA, selectedB]);

  function handleCompare() {
    if (compareState !== "found" || !selectedA || !selectedB) return;
    const slugA = selectedA.slug || selectedA.id;
    const slugB = selectedB.slug || selectedB.id;
    const { slugPair } = findExistingComparison(slugA, slugB);
    if (slugPair) navigate(`${prefix}/comparatif/${slugPair}`);
  }

  function clearAll() {
    setSelectedA(null); setSearchA("");
    setSelectedB(null); setSearchB("");
  }

  /* SEO */
  useEffect(() => {
    const year = new Date().getFullYear();
    const title = t(
      `Comparatifs d'outils SaaS ${year} — Analyse indépendante | ToolTrim`,
      `SaaS Tool Comparisons ${year} — Independent Analysis | ToolTrim`,
    );
    const desc = t(
      "Des comparatifs clairs pour comprendre les différences, les limites et le bon choix selon ton usage.",
      "Clear comparisons to understand differences, limitations and the right choice for your use case.",
    );
    const url = `${SEO_BASE}/${lang}/comparatifs`;
    setSeoTags({ title, description: desc, url, locale: lang === "fr" ? "fr_FR" : "en_US" });
    setHreflang(`/${lang}/comparatifs`);
    setJsonLd("compares-index-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title, description: desc, url,
      publisher: { "@type": "Organization", name: "ToolTrim", url: SEO_BASE },
      inLanguage: lang,
    });
    return () => cleanupSeo(["compares-index-jsonld"]);
  }, [lang, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #DADAD4", borderTopColor: "#222222", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const canCompare = compareState === "found";

  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="cix-hero">
        <div className="cix-hero-inner">

          <span className="cix-hero-eyebrow">{t("Comparatifs", "Comparisons")}</span>
          <h1 className="cix-hero-h1">
            {t("Comparer les outils.", "Compare the tools.")}<br />
            {t("Choisir sans empiler.", "Choose without stacking.")}
          </h1>
          <p className="cix-hero-desc">
            {t(
              "Des comparatifs clairs pour comprendre les différences, les limites et le bon choix selon ton usage.",
              "Clear comparisons to understand differences, limitations and the right choice for your use case.",
            )}
          </p>

          {/* ── VS Module ─────────────────────────────────────────────── */}
          <div className="cix-vs-module">

            <span className="cix-vs-eyebrow">
              {t("COMPARER DEUX OUTILS", "COMPARE TWO TOOLS")}
            </span>

            {/* [Outil A] VS [Outil B] [Comparer] */}
            <div className="cix-vs-row">

              <ToolInput
                inputId="vs-tool-a"
                label={t("Outil 1", "Tool 1")}
                placeholder={t("Ex. Notion", "E.g. Notion")}
                value={searchA}
                selected={selectedA}
                suggestions={suggestionsA}
                onInput={setSearchA}
                onSelect={(tool) => { setSelectedA(tool); setSearchA(""); }}
                onClear={() => { setSelectedA(null); setSearchA(""); }}
                t={t}
              />

              {/* VS badge */}
              <div className="cix-vs-badge" aria-hidden>VS</div>

              <ToolInput
                inputId="vs-tool-b"
                label={t("Outil 2", "Tool 2")}
                placeholder={t("Ex. Airtable", "E.g. Airtable")}
                value={searchB}
                selected={selectedB}
                suggestions={suggestionsB}
                onInput={setSearchB}
                onSelect={(tool) => { setSelectedB(tool); setSearchB(""); }}
                onClear={() => { setSelectedB(null); setSearchB(""); }}
                t={t}
              />

              {/* Compare button */}
              <button
                type="button"
                onClick={handleCompare}
                disabled={!canCompare}
                className="cix-vs-btn"
                aria-disabled={!canCompare}
              >
                {t("Comparer", "Compare")}
              </button>

            </div>

            {/* Cas D: nothing selected */}
            {compareState === "idle" && (
              <p className="cix-vs-hint">
                {t("Sélectionne deux outils pour voir s'il existe un comparatif.", "Select two tools to find an existing comparison.")}
              </p>
            )}

            {/* Cas C: one tool selected */}
            {compareState === "one" && (
              <p className="cix-vs-hint">
                {t(
                  `${filteredComparisons.length} comparatif${filteredComparisons.length !== 1 ? "s" : ""} trouvé${filteredComparisons.length !== 1 ? "s" : ""} — ajoute un deuxième outil pour comparer directement.`,
                  `${filteredComparisons.length} comparison${filteredComparisons.length !== 1 ? "s" : ""} found — add a second tool to compare directly.`,
                )}
              </p>
            )}

            {/* Cas A: both selected, comparison exists */}
            {compareState === "found" && selectedA && selectedB && (
              <p className="cix-vs-hint cix-vs-hint--success">
                {t(
                  `Le comparatif ${selectedA.name} vs ${selectedB.name} est disponible.`,
                  `The ${selectedA.name} vs ${selectedB.name} comparison is available.`,
                )}
              </p>
            )}

            {/* Popular suggestions */}
            <div className="cix-vs-popular">
              <span className="cix-vs-popular-label">{t("POPULAIRES", "POPULAR")}</span>
              {POPULAR_SUGGESTIONS.map(s => (
                <Link
                  key={s.slugPair}
                  to={`${prefix}/comparatif/${s.slugPair}`}
                  className="cix-suggestion-chip"
                >
                  {s.label}
                </Link>
              ))}
            </div>

          </div>
          {/* /VS Module */}

        </div>
      </section>

      {/* ── Cas B: unavailable ────────────────────────────────────────────── */}
      {compareState === "unavailable" && selectedA && selectedB && (
        <section className="cix-section">
          <div className="cix-container">
            <div className="cix-unavailable">
              <p className="cix-unavailable-title">
                {t("Ce comparatif n'est pas encore disponible.", "This comparison isn't available yet.")}
              </p>
              <p className="cix-unavailable-desc">
                {t(
                  "Tu peux explorer les outils séparément ou consulter les comparatifs proches.",
                  "You can explore the tools separately or browse related comparisons.",
                )}
              </p>
              <div className="cix-unavailable-actions">
                <button
                  type="button"
                  onClick={clearAll}
                  className="cix-unavailable-btn-secondary"
                >
                  {t("Voir tous les comparatifs", "See all comparisons")}
                </button>
                <Link to={`${prefix}/outil/${selectedA.slug || selectedA.id}`} className="cix-unavailable-btn-tool">
                  {t(`Explorer ${selectedA.name}`, `Explore ${selectedA.name}`)}
                </Link>
                <Link to={`${prefix}/outil/${selectedB.slug || selectedB.id}`} className="cix-unavailable-btn-tool">
                  {t(`Explorer ${selectedB.name}`, `Explore ${selectedB.name}`)}
                </Link>
              </div>
              {relatedComparisons.length > 0 && (
                <div className="cix-unavailable-related">
                  <p className="cix-unavailable-related-label">
                    {t("Comparatifs proches", "Related comparisons")}
                  </p>
                  <div className="cix-unavailable-related-list">
                    {relatedComparisons.map(c => (
                      <Link
                        key={c.slugPair}
                        to={`${prefix}/comparatif/${c.slugPair}`}
                        className="cix-suggestion-chip"
                      >
                        {c.toolAData!.name} vs {c.toolBData!.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Listing section ───────────────────────────────────────────────── */}
      <section className="cix-section">
        <div className="cix-container">

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              display: "flex", alignItems: "baseline",
              justifyContent: "space-between", gap: 16,
              flexWrap: "wrap", marginBottom: 20,
            }}>
              <p style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                fontWeight: 600, letterSpacing: "-0.04em",
                color: "#222222", lineHeight: 1.05,
              }}>
                {compareState === "one"
                  ? t(
                      `Comparatifs liés à ${(selectedA || selectedB)!.name}.`,
                      `Comparisons for ${(selectedA || selectedB)!.name}.`,
                    )
                  : t("Comparatifs éditoriaux.", "Editorial comparisons.")}
              </p>
              <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "#9A9A92" }}>
                {filteredComparisons.length}&nbsp;{t("comparatifs", "comparisons")}
              </span>
            </div>

            {/* Category filters — only when not filtering by tool */}
            {compareState !== "one" && (
              <div className="cix-filter-row">
                {COMPARE_CATEGORY_FILTERS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCategoryFilter(f.id)}
                    className={`gi-filter-pill${categoryFilter === f.id ? " gi-filter-pill--active" : ""}`}
                  >
                    {lang === "fr" ? f.label : f.labelEn}
                  </button>
                ))}
              </div>
            )}

            {/* Reset tool filter (Cas C) */}
            {compareState === "one" && (
              <button
                type="button"
                onClick={clearAll}
                style={{
                  display: "inline-flex", alignItems: "center",
                  height: 34, padding: "0 14px",
                  border: "1px solid #DADAD4", borderRadius: 6,
                  background: "transparent",
                  fontFamily: "var(--font-ui)", fontSize: 13,
                  color: "#6F6F68", cursor: "pointer",
                }}
              >
                {t("← Voir tous les comparatifs", "← See all comparisons")}
              </button>
            )}
          </div>

          {/* Grid */}
          {filteredComparisons.length > 0 ? (
            <div className="cix-grid">
              {filteredComparisons.map(c => {
                const a = c.toolAData!;
                const b = c.toolBData!;
                const desc = deriveCardDesc(a, b, lang);
                const question = getCardDecisionQuestion(a, b, lang);
                const bestFor = getCardBestFor(a, b, lang);
                const risk = getCardRisk(a, b, lang);
                const catId = getSlugCategory(c.slugPair);
                const catLabel = COMPARE_CATEGORY_FILTERS.find(f => f.id === catId);
                return (
                  <Link
                    key={c.slugPair}
                    to={`${prefix}/comparatif/${c.slugPair}`}
                    className="cix-card"
                  >
                    <p className="cix-card-label">
                      {t("COMPARATIF", "COMPARISON")}
                      {catLabel && catLabel.id !== "all" && (
                        <>
                          <span style={{ margin: "0 6px", color: "#DADAD4" }}>·</span>
                          {lang === "fr" ? catLabel.label : catLabel.labelEn}
                        </>
                      )}
                    </p>
                    <div className="cix-card-vs">
                      <div className="cix-card-vs-tool">
                        <div className="cix-card-vs-logo"><ToolLogo tool={a} size={18} /></div>
                        <span className="cix-card-vs-name">{a.name}</span>
                      </div>
                      <span className="cix-card-vs-sep">VS</span>
                      <div className="cix-card-vs-tool">
                        <div className="cix-card-vs-logo"><ToolLogo tool={b} size={18} /></div>
                        <span className="cix-card-vs-name">{b.name}</span>
                      </div>
                    </div>
                    <p className="cix-card-title">{a.name} vs {b.name}</p>
                    <p className="cix-card-question">{question}</p>
                    <p className="cix-card-desc">{desc}</p>
                    <div className="cix-card-signal">
                      <span>{t("Meilleur pour", "Best for")}</span>
                      <p>{bestFor}</p>
                    </div>
                    <div className="cix-card-signal cix-card-signal--risk">
                      <span>{t("Risque", "Risk")}</span>
                      <p>{risk}</p>
                    </div>
                    <p className="cix-card-pricing">
                      {getPriceLabel(a, t)}
                      <span style={{ margin: "0 6px", color: "#DADAD4" }}>vs</span>
                      {getPriceLabel(b, t)}
                    </p>
                    <span className="cix-card-cta">
                      {t("Lire le comparatif", "Read comparison")}
                      <span className="cix-card-cta-arrow" aria-hidden> →</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "48px 0", borderTop: "1px solid #DADAD4" }}>
              <p style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(1.125rem, 2vw, 1.375rem)",
                fontWeight: 600, letterSpacing: "-0.04em",
                color: "#222222", marginBottom: 8,
              }}>
                {t("Aucun comparatif trouvé.", "No comparison found.")}
              </p>
              <p style={{
                fontFamily: "var(--font-ui)",
                fontSize: 14, color: "#6F6F68", marginBottom: 20,
              }}>
                {t(
                  "Essaie un autre filtre ou explore tous les comparatifs.",
                  "Try another filter or explore all comparisons.",
                )}
              </p>
              <button
                type="button"
                onClick={() => { clearAll(); setCategoryFilter("all"); }}
                style={{
                  display: "inline-flex", alignItems: "center",
                  height: 38, padding: "0 18px",
                  border: "1px solid #222222", borderRadius: 6,
                  fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 500,
                  color: "#222222", background: "transparent", cursor: "pointer",
                }}
              >
                {t("Voir tous les comparatifs", "See all comparisons")}
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default ComparesIndexPage;
