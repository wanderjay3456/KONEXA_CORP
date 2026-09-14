import type { SupabaseClient } from "@supabase/supabase-js";

/** One Postgres statement: the profile cannot complete without its review request. */
export async function persistCompletedProfile(
  client: SupabaseClient<any>,
  role: "student" | "company",
  profile: Record<string, any>,
  email: string,
  contacts?: Record<string, unknown>,
) {
  const uid = String(profile.uid);
  const now = Date.now();
  const row = (collection: string, id: string, data: Record<string, any>) => ({
    collection_name: collection, record_id: id, owner_id: uid, is_public: false, data,
  });
  const rows = [
    row(`${role}_profiles`, uid, profile),
    row("verification_requests", `${uid}-${role === "student" ? "student-identity" : "business-registration"}`, {
      userId: uid, userEmail: email, userName: profile.name || profile.companyName,
      role, verificationType: role === "student" ? "identity" : "business_registration",
      status: "Pending", adminNotes: "", createdAt: now, updatedAt: now,
      documentUrl: role === "student" ? profile.identityDocumentPath : profile.businessRegistrationDocumentPath,
    }),
  ];
  if (contacts) rows.push(row("protected_contacts", uid, contacts));
  const { error } = await client.from("app_records").upsert(rows, { onConflict: "collection_name,record_id" });
  if (error) throw error;
}
