import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { createHmac, timingSafeEqual } from "node:crypto";
import { verifyBadgeOnPage } from "./_badge-verification.js";

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

export const submissionConfirmationHtml = ({ name, toolName, paid, lang }: { name: unknown; toolName: unknown; paid: boolean; lang: "fr" | "en" }) => {
  const safeName = escapeHtml(name);
  const safeToolName = escapeHtml(toolName);
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;

  const eyebrow = paid ? t("CRÉATION DE LA FICHE LANCÉE", "LISTING CREATION STARTED") : t("DEMANDE ENREGISTRÉE", "REQUEST REGISTERED");
  const intro = paid
    ? t(`La publication prioritaire de <strong>${safeToolName}</strong> est bien lancée.`, `Your priority publication for <strong>${safeToolName}</strong> is underway.`)
    : t(`Nous avons bien reçu la soumission de <strong>${safeToolName}</strong>.`, `We’ve received the submission of <strong>${safeToolName}</strong>.`);
  const nextStepsBody = paid
    ? t("Nous préparons la fiche et revenons vers toi pour vérifier les informations factuelles avant sa mise en ligne.", "We’ll prepare the listing and contact you to check the factual information before it goes live.")
    : t("Nous allons maintenant évaluer l’intérêt de l’outil pour les freelances, indépendants et petites équipes.", "We’ll now assess the tool’s relevance for freelancers, solopreneurs, and small teams.");
  const nextStepsBanner = paid
    ? t("Ta fiche sera publiée sous cinq jours ouvrés. Michael te contactera directement.", "Your listing will be published within five business days. Michael will contact you directly.")
    : t("Si l’outil est retenu, nous te contacterons dès que sa fiche sera publiée.", "If the tool is selected, we’ll contact you as soon as its listing is published.");
  const footnote = paid
    ? t("Le paiement garantit le délai de publication. Il n’influence ni la note, ni le verdict, ni le classement.", "Payment guarantees the publication timeline. It never influences the score, verdict, or ranking.")
    : t("Le badge confirme que la soumission est complète. La publication reste soumise à notre sélection éditoriale indépendante.", "The badge confirms that the submission is complete. Publication remains subject to our independent editorial selection.");
  const editorBlock = paid
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border-collapse:separate;">
              <tr><td style="padding:20px 22px;background:#FFFFFF;border:1px solid #E6E6E6;border-radius:10px;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0F0F0F;">${t("Une question sur ta fiche ?", "A question about your listing?")}</p>
                <p style="margin:0;font-size:14px;line-height:1.55;color:#6F6F68;">${t("Écris directement à", "Write directly to")} <a href="mailto:contact@tooltrim.com?subject=${encodeURIComponent(t(`À propos de la fiche ${String(toolName ?? "de mon outil")}`, `About the listing for ${String(toolName ?? "my tool")}`))}" style="color:#0F0F0F;font-weight:600;">Michael · contact@tooltrim.com</a>${t(" — il te répond lui-même.", " — he answers himself.")}</p>
              </td></tr>
            </table>`
    : "";
  const selectionBlock = paid ? "" : `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 0;border-collapse:separate;">
              <tr><td style="padding:22px;background:#FFFFFF;border:1px solid #E6E6E6;border-radius:10px;">
                <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:1px;color:#6F6F68;">${t("CE QUE NOUS REGARDONS", "WHAT WE LOOK FOR")}</p>
                <p style="margin:0 0 9px;font-size:14px;line-height:1.5;color:#0F0F0F;"><strong>01 · ${t("Une utilité claire", "Clear usefulness")}</strong><br><span style="color:#6F6F68;">${t("pour les freelances, indépendants ou petites équipes.", "for freelancers, solopreneurs, or small teams.")}</span></p>
                <p style="margin:0 0 9px;font-size:14px;line-height:1.5;color:#0F0F0F;"><strong>02 · ${t("Une promesse vérifiable", "A verifiable promise")}</strong><br><span style="color:#6F6F68;">${t("avec des usages et des informations suffisamment précis.", "with sufficiently clear use cases and information.")}</span></p>
                <p style="margin:0;font-size:14px;line-height:1.5;color:#0F0F0F;"><strong>03 · ${t("Une vraie aide au choix", "Real decision value")}</strong><br><span style="color:#6F6F68;">${t("pour permettre une comparaison utile et indépendante.", "to support a useful, independent comparison.")}</span></p>
              </td></tr>
            </table>`;
  const upgradeBlock = paid ? "" : `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border-collapse:separate;">
              <tr><td style="padding:22px;background:#F6F5F4;border-radius:10px;">
                <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0F0F0F;">${t("Tu préfères un délai garanti ?", "Would you prefer a guaranteed timeline?")}</p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#6F6F68;">${t("La publication prioritaire à 29 $ lance directement la création de la fiche, sans badge, avec une mise en ligne sous cinq jours ouvrés. La note et le verdict restent indépendants.", "Priority publication at $29 starts the listing creation directly, with no badge and publication within five business days. The score and verdict remain independent.")}</p>
                <a href="https://tooltrim.com/${lang}/submit#submit-plans-title" style="color:#1D4ED8;font-size:14px;font-weight:700;text-decoration:none;">${t("Découvrir la publication prioritaire", "Explore priority publication")} →</a>
              </td></tr>
            </table>`;

  return `<!doctype html>
  <html lang="${lang}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;padding:0;background:#F6F5F4;color:#0F0F0F;font-family:'Uncut Sans',Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F5F4;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FFFFFF;border:1px solid #E6E6E6;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:24px 32px;border-bottom:1px solid #E6E6E6;">
            <table role="presentation" width="100%"><tr>
              <td><img src="https://tooltrim.com/logo-tooltrim-email.svg" width="136" height="30" alt="ToolTrim" style="display:block;width:136px;height:30px;border:0;" /></td>
              <td align="right" style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#6F6F68;">${eyebrow}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:48px 32px 40px;">
            <p style="margin:0 0 16px;font-size:12px;font-weight:700;letter-spacing:1.1px;color:#6F6F68;">${t("SOUMISSION D’UN OUTIL", "TOOL SUBMISSION")}</p>
            <h1 style="margin:0 0 22px;font-size:38px;line-height:1.06;font-weight:600;letter-spacing:-1.6px;color:#0F0F0F;">${t("Merci", "Thank you")}, ${safeName}.</h1>
            <p style="margin:0 0 14px;font-size:17px;line-height:1.6;color:#0F0F0F;">${intro}</p>
            <p style="margin:0;font-size:16px;line-height:1.65;color:#6F6F68;">${nextStepsBody}</p>
            ${selectionBlock}
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:32px 0;border-collapse:separate;">
              <tr><td style="padding:22px;background:#EDEBE9;border:1px solid #E6E6E6;border-radius:10px;">
                <p style="margin:0 0 7px;font-size:11px;font-weight:700;letter-spacing:1px;color:#6F6F68;">${t("PROCHAINE ÉTAPE", "WHAT HAPPENS NEXT")}</p>
                <p style="margin:0;font-size:16px;font-weight:600;line-height:1.5;color:#0F0F0F;">${nextStepsBanner}</p>
              </td></tr>
            </table>
            ${editorBlock}
            <p style="margin:0 0 30px;font-size:13px;line-height:1.55;color:#6F6F68;">${footnote}</p>
            ${upgradeBlock}
            <a href="https://tooltrim.com/${lang}" style="display:inline-block;padding:13px 20px;background:#0F0F0F;border:1px solid #0F0F0F;border-radius:7px;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;">${t("Explorer ToolTrim", "Explore ToolTrim")} →</a>
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;">
          <tr><td align="center" style="padding:34px 24px 8px;">
            <img src="https://tooltrim.com/picto-logo.svg" width="38" height="38" alt="" style="display:block;width:38px;height:38px;margin:0 auto 18px;border:0;border-radius:7px;" />
            <p style="margin:0 0 8px;font-size:13px;line-height:1.55;color:#6F6F68;">${t("Tu reçois cet email car tu as soumis un outil à ToolTrim.", "You’re receiving this email because you submitted a tool to ToolTrim.")}</p>
            <p style="margin:0 0 18px;font-size:12px;line-height:1.5;color:#6F6F68;">© 2026 ToolTrim. ${t("Des choix logiciels indépendants.", "Independent software decisions.")}</p>
            <p style="margin:0;font-size:12px;line-height:1.6;">
              <a href="https://tooltrim.com/${lang}/contact" style="color:#0F0F0F;text-decoration:underline;">Contact</a>
              <span style="padding:0 9px;color:#A2A29B;">·</span>
              <a href="https://tooltrim.com/${lang}/transparency" style="color:#0F0F0F;text-decoration:underline;">${t("Transparence", "Transparency")}</a>
              <span style="padding:0 9px;color:#A2A29B;">·</span>
              <a href="https://tooltrim.com/${lang}/privacy-policy" style="color:#0F0F0F;text-decoration:underline;">${t("Confidentialité", "Privacy")}</a>
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
    toolName, toolUrl, submitterRole, badgeReview, badgeUrl, verificationToken, paid, lang,
  } = req.body ?? {};

  if (!name || !email || !subject || !message || !isValidEmail(email)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if ([name, email, subject].some((value) => String(value).length > 300) || String(message).length > 2000) {
    return res.status(400).json({ error: "Field too long" });
  }

  const isToolSubmission = submissionType === "tool";
  const isPaidSubmission = isToolSubmission && Boolean(paid);
  if (isToolSubmission && (!toolName || !isValidHttpUrl(toolUrl) || !submitterRole)) {
    return res.status(400).json({ error: "Invalid tool submission" });
  }
  if (isToolSubmission && badgeReview && !isValidHttpUrl(badgeUrl)) {
    return res.status(400).json({ error: "Invalid badge URL" });
  }
  if (isToolSubmission && badgeReview && !hasValidBadgeToken(verificationToken, badgeUrl, toolUrl)) {
    return res.status(400).json({ error: "Badge verification required" });
  }
  if (isToolSubmission && badgeReview) {
    try {
      await verifyBadgeOnPage(badgeUrl, toolUrl);
    } catch {
      return res.status(400).json({ error: "Badge must still be installed when the submission is sent" });
    }
  }

  const submissionLang: "fr" | "en" = lang === "fr" ? "fr" : "en";
  const internalOfferLabel = isPaidSubmission ? "PAYANT 29 $" : "GRATUIT + BADGE";
  const reviewLane = isPaidSubmission ? "Publication garantie sous 5 jours" : badgeReview ? "Sélection éditoriale standard — badge vérifié" : "Sélection éditoriale standard";
  const safeSubjectToolName = String(toolName ?? "").replace(/[\r\n]/g, " ");
  const toolDetails = isToolSubmission ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border-collapse:separate;">
        <tr><td style="padding:18px 20px;background:${isPaidSubmission ? "#111111" : "#F1F1ED"};color:${isPaidSubmission ? "#FFFFFF" : "#1D1D1F"};border-radius:10px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.8px;">${internalOfferLabel}</p>
          <p style="margin:0;font-size:18px;font-weight:700;">Formulaire terminé · prêt à traiter</p>
        </td></tr>
      </table>
      <p><strong>Outil :</strong> ${escapeHtml(toolName)}</p>
      <p><strong>Site officiel :</strong> ${escapeHtml(toolUrl)}</p>
      <p><strong>Lien avec l'outil :</strong> ${escapeHtml(submitterRole)}</p>
      <p><strong>File de revue :</strong> ${reviewLane}</p>
      ${badgeReview ? `<p><strong>URL du badge :</strong> ${escapeHtml(badgeUrl)}</p>` : ""}
      <hr />
    ` : "";

  const { error } = await resend.emails.send({
    from: "ToolTrim Contact <contact@tooltrim.com>",
    to: "contact@tooltrim.com",
    replyTo: email,
    subject: isToolSubmission
      ? `[${internalOfferLabel}][3/3] ${safeSubjectToolName} — Formulaire validé`
      : `[Contact] ${String(subject).replace(/[\r\n]/g, " ")}`,
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
      subject: isPaidSubmission
        ? (submissionLang === "fr" ? `Création de ta fiche lancée — ${safeSubjectToolName}` : `Your listing creation has started — ${safeSubjectToolName}`)
        : (submissionLang === "fr" ? `Demande enregistrée — ${safeSubjectToolName}` : `Request registered — ${safeSubjectToolName}`),
      html: submissionConfirmationHtml({ name, toolName, paid: isPaidSubmission, lang: submissionLang }),
    });
    if (confirmation.error) {
      console.error("[contact] Submission confirmation error:", confirmation.error);
    }
  }

  return res.status(200).json({ success: true });
}
