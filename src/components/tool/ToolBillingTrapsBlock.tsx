import type { Tool } from "@/data/types";

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
    ? (tool as any).verdictEn?.billingTraps ?? tool.verdict?.billingTraps
    : tool.verdict?.billingTraps;

  if (!traps?.length) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <p style={{ fontFamily: "var(--font-brand)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text)", marginBottom: 16 }}>
        {t(`Les pièges de la facturation ${/^[aeiouyàâéèêëîïôûü]/i.test(tool.name) ? "d'" : "de "}${tool.name}`, `${tool.name}'s billing traps`)}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {traps.map((trap: { title: string; text: string }, i: number) => (
          <div key={i} style={{ border: "1px solid var(--color-border)", borderRadius: 10, padding: "14px 18px", background: "var(--color-surface-soft)" }}>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600, color: "var(--color-text-strong)", marginBottom: 4 }}>
              {trap.title}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, lineHeight: 1.55, color: "var(--color-muted)" }}>
              {trap.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
