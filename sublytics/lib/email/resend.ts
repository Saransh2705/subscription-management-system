import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export interface SendMagicLinkParams {
  email: string;
  magicLink: string;
  type: 'login' | 'invite' | 'reset';
}

export async function sendMagicLinkEmail({
  email,
  magicLink,
  type,
}: SendMagicLinkParams) {
  const subject = {
    login: 'Sign in to Sublytics',
    invite: 'You\'ve been invited to Sublytics',
    reset: 'Reset your Sublytics password',
  }[type];

  const heading = {
    login: 'Sign in to your account',
    invite: 'Welcome to Sublytics',
    reset: 'Reset your password',
  }[type];

  const description = {
    login: 'Click the button below to sign in to your account.',
    invite: 'You\'ve been invited to join Sublytics. Click the button below to set up your account.',
    reset: 'Click the button below to reset your password.',
  }[type];

  const buttonText = {
    login: 'Sign In',
    invite: 'Accept Invitation',
    reset: 'Reset Password',
  }[type];

  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.MAIL_SENDER_NAME} <${process.env.MAIL_SENDER_EMAIL}>`,
      to: [email],
      subject,
      html: getMagicLinkEmailTemplate({
        heading,
        description,
        magicLink,
        buttonText,
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

interface EmailTemplateParams {
  heading: string;
  description: string;
  magicLink: string;
  buttonText: string;
}

function getMagicLinkEmailTemplate({
  heading,
  description,
  magicLink,
  buttonText,
}: EmailTemplateParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sublytics</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="width: 48px; height: 48px; background-color: #3b82f6; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="color: #ffffff; font-size: 24px; font-weight: bold;">S</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1f2937;">Sublytics</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Subscription management, simplified</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1f2937;">${heading}</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #4b5563;">${description}</p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${magicLink}" style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">${buttonText}</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                Or copy and paste this URL into your browser:<br>
                <a href="${magicLink}" style="color: #3b82f6; word-break: break-all;">${magicLink}</a>
              </p>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                This link will expire in 1 hour for security reasons.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
