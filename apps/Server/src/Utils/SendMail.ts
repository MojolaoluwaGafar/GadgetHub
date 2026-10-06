import dotenv from "dotenv";
import nodemailer, { type Transporter } from "nodemailer";
import { BrevoClient } from "@getbrevo/brevo";
import { logger } from "./logger";

dotenv.config({ quiet: true });

interface EmailOptions {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

// Two ways to send, picked with EMAIL_PROVIDER:
// - "brevo" (default): Brevo's API. Use in production.
// - "gmail": a Gmail account over SMTP via nodemailer, for local testing so
//   test emails don't use up Brevo's daily allowance. Needs APP_EMAIL and a
//   Google app password in APP_PASSWORD. Render's free plan blocks outgoing
//   SMTP, so don't use this there.
type Provider = "brevo" | "gmail";
// Unset: Brevo when its key is there, else Gmail (the first version's setup).
const configured = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
const provider: Provider = configured === "gmail" || (!configured && !process.env.BREVO_API_KEY?.trim()) ? "gmail" : "brevo";

const SENDER_NAME = "GadgetHub";

// ------------------------------------------------------------------- Brevo

const brevoApiKey = process.env.BREVO_API_KEY?.trim();
// Must be a sender (or domain) verified in Brevo. Brevo still accepts the API
// call for an unverified sender, then drops the email: check Brevo > Logs.
const brevoFrom = process.env.EMAIL_FROM?.trim();
const brevoClient = provider === "brevo" && brevoApiKey ? new BrevoClient({ apiKey: brevoApiKey }) : null;

async function sendWithBrevo({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  if (!brevoClient || !brevoFrom) {
    logger.warn({ subject }, "Email skipped: BREVO_API_KEY or EMAIL_FROM is not set");
    return false;
  }
  await brevoClient.transactionalEmails.sendTransacEmail({
    sender: { email: brevoFrom, name: SENDER_NAME },
    to: to.map((email) => ({ email })),
    subject,
    htmlContent: html,
    ...(text ? { textContent: text } : {}),
  });
  logger.info({ subject, recipients: to.length, from: brevoFrom }, "Email accepted by Brevo");
  return true;
}

// ------------------------------------------------------------------- Gmail

// EMAIL_USER / EMAIL_PASS are the names the first version used.
const gmailUser = (process.env.APP_EMAIL || process.env.EMAIL_USER)?.trim();
// Google shows app passwords in groups of four; the spaces aren't part of it.
const gmailPass = (process.env.APP_PASSWORD || process.env.EMAIL_PASS)?.replace(/\s+/g, "");

let gmailTransport: Transporter | null = null;
const getGmailTransport = () => {
  // SMTP_* override the Gmail defaults (port 587 with STARTTLS).
  gmailTransport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE?.trim() === "true",
    requireTLS: true,
    auth: { user: gmailUser, pass: gmailPass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
  return gmailTransport;
};

async function sendWithGmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  if (!gmailUser || !gmailPass) {
    logger.warn({ subject }, "Email skipped: EMAIL_PROVIDER=gmail needs APP_EMAIL and APP_PASSWORD");
    return false;
  }
  // Gmail only sends as the signed-in account.
  const info = await getGmailTransport().sendMail({
    from: { name: SENDER_NAME, address: gmailUser },
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
  logger.info({ subject, recipients: to.length, from: gmailUser, response: info.response }, "Email sent via Gmail");
  return true;
}

// ------------------------------------------------------------------ public

export const emailProvider = provider;

// Returns false instead of throwing, so a mail outage never fails the request
// that triggered it.
export const SendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (options.to.length === 0) {
    logger.warn({ subject: options.subject }, "Email skipped: no recipients");
    return false;
  }
  try {
    return provider === "gmail" ? await sendWithGmail(options) : await sendWithBrevo(options);
  } catch (error) {
    const smtp = error as { code?: string; response?: string };
    logger.error(
      { err: error, subject: options.subject, provider, smtpCode: smtp.code, smtpResponse: smtp.response },
      "Email failed",
    );
    return false;
  }
};
