/**
 * Optional transactional email. Persisted leads must not depend on delivery.
 * Configure EMAIL_PROVIDER=smtp with SMTP_* vars, or leave unset to skip sending.
 */
import nodemailer from "nodemailer";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailConfigured() {
  return (
    process.env.EMAIL_PROVIDER === "smtp" &&
    Boolean(process.env.SMTP_HOST) &&
    Boolean(process.env.SMTP_FROM) &&
    Boolean(process.env.SMTP_USER || process.env.SMTP_PASS || true)
  );
}

function createTransport() {
  if (!emailConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER || process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER || "",
            pass: process.env.SMTP_PASS || "",
          }
        : undefined,
  });
}

export async function sendMail({ to, subject, text, html, replyTo }) {
  const transport = createTransport();
  if (!transport) {
    return { sent: false, skipped: true };
  }
  const from = process.env.SMTP_FROM;
  if (!to || !from) {
    return { sent: false, skipped: true };
  }
  await transport.sendMail({
    from,
    to,
    subject: String(subject || "").slice(0, 200),
    text: String(text || "").slice(0, 20000),
    html: html ? String(html).slice(0, 50000) : undefined,
    replyTo: replyTo ? String(replyTo).slice(0, 254) : undefined,
  });
  return { sent: true, skipped: false };
}

export function leadInternalEmail(lead, inbox) {
  const lines = [
    `New HelperBook ${lead.type} request (${lead.referenceId})`,
    "",
    `Name: ${lead.fullName}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || "—"}`,
    `Company: ${lead.companyName || "—"}`,
    `Team size: ${lead.teamSize || "—"}`,
    `Category: ${lead.inquiryCategory || "—"}`,
    `Preferred date: ${lead.preferredDate || "—"} (request only, not confirmed)`,
    `Preferred time: ${lead.preferredTimeWindow || "—"}`,
    `Timezone: ${lead.timezone || "Asia/Kolkata"}`,
    `Source: ${lead.sourcePage || "—"}`,
    "",
    "Message:",
    lead.message || "—",
  ];
  const text = lines.join("\n");
  const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`;
  return {
    to: inbox,
    subject: `[HelperBook] ${lead.type === "demo" ? "Demo request" : "Inquiry"} ${lead.referenceId}`,
    text,
    html,
    replyTo: lead.email,
  };
}

export function leadAckEmail(lead) {
  const isDemo = lead.type === "demo";
  const text = isDemo
    ? `Hi ${lead.fullName},\n\nYour demo request (${lead.referenceId}) has been received. Our team will contact you to confirm a suitable time.\n\nA preferred date is a request, not a confirmed appointment.\n\n— HelperBook`
    : `Hi ${lead.fullName},\n\nYour inquiry (${lead.referenceId}) has been received. Our team will get back to you.\n\n— HelperBook`;
  return {
    to: lead.email,
    subject: isDemo ? `Demo request received (${lead.referenceId})` : `Inquiry received (${lead.referenceId})`,
    text,
    html: `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
  };
}
