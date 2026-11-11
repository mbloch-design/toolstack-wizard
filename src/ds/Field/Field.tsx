import { useId, type InputHTMLAttributes, type ReactNode, type Ref, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown } from "@/lib/icons";
import styles from "./Field.module.css";

/**
 * Forms (planche, « Dire ce qui ne va pas, à l'endroit où ça se passe »): the label always above, a short help under
 * the box, an error that says how to fix it (a mark and a sentence, never red alone), 16 px in the box (no iOS zoom).
 */
type Frame = {
  label: ReactNode;
  /** A short help under the box (« Tel qu'il apparaît sur son site. »). */
  help?: ReactNode;
  /** What to fix: replaces the help, in the alert colour with its mark. */
  error?: string;
  /** Characters typed out of a maximum, at the end of the label row (« 48/160 »). */
  count?: { value: number; max: number };
  /** A green check at the end of the box once the value is right. */
  valid?: boolean;
};

function FieldFrame({ id, frame, children, after, disabled }: { id: string; frame: Frame; children: ReactNode; after?: ReactNode; disabled?: boolean }) {
  const { label, help, error, count, valid } = frame;
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>{label}</label>
        {count && <span className={styles.count} aria-live="polite">{count.value}/{count.max}</span>}
      </div>
      <div className={styles.row}>
        <div className={styles.box} data-error={error ? "" : undefined} data-disabled={disabled || undefined}>
          {children}
          {valid && !error && <Check className={styles.ok} aria-hidden="true" />}
        </div>
        {after}
      </div>
      {error ? <p className={styles.help} data-error="" id={`${id}-help`} role="alert">{error}</p>
        : help ? <p className={styles.help} id={`${id}-help`}>{help}</p> : null}
    </div>
  );
}

const described = (id: string, frame: Frame) => (frame.error || frame.help ? `${id}-help` : undefined);

/** A labelled text field. Things beside the box (a currency, a period) go in `after`. */
export default function Field({ label, help, error, count, valid, after, inputRef, ...input }: Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & Frame & {
  after?: ReactNode; inputRef?: Ref<HTMLInputElement>;
}) {
  const auto = useId();
  const id = input.id ?? auto;
  const frame = { label, help, error, count, valid };
  return (
    <FieldFrame id={id} frame={frame} after={after} disabled={input.disabled}>
      <input ref={inputRef} id={id} className={styles.control} aria-invalid={error ? true : undefined} aria-describedby={described(id, frame)} {...input} />
    </FieldFrame>
  );
}

// @ds-pending 2026-11-11: form controls of the planche; their first page is « Soumettre un outil ».
/** A longer text: resizable in height only. */
export function TextAreaField({ label, help, error, count, valid, ...area }: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & Frame) {
  const auto = useId();
  const id = area.id ?? auto;
  const frame = { label, help, error, count, valid };
  return (
    <FieldFrame id={id} frame={frame} disabled={area.disabled}>
      <textarea id={id} className={styles.control} data-area="" aria-invalid={error ? true : undefined} aria-describedby={described(id, frame)} {...area} />
    </FieldFrame>
  );
}

// @ds-pending 2026-11-11: form controls of the planche; their first page is « Soumettre un outil ».
/** A choice in a list: the native select (keyboard, screen readers, phones), drawn like the other boxes. */
export function SelectField({ label, help, error, valid, children, ...select }: Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & Omit<Frame, "count">) {
  const auto = useId();
  const id = select.id ?? auto;
  const frame = { label, help, error, valid };
  return (
    <FieldFrame id={id} frame={frame} disabled={select.disabled}>
      <select id={id} className={styles.control} data-select="" aria-invalid={error ? true : undefined} aria-describedby={described(id, frame)} {...select}>{children}</select>
      <ChevronDown className={styles.chevron} aria-hidden="true" />
    </FieldFrame>
  );
}

// @ds-pending 2026-11-11: form controls of the planche; their first page is « Soumettre un outil ».
/** A check box with its sentence (« Prévenir quand le prix change »): the box fills in ink, a check draws itself. */
export function Checkbox({ label, note, ...input }: Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> & { label: ReactNode; note?: ReactNode }) {
  return (
    <label className={styles.check}>
      <input type="checkbox" className={styles.checkInput} {...input} />
      <span className={styles.checkBox} aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg></span>
      <span className={styles.checkText}><span className={styles.checkLabel}>{label}</span>{note && <span className={styles.checkNote}>{note}</span>}</span>
    </label>
  );
}

// @ds-pending 2026-11-11: form controls of the planche; their first page is « Soumettre un outil ».
/** A form on two columns that becomes one on a narrow screen. */
export function FormGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

// @ds-pending 2026-11-11: form controls of the planche; their first page is « Soumettre un outil ».
/** A form row that spans both columns. */
export function FormFull({ children }: { children: ReactNode }) {
  return <div className={styles.full}>{children}</div>;
}
