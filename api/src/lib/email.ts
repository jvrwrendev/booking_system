import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = new Resend(env.RESEND_API_KEY);

export interface SendVerificationEmailInput {
  to: string;
  userName: string;
  token: string;
  verifyUrl: string;
}

/**
 * Sends an email verification message via Resend.
 *
 * All Resend interaction happens on the backend only. The frontend never
 * touches the Resend API or the API key.
 */
export async function sendVerificationEmail(
  input: SendVerificationEmailInput,
): Promise<{ success: boolean; error?: string }> {
  const { to, userName, token, verifyUrl } = input;

  try {
    const { data, error } = await resend.emails.send({
      from: `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
      to: [to],
      subject: "Verify your Agrivet account",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1f2937; padding: 24px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
              <h2 style="margin-top: 0; color: #111827;">Verify your email address</h2>
              <p>Hi ${userName},</p>
              <p>Thanks for creating an Agrivet account. Please verify your email address by clicking the button below:</p>
              <p style="margin: 24px 0;">
                <a href="${verifyUrl}" style="background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block;">Verify email address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${verifyUrl}</p>
              <p>If you did not create this account, you can safely ignore this email.</p>
              <p style="margin-top: 32px; color: #9ca3af; font-size: 12px;">— The Agrivet Team</p>
            </div>
          </body>
        </html>
      `,
      text: `
        Hi ${userName},

        Thanks for creating an Agrivet account. Please verify your email address by visiting:

        ${verifyUrl}

        Or copy and paste the code below into the app:

        ${token}

        If you did not create this account, you can safely ignore this email.

        — The Agrivet Team
      `,
    });

    if (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : String(error);
      console.error("Resend error:", message);
      // Without a verified Resend domain, delivery can fail (e.g. Resend
      // rejects non-owner recipients). In development, log the link so the
      // verification flow can still be exercised locally.
      if (!env.isProduction) {
        console.info(`[dev] Verification link for ${to}: ${verifyUrl}`);
      }
      return { success: false, error: message };
    }

    return { success: true };
  } catch (error) {
    console.error("Resend exception:", error);
    if (!env.isProduction) {
      console.info(`[dev] Verification link for ${to}: ${verifyUrl}`);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
