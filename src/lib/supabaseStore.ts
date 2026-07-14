import { supabase } from "../config/supabase";

type Direction = "asc" | "desc";
type Constraint =
  | { kind: "where"; field: string; operator: "=="; value: unknown }
  | { kind: "order"; field: string; direction: Direction }
  | { kind: "limit"; count: number };

interface StoreReference {
  collectionName: string;
  id?: string;
  constraints?: Constraint[];
}

interface StoreDocument<T = Record<string, any>> {
  id: string;
  data(): T;
  exists(): boolean;
}

interface StoreSnapshot<T = Record<string, any>> {
  docs: StoreDocument<T>[];
  empty: boolean;
  forEach(callback: (document: StoreDocument<T>) => void): void;
}

const PUBLIC_COLLECTIONS = new Set([
  "projects",
  "ai_agents",
  "prompt_versions",
  "ai_metrics",
  "model_registry",
  "rbac_policies",
]);

function makeDocument(id: string, data: Record<string, any> | null): StoreDocument {
  return {
    id,
    data: () => data || {},
    exists: () => data !== null,
  };
}

function makeSnapshot(rows: Array<{ record_id: string; data: Record<string, any> }>): StoreSnapshot {
  const docs = rows.map((row) => makeDocument(row.record_id, reviveData(row.data)));
  return { docs, empty: docs.length === 0, forEach: (callback) => docs.forEach(callback) };
}

function reviveData(data: Record<string, any>) {
  if (data?.createdAt && typeof data.createdAt === "object" && typeof data.createdAt.epochMs === "number") {
    data = { ...data, createdAt: { ...data.createdAt, toDate: () => new Date(data.createdAt.epochMs) } };
  }
  return data;
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
}

function uuidOrNull(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

async function ownerFor(collectionName: string, data: Record<string, any>, id: string) {
  if (collectionName === "waitlist") return null;
  const candidate = collectionName === "projects"
    ? data.companyId
    : collectionName === "applications"
      ? data.studentId
      : collectionName === "messages"
        ? data.senderId
        : collectionName === "logs"
          ? data.userId
          : ["users", "student_profiles", "company_profiles"].includes(collectionName)
            ? id
            : data.userId;
  return uuidOrNull(candidate) || await currentUserId();
}

async function load(reference: StoreReference) {
  let request = supabase
    .from("app_records")
    .select("record_id,data")
    .eq("collection_name", reference.collectionName);

  if (reference.id) request = request.eq("record_id", reference.id);
  const { data, error } = await request;
  if (error) throw error;

  let rows = (data || []) as Array<{ record_id: string; data: Record<string, any> }>;
  for (const constraint of reference.constraints || []) {
    if (constraint.kind === "where") {
      rows = rows.filter((row) => row.data?.[constraint.field] === constraint.value);
    } else if (constraint.kind === "order") {
      const multiplier = constraint.direction === "asc" ? 1 : -1;
      rows.sort((a, b) => {
        const left = a.data?.[constraint.field]?.epochMs ?? a.data?.[constraint.field] ?? 0;
        const right = b.data?.[constraint.field]?.epochMs ?? b.data?.[constraint.field] ?? 0;
        return left === right ? 0 : left > right ? multiplier : -multiplier;
      });
    } else if (constraint.kind === "limit") {
      rows = rows.slice(0, constraint.count);
    }
  }
  return rows;
}

export function collection(_db: unknown, collectionName: string): StoreReference {
  return { collectionName };
}

export function doc(_db: unknown, collectionName: string, id: string): StoreReference;
export function doc(reference: StoreReference, id: string): StoreReference;
export function doc(first: unknown, second: string, third?: string): StoreReference {
  if (typeof third === "string") return { collectionName: second, id: third };
  return { collectionName: (first as StoreReference).collectionName, id: second };
}

export function where(field: string, operator: "==", value: unknown): Constraint {
  return { kind: "where", field, operator, value };
}

export function orderBy(field: string, direction: Direction = "asc"): Constraint {
  return { kind: "order", field, direction };
}

export function limit(count: number): Constraint {
  return { kind: "limit", count };
}

export function query(reference: StoreReference, ...constraints: Constraint[]): StoreReference {
  return { ...reference, constraints };
}

export async function getDocs(reference: StoreReference) {
  return makeSnapshot(await load(reference));
}

export async function getDoc(reference: StoreReference) {
  const rows = await load(reference);
  return makeDocument(reference.id || "", rows[0]?.data ? reviveData(rows[0].data) : null);
}

export async function addDoc(reference: StoreReference, value: Record<string, any>) {
  const id = crypto.randomUUID();
  await setDoc({ ...reference, id }, value);
  return { id };
}

export async function setDoc(reference: StoreReference, value: Record<string, any>, options?: { merge?: boolean }) {
  if (!reference.id) throw new Error("A record id is required.");
  let nextValue = value;
  if (options?.merge) {
    const existing = await getDoc(reference);
    nextValue = { ...(existing.exists() ? existing.data() : {}), ...value };
  }
  const ownerId = await ownerFor(reference.collectionName, nextValue, reference.id);
  const { error } = await supabase.from("app_records").upsert({
    collection_name: reference.collectionName,
    record_id: reference.id,
    owner_id: ownerId,
    data: nextValue,
    is_public: PUBLIC_COLLECTIONS.has(reference.collectionName),
  }, { onConflict: "collection_name,record_id" });
  if (error) throw error;
}

export async function deleteDoc(reference: StoreReference) {
  if (!reference.id) throw new Error("A record id is required.");
  const { error } = await supabase.from("app_records")
    .delete()
    .eq("collection_name", reference.collectionName)
    .eq("record_id", reference.id);
  if (error) throw error;
}

export function onSnapshot(
  reference: StoreReference,
  onNext: (snapshot: StoreSnapshot) => void,
  onError?: (error: unknown) => void,
) {
  let active = true;
  const refresh = async () => {
    try {
      const snapshot = await getDocs(reference);
      if (active) onNext(snapshot);
    } catch (error) {
      if (active) onError?.(error);
    }
  };
  void refresh();
  const channel = supabase
    .channel(`records:${reference.collectionName}:${crypto.randomUUID()}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "app_records",
      filter: `collection_name=eq.${reference.collectionName}`,
    }, () => void refresh())
    .subscribe();
  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export const Timestamp = {
  now: () => ({ epochMs: Date.now(), toDate: () => new Date() }),
};

