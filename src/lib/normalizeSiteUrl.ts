export type NormalizeUrlFailure =
  | "empty"
  | "unsupported_scheme"
  | "invalid_hostname"
  | "port_not_allowed"
  | "malformed";

export type NormalizeUrlResult =
  | { ok: true; url: string; changed: boolean }
  | { ok: false; reason: NormalizeUrlFailure };

/** Query parameters that only describe how a visitor arrived, never the page itself. */
const TRACKING_PARAMS = /^(utm_[a-z_]+|fbclid|gclid|gbraid|wbraid|mc_[ce]id|igshid|ref|ref_src)$/i;

const clean = (value: string) => value
  // Zero-width and non-breaking characters survive copy-paste from Notion, Slack, and PDFs.
  .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
  .replace(/\u00A0/g, " ")
  .trim()
  // Wrapping characters people paste along with the address.
  .replace(/^[<"'`(\[]+/, "")
  .replace(/[>"'`)\].,;]+$/, "")
  // "@example.com" is how handles get pasted.
  .replace(/^@+/, "")
  .trim();

const withScheme = (value: string) => {
  const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (!scheme) return `https://${value.replace(/^\/+/, "")}`;
  // "https:/example.com" and "https:\\example.com" are common typos.
  const rest = value.slice(scheme.length + 1).replace(/^[/\\]*/, "");
  return `${scheme}://${rest}`;
};

/**
 * Turns whatever someone typed into the canonical https URL we can actually fetch,
 * or explains why it cannot be salvaged. Never throws.
 */
export const normalizeSiteUrl = (input: unknown): NormalizeUrlResult => {
  const raw = clean(String(input ?? ""));
  if (!raw) return { ok: false, reason: "empty" };

  let url: URL;
  try {
    url = new URL(withScheme(raw));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "unsupported_scheme" };
  }
  // Every site we can verify serves https, so http is an upgrade rather than an error.
  url.protocol = "https:";

  if (url.username || url.password) return { ok: false, reason: "malformed" };

  url.hostname = url.hostname.toLowerCase().replace(/\.+$/, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(url.hostname) || url.hostname.includes("..")) {
    return { ok: false, reason: "invalid_hostname" };
  }

  // The verification endpoint refuses any explicit port, so strip the harmless
  // defaults and reject the rest here instead of failing later on the server.
  if (url.port === "80" || url.port === "443") url.port = "";
  if (url.port) return { ok: false, reason: "port_not_allowed" };

  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }

  let normalized = url.toString();
  if (url.pathname === "/" && !url.search && !url.hash) normalized = normalized.replace(/\/$/, "");

  return { ok: true, url: normalized, changed: normalized !== raw };
};
