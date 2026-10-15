import { normalizeSiteUrl } from "@/lib/normalizeSiteUrl";

export type SubmitInvite = { toolName: string; toolUrl: string; email: string; name: string };

export const INVITE_PRIVATE_PARAMS = ["email", "name"] as const;

const clean = (value: string | null, max: number) => {
  const text = (value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max).trim();
  // An unfilled merge tag ({{tool}}, [first_name]) must never be shown or prefilled.
  return text && !/[{}[\]]/.test(text) ? text : "";
};

/** Personalised outreach links: /submit?tool=GenCode&site=genspark.ai&email=…&name=… */
export function parseSubmitInvite(params: URLSearchParams): SubmitInvite | null {
  const toolName = clean(params.get("tool"), 60);
  if (!toolName) return null;
  const site = normalizeSiteUrl(params.get("site") || "");
  const rawEmail = clean(params.get("email"), 200).toLowerCase();
  return {
    toolName,
    toolUrl: site.ok ? site.url : "",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : "",
    name: clean(params.get("name"), 100),
  };
}
