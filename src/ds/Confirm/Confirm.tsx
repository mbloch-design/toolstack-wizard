import * as Popover from "@radix-ui/react-popover";
import type { ReactNode } from "react";
import Button from "../Button/Button";
import styles from "./Confirm.module.css";

/**
 * A short confirmation anchored to the control that asked for it (« Retirer Notion de ma stack ? »): a glass bubble,
 * the question, the safe answer first and focused, the one that removes beside it. Escape or a click outside keeps.
 */
export default function Confirm({ open, onOpenChange, anchor, question, keepLabel, actLabel, onAct }: {
  open: boolean; onOpenChange: (open: boolean) => void; anchor: ReactNode; question: string; keepLabel: string; actLabel: string; onAct: () => void;
}) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor asChild>{anchor}</Popover.Anchor>
      <Popover.Portal>
        <Popover.Content className={styles.confirm} align="end" sideOffset={8} aria-label={question} data-confirm="">
          <p className={styles.question}>{question}</p>
          <div className={styles.actions}>
            <Button autoFocus onClick={() => onOpenChange(false)}>{keepLabel}</Button>
            <Button variant="primary" onClick={() => { onOpenChange(false); onAct(); }}>{actLabel}</Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
