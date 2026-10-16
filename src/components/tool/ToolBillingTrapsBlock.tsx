import type { Tool } from "@/data/types";
import { CircleAlert } from "@/lib/icons";

interface Props {
  tool: Tool;
  lang: string;
  t: (fr: string, en: string) => string;
}

/**
 * Contractual/billing gotchas (seat minimums, purchase banding, usage
 * caps...) — same visual convention as ToolCostBreakdownTable. Reads
 * verdict.billingTraps / verdictEn.billingTraps; renders nothing when
 * absent (most tools don't have this level of contractual detail yet).
 */
export default function ToolBillingTrapsBlock({ tool, lang, t }: Props) {
  const traps = lang === "en"
    ? (tool as any).verdictEn?.billingTraps
    : tool.verdict?.billingTraps;

  if (!traps?.length) return null;

  // An alert before paying, tinted like the "against" column it echoes.
  return (
    <aside className="td-billing-alert" aria-label={t("Avant de payer", "Before you pay")}>
      <CircleAlert aria-hidden className="td-billing-alert-icon" />
      <div className="td-billing-alert-body">
        {traps.map((trap: { title: string; text: string }, i: number) => (
          <div key={i} className="td-billing-alert-item">
            <p className="td-billing-alert-title">{trap.title}</p>
            <p className="td-billing-alert-text">{trap.text}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
