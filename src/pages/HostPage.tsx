import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useLang } from "@/hooks/useLang";
import { useToolSummaries } from "@/hooks/useSupabaseData";
import { ToolCardEditorial } from "@/components/ToolCardEditorial";
import Breadcrumb from "@/components/Breadcrumb";
import { setSeoTags, setHreflang, cleanupSeo, SEO_BASE } from "@/lib/seo";

/**
 * Page hôte : liste ce qui se rattache à un outil du catalogue.
 *
 * Une seule mécanique pour trois familles de route, le préfixe est dérivé de
 * form_factor : /plugins/<hôte>, /libraries/<hôte>, /mcp/<hôte>.
 *
 * Règle d'existence (voir scripts/repass/SPEC.md) : la page n'existe que si
 * elle a de quoi la remplir. En dessous du seuil, on renvoie vers la fiche de
 * l'hôte plutôt que d'indexer une page vide — la référence du secteur affiche
 * « 0 tools » sur ses pages sans contenu, c'est exactement ce qu'on évite.
 */

export const HOST_PAGE_MIN = 3;

type Famille = "plugin" | "library" | "mcp";

const FAMILLES: Record<string, { forme: Famille; titreFr: string; titreEn: string; introFr: string; introEn: string }> = {
  plugins: {
    forme: "plugin",
    titreFr: "Plugins pour",
    titreEn: "Plugins for",
    introFr: "Les extensions qui s'exécutent dans",
    introEn: "Extensions that run inside",
  },
  libraries: {
    forme: "library",
    titreFr: "Bibliothèques pour",
    titreEn: "Libraries for",
    introFr: "Les bibliothèques que l'on importe dans un projet",
    introEn: "Libraries you import into a",
  },
  mcp: {
    forme: "mcp",
    titreFr: "Serveurs MCP pour",
    titreEn: "MCP servers for",
    introFr: "Les serveurs MCP qui exposent",
    introEn: "MCP servers exposing",
  },
};

const HostPage = ({ famille: familleProp }: { famille: string }) => {
  const { lang, t, prefix } = useLang();
  const { slug } = useParams();
  const { tools, loading } = useToolSummaries();
  const famille = FAMILLES[familleProp];

  const hote = useMemo(() => tools.find((x) => x.slug === slug), [tools, slug]);

  const rattaches = useMemo(() => {
    if (!slug || !famille) return [];
    return tools
      .filter((x) => x.formFactor === famille.forme && (x.worksWith || []).includes(slug))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tools, slug, famille]);

  // Compatibles toutes formes confondues, hors la famille listée ci-dessus :
  // un outil autonome qui sait se brancher dans l'hôte a sa place ici, mais
  // pas dans la liste principale (cf. Luminar Neo, app compatible Photoshop).
  const compatibles = useMemo(() => {
    if (!slug || !famille) return [];
    return tools
      .filter((x) => x.formFactor !== famille.forme && (x.worksWith || []).includes(slug))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tools, slug, famille]);

  const titre = hote
    ? `${lang === "fr" ? famille?.titreFr : famille?.titreEn} ${hote.name}`
    : "";

  useEffect(() => {
    if (!hote || rattaches.length < HOST_PAGE_MIN) return;
    const url = `${SEO_BASE}${prefix}/${familleProp}/${slug}`;
    setSeoTags({
      title: `${titre} — ${rattaches.length} ${lang === "fr" ? "outils" : "tools"} | ToolTrim`,
      description: lang === "fr"
        ? `${rattaches.length} outils qui se rattachent à ${hote.name}, avec le verdict ToolTrim sur chacun.`
        : `${rattaches.length} tools that attach to ${hote.name}, each with the ToolTrim verdict.`,
      url,
    });
    setHreflang(`/${familleProp}/${slug}`);
    return () => cleanupSeo([]);
  }, [hote, rattaches.length, titre, prefix, slug, familleProp, lang]);

  if (!famille) return <Navigate to={`${prefix}/tools`} replace />;

  // Ne rien conclure avant que les données PORTANT LE MODÈLE soient arrivées.
  //
  // useToolSummaries sert d'abord le bundle statique, qui ne connaît ni
  // worksWith ni formFactor : le filtre y trouvait zéro résultat et la
  // redirection de repli partait avant même la requête Supabase. Tester
  // tools.length ne suffit pas — le tableau est plein, mais d'objets dépourvus
  // des champs qui nous intéressent.
  const modeleCharge = tools.some((x) => x.formFactor);
  if (loading || !modeleCharge) return null;

  // Hôte inconnu, ou pas assez de contenu pour justifier une page dédiée.
  // On renvoie vers la fiche de l'hôte quand elle existe : le contenu reste
  // atteignable, on n'ouvre simplement pas une page mince.
  if (!hote) return <Navigate to={`${prefix}/tools`} replace />;
  if (rattaches.length < HOST_PAGE_MIN) return <Navigate to={`${prefix}/tool/${slug}`} replace />;

  return (
    <div className="td-page">
      <div className="td-container">
        <Breadcrumb
          items={[
            { label: t("Outils", "Tools"), href: `${prefix}/tools` },
            { label: hote.name, href: `${prefix}/tool/${slug}` },
            { label: t("Plugins", "Plugins") },
          ]}
        />

        <header className="gi-head">
          <h1 className="gi-title">{titre}</h1>
          <p className="gi-sub">
            {lang === "fr" ? famille.introFr : famille.introEn} {hote.name}.{" "}
            {t(
              `${rattaches.length} outils référencés, chacun avec son verdict.`,
              `${rattaches.length} tools listed, each with its verdict.`
            )}
          </p>
          <Link to={`${prefix}/tool/${slug}`} className="gi-link">
            {t(`Voir la fiche ${hote.name}`, `See the ${hote.name} page`)}
          </Link>
        </header>

        <div className="tc-grid">
          {rattaches.map((tool) => (
            <ToolCardEditorial key={tool.id} tool={tool as any} prefix={prefix} t={t} lang={lang} />
          ))}
        </div>

        {compatibles.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <h2 className="gi-title" style={{ fontSize: 22 }}>
              {t(`Fonctionne aussi avec ${hote.name}`, `Also works with ${hote.name}`)}
            </h2>
            <p className="gi-sub">
              {t(
                "Des outils autonomes qui savent s'y brancher, sans en dépendre.",
                "Standalone tools that can plug into it without depending on it."
              )}
            </p>
            <div className="tc-grid">
              {compatibles.map((tool) => (
                <ToolCardEditorial key={tool.id} tool={tool as any} prefix={prefix} t={t} lang={lang} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default HostPage;
