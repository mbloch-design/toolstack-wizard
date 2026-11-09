import * as Dialog from "@radix-ui/react-dialog";
import type { CSSProperties, ReactNode } from "react";
import { IconButton } from "../Button/Button";
import styles from "./Drawer.module.css";

const CLOSE = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>;

/**
 * A panel that keeps the page in place: on the right on a computer, from the bottom on a phone.
 * Focus lands on the panel itself, not on its first control: no stray ring. It always has a title
 * (DrawerTitle) and a visible way to close.
 */
export default function Drawer({ open, onClose, closeLabel, children, onOpenAutoFocus, onCloseAutoFocus, style, inline = false }: {
  open: boolean; onClose: () => void; closeLabel: string; children: ReactNode;
  onOpenAutoFocus?: (event: Event) => void; onCloseAutoFocus?: (event: Event) => void; style?: CSSProperties;
  /** Storybook only: the panel in the page flow, without veil or portal, so it can be measured and captured. */
  inline?: boolean;
}) {
  const content = (
        <Dialog.Content className={styles.panel} data-drawer="" data-inline={inline || undefined} style={style} aria-describedby={undefined}
          onOpenAutoFocus={(event) => { event.preventDefault(); (event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true }); onOpenAutoFocus?.(event); }}
          onCloseAutoFocus={onCloseAutoFocus}>
          <span className={styles.close}><Dialog.Close asChild><IconButton label={closeLabel} icon={CLOSE} tone="grey" size={40} /></Dialog.Close></span>
          {children}
        </Dialog.Content>
  );
  return (
    <Dialog.Root open={open} modal={!inline} onOpenChange={(next) => { if (!next) onClose(); }}>
      {inline ? content : <Dialog.Portal><Dialog.Overlay className={styles.overlay} />{content}</Dialog.Portal>}
    </Dialog.Root>
  );
}

export function DrawerTitle({ children }: { children: ReactNode }) {
  return <Dialog.Title className={styles.title}>{children}</Dialog.Title>;
}

export function DrawerDescription({ children }: { children: ReactNode }) {
  return <Dialog.Description className={styles.description}>{children}</Dialog.Description>;
}
