import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import { Resend } from "resend";
import { createHash } from "node:crypto";
import { redisCommand } from "./_submission-store.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const SEEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const DAILY_CAP = 50;

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const cleanTool = (value: unknown) => {
  if (typeof value !== "string") return "";
  const tool = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return tool.length > 0 && tool.length <= 60 && !/[{}[\]]/.test(tool) ? tool : "";
};

const cleanSite = (value: unknown) => {
  if (value == null || value === "") return "";
  if (typeof value !== "string" || value.length > 300) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestOrigin = String(req.headers.origin || "");
  if (/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { tool: rawTool, site: rawSite, lang } = req.body ?? {};
  const tool = cleanTool(rawTool);
  const site = cleanSite(rawSite);
  if (!tool || site === null || (lang != null && !["fr", "en"].includes(lang))) {
    return res.status(400).json({ error: "Invalid invite visit" });
  }

  // One alert per tool per 30 days and a global daily cap: the endpoint is public, so it must not become a mail relay.
  try {
    const key = createHash("sha256").update(tool.toLowerCase()).digest("hex").slice(0, 32);
    const firstVisit = await redisCommand(["SET", `tt:invite:seen:${key}`, Date.now(), "NX", "EX", SEEN_TTL_SECONDS]);
    if (firstVisit !== "OK") return res.status(200).json({ notified: false });
    const day = new Date().toISOString().slice(0, 10);
    const count = Number(await redisCommand(["INCR", `tt:invite:day:${day}`]));
    if (count === 1) await redisCommand(["EXPIRE", `tt:invite:day:${day}`, 2 * 24 * 60 * 60]);
    if (!Number.isFinite(count) || count > DAILY_CAP) return res.status(200).json({ notified: false });
  } catch {
    return res.status(200).json({ notified: false });
  }

  const when = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "medium", timeStyle: "short" });
  const subject = `[LIEN OUVERT] ${tool.replace(/[\r\n]/g, " ")}${site ? ` (${new URL(site).hostname})` : ""}`;
  const { error } = await resend.emails.send({
    from: "ToolTrim Submissions <contact@tooltrim.com>",
    to: "contact@tooltrim.com",
    subject,
    html: `
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.8px;">LIEN DE PROSPECTION OUVERT</p>
      <p style="margin:0 0 16px;font-size:18px;font-weight:700;">${escapeHtml(tool)} a ouvert la page /submit</p>
      <p><strong>Site :</strong> ${site ? escapeHtml(site) : "—"}</p>
      <p><strong>Langue :</strong> ${escapeHtml(lang === "fr" ? "fr" : "en")}</p>
      <p><strong>Quand :</strong> ${escapeHtml(when)}</p>
      <p style="color:#6F6F68;font-size:13px;">Une seule alerte par outil sur 30 jours. Les étapes suivantes du formulaire envoient leurs propres notifications.</p>
    `,
  });
  if (error) return res.status(200).json({ notified: false });
  return res.status(200).json({ notified: true });
}
