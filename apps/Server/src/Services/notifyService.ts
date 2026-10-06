import { SendEmail } from "../Utils/SendMail";
import type { EmailContent } from "../emails/templates";

// Sends without making the caller wait: an email outage must never fail (or
// slow down) the request that triggered it. SendEmail logs failures itself.
export function notify(to: string | null | undefined, content: EmailContent): void {
  if (!to) return;
  void SendEmail({ to: [to], subject: content.subject, html: content.html, text: content.text });
}

// The same, but waits for the result (password resets, where the user is
// waiting for the email and nothing else happens anyway).
export async function notifyNow(to: string, content: EmailContent): Promise<boolean> {
  return SendEmail({ to: [to], subject: content.subject, html: content.html, text: content.text });
}
