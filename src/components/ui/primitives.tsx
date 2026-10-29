import {
  cloneElement, forwardRef, useId, useRef,
  type AriaAttributes, type ButtonHTMLAttributes, type HTMLAttributes,
  type InputHTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactElement,
  type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { Link, type LinkProps } from "@/lib/routerLinks";
import { ChevronRight } from "@/lib/icons";

export type ControlVariant = "primary" | "secondary" | "quiet" | "danger" | "danger-quiet";
export type ControlSize = "default" | "compact";
export type ControlAppearance =
  | "default" | "stack" | "stack-invoice" | "stack-search" | "stack-name" | "stack-cost" | "stack-search-small" | "stack-usage" | "stack-sort"
  | "stack-onboarding" | "stack-onboarding-ready" | "stack-back" | "stack-skip" | "stack-welcome-final" | "stack-dock"
  | "account" | "account-provider" | "account-lifecycle" | "account-welcome" | "account-password"
  | "public" | "public-form" | "public-form-back" | "public-submission" | "public-submission-icon" | "public-submission-closing" | "public-submission-plan" | "public-submission-checkout";

type ControlOptions = {
  variant?: ControlVariant;
  size?: ControlSize;
  appearance?: ControlAppearance;
  loading?: boolean;
  icon?: ReactNode;
};

function classes(...values: (string | undefined | false)[]) {
  return values.filter(Boolean).join(" ");
}

function ActionContent({ icon, loading, children }: Pick<ControlOptions, "icon" | "loading"> & { children?: ReactNode }) {
  return <>{loading ? <span className="ui-spinner" aria-hidden="true" /> : icon && <span className="ui-control-icon" aria-hidden="true">{icon}</span>}{children}</>;
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ControlOptions;

/** Native action semantics, including explicit form submit/reset types. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "secondary", size = "default", appearance = "default", loading = false,
  icon, disabled, type = "button", className, children, ...props
}, ref) {
  return <button {...props} ref={ref} type={type} disabled={disabled || loading}
    aria-busy={loading || props["aria-busy"]} className={classes("ui-button", className)}
    data-variant={variant} data-size={size} data-appearance={appearance}>
    <ActionContent icon={icon} loading={loading}>{children}</ActionContent>
  </button>;
});

export type NavigationProps = LinkProps & ControlOptions & { disabled?: boolean };

function blockActivation(event: MouseEvent<HTMLAnchorElement> | KeyboardEvent<HTMLAnchorElement>) {
  event.preventDefault();
  event.stopPropagation();
}

/** A blocked destination has no href, so modifier/middle clicks cannot open it. */
const Navigation = forwardRef<HTMLAnchorElement, NavigationProps>(function Navigation({
  to, disabled, loading, icon, variant, size = "default", appearance = "default", children,
  onClick, onAuxClick, onClickCapture, onAuxClickCapture, onKeyDown, onKeyDownCapture, tabIndex, className,
  // Router-only options must not leak onto the inert native anchor.
  replace, state, relative, preventScrollReset, reloadDocument, viewTransition, discover, prefetch,
  ...props
}, ref) {
  const shared = {
    ...props, ref, className, "data-variant": variant, "data-size": size,
    "data-appearance": appearance, "aria-busy": loading || props["aria-busy"],
  };
  const content = <ActionContent icon={icon} loading={loading}>{children}</ActionContent>;
  if (disabled || loading) return <a {...shared} role="link" aria-disabled="true" tabIndex={-1}
    onClick={blockActivation} onAuxClick={blockActivation} onClickCapture={blockActivation} onAuxClickCapture={blockActivation}
    onKeyDownCapture={(event) => { if (event.key === "Enter" || event.key === " ") blockActivation(event); else onKeyDownCapture?.(event); }}
    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") blockActivation(event); else onKeyDown?.(event); }}>{content}</a>;
  return <Link {...shared} to={to} replace={replace} state={state} relative={relative}
    preventScrollReset={preventScrollReset} reloadDocument={reloadDocument} viewTransition={viewTransition}
    discover={discover} prefetch={prefetch} tabIndex={tabIndex} onClick={onClick} onAuxClick={onAuxClick}
    onClickCapture={onClickCapture} onAuxClickCapture={onAuxClickCapture} onKeyDownCapture={onKeyDownCapture} onKeyDown={onKeyDown}>{content}</Link>;
});

export const ButtonLink = forwardRef<HTMLAnchorElement, NavigationProps>(function ButtonLink({ className, variant = "secondary", ...props }, ref) {
  return <Navigation {...props} ref={ref} variant={variant} className={classes("ui-button", className)} />;
});

/** Navigation only. Use a quiet Button for an in-place action. */
export const TextLink = forwardRef<HTMLAnchorElement, NavigationProps>(function TextLink({ className, variant = "quiet", ...props }, ref) {
  return <Navigation {...props} ref={ref} variant={variant} className={classes("ui-text-link", className)} />;
});

type AccessibleName = { "aria-label": string; "aria-labelledby"?: string } | { "aria-label"?: string; "aria-labelledby": string };
export type IconButtonProps = Omit<ButtonProps, "aria-label" | "aria-labelledby"> & AccessibleName;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ className, children, icon, ...props }, ref) {
  return <Button {...props} ref={ref} className={classes("ui-icon-button", className)} icon={icon ?? children} />;
});

type FieldAppearance = { size?: ControlSize; appearance?: ControlAppearance };
export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & Omit<FieldAppearance, "size"> & { size?: ControlSize | number };
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, size = "default", appearance = "default", ...props }, ref) {
  return <input {...props} ref={ref} size={typeof size === "number" ? size : undefined} className={classes("ui-input", className)} data-size={typeof size === "number" ? "default" : size} data-appearance={appearance} />;
});

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & Omit<FieldAppearance, "size"> & { size?: ControlSize | number };
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, size = "default", appearance = "default", ...props }, ref) {
  return <select {...props} ref={ref} size={typeof size === "number" ? size : undefined} className={classes("ui-select", className)} data-size={typeof size === "number" ? "default" : size} data-appearance={appearance} />;
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldAppearance;
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, size = "default", appearance = "default", ...props }, ref) {
  return <textarea {...props} ref={ref} className={classes("ui-textarea", className)} data-size={size} data-appearance={appearance} />;
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
  return <div {...props} ref={ref} className={classes("ui-field", className)}>
    <label className="ui-field-label" htmlFor={controlId}>{label}</label>
    {cloneElement(children, {
      id: controlId, "aria-describedby": describedBy,
      "aria-invalid": hasError ? true : children.props["aria-invalid"],
      "aria-errormessage": hasError ? errorId : children.props["aria-errormessage"],
    })}
    {hasHelp && <p className="ui-field-help" id={helpId}>{help}</p>}
    {hasError && <p className="ui-field-error" id={errorId} role="alert">{error}</p>}
  </div>;
});

export type SurfaceProps = HTMLAttributes<HTMLElement> & { as?: "div" | "article" | "section" | "aside" };
export function Surface({ as: Tag = "div", className, ...props }: SurfaceProps) {
  return <Tag {...props} className={classes("ui-surface", className)} />;
}

export type PageHeaderProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title: ReactNode; description?: ReactNode; actions?: ReactNode; headingLevel?: 1 | 2 | 3;
};
export function PageHeader({ title, description, actions, headingLevel = 1, className, ...props }: PageHeaderProps) {
  const Heading = headingLevel === 1 ? "h1" : headingLevel === 2 ? "h2" : "h3";
  return <header {...props} className={classes("ui-page-header", className)}>
    <div className="ui-page-header-copy"><Heading className="ui-page-header-title">{title}</Heading>{description && <p className="ui-page-header-description">{description}</p>}</div>
    {actions && <div className="ui-page-header-actions">{actions}</div>}
  </header>;
}

/** Layout only: this does not impose ARIA toolbar keyboard semantics. */
export function Toolbar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={classes("ui-toolbar", className)} />;
}

export type SegmentedOption<T extends string> = { id: T; label: ReactNode; count?: number; countTone?: "watch" | "overlap"; disabled?: boolean };
export type SegmentedProps<T extends string> = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & FieldAppearance & {
  label: string; options: SegmentedOption<T>[]; value: T | null; onChange: (id: T) => void;
  mode?: "tabs" | "toggle"; controls?: string; disabled?: boolean;
};

/** Automatic tabs use roving focus; independent filter buttons retain native tab stops. */
export function Segmented<T extends string>({ label, options, value, onChange, mode = "tabs", controls,
  disabled = false, size = "default", appearance = "default", className, onKeyDown, ...props }: SegmentedProps<T>) {
  const buttons = useRef(new Map<T, HTMLButtonElement>());
  const enabled = options.filter((option) => !disabled && !option.disabled);
  const current = enabled.find((option) => option.id === value) ?? enabled[0];
  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || mode !== "tabs" || !enabled.length) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const focusedIndex = enabled.findIndex((option) => buttons.current.get(option.id) === event.target);
    const index = focusedIndex < 0 ? enabled.findIndex((option) => option.id === current.id) : focusedIndex;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length;
    const next = enabled[nextIndex];
    onChange(next.id);
    buttons.current.get(next.id)?.focus();
  }
  return <div {...props} className={classes("ui-segmented", className)} role={mode === "tabs" ? "tablist" : "group"}
    aria-label={label} aria-disabled={disabled || undefined} onKeyDown={handleKey} data-size={size} data-appearance={appearance}>
    {options.map((option) => <button key={option.id} ref={(node) => { if (node) buttons.current.set(option.id, node); else buttons.current.delete(option.id); }}
      type="button" disabled={disabled || option.disabled} data-id={option.id} onClick={() => onChange(option.id)}
      {...(mode === "tabs" ? { role: "tab", "aria-selected": value === option.id, "aria-controls": controls, tabIndex: current?.id === option.id ? 0 : -1 }
        : { "aria-pressed": value === option.id })}>
      {option.label}{option.count !== undefined && <span className="ui-segmented-count" data-tone={option.countTone}>{option.count}</span>}
    </button>)}
  </div>;
}

export type ActionRowProps = Omit<ButtonProps, "name" | "icon"> & {
  lead?: ReactNode; name: ReactNode; sub?: ReactNode; end?: ReactNode; endTone?: "watch" | "muted";
};
export const ActionRow = forwardRef<HTMLButtonElement, ActionRowProps>(function ActionRow({ lead, name, sub, end, endTone, children, className, ...props }, ref) {
  return <Button {...props} ref={ref} className={classes("ui-action-row", className)}>
    {lead && <span className="ui-action-row-lead" aria-hidden="true">{lead}</span>}
    <span className="ui-action-row-copy"><span>{name}</span>{sub && <small>{sub}</small>}</span>
    {end !== undefined && <span className="ui-action-row-value" data-tone={endTone}>{end}</span>}
    <ChevronRight size={16} aria-hidden="true" className="ui-action-row-chevron" />
    {children}
  </Button>;
});
