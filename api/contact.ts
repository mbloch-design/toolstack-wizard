import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body ?? {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { error } = await resend.emails.send({
    from: "ToolTrim Contact <onboarding@resend.dev>", // temp — swap to contact@tooltrim.com once domain verified on Resend
    to: "contact@tooltrim.com",
    replyTo: email,
    subject: `[Contact] ${subject}`,
    html: `
      <p><strong>De :</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Sujet :</strong> ${subject}</p>
      <hr />
      <p>${String(message).replace(/\n/g, "<br>")}</p>
    `,
  });

  if (error) {
    console.error("[contact] Resend error:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}
