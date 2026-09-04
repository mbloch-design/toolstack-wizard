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

  const { progressStep, toolName, toolUrl, submitterRole, name, email, message, badgeUrl, paid, lang } = req.body ?? {};
  // submitterRole/name/message are collected in the final step (after badge/payment), so they may still be empty here.
  if (![1, 2, 3].includes(progressStep) || !toolName || !validEmail(email) || !validHttpsUrl(toolUrl)) {
    return res.status(400).json({ error: "Invalid submission progress" });
  }
  if ([toolName, submitterRole, name, email].some((value) => String(value ?? "").length > 300) || String(message ?? "").length > 2000) {
    return res.status(400).json({ error: "Field too long" });
  }
  if (progressStep === 2 && !paid && !validHttpsUrl(badgeUrl)) {
    return res.status(400).json({ error: "Invalid badge URL" });
  }

  const isPaid = Boolean(paid);
  const stepLabel = progressStep === 1
    ? "Coordonnées reçues"
    : progressStep === 2
      ? "Badge vérifié"
      : isPaid ? "Paiement lancé (Creem)" : "Soumission finalisée";
  const paidTag = isPaid ? "[Payante] " : "";
  const fallback = (value: unknown) => (value ? escapeHtml(value) : "—");
  const { error } = await resend.emails.send({
    from: "ToolTrim Submissions <contact@tooltrim.com>",
    to: "contact@tooltrim.com",
    replyTo: String(email),
    subject: `${paidTag}[Soumission — étape ${progressStep}/3] ${String(toolName).replace(/[\r\n]/g, " ")} — ${stepLabel}`,
    html: `
      <h1>Soumission d’un outil — étape ${progressStep}/3</h1>
      <p><strong>État :</strong> ${stepLabel}</p>
      <p><strong>Type de soumission :</strong> ${isPaid ? "Payante — publication garantie" : "Gratuite — badge"}</p>
      <p><strong>Langue du parcours :</strong> ${escapeHtml(lang)}</p>
      <hr />
      <p><strong>Outil :</strong> ${escapeHtml(toolName)}</p>
      <p><strong>Site officiel :</strong> ${escapeHtml(toolUrl)}</p>
      <p><strong>Email :</strong> ${escapeHtml(email)}</p>
      <p><strong>Lien avec l’outil :</strong> ${fallback(submitterRole)}</p>
      <p><strong>Soumis par :</strong> ${fallback(name)}</p>
      ${progressStep === 2 ? `<p><strong>Page du badge :</strong> ${escapeHtml(badgeUrl)}</p>` : ""}
      <h2>Description</h2>
      <p>${message ? escapeHtml(message).replace(/\n/g, "<br>") : "—"}</p>
    `,
  });

  if (error) {
    console.error("[submission-progress] Resend error:", error);
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ success: true, progressStep });
}
