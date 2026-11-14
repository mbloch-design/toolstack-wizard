import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import MediaCard, { MediaCards } from "./MediaCard";
import { SectionHead, Section } from "../Toolbar/Toolbar";
import Logo from "../Logo/Logo";

/**
 * Planche des cartes (12/11/2026). Deux parties :
 * 1. Le système : la carte dans toutes ses vues (avec image, logo seul ; grande, petite ; textes ; ajout).
 * 2. Le site aujourd'hui : chaque carte réellement servie, capturée page par page en bureau et téléphone,
 *    pour décider laquelle devient quelle vue du système.
 */
const meta: Meta = { title: "Catalogue/Cartes : toutes les vues", tags: ["a-valider"], parameters: { layout: "fullscreen" }, decorators: [(Story) => <div style={{ padding: 16, maxWidth: 1180 }}><Story /></div>] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
type Pair = [string, string];
const pick = (lang: Lang, pair: Pair) => (lang === "fr" ? pair[0] : pair[1]);

const shot = (file: string, alt: string, w = 1000, h = 525) => <img src={`/og-screenshots/${file}`} alt={alt} width={w} height={h} />;
const loading = <span aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", background: "var(--tt-skeleton)" }} />;

type Card = { name: string; slug: string; image?: ReactNode; category?: Pair; price?: Pair; badge?: Pair; reason?: Pair; add?: "idle" | "pending" | "added" };
const card = (lang: Lang, c: Card, size: "l" | "s" = "l") => <MediaCard key={c.slug + c.name} lang={lang} size={size} tool={{ name: c.name, slug: c.slug }} image={c.image}
  category={c.category && pick(lang, c.category)}
  price={c.price && { label: pick(lang, c.price), free: c.price === FREE }} badge={c.badge && pick(lang, c.badge)}
  reason={c.reason && pick(lang, c.reason)}
  renderLink={(className, content) => <a className={className} href={`#${c.slug}`}>{content}</a>}
  add={c.add ? { state: c.add, onAdd: () => {} } : undefined} localLogosOnly />;

const FREE: Pair = ["Gratuit", "Free"];
const PRICE: Pair = ["Dès 10 €/mois", "From $10/mo"];
const SPONSORED: Pair = ["Sponsorisé", "Sponsored"];

const WITH_IMAGE: Card[] = [
  { name: "Aloware", slug: "aloware", image: shot("aloware.jpg", "Aloware"), category: ["Téléphonie", "Phone"], price: PRICE, reason: ["Capture large, le cas courant.", "Wide screenshot, the usual case."] },
  { name: "Zed", slug: "zed", image: shot("zed.webp", "Zed", 1920, 1357), category: ["Éditeur de code", "Code editor"], price: FREE, reason: ["Capture haute : recadrée, jamais de bande.", "Tall screenshot: cropped, never a band."] },
  { name: "Notion", slug: "notion", category: ["Notes", "Notes"], reason: ["Pas de capture : le logo flouté devient le fond.", "No screenshot: the blurred logo becomes the backdrop."] },
  { name: "Airtable", slug: "airtable", image: loading, category: ["Bases de données", "Databases"], reason: ["En chargement.", "Loading."] },
];
const LOGO_ONLY: Card[] = [
  { name: "Notion", slug: "notion", category: ["Notes", "Notes"], price: FREE, reason: ["Sans image : le logo, agrandi et flouté, colore la carte.", "No picture: the logo, enlarged and blurred, colours the card."] },
  { name: "Figma", slug: "figma", category: ["Design", "Design"], price: PRICE },
  { name: "Loom", slug: "loom", reason: ["Nom et raison, sans étiquette.", "Name and reason, no tag."] },
  { name: "Make", slug: "make" },
];
const TEXTS: Card[] = [
  { name: "8fig", slug: "8fig", image: shot("8fig.jpg", "8fig") },
  { name: "Figma", slug: "figma", image: shot("adobe-xd.jpg", "Figma"), category: ["Design", "Design"] },
  { name: "Aloware", slug: "aloware", image: shot("aloware.jpg", "Aloware"), category: ["Téléphonie", "Phone"], price: PRICE, badge: SPONSORED },
  { name: "Adobe Creative Cloud Express pour les équipes", slug: "affinity-photo", image: shot("affinity-photo.jpg", "Adobe"), category: ["Création graphique et retouche", "Graphic design and retouching"], price: FREE,
    reason: ["Le cas complet : un nom long, une catégorie longue coupée proprement, le prix toujours visible, et cette raison qui s’arrête à deux lignes.", "The full case: a long name, a long category cut cleanly, the price always visible, and this reason stopping at two lines."] },
];
const ADD: Card[] = [
  { name: "Loom", slug: "loom", category: ["Vidéo", "Video"], reason: ["Pas encore dans ma stack.", "Not in my stack yet."], add: "idle" },
  { name: "Make", slug: "make", category: ["Automatisation", "Automation"], reason: ["Ajout en cours.", "Being added."], add: "pending" },
  { name: "Airtable", slug: "airtable", category: ["Bases de données", "Databases"], reason: ["Déjà dans ma stack.", "Already in my stack."], add: "added" },
];

const block = (lang: Lang, id: string, title: Pair, note: Pair, cards: Card[], size: "l" | "s" = "l") => <Section labelledBy={id}>
  <SectionHead title={pick(lang, title)} titleId={id} note={pick(lang, note)} />
  <MediaCards label={pick(lang, title)} size={size}>{cards.map((c) => card(lang, c, size))}</MediaCards>
</Section>;

const system = (lang: Lang) => <div style={{ display: "grid", gap: 48 }}>
  {block(lang, "c-l", ["Grande, avec image", "Large, with a picture"], ["Catalogue : Catégorie, Outils. Capture large, haute, logo seul, chargement : le cadre est toujours plein.", "Catalogue: Category, Tools. Wide, tall, logo only, loading: the frame is always full."], WITH_IMAGE)}
  {block(lang, "c-s", ["Petite, avec image", "Small, with a picture"], ["Rails et colonnes : Accueil, Explorer, À découvrir. La raison tient une ligne.", "Rails and columns: Home, Explorer, Discover. The reason holds one line."], WITH_IMAGE, "s")}
  {block(lang, "c-bare", ["Grande, logo seul", "Large, logo only"], ["Sans image : Recherche, Comparatifs, alternatives d’une fiche.", "No picture: Search, Comparisons, a tool's alternatives."], LOGO_ONLY)}
  {block(lang, "c-bare-s", ["Petite, logo seul", "Small, logo only"], ["La plus dense : listes de suggestions.", "The densest: suggestion lists."], LOGO_ONLY, "s")}
  {block(lang, "c-txt", ["Les textes", "The text"], ["L’image est la carte. En haut, les étiquettes en verre : catégorie, prix, sponsorisé. En bas, sur le flou : logo, le nom en grand, la raison.", "The picture is the card. At the top, glass tags: category, price, sponsored. At the foot, on the blur: logo, the name large, the reason."], TEXTS)}
  {block(lang, "c-add", ["L’ajout à ma stack", "Adding to my stack"], ["Le bouton sur l’image : à ajouter, en cours, ajouté.", "The button on the picture: to add, adding, added."], ADD)}
</div>;

export const ToutesLesVues: Story = { name: "Le système", render: (_args, { globals: { lang } }) => system(lang) };
export const Telephone: Story = { name: "Le système, téléphone (390)", globals: { viewport: { value: "phone" } }, render: ToutesLesVues.render };
export const Sombre: Story = { name: "Le système, sombre", globals: { theme: "dark" }, render: ToutesLesVues.render };
export const Anglais: Story = { name: "Le système, anglais", globals: { lang: "en" }, render: ToutesLesVues.render };

// The site today: every card it serves, captured on 12/11/2026 at 1280 and 390 (2x).
const captures = import.meta.glob("./inventory/*.webp", { eager: true, import: "default" }) as Record<string, string>;
const src = (name: string, device: "bureau" | "tel") => captures[`./inventory/${name}-${device}.webp`];
const INVENTORY: Array<{ page: string; views: Array<[string, string]> }> = [
  { page: "Accueil", views: [["accueil-une", "Carte à la une"], ["accueil-jour", "Carte du jour"], ["accueil-comparatif", "Comparatif"], ["accueil-suggestion", "Suggestion"]] },
  { page: "Outils", views: [["outils-media", "Carte du système (les plus recherchés)"], ["outils-editorial", "Ancienne carte éditoriale (la grille)"]] },
  { page: "Catégorie", views: [["categorie-media", "Carte du système"], ["categorie-guide", "Carte de guide"]] },
  { page: "Explorer", views: [["explorer", "Carte d’exploration"]] },
  { page: "Stacks", views: [["stacks-ligne", "Ligne de stack"]] },
  { page: "Comparatifs", views: [["comparatifs-ligne", "Ligne de comparatif"], ["comparatif-vs", "Duel (page comparatif)"], ["comparatif-bascule", "Bascule (page comparatif)"]] },
  { page: "Guides", views: [["guides-une", "Guide à la une"], ["guides-carte", "Carte de guide"], ["guides-compacte", "Carte compacte"], ["guides-story", "Story"]] },
  { page: "Recherche", views: [["recherche-outil", "Résultat outil"], ["recherche-guide", "Résultat guide"]] },
];

export const SiteAujourdhui: Story = {
  name: "Le site aujourd’hui",
  render: () => <div style={{ display: "grid", gap: 48 }}>
    {INVENTORY.map(({ page, views }) => <Section key={page} labelledBy={`inv-${page}`}>
      <SectionHead title={page} titleId={`inv-${page}`} note={`${views.length} vue${views.length > 1 ? "s" : ""}`} />
      <div style={{ display: "grid", gap: 32 }}>
        {views.map(([name, label]) => <figure key={name} style={{ margin: 0, display: "grid", gap: 12 }}>
          <figcaption style={{ font: "var(--tt-label-font)", letterSpacing: "var(--tt-label-tracking)" }}>{label}</figcaption>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "start" }}>
            {(["bureau", "tel"] as const).map((device) => src(name, device) && <div key={device} style={{ display: "grid", gap: 6, maxWidth: device === "bureau" ? 560 : 300, flex: "1 1 240px" }}>
              <img src={src(name, device)} alt={`${label}, ${device === "bureau" ? "bureau" : "téléphone"}`} style={{ width: "100%", height: "auto", borderRadius: 12, boxShadow: "var(--tt-raised)" }} />
              <span style={{ font: "var(--tt-note-font)", letterSpacing: "var(--tt-note-tracking)", color: "var(--tt-ink)" }}>{device === "bureau" ? "Bureau 1280" : "Téléphone 390"}</span>
            </div>)}
          </div>
        </figure>)}
      </div>
    </Section>)}
  </div>,
};
