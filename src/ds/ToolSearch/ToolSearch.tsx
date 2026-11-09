import type { KeyboardEvent, ReactNode, Ref } from "react";
import Logo from "../Logo/Logo";
import { IconButton } from "../Button/Button";
import type { LogoTool } from "@/lib/useToolLogoSource";
import styles from "./ToolSearch.module.css";

const icon = (d: string) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
const SEARCH = "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4.2-4.2";
const CLOSE = "M6 6l12 12M18 6L6 18";
const PLUS = "M12 5v14M5 12h14";
const CHECK = "M5 12.5l4.5 4.5L19 7.5";

/** A search field on a pill: the loupe, the input, a way to close. */
export function SearchField({ inputRef, id, value, onChange, placeholder, label, onClose, closeLabel }: {
  inputRef?: Ref<HTMLInputElement>; id?: string; value: string; onChange: (value: string) => void;
  placeholder: string; label: string; onClose?: () => void; closeLabel?: string;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Escape" && onClose) onClose(); };
  return (
    <div className={styles.field}>
      <span className={styles.loupe}>{icon(SEARCH)}</span>
      <input ref={inputRef} id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={label} onKeyDown={onKeyDown} />
      {onClose && <IconButton label={closeLabel ?? ""} icon={icon(CLOSE)} tone="quiet" size={32} onClick={onClose} />}
    </div>
  );
}

export type ToolResult = { id: string; tool: LogoTool; present: boolean; addLabel: string; renderLink: (className: string, content: ReactNode) => ReactNode; onAdd: (row: HTMLElement | null) => void };

/** Add a tool: the field, then one row per catalogue result with its add button. */
export default function ToolSearch({ id, label, field, status, results, localLogosOnly = false }: {
  id?: string; label: string; field: ReactNode; status?: string; results?: ToolResult[]; localLogosOnly?: boolean;
}) {
  return (
    <section className={styles.search} id={id} aria-label={label} data-tool-search="">
      {field}
      {status && <p className={styles.status} role="status">{status}</p>}
      {results && results.length > 0 && <ul className={styles.results}>
        {results.map((result) => <li key={result.id} className={styles.row}>
          <Logo tool={result.tool} size={32} localOnly={localLogosOnly} />
          {result.renderLink(styles.name, result.tool.name)}
          <IconButton label={result.addLabel} icon={icon(result.present ? CHECK : PLUS)} tone={result.present ? "done" : "ink"} size={32} disabled={result.present}
            onClick={(event) => result.onAdd(event.currentTarget.closest("li"))} />
        </li>)}
      </ul>}
    </section>
  );
}
