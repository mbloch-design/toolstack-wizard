import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Clock, Copy, ExternalLink, Flag, Globe, Laptop2, UserRound } from "@/lib/icons";
import {
  KIND_WORDS, authWords, PLAN_WORDS, RISK_ORDER, SAFEGUARD_WORDS, TRANSPORT_WORDS, clientName, riskSentence, say,
  type InstallRow, type Lang, type McpSheet, type SkillSheet,
} from "@/lib/agents";
import { CLIENTS, clientGroup, clientLabel, clientsOf, cursorInstallLink, plugCard, vsCodeInstallLink, type ClientId, type PlugStep } from "@/lib/agentClients";
import { RISK_PILL, freshness, sheetMarkdown, sourceLinks, toolTopics, toolsSummary } from "@/lib/agentSheet";
import Button, { LinkArrow, TextButton, buttonAttrs, linkClass } from "../Button/Button";
import Chip from "../Chip/Chip";
import Logo from "../Logo/Logo";
import Tag from "../Tag/Tag";
import Tooltip from "../Tooltip/Tooltip";
import { Collapse } from "../Motion/Motion";
import { longDate } from "../AgentAccess/agentVerdict";
import styles from "./AgentSheet.module.css";

/*
 * A server or skill sheet of the agents section, told as a story (S1 bis, 17/11/2026). Under the title, a line of
 * facts and « Copier pour votre assistant ». Then what it changes for you, our view, « Brancher Notion » for the
 * place you use AI (one card, four steps at most, a named copy), what it can do and how to stay in control; the
 * technical sheet folded; the sources. Facts come from the vendor's documentation; the requests and the view are
 * ToolTrim's, written from the documented tools only. Functions inspired by other directories, never their words.
 */

const KINDS = ["read", "write", "delete", "send", "pay"] as const;
/** The risk follows the capability lines shown in the chapter; the tools only when the vendor gives none. */
const kindsOf = (sheet: McpSheet) => KINDS.filter((kind) => (sheet.capabilities?.length ? sheet.capabilities : sheet.tools ?? []).some((line) => line.kind === kind));
const raise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const STORE_KEY = "tooltrim.agents.client";

export function McpSheetView({ sheet, lang, toolName = sheet.publisher, pageUrl, reportHref, related, localLogos = false }: {
  sheet: McpSheet; lang: Lang;
  /** Our own logo files only (Storybook, visual tests). */
  localLogos?: boolean;
  /** The tool's catalogue name (« Notion »), said in the steps and titles. */
  toolName?: string;
  /** The sheet's public address, given in the Markdown copy. */
  pageUrl: string;
  /** « Signaler une erreur »: the contact page with the sheet in context. */
  reportHref: string;
  /** Links the page composes: the tool, its skills, alternatives with a server. */
  related?: ReactNode;
}) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const capabilities = RISK_ORDER.flatMap((kind) => (sheet.capabilities ?? []).filter((line) => line.kind === kind));
  const control = [
    ...capabilities.map((line) => ({ label: say(lang, KIND_WORDS[line.kind]), value: say(lang, line) })),
    ...(sheet.safeguards ? [{ label: t("Garde-fous", "Safeguards"), value: sheet.safeguards.length ? raise(sheet.safeguards.map((s) => say(lang, SAFEGUARD_WORDS[s])).join(", ")) : t("Aucun documenté par l'éditeur", "None documented by the vendor") }] : []),
    { label: t("Forfait", "Plan"), value: say(lang, PLAN_WORDS[sheet.plan]), detail: sheet.plan_note ? say(lang, sheet.plan_note) : undefined },
    ...(sheet.status === "beta" ? [{ label: t("Statut", "Status"), value: t("En bêta chez l'éditeur", "In beta at the vendor") }] : []),
  ];
  const served = new Set<string>(clientsOf(sheet));
  const others = (sheet.clients ?? []).filter((client) => !served.has(client));
  const technical = [
    ...(sheet.access ? [{ label: t("Accès maximum", "Widest access"), value: { read: t("Lecture seule", "Read only"), read_write: t("Lecture et écriture, dans la limite de vos droits", "Read and write, within your rights"), docs_only: t("Documentation seulement", "Documentation only") }[sheet.access] }] : []),
    // « Fonctionne avec », in the facts line, already names the clients a card serves: only the others here.
    ...(others.length ? [{ label: t("Autres assistants cités par l'éditeur", "Other assistants the vendor names"), value: others.map((c) => clientName(c, lang)).join(", ") }] : []),
  ];
  return (
    <div className={styles.sheet} data-agent-sheet="mcp">
      <div className={styles.head}>
        <SheetFacts sheet={sheet} lang={lang} localLogos={localLogos} />
        <CopyMenu sheet={sheet} lang={lang} toolName={toolName} pageUrl={pageUrl} />
      </div>
      <div className={styles.lead}>
        <p className={styles.text}>{say(lang, sheet.summary)}</p>
        {sheet.note && <p className={styles.text}>{say(lang, sheet.note)}</p>}
      </div>

      {sheet.examples?.length ? (
        <Part chapter="change" title={t("Ce que ça change pour vous", "What it changes for you")}>
          <p className={styles.term}>{t("Vous pourrez lui demander", "You could ask it")}</p>
          <ul className={styles.requests}>
            {sheet.examples.map((example) => <li key={example.fr} className={styles.request}>{t(`« ${example.fr} »`, `“${example.en}”`)}</li>)}
          </ul>
        </Part>
      ) : null}

      {sheet.for && sheet.not_for && (
        <Part chapter="view" title={t("Notre avis", "Our view")}>
          <Facts rows={[
            { label: t("Utile si", "Useful if"), value: raise(say(lang, sheet.for)) },
            { label: t("Moins utile si", "Less useful if"), value: raise(say(lang, sheet.not_for)) },
          ]} />
        </Part>
      )}

      <Part chapter="plug" title={t(`Brancher ${toolName}`, `Plug in ${toolName}`)}>
        <PlugChapter sheet={sheet} lang={lang} toolName={toolName} />
      </Part>

      <Part chapter="control" title={t("Ce qu'il peut faire, et comment garder la main", "What it can do, and how to stay in control")}>
        <p className={styles.text}>{riskSentence({ kinds: kindsOf(sheet), safeguards: sheet.safeguards, status: sheet.status }, lang)}</p>
        <Facts rows={control} />
        <p className={styles.note}>{t("L'assistant n'a jamais plus de droits que votre compte.", "The assistant never has more rights than your account.")}</p>
      </Part>

      {related}

      <Further lang={lang}>
        {technical.length > 0 && <Facts rows={technical} />}
        <ToolList sheet={sheet} lang={lang} />
      </Further>

      <Sources lang={lang} date={sheet.verified_on} publisher={sheet.publisher} sources={sheet.sources} reportHref={reportHref} />
    </div>
  );
}

/** Under the title: when it was checked, how it connects, which account, and where it works. Said once. */
function SheetFacts({ sheet, lang, localLogos }: { sheet: McpSheet; lang: Lang; localLogos: boolean }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const works = clientsOf(sheet).filter((client) => client !== "any");
  return (
    <ul className={styles.factLine} aria-label={t("En bref", "At a glance")}>
      <li className={styles.fact}><Clock aria-hidden="true" />{t(`Vérifié le ${longDate(sheet.verified_on, lang)}`, `Checked on ${longDate(sheet.verified_on, lang)}`)}</li>
      {sheet.transport && <li className={styles.fact}>{sheet.transport === "local" ? <Laptop2 aria-hidden="true" /> : <Globe aria-hidden="true" />}{say(lang, TRANSPORT_WORDS[sheet.transport])}</li>}
      {sheet.auth?.length ? <li className={styles.fact}><UserRound aria-hidden="true" />{authWords(sheet.auth, lang)}</li> : null}
      {works.length > 0 && (
        <li className={styles.fact}>
          <span>{t("Fonctionne avec", "Works with")}</span>
          <span className={styles.faces}>
            {works.map((client) => (
              <Tooltip key={client} label={clientLabel(client, lang)}>
                <span className={styles.face} tabIndex={0}><Logo tool={{ name: clientLabel(client, lang), slug: client, websiteUrl: CLIENTS[client].site }} size={24} localOnly={localLogos} /><span className={styles.srOnly}>{clientLabel(client, lang)}</span></span>
              </Tooltip>
            ))}
          </span>
        </li>
      )}
    </ul>
  );
}

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
  const entries: { label: string; run?: () => void; href?: string }[] = [
    { label: t("Copier la fiche en Markdown", "Copy the sheet as Markdown"), run: () => copy(sheetMarkdown(sheet, { toolName, url: pageUrl, lang }), t("Fiche copiée", "Sheet copied")) },
    ...(claudeCode ? [{ label: t("Copier la commande pour Claude Code", "Copy the Claude Code command"), run: () => copy(claudeCode.value, t("Commande copiée", "Command copied")) }] : []),
    ...(vsCode ? [{ label: t("Brancher à VS Code", "Plug into VS Code"), href: vsCode }] : []),
    ...(cursor ? [{ label: t("Brancher à Cursor", "Plug into Cursor"), href: cursor }] : []),
  ];
  return (
    <div className={styles.menuRoot} ref={root}>
      <Button variant="secondary" icon={<Copy />} aria-expanded={open} aria-controls={menu} onClick={() => setOpen((v) => !v)}>
        {t("Copier pour votre assistant", "Copy for your assistant")}<span className={styles.chevron} data-open={open || undefined} aria-hidden="true"><ChevronDown /></span>
      </Button>
      {open && (
        <ul id={menu} className={styles.menu}>
          {entries.map((entry) => (
            <li key={entry.label}>
              {entry.href
                ? <a className={styles.menuItem} href={entry.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>{entry.label}<ExternalLink aria-hidden="true" /></a>
                : <button type="button" className={styles.menuItem} onClick={entry.run}>{entry.label}</button>}
            </li>
          ))}
        </ul>
      )}
      <span className={styles.srOnly} aria-live="polite">{said}</span>
      {said && <span className={styles.done} aria-hidden="true"><Check />{said}</span>}
    </div>
  );
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
        <Further lang={lang}>
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

function Part({ chapter, title, children }: { chapter: string; title: string; children: ReactNode }) {
  const id = useId();
  return <section className={styles.part} aria-labelledby={id} data-chapter={chapter}><h2 id={id} className={styles.partTitle}>{title}</h2>{children}</section>;
}

/** « Pour aller plus loin »: the technical sheet, folded at the end. */
function Further({ lang, children }: { lang: Lang; children: ReactNode }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <Part chapter="further" title={t("Pour aller plus loin", "Going further")}>
      <div className={styles.toggle}>
        <TextButton aria-expanded={open} aria-controls={panel} onClick={() => setOpen((v) => !v)}>
          {open ? t("Replier la fiche technique", "Fold the technical sheet") : t("Déplier la fiche technique", "Show the technical sheet")}<span className={styles.chevron} data-open={open || undefined} aria-hidden="true"><ChevronDown /></span>
        </TextButton>
      </div>
      <div id={panel}>
        <Collapse open={open}><div className={styles.further}>{children}</div></Collapse>
      </div>
    </Part>
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

/** The documented tools by topic (ToolTrim's classification): the action in words, its risk, the technical name small. */
function ToolList({ sheet, lang }: { sheet: McpSheet; lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const tools = sheet.tools ?? [];
  if (!tools.length && !sheet.tools_note) return null;
  return (
    <div className={styles.group}>
      <p className={styles.term}>{t("Les actions documentées par l'éditeur", "The actions the vendor documents")}</p>
      {sheet.tools_note && <p className={styles.text}>{say(lang, sheet.tools_note)}</p>}
      {tools.length > 0 && <>
        <p className={styles.text}>{toolsSummary(tools, lang)}.</p>
        <div className={styles.topics}>{toolTopics(tools).map((topic) => <ToolTopicGroup key={topic.id} topic={topic} lang={lang} />)}</div>
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
  const lines = (
    <ul className={styles.tools}>
      {topic.tools.map((tool) => (
        <li key={tool.name} className={styles.tool}>
          <span className={styles.toolAction}>{say(lang, tool)}</span>
          {RISK_PILL[tool.kind] && <Tag on="tile" tone={tool.kind === "pay" || tool.kind === "delete" ? "overlap" : "neutral"}>{say(lang, RISK_PILL[tool.kind]!)}</Tag>}
          <code className={styles.toolName}>{tool.name}</code>
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

/** « Sources »: when and where we checked, short links with their site, and a way to report an error. Lighter than a chapter. */
function Sources({ lang, date, publisher, sources, reportHref }: { lang: Lang; date: string; publisher: string; sources: { label: string; url: string }[]; reportHref: string }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  // The age is said once the page runs in the reader's browser: a prerendered page cannot know today's date.
  const [age, setAge] = useState("");
  useEffect(() => setAge(freshness(date, new Date(), lang)), [date, lang]);
  const id = useId();
  return (
    <section className={styles.sourcesBlock} aria-labelledby={id} data-chapter="sources">
      <h2 id={id} className={styles.sourcesTitle}>Sources</h2>
      <p className={styles.note}>{t(`Vérifié le ${longDate(date, lang)} chez ${publisher}`, `Checked on ${longDate(date, lang)} with ${publisher}`)}{age && ` (${age})`}.</p>
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
