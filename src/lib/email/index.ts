import { Resend } from "resend";
import nodemailer from "nodemailer";
import { generateInvitationEmailHtml, InvitationEmailProps } from "./templates/invitation";
import { generateWelcomeEmailHtml, WelcomeEmailProps } from "./templates/welcome";

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  provider: "resend" | "smtp" | "console";
  error?: string;
}

/**
 * Universal email dispatcher:
 * - If RESEND_API_KEY is present -> Sends via Resend (Modern HTTP API)
 * - If SMTP_HOST / SMTP_USER is present -> Sends via Nodemailer (SMTP / Gmail / Brevo / SES)
 * - Otherwise -> Logs in console with preview URL for instant local testing without keys
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailPayload): Promise<EmailDispatchResult> {
  const from = process.env.EMAIL_FROM || "Ascent Onboarding <onboarding@resend.dev>";

  // 1. Check Resend Provider
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const res = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text: text || "Please view this email in an HTML-capable email client.",
      });

      if (res.error) {
        console.error("[EMAIL_SERVICE:RESEND_ERROR]", res.error);
        return { success: false, provider: "resend", error: res.error.message };
      }

      console.log(`[EMAIL_SERVICE:RESEND_SUCCESS] Email sent to ${to} (ID: ${res.data?.id})`);
      return { success: true, messageId: res.data?.id, provider: "resend" };
    } catch (err: any) {
      console.error("[EMAIL_SERVICE:RESEND_EXCEPTION]", err);
      return { success: false, provider: "resend", error: err.message };
    }
  }

  // 2. Check SMTP Provider
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && smtpPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: smtpPassword,
        },
      });

      const fromAddress =
        process.env.SMTP_FROM ||
        (process.env.SMTP_USER
          ? `Ascent Onboarding <${process.env.SMTP_USER}>`
          : from);

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        text,
      });

      console.log(`[EMAIL_SERVICE:SMTP_SUCCESS] Email sent to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: "smtp" };
    } catch (err: any) {
      console.error("[EMAIL_SERVICE:SMTP_EXCEPTION]", err);
      return { success: false, provider: "smtp", error: err.message };
    }
  }

  // 3. Fallback: Development Logger
  console.log("\n==================================================");
  console.log(`✉️ [EMAIL_SERVICE:DEV_MODE] No external email provider configured.`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log("--------------------------------------------------");
  console.log(text || "HTML Email dispatched. Preview available in browser.");
  console.log("==================================================\n");

  return { success: true, provider: "console" };
}

/**
 * Sends a workforce invitation email to a newly invited employee or manager.
 */
export async function sendWorkspaceInvitationEmail(params: InvitationEmailProps) {
  const html = generateInvitationEmailHtml(params);
  const plainText = `You've been invited to join ${params.companyName} on Ascent Onboarding as a ${params.role}.\n\nActivate your account here: ${params.inviteUrl}`;

  return await sendEmail({
    to: params.to,
    subject: `Invitation: Join ${params.companyName} on Ascent`,
    html,
    text: plainText,
  });
}

/**
 * Sends a welcome kickoff email to an employee upon profile setup.
 */
export async function sendWelcomeOnboardingEmail(params: WelcomeEmailProps) {
  const html = generateWelcomeEmailHtml(params);
  const plainText = `Welcome to ${params.companyName}!\n\nYour profile has been created. Access your onboarding hub here: ${params.dashboardUrl}`;

  return await sendEmail({
    to: params.to,
    subject: `Welcome to ${params.companyName} — Let's get started`,
    html,
    text: plainText,
  });
}
