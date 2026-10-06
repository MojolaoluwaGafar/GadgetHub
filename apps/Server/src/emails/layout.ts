// Building blocks shared by every GadgetHub email, in the shop's colours
// (violet, ink and a soft lilac wash). Email clients only render tables and
// inline styles reliably, so the layout is built from those, and the web font
// falls back to Arial.

export { clientUrl } from "../config/env";

export const C = {
  violet: "#6C4CF1",
  violetSoft: "#F3F0FF",
  ink: "#191C1F",
  muted: "#5F6C72",
  hairline: "#E8E6E6",
  page: "#F6F5FB",
  white: "#FFFFFF",
};

export const SANS = "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif";

// The logo the first version's emails used, hosted on Cloudinary.
const LOGO_URL = "https://res.cloudinary.com/dfrzhfxtd/image/upload/v1770115039/GadgetHub_Logo_kjrrn6.png";

// Anything a person typed (names, addresses) goes into HTML, so escape it.
export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export const naira = (amount: number) => `&#8358;${amount.toLocaleString("en-NG")}`;

export const button = (href: string, text: string) =>
  `<div style="margin-top:24px"><a href="${escapeHtml(href)}" style="display:inline-block;background:${C.violet};color:${C.white};font:600 15px/18px ${SANS};text-decoration:none;padding:14px 26px;border-radius:8px">${text}</a></div>`;

export const paragraph = (html: string) =>
  `<p style="margin:14px 0 0;font:400 15px/24px ${SANS};color:${C.ink}">${html}</p>`;

export const detailRows = (rows: [string, string][]) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:18px">
    ${rows
      .map(
        ([name, value]) => `
      <tr>
        <td style="padding:6px 18px 6px 0;font:600 11px/18px ${SANS};letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};white-space:nowrap;vertical-align:top">${name}</td>
        <td style="padding:6px 0;font:400 15px/20px ${SANS};color:${C.ink}">${value}</td>
      </tr>`,
      )
      .join("")}
  </table>`;

// Order lines with a total, as a simple two-column table.
export const itemsTable = (items: { name: string; quantity: number; price: number }[], totals: [string, number][]) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid ${C.hairline}">
    ${items
      .map(
        (item) => `
      <tr>
        <td style="padding:10px 0;font:400 14px/20px ${SANS};color:${C.ink};border-bottom:1px solid ${C.hairline}">${escapeHtml(item.name)} &times; ${item.quantity}</td>
        <td align="right" style="padding:10px 0;font:600 14px/20px ${SANS};color:${C.ink};border-bottom:1px solid ${C.hairline};white-space:nowrap">${naira(item.price * item.quantity)}</td>
      </tr>`,
      )
      .join("")}
    ${totals
      .map(
        ([label, amount], index) => `
      <tr>
        <td style="padding:${index === 0 ? 12 : 4}px 0 0;font:${index === totals.length - 1 ? 700 : 400} 14px/20px ${SANS};color:${index === totals.length - 1 ? C.ink : C.muted}">${label}</td>
        <td align="right" style="padding:${index === 0 ? 12 : 4}px 0 0;font:700 14px/20px ${SANS};color:${C.ink}">${naira(amount)}</td>
      </tr>`,
      )
      .join("")}
  </table>`;

// The page around every email: a soft background, the logo, a white card with
// the heading, and a short footer. `preheader` is the grey preview line inboxes
// show after the subject.
export function emailLayout({ preheader, heading, body }: { preheader: string; heading: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${C.page}">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
            <tr>
              <td style="padding:0 4px 18px"><img src="${LOGO_URL}" width="152" height="39" alt="GadgetHub" style="display:block;border:0" /></td>
            </tr>
            <tr>
              <td style="background:${C.white};border:1px solid ${C.hairline};border-top:6px solid ${C.violet};border-radius:12px;padding:32px 28px">
                <h1 style="margin:0;font:600 24px/30px ${SANS};color:${C.ink}">${heading}</h1>
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 4px 0;font:400 12px/18px ${SANS};color:${C.muted}">
                You're getting this because you have a GadgetHub account. Questions? Reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
