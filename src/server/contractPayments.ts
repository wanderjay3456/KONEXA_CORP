import { adminDb, getSupabaseAdmin } from "./supabaseAdmin";

export interface PayableProjectContract {
  id: string;
  legacy: boolean;
  companyId: string;
  studentId: string;
  relationshipId: string;
  title: string;
  amountKrw: number;
  status: string;
}

function paymentError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

export async function loadPayableProjectContract(
  contractId: string,
  companyId: string,
): Promise<PayableProjectContract> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("konexa_contracts")
    .select("id,company_id,student_id,relationship_id,title,monthly_amount_krw,status")
    .eq("id", contractId)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    if (data.company_id !== companyId) {
      throw paymentError("Only the contract company can prepare payment.", 403);
    }
    if (!["signed", "funded", "active"].includes(data.status)) {
      throw paymentError("A provider-verified signed contract is required before payment.", 409);
    }
    const amountKrw = Number(data.monthly_amount_krw);
    if (!Number.isSafeInteger(amountKrw) || amountKrw < 1_000) {
      throw paymentError("Contract payment terms are invalid.", 409);
    }
    const { count, error: signatureError } = await supabase
      .from("konexa_contract_signatures")
      .select("id", { count: "exact", head: true })
      .eq("contract_id", contractId)
      .eq("provider", "modusign")
      .eq("verification_status", "verified");
    if (signatureError) throw signatureError;
    if ((count || 0) < 2) {
      throw paymentError("Both Modusign signatures must be provider-verified before payment.", 409);
    }
    return {
      id: data.id,
      legacy: false,
      companyId: data.company_id,
      studentId: data.student_id,
      relationshipId: data.relationship_id,
      title: data.title,
      amountKrw,
      status: data.status,
    };
  }

  const legacySnapshot = await adminDb.collection("contracts").doc(contractId).get();
  const legacy = legacySnapshot.data();
  if (!legacySnapshot.exists || !legacy) throw paymentError("Contract not found.", 404);
  if (legacy.companyId !== companyId) {
    throw paymentError("Only the contract company can prepare payment.", 403);
  }
  const relationshipId = String(legacy.relationshipId || "");
  const amountKrw = Number(legacy.payment?.monthlyAmountKrw);
  if (!relationshipId || !Number.isSafeInteger(amountKrw) || amountKrw < 1_000) {
    throw paymentError("Contract payment terms are invalid.", 409);
  }
  const { data: signatures, error: signatureError } = await supabase
    .from("app_records")
    .select("data")
    .eq("collection_name", "contract_signatures")
    .eq("data->>relationshipId", relationshipId)
    .eq("data->>provider", "modusign")
    .eq("data->>verificationStatus", "verified");
  if (signatureError) throw signatureError;
  const signatureTypes = new Set(
    (signatures || []).map((item) => String((item.data as Record<string, unknown>)?.signatureType || "")),
  );
  if (!signatureTypes.has("company") || !signatureTypes.has("talent")) {
    throw paymentError("Both Modusign signatures must be provider-verified before payment.", 409);
  }
  return {
    id: contractId,
    legacy: true,
    companyId,
    studentId: String(legacy.talentId || legacy.studentId || ""),
    relationshipId,
    title: String(legacy.title || "KONEXA 프로젝트"),
    amountKrw,
    status: String(legacy.status || "issued"),
  };
}
