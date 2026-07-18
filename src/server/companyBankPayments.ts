import crypto from "node:crypto";
import type { Express, Response } from "express";
import { adminDb } from "./supabaseAdmin";
import type { AuthenticatedRequest } from "./security";

function configuration() {
  const bankName = process.env.KONEXA_BANK_NAME?.trim();
  const accountNumber = process.env.KONEXA_BANK_ACCOUNT?.replace(/\s+/g, "").trim();
  const accountHolder = process.env.KONEXA_BANK_HOLDER?.trim();
  return {
    configured: Boolean(bankName && accountNumber && accountHolder),
    bankName: bankName || "",
    accountNumber: accountNumber || "",
    accountHolder: accountHolder || "",
  };
}

function transferPayload(config: ReturnType<typeof configuration>, amount?: number, reference?: string) {
  return [
    "KONEXA BANK TRANSFER",
    `BANK:${config.bankName}`,
    `ACCOUNT:${config.accountNumber}`,
    `HOLDER:${config.accountHolder}`,
    amount ? `AMOUNT_KRW:${amount}` : "",
    reference ? `REFERENCE:${reference}` : "",
  ].filter(Boolean).join("\n");
}

export function isCompanyBankPaymentConfigured() {
  return configuration().configured;
}

export function registerCompanyBankPaymentRoutes(app: Express) {
  app.get("/api/company-bank-payments/config", (req: AuthenticatedRequest, res: Response) => {
    const config = configuration();
    res.setHeader("Cache-Control", "private, no-store");
    if (!config.configured) {
      res.json({ configured: false });
      return;
    }
    res.json({
      configured: true,
      bankName: config.bankName,
      accountNumber: config.accountNumber,
      accountHolder: config.accountHolder,
      qrPayload: transferPayload(config),
    });
  });

  app.post("/api/company-bank-payments/intents", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = configuration();
      if (!config.configured) {
        res.status(503).json({ error: "The KONEXA settlement account is not configured." });
        return;
      }
      if (!req.user?.uid) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      const amountKrw = Number(req.body?.amountKrw);
      const memo = typeof req.body?.memo === "string" ? req.body.memo.trim().slice(0, 100) : "";
      if (!Number.isSafeInteger(amountKrw) || amountKrw < 1_000 || amountKrw > 100_000_000) {
        res.status(400).json({ error: "Enter a whole KRW amount between 1,000 and 100,000,000." });
        return;
      }
      const intentId = `bank_${crypto.randomUUID()}`;
      const reference = `KX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
      const createdAt = Date.now();
      await adminDb.collection("payment_records").doc(intentId).create({
        id: intentId,
        userId: req.user.uid,
        companyId: req.user.uid,
        provider: "domestic_bank_transfer",
        status: "awaiting_transfer",
        currency: "KRW",
        expectedAmountKrw: amountKrw,
        reference,
        memo,
        createdAt,
      });
      res.status(201).json({
        intentId,
        reference,
        amountKrw,
        status: "awaiting_transfer",
        createdAt,
        bankName: config.bankName,
        accountNumber: config.accountNumber,
        accountHolder: config.accountHolder,
        qrPayload: transferPayload(config, amountKrw, reference),
      });
    } catch (error) {
      console.error("Bank transfer intent failed:", error);
      res.status(500).json({ error: "The bank transfer request could not be created." });
    }
  });
}
