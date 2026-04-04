import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getStaffInviteTemplate({
  email,
  password,
  invitedBy,
}: {
  email: string;
  password: string;
  invitedBy: string;
}) {
  const appUrl = getAppUrl();

  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #111111; color: #f5f5f5; border-radius: 16px; border: 1px solid #2a2a2a;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #fb923c, #f43f5e); color: white; font-weight: bold; font-size: 24px; line-height: 48px;">S</div>
        <h1 style="font-size: 28px; margin: 16px 0 8px; background: linear-gradient(135deg, #fb923c, #f43f5e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Welcome to Sublytics</h1>
        <p style="color: #c7c7c7; font-size: 14px;">You've been invited to join the team</p>
      </div>

      <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="margin: 0 0 16px; color: #c7c7c7;">You have been invited by <strong style="color: #f5f5f5;">${invitedBy}</strong> to join the Sublytics platform.</p>
        
        <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #8f8f8f; text-transform: uppercase;">Your Login Credentials</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Email:</strong> <code style="background: rgba(251, 146, 60, 0.1); padding: 4px 8px; border-radius: 4px; color: #fb923c;">${email}</code></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Password:</strong> <code style="background: rgba(251, 146, 60, 0.1); padding: 4px 8px; border-radius: 4px; color: #fb923c;">${password}</code></p>
        </div>

        <p style="margin: 16px 0 8px; font-size: 13px; color: #fbbf24;">⚠️ Important: You will be required to change this password on first login.</p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${appUrl}/login" style="display: inline-block; padding: 14px 32px; border-radius: 12px; text-decoration: none; background: linear-gradient(135deg, #fb923c, #f43f5e); color: #ffffff; font-weight: 700; box-shadow: 0 0 30px rgba(251, 146, 60, 0.4);">Login to Dashboard</a>
      </div>

      <div style="border-top: 1px solid #2a2a2a; padding-top: 20px; margin-top: 32px;">
        <p style="font-size: 12px; color: #8f8f8f; text-align: center;">If you did not expect this invitation, please ignore this email or contact support.</p>
        <p style="font-size: 12px; color: #8f8f8f; text-align: center; margin-top: 8px;">© ${new Date().getFullYear()} Sublytics. All rights reserved.</p>
      </div>
    </div>
  `;
}

export async function sendStaffInviteEmail({
  to,
  password,
  invitedBy,
}: {
  to: string;
  password: string;
  invitedBy: string;
}) {
  const senderName = process.env.MAIL_SENDER_NAME || "Sublytics";
  const senderEmail = process.env.MAIL_SENDER_EMAIL;

  if (!senderEmail) {
    console.warn("MAIL_SENDER_EMAIL not set — skipping staff invite email to", to);
    return { ok: false, error: "MAIL_SENDER_EMAIL not set" };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping staff invite email to", to);
    return { ok: false, error: "RESEND_API_KEY not set" };
  }
  try {
    const res = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to,
      subject: "Welcome to Sublytics - Your Account Credentials",
      html: getStaffInviteTemplate({ email: to, password, invitedBy }),
    });

    // Log success with resend response object
    // eslint-disable-next-line no-console
    console.log("Staff invite email sent to", to, "response:", res);

    // Try to extract a message id if present in the response
    const messageId = (res && (res as any).data && (res as any).data.id) || null;
    return { ok: true, id: messageId };
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("Failed to send staff invite email to", to, err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}
