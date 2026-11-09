import {
  cloneElement, forwardRef, useId,
  type AnchorHTMLAttributes, type AriaAttributes, type ButtonHTMLAttributes, type HTMLAttributes,
  type InputHTMLAttributes, type ReactElement,
  type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import styles from "./Controls.module.css";

export type ControlVariant = "primary" | "secondary" | "quiet" | "danger";
export type ControlSize = "default" | "compact";
type ControlOptions = {
  variant?: ControlVariant;
  size?: ControlSize;
  loading?: boolean;
  icon?: ReactNode;
};

function classes(...values: (string | undefined | false)[]) {
  return values.filter(Boolean).join(" ");
}

function ActionContent({ icon, loading, children }: Pick<ControlOptions, "icon" | "loading"> & { children?: ReactNode }) {
  return <>{loading ? <span className={styles.spinner} aria-hidden="true" /> : icon && <span className={styles.controlIcon} aria-hidden="true">{icon}</span>}{children}</>;
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ControlOptions;

/** Native action semantics, including explicit form submit/reset types. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "secondary", size = "default", loading = false,
  icon, disabled, type = "button", className, children, ...props
}, ref) {
  return <button {...props} ref={ref} type={type} disabled={disabled || loading}
    aria-busy={loading || props["aria-busy"]} className={classes(styles.button, className)}
    data-variant={variant} data-size={size}>
    <ActionContent icon={icon} loading={loading}>{children}</ActionContent>
  </button>;
});

export function LinkAction({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={classes(styles.textLink, className)} />;
}

type AccessibleName = { "aria-label": string; "aria-labelledby"?: string } | { "aria-label"?: string; "aria-labelledby": string };
export type IconButtonProps = Omit<ButtonProps, "aria-label" | "aria-labelledby"> & AccessibleName;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ className, children, icon, ...props }, ref) {
  return <Button {...props} ref={ref} className={classes(styles.iconButton, className)} icon={icon ?? children} />;
});

type FieldDensity = { size?: ControlSize };
export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: ControlSize | number };
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, size = "default", ...props }, ref) {
  return <input {...props} ref={ref} size={typeof size === "number" ? size : undefined} className={classes(styles.input, className)} data-size={typeof size === "number" ? "default" : size} />;
});

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: ControlSize | number };
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, size = "default", ...props }, ref) {
  return <select {...props} ref={ref} size={typeof size === "number" ? size : undefined} className={classes(styles.select, className)} data-size={typeof size === "number" ? "default" : size} />;
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldDensity;
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, size = "default", ...props }, ref) {
  return <textarea {...props} ref={ref} className={classes(styles.textarea, className)} data-size={size} />;
});

type FieldControlProps = AriaAttributes & { id?: string };
export type FieldProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  label: ReactNode; help?: ReactNode; error?: ReactNode; children: ReactElement<FieldControlProps>;
};

/** Keeps caller descriptions/ref intact and derives stable label/help/error IDs. */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field({ label, help, error, id, children, className, ...props }, ref) {
  const generatedId = useId();
  const controlId = children.props.id ?? id ?? `ui-field-${generatedId}`;
  const hasHelp = help !== undefined && help !== null && help !== false && help !== "";
  const hasError = error !== undefined && error !== null && error !== false && error !== "";
  const helpId = `${controlId}-help`;
  const errorId = `${controlId}-error`;
  const describedBy = classes(children.props["aria-describedby"], hasHelp && helpId, hasError && errorId) || undefined;
  return <div {...props} ref={ref} className={classes(styles.field, className)}>
    <label className={styles.fieldLabel} htmlFor={controlId}>{label}</label>
    {cloneElement(children, {
      id: controlId, "aria-describedby": describedBy,
      "aria-invalid": hasError ? true : children.props["aria-invalid"],
      "aria-errormessage": hasError ? errorId : children.props["aria-errormessage"],
    })}
    {hasHelp && <p className={styles.fieldHelp} id={helpId}>{help}</p>}
    {hasError && <p className={styles.fieldError} id={errorId} role="alert">{error}</p>}
  </div>;
});
