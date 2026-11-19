import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, CheckCircle2, ChevronDown, Code2, Copy, CreditCard, ExternalLink, Eye, FileText, Flag, Gauge, ListChecks, LogOut, Mail, Pencil, Plug, Settings2, ShieldCheck, Trash2, UserRound, X } from "@/lib/icons";
import { getToolLogoSources } from "@/lib/toolLogos";
import {
  CONSEQUENCE, clientName, forEveryone, isCopyRow, say, skillTitle, typo,
  type InstallRow, type Lang, type McpAdvice, type McpSheet, type Pair, type SkillSheet,
} from "@/lib/agents";
import { CLIENTS, CLIENT_MARKS, clientLabel, clientsOf, cursorInstallLink, plugCard, vsCodeInstallLink, type ClientId, type CopyAction } from "@/lib/agentClients";
import { hookSentence, sheetMarkdown, sourceLinks } from "@/lib/agentSheet";
import Button, { LinkArrow, TextButton, buttonAttrs, linkClass } from "../Button/Button";
import Prompt from "../Prompt/Prompt";
import Table from "../Table/Table";
import Tabs from "../Tabs/Tabs";
import { useAgentAssistant } from "@/hooks/useAgentAssistant";
import CopyText from "../CopyText/CopyText";
import ToneCard, { ToneCards } from "../ToneCard/ToneCard";
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
  /** « Pour aller plus loin » under our view, composed by the page from the catalogue's media cards (step 8b). */
  related?: ReactNode;
}) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const plugId = `${sheet.slug}-brancher`;
  const asks = askCards(sheet);
  const advice = sheet.advice;
  // The reader's assistant, its mark beside each request (a conversation).
  const [assistant] = useAgentAssistant();
  const assistantMark: ClientId = assistant === "other" ? "any" : assistant;
  return (
    <div className={styles.sheet} data-agent-sheet="mcp">
      <Chapters>
        {/* 1. The head, one left edge: logo and title, the hook, the actions, the trust line. */}
        <Chapter chapter="head" as="header">
          <div className={styles.titleRow}>
            {logo && <span className={styles.titleLogo} aria-hidden="true">{logo}</span>}
            <h1 className={styles.title}>{title}</h1>
          </div>
          {/* A freelancer's advice (19/11/2026): the verdict leads, the facts of the hook follow. */}
          {advice ? <>
            <p className={styles.lead} data-verdict="">{raise(say(lang, advice.verdict))}</p>
            <p className={styles.reading}>{hookSentence(sheet, toolName, lang)}</p>
          </> : <p className={styles.lead}>{hookSentence(sheet, toolName, lang)}</p>}
          {sheet.note && <p className={styles.reading}>{say(lang, sheet.note)}</p>}
          <div className={styles.actions}>
            <CopyMenu sheet={sheet} lang={lang} toolName={toolName} pageUrl={pageUrl} />
          </div>
          <p className={styles.trust}>{t(`Officiel, publié par ${sheet.publisher} · vérifié le ${longDate(sheet.verified_on, lang)}`, `Official, published by ${sheet.publisher} · checked on ${longDate(sheet.verified_on, lang)}`)}</p>
        </Chapter>

        {/* 2. What you could ask: reading first, the one that writes last with what to check. */}
        {advice && (
          <Chapter chapter="ask" width="wide" title={t("Ce que ça change pour vous", "What it changes for you")}
            lead={t("Des moments de votre semaine, et la phrase à lui écrire.", "Moments of your week, and the sentence to write to it.")}>
            <ol className={styles.cards}>
              {advice.situations.map((situation) => (
                // What the reader looks for (19/11): in which situation (the title), what to type (the message, yours: no
                // assistant's mark), what comes out (one line), then the copy button. No number: no sequence.
                <li key={situation.ask.fr} className={styles.askCard} data-situation="">
                  <h3 className={styles.situationTitle}>{say(lang, situation.title)}</h3>
                  <Prompt tone="sent" text={lang === "en" ? situation.ask.en : situation.ask.fr} lang={lang}
                    note={<p className={styles.situationResult}><span className={styles.strong}>{t("Résultat", "Result")}</span>{t(" : ", ": ")}{say(lang, situation.gain)}</p>} />
                </li>
              ))}
            </ol>
          </Chapter>
        )}
        {!advice && asks.length > 0 && (
          <Chapter chapter="ask" width="wide" title={t("Ce que vous pourrez lui demander", "What you could ask it")}
            lead={t("Commencez par des demandes qui ne font que lire ; passez à l'écriture une fois rassuré.", "Start with requests that only read; move on to writing once reassured.")}>
            {/* The same template as « Brancher » (step 8c): a number, where it stands in the progression, what it does, then
                the request as the message to send, what to check, and the copy button at the foot of every card. */}
            <ol className={styles.cards}>
              {asks.map((ask, index) => (
                <li key={ask.words.fr} className={styles.askCard} data-kind={ask.kind}>
                  <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
                  <p className={styles.askStage}>{ask.kind === "write" ? t("Ensuite", "Then") : t("Pour commencer", "To start")}</p>
                  {ask.kind && <p className={styles.askKind} data-kind={ask.kind}>{KIND_ICON[ask.kind]}{say(lang, ABILITY_TAG[ask.kind])}</p>}
                  <Prompt size="lead" text={lang === "en" ? ask.words.en : ask.words.fr} lang={lang} mark={<ClientMark client={assistantMark} size={20} />}
                    note={ask.check && <p className={styles.check}><CheckCircle2 aria-hidden="true" /><span><span className={styles.strong}>{t("À vérifier", "Check")}</span>{t(" : ", ": ")}{lower(say(lang, ask.check))}</span></p>} />
                </li>
              ))}
            </ol>
          </Chapter>
        )}

        {/* From one freelancer to another (19/11/2026): what works and what gets stuck, before the how-to. */}
        {advice && (
          <Chapter chapter="advice" width="wide" title={t("D'un free à l'autre", "From one freelancer to another")}>
            <AdviceText advice={advice} lang={lang} />
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
            {related}
          </Chapter>
        )}

        {/* 6. Footnotes: the sources on one line and « Signaler une erreur ». */}
        <Chapter chapter="annex" tone="notes" width="wide">
          <SourceLine lang={lang} publisher={sheet.publisher} sources={sheet.sources} reportHref={reportHref} />
          {advice && <SourceLine lang={lang} publisher={sheet.publisher} sources={advice.sources} label={t("Nos conseils viennent de :", "Our advice comes from:")} />}
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
function SourceLine({ lang, publisher, sources, reportHref, label }: { lang: Lang; publisher: string; sources: { label: string; url: string }[]; reportHref?: string; label?: string }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  return (
    <div className={styles.sourceLine} data-chapter-part="sources">
      <p className={styles.meta}>{label ?? t(`Sources, chez ${publisher} :`, `Sources, at ${publisher}:`)}</p>
      <ul className={styles.sourceLinks}>
        {sourceLinks(sources, lang).map((source) => (
          <li key={source.url}><a className={styles.sourceLink} href={source.url} target="_blank" rel="noopener noreferrer" title={source.title}>{source.label}<ExternalLink aria-hidden="true" /></a></li>
        ))}
        {reportHref && <li><a className={styles.sourceLink} href={reportHref}><Flag aria-hidden="true" />{t("Signaler une erreur", "Report an error")}</a></li>}
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
  const copyRows = sheet.install.filter(isCopyRow);
  const claudeCode = copyRows.find((row) => row.client === "claude-code" && row.type === "command");
  const vsCode = copyRows.find((row) => row.client === "vs-code" && row.type === "url" && row.value.startsWith("vscode:"))?.value ?? vsCodeInstallLink(sheet);
  const cursor = copyRows.find((row) => row.client === "cursor" && row.type === "url")?.value ?? cursorInstallLink(sheet);
  const claude = sheet.claude_directory?.url ?? copyRows.find((row) => row.client === "claude" && row.type === "url" && row.value.includes("claude.ai/directory"))?.value;
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
/** An assistant's or a client's mark, its logo once loaded (a pictogram otherwise); shared with the tool page's card. */
export function ClientMark({ client, size }: { client: ClientId; size: 14 | 16 | 20 }) {
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
  // Tabs (step 8c): the everyday assistants the vendor documents, then « Outil de code ▾ » for the rest; the remembered
  // choice opens on its own, so the reader sees their steps without deciding anything.
  const tabs = (main.length ? main : clients).map((client) => ({ value: client, label: clientLabel(client, lang), icon: <ClientMark client={client} size={20} /> }));
  const rest = main.length ? clients.filter((client) => !main.includes(client)) : [];
  const anyLabel = t("Adresse du serveur (autre outil)", "Server address (another tool)");
  return <>
    <Tabs label={t("Où utilisez-vous l'IA ?", "Where do you use AI?")} value={current} onChange={choose} tabs={tabs} panelId={`${sheet.slug}-steps`}
      {...(rest.length ? { more: { label: t("Outil de code", "Coding tool"), short: t("Code", "Code"), icon: <Code2 />, menuLabel: t("Outil de code", "Coding tool"), closeLabel: t("Fermer", "Close"),
        options: rest.map((client) => ({ value: client, label: client === "any" ? anyLabel : clientLabel(client, lang), ...(client === "any" ? { short: t("Adresse", "Address") } : {}), icon: <ClientMark client={client} size={20} /> })) } } : {})} />
    <div id={`${sheet.slug}-steps`} role="tabpanel" className={styles.plugPanel}>
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
    </div>
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

/**
 * A skill's sheet on the server sheet's chapter model (step 5, 17/11/2026): the head with « Pour développeurs » when it
 * needs a coding tool, what it teaches your assistant, how to add it (one card per tool, its command to copy), then the
 * page's « Pour aller plus loin » and the sources as notes.
 */
export function SkillSheetView({ skill, lang, logo, reportHref, related }: {
  skill: SkillSheet; lang: Lang;
  /** The tool's logo beside the title (the system's Logo, 40 px). */
  logo?: ReactNode;
  reportHref: string;
  /** The server and the tool, the vendor's other know-how (the page composes it). */
  related?: ReactNode;
}) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const agents = skill.agents.map((a) => (a === "any" ? t("tout assistant", "any assistant") : clientName(a, lang)));
  const everyone = forEveryone(skill);
  return (
    <div className={styles.sheet} data-agent-sheet="skill" data-audience={everyone ? "everyone" : "developers"}>
      <Chapters>
        <Chapter chapter="head" as="header">
          <div className={styles.titleRow}>
            {logo && <span className={styles.titleLogo} aria-hidden="true">{logo}</span>}
            <h1 className={styles.title}>{everyone ? skillTitle(skill, lang) : t(`${skillTitle(skill, lang)}, pour développeurs`, `${skillTitle(skill, lang)}, for developers`)}</h1>
          </div>
          {/* The technical name stays at hand (step 9): the slug the coding tool knows, copied in one click. */}
          {skill.display_name && <p className={styles.meta}>{t("Nom technique : ", "Technical name: ")}<CopyText value={skill.name} lang={lang} /></p>}
          <p className={styles.lead}>{everyone
            ? t(`Un savoir-faire officiel de ${skill.publisher}, sans rien installer : il vient avec le branchement.`, `Official know-how from ${skill.publisher}, nothing to install: it comes with the connection.`)
            : t(`Pour développeurs : un savoir-faire officiel de ${skill.publisher}, à installer dans votre outil de code.`, `For developers: official know-how from ${skill.publisher}, to install in your coding tool.`)}</p>
          <p className={styles.trust}>{t(`Officiel, publié par ${skill.publisher} · vérifié le ${longDate(skill.verified_on, lang)}`, `Official, published by ${skill.publisher} · checked on ${longDate(skill.verified_on, lang)}`)}</p>
        </Chapter>

        <Chapter chapter="teach" title={t("Ce qu'il apprend à votre assistant", "What it teaches your assistant")}>
          <p className={styles.reading}>{say(lang, skill.use_case ?? skill.summary)}</p>
          {/* A request to try once it is added, from the vendor's page (step 9). */}
          {skill.example && <Prompt text={say(lang, skill.example)} lang={lang} />}
          {skill.requires && <p className={styles.reading}><span className={styles.strong}>{t("Il vous faut : ", "You need: ")}</span>{lower(say(lang, skill.requires))}</p>}
        </Chapter>

        <Chapter chapter="plug" width="wide" title={t("L'ajouter", "Add it")}
          lead={everyone ? t(`Rien à installer : ${agents.join(", ")} le lit une fois ${skill.publisher} branché.`, `Nothing to install: ${agents.join(", ")} reads it once ${skill.publisher} is plugged in.`)
            : t(`Avec ${agents.join(", ")}, d'après l'éditeur.`, `With ${agents.join(", ")}, per the vendor.`)}>
          {skill.install.length > 0 && (
            <ul className={styles.steps}>
              {skill.install.map((row, index) => (
                <li key={index} className={styles.stepCard}>
                  <p className={styles.entryTitle}>{row.client === "any" ? t("Tout outil", "Any tool") : clientName(row.client, lang)}</p>
                  {row.type === "steps" ? <p className={styles.reading}>{say(lang, row.value)}</p> : <CopyBlock value={row.value} type={row.type} lang={lang}
                    label={{ url: t("Copier l'adresse", "Copy the address"), command: t("Copier la commande", "Copy the command"), config: t("Copier la configuration", "Copy the configuration"), steps: "" }[row.type]} />}
                </li>
              ))}
            </ul>
          )}
        </Chapter>

        {related && <Chapter chapter="further" width="wide" title={t("Pour aller plus loin", "Going further")}>{related}</Chapter>}

        <Chapter chapter="annex" tone="notes" width="wide">
          <SourceLine lang={lang} publisher={skill.publisher} sources={skill.sources} reportHref={reportHref} />
        </Chapter>
      </Chapters>
    </div>
  );
}




/** The list's order of risk: what deletes first, what only reads last. */
const LIST_ORDER = ["delete", "pay", "send", "write", "read"] as const;
type Kind = (typeof LIST_ORDER)[number];

const CONTROL_ICON = { account: <UserRound />, admin: <Settings2 />, cut: <LogOut />, confirm: <CheckCircle2 />, limit: <ShieldCheck />, read: <Eye />, cost: <Gauge />, log: <ListChecks /> } as const;
const KIND_ICON = { delete: <Trash2 />, pay: <CreditCard />, send: <Mail />, write: <Pencil />, read: <Eye /> } as const;

/**
 * One entry of « Garder la main », the same shape on both sides (step 8b, 18/11/2026): an icon in a round, its title on
 * the round's centre line, what follows aligned under the title, 8 below it.
 */
function Entry({ icon, title, titleId, alert = false, children }: { icon: ReactNode; title: string; titleId?: string; alert?: boolean; children?: ReactNode }) {
  return (
    <div className={styles.entry}>
      <span className={styles.entryIcon} data-alert={alert || undefined} aria-hidden="true">{icon}</span>
      <p id={titleId} className={styles.entryTitle}>{title}</p>
      {children && <div className={styles.entryBody}>{children}</div>}
    </div>
  );
}

/**
 * « Garder la main » (17/11, laid out again 18/11): « Ce qu'il peut faire », each consequence a real table of its
 * documented actions; « Vos garde-fous » beside it on a computer, or above it in one full row when there are one or two
 * (a short column floated beside a long table). The four distances of 09/11 inside the chapter: 24 from a column's
 * subtitle to its content, 8 from a note to what it annotates, 48 between two consequences; 96 only between chapters.
 */
function ControlColumns({ sheet, lang }: { sheet: McpSheet; lang: Lang }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const id = useId();
  const tools = sheet.tools ?? [];
  const kinds = LIST_ORDER.filter((kind) => sheet.capabilities?.some((line) => line.kind === kind) || tools.some((tool) => tool.kind === kind));
  const count = sheet.control?.length ?? 0;
  const few = count > 0 && count <= 2;
  // One table for every action of the server (step 8d, « aucune structure »): one head of columns, fixed columns, a
  // section per consequence opened by its own head row; a consequence without a documented list says its sentence.
  const sections = kinds.map((kind) => {
    const line = sheet.capabilities?.find((capability) => capability.kind === kind);
    const own = tools.filter((tool) => tool.kind === kind);
    const head = <span className={styles.sectionHead} data-alert={kind === "delete" || kind === "pay" || undefined}>
      {KIND_ICON[kind]}<span className={styles.strong}>{say(lang, CONSEQUENCE[kind])}</span>{own.length > 0 && <span className={styles.sectionCount}>{`· ${own.length}`}</span>}
      {kind === "read" && <span className={styles.sectionNote}>{t("Sans effet sur vos données", "No effect on your data")}</span>}
    </span>;
    const rows = own.length
      ? own.map((tool) => ({ key: tool.name, kind: tool.kind, cells: [say(lang, tool), <CopyText key={tool.name} value={tool.name} lang={lang} />] }))
      : line ? [{ key: `${kind}-line`, cells: [<span key="line" className={styles.text}>{raise(say(lang, line))}.</span>] }] : [];
    return { key: kind, group: kind, head, rows, visible: 6, hideLabel: t("Réduire", "Show less"),
      showLabel: (n: number) => t(`Voir ${n === 1 ? "l'autre action" : `les ${n} autres actions`}`, `Show ${n === 1 ? "the other action" : `the ${n} other actions`}`) };
  });
  const can = kinds.length > 0 && (
    <section className={styles.controlColumn} data-column="can" aria-labelledby={`${id}-can`}>
      <div className={styles.columnTop}>
        <h3 id={`${id}-can`} className={styles.columnHead}>{t("Ce qu'il peut faire", "What it can do")}</h3>
        {/* The grouped tools' note, once, under the title (8 below it). */}
        {sheet.tools_note && <p className={styles.meta}>{say(lang, sheet.tools_note)}</p>}
      </div>
      <Table labelledBy={`${id}-can`} columns={[t("Action", "Action"), t("Identifiant", "Identifier")]} sections={sections} />
      {tools.length > 0 && <p className={styles.meta}>{t("Les actions sont celles que l'éditeur documente.", "The actions are those the vendor documents.")}</p>}
    </section>
  );
  const safeguards = count > 0 && (
    <section className={styles.controlColumn} data-column="safeguards" data-few={few || undefined} aria-labelledby={`${id}-safe`}>
      <h3 id={`${id}-safe`} className={styles.columnHead}>{t("Vos garde-fous", "Your safeguards")}</h3>
      <div className={styles.safeguards}>
        {sheet.control!.map((item) => (
          <Entry key={item.fr} icon={CONTROL_ICON[item.icon]} title={say(lang, item.title)}>
            <p className={styles.text}>{raise(say(lang, item))}</p>
          </Entry>
        ))}
      </div>
    </section>
  );
  return <div className={styles.controlGrid} data-few={few || undefined}>{few ? <>{safeguards}{can}</> : <>{can}{safeguards}</>}</div>;
}

/**
 * « D'un free à l'autre » (19/11/2026, « mets-toi dans la peau d'un free qui explique »): a text, not two lists. The
 * introduction sets the scene in a peer's voice, then the tips and what gets stuck, each opened by its short title and
 * told in a sentence; a pitfall gives its way around. One reading column, like an article.
 */
function AdviceText({ advice, lang }: { advice: McpAdvice; lang: Lang }) {
  const t = (fr: string, en: string) => typo(lang === "en" ? en : fr);
  const id = useId();
  const community = <p className={styles.meta}>{t("D'après des retours d'utilisateurs", "From users' accounts")}</p>;
  return (
    <div className={styles.advice}>
      <p className={styles.adviceIntro}>{say(lang, advice.intro)}</p>
      <div className={styles.advicePoints}>
      <section className={styles.adviceGroup} data-column="tips" aria-labelledby={`${id}-tips`}>
        <h3 id={`${id}-tips`} className={styles.adviceHead}>{t("Ce qui marche", "What works")}</h3>
        <ul className={styles.adviceList}>
          {advice.tips.map((tip) => (
            <li key={tip.fr} className={styles.adviceItem}>
              <p className={styles.adviceTitle}>{say(lang, tip.title)}</p>
              <p className={styles.text}>{say(lang, tip)}</p>
              {tip.community && community}
            </li>
          ))}
        </ul>
      </section>
      <section className={styles.adviceGroup} data-column="pitfalls" aria-labelledby={`${id}-pitfalls`}>
        <h3 id={`${id}-pitfalls`} className={styles.adviceHead}>{t("Là où ça coince", "Where it gets stuck")}</h3>
        <ul className={styles.adviceList}>
          {advice.pitfalls.map((pitfall) => (
            <li key={pitfall.fr} className={styles.adviceItem}>
              <p className={styles.adviceTitle}>{say(lang, pitfall.title)}</p>
              <p className={styles.text}>{say(lang, pitfall)}{pitfall.workaround && <> <span className={styles.strong}>{t("La parade", "The way around")}</span>{t(" : ", ": ")}{lower(say(lang, pitfall.workaround))}</>}</p>
              {pitfall.community && community}
            </li>
          ))}
        </ul>
      </section>
      </div>
    </div>
  );
}
