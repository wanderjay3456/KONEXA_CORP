import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { UUID_PATTERN } from "./backendV2Validation";

const uuidOrNull = (value: unknown) => (
  typeof value === "string" && UUID_PATTERN.test(value) ? value : null
);

export interface PaymentOrderLedgerInput {
  legacyRecordId: string;
  relationshipId?: string | null;
  contractId?: string | null;
  legacyContractId?: string | null;
  companyId: string;
  studentId?: string | null;
  provider: string;
  providerPaymentId?: string | null;
  idempotencyKey: string;
  amountKrw: number;
  status: string;
  reference?: string | null;
  payload?: Record<string, unknown>;
}

export async function upsertPaymentOrderLedger(input: PaymentOrderLedgerInput) {
  const { data, error } = await getSupabaseAdmin().rpc("konexa_upsert_payment_order_v2", {
    p_legacy_record_id: input.legacyRecordId,
    p_relationship_id: uuidOrNull(input.relationshipId),
    p_contract_id: uuidOrNull(input.contractId),
    p_legacy_contract_id: input.legacyContractId || input.contractId || null,
    p_company_id: input.companyId,
    p_student_id: uuidOrNull(input.studentId),
    p_provider: input.provider,
    p_provider_payment_id: input.providerPaymentId || null,
    p_idempotency_key: input.idempotencyKey,
    p_amount_krw: input.amountKrw,
    p_status: input.status,
    p_reference: input.reference || null,
    p_payload: input.payload || {},
  });
  if (error) throw error;
  return data as string;
}

export async function recordPaymentLedgerEvent(input: {
  provider: string;
  eventId: string;
  eventType: string;
  providerPaymentId: string;
  status: string;
  payload: unknown;
}) {
  const serialized = JSON.stringify(input.payload || {});
  const { data, error } = await getSupabaseAdmin().rpc("konexa_record_payment_event_v2", {
    p_provider: input.provider,
    p_event_id: input.eventId,
    p_event_type: input.eventType,
    p_provider_payment_id: input.providerPaymentId,
    p_status: input.status,
    p_payload_hash: createHash("sha256").update(serialized).digest("hex"),
    p_payload: input.payload || {},
  });
  if (error) throw error;
  return data as Record<string, unknown>;
}
