import express, { type Express, type Response } from "express";
import { createHash } from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { adminDb, FieldValue } from "./supabaseAdmin";
import type { AuthenticatedRequest } from "./security";
import { existingSmtpDelivery, smtpAuthentication, smtpSecurity } from './smtpPolicy';

export const EMAIL_TEMPLATES = [
  'welcome', 'application_received', 'application_status', 'new_application',
  'project_published', 'contract_action', 'milestone_action', 'payment_status',
  'subscription_activated', 'payment_failed', 'introduction_requested',
  'review_updated', 'dispute_action',
] as const;
export type EmailTemplate = typeof EMAIL_TEMPLATES[number];

interface SendEmailInput {
  to: string;
  userId?: string;
  template: EmailTemplate;
  data?: Record<string, string | number | undefined>;
  idempotencyKey: string;
}

let resendClient: Resend | null = null;
let smtpClient: Transporter | null = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  resendClient ||= new Resend(apiKey);
  return resendClient;
}

function getSmtp() {
  const host = process.env.SMTP_HOST?.trim().toLowerCase();
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT || 465);
  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD must be configured");
  }

  smtpClient ||= nodemailer.createTransport({
    host,
    port,
    ...smtpSecurity(port, process.env.SMTP_SECURE),
    auth: smtpAuthentication(host, user, pass),
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return smtpClient;
}

export function isTransactionalEmailConfigured() {
  const hasFrom = Boolean(process.env.EMAIL_FROM);
  const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_WEBHOOK_SECRET);
  const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  return hasFrom && (hasResend || hasSmtp);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderEmail(template: EmailTemplate, data: SendEmailInput["data"] = {}) {
  const appUrl = process.env.APP_URL || "https://konexa.co.kr";
  const name = escapeHtml(data.name || "KONEXA member");
  const plan = escapeHtml(data.plan || "Pro AI Matchmaker");
  const project = escapeHtml(data.project || "your project");
  const status = escapeHtml(data.status || "updated");

  const copy: Record<EmailTemplate, { subject: string; heading: string; body: string; action: string }> = {
    welcome: {
      subject: "Welcome to KONEXA",
      heading: `Welcome, ${name}`,
      body: "Your KONEXA account is ready. Complete your profile and verification to start matching with projects and talent.",
      action: "Open KONEXA",
    },
    application_received: {
      subject: "Your KONEXA application was received",
      heading: "Application received",
      body: `We safely received your application for ${project}. You can monitor its review status in your workspace.`,
      action: "View application",
    },
    application_status: {
      subject: "Your KONEXA application status changed",
      heading: `Application ${status}`,
      body: `The status of your application for ${project} has changed. Open your workspace to review the latest verified update.`,
      action: "View application",
    },
    new_application: {
      subject: "A new candidate applied on KONEXA",
      heading: "A new application arrived",
      body: `A KONEXA member submitted an application for ${project}. Review the evidence and update the hiring stage in your company workspace.`,
      action: "Review application",
    },
    project_published: {
      subject: "Your KONEXA opportunity is live",
      heading: "Project published",
      body: `${project} is now visible to eligible talent. Applications and status changes will be recorded in your company workspace.`,
      action: "View project",
    },
    contract_action: {
      subject: "A KONEXA contract requires attention",
      heading: `Contract ${status}`,
      body: "A contract in your KONEXA project workflow has changed. Review the terms and complete only the actions assigned to your account.",
      action: "Review contract",
    },
    milestone_action: {
      subject: "A KONEXA milestone was updated",
      heading: `Milestone ${status}`,
      body: "A verified project milestone has changed. Review the deliverable, deadline, and approval state in your workspace.",
      action: "Review milestone",
    },
    payment_status: {
      subject: "A KONEXA payment status changed",
      heading: `Payment ${status}`,
      body: "A project payment record has changed. Check the amount, provider reference, and settlement status in your secure workspace.",
      action: "Review payment",
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
    introduction_requested: {
      subject: 'You have a new KONEXA introduction request', heading: 'New introduction request',
      body: 'A company has requested an introduction. Review the opportunity in KONEXA. Your private contact details remain protected until the required agreement steps are completed.',
      action: 'Review request',
    },
    review_updated: {
      subject: 'Your KONEXA review was updated', heading: `Review ${status}`,
      body: 'Open your workspace to check your review status. Private review content is not shared with the other party before the publication requirements are met.',
      action: 'View review status',
    },
    dispute_action: {
      subject: 'A KONEXA dispute requires attention', heading: 'Dispute update',
      body: 'A dispute was recorded for your project. Review the case in your secure workspace and provide supporting information to the KONEXA operations team.',
      action: 'View case',
    },
  };

  let selected = copy[template];
  // Describe the action, rather than exposing internal enum names in email.
  if (template === 'milestone_action') {
    const messages: Record<string,{heading:string;body:string}> = {
      due_soon: { heading:'A deliverable is due soon', body:'Your agreed delivery deadline is within 24 hours. Open the project workspace to submit your result or discuss a schedule change.' },
      overdue: { heading:'A deliverable needs your attention', body:'The recorded delivery deadline has passed. Submit the result or contact the other party to agree the next step; this reminder does not apply an automatic penalty.' },
      review_due: { heading:'A submitted deliverable is waiting for review', body:'The agreed review period has passed. Check the submitted evidence and approve it or explain the changes you need.' },
      approved: { heading:'Your deliverable was approved', body:'The company approved the submitted result. View the saved feedback in your workspace. Approval is not confirmation that a payout has been made.' },
      rejected: { heading:'Changes were requested on your deliverable', body:'Review the company feedback, update your result and submit a new version. Earlier submissions remain on record.' },
    };
    const message=messages[String(data.status)];
    if(message)selected={...selected,subject:`KONEXA: ${message.heading}`,...message};
  }
  if(template==='contract_action'&&data.status==='awaiting_other_party')selected={...selected,subject:'KONEXA project completion needs confirmation',heading:'One party has confirmed project completion',body:'Open the project workspace to check the deliverables and completion confirmations. Work Passport evidence is created only after both parties confirm.'};
  if(template==='contract_action'&&data.status==='completed')selected={...selected,subject:'Your KONEXA project is complete',heading:'Both parties confirmed project completion',body:'The completed project and deliverable evidence are recorded in Work Passport. You can now submit a final review. Completion is separate from payout or refund status.'};
  if(template==='dispute_action'&&data.status==='resolved')selected={...selected,subject:'Your KONEXA dispute has a recorded decision',heading:'A case resolution was recorded',body:'The operations team recorded the evidence and resolution. Review the explanation in your secure workspace. This decision does not itself execute a refund or payout.'};
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#171717"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(selected.subject)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e5e5e5;border-radius:16px"><tr><td style="padding:36px"><p style="margin:0 0 24px;font-size:12px;font-weight:700;letter-spacing:.16em">KONEXA</p><h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">${selected.heading}</h1><p style="margin:0 0 28px;color:#525252;font-size:15px;line-height:1.7">${selected.body}</p><a href="${escapeHtml(appUrl)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#171717;color:#fff;text-decoration:none;font-size:14px;font-weight:700">${selected.action}</a><p style="margin:28px 0 0;color:#a3a3a3;font-size:12px;line-height:1.6">This transactional email was sent because of activity on your KONEXA account.</p></td></tr></table></td></tr></table></body></html>`;

  return { subject: selected.subject, html };
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not configured");

  const { subject, html } = renderEmail(input.template, input.data);
  if (process.env.RESEND_API_KEY) {
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

  const deliveryId = `smtp_${createHash("sha256").update(input.idempotencyKey).digest("hex").slice(0, 48)}`;
  const deliveryRef = adminDb.collection("email_deliveries").doc(deliveryId);
  try {
    await deliveryRef.create({
      userId: input.userId || null,
      to: input.to,
      template: input.template,
      status: "sending",
      provider: "smtp",
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error: any) {
    if (error?.code === 6 || error?.code === "already-exists") {
      const existing = await deliveryRef.get();
      const deliveryState = existingSmtpDelivery(existing.data()?.status);
      if (deliveryState === 'sent') return { id: deliveryId };
      if (deliveryState === 'pending') throw new Error('SMTP delivery is unconfirmed; operator verification is required before retrying');
      await deliveryRef.set({ status: "sending", retryAt: FieldValue.serverTimestamp() }, { merge: true });
    } else {
      throw error;
    }
  }

  try {
    const info = await getSmtp().sendMail({
      from,
      to: input.to,
      replyTo: process.env.EMAIL_REPLY_TO,
      subject,
      html,
      messageId: `<${deliveryId}@konexa.co.kr>`,
      ...(process.env.SMTP_HOST?.trim().toLowerCase() === 'smtp.resend.com'
        ? { headers: { 'Resend-Idempotency-Key': deliveryId } } : {}),
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    await deliveryRef.set({
      status: "sent",
      providerMessageId: info.messageId,
      sentAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { id: deliveryId };
  } catch (error) {
    await deliveryRef.set({
      status: "failed",
      failedAt: FieldValue.serverTimestamp(),
      error: error instanceof Error ? error.message.slice(0, 500) : "SMTP send failed",
    }, { merge: true });
    throw error;
  }
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
