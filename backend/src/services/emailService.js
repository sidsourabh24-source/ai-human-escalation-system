import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Build transporter only if SMTP credentials are provided
let transporter = null;

if (env.smtpHost && env.smtpUser && env.smtpPass) {
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  // Verify connection on startup
  transporter.verify()
    .then(() => console.log("[email] SMTP transporter ready"))
    .catch((err) => {
      console.warn("[email] SMTP verification failed, falling back to console:", err.message);
      transporter = null;
    });
} else {
  console.log("[email] No SMTP credentials configured, emails will be logged to console");
}

export async function sendEscalationEmail({ conversationId, userMessage }) {
  const subject = `🚨 Escalation Alert — Conversation ${conversationId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc3545; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">⚠️ Escalation Alert</h2>
      </div>
      <div style="background: #f8f9fa; padding: 24px; border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 8px 8px;">
        <p><strong>Conversation ID:</strong> ${conversationId}</p>
        <p><strong>User Message:</strong></p>
        <blockquote style="background: white; border-left: 4px solid #dc3545; padding: 12px 16px; margin: 8px 0; border-radius: 4px;">
          ${userMessage}
        </blockquote>
        <p style="margin-top: 16px;">
          <a href="${env.frontendUrl}/agent" 
             style="background: #0d6efd; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Open Agent Dashboard
          </a>
        </p>
        <p style="color: #6c757d; font-size: 13px; margin-top: 16px;">
          This is an automated alert from the AI-Human Escalation System.
        </p>
      </div>
    </div>
  `;

  // If transporter is available, send real email
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Escalation System" <${env.smtpUser}>`,
        to: env.agentAlertEmail,
        subject,
        html
      });
      console.log("[email] Escalation email sent:", info.messageId);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("[email] Preview URL:", previewUrl);
      }
      return { sent: true, messageId: info.messageId, previewUrl: previewUrl || null };
    } catch (err) {
      console.error("[email] Failed to send escalation email:", err.message);
      return { sent: false, error: err.message };
    }
  }

  // Fallback: log to console
  console.log("[email] (mock) Escalation email:");
  console.log(`  To: ${env.agentAlertEmail || "not configured"}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Conversation: ${conversationId}`);
  console.log(`  User Message: ${userMessage}`);
  return { sent: false, mock: true };
}
