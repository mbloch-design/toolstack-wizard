import { Link } from "react-router-dom";
import type { Tool } from "@/data/types";
import { Check, X, TrendingDown, ArrowRightLeft, ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   ToolVerdictBlock — editorial redesign
   No gradient cards. No heavy colored boxes.
   Clean prose + compact keepIf/avoidIf + prescription row.
───────────────────────────────────────────────────────────────────────────── */

interface Props {
  tool: Tool;
  lang?: string;
  prefix?: string;
  allTools?: Tool[];
  t: (fr: string, en: string) => string;
}

function getActionLabel(action: string | undefined, replacement: string | undefined, t: Props["t"]): string | null {
  if (!action) return null;
  switch (action) {
    case "replace-cheaper":
    case "replace_for_cost":
      return replacement
        ? t(`Remplacer par ${replacement} pour réduire les coûts`, `Replace with ${replacement} to reduce costs`)
        : t("Envisager une alternative moins chère", "Consider a cheaper alternative");
    case "replace-better":
    case "replace_for_features":
      return replacement
        ? t(`Migrer vers ${replacement} pour plus de fonctionnalités`, `Migrate to ${replacement} for more features`)
        : t("Envisager une alternative plus complète", "Consider a more complete alternative");
    case "cancel":
      return t("Résilier cet abonnement", "Cancel this subscription");
    case "keep":
      return t("Conserver cet outil", "Keep this tool");
    case "downgrade":
      return t("Passer à un plan inférieur", "Downgrade to a lower plan");
    default:
      return null;
  }
}

function getActionIcon(action: string | undefined) {
  switch (action) {
    case "replace-cheaper":
    case "replace_for_cost":
      return TrendingDown;
    case "replace-better":
    case "replace_for_features":
      return ArrowRightLeft;
    default:
      return ArrowRight;
  }
}

export default function ToolVerdictBlock({ tool, lang, prefix = "", allTools = [], t }: Props) {
  const verdict = lang === "en" && (tool as any).verdictEn ? (tool as any).verdictEn : tool.verdict;
  const keepItems = (Array.isArray(verdict?.keepIf) ? verdict.keepIf : [verdict?.keepIf]).filter(Boolean) as string[];
  const avoidItems = (Array.isArray(verdict?.avoidIf) ? verdict.avoidIf : [verdict?.avoidIf]).filter(Boolean) as string[];

  const prescription = tool.prescription_output;
  const actionLabel = getActionLabel(prescription?.action, prescription?.replacement_tool, t);
  const ActionIcon = getActionIcon(prescription?.action);
  const gain = prescription?.gain_monthly_eur;

  const altSlug = (tool as any).betterAlternative?.tool || prescription?.replacement_tool;
  const altTool = altSlug
    ? allTools.find(t => t.id === altSlug || t.slug === altSlug || (t.name ?? "").toLowerCase() === altSlug.toLowerCase())
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Threshold / editorial verdict paragraph */}
      {verdict?.threshold && (
        <p className="td-body" style={{ marginBottom: 28, fontSize: 16 }}>
          {verdict.threshold}
        </p>
      )}

      {/* keepIf + avoidIf — two columns on desktop */}
      {(keepItems.length > 0 || avoidItems.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: keepItems.length > 0 && avoidItems.length > 0 ? "1fr 1fr" : "1fr", gap: 24, marginBottom: actionLabel ? 28 : 0 }}
          className="sm:grid-cols-2"
        >
          {keepItems.length > 0 && (
            <div>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 12 }}>
                {t("Idéal si", "Best if")}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {keepItems.map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(74,155,111,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <Check style={{ width: 10, height: 10, color: "#4A9B6F" }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "#222222", lineHeight: 1.45 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {avoidItems.length > 0 && (
            <div>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6F6F68", marginBottom: 12 }}>
                {t("À challenger si", "Challenge it if")}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {avoidItems.map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(173,173,173,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <X style={{ width: 10, height: 10, color: "#9A9A92" }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "#6F6F68", lineHeight: 1.45 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Prescription row — only if ferme */}
      {tool.prescription_quality === "ferme" && actionLabel && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 16,
          padding: "18px 20px",
          background: "#F8F8F4", border: "1px solid #DADAD4", borderRadius: 8,
          marginTop: 24,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EDEDE8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ActionIcon style={{ width: 16, height: 16, color: "#222222" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600, color: "#222222", marginBottom: 4 }}>
              {t("Recommandation ToolTrim", "ToolTrim recommendation")}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "#6F6F68", lineHeight: 1.45 }}>
              {actionLabel}
            </p>
            {gain != null && gain > 0 && (
              <p style={{ fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 600, color: "#4A9B6F", marginTop: 8 }}>
                {t("Économie potentielle", "Potential savings")} : +{Math.round(gain)}€/{t("mois", "mo")}
              </p>
            )}
            {altTool && (
              <Link
                to={`${prefix}/tool/${(altTool as any).slug || altTool.id}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "hsl(var(--primary))", textDecoration: "none", marginTop: 8 }}
              >
                {t(`Voir la fiche de ${altTool.name}`, `See ${altTool.name} review`)}
                <ArrowRight style={{ width: 12, height: 12 }} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* betterAlternative — if no ferme prescription */}
      {tool.prescription_quality !== "ferme" && (tool as any).betterAlternative && altTool && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 12,
          padding: "14px 16px",
          background: "#F8F8F4", border: "1px solid #DADAD4", borderRadius: 8,
          marginTop: 24,
        }}>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "#6F6F68", flex: 1, lineHeight: 1.5 }}>
            {(tool as any).betterAlternative.reason}
          </div>
          <Link
            to={`${prefix}/tool/${(altTool as any).slug || altTool.id}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-ui)", fontSize: 13, fontWeight: 500, color: "hsl(var(--primary))", textDecoration: "none", flexShrink: 0 }}
          >
            {t(`Voir ${altTool.name}`, `See ${altTool.name}`)}
            <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      )}
    </div>
  );
}
