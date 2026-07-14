import express, { type Express, type Response } from "express";
import Stripe from "stripe";
import { adminAuth, adminDb, FieldValue } from "./supabaseAdmin";
import { sendTransactionalEmail } from "./email";
import type { AuthenticatedRequest } from "./security";

let stripeClient: Stripe | null = null;

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (process.env.NODE_ENV === "production" && secretKey.startsWith("sk_test_") && process.env.STRIPE_ALLOW_TEST_MODE !== "true") {
    throw new Error("A live Stripe secret key is required in production");
  }
  stripeClient ||= new Stripe(secretKey, { maxNetworkRetries: 2, timeout: 20_000 });
  return stripeClient;
}

function getAppUrl() {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!appUrl) throw new Error("APP_URL is not configured");
  if (process.env.NODE_ENV === "production" && !appUrl.startsWith("https://")) {
    throw new Error("APP_URL must use HTTPS in production");
  }
  return appUrl;
}

async function getOrCreateCustomer(user: NonNullable<AuthenticatedRequest["user"]>) {
  const customerRef = adminDb.collection("billing_customers").doc(user.uid);
  const existing = await customerRef.get();
  const existingCustomerId = existing.data()?.stripeCustomerId as string | undefined;
  if (existingCustomerId) return existingCustomerId;

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name,
    metadata: { supabaseUid: user.uid },
  }, { idempotencyKey: `customer/${user.uid}` });

  await customerRef.set({
    stripeCustomerId: customer.id,
    email: user.email || null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return customer.id;
}

async function syncSubscription(subscription: any) {
  const supabaseUid = subscription.metadata?.supabaseUid;
  if (!supabaseUid) {
    console.info(`Ignoring Stripe subscription without KONEXA metadata: ${subscription.id}`);
    return null;
  }

  const periodEnd = subscription.items?.data?.[0]?.current_period_end || subscription.current_period_end;
  const active = ["active", "trialing"].includes(subscription.status);
  await adminDb.collection("subscriptions").doc(supabaseUid).set({
    supabaseUid,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
    status: subscription.status,
    priceId: subscription.items?.data?.[0]?.price?.id || null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const userRecord = await adminAuth.getUser(supabaseUid);
  await adminAuth.setCustomUserClaims(supabaseUid, {
    ...userRecord.customClaims,
    plan: active ? "pro" : "free",
  });
  return supabaseUid as string;
}

async function customerEmail(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!customer) return null;
  const value = typeof customer === "string" ? await getStripe().customers.retrieve(customer) : customer;
  if ((value as Stripe.DeletedCustomer).deleted) return null;
  return (value as Stripe.Customer).email;
}

export function registerStripeWebhook(app: Express) {
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json", limit: "2mb" }), async (req, res) => {
    const signature = req.header("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) {
      res.status(400).json({ error: "Missing Stripe webhook signature or configuration" });
      return;
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(req.body, signature, webhookSecret);
      if (process.env.NODE_ENV === "production" && !event.livemode && process.env.STRIPE_ALLOW_TEST_MODE !== "true") {
        throw new Error("Test-mode Stripe events are disabled in production");
      }
    } catch (error) {
      console.warn("Rejected Stripe webhook:", error instanceof Error ? error.message : error);
      res.status(400).json({ error: "Invalid Stripe webhook" });
      return;
    }

    const eventRef = adminDb.collection("stripe_events").doc(event.id);
    const existing = await eventRef.get();
    if (existing.data()?.status === "processed") {
      res.json({ received: true, duplicate: true });
      return;
    }

    await eventRef.set({ type: event.type, status: "processing", attempts: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const supabaseUid = session.metadata?.supabaseUid || session.client_reference_id;
          if (supabaseUid && session.subscription) {
            const subscription = await getStripe().subscriptions.retrieve(String(session.subscription));
            await syncSubscription(subscription);
          }
          const email = session.customer_details?.email;
          if (email && supabaseUid) {
            await sendTransactionalEmail({
              to: email,
              userId: supabaseUid,
              template: "subscription_activated",
              data: { plan: "Pro AI Matchmaker" },
              idempotencyKey: `stripe-checkout/${event.id}`,
            });
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await syncSubscription(event.data.object);
          break;
        case "invoice.payment_failed": {
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription;
          if (!subscriptionId) break;
          const subscription = await getStripe().subscriptions.retrieve(String(subscriptionId));
          const supabaseUid = await syncSubscription(subscription);
          if (!supabaseUid) break;
          const email = invoice.customer_email || await customerEmail(invoice.customer);
          if (email) {
            await sendTransactionalEmail({
              to: email,
              userId: supabaseUid,
              template: "payment_failed",
              idempotencyKey: `stripe-payment-failed/${event.id}`,
            });
          }
          break;
        }
        case "invoice.paid": {
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription;
          if (subscriptionId) {
            const subscription = await getStripe().subscriptions.retrieve(String(subscriptionId));
            await syncSubscription(subscription);
          }
          break;
        }
        default:
          console.info(`Ignoring unhandled Stripe event: ${event.type}`);
      }

      await eventRef.set({ status: "processed", processedAt: FieldValue.serverTimestamp() }, { merge: true });
      res.json({ received: true });
    } catch (error) {
      console.error(`Stripe event ${event.id} failed:`, error);
      await eventRef.set({ status: "failed", error: error instanceof Error ? error.message : String(error), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      res.status(500).json({ error: "Stripe event processing failed" });
    }
  });
}

export function registerBillingRoutes(app: Express) {
  app.post("/api/billing/checkout", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid || !req.user.email || !req.user.email_verified || req.user.role !== "company") {
        res.status(403).json({ error: "A verified company account is required" });
        return;
      }

      const idempotencyKey = req.header("x-idempotency-key");
      if (!idempotencyKey || idempotencyKey.length > 200) {
        res.status(400).json({ error: "A valid x-idempotency-key header is required" });
        return;
      }

      const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
      if (!priceId) throw new Error("STRIPE_PRICE_PRO_MONTHLY is not configured");
      const customerId = await getOrCreateCustomer(req.user);
      const appUrl = getAppUrl();
      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: req.user.uid,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        success_url: `${appUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/?checkout=cancelled`,
        metadata: { supabaseUid: req.user.uid, plan: "pro" },
        subscription_data: { metadata: { supabaseUid: req.user.uid, plan: "pro" } },
      }, { idempotencyKey: `checkout/${req.user.uid}/${idempotencyKey}` });

      if (!session.url) throw new Error("Stripe did not return a Checkout URL");
      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error("Stripe Checkout failed:", error);
      res.status(502).json({ error: "Secure checkout could not be created" });
    }
  });

  app.post("/api/billing/portal", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid || !req.user.email_verified || req.user.role !== "company") {
        res.status(403).json({ error: "A verified company account is required" });
        return;
      }
      const customerSnapshot = await adminDb.collection("billing_customers").doc(req.user.uid).get();
      const customerId = customerSnapshot.data()?.stripeCustomerId;
      if (!customerId) {
        res.status(404).json({ error: "No Stripe customer exists for this account" });
        return;
      }
      const portal = await getStripe().billingPortal.sessions.create({ customer: customerId, return_url: `${getAppUrl()}/` });
      res.json({ url: portal.url });
    } catch (error) {
      console.error("Stripe billing portal failed:", error);
      res.status(502).json({ error: "Billing portal could not be created" });
    }
  });

  app.get("/api/billing/status", async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.uid) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    try {
      const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY;
      if (!priceId) throw new Error("STRIPE_PRICE_PRO_MONTHLY is not configured");
      const [snapshot, price] = await Promise.all([
        adminDb.collection("subscriptions").doc(req.user.uid).get(),
        getStripe().prices.retrieve(priceId),
      ]);
      res.json({
        subscription: snapshot.exists ? snapshot.data() : { status: "free" },
        plan: {
          unitAmount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval || null,
        },
      });
    } catch (error) {
      console.error("Billing status failed:", error);
      res.status(502).json({ error: "Billing status could not be loaded" });
    }
  });
}
