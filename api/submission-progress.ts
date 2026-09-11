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
  // submitterRole/name/message are only collected in step 3 (contact.ts), after badge/payment — still empty here.
  if (![1, 2].includes(progressStep) || !toolName || !validEmail(email) || !validHttpsUrl(toolUrl)) {
    return res.status(400).json({ error: "Invalid submission progress" });
  }
  if ([toolName, submitterRole, name, email].some((value) => String(value ?? "").length > 300) || String(message ?? "").length > 2000) {
    return res.status(400).json({ error: "Field too long" });
  }
  const isPaid = Boolean(paid);
  if (progressStep === 2 && !isPaid && !validHttpsUrl(badgeUrl)) {
    return res.status(400).json({ error: "Invalid badge URL" });
  }

  // Steps mirror the on-page funnel: 1 Contact, 2 Publication (badge or payment), 3 Details (contact.ts).
  const stepLabel = progressStep === 1
    ? "Coordonnées reçues"
    : isPaid ? "Paiement lancé" : "Badge vérifié";
  const offerLabel = isPaid ? "PAYANT 29 $" : "GRATUIT + BADGE";
  const offerDetail = isPaid
    ? "Publication sous 5 jours · paiement non encore confirmé à cette étape"
    : "Sélection éditoriale standard · badge requis";
  const fallback = (value: unknown) => (value ? escapeHtml(value) : "—");
  const { error } = await resend.emails.send({
    from: "ToolTrim Submissions <contact@tooltrim.com>",
    to: "contact@tooltrim.com",
    replyTo: String(email),
    subject: `[${offerLabel}][${progressStep}/3] ${String(toolName).replace(/[\r\n]/g, " ")} — ${stepLabel}`,
    html: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border-collapse:separate;">
        <tr><td style="padding:18px 20px;background:${isPaid ? "#111111" : "#F1F1ED"};color:${isPaid ? "#FFFFFF" : "#1D1D1F"};border-radius:10px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.8px;">${offerLabel}</p>
          <p style="margin:0;font-size:18px;font-weight:700;">Étape ${progressStep}/3 · ${stepLabel}</p>
        </td></tr>
      </table>
      <p><strong>Parcours choisi :</strong> ${offerDetail}</p>
      <p><strong>Langue du parcours :</strong> ${escapeHtml(lang)}</p>
      <hr />
      <p><strong>Outil :</strong> ${escapeHtml(toolName)}</p>
      <p><strong>Site officiel :</strong> ${escapeHtml(toolUrl)}</p>
      <p><strong>Email :</strong> ${escapeHtml(email)}</p>
      <p><strong>Lien avec l’outil :</strong> ${fallback(submitterRole)}</p>
      <p><strong>Soumis par :</strong> ${fallback(name)}</p>
      ${progressStep === 2 && !isPaid ? `<p><strong>Page du badge :</strong> ${escapeHtml(badgeUrl)}</p>` : ""}
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
