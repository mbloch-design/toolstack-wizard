import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import styles from "./Field.module.css";

/** A labelled text field: the label above, the input on a pill, what to fix under it. Things beside the input (a currency) go in `after`. */
export default function Field({ label, error, after, inputRef, ...input }: Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: ReactNode; error?: string; after?: ReactNode; inputRef?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={input.id ?? id}>{label}</label>
      <div className={styles.row}>
        <input ref={inputRef} id={input.id ?? id} className={styles.input} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} {...input} />
        {after}
      </div>
      {error && <p className={styles.error} id={errorId} role="alert">{error}</p>}
    </div>
  );
}
