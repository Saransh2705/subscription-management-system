import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function getMagicLinkTemplate({
  projectName,
  title,
  magicLink,
}: {
  projectName: string;
  title: string;
  magicLink: string;
}) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #111111; color: #f5f5f5; border-radius: 12px; border: 1px solid #2a2a2a;">
      <h1 style="font-size: 24px; margin: 0 0 12px;">${title}</h1>
      <p style="margin: 0 0 16px; color: #c7c7c7;">Use the secure button below to continue in ${projectName}.</p>
      <a href="${magicLink}" style="display: inline-block; padding: 12px 20px; border-radius: 10px; text-decoration: none; background: linear-gradient(135deg, #fb923c, #f43f5e); color: #ffffff; font-weight: 700;">Open Magic Link</a>
      <p style="margin-top: 16px; font-size: 12px; color: #8f8f8f;">If the button fails, copy this URL into your browser: ${magicLink}</p>
    </div>
  `;
}

export async function sendMagicLinkEmail({
  to,
  subject,
  magicLink,
}: {
  to: string;
  subject: string;
  magicLink: string;
}) {
  const senderName = process.env.MAIL_SENDER_NAME || "Sublytics";
  const senderEmail = process.env.MAIL_SENDER_EMAIL;

  if (!senderEmail) {
    throw new Error("MAIL_SENDER_EMAIL is not set");
  }

  const resend = getResendClient();
  if (!resend) {
    // Don't throw during module import or in dev — log and skip sending
    // This prevents server startup from failing when the key is not configured.
    // In production you should set RESEND_API_KEY so emails are actually sent.
    // eslint-disable-next-line no-console
    console.warn("RESEND_API_KEY not set — skipping sending magic link to", to);
    return;
  }

  await resend.emails.send({
    from: `${senderName} <${senderEmail}>`,
    to,
    subject,
    html: getMagicLinkTemplate({
      projectName: senderName,
      title: subject,
      magicLink,
    }),
  });
}
