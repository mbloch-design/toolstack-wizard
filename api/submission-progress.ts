import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const validEmail = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? ""));
const validHttpsUrl = (value: unknown) => {
  try {
    return new URL(String(value ?? "")).protocol === "https:";
  } catch {
    return false;
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

  const { progressStep, toolName, toolUrl, submitterRole, name, email, message, badgeUrl, lang } = req.body ?? {};
  if (![1, 2].includes(progressStep) || !toolName || !submitterRole || !name || !message || !validEmail(email) || !validHttpsUrl(toolUrl)) {
    return res.status(400).json({ error: "Invalid submission progress" });
  }
  if ([toolName, submitterRole, name, email].some((value) => String(value).length > 300) || String(message).length > 2000) {
    return res.status(400).json({ error: "Field too long" });
  }
  if (progressStep === 2 && !validHttpsUrl(badgeUrl)) {
    return res.status(400).json({ error: "Invalid badge URL" });
  }

  const stepLabel = progressStep === 1 ? "Informations reçues" : "Badge vérifié";
  const { error } = await resend.emails.send({
    from: "ToolTrim Submissions <contact@tooltrim.com>",
    to: "contact@tooltrim.com",
    replyTo: String(email),
    subject: `[Soumission — étape ${progressStep}/3] ${String(toolName).replace(/[\r\n]/g, " ")} — ${stepLabel}`,
    html: `
      <h1>Soumission d’un outil — étape ${progressStep}/3</h1>
      <p><strong>État :</strong> ${stepLabel}</p>
      <p><strong>Langue du parcours :</strong> ${escapeHtml(lang)}</p>
      <hr />
      <p><strong>Outil :</strong> ${escapeHtml(toolName)}</p>
      <p><strong>Site officiel :</strong> ${escapeHtml(toolUrl)}</p>
      <p><strong>Lien avec l’outil :</strong> ${escapeHtml(submitterRole)}</p>
      <p><strong>Soumis par :</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      ${progressStep === 2 ? `<p><strong>Page du badge :</strong> ${escapeHtml(badgeUrl)}</p>` : ""}
      <h2>Description</h2>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    `,
  });

  if (error) {
    console.error("[submission-progress] Resend error:", error);
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ success: true, progressStep });
}
