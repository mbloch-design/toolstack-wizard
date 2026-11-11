import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactElement, ReactNode } from "react";
import styles from "./Tooltip.module.css";

/**
 * The tooltip (planche, « Infobulle »): on hover or keyboard focus, a small ink note rises 4 px as it fades in.
 * It only explains: what it says is never the only way to know it (the control keeps its own name).
 */
export default function Tooltip({ label, side = "top", children }: { label: ReactNode; side?: "top" | "right" | "bottom" | "left"; children: ReactElement }) {
  return (
    <RadixTooltip.Provider delayDuration={250} skipDelayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className={styles.tip} side={side} sideOffset={10} data-side={side}>
{label}</RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
