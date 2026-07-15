import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import express from "express";
import * as PortOne from "@portone/server-sdk";
import { adminDb, getSupabaseAdmin } from "./supabaseAdmin";
import type { AuthenticatedRequest } from "./security";

type StoredRecord = Record<string, any>;

function getPortOneConfiguration() {
  const configuration = {
    secret: process.env.PORTONE_API_SECRET,
    webhookSecret: process.env.PORTONE_WEBHOOK_SECRET,
    storeId: process.env.PORTONE_STORE_ID,
    channelKey: process.env.PORTONE_CHANNEL_KEY,
  };
  const missing = Object.entries(configuration).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) throw Object.assign(new Error(`PortOne configuration is incomplete: ${missing.join(", ")}`), { statusCode: 503 });
  return configuration as Record<keyof typeof configuration, string>;
}

function getPortOneClient(secret: string) {
  return PortOne.PortOneClient({ secret });
}

async function countVerifiedSignatures(relationshipId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("app_records")
    .select("data")
    .eq("collection_name", "contract_signatures")
    .eq("data->>relationshipId", relationshipId)
    .eq("data->>provider", "modusign")
    .eq("data->>verificationStatus", "verified");
  if (error) throw error;
  const types = new Set((data || []).map((item) => String((item.data as StoredRecord)?.signatureType || "")));
  return Number(types.has("company")) + Number(types.has("talent"));
}

function readPaymentId(webhook: unknown) {
  if (!webhook || typeof webhook !== "object") return null;
  const data = (webhook as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const paymentId = (data as { paymentId?: unknown }).paymentId;
  return typeof paymentId === "string" && paymentId ? paymentId : null;
}

function mapProviderStatus(status: string) {
  switch (status) {
    case "PAID": return "funds_secured";
    case "FAILED": return "failed";
    case "CANCELLED":
    case "PARTIAL_CANCELLED": return "cancelled";
    case "PAY_PENDING": return "pending";
    case "VIRTUAL_ACCOUNT_ISSUED": return "awaiting_deposit";
    case "READY": return "ready";
    default: return "provider_unknown";
  }
}

async function synchronizePayment(paymentId: string) {
  const configuration = getPortOneConfiguration();
  const paymentRef = adminDb.collection("payment_records").doc(paymentId);
  const storedSnapshot = await paymentRef.get();
  const stored = storedSnapshot.data();
  if (!storedSnapshot.exists || !stored) throw Object.assign(new Error("Prepared payment record not found"), { statusCode: 404 });

  const providerPayment = await getPortOneClient(configuration.secret).payment.getPayment({ paymentId, storeId: configuration.storeId });
  if (PortOne.Payment.isUnrecognizedPayment(providerPayment)) {
    await paymentRef.update({ status: "provider_unknown", verifiedAt: Date.now() });
    return { status: "provider_unknown", paymentId };
  }

  const actualAmount = Number(providerPayment.amount.total);
  const expectedAmount = Number(stored.expectedAmountKrw);
  const amountMatches = Number.isSafeInteger(actualAmount) && actualAmount === expectedAmount;
  const mappedStatus = mapProviderStatus(providerPayment.status);
  const status = amountMatches ? mappedStatus : "amount_mismatch";

  await paymentRef.update({
    status,
    amountMatches,
    actualAmountKrw: actualAmount,
    providerStatus: providerPayment.status,
    providerTransactionId: providerPayment.transactionId,
    receiptUrl: "receiptUrl" in providerPayment ? providerPayment.receiptUrl || null : null,
    paidAt: "paidAt" in providerPayment ? providerPayment.paidAt || null : null,
    verifiedAt: Date.now(),
  });
  return { paymentId, status, amountMatches, expectedAmountKrw: expectedAmount, actualAmountKrw: actualAmount };
}

function sendRouteError(res: Response, error: unknown) {
  const status = Number((error as { statusCode?: unknown })?.statusCode) || 500;
  const safeMessage = status >= 500 ? "Payment service is not available." : error instanceof Error ? error.message : "Payment request failed.";
  if (status >= 500) console.error("PortOne payment error:", error);
  res.status(status).json({ error: safeMessage });
}

export function registerPortOneWebhook(app: Express) {
  app.post("/api/webhooks/portone", express.text({ type: "application/json", limit: "1mb" }), async (req: Request, res: Response) => {
    try {
      const configuration = getPortOneConfiguration();
      if (typeof req.body !== "string") {
        res.status(400).json({ error: "Raw webhook payload is required." });
        return;
      }
      const webhookId = req.header("webhook-id");
      const webhook = await PortOne.Webhook.verify(configuration.webhookSecret, req.body, req.headers);
      if (PortOne.Webhook.isUnrecognizedWebhook(webhook)) {
        res.status(204).end();
        return;
      }

      if (webhookId) {
        const eventRef = adminDb.collection("portone_webhook_events").doc(webhookId);
        const existing = await eventRef.get();
        if (existing.exists) {
          res.status(200).json({ received: true, duplicate: true });
          return;
        }
        await eventRef.create({ provider: "portone_v2", type: webhook.type, receivedAt: Date.now(), status: "processing" });
      }

      const paymentId = readPaymentId(webhook);
      if (paymentId) await synchronizePayment(paymentId);
      if (webhookId) await adminDb.collection("portone_webhook_events").doc(webhookId).update({ status: "processed", processedAt: Date.now(), paymentId });
      res.status(200).json({ received: true });
    } catch (error) {
      console.warn("Rejected PortOne webhook:", error instanceof Error ? error.message : error);
      res.status(400).json({ error: "Webhook verification failed." });
    }
  });
}

export function registerPortOnePaymentRoutes(app: Express) {
  app.post("/api/payments/prepare", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const companyId = req.user?.uid;
      const contractId = typeof req.body?.contractId === "string" ? req.body.contractId.trim() : "";
      if (!companyId || !contractId) {
        res.status(400).json({ error: "Contract ID is required." });
        return;
      }
      const configuration = getPortOneConfiguration();
      const contractSnapshot = await adminDb.collection("contracts").doc(contractId).get();
      const contract = contractSnapshot.data();
      if (!contractSnapshot.exists || !contract) throw Object.assign(new Error("Contract not found"), { statusCode: 404 });
      if (contract.companyId !== companyId) throw Object.assign(new Error("Only the contract company can prepare payment"), { statusCode: 403 });

      const relationshipId = String(contract.relationshipId || "");
      const amount = Number(contract.payment?.monthlyAmountKrw);
      if (!relationshipId || !Number.isSafeInteger(amount) || amount < 100) throw Object.assign(new Error("Contract payment terms are invalid"), { statusCode: 409 });
      if (await countVerifiedSignatures(relationshipId) < 2) throw Object.assign(new Error("Both Modusign signatures must be verified before payment"), { statusCode: 409 });

      const paymentId = `konexa_${crypto.randomUUID()}`;
      const orderName = `${String(contract.title || "KONEXA 프로젝트").slice(0, 70)} · 월 프로젝트 비용`;
      await adminDb.collection("payment_records").doc(paymentId).create({
        userId: companyId,
        companyId,
        talentId: contract.talentId,
        relationshipId,
        contractId,
        paymentId,
        provider: "portone_v2",
        status: "prepared",
        currency: "KRW",
        expectedAmountKrw: amount,
        orderName,
        createdAt: Date.now(),
      });

      res.status(201).json({
        paymentId,
        storeId: configuration.storeId,
        channelKey: configuration.channelKey,
        orderName,
        amount: { total: amount },
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        redirectUrl: `${process.env.APP_URL}/?paymentId=${encodeURIComponent(paymentId)}`,
      });
    } catch (error) {
      sendRouteError(res, error);
    }
  });

  app.post("/api/payments/verify", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const paymentId = typeof req.body?.paymentId === "string" ? req.body.paymentId.trim() : "";
      if (!paymentId || !req.user?.uid) {
        res.status(400).json({ error: "Payment ID is required." });
        return;
      }
      const snapshot = await adminDb.collection("payment_records").doc(paymentId).get();
      const record = snapshot.data();
      if (!snapshot.exists || !record) throw Object.assign(new Error("Payment not found"), { statusCode: 404 });
      if (record.companyId !== req.user.uid) throw Object.assign(new Error("Payment owner mismatch"), { statusCode: 403 });
      res.json(await synchronizePayment(paymentId));
    } catch (error) {
      sendRouteError(res, error);
    }
  });
}
