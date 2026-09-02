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

const submissionConfirmationHtml = ({ name, toolName }: { name: unknown; toolName: unknown }) => {
  const safeName = escapeHtml(name);
  const safeToolName = escapeHtml(toolName);

  return `<!doctype html>
  <html lang="en"><body style="margin:0;padding:0;background:#F6F5F4;color:#0F0F0F;font-family:'Uncut Sans',Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F5F4;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FFFFFF;border:1px solid #E6E6E6;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:24px 32px;border-bottom:1px solid #E6E6E6;">
            <table role="presentation" width="100%"><tr>
              <td><img src="https://tooltrim.com/logo-tooltrim-email.svg" width="136" height="30" alt="ToolTrim" style="display:block;width:136px;height:30px;border:0;" /></td>
              <td align="right" style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#6F6F68;">SUBMISSION RECEIVED</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:48px 32px 40px;">
            <p style="margin:0 0 16px;font-size:12px;font-weight:700;letter-spacing:1.1px;color:#6F6F68;">TOOL SUBMISSION</p>
            <h1 style="margin:0 0 22px;font-size:38px;line-height:1.06;font-weight:600;letter-spacing:-1.6px;color:#0F0F0F;">Thank you, ${safeName}.</h1>
            <p style="margin:0 0 14px;font-size:17px;line-height:1.6;color:#0F0F0F;">We’ve received the submission of <strong>${safeToolName}</strong> to ToolTrim.</p>
            <p style="margin:0;font-size:16px;line-height:1.65;color:#6F6F68;">Our team will now review the website, its features, and the information provided before preparing the listing.</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:32px 0;border-collapse:separate;">
              <tr><td style="padding:22px;background:#EDEBE9;border:1px solid #E6E6E6;border-radius:10px;">
                <p style="margin:0 0 7px;font-size:11px;font-weight:700;letter-spacing:1px;color:#6F6F68;">WHAT HAPPENS NEXT</p>
                <p style="margin:0;font-size:16px;font-weight:600;line-height:1.5;color:#0F0F0F;">We’ll contact you directly as soon as the listing is live on ToolTrim.</p>
              </td></tr>
            </table>
            <p style="margin:0 0 30px;font-size:13px;line-height:1.55;color:#6F6F68;">Your verified badge confirms that the submission is complete. Publication remains subject to our independent editorial review.</p>
            <a href="https://tooltrim.com/en" style="display:inline-block;padding:13px 20px;background:#0F0F0F;border:1px solid #0F0F0F;border-radius:7px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;">Explore ToolTrim →</a>
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;">
          <tr><td align="center" style="padding:34px 24px 8px;">
            <img src="https://tooltrim.com/picto-logo.svg" width="38" height="38" alt="" style="display:block;width:38px;height:38px;margin:0 auto 18px;border:0;border-radius:7px;" />
            <p style="margin:0 0 8px;font-size:13px;line-height:1.55;color:#6F6F68;">You’re receiving this email because you submitted a tool to ToolTrim.</p>
            <p style="margin:0 0 18px;font-size:12px;line-height:1.5;color:#6F6F68;">© 2026 ToolTrim. Independent software decisions.</p>
            <p style="margin:0;font-size:12px;line-height:1.6;">
              <a href="https://tooltrim.com/en/contact" style="color:#0F0F0F;text-decoration:underline;">Contact</a>
              <span style="padding:0 9px;color:#A2A29B;">·</span>
              <a href="https://tooltrim.com/en/transparency" style="color:#0F0F0F;text-decoration:underline;">Transparency</a>
              <span style="padding:0 9px;color:#A2A29B;">·</span>
              <a href="https://tooltrim.com/en/privacy-policy" style="color:#0F0F0F;text-decoration:underline;">Privacy</a>
            </p>
          </td></tr>
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
    toolName, toolUrl, submitterRole, badgeReview, badgeUrl, verificationToken,
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
    const confirmation = await resend.emails.send({
      from: "ToolTrim <contact@tooltrim.com>",
      to: String(email),
      replyTo: "contact@tooltrim.com",
      subject: `Thank you for your submission — ${String(toolName).replace(/[\r\n]/g, " ")}`,
      html: submissionConfirmationHtml({ name, toolName }),
    });
    if (confirmation.error) {
      console.error("[contact] Submission confirmation error:", confirmation.error);
    }
  }

  return res.status(200).json({ success: true });
}
