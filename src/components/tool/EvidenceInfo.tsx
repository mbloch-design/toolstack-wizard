import { useId, useState, type ReactNode } from "react";
import { Info } from "@/lib/icons";

interface Props {
  label: string;
  children: ReactNode;
}

/** Keep citation details available without repeating them in every card. */
export default function EvidenceInfo({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <span
      className={`td-evidence-info${open ? " is-open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="td-evidence-info-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Info aria-hidden="true" />
      </button>
      <span className="td-evidence-info-panel" id={panelId}>
        {children}
      </span>
    </span>
  );
}
