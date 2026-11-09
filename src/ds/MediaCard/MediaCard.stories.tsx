import type { Meta, StoryObj } from "@storybook/react-vite";
import MediaCard, { MediaCards } from "./MediaCard";
import { SectionHead, Section } from "../Toolbar/Toolbar";
import Button, { linkClass } from "../Button/Button";
import Logo from "../Logo/Logo";

const meta: Meta = { title: "Ma stack/À découvrir", tags: ["a-valider"], parameters: { layout: "fullscreen" }, decorators: [(Story) => <div style={{ padding: 16, maxWidth: 1180 }}><Story /></div>] };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);

// The page passes its screenshot component; here, the tool's logo on a tile stands in for it.
const picture = (slug: string, name: string) => <span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%" }}><Logo tool={{ name, slug }} size={40} localOnly /></span>;
const IDEAS = [
  { name: "Airtable", slug: "airtable", category: ["Bases de données", "Databases"], reason: ["Pour structurer ce que Notion range en pages.", "To structure what Notion keeps as pages."], state: "idle" as const },
  { name: "Loom", slug: "loom", category: ["Vidéo", "Video"], reason: ["Montrer plutôt qu’écrire : une vidéo vaut parfois trois réunions de suivi, et c’est plus rapide à regarder.", "Show instead of write: one video is sometimes worth three follow-up meetings, and quicker to watch."], state: "added" as const },
  { name: "Make", slug: "make", category: ["Automatisation", "Automation"], reason: ["Pour relier vos outils sans code.", "To connect your tools without code."], state: "pending" as const },
];

export const Discover: Story = {
  render: (_args, { globals: { lang } }) => <Section labelledBy="recos">
    <SectionHead title={t(lang, "À découvrir", "Discover something new")} titleId="recos" note={t(lang, "D’autres approches autour de vos outils. La prochaine bonne pioche est peut-être ici.", "Fresh approaches around your tools. Your next good find could be here.")}
      action={<a className={linkClass()} href="#explorer">{t(lang, "Explorer les pistes", "Explore more ideas")}</a>} />
    <MediaCards label={t(lang, "Idées à découvrir", "Ideas to discover")}>
      {IDEAS.map((idea) => <MediaCard key={idea.slug} lang={lang} tool={{ name: idea.name, slug: idea.slug }} image={picture(idea.slug, idea.name)}
        category={lang === "fr" ? idea.category[0] : idea.category[1]} reason={lang === "fr" ? idea.reason[0] : idea.reason[1]}
        renderLink={(className, content) => <a className={className} href={`#${idea.slug}`} aria-label={t(lang, `Voir la fiche de ${idea.name}`, `View ${idea.name}`)}>{content}</a>}
        add={{ state: idea.state, onAdd: () => {} }} localLogosOnly />)}
    </MediaCards>
    <div style={{ display: "flex", justifyContent: "center" }}><Button>{t(lang, "D’autres pistes", "More ideas")}</Button></div>
  </Section>,
};
