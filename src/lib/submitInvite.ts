import { normalizeSiteUrl } from "@/lib/normalizeSiteUrl";

export type SubmitInvite = { toolName: string; toolUrl: string };

const MAX_NAME = 60;

/** Personalised outreach links: /submit?tool=GenCode&site=genspark.ai */
export function parseSubmitInvite(params: URLSearchParams): SubmitInvite | null {
  const toolName = (params.get("tool") || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_NAME).trim();
  // An unfilled merge tag ({{tool}}, [tool_name]) must not be greeted by name.
  if (!toolName || /[{}[\]]/.test(toolName)) return null;
  const site = normalizeSiteUrl(params.get("site") || "");
  return { toolName, toolUrl: site.ok ? site.url : "" };
}
