import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import MediaCard, { MediaCards } from "./MediaCard";
import { SectionHead, Section } from "../Toolbar/Toolbar";
import Logo from "../Logo/Logo";

/**
 * Planche des cartes (12/11/2026) : la carte du système dans chaque état qu'elle rencontre sur le site,
 * pour arbitrer une fois avant de remplacer les anciennes cartes page par page.
 * Pages concernées : Catégorie et Outils (déjà sur cette carte), Ma stack « À découvrir », puis
 * Hébergeurs, Comparatifs, Accueil (anciennes cartes ToolCardEditorial).
 */
const meta: Meta = { title: "Catalogue/Cartes : toutes les vues", tags: ["a-valider"], parameters: { layout: "fullscreen" }, decorators: [(Story) => <div style={{ padding: 16, maxWidth: 1180 }}><Story /></div>] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";

// The three pictures a card meets: a wide screenshot, a tall one, no screenshot (the logo on its tile), and still loading.
const shot = (file: string, alt: string) => <img src={`/og-screenshots/${file}`} alt={alt} width={1000} height={525} />;
const logo = (slug: string, name: string) => <span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%" }}><Logo tool={{ name, slug }} size={40} localOnly /></span>;
const loading = <span aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", background: "var(--tt-skeleton)" }} />;

type Card = { name: string; slug: string; image: ReactNode; category?: [string, string]; reason?: [string, string]; add?: "idle" | "pending" | "added" };
const card = (lang: Lang, c: Card) => <MediaCard key={c.slug + c.name} lang={lang} tool={{ name: c.name, slug: c.slug }} image={c.image}
  category={c.category && (lang === "fr" ? c.category[0] : c.category[1])} reason={c.reason && (lang === "fr" ? c.reason[0] : c.reason[1])}
  renderLink={(className, content) => <a className={className} href={`#${c.slug}`}>{content}</a>}
  add={c.add ? { state: c.add, onAdd: () => {} } : undefined} localLogosOnly />;

const PICTURES: Card[] = [
  { name: "Aloware", slug: "aloware", image: shot("aloware.jpg", "Aloware"), reason: ["Capture large, le cas courant.", "Wide screenshot, the usual case."] },
  { name: "Zed", slug: "zed", image: <img src="/og-screenshots/zed.webp" alt="Zed" width={1920} height={1357} />, reason: ["Capture haute : recadrée, jamais de bande.", "Tall screenshot: cropped, never a band."] },
  { name: "Notion", slug: "notion", image: logo("notion", "Notion"), reason: ["Sans capture : le logo sur sa tuile.", "No screenshot: the logo on its tile."] },
  { name: "Airtable", slug: "airtable", image: loading, reason: ["En chargement.", "Loading."] },
];
const TEXTS: Card[] = [
  { name: "Figma", slug: "figma", image: shot("adobe-xd.jpg", "Figma"), category: ["Design", "Design"], reason: ["Catégorie et raison courte.", "Category and a short reason."] },
  { name: "Adobe Creative Cloud Express pour les équipes", slug: "affinity-photo", image: shot("affinity-photo.jpg", "Adobe"), category: ["Création graphique et retouche", "Graphic design and retouching"], reason: ["Nom et catégorie longs : tout passe à la ligne proprement, rien ne se coupe au milieu d’un mot.", "Long name and category: everything wraps cleanly, nothing breaks mid-word."] },
  { name: "8fig", slug: "8fig", image: shot("8fig.jpg", "8fig") },
];
const ADD: Card[] = [
  { name: "Loom", slug: "loom", image: logo("loom", "Loom"), category: ["Vidéo", "Video"], reason: ["Pas encore dans ma stack.", "Not in my stack yet."], add: "idle" },
  { name: "Make", slug: "make", image: logo("make", "Make"), category: ["Automatisation", "Automation"], reason: ["Ajout en cours.", "Being added."], add: "pending" },
  { name: "Airtable", slug: "airtable", image: logo("airtable", "Airtable"), category: ["Bases de données", "Databases"], reason: ["Déjà dans ma stack.", "Already in my stack."], add: "added" },
];

const block = (lang: Lang, id: string, title: [string, string], note: [string, string], cards: Card[]) => <Section labelledBy={id}>
  <SectionHead title={lang === "fr" ? title[0] : title[1]} titleId={id} note={lang === "fr" ? note[0] : note[1]} />
  <MediaCards label={lang === "fr" ? title[0] : title[1]}>{cards.map((c) => card(lang, c))}</MediaCards>
</Section>;

export const ToutesLesVues: Story = {
  name: "Toutes les vues",
  render: (_args, { globals: { lang } }) => <div style={{ display: "grid", gap: 48 }}>
    {block(lang, "c-img", ["L’image", "The picture"], ["Capture large, capture haute, logo seul, chargement : le cadre est toujours plein.", "Wide, tall, logo only, loading: the frame is always full."], PICTURES)}
    {block(lang, "c-txt", ["Les textes", "The text"], ["Catégorie et raison, textes longs, nom seul.", "Category and reason, long text, name only."], TEXTS)}
    {block(lang, "c-add", ["L’ajout à ma stack", "Adding to my stack"], ["Le bouton sur l’image : à ajouter, en cours, ajouté.", "The button on the picture: to add, adding, added."], ADD)}
  </div>,
};

export const Telephone: Story = { name: "Téléphone (390)", globals: { viewport: { value: "phone" } }, render: ToutesLesVues.render };
export const Tablette: Story = { name: "Tablette (768)", globals: { viewport: { value: "tablet" } }, render: ToutesLesVues.render };
export const Sombre: Story = { name: "Mode sombre", globals: { theme: "dark" }, render: ToutesLesVues.render };
export const Anglais: Story = { name: "Anglais", globals: { lang: "en" }, render: ToutesLesVues.render };
