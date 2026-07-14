import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || "https://isrzklwhxdirmgdxgcvs.supabase.co";
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_hOCOp7_lbomazxphp9dQHQ_cVHnJeAP";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY is not configured");
  adminClient ||= createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return adminClient;
}

export function getSupabaseAuthClient(accessToken?: string) {
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}

type FieldMarker =
  | { __operation: "serverTimestamp" }
  | { __operation: "increment"; amount: number };

export const FieldValue = {
  serverTimestamp: (): FieldMarker => ({ __operation: "serverTimestamp" }),
  increment: (amount: number): FieldMarker => ({ __operation: "increment", amount }),
};

function resolveValue(next: any, previous: any): any {
  if (next?.__operation === "serverTimestamp") return new Date().toISOString();
  if (next?.__operation === "increment") return Number(previous || 0) + Number(next.amount || 0);
  if (Array.isArray(next)) return next.map((item, index) => resolveValue(item, previous?.[index]));
  if (next && typeof next === "object" && !(next instanceof Date)) {
    return Object.fromEntries(Object.entries(next).map(([key, value]) => [key, resolveValue(value, previous?.[key])]));
  }
  return next instanceof Date ? next.toISOString() : next;
}

class DocumentReference {
  constructor(public collectionName: string, public id: string) {}

  async get() {
    const { data, error } = await getSupabaseAdmin()
      .from("app_records")
      .select("data")
      .eq("collection_name", this.collectionName)
      .eq("record_id", this.id)
      .maybeSingle();
    if (error) throw error;
    return {
      exists: Boolean(data),
      data: () => data?.data as Record<string, any> | undefined,
    };
  }

  async set(value: Record<string, any>, options?: { merge?: boolean }) {
    const existing = options?.merge ? (await this.get()).data() || {} : {};
    const resolved = resolveValue(value, existing);
    const next = options?.merge ? { ...existing, ...resolved } : resolved;
    const ownerCandidate = next.userId || next.studentId || next.companyId || next.supabaseUid;
    const ownerId = typeof ownerCandidate === "string" && /^[0-9a-f-]{36}$/i.test(ownerCandidate) ? ownerCandidate : null;
    const { error } = await getSupabaseAdmin().from("app_records").upsert({
      collection_name: this.collectionName,
      record_id: this.id,
      owner_id: ownerId,
      data: next,
      is_public: this.collectionName === "projects",
    }, { onConflict: "collection_name,record_id" });
    if (error) throw error;
  }

  async update(value: Record<string, any>) {
    await this.set(value, { merge: true });
  }

  async create(value: Record<string, any>) {
    const { error } = await getSupabaseAdmin().from("app_records").insert({
      collection_name: this.collectionName,
      record_id: this.id,
      data: resolveValue(value, {}),
      is_public: false,
    });
    if (error) {
      if (error.code === "23505") throw Object.assign(new Error("already-exists"), { code: "already-exists" });
      throw error;
    }
  }
}

class CollectionReference {
  constructor(public name: string) {}
  doc(id: string) {
    return new DocumentReference(this.name, id);
  }
}

export const adminDb = {
  collection(name: string) {
    return new CollectionReference(name);
  },
  batch() {
    const tasks: Array<() => Promise<void>> = [];
    return {
      update(ref: DocumentReference, value: Record<string, any>) {
        tasks.push(() => ref.update(value));
      },
      set(ref: DocumentReference, value: Record<string, any>, options?: { merge?: boolean }) {
        tasks.push(() => ref.set(value, options));
      },
      async commit() {
        await Promise.all(tasks.map((task) => task()));
      },
    };
  },
};

export const adminAuth = {
  async getUser(uid: string) {
    const { data, error } = await getSupabaseAdmin().auth.admin.getUserById(uid);
    if (error) throw error;
    return { ...data.user, customClaims: data.user.app_metadata };
  },
  async setCustomUserClaims(uid: string, claims: Record<string, unknown>) {
    const { data, error } = await getSupabaseAdmin().auth.admin.updateUserById(uid, { app_metadata: claims });
    if (error) throw error;
    return data.user;
  },
};
