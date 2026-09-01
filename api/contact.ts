import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { createHmac, timingSafeEqual } from "node:crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const isValidEmail = (value: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? ""));
const isValidHttpUrl = (value: unknown) => {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const hasValidBadgeToken = (token: unknown, badgeUrl: unknown, toolUrl: unknown) => {
  try {
    const secret = process.env.BADGE_VERIFICATION_SECRET || process.env.RESEND_API_KEY;
    if (!secret) return false;
    const [payload, signature] = String(token ?? "").split(".");
    const expected = createHmac("sha256", secret).update(payload).digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return false;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return decoded.exp > Date.now()
      && new URL(decoded.badgeUrl).toString() === new URL(String(badgeUrl)).toString()
      && new URL(decoded.toolUrl).toString() === new URL(String(toolUrl)).toString();
  } catch {
    return false;
  }
};

const submissionConfirmationHtml = ({ name, toolName, isFrench }: { name: unknown; toolName: unknown; isFrench: boolean }) => {
  const safeName = escapeHtml(name);
  const safeToolName = escapeHtml(toolName);
  const copy = isFrench ? {
    eyebrow: "SOUMISSION REÇUE",
    title: `Merci, ${safeName}.`,
    intro: `Nous avons bien reçu la soumission de <strong>${safeToolName}</strong> sur ToolTrim.`,
    body: "Notre équipe va maintenant analyser le site, les fonctionnalités et les informations disponibles afin de préparer sa présentation.",
    status: "Prochaine étape",
    statusCopy: "Nous reviendrons directement vers vous dès que la fiche sera en ligne sur ToolTrim.",
    note: "La vérification du badge confirme que votre dossier est complet. La publication reste soumise à notre analyse éditoriale.",
    cta: "Découvrir ToolTrim",
    footer: "ToolTrim vous aide à choisir les bons outils, sans les empiler.",
  } : {
    eyebrow: "SUBMISSION RECEIVED",
    title: `Thank you, ${safeName}.`,
    intro: `We have received the submission of <strong>${safeToolName}</strong> to ToolTrim.`,
    body: "Our team will now review the website, features, and available information to prepare its presentation.",
    status: "What happens next",
    statusCopy: "We will contact you directly as soon as the listing is live on ToolTrim.",
    note: "Badge verification confirms that your submission is complete. Publication remains subject to our editorial review.",
    cta: "Explore ToolTrim",
    footer: "ToolTrim helps you choose the right tools without stacking them.",
  };

  return `<!doctype html>
  <html><body style="margin:0;padding:0;background:#f4f4f0;color:#222222;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f0;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #deded8;border-radius:14px;overflow:hidden;">
          <tr><td style="padding:24px 30px;border-bottom:1px solid #ecece7;">
            <table role="presentation" width="100%"><tr>
              <td style="font-size:22px;font-weight:700;letter-spacing:-0.7px;color:#222222;"><span style="display:inline-block;width:12px;height:12px;margin-right:9px;background:#1e52f1;border-radius:3px;vertical-align:1px;"></span>tooltrim</td>
              <td align="right" style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#76766f;">${copy.eyebrow}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:42px 30px 34px;">
            <h1 style="margin:0 0 18px;font-size:34px;line-height:1.08;letter-spacing:-1.2px;color:#222222;">${copy.title}</h1>
            <p style="margin:0 0 14px;font-size:17px;line-height:1.6;color:#383834;">${copy.intro}</p>
            <p style="margin:0;font-size:16px;line-height:1.65;color:#62625c;">${copy.body}</p>
            <div style="margin:30px 0;padding:22px;background:#f2f5ff;border-left:3px solid #1e52f1;border-radius:8px;">
              <p style="margin:0 0 7px;font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#1e52f1;">${copy.status}</p>
              <p style="margin:0;font-size:16px;font-weight:600;line-height:1.5;color:#222222;">${copy.statusCopy}</p>
            </div>
            <p style="margin:0 0 28px;font-size:13px;line-height:1.55;color:#777770;">${copy.note}</p>
            <a href="https://tooltrim.com" style="display:inline-block;padding:13px 20px;background:#222222;border-radius:8px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${copy.cta} →</a>
          </td></tr>
          <tr><td style="padding:20px 30px;background:#f8f8f5;border-top:1px solid #ecece7;font-size:12px;line-height:1.5;color:#777770;">${copy.footer}<br><a href="https://tooltrim.com" style="color:#222222;">tooltrim.com</a></td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    name, email, subject, message, submissionType,
    toolName, toolUrl, submitterRole, badgeReview, badgeUrl, verificationToken, lang,
  } = req.body ?? {};

  if (!name || !email || !subject || !message || !isValidEmail(email)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if ([name, email, subject].some((value) => String(value).length > 300) || String(message).length > 2000) {
    return res.status(400).json({ error: "Field too long" });
  }

  const isToolSubmission = submissionType === "tool";
  if (isToolSubmission && (!toolName || !isValidHttpUrl(toolUrl) || !submitterRole)) {
    return res.status(400).json({ error: "Invalid tool submission" });
  }
  if (isToolSubmission && badgeReview && !isValidHttpUrl(badgeUrl)) {
    return res.status(400).json({ error: "Invalid badge URL" });
  }
  if (isToolSubmission && badgeReview && !hasValidBadgeToken(verificationToken, badgeUrl, toolUrl)) {
    return res.status(400).json({ error: "Badge verification required" });
  }

  const toolDetails = isToolSubmission ? `
      <h2>Proposition d'outil</h2>
      <p><strong>Outil :</strong> ${escapeHtml(toolName)}</p>
      <p><strong>Site officiel :</strong> ${escapeHtml(toolUrl)}</p>
      <p><strong>Lien avec l'outil :</strong> ${escapeHtml(submitterRole)}</p>
      <p><strong>File de revue :</strong> ${badgeReview ? "Prioritaire avec badge" : "Standard"}</p>
      ${badgeReview ? `<p><strong>URL du badge :</strong> ${escapeHtml(badgeUrl)}</p>` : ""}
      <hr />
    ` : "";

  const { error } = await resend.emails.send({
    from: "ToolTrim Contact <contact@tooltrim.com>",
    to: "contact@tooltrim.com",
    replyTo: email,
    subject: `${isToolSubmission ? "[Soumission — étape 3/3]" : "[Contact]"} ${String(subject).replace(/[\r\n]/g, " ")}`,
    html: `
      <p><strong>De :</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
      <hr />
      ${toolDetails}
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    `,
  });

  if (error) {
    console.error("[contact] Resend error:", error);
    return res.status(500).json({ error: error.message });
  }

  if (isToolSubmission) {
    const isFrench = lang !== "en";
    const confirmation = await resend.emails.send({
      from: "ToolTrim <contact@tooltrim.com>",
      to: String(email),
      replyTo: "contact@tooltrim.com",
      subject: isFrench
        ? `Merci pour votre soumission — ${String(toolName).replace(/[\r\n]/g, " ")}`
        : `Thank you for your submission — ${String(toolName).replace(/[\r\n]/g, " ")}`,
      html: submissionConfirmationHtml({ name, toolName, isFrench }),
    });
    if (confirmation.error) {
      console.error("[contact] Submission confirmation error:", confirmation.error);
    }
  }

  return res.status(200).json({ success: true });
}
