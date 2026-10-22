import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env.js";

/**
 * SMTP transport for transactional email.
 *
 * Defaults to Gmail on port 587 with STARTTLS. `NODEMAIL_PASS` must be a Google
 * App Password (16 characters), not the account's normal password. Credentials
 * are read from the backend `.env` only and never leave this process.
 */
const transporter: Transporter = nodemailer.createTransport({
  host: env.NODEMAIL_HOST,
  port: env.NODEMAIL_PORT,
  secure: env.NODEMAIL_SECURE,
  requireTLS: env.NODEMAIL_REQUIRE_TLS,
  auth: {
    user: env.NODEMAIL_USER,
    pass: env.NODEMAIL_PASS,
  },
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 20_000,
});

const FROM = {
  name: env.NODEMAIL_FROM_NAME,
  address: env.NODEMAIL_USER,
};

export interface SendVerificationCodeEmailInput {
  to: string;
  userName: string;
  code: string;
  expiresInMinutes: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends a six-digit email verification code.
 *
 * The OTP is only ever sent to the recipient: it is never logged, so a leaked
 * log file cannot be used to verify an account.
 */
export async function sendVerificationCodeEmail(
  input: SendVerificationCodeEmailInput,
): Promise<{ success: boolean; error?: string }> {
  const { to, userName, code, expiresInMinutes } = input;
  const safeName = escapeHtml(userName);
  const minutes = Math.max(1, Math.round(expiresInMinutes));

  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: "Your Agrivet verification code",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1f2937; padding: 24px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
              <h2 style="margin-top: 0; color: #111827;">Verify your email address</h2>
              <p>Hi ${safeName},</p>
              <p>Thanks for creating an Agrivet account. Enter the code below in the app to verify your email address:</p>
              <div style="margin: 24px 0; padding: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; text-align: center;">
                <span style="font-size: 34px; font-weight: 700; letter-spacing: 12px; color: #14532d;">${code}</span>
              </div>
              <p>This code expires in <strong>${minutes} ${minutes === 1 ? "minute" : "minutes"}</strong> and can be used only once.</p>
              <p>If you did not create this account, you can safely ignore this email.</p>
              <p style="margin-top: 32px; color: #9ca3af; font-size: 12px;">— The Agrivet Team</p>
            </div>
          </body>
        </html>
      `,
      text: `Hi ${userName},

Thanks for creating an Agrivet account. Enter this code in the app to verify your email address:

${code}

This code expires in ${minutes} ${minutes === 1 ? "minute" : "minutes"} and can be used only once.

If you did not create this account, you can safely ignore this email.

— The Agrivet Team`,
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Verification email delivery failed:", message);
    return { success: false, error: message };
  }
}
