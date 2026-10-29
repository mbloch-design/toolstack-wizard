import { TextLink } from "@/components/ui/primitives";
import { useLang } from "@/hooks/useLang";
import toolsIndex from "@/data/tools_index.json";
import type { Trade } from "@/lib/personalStack";

const toolNames = new Map<string, { name: string; slug: string }>();
for (const tool of toolsIndex) {
  const value = { name: tool.name, slug: tool.slug || tool.id };
  toolNames.set(tool.id, value);
  toolNames.set(value.slug, value);
}
export function toolLabel(slug: string) {
  return toolNames.get(slug)?.name ?? slug;
}
export function date(value: string | null | undefined, lang: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
export function tradeLabel(trade: Trade | null | undefined, lang: string) {
  const labels = {
    dev: ["Développeur", "Developer"],
    designer: ["Designer", "Designer"],
    consultant: ["Consultant", "Consultant"],
    content: ["Créateur de contenu", "Content creator"],
    ops: ["Opérations", "Operations"],
    solo: ["Indépendant", "Independent"],
  };
  return trade
    ? labels[trade][lang === "en" ? 1 : 0]
    : lang === "en"
      ? "Not provided"
      : "Non renseigné";
}
export function accessDenied(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "status" in error &&
    (error.status === 401 || error.status === 403)
  );
}
export function ToolName({ slug }: { slug: string }) {
  const { lang, t } = useLang();
  const tool = toolNames.get(slug);
  return tool ? (
    <TextLink variant="secondary"
      to={`/${lang}/tool/${encodeURIComponent(tool.slug)}`}
      target="_blank"
      rel="noreferrer"
    >
      {tool.name}
    </TextLink>
  ) : (
    <span className="bo-missing">
      <span>{slug}</span>
      <small>
        {t(
          "Référence absente du catalogue JSON",
          "Reference missing from the JSON catalogue",
        )}
      </small>
    </span>
  );
}
