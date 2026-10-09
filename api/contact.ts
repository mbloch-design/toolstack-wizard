import type { VercelRequest, VercelResponse } from "../types/vercel-http.js";
import { Resend } from "resend";
import { createHmac, timingSafeEqual } from "node:crypto";
import { verifyBadgeOnPage } from "./_badge-verification.js";

import { normalizeSubmission, submissionFingerprint, type SubmissionInput } from './_submission-contract.js';
import { getSubmission, reserveSubmission } from './_submission-store.js';
import { buildSubmissionJobs, sendAcceptedSubmission } from './_submission-mail.js';

import { verifySubmissionPayment, PaymentVerificationError } from "./_payment-verification.js";

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
    toolName, toolUrl, submitterRole, badgeUrl, verificationToken, paid, lang, checkoutId, paymentReference,
  } = req.body ?? {};

  if (!name || !email || !subject || !message || !isValidEmail(email)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if ([name, email, subject].some((value) => String(value).length > 300) || String(message).length > 2000) {
    return res.status(400).json({ error: "Field too long" });
  }

  const isToolSubmission = submissionType === "tool";
  if (isToolSubmission && paid != null && typeof paid !== "boolean") {
    return res.status(400).json({ error: "Invalid payment flag" });
  }
  const isPaidSubmission = isToolSubmission && paid === true;
  const requiresBadge = isToolSubmission && !isPaidSubmission;
  if (isToolSubmission && (!toolName || !isValidHttpUrl(toolUrl) || !submitterRole)) {
    return res.status(400).json({ error: "Invalid tool submission" });
  }
  if (requiresBadge && !isValidHttpUrl(badgeUrl)) {
    return res.status(400).json({ error: "Invalid badge URL" });
  }
  let normalized:SubmissionInput|undefined;
  let fingerprint='';
  if(isToolSubmission){
    try{normalized=normalizeSubmission(req.body);fingerprint=submissionFingerprint(normalized);}
    catch{return res.status(400).json({error:'Invalid tool submission'});}
    try{
      const existing=await getSubmission(normalized.submissionId);
      if(existing){
        if(existing.fingerprint!==fingerprint||existing.state!=='accepted')return res.status(409).json({error:'submission_conflict'});
        return res.status(200).json({success:true});
      }
    }catch{return res.status(503).json({error:'submission_store_unavailable'});}
  }
  if (isPaidSubmission) {
    try { await verifySubmissionPayment({ checkoutId, paymentReference, toolUrl }); }
    catch (error) {
      const failure = error instanceof PaymentVerificationError ? error : new PaymentVerificationError(503, "payment_verification_unavailable");
      return res.status(failure.status).json({ error: failure.message });
    }
  }
  if (requiresBadge && !hasValidBadgeToken(verificationToken, badgeUrl, toolUrl)) {
    return res.status(400).json({ error: "Badge verification required" });
  }
  if (requiresBadge) {
    try {
      await verifyBadgeOnPage(badgeUrl, toolUrl);
    } catch {
      return res.status(400).json({ error: "Badge must still be installed when the submission is sent" });
    }
  }

  if(normalized){
    try{
      const result=await reserveSubmission({version:1,submissionId:normalized.submissionId,fingerprint,checkoutId:normalized.checkoutId,state:'accepted',acceptedAt:Date.now(),jobs:buildSubmissionJobs(normalized)});
      if(result.status==='conflict')return res.status(409).json({error:'submission_conflict'});
      if(result.status==='created')await sendAcceptedSubmission(result.record);
      return res.status(200).json({success:true});
    }catch{return res.status(503).json({error:'submission_store_unavailable'});}
  }
  const {error}=await resend.emails.send({from:'ToolTrim Contact <contact@tooltrim.com>',to:'contact@tooltrim.com',replyTo:email,subject:`[Contact] ${String(subject).replace(/[\r\n]/g,' ')}`,html:`<p><strong>De :</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>Sujet :</strong> ${escapeHtml(subject)}</p><hr /><p>${escapeHtml(message).replace(/\n/g,'<br>')}</p>`});
  if(error)return res.status(500).json({error:error.message});
  return res.status(200).json({success:true});
}
