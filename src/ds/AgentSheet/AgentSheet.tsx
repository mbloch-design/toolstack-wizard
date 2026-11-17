import { useId, useState, type ReactNode } from "react";
import type { AgentAccess } from "@/data/types";
import { Check, ChevronDown, Copy } from "@/lib/icons";
import {
  AUTH_WORDS, HOW_WORDS, KIND_WORDS, PLAN_WORDS, RISK_ORDER, SAFEGUARD_WORDS, TRANSPORT_WORDS, clientName, say,
  type InstallRow, type Lang, type McpSheet, type SkillSheet,
} from "@/lib/agents";
import { IconButton, LinkArrow, TextButton, linkClass } from "../Button/Button";
import { Collapse } from "../Motion/Motion";
import { agentVerdict, longDate } from "../AgentAccess/agentVerdict";
import styles from "./AgentSheet.module.css";

/*
 * A server or skill sheet of the agents section. The decision first (the verdict), then what the assistant can do,
 * riskiest first, how to plug it, the documented tools (folded), the plan and safeguards, the date and sources.
 * Facts come from the vendor's documentation; the words are ToolTrim's. No badge.
 */

/** The block shape the verdict speaks: one sheet as the tool page's agent block. */
export function sheetAsAccess(sheet: McpSheet): AgentAccess {
  return {
    mcp: "official", verifiedOn: sheet.verified_on, sources: sheet.sources,
    servers: [{ name: sheet.name, transport: sheet.transport, auth: sheet.auth, access: sheet.access, plan: sheet.plan, docsUrl: sheet.docs_url }],
    status: sheet.status, capabilities: sheet.capabilities, setup: sheet.setup, safeguards: sheet.safeguards,
  };
}

export function McpSheetView({ sheet, lang, related }: {
  sheet: McpSheet; lang: Lang;
  /** Links the page composes: the tool page, its skills, alternatives with a server. */
  related?: ReactNode;
}) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const capabilities = RISK_ORDER.flatMap((kind) => (sheet.capabilities ?? []).filter((line) => line.kind === kind));
  const facts: { label: string; value: string; detail?: string }[] = [
    ...(sheet.transport ? [{ label: t("Connexion", "Connection"), value: say(lang, TRANSPORT_WORDS[sheet.transport]) }] : []),
    ...(sheet.auth?.length ? [{ label: t("Identification", "Sign-in"), value: sheet.auth.map((a) => say(lang, AUTH_WORDS[a])).join(t(" ou ", " or ")) }] : []),
    { label: t("Forfait", "Plan"), value: say(lang, PLAN_WORDS[sheet.plan]), detail: sheet.plan_note ? say(lang, sheet.plan_note) : undefined },
    ...(sheet.safeguards ? [{ label: t("Garde-fous", "Safeguards"), value: sheet.safeguards.length ? sheet.safeguards.map((s) => say(lang, SAFEGUARD_WORDS[s])).join(", ") : t("Aucun documenté par l'éditeur", "None documented by the vendor") }] : []),
    ...(sheet.status ? [{ label: t("Statut", "Status"), value: sheet.status === "beta" ? t("Bêta", "Beta") : t("Disponible", "Generally available") }] : []),
  ];
  return (
    <div className={styles.sheet} data-agent-sheet="mcp">
      <div className={styles.lead}>
        <p className={styles.verdict}>{agentVerdict(sheetAsAccess(sheet), lang)}</p>
        <p className={styles.text}>{say(lang, sheet.summary)}</p>
        {sheet.note && <p className={styles.text}>{say(lang, sheet.note)}</p>}
      </div>

      {capabilities.length > 0 && (
        <Part title={t("Ce que l'assistant peut faire", "What the assistant can do")}>
          <Facts rows={capabilities.map((line) => ({ label: say(lang, KIND_WORDS[line.kind]), value: say(lang, line) }))} />
        </Part>
      )}

      <Part title={t("Le brancher", "Plug it in")}>
        {sheet.setup?.length ? <Facts rows={sheet.setup.map((way) => ({ label: way.assistant === "other" ? t("Autres assistants", "Other assistants") : clientName(way.assistant, lang), value: raise(say(lang, HOW_WORDS[way.how])) }))} /> : null}
        <Install rows={sheet.install} lang={lang} />
        {sheet.clients?.length ? <p className={styles.note}>{t("Clients cités par l'éditeur : ", "Clients the vendor names: ")}{sheet.clients.map((c) => clientName(c, lang)).join(", ")}.</p> : null}
      </Part>

      <Part title={t("Forfait, connexion et garde-fous", "Plan, connection and safeguards")}>
        <Facts rows={facts} />
      </Part>

      <ToolCatalog sheet={sheet} lang={lang} />

      {related}

      <Footer lang={lang} date={sheet.verified_on} docsUrl={sheet.docs_url} sources={sheet.sources} name={sheet.name} />
    </div>
  );
}

export function SkillSheetView({ skill, lang, related }: { skill: SkillSheet; lang: Lang; related?: ReactNode }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  return (
    <div className={styles.sheet} data-agent-sheet="skill">
      <div className={styles.lead}>
        <p className={styles.verdict}>{say(lang, skill.summary)}</p>
        <p className={styles.text}>{t(`Skill officiel publié par ${skill.publisher}.`, `Official skill published by ${skill.publisher}.`)}</p>
      </div>
      <Part title={t("Pour qui, avec quoi", "For whom, with what")}>
        <Facts rows={[
          { label: t("Agents", "Agents"), value: skill.agents.map((a) => clientName(a, lang)).join(", ") },
          ...(skill.requires ? [{ label: t("Prérequis", "Requires"), value: say(lang, skill.requires) }] : []),
        ]} />
      </Part>
      <Part title={t("L'installer", "Install it")}>
        {skill.install.length ? <Install rows={skill.install} lang={lang} anyLabel={t("Tout agent", "Any agent")} /> : <p className={styles.text}>{t("Rien à installer : le skill vit dans votre espace, lu par l'assistant connecté.", "Nothing to install: the skill lives in your workspace, read by the connected assistant.")}</p>}
      </Part>
      {related}
      <Footer lang={lang} date={skill.verified_on} docsUrl={skill.docs_url} sources={skill.sources} name={skill.name} />
    </div>
  );
}

const raise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function Part({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return <section className={styles.part} aria-labelledby={id}><h2 id={id} className={styles.partTitle}>{title}</h2>{children}</section>;
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

/** Install lines copied from the vendor's documentation, never composed; each one can be copied. */
function Install({ rows, lang, anyLabel }: { rows: InstallRow[]; lang: Lang; anyLabel?: string }) {
  if (!rows.length) return null;
  return (
    <ul className={styles.install}>
      {rows.map((row, index) => <InstallLine key={index} row={row} lang={lang} anyLabel={anyLabel} />)}
    </ul>
  );
}

function InstallLine({ row, lang, anyLabel }: { row: InstallRow; lang: Lang; anyLabel?: string }) {
  const who = row.client === "any" && anyLabel ? anyLabel : clientName(row.client, lang);
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const [copied, setCopied] = useState(false);
  const kind = { command: t("commande", "command"), url: t("adresse", "address"), config: t("configuration", "configuration"), steps: t("étapes", "steps") }[row.type];
  const copy = () => {
    void navigator.clipboard?.writeText(row.value).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); });
  };
  return (
    <li className={styles.installRow}>
      <p className={styles.installHead}><span className={styles.term}>{who}</span><span className={styles.note}>{kind}</span></p>
      <div className={styles.code}>
        <pre className={styles.pre} data-type={row.type} {...(row.type === "steps" ? {} : { tabIndex: 0, "aria-label": `${clientName(row.client, lang)}, ${kind}` })}>{row.value}</pre>
        {row.type !== "steps" && (
          <IconButton size={32} tone="quiet" icon={copied ? <Check /> : <Copy />} label={copied ? t("Copié", "Copied") : t(`Copier : ${clientName(row.client, lang)}`, `Copy: ${clientName(row.client, lang)}`)} onClick={copy} />
        )}
      </div>
    </li>
  );
}

/** The documented tools, folded: their exact names, grouped by risk, with ToolTrim's one line. */
function ToolCatalog({ sheet, lang }: { sheet: McpSheet; lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const [open, setOpen] = useState(false);
  const panel = useId();
  const tools = sheet.tools ?? [];
  if (!tools.length && !sheet.tools_note) return null;
  const groups = RISK_ORDER.map((kind) => ({ kind, items: tools.filter((tool) => tool.kind === kind) })).filter((g) => g.items.length);
  return (
    <Part title={t(`Outils documentés par l'éditeur (${tools.length})`, `Tools documented by the vendor (${tools.length})`)}>
      {sheet.tools_note && <p className={styles.text}>{say(lang, sheet.tools_note)}</p>}
      {tools.length > 0 && <>
        <TextButton aria-expanded={open} aria-controls={panel} onClick={() => setOpen((v) => !v)}>
          {open ? t("Replier la liste", "Fold the list") : t("Voir la liste", "Show the list")}<span className={styles.chevron} data-open={open || undefined} aria-hidden="true"><ChevronDown /></span>
        </TextButton>
        <div id={panel}>
          <Collapse open={open}>
            <div className={styles.toolGroups}>
              {groups.map((group) => (
                <section key={group.kind} className={styles.toolGroup} aria-label={say(lang, KIND_WORDS[group.kind])}>
                  <p className={styles.term}>{say(lang, KIND_WORDS[group.kind])} · {group.items.length}</p>
                  <ul className={styles.tools}>
                    {group.items.map((tool) => (
                      <li key={tool.name} className={styles.tool}><span className={styles.toolName}>{tool.name}</span><span className={styles.note}>{say(lang, tool)}</span></li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Collapse>
        </div>
      </>}
    </Part>
  );
}

function Footer({ lang, date, docsUrl, sources, name }: { lang: Lang; date: string; docsUrl: string; sources: { label: string; url: string }[]; name: string }) {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  return (
    <footer className={styles.footer}>
      <a className={linkClass()} href={docsUrl} target="_blank" rel="noopener noreferrer" aria-label={t(`Documentation de l'éditeur : ${name}`, `Vendor documentation: ${name}`)}>
        {t("Documentation de l'éditeur", "Vendor documentation")}<LinkArrow />
      </a>
      <p className={styles.note}>{t(`Vérifié le ${longDate(date, lang)} sur la documentation de l'éditeur. Textes de ToolTrim, sans reprise d'autres annuaires.`, `Checked on ${longDate(date, lang)} against the vendor's documentation. Words by ToolTrim, nothing copied from other directories.`)}</p>
      <ul className={styles.sources} aria-label={t("Sources", "Sources")}>
        {sources.map((source) => <li key={source.url}><a className={linkClass("quiet")} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}
      </ul>
    </footer>
  );
}
