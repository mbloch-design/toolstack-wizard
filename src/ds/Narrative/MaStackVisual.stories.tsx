import type { Meta, StoryObj } from "@storybook/react-vite";
import { formatAmount } from "@/lib/currencyRates";
import Page from "../Page/Page";
import Logo from "../Logo/Logo";
import Button from "../Button/Button";
import { Plus } from "@/lib/icons";
import Bento, { BentoRow, MiniRing, Tile } from "../Bento/Bento";
import { Meet } from "../Gesture/Gesture";
import Amount from "../Amount/Amount";
import Split from "../Split/Split";
import { Section, SectionHead } from "../Toolbar/Toolbar";
import { Key, StoryHero } from "./Narrative";

/*
 * M01, the dashboard made visual (14/11/2026, Michael: « plus visuel, des infographies, n'oublie pas l'humour »).
 * Each figure becomes a tile with its own picture (a ring, two logos bumping into each other, an empty till),
 * and each says its finding with a smile, never at the person's expense. Design system only.
 */
const meta: Meta = { title: "Ma stack/Tableau de bord visuel", tags: ["a-valider", "!visual"], parameters: { layout: "fullscreen" } };
export default meta;
type Story = StoryObj;
type Lang = "fr" | "en";
const t = (lang: Lang, fr: string, en: string) => (lang === "fr" ? fr : en);
const money = (lang: Lang, n: number) => formatAmount(n, "EUR", lang);
const tool = (name: string, slug: string) => ({ id: slug, name, slug });
const logos = (...list: [string, string][]) => <span style={{ display: "flex", gap: 4 }}>{list.map(([name, slug]) => <Logo key={slug} tool={tool(name, slug)} size={32} localOnly />)}</span>;

/** The five everyday jobs of a freelancer: the ring shows which ones the stack covers. */
const TRADES = ["create", "organise", "talk", "invoice", "sell"] as const;
const coverage = (covered: readonly string[]) => TRADES.map((id, index) => ({ color: covered.includes(id) ? `var(--tt-area-${index + 1})` : "var(--tt-line)", share: 1 / TRADES.length }));

/** The first visit: three tools, no price yet. Four tiles, each one a finding and the action that settles it
 *  (14/11/2026, Michael: « pourquoi pas de CTA ? »). No separate « worth a look » list: the tiles carry it. */
function Starting({ lang }: { lang: Lang }) {
  return (
    <Page rhythm="chapters">
      <Page group>
        <StoryHero eyebrow={t(lang, "Ma stack", "My stack")}
          title={lang === "fr" ? <>3 outils, et déjà <Key tone="overlap">un doublon</Key>.</> : <>3 tools, and already <Key tone="overlap">an overlap</Key>.</>}
          lead={t(lang, "Pas mal pour un début.", "Not bad for a start.")} />
        <Bento compact label={t(lang, "Ma stack en bref", "My stack at a glance")}>
          <BentoRow>
            <Tile span={7} label={t(lang, "Ma stack", "My stack")} art={<MiniRing parts={coverage(["create"])} />}
              statement={lang === "fr" ? <>3 outils, <Key>1 métier</Key> sur 5</> : <>3 tools, <Key>1 trade</Key> of 5</>}
              status={{ text: t(lang, "Vous créez très bien. Le reste du métier attend son tour.", "You create very well. The rest of the job is waiting its turn.") }}
              footer={<span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                {logos(["Figma", "figma"], ["Milanote", "milanote"], ["Notion", "notion"])}
                <Button variant="primary" icon={<Plus aria-hidden />}>{t(lang, "Ajouter un outil", "Add a tool")}</Button></span>} />
            <Tile span={5} label={t(lang, "Doublon possible", "Possible overlap")} tone="question"
              art={<Meet play={false} kept="left" badge={t(lang, "Doublon", "Overlap")} left={<Logo tool={tool("Figma", "figma")} size={32} localOnly />} right={<Logo tool={tool("Milanote", "milanote")} size={32} localOnly />} />}
              statement={t(lang, "Figma ou Milanote ?", "Figma or Milanote?")}
              status={{ text: t(lang, "Les deux rangent vos idées visuelles. Un des deux fait peut-être du zèle.", "Both hold your visual ideas. One of them may be overdoing it.") }}
              footer={<Button variant="secondary" arrow>{t(lang, "Départager", "Settle it")}</Button>} />
          </BentoRow>
          <BentoRow>
            <Tile span={5} label={t(lang, "Budget", "Budget")} art={<MiniRing parts={[{ color: "var(--tt-line)", share: 1 }]} />}
              statement={lang === "fr" ? <><Key>0</Key> prix sur 3</> : <><Key>0</Key> of 3 prices</>}
              status={{ text: t(lang, "Votre comptable soupire en silence. Trois clics et il respire.", "Your accountant sighs quietly. Three clicks and they breathe again.") }}
              footer={<Button variant="secondary" arrow>{t(lang, "Renseigner mes prix · 2 min", "Add my prices · 2 min")}</Button>} />
            <Tile span={7} label={t(lang, "Ce qui manque", "What's missing")} art={<MiniRing parts={coverage(["create"]).map((part, index) => index === 3 ? { ...part, color: "var(--tt-overlap)" } : part)} />}
              statement={lang === "fr" ? <>Rien pour <Key tone="overlap">facturer</Key></> : <>Nothing to <Key tone="overlap">invoice</Key></>}
              status={{ text: t(lang, "Vos clients adorent. Votre banquier, moins.", "Your clients love it. Your banker, less so.") }}
              footer={<Button variant="secondary" arrow>{t(lang, "Voir 3 outils pour facturer", "See 3 tools to invoice")}</Button>} />
          </BentoRow>
        </Bento>
      </Page>
    </Page>
  );
}

/** A filled stack: the money has a shape, every finding a figure. */
function Complete({ lang }: { lang: Lang }) {
  const areas = [
    { id: "organise", label: t(lang, "Organiser", "Organise"), color: "var(--tt-area-1)", tools: [["Notion", "notion", 9.5], ["Airtable", "airtable", 17.17]] as const },
    { id: "create", label: t(lang, "Créer", "Create"), color: "var(--tt-area-2)", tools: [["Figma", "figma", 10.3], ["Canva", "canva", 9.17]] as const },
    { id: "talk", label: t(lang, "Communiquer", "Communicate"), color: "var(--tt-area-3)", tools: [["Slack", "slack", 7.51]] as const },
  ].map((area) => ({ ...area, amount: area.tools.reduce((sum, [, , n]) => sum + n, 0), tools: area.tools.map(([name, slug, amount]) => ({ id: slug, name, slug, amount })) }));
  const total = areas.reduce((sum, area) => sum + area.amount, 0);
  return (
    <Page rhythm="chapters">
      <Page group>
        <StoryHero eyebrow={t(lang, "Ma stack", "My stack")}
          title={lang === "fr" ? <>5 outils, <Key>{money(lang, total)}</Key> par mois.</> : <>5 tools, <Key>{money(lang, total)}</Key> a month.</>}
          lead={t(lang, `Soit ${money(lang, Math.round(total * 12))} par an : un beau week-end, ou deux doublons.`, `That's ${money(lang, Math.round(total * 12))} a year: a nice weekend away, or two overlaps.`)} />
        <Bento compact label={t(lang, "Ma stack en bref", "My stack at a glance")}>
          <BentoRow>
            <Tile span={7} label={t(lang, "Où va l'argent", "Where the money goes")}
              art={<MiniRing parts={areas.map((area) => ({ color: area.color, share: area.amount / total }))} />}
              statement={<Key>{`${Math.round((areas[0].amount / total) * 100)} %`}</Key>}
              status={{ text: t(lang, "pour s'organiser. Le rangement, ça n'a pas de prix… sauf ici.", "on getting organised. Tidiness is priceless… except here.") }} />
            <Tile span={5} label={t(lang, "Ce que vous pourriez garder", "What you could keep")}
              art={<Meet play={false} kept="left" badge={t(lang, "Doublon", "Overlap")} left={<Logo tool={tool("Notion", "notion")} size={32} localOnly />} right={<Logo tool={tool("Airtable", "airtable")} size={32} localOnly />} />}
              statement={<Amount size="figure" tone="gain" value={`−${money(lang, 26)}`} unit={t(lang, "/mois", "/mo")} />}
              status={{ text: t(lang, "si chacun de vos deux duos se choisit un chef.", "if each of your two duos picks a leader.") }} />
          </BentoRow>
        </Bento>
      </Page>
      <Section labelledBy="mv-budget">
        <SectionHead title={t(lang, "Le détail, outil par outil", "The detail, tool by tool")} titleId="mv-budget" />
        <Split lang={lang} areas={areas} format={(n) => money(lang, n)} unpriced={[]} rateDate={null} localLogosOnly />
      </Section>
    </Page>
  );
}

export const Debut: Story = { name: "Début (3 outils, aucun prix)", render: (_a, { globals: { lang } }) => <Starting lang={lang} /> };
export const Complete_: Story = { name: "Stack remplie", render: (_a, { globals: { lang } }) => <Complete lang={lang} /> };
