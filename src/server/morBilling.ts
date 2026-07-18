import crypto from "node:crypto";
import express, { type Express, type Response } from "express";
import { adminAuth, adminDb, FieldValue } from "./supabaseAdmin";
import type { AuthenticatedRequest } from "./security";

type PaddleEnvironment = "sandbox" | "live";

function environment(): PaddleEnvironment {
  return process.env.PADDLE_ENVIRONMENT === "sandbox" ? "sandbox" : "live";
}

function apiBase() {
  return environment() === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
}

function appUrl() {
  return (process.env.APP_URL || "https://konexa.co.kr").replace(/\/$/, "");
}

function ensureProductionMode() {
  if (process.env.NODE_ENV === "production" && environment() === "sandbox" && process.env.PADDLE_ALLOW_SANDBOX !== "true") {
    throw new Error("Paddle sandbox is disabled in production");
  }
}

function credentials() {
  return {
    apiKey: process.env.PADDLE_API_KEY?.trim() || "",
    priceId: process.env.PADDLE_PRICE_STUDENT_PRO?.trim() || "",
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET?.trim() || "",
  };
}

export function isMorBillingConfigured() {
  const value = credentials();
  return Boolean(value.apiKey && value.priceId && value.webhookSecret);
}

async function paddleRequest<T>(path: string, init: RequestInit = {}) {
  ensureProductionMode();
  const apiKey = credentials().apiKey;
  if (!apiKey) throw new Error("PADDLE_API_KEY is not configured");
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Paddle-Version": "1",
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => ({})) as any;
  if (!response.ok) {
    const message = payload?.error?.detail || payload?.error?.type || `Paddle returned HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload.data as T;
}

function parseSignature(header: string) {
  const values = header.split(";").map((part) => part.trim().split("="));
  const timestamp = values.find(([key]) => key === "ts")?.[1] || "";
  const signatures = values.filter(([key]) => key === "h1").map(([, value]) => value);
  return { timestamp, signatures };
}

function verifySignature(rawBody: Buffer, header: string, secret: string) {
  const { timestamp, signatures } = parseSignature(header);
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}:${rawBody.toString("utf8")}`).digest("hex");
  return signatures.some((signature) => {
    const left = Buffer.from(signature, "hex");
    const right = Buffer.from(expected, "hex");
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  });
}

async function setStudentPlan(uid: string, active: boolean) {
  const user = await adminAuth.getUser(uid);
  await adminAuth.setCustomUserClaims(uid, {
    ...(user.customClaims || {}),
    studentPlan: active ? "pro" : "free",
  });
}

async function syncSubscription(data: Record<string, any>) {
  const uid = String(data.custom_data?.konexa_user_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(uid)) return null;
  const status = String(data.status || "unknown");
  const active = ["active", "trialing"].includes(status);
  await adminDb.collection("student_subscriptions").doc(uid).set({
    userId: uid,
    provider: "paddle_mor",
    paddleSubscriptionId: data.id || null,
    paddleCustomerId: data.customer_id || null,
    paddleTransactionId: data.transaction_id || null,
    status,
    active,
    currentPeriodStartsAt: data.current_billing_period?.starts_at || null,
    currentPeriodEndsAt: data.current_billing_period?.ends_at || null,
    nextBilledAt: data.next_billed_at || null,
    canceledAt: data.canceled_at || null,
    updatedAt: Date.now(),
  }, { merge: true });
  await setStudentPlan(uid, active);
  return uid;
}

export function registerPaddleWebhook(app: Express) {
  app.post("/api/webhooks/paddle", express.raw({ type: "application/json", limit: "2mb" }), async (req, res) => {
    const signature = req.header("paddle-signature") || "";
    const secret = credentials().webhookSecret;
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    if (!secret || !signature || !verifySignature(rawBody, signature, secret)) {
      res.status(400).json({ error: "Invalid Paddle webhook signature" });
      return;
    }

    let event: any;
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch {
      res.status(400).json({ error: "Invalid Paddle webhook payload" });
      return;
    }

    const eventId = String(event.event_id || "");
    if (!eventId) {
      res.status(400).json({ error: "Missing Paddle event ID" });
      return;
    }
    const eventRef = adminDb.collection("paddle_events").doc(eventId);
    const previous = await eventRef.get();
    if (previous.data()?.status === "processed") {
      res.json({ received: true, duplicate: true });
      return;
    }
    await eventRef.set({ type: event.event_type, status: "processing", attempts: FieldValue.increment(1), updatedAt: Date.now() }, { merge: true });

    try {
      const data = event.data || {};
      if (["subscription.created", "subscription.updated", "subscription.activated", "subscription.trialing", "subscription.paused", "subscription.canceled", "subscription.past_due"].includes(event.event_type)) {
        await syncSubscription(data);
      }
      if (event.event_type === "transaction.completed") {
        const uid = String(data.custom_data?.konexa_user_id || "");
        if (/^[0-9a-f-]{36}$/i.test(uid)) {
          await adminDb.collection("student_payment_records").doc(String(data.id)).set({
            userId: uid,
            provider: "paddle_mor",
            transactionId: data.id,
            subscriptionId: data.subscription_id || null,
            customerId: data.customer_id || null,
            status: data.status,
            currency: data.currency_code || null,
            total: data.details?.totals?.total || null,
            invoiceNumber: data.invoice_number || null,
            completedAt: data.updated_at || new Date().toISOString(),
          }, { merge: true });
          if (data.subscription_id) {
            await adminDb.collection("student_subscriptions").doc(uid).set({
              userId: uid,
              provider: "paddle_mor",
              paddleSubscriptionId: data.subscription_id,
              paddleCustomerId: data.customer_id || null,
              paddleTransactionId: data.id,
              status: "active",
              active: true,
              updatedAt: Date.now(),
            }, { merge: true });
            await setStudentPlan(uid, true);
          }
        }
      }
      await eventRef.set({ status: "processed", processedAt: Date.now() }, { merge: true });
      res.json({ received: true });
    } catch (error) {
      console.error(`Paddle event ${eventId} failed:`, error);
      await eventRef.set({ status: "failed", error: error instanceof Error ? error.message : String(error), updatedAt: Date.now() }, { merge: true });
      res.status(500).json({ error: "Paddle event processing failed" });
    }
  });
}

export function registerMorBillingRoutes(app: Express) {
  app.get("/api/student-billing/status", async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.uid) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const configured = isMorBillingConfigured();
    const snapshot = await adminDb.collection("student_subscriptions").doc(req.user.uid).get();
    let price: Record<string, any> | null = null;
    if (configured) {
      try {
        price = await paddleRequest<Record<string, any>>(`/prices/${encodeURIComponent(credentials().priceId)}`);
      } catch (error) {
        console.warn("Paddle price lookup failed:", error);
      }
    }
    const subscription = snapshot.data() || { status: "free", active: false };
    res.setHeader("Cache-Control", "private, no-store");
    res.json({
      configured,
      environment: environment(),
      subscription,
      plan: price ? {
        name: price.name || price.description || "KONEXA Student Pro",
        amount: price.unit_price?.amount || null,
        currency: price.unit_price?.currency_code || null,
        interval: price.billing_cycle?.interval || null,
      } : null,
      canManage: Boolean(subscription.paddleCustomerId),
    });
  });

  app.post("/api/student-billing/checkout", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid || !req.user.email_verified || req.user.role !== "student") {
        res.status(403).json({ error: "A verified student account is required." });
        return;
      }
      if (!isMorBillingConfigured()) {
        res.status(503).json({ error: "Student MoR billing is not activated yet." });
        return;
      }
      const idempotencyKey = req.header("x-idempotency-key");
      if (!idempotencyKey || idempotencyKey.length > 200) {
        res.status(400).json({ error: "A valid idempotency key is required." });
        return;
      }
      const transaction = await paddleRequest<Record<string, any>>("/transactions", {
        method: "POST",
        headers: { "Paddle-Request-Id": idempotencyKey },
        body: JSON.stringify({
          items: [{ price_id: credentials().priceId, quantity: 1 }],
          collection_mode: "automatic",
          custom_data: {
            konexa_user_id: req.user.uid,
            konexa_user_email: req.user.email || "",
            product_scope: "student_software_subscription",
          },
          checkout: { url: appUrl() },
        }),
      });
      if (!transaction.checkout?.url) throw new Error("Paddle did not return a checkout URL");
      res.json({ url: transaction.checkout.url, transactionId: transaction.id });
    } catch (error) {
      console.error("Paddle checkout failed:", error);
      res.status(502).json({ error: error instanceof Error ? error.message : "Checkout could not be created." });
    }
  });

  app.post("/api/student-billing/portal", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      const snapshot = await adminDb.collection("student_subscriptions").doc(req.user.uid).get();
      const customerId = String(snapshot.data()?.paddleCustomerId || "");
      if (!customerId) {
        res.status(404).json({ error: "No Paddle customer record exists for this account." });
        return;
      }
      const session = await paddleRequest<Record<string, any>>(`/customers/${encodeURIComponent(customerId)}/portal-sessions`, { method: "POST", body: "{}" });
      if (!session.urls?.general?.overview) throw new Error("Paddle did not return a customer portal URL");
      res.json({ url: session.urls.general.overview });
    } catch (error) {
      console.error("Paddle portal failed:", error);
      res.status(502).json({ error: "The billing portal could not be opened." });
    }
  });
}
