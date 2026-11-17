import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, CheckCircle2, ChevronDown, Code2, Copy, CreditCard, ExternalLink, Eye, FileText, Flag, Gauge, ListChecks, LogOut, Mail, Pencil, Plug, Settings2, ShieldCheck, Trash2, UserRound, X } from "@/lib/icons";
import { getToolLogoSources } from "@/lib/toolLogos";
import {
  CONSEQUENCE, clientName, say, typo,
  type InstallRow, type Lang, type McpSheet, type Pair, type SkillSheet,
} from "@/lib/agents";
import { CLIENTS, CLIENT_MARKS, clientLabel, clientsOf, cursorInstallLink, plugCard, vsCodeInstallLink, type ClientId, type CopyAction } from "@/lib/agentClients";
import { hookSentence, sheetMarkdown, sourceLinks, toolTopics } from "@/lib/agentSheet";
import Button, { LinkArrow, TextButton, buttonAttrs, linkClass } from "../Button/Button";
import Chip, { Chips } from "../Chip/Chip";
import Segmented from "../Segmented/Segmented";
import Prompt from "../Prompt/Prompt";
import CopyText from "../CopyText/CopyText";
import ToneCard, { ToneCards } from "../ToneCard/ToneCard";
import Tag from "../Tag/Tag";
import { Collapse } from "../Motion/Motion";
import Drawer, { DrawerTitle } from "../Drawer/Drawer";
import Chapter, { Chapters } from "../Chapter/Chapter";
import { longDate } from "../AgentAccess/agentVerdict";
import styles from "./AgentSheet.module.css";

/*
 * A server or skill sheet of the agents section (step 1 of the product analysis, 17/11/2026). A calm head: logo and
 * title, a hook composed from the data, « Copier pour votre assistant », a trust line. Then what it changes for you,
 * « Brancher Notion » for the place you use AI, your first requests, what to check if it fails, what it can do and
 * how to stay in control (in sentences), our view; the documented actions folded; the sources. A fact has one place.
 * Facts come from the vendor's documentation; requests and views are ToolTrim's, from documented tools only.
 */

const raise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const STORE_KEY = "tooltrim.agents.client";
/** The capability's verb as a tag, the same words as the action list (reading said too, here). */
/** The consequence of an action, in the section's one vocabulary (17/11). */
const ABILITY_TAG = CONSEQUENCE;


export function McpSheetView({ sheet, lang, title, logo, toolName = sheet.publisher, pageUrl, reportHref, related }: {
  sheet: McpSheet; lang: Lang;
  /** The tool's logo beside the title (the system's Logo, 40 px). */
  logo?: ReactNode;
  /** The page's title (« Brancher Notion à votre assistant »): the sheet draws its own head. */
  title: string;
  /** The tool's catalogue name (« Notion »), said in the hook, the steps and the titles. */
  toolName?: string;
  /** The sheet's public address, given in the Markdown copy. */
  pageUrl: string;
  /** « Signaler une erreur »: the contact page with the sheet in context. */
  reportHref: string;
  /** The row of three cards under our view: the tool, an alternative that plugs in, a know-how (the page composes it). */
  related?: ReactNode;
}) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const plugId = `${sheet.slug}-brancher`;
  const asks = askCards(sheet);
  return (
    <div className={styles.sheet} data-agent-sheet="mcp">
      <Chapters>
        {/* 1. The head, one left edge: logo and title, the hook, the actions, the trust line. */}
        <Chapter chapter="head" as="header">
          <div className={styles.titleRow}>
            {logo && <span className={styles.titleLogo} aria-hidden="true">{logo}</span>}
            <h1 className={styles.title}>{title}</h1>
          </div>
          <p className={styles.lead}>{hookSentence(sheet, toolName, lang)}</p>
          {sheet.note && <p className={styles.reading}>{say(lang, sheet.note)}</p>}
          <div className={styles.actions}>
            <CopyMenu sheet={sheet} lang={lang} toolName={toolName} pageUrl={pageUrl} />
          </div>
          <p className={styles.trust}>{t(`Officiel, publié par ${sheet.publisher} · vérifié le ${longDate(sheet.verified_on, lang)}`, `Official, published by ${sheet.publisher} · checked on ${longDate(sheet.verified_on, lang)}`)}</p>
        </Chapter>

        {/* 2. What you could ask: reading first, the one that writes last with what to check. */}
        {asks.length > 0 && (
          <Chapter chapter="ask" width="wide" title={t("Ce que vous pourrez lui demander", "What you could ask it")}
            lead={t("Commencez par des demandes qui ne font que lire ; passez à l'écriture une fois rassuré.", "Start with requests that only read; move on to writing once reassured.")}>
            <ul className={styles.cards}>
              {asks.map((ask) => (
                <li key={ask.words.fr} className={styles.card}>
                  {ask.kind && <span className={styles.cardTag}><Tag on="card" tone="neutral">{say(lang, ABILITY_TAG[ask.kind])}</Tag></span>}
                  <Prompt text={lang === "en" ? ask.words.en : ask.words.fr} lang={lang} />
                  {ask.check && <p className={styles.meta}>{t("À vérifier : ", "Check: ")}{lower(say(lang, ask.check))}</p>}
                </li>
              ))}
            </ul>
          </Chapter>
        )}

        {/* 3. Plug it in, for the place you use AI. */}
        <Chapter id={plugId} chapter="plug" width="wide" title={t(`Brancher ${toolName}`, `Plug in ${toolName}`)}
          lead={t("Choisissez votre assistant : les étapes s'adaptent.", "Pick your assistant: the steps follow.")}>
          <PlugChapter sheet={sheet} lang={lang} toolName={toolName} />
          {sheet.plan_words?.advanced && (
            <p className={styles.reading}><span className={styles.strong}>{t("Selon votre forfait.", "Depending on your plan.")}</span> {raise(say(lang, sheet.plan_words.advanced).replace(/^(En plus, |On top, )/, ""))}</p>
          )}
          {sheet.troubleshoot && <Disclosure label={t("Si ça ne marche pas", "If it does not work")}>
            <ul className={styles.sentences}>{sheet.troubleshoot.map((line) => <li key={line.fr} className={styles.reading}>{say(lang, line)}</li>)}</ul>
          </Disclosure>}
        </Chapter>

        {/* 4. Stay in control: what it can do (with the documented actions), and your safeguards. */}
        <Chapter chapter="control" width="wide" title={t("Garder la main", "Stay in control")}
          lead={t("L'assistant n'a jamais plus de droits que votre compte.", "The assistant never has more rights than your account.")}>
          <ControlColumns sheet={sheet} lang={lang} />
        </Chapter>

        {/* 5. Our view: two verdict cards, then « Pour aller plus loin », three cards on one template. */}
        {sheet.for && sheet.not_for && (
          <Chapter chapter="view" width="wide" title={t("Notre avis", "Our view")}>
            <ToneCards>
              <ToneCard tone="gain" icon={<Check />} title={t("Utile si", "Useful if")}>{raise(say(lang, sheet.for))}</ToneCard>
              <ToneCard tone="caution" icon={<X />} title={t("Moins utile si", "Less useful if")}>{raise(say(lang, sheet.not_for))}</ToneCard>
            </ToneCards>
            {related && <div className={styles.related}><p className={styles.columnHead}>{t("Pour aller plus loin", "Going further")}</p>{related}</div>}
          </Chapter>
        )}

        {/* 6. Footnotes: the sources on one line and « Signaler une erreur ». */}
        <Chapter chapter="annex" tone="notes" width="wide">
          <SourceLine lang={lang} publisher={sheet.publisher} sources={sheet.sources} reportHref={reportHref} />
        </Chapter>
      </Chapters>
    </div>
  );
}

/** The three request cards: reading first, the one that writes last; the examples when no first requests are written. */
function askCards(sheet: McpSheet): { words: Pair; kind?: "read" | "write"; check?: Pair }[] {
  const first = sheet.first_requests;
  if (!first) return (sheet.examples ?? []).slice(0, 3).map((words) => ({ words }));
  const write = first.write ? [{ words: first.write.ask, kind: "write" as const, check: first.write.check }] : [];
  return [...first.read.slice(0, 3 - write.length).map((words) => ({ words, kind: "read" as const })), ...write];
}

/** A folded block opened by a text link (« Si ça ne marche pas »). */
function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <div className={styles.disclosure}>
      <div className={styles.toggle}>
        <TextButton aria-expanded={open} aria-controls={panel} onClick={() => setOpen((v) => !v)}>
          {label}<span className={styles.chevron} data-open={open || undefined} aria-hidden="true"><ChevronDown /></span>
        </TextButton>
      </div>
      <div id={panel}><Collapse open={open}><div className={styles.disclosed}>{children}</div></Collapse></div>
    </div>
  );
}

/** The sources on one line of short links, « Signaler une erreur » last on the same line; the date is said once, in the head. */
function SourceLine({ lang, publisher, sources, reportHref }: { lang: Lang; publisher: string; sources: { label: string; url: string }[]; reportHref: string }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  return (
    <div className={styles.sourceLine} data-chapter-part="sources">
      <p className={styles.meta}>{t(`Sources, chez ${publisher} :`, `Sources, at ${publisher}:`)}</p>
      <ul className={styles.sourceLinks}>
        {sourceLinks(sources, lang).map((source) => (
          <li key={source.url}><a className={styles.sourceLink} href={source.url} target="_blank" rel="noopener noreferrer" title={source.title}>{source.label}<ExternalLink aria-hidden="true" /></a></li>
        ))}
        <li><a className={styles.sourceLink} href={reportHref}><Flag aria-hidden="true" />{t("Signaler une erreur", "Report an error")}</a></li>
      </ul>
    </div>
  );
}

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** « Copier pour votre assistant »: only what this sheet can serve, each entry checked on the client's documentation. */
function CopyMenu({ sheet, lang, toolName, pageUrl }: { sheet: McpSheet; lang: Lang; toolName: string; pageUrl: string }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState("");
  const [sheetMode, setSheetMode] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 767px)");
    const apply = () => setSheetMode(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  const menu = useId();
  useEffect(() => {
    if (!open || sheetMode) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, [open, sheetMode]);
  const copy = (value: string, done: string) => {
    void navigator.clipboard?.writeText(value).then(() => { setSaid(done); window.setTimeout(() => setSaid(""), 2000); });
    setOpen(false);
  };
  const claudeCode = sheet.install.find((row) => row.client === "claude-code" && row.type === "command");
  const vsCode = sheet.install.find((row) => row.client === "vs-code" && row.type === "url" && row.value.startsWith("vscode:"))?.value ?? vsCodeInstallLink(sheet);
  const cursor = sheet.install.find((row) => row.client === "cursor" && row.type === "url")?.value ?? cursorInstallLink(sheet);
  const claude = sheet.claude_directory?.url ?? sheet.install.find((row) => row.client === "claude" && row.type === "url" && row.value.includes("claude.ai/directory"))?.value;
  const entries: { label: string; help: string; icon: ReactNode; run?: () => void; href?: string }[] = [
    { label: t("Copier la fiche en Markdown", "Copy the sheet as Markdown"), help: t("À coller dans votre assistant", "To paste in your assistant"), icon: <FileText />,
      run: () => copy(sheetMarkdown(sheet, { toolName, url: pageUrl, lang }), t("Fiche copiée", "Sheet copied")) },
    ...(claude ? [{ label: t("Ouvrir dans Claude", "Open in Claude"), help: t(`Ouvre ${toolName} dans le répertoire de Claude`, `Opens ${toolName} in Claude's directory`), icon: <ClientMark client="claude" size={20} />, href: claude }] : []),
    ...(claudeCode ? [{ label: t("Commande Claude Code", "Claude Code command"), help: t("Ajoute le serveur depuis le terminal", "Adds the server from the terminal"), icon: <Code2 />,
      run: () => copy(claudeCode.value, t("Commande copiée", "Command copied")) }] : []),
    ...(vsCode ? [{ label: t("Brancher à VS Code", "Plug into VS Code"), help: t("Ouvre VS Code et propose l'installation", "Opens VS Code and offers to install"), icon: <ClientMark client="vs-code" size={20} />, href: vsCode }] : []),
    ...(cursor ? [{ label: t("Brancher à Cursor", "Plug into Cursor"), help: t("Ouvre Cursor et propose l'installation", "Opens Cursor and offers to install"), icon: <ClientMark client="cursor" size={20} />, href: cursor }] : []),
  ];
  const items = entries.map((entry) => (
    <li key={entry.label}>
      {entry.href
        ? <a className={styles.menuItem} href={entry.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><MenuEntry {...entry} /><ExternalLink aria-hidden="true" /></a>
        : <button type="button" className={styles.menuItem} onClick={entry.run}><MenuEntry {...entry} /></button>}
    </li>
  ));
  return (
    <div className={styles.menuRoot} ref={root}>
      <Button variant="primary" icon={<Copy />} aria-expanded={open} aria-controls={menu} onClick={() => setOpen((v) => !v)}>
        {t("Copier pour votre assistant", "Copy for your assistant")}<span className={styles.chevron} data-open={open || undefined} aria-hidden="true"><ChevronDown /></span>
      </Button>
      {open && !sheetMode && <ul id={menu} className={styles.menu} data-menu="">{items}</ul>}
      {/* On a phone the menu opens as the system's sheet from the bottom, full width, 44 targets. */}
      {sheetMode && (
        <Drawer open={open} onClose={() => setOpen(false)} closeLabel={t("Fermer", "Close")}>
          <DrawerTitle>{t("Copier pour votre assistant", "Copy for your assistant")}</DrawerTitle>
          <ul id={menu} className={styles.sheetMenu}>{items}</ul>
        </Drawer>
      )}
      <span className={styles.srOnly} aria-live="polite">{said}</span>
      {said && <span className={styles.done} aria-hidden="true"><Check />{said}</span>}
    </div>
  );
}

function MenuEntry({ label, help, icon }: { label: string; help: string; icon: ReactNode }) {
  return <>
    <span className={styles.menuIcon} aria-hidden="true">{icon}</span>
    <span className={styles.menuWords}><span className={styles.menuLabel}>{label}</span><span className={styles.menuHelp}>{help}</span></span>
  </>;
}

/**
 * A place's small logo. Its space is reserved and it loads at once (it sits above the fold); it stays invisible
 * until loaded and steps through the logo sources on error, so a reader never sees an empty circle. No logo: a pictogram.
 */
function ClientMark({ client, size }: { client: ClientId; size: 14 | 16 | 20 }) {
  const mark = CLIENT_MARKS[client];
  const src = useMarkSource(mark);
  return (
    <span className={styles.mark} style={{ width: size, height: size }} aria-hidden="true" data-mark={src ? "logo" : "picto"}>
      {src ? <img src={src} alt="" width={size} height={size} /> : <Plug />}
    </span>
  );
}

/* A mark's source, resolved once per logo and shared (facts line, menu): each source is tried with a time limit,
   since a remote logo host can hang instead of failing, and the <img> is only drawn once its file has loaded. */
const markCache = new Map<string, Promise<string | null>>();
const SOURCE_LIMIT_MS = 2500;
function resolveMark(tool: { name: string; slug: string; websiteUrl: string }) {
  const key = tool.slug;
  if (!markCache.has(key)) {
    markCache.set(key, (async () => {
      for (const source of getToolLogoSources(tool, 32)) {
        const ok = await new Promise<boolean>((resolve) => {
          const image = new Image();
          const timer = window.setTimeout(() => resolve(false), SOURCE_LIMIT_MS);
          image.onload = () => { window.clearTimeout(timer); resolve(image.naturalWidth > 0); };
          image.onerror = () => { window.clearTimeout(timer); resolve(false); };
          image.src = source;
        });
        if (ok) return source;
      }
      return null;
    })());
  }
  return markCache.get(key)!;
}
function useMarkSource(tool: { name: string; slug: string; websiteUrl: string } | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!tool) return;
    let live = true;
    void resolveMark(tool).then((found) => { if (live) setSrc(found); });
    return () => { live = false; };
  }, [tool]);
  return src;
}

/**
 * « Où utilisez-vous l'IA ? »: a segmented control (Claude, ChatGPT, Gemini, then « Autres » for Copilot, the developer
 * tools and any other tool), then the steps as cards on three columns. The choice follows the reader from sheet to sheet.
 */
function PlugChapter({ sheet, lang, toolName }: { sheet: McpSheet; lang: Lang; toolName: string }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const clients = clientsOf(sheet);
  const main = clients.filter((client) => (["claude", "chatgpt", "gemini"] as ClientId[]).includes(client));
  const others = clients.filter((client) => !main.includes(client));
  const [current, setCurrent] = useState<ClientId | undefined>(clients[0]);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORE_KEY) as ClientId | null;
      if (stored && clients.includes(stored)) setCurrent(stored);
    } catch { /* storage refused: the first choice stays */ }
    // The stored choice is read once, after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const choose = (client: ClientId) => {
    setCurrent(client);
    try { window.localStorage.setItem(STORE_KEY, client); } catch { /* the page works without it */ }
  };
  if (!clients.length || !current) {
    return <p className={styles.reading}>{t(`${toolName} ne détaille pas son branchement : suivez sa documentation, en lien dans les sources.`, `${toolName} does not detail its setup: follow its documentation, linked in the sources.`)}</p>;
  }
  const steps = plugCard(sheet, current, toolName, lang);
  const segment = main.includes(current) ? current : "others";
  const options = [
    ...main.map((client) => ({ value: client as string, label: clientLabel(client, lang) })),
    ...(others.length ? [{ value: "others", label: t("Autres", "Others") }] : []),
  ];
  return <>
    <div className={styles.choices}>
      <Segmented label={t("Où utilisez-vous l'IA ?", "Where do you use AI?")} options={options} value={segment}
        onChange={(value) => choose(value === "others" ? (others.includes(current) ? current : others[0]) : (value as ClientId))} />
      {segment === "others" && others.length > 1 && (
        <Chips label={t("Autres outils", "Other tools")}>
          {others.map((client) => <Chip key={client} pressed={client === current} onClick={() => choose(client)}>{clientLabel(client, lang)}</Chip>)}
        </Chips>
      )}
    </div>
    <ol className={styles.steps}>
      {steps.map((step, index) => (
        <li key={step.text} className={styles.stepCard}>
          <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
          <p className={styles.reading}>{step.text}</p>
          {step.prompt && <Prompt text={lang === "en" ? step.prompt.en : step.prompt.fr} lang={lang} />}
          {step.action?.kind === "open" && <a {...buttonAttrs("primary")} href={step.action.href} target="_blank" rel="noopener noreferrer">{step.action.label}</a>}
          {step.action?.kind === "copy" && <CopyButton action={step.action} lang={lang} />}
          {step.secondary && <CopyButton action={step.secondary} lang={lang} secondary />}
        </li>
      ))}
    </ol>
    {/* What gets copied, to read: full width under the steps; the only copy button is the step's own (17/11). */}
    {steps.flatMap((step) => [step.action, step.secondary]).map((action) => action?.kind === "copy" && <Preview key={action.value} action={action} lang={lang} />)}
    {CLIENTS[current].source && steps.some((step) => step.action?.kind === "copy") && <p className={styles.meta}>{t("Où coller : d'après la documentation de ", "Where to paste: from the documentation of ")}<a className={linkClass("inline")} href={CLIENTS[current].source} target="_blank" rel="noopener noreferrer">{clientLabel(current, lang)}</a>.</p>}
  </>;
}

/** A step's own copy: the main button named after what it copies, or « ou copier la configuration » under a link. */
function CopyButton({ action, lang, secondary = false }: { action: CopyAction; lang: Lang; secondary?: boolean }) {
  const [copied, setCopied] = useState(false);
  const done = lang === "en" ? "Copied" : "Copié";
  const copy = () => { void navigator.clipboard?.writeText(action.value).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); }); };
  const label = secondary ? (lang === "en" ? `or ${lower(action.label)}` : `ou ${lower(action.label)}`) : action.label;
  return <>
    {secondary
      ? <TextButton tone="quiet" onClick={copy}>{copied ? done : label}</TextButton>
      : <Button variant="primary" icon={copied ? <Check /> : <Copy />} onClick={copy}>{copied ? done : label}</Button>}
    <span className={styles.srOnly} aria-live="polite">{copied ? done : ""}</span>
  </>;
}

/** What a step copies, shown to read: a command scrolls sideways, a configuration keeps its indentation. */
function Preview({ action, lang }: { action: CopyAction; lang: Lang }) {
  // An address is a technical name: it copies itself with one click (17/11).
  if (action.type === "url") return <p className={styles.meta}><CopyText value={action.value} lang={lang} /></p>;
  return <pre className={styles.pre} data-type={action.type} tabIndex={0} aria-label={action.label}>{action.type === "config" ? indent(action.value) : action.value}</pre>;
}

/** A block to copy, with a button named after what it copies and a « Copié » said to screen readers. */
function CopyBlock({ value, type, label, lang }: { value: string; type: InstallRow["type"]; label: string; lang: Lang }) {
  const [copied, setCopied] = useState(false);
  const shown = type === "config" ? indent(value) : value;
  const done = lang === "en" ? "Copied" : "Copié";
  const copy = () => { void navigator.clipboard?.writeText(value).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); }); };
  return (
    <div className={styles.copyBlock}>
      <pre className={styles.pre} data-type={type} {...(type === "config" ? {} : { tabIndex: 0, "aria-label": label })}>{shown}</pre>
      <div className={styles.copyAction}>
        <Button variant="secondary" icon={copied ? <Check /> : <Copy />} onClick={copy}>{copied ? done : label}</Button>
        <span className={styles.srOnly} aria-live="polite">{copied ? done : ""}</span>
      </div>
    </div>
  );
}
const indent = (value: string) => { try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } };

export function SkillSheetView({ skill, lang, reportHref, related }: { skill: SkillSheet; lang: Lang; reportHref: string; related?: ReactNode }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const agents = skill.agents.map((a) => clientName(a, lang));
  return (
    <div className={styles.sheet} data-agent-sheet="skill">
      <Part chapter="change" title={t("Ce que ça change pour vous", "What it changes for you")}>
        <p className={styles.text}>{say(lang, skill.summary)}</p>
        {skill.requires && <Facts rows={[{ label: t("Il vous faut", "You need"), value: say(lang, skill.requires) }]} />}
      </Part>
      <Part chapter="plug" title={t("L'ajouter à votre assistant", "Add it to your assistant")}>
        <p className={styles.text}>{skill.install.length
          ? t(`Ce savoir-faire s'ajoute à ${agents.join(", ")}. Les instructions de l'éditeur sont dans la fiche technique.`, `This know-how is added to ${agents.join(", ")}. The vendor's instructions are in the technical sheet.`)
          : t(`Rien à installer : le savoir-faire vit dans votre espace ${skill.publisher}, et ${agents.join(", ")} le lit une fois l'outil branché.`, `Nothing to install: the know-how lives in your ${skill.publisher} workspace, and ${agents.join(", ")} reads it once the tool is plugged in.`)}</p>
      </Part>
      {related}
      {skill.install.length > 0 && (
        <Further lang={lang} summary={t("Instructions d'installation de l'éditeur", "The vendor's install instructions")}>
          <ul className={styles.install}>
            {skill.install.map((row, index) => (
              <li key={index} className={styles.installRow}>
                <p className={styles.term}>{row.client === "any" ? t("Tout agent", "Any agent") : clientName(row.client, lang)}</p>
                {row.type === "steps" ? <p className={styles.text}>{row.value}</p> : <CopyBlock value={row.value} type={row.type} lang={lang}
                  label={{ url: t("Copier l'adresse", "Copy the address"), command: t("Copier la commande", "Copy the command"), config: t("Copier la configuration", "Copy the configuration"), steps: "" }[row.type]} />}
              </li>
            ))}
          </ul>
        </Further>
      )}
      <Sources lang={lang} date={skill.verified_on} publisher={skill.publisher} sources={skill.sources} reportHref={reportHref} />
    </div>
  );
}

/** A chapter: the main one (Brancher) on a tile; the others on the page, so the sheet has a rhythm. */
function Part({ chapter, id: anchor, title, tone = "tile", children }: { chapter: string; id?: string; title: string; tone?: "tile" | "plain"; children: ReactNode }) {
  const id = useId();
  return <section id={anchor} className={tone === "tile" ? styles.part : styles.plain} aria-labelledby={id} data-chapter={chapter}><h2 id={id} className={styles.partTitle}>{title}</h2>{children}</section>;
}

/** « Pour aller plus loin »: a full-width row that says what it hides; the technical sheet folds out under it. */
function Further({ lang, title, summary, children }: { lang: Lang; title?: string; summary?: string; children: ReactNode }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <section className={styles.furtherBlock} data-chapter-part="further">
      <h2 className={styles.furtherHeading}>
        <button type="button" className={styles.furtherRow} aria-expanded={open} aria-controls={panel} onClick={() => setOpen((v) => !v)}>
          <span className={styles.furtherText}>
            <span className={styles.partTitle}>{title ?? t("Pour aller plus loin", "Going further")}</span>
            <span className={styles.note}>{summary ?? t("Détails techniques", "Technical details")}</span>
          </span>
          <span className={styles.chevron} data-open={open || undefined} aria-hidden="true"><ChevronDown /></span>
        </button>
      </h2>
      <div id={panel}>
        <Collapse open={open}><div className={styles.further}>{children}</div></Collapse>
      </div>
    </section>
  );
}

function Facts({ rows }: { rows: { label: string; value: string; detail?: string }[] }) {
  return (
    <dl className={styles.facts}>
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className={styles.row}>
          <dt className={styles.term}>{row.label}</dt>
          <dd className={styles.value}>{row.value}{row.detail && <span className={styles.detail}>{row.detail}</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The list's order of risk: what deletes first, what only reads last. */
const LIST_ORDER = ["delete", "pay", "send", "write", "read"] as const;
type Kind = (typeof LIST_ORDER)[number];

const CONTROL_ICON = { account: <UserRound />, admin: <Settings2 />, cut: <LogOut />, confirm: <CheckCircle2 />, limit: <ShieldCheck />, read: <Eye />, cost: <Gauge />, log: <ListChecks /> } as const;
const KIND_ICON = { delete: <Trash2 />, pay: <CreditCard />, send: <Mail />, write: <Pencil />, read: <Eye /> } as const;

/** One entry of « Garder la main », the same shape on both sides: an icon in a round, a short title, a sentence. */
function Entry({ icon, title, alert = false, children }: { icon: ReactNode; title: string; alert?: boolean; children?: ReactNode }) {
  return (
    <div className={styles.entry}>
      <span className={styles.entryIcon} data-alert={alert || undefined} aria-hidden="true">{icon}</span>
      <div className={styles.entryBody}>
        <p className={styles.entryTitle}>{title}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * « Garder la main » (17/11): « Ce qu'il peut faire » on the left, each consequence with its count and its documented
 * actions right under it (deleting, paying, sending always in view; editing past 6 and reading fold out in place, still
 * in the server-rendered HTML); « Vos garde-fous » on the right, sticking at the top on a computer. No tag column.
 */
function ControlColumns({ sheet, lang }: { sheet: McpSheet; lang: Lang }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const tools = sheet.tools ?? [];
  const kinds = LIST_ORDER.filter((kind) => sheet.capabilities?.some((line) => line.kind === kind) || tools.some((tool) => tool.kind === kind));
  return (
    <div className={styles.controlGrid}>
      {kinds.length > 0 && (
        // One identifier column for the whole list, as wide as its longest identifier (17/11).
        <div className={styles.controlColumn} data-column="can" style={{ "--id-chars": Math.max(0, ...tools.map((tool) => tool.name.length)) } as CSSProperties}>
          <p className={styles.columnHead}>{t("Ce qu'il peut faire", "What it can do")}</p>
          {sheet.tools_note && <p className={styles.meta}>{say(lang, sheet.tools_note)}</p>}
          {kinds.map((kind) => {
            const line = sheet.capabilities?.find((capability) => capability.kind === kind);
            const own = tools.filter((tool) => tool.kind === kind);
            const title = own.length ? `${say(lang, CONSEQUENCE[kind])} · ${own.length}` : say(lang, CONSEQUENCE[kind]);
            return (
              <Entry key={kind} icon={KIND_ICON[kind]} title={title} alert={kind === "delete" || kind === "pay"}>
                {/* One fact in one place (17/11): the sentence only when there is no list to show. */}
                {line && !own.length && <p className={styles.text}>{raise(say(lang, line))}.</p>}
                {own.length > 0 && <ActionList kind={kind} tools={own} lang={lang} />}
              </Entry>
            );
          })}
          {tools.length > 0 && <p className={styles.meta}>{t("Les actions sont celles que l'éditeur documente ; le classement par sujet est celui de ToolTrim.", "The actions are those the vendor documents; the grouping by topic is ToolTrim's.")}</p>}
        </div>
      )}
      {sheet.control && (
        <div className={styles.controlColumn} data-column="safeguards">
          <p className={styles.columnHead}>{t("Vos garde-fous", "Your safeguards")}</p>
          {sheet.control.map((item) => (
            <Entry key={item.fr} icon={CONTROL_ICON[item.icon]} title={say(lang, item.title)}>
              <p className={styles.text}>{raise(say(lang, item))}</p>
            </Entry>
          ))}
        </div>
      )}
    </div>
  );
}

/** A consequence's actions in dense lines: all in view for deleting, paying, sending; 6 then the rest for editing; reading folded. */
function ActionList({ kind, tools, lang }: { kind: (typeof LIST_ORDER)[number]; tools: NonNullable<McpSheet["tools"]>; lang: Lang }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const [open, setOpen] = useState(false);
  const panel = useId();
  const sensitive = kind === "delete" || kind === "pay" || kind === "send";
  const shown = sensitive ? tools : kind === "write" ? tools.slice(0, 6) : [];
  const rest = sensitive ? [] : kind === "write" ? tools.slice(6) : tools;
  const lines = (list: typeof tools) => (
    <ul className={styles.tools}>
      {list.map((tool) => <li key={tool.name} className={styles.tool} data-kind={tool.kind}><span className={styles.toolAction}>{say(lang, tool)}</span><span className={styles.toolId}><CopyText value={tool.name} lang={lang} /></span></li>)}
    </ul>
  );
  return (
    <div className={styles.actionList}>
      {kind === "read" && <p className={styles.meta}>{t("Sans effet sur vos données.", "No effect on your data.")}</p>}
      {shown.length > 0 && lines(shown)}
      {rest.length > 0 && <>
        {/* What is folded, in topics: a summary that never repeats the lines in view. */}
        <p className={styles.text}>{kind === "write" ? t("Et aussi : ", "And also: ") : t("Lit : ", "Reads: ")}{toolTopics(rest).map((topic) => lower(say(lang, topic.words))).join(", ")}.</p>
        <div className={styles.toggle}>
          <TextButton tone="quiet" aria-expanded={open} aria-controls={panel} onClick={() => setOpen((v) => !v)}>
            {open ? t("Replier", "Fold") : t(`Voir les ${tools.length} actions`, `Show the ${tools.length} actions`)}<span className={styles.chevron} data-open={open || undefined} aria-hidden="true"><ChevronDown /></span>
          </TextButton>
        </div>
        {/* Folded actions stay in the server-rendered HTML, hidden only visually, so they are indexed. */}
        <div id={panel}><Collapse open={open}>
          <div className={styles.topics}>
            {toolTopics(rest).map((topic) => <div key={topic.id} className={styles.topic}><p className={styles.topicHead}>{say(lang, topic.words)}</p>{lines(topic.tools)}</div>)}
          </div>
        </Collapse></div>
      </>}
    </div>
  );
}

/** « Sources »: the vendor's pages as short links with their site, and a way to report an error. Lighter than a chapter;
    the date is said once, in the head's trust line. */
function Sources({ lang, date, publisher, sources, reportHref }: { lang: Lang;
  /** The skill sheet, which has no trust line, says its date here; the server sheet says it in its head. */
  date?: string; publisher: string; sources: { label: string; url: string }[]; reportHref: string }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const id = useId();
  return (
    <section className={styles.sourcesBlock} aria-labelledby={id} data-chapter="sources">
      <h2 id={id} className={styles.sourcesTitle}>Sources</h2>
      <p className={styles.note}>{date
        ? t(`Vérifié le ${longDate(date, lang)} chez ${publisher}.`, `Checked on ${longDate(date, lang)} with ${publisher}.`)
        : t(`Pages consultées chez ${publisher} :`, `Pages read at ${publisher}:`)}</p>
      <ul className={styles.sources}>
        {sourceLinks(sources, lang).map((source) => (
          <li key={source.url}>
            <a className={styles.source} href={source.url} target="_blank" rel="noopener noreferrer" title={source.title}>
              <span className={styles.sourceLabel}>{source.label}</span>
              <span className={styles.sourceDomain}>{source.domain}</span>
              <ExternalLink aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <div className={styles.toggle}><a className={linkClass("quiet")} href={reportHref}><Flag aria-hidden="true" /> {t("Signaler une erreur", "Report an error")}<LinkArrow /></a></div>
    </section>
  );
}

/**
 * A card of « Pour aller plus loin » (17/11): one template for the tool, an alternative and a know-how. Logo of 40, the
 * card's role, the name at 21, one complete sentence (two lines at most, never cut), one action link at the foot, aligned
 * across the row; an optional discreet second link (« Ajouter à ma stack »).
 */
export function RelatedCard({ logo, role, name, sentence, cta, renderLink, extra }: {
  logo: ReactNode; role: string; name: string; sentence?: string; cta: string;
  renderLink: (className: string, content: ReactNode) => ReactNode;
  extra?: ReactNode;
}) {
  return (
    <li className={styles.relatedCard}>
      <span className={styles.relatedLogo} aria-hidden="true">{logo}</span>
      <p className={styles.meta}>{role}</p>
      <p className={styles.relatedName}>{name}</p>
      {sentence && <p className={styles.text}>{sentence}</p>}
      <div className={styles.relatedFoot}>
        {renderLink(linkClass(), <>{cta}<LinkArrow /></>)}
        {extra}
      </div>
    </li>
  );
}

export function RelatedCards({ label, children }: { label: string; children: ReactNode }) {
  return <ul className={styles.relatedCards} aria-label={label}>{children}</ul>;
}
