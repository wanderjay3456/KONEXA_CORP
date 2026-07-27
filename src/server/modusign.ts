import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { getSupabaseAdmin } from "./supabaseAdmin";
import type { AuthenticatedUser } from "./security";

type JsonRecord = Record<string, any>;

interface ModusignConfiguration {
  email: string;
  apiKey: string;
  webhookSecret: string;
  templateId: string;
  companyRole: string;
  studentRole: string;
}

function configuration(): ModusignConfiguration {
  const values = {
    email: process.env.MODUSIGN_API_EMAIL?.trim() || "",
    apiKey: process.env.MODUSIGN_API_KEY?.trim() || "",
    webhookSecret: process.env.MODUSIGN_WEBHOOK_SECRET?.trim() || "",
    templateId: process.env.MODUSIGN_PROJECT_TEMPLATE_ID?.trim() || "",
    companyRole: process.env.MODUSIGN_COMPANY_ROLE?.trim() || "",
    studentRole: process.env.MODUSIGN_STUDENT_ROLE?.trim() || "",
  };
  const missing = Object.entries(values)
    .filter(([, value]) => !value || /replace_me/i.test(value))
    .map(([key]) => key);
  if (missing.length) {
    throw Object.assign(
      new Error(`Modusign configuration is incomplete: ${missing.join(", ")}`),
      { statusCode: 503 },
    );
  }
  return values;
}

export function isModusignConfigured() {
  try {
    configuration();
    return true;
  } catch {
    return false;
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function modusignRequest<T>(
  config: ModusignConfiguration,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const credentials = Buffer.from(`${config.email}:${config.apiKey}`).toString("base64");
  const response = await fetch(`https://api.modusign.co.kr${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
      ...(init.body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(
      new Error(
        typeof payload?.message === "string"
          ? payload.message
          : `Modusign returned HTTP ${response.status}.`,
      ),
      { statusCode: response.status >= 500 ? 502 : 409 },
    );
  }
  return payload as T;
}

async function profile(collectionName: string, userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("app_records")
    .select("data")
    .eq("collection_name", collectionName)
    .eq("record_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.data || {}) as JsonRecord;
}

function participantName(value: unknown, fallback: string) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return (normalized || fallback).slice(0, 30);
}

export async function requestProjectContractSignature(input: {
  actor: AuthenticatedUser;
  contractId: string;
  idempotencyKey: string;
}) {
  const config = configuration();
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("konexa_contract_signatures")
    .select("provider_document_id")
    .eq("contract_id", input.contractId)
    .eq("provider", "modusign")
    .not("provider_document_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.provider_document_id) {
    return {
      contractId: input.contractId,
      providerDocumentId: existing.provider_document_id,
      status: "awaiting_signature",
      reused: true,
    };
  }

  const { data: contract, error: contractError } = await supabase
    .from("konexa_contracts")
    .select("id,company_id,student_id,title,status")
    .eq("id", input.contractId)
    .single();
  if (contractError) throw contractError;
  if (contract.company_id !== input.actor.uid || input.actor.role !== "company") {
    throw Object.assign(new Error("Only the contract company can request signatures."), { statusCode: 403 });
  }
  if (!["issued", "awaiting_signature"].includes(contract.status)) {
    throw Object.assign(new Error("The contract is not ready for a signature request."), { statusCode: 409 });
  }

  const [
    companyAuth,
    studentAuth,
    companyProfile,
    studentProfile,
  ] = await Promise.all([
    supabase.auth.admin.getUserById(contract.company_id),
    supabase.auth.admin.getUserById(contract.student_id),
    profile("company_profiles", contract.company_id),
    profile("student_profiles", contract.student_id),
  ]);
  if (companyAuth.error) throw companyAuth.error;
  if (studentAuth.error) throw studentAuth.error;
  const companyEmail = companyAuth.data.user?.email;
  const studentEmail = studentAuth.data.user?.email;
  if (!companyEmail || !studentEmail) {
    throw Object.assign(new Error("Both contract participants need verified email addresses."), { statusCode: 409 });
  }

  const document = await modusignRequest<{
    id: string;
    status: string;
    participants?: Array<{ id?: string; name?: string }>;
  }>(config, "/documents/request-with-template", {
    method: "POST",
    body: JSON.stringify({
      templateId: config.templateId,
      document: {
        title: String(contract.title || "KONEXA 프로젝트 계약").slice(0, 100),
        participantMappings: [
          {
            role: config.companyRole,
            name: participantName(
              companyProfile.representativeName || companyProfile.companyName,
              "KONEXA 기업 담당자",
            ),
            signingMethod: { type: "EMAIL", value: companyEmail },
            locale: "ko",
          },
          {
            role: config.studentRole,
            name: participantName(studentProfile.name, "KONEXA 인재"),
            signingMethod: { type: "EMAIL", value: studentEmail },
            locale: "en",
          },
        ],
        metadatas: [
          { key: "konexaContractId", value: contract.id },
          { key: "konexaEnvironment", value: process.env.NODE_ENV || "development" },
        ],
      },
    }),
  });
  if (!document.id) throw new Error("Modusign did not return a document ID.");

  const { data, error } = await supabase.rpc("konexa_register_signature_document_v2", {
    p_actor: input.actor.uid,
    p_contract_id: contract.id,
    p_provider: "modusign",
    p_provider_document_id: document.id,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw error;
  return {
    ...(data as JsonRecord),
    providerStatus: document.status,
    participants: document.participants || [],
  };
}

function webhookEvent(body: unknown) {
  const value = body && typeof body === "object" ? body as JsonRecord : {};
  const eventType = typeof value.event?.type === "string" ? value.event.type : "";
  const documentId = typeof value.document?.id === "string" ? value.document.id : "";
  if (!eventType || !documentId || eventType.length > 100 || documentId.length > 200) {
    throw Object.assign(new Error("Invalid Modusign webhook payload."), { statusCode: 400 });
  }
  return { eventType, documentId };
}

export function registerModusignWebhook(app: Express) {
  app.post("/api/webhooks/modusign", async (req: Request, res: Response) => {
    try {
      const config = configuration();
      const querySecret = typeof req.query.token === "string" ? req.query.token : "";
      const suppliedSecret = req.header("x-konexa-webhook-secret") || querySecret;
      if (!suppliedSecret || !safeEqual(suppliedSecret, config.webhookSecret)) {
        res.status(401).json({ error: "Invalid Modusign webhook secret." });
        return;
      }
      const { eventType, documentId } = webhookEvent(req.body);
      const eventId = `${eventType}:${documentId}`;
      const payloadHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(req.body || {}))
        .digest("hex");
      const supabase = getSupabaseAdmin();
      const { error: eventError } = await supabase.from("konexa_webhook_events").insert({
        provider: "modusign",
        event_id: eventId,
        event_type: eventType,
        payload_hash: payloadHash,
        status: "processing",
        attempts: 1,
      });
      if (eventError?.code === "23505") {
        res.status(200).json({ received: true, duplicate: true });
        return;
      }
      if (eventError) throw eventError;

      try {
        const verifiedDocument = await modusignRequest<{
          id: string;
          status: string;
          requester?: { email?: string };
        }>(config, `/documents/${encodeURIComponent(documentId)}`);
        if (
          verifiedDocument.id !== documentId
          || verifiedDocument.requester?.email?.toLowerCase() !== config.email.toLowerCase()
        ) {
          throw Object.assign(new Error("Modusign document ownership verification failed."), { statusCode: 401 });
        }
        const { data, error } = await supabase.rpc(
          "konexa_record_signature_document_status_v2",
          {
            p_provider: "modusign",
            p_provider_document_id: documentId,
            p_event_type: eventType,
            p_verified_status: verifiedDocument.status,
          },
        );
        if (error) throw error;
        await supabase
          .from("konexa_webhook_events")
          .update({ status: "processed", processed_at: new Date().toISOString() })
          .eq("provider", "modusign")
          .eq("event_id", eventId);
        res.status(200).json({ received: true, data });
      } catch (error) {
        await supabase
          .from("konexa_webhook_events")
          .update({
            status: "failed",
            last_error: (error instanceof Error ? error.message : "Webhook processing failed").slice(0, 1_000),
          })
          .eq("provider", "modusign")
          .eq("event_id", eventId);
        throw error;
      }
    } catch (error) {
      const status = Number((error as { statusCode?: unknown })?.statusCode) || 500;
      if (status >= 500) console.error("Modusign webhook failed:", error);
      res.status(status).json({
        error: status >= 500
          ? "Modusign webhook processing failed."
          : error instanceof Error ? error.message : "Invalid Modusign webhook.",
      });
    }
  });
}
