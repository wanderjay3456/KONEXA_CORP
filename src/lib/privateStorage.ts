import { supabase } from "../config/supabase";

export type PrivateStorageBucket =
  | "profile-media"
  | "resumes"
  | "identity-documents"
  | "business-documents"
  | "project-deliverables";

function safeFileName(name: string) {
  const normalized = name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
  return normalized.replace(/^[-.]+|[-.]+$/g, "").slice(0, 120) || "upload";
}

export async function uploadPrivateFile(
  bucket: PrivateStorageBucket,
  userId: string,
  file: File,
) {
  if (!userId) throw new Error("로그인된 사용자만 파일을 업로드할 수 있습니다.");
  if (!file || file.size <= 0) throw new Error("업로드할 파일을 선택해 주세요.");

  const rules: Record<PrivateStorageBucket, { max: number; types: string[] }> = {
    "profile-media": { max: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
    resumes: { max: 5 * 1024 * 1024, types: ["application/pdf"] },
    "identity-documents": { max: 10 * 1024 * 1024, types: ["application/pdf", "image/jpeg", "image/png"] },
    "business-documents": { max: 10 * 1024 * 1024, types: ["application/pdf", "image/jpeg", "image/png"] },
    "project-deliverables": { max: 50 * 1024 * 1024, types: ["application/pdf", "application/zip", "text/plain", "image/jpeg", "image/png", "application/json"] },
  };
  const rule = rules[bucket];
  if (file.size > rule.max) throw new Error(`파일 크기는 ${Math.round(rule.max / 1024 / 1024)}MB 이하여야 합니다.`);
  if (!rule.types.includes(file.type)) throw new Error("지원하지 않는 파일 형식입니다.");

  const objectPath = `${userId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return objectPath;
}
