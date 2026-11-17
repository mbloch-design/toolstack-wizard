import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Code2, Copy, ExternalLink, FileText, Flag, Plug, X } from "@/lib/icons";
import { getToolLogoSources } from "@/lib/toolLogos";
import {
  clientName, say,
  type InstallRow, type Lang, type McpSheet, type SkillSheet,
} from "@/lib/agents";
import { CLIENTS, CLIENT_MARKS, clientGroup, clientLabel, clientsOf, cursorInstallLink, plugCard, vsCodeInstallLink, type ClientId, type PlugStep } from "@/lib/agentClients";
import { hookSentence, sheetMarkdown, sourceLinks, toolTopics, toolsSummary } from "@/lib/agentSheet";
import Button, { LinkArrow, TextButton, buttonAttrs, linkClass } from "../Button/Button";
import Chip, { Chips } from "../Chip/Chip";
import Tag from "../Tag/Tag";
import { Collapse } from "../Motion/Motion";
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
const ABILITY_TAG = { read: ["Lit", "Reads"], write: ["Modifie", "Edits"], delete: ["Supprime", "Deletes"], send: ["Envoie", "Sends"], pay: ["Paie", "Pays"] } as const;


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
  /** Links the page composes: the tool, its skills, alternatives with a server. */
  related?: ReactNode;
}) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const capabilities = LIST_ORDER.flatMap((kind) => (sheet.capabilities ?? []).filter((line) => line.kind === kind));
  const plugId = `${sheet.slug}-brancher`;
  return (
    <div className={styles.sheet} data-agent-sheet="mcp">
      {/* A calm head, one left edge: logo and title, the hook, the actions, the trust line (17/11). */}
      <header className={styles.head} data-chapter="head">
        <div className={styles.titleRow}>
          {logo && <span className={styles.titleLogo} aria-hidden="true">{logo}</span>}
          <h1 className={styles.title}>{title}</h1>
        </div>
        <p className={styles.lead}>{hookSentence(sheet, toolName, lang)}</p>
        {sheet.note && <p className={styles.text}>{say(lang, sheet.note)}</p>}
        <div className={styles.actions}>
          <CopyMenu sheet={sheet} lang={lang} toolName={toolName} pageUrl={pageUrl} />
          <a className={linkClass()} href={`#${plugId}`}>{t("Voir les étapes", "See the steps")} <span aria-hidden="true">↓</span></a>
        </div>
        <p className={styles.trust}>{t(`Officiel, publié par ${sheet.publisher} · vérifié le ${longDate(sheet.verified_on, lang)}`, `Official, published by ${sheet.publisher} · checked on ${longDate(sheet.verified_on, lang)}`)}</p>
      </header>

      {sheet.examples?.length ? (
        <Part chapter="change" tone="plain" title={t("Ce que ça change pour vous", "What it changes for you")}>
          <ul className={styles.requests}>
            {sheet.examples.map((example) => <li key={example.fr} className={styles.request}>{t(`« ${example.fr} »`, `“${example.en}”`)}</li>)}
          </ul>
        </Part>
      ) : null}

      <Part chapter="plug" id={plugId} title={t(`Brancher ${toolName}`, `Plug in ${toolName}`)}>
        <PlugChapter sheet={sheet} lang={lang} toolName={toolName} />
      </Part>

      {sheet.first_requests && (
        <Part chapter="first" tone="plain" title={t("Vos premières demandes", "Your first requests")}>
          <p className={styles.text}>{t("Commencez par des demandes qui ne font que lire ; passez à l'écriture une fois rassuré.", "Start with requests that only read; move on to writing once reassured.")}</p>
          <ul className={styles.firsts}>
            {sheet.first_requests.read.map((ask) => (
              <li key={ask.fr} className={styles.first}><span className={styles.firstWords}>{t(`« ${ask.fr} »`, `“${ask.en}”`)}</span><span className={styles.firstTag}><Tag on="tile" tone="neutral">{say(lang, ABILITY_TAG.read)}</Tag></span></li>
            ))}
            {sheet.first_requests.write && (
              <li className={styles.first}>
                <span className={styles.firstWords}>
                  <span>{t(`« ${sheet.first_requests.write.ask.fr} »`, `“${sheet.first_requests.write.ask.en}”`)}</span>
                  <span className={styles.firstCheck}>{t("À vérifier : ", "Check: ")}{lower(say(lang, sheet.first_requests.write.check))}</span>
                </span>
                <span className={styles.firstTag}><Tag on="tile" tone="neutral">{say(lang, ABILITY_TAG.write)}</Tag></span>
              </li>
            )}
          </ul>
        </Part>
      )}

      {sheet.troubleshoot && (
        <Part chapter="help" tone="plain" title={t("Si ça ne marche pas", "If it does not work")}>
          <ul className={styles.sentences}>{sheet.troubleshoot.map((line) => <li key={line.fr} className={styles.text}>{say(lang, line)}</li>)}</ul>
        </Part>
      )}

      <Part chapter="control" tone="plain" title={t("Ce qu'il peut faire, et comment garder la main", "What it can do, and how to stay in control")}>
        {capabilities.length > 0 && (
          <div className={styles.question}>
            <h3 className={styles.questionTitle}>{t("Ce qu'il peut faire chez vous", "What it can do in your account")}</h3>
            <ul className={styles.abilities}>
              {capabilities.map((line) => (
                <li key={line.en} className={styles.ability}>
                  <Tag on="card" tone={line.kind === "pay" || line.kind === "delete" ? "overlap" : "neutral"}>{say(lang, ABILITY_TAG[line.kind])}</Tag>
                  <span className={styles.text}>{t(`Il peut ${lower(line.fr)}.`, `It can ${lower(line.en)}.`)}</span>
                </li>
              ))}
            </ul>
            {sheet.status === "beta" && <p className={styles.text}>{t("Le service est encore en bêta chez l'éditeur.", "The service is still in beta at the vendor.")}</p>}
          </div>
        )}
        {sheet.control && (
          <div className={styles.question}>
            <h3 className={styles.questionTitle}>{t("Comment garder la main", "How to stay in control")}</h3>
            <ul className={styles.sentences}>{sheet.control.map((line) => <li key={line.fr} className={styles.text}>{say(lang, line)}</li>)}</ul>
          </div>
        )}
        {sheet.plan_words?.advanced && (
          <div className={styles.question}>
            <h3 className={styles.questionTitle}>{t("Quel forfait", "Which plan")}</h3>
            <p className={styles.text}>{say(lang, sheet.plan_words.common)} {say(lang, sheet.plan_words.advanced)}</p>
          </div>
        )}
        <p className={styles.text}>{t("L'assistant n'a jamais plus de droits que votre compte.", "The assistant never has more rights than your account.")}</p>
      </Part>

      {sheet.for && sheet.not_for && (
        <Part chapter="view" tone="plain" title={t("Notre avis", "Our view")}>
          <div className={styles.view}>
            <div className={styles.viewSide} data-side="yes"><p className={styles.viewHead}><span className={styles.viewMark} aria-hidden="true"><Check /></span>{t("Utile si", "Useful if")}</p><p className={styles.text}>{raise(say(lang, sheet.for))}</p></div>
            <div className={styles.viewSide} data-side="no"><p className={styles.viewHead}><span className={styles.viewMark} aria-hidden="true"><X /></span>{t("Moins utile si", "Less useful if")}</p><p className={styles.text}>{raise(say(lang, sheet.not_for))}</p></div>
          </div>
        </Part>
      )}

      {related}

      {sheet.tools?.length || sheet.tools_note ? (
        <Further lang={lang} title={t("Les actions documentées", "The documented actions")} summary={sheet.tools?.length ? toolsSummary(sheet.tools, lang) : t("Liste non publiée par l'éditeur", "List not published by the vendor")}>
          <ToolList sheet={sheet} lang={lang} />
        </Further>
      ) : null}

      <Sources lang={lang} publisher={sheet.publisher} sources={sheet.sources} reportHref={reportHref} />
    </div>
  );
}

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** « Copier pour votre assistant »: only what this sheet can serve, each entry checked on the client's documentation. */
function CopyMenu({ sheet, lang, toolName, pageUrl }: { sheet: McpSheet; lang: Lang; toolName: string; pageUrl: string }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const menu = useId();
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, [open]);
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
  return (
    <div className={styles.menuRoot} ref={root}>
      <Button variant="primary" icon={<Copy />} aria-expanded={open} aria-controls={menu} onClick={() => setOpen((v) => !v)}>
        {t("Copier pour votre assistant", "Copy for your assistant")}<span className={styles.chevron} data-open={open || undefined} aria-hidden="true"><ChevronDown /></span>
      </Button>
      {open && (
        <ul id={menu} className={styles.menu}>
          {entries.map((entry) => (
            <li key={entry.label}>
              {entry.href
                ? <a className={styles.menuItem} href={entry.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><MenuEntry {...entry} /><ExternalLink aria-hidden="true" /></a>
                : <button type="button" className={styles.menuItem} onClick={entry.run}><MenuEntry {...entry} /></button>}
            </li>
          ))}
        </ul>
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

/** « Où utilisez-vous l'IA ? », then one card for that place. The choice follows the reader from sheet to sheet. */
function PlugChapter({ sheet, lang, toolName }: { sheet: McpSheet; lang: Lang; toolName: string }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const clients = clientsOf(sheet);
  const [current, setCurrent] = useState<ClientId | undefined>(clients[0]);
  const whereId = useId();
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
    return <p className={styles.text}>{t(`${toolName} ne détaille pas son branchement : suivez sa documentation, en lien dans les sources.`, `${toolName} does not detail its setup: follow its documentation, linked in the sources.`)}</p>;
  }
  const of = (group: "assistant" | "dev" | "other") => clients.filter((client) => clientGroup(client) === group);
  const chip = (client: ClientId) => <Chip key={client} size="md" pressed={client === current} onClick={() => choose(client)}>{clientLabel(client, lang)}</Chip>;
  const front = [...of("assistant"), ...of("other")];
  const steps = plugCard(sheet, current, toolName, lang);
  return <>
    <div className={styles.choices}>
      <p className={styles.term} id={whereId}>{t("Où utilisez-vous l'IA ?", "Where do you use AI?")}</p>
      {front.length > 0 && <div className={styles.rail} role="group" aria-labelledby={whereId}>{front.map(chip)}</div>}
      {of("dev").length > 0 && (
        <div className={styles.rail} role="group" aria-label={t("Outils de développeur", "Developer tools")}>
          <span className={styles.railLabel} aria-hidden="true">{t("Outils de développeur", "Developer tools")}</span>{of("dev").map(chip)}
        </div>
      )}
    </div>
    <PlugCard steps={steps} lang={lang} />
    {CLIENTS[current].source && steps.some((step) => step.action?.kind === "copy") && <p className={styles.note}>{t("Où coller : d'après la documentation de ", "Where to paste: from the documentation of ")}<a className={linkClass("inline")} href={CLIENTS[current].source} target="_blank" rel="noopener noreferrer">{clientLabel(current, lang)}</a>.</p>}
  </>;
}

function PlugCard({ steps, lang }: { steps: PlugStep[]; lang: Lang }) {
  return (
    <ol className={styles.card}>
      {steps.map((step) => (
        <li key={step.text} className={styles.step}>
          <span className={styles.stepText}>{step.text}</span>
          {step.action?.kind === "open" && <a {...buttonAttrs("primary")} href={step.action.href} target="_blank" rel="noopener noreferrer">{step.action.label}</a>}
          {step.action?.kind === "copy" && <CopyBlock value={step.action.value} type={step.action.type} label={step.action.label} lang={lang} />}
        </li>
      ))}
    </ol>
  );
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
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
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
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <section className={styles.furtherBlock} data-chapter="further">
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

/**
 * The documented tools by topic (ToolTrim's classification), filtered by risk. Each action is a row of its own:
 * the action in words over the vendor's technical name, and its tag in one column aligned down the list
 * (reading tagged too, so the eye compares). Rows are white objects on the tile, never separated by a rule.
 */
function ToolList({ sheet, lang }: { sheet: McpSheet; lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const tools = sheet.tools ?? [];
  const [kind, setKind] = useState<Kind | "all">("all");
  if (!tools.length && !sheet.tools_note) return null;
  const kinds = LIST_ORDER.filter((k) => tools.some((tool) => tool.kind === k));
  const shown = kind === "all" ? tools : tools.filter((tool) => tool.kind === kind);
  return (
    <div className={styles.group}>
      {sheet.tools_note && <p className={styles.text}>{say(lang, sheet.tools_note)}</p>}
      {tools.length > 0 && <>
        {kinds.length > 1 && (
          <Chips label={t("Filtrer par risque", "Filter by risk")}>
            <Chip pressed={kind === "all"} count={tools.length} onClick={() => setKind("all")}>{t("Tout", "All")}</Chip>
            {kinds.map((k) => <Chip key={k} pressed={kind === k} count={tools.filter((tool) => tool.kind === k).length} onClick={() => setKind(k)}>{say(lang, ABILITY_TAG[k])}</Chip>)}
          </Chips>
        )}
        <div className={styles.topics}>{toolTopics(shown).map((topic) => <ToolTopicGroup key={`${kind}-${topic.id}`} topic={topic} lang={lang} />)}</div>
        <p className={styles.note}>{t("Le classement par sujet est celui de ToolTrim ; les noms techniques sont ceux de l'éditeur.", "The grouping by topic is ToolTrim's; the technical names are the vendor's.")}</p>
      </>}
    </div>
  );
}

function ToolTopicGroup({ topic, lang }: { topic: ReturnType<typeof toolTopics>[number]; lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const long = topic.tools.length > 5;
  const [open, setOpen] = useState(!long);
  const panel = useId();
  const ordered = [...topic.tools].sort((a, b) => LIST_ORDER.indexOf(a.kind as Kind) - LIST_ORDER.indexOf(b.kind as Kind));
  const lines = (
    <ul className={styles.tools}>
      {ordered.map((tool) => (
        <li key={tool.name} className={styles.tool} data-kind={tool.kind}>
          <span className={styles.toolWords}>
            <span className={styles.toolAction}>{say(lang, tool)}</span>
            <code className={styles.toolName}>{tool.name}</code>
          </span>
          <span className={styles.toolRisk}>
            <Tag on="card" tone={tool.kind === "pay" || tool.kind === "delete" ? "overlap" : "neutral"}>{say(lang, ABILITY_TAG[tool.kind])}</Tag>
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <section className={styles.topic} aria-label={say(lang, topic.words)}>
      <p className={styles.topicHead}><span className={styles.topicTitle}>{say(lang, topic.words)}</span><span className={styles.note}>{topic.tools.length}</span></p>
      {long ? <>
        <div className={styles.toggle}>
          <TextButton tone="quiet" aria-expanded={open} aria-controls={panel} onClick={() => setOpen((v) => !v)}>
            {open ? t("Replier", "Fold") : t(`Voir les ${topic.tools.length} actions`, `Show the ${topic.tools.length} actions`)}<span className={styles.chevron} data-open={open || undefined} aria-hidden="true"><ChevronDown /></span>
          </TextButton>
        </div>
        <div id={panel}><Collapse open={open}>{lines}</Collapse></div>
      </> : lines}
    </section>
  );
}

/** « Sources »: the vendor's pages as short links with their site, and a way to report an error. Lighter than a chapter;
    the date is said once, in the head's trust line. */
function Sources({ lang, date, publisher, sources, reportHref }: { lang: Lang;
  /** The skill sheet, which has no trust line, says its date here; the server sheet says it in its head. */
  date?: string; publisher: string; sources: { label: string; url: string }[]; reportHref: string }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
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
