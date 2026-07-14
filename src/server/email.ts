import express, { type Express, type Response } from "express";
import { Resend } from "resend";
import { adminDb, FieldValue } from "./supabaseAdmin";
import type { AuthenticatedRequest } from "./security";

export type EmailTemplate =
  | "welcome"
  | "application_received"
  | "subscription_activated"
  | "payment_failed";

interface SendEmailInput {
  to: string;
  userId?: string;
  template: EmailTemplate;
  data?: Record<string, string | number | undefined>;
  idempotencyKey: string;
}

let resendClient: Resend | null = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  resendClient ||= new Resend(apiKey);
  return resendClient;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEmail(template: EmailTemplate, data: SendEmailInput["data"] = {}) {
  const appUrl = process.env.APP_URL || "https://konexa.example.com";
  const name = escapeHtml(data.name || "KONEXA member");
  const plan = escapeHtml(data.plan || "Pro AI Matchmaker");
  const project = escapeHtml(data.project || "your project");

  const copy: Record<EmailTemplate, { subject: string; heading: string; body: string; action: string }> = {
    welcome: {
      subject: "Welcome to KONEXA",
      heading: `Welcome, ${name}`,
      body: "Your verified KONEXA account is ready. Complete your profile to start matching with projects and talent.",
      action: "Open KONEXA",
    },
    application_received: {
      subject: "Your KONEXA application was received",
      heading: "Application received",
      body: `We safely received your application for ${project}. You can monitor its review status in your workspace.`,
      action: "View application",
    },
    subscription_activated: {
      subject: "Your KONEXA subscription is active",
      heading: `${plan} is now active`,
      body: "Your payment was confirmed and premium company features have been enabled. Billing can be managed from Company Settings.",
      action: "Open billing settings",
    },
    payment_failed: {
      subject: "Action required: KONEXA payment failed",
      heading: "Please update your payment method",
      body: "Stripe could not complete your latest subscription payment. Update your payment method in the secure billing portal to avoid service interruption.",
      action: "Manage billing",
    },
  };

  const selected = copy[template];
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#171717"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(selected.subject)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e5e5e5;border-radius:16px"><tr><td style="padding:36px"><p style="margin:0 0 24px;font-size:12px;font-weight:700;letter-spacing:.16em">KONEXA</p><h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">${selected.heading}</h1><p style="margin:0 0 28px;color:#525252;font-size:15px;line-height:1.7">${selected.body}</p><a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#171717;color:#fff;text-decoration:none;font-size:14px;font-weight:700">${selected.action}</a><p style="margin:28px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6">This transactional email was sent because of activity on your KONEXA account.</p></td></tr></table></td></tr></table></body></html>`;

  return { subject: selected.subject, html };
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not configured");

  const { subject, html } = renderEmail(input.template, input.data);
  const { data, error } = await getResend().emails.send(
    {
      from,
      to: [input.to],
      replyTo: process.env.EMAIL_REPLY_TO,
      subject,
      html,
    },
    { idempotencyKey: input.idempotencyKey.slice(0, 256) },
  );

  if (error || !data?.id) {
    throw new Error(error?.message || "Resend did not return an email ID");
  }

  await adminDb.collection("email_deliveries").doc(data.id).set({
    userId: input.userId || null,
    to: input.to,
    template: input.template,
    status: "sent",
    provider: "resend",
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return { id: data.id };
}

export function registerResendWebhook(app: Express) {
  app.post("/api/webhooks/resend", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    try {
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
      const id = req.header("svix-id");
      const timestamp = req.header("svix-timestamp");
      const signature = req.header("svix-signature");
      if (!webhookSecret || !id || !timestamp || !signature) {
        res.status(400).json({ error: "Missing Resend webhook configuration or signature headers" });
        return;
      }

      const event = getResend().webhooks.verify({
        payload: req.body.toString("utf8"),
        headers: { id, timestamp, signature },
        webhookSecret,
      }) as any;

      const eventRef = adminDb.collection("resend_events").doc(id);
      try {
        await eventRef.create({ type: event.type, createdAt: FieldValue.serverTimestamp() });
      } catch (error: any) {
        if (error?.code === 6 || error?.code === "already-exists") {
          res.json({ received: true, duplicate: true });
          return;
        }
        throw error;
      }

      const emailId = event.data?.email_id;
      if (emailId) {
        await adminDb.collection("email_deliveries").doc(emailId).set({
          status: event.type.replace("email.", ""),
          lastEventAt: event.created_at || FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      res.json({ received: true });
    } catch (error) {
      console.warn("Rejected Resend webhook:", error instanceof Error ? error.message : error);
      res.status(400).json({ error: "Invalid Resend webhook" });
    }
  });
}

export function registerEmailRoutes(app: Express) {
  app.post("/api/email/notify", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const template = req.body?.template as EmailTemplate;
      if (!req.user?.email || !["welcome", "application_received"].includes(template)) {
        res.status(400).json({ error: "A supported template and authenticated email are required" });
        return;
      }

      const idempotencyKey = req.header("x-idempotency-key");
      if (!idempotencyKey || idempotencyKey.length > 200) {
        res.status(400).json({ error: "A valid x-idempotency-key header is required" });
        return;
      }

      const result = await sendTransactionalEmail({
        to: req.user.email,
        userId: req.user.uid,
        template,
        data: req.body?.data,
        idempotencyKey: `${template}/${req.user.uid}/${idempotencyKey}`,
      });
      res.status(202).json({ success: true, emailId: result.id });
    } catch (error) {
      console.error("Transactional email failed:", error);
      res.status(502).json({ error: "Transactional email could not be sent" });
    }
  });
}
