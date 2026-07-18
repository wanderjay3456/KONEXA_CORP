import type { Express, Response } from "express";
import { getSupabaseAdmin } from "./supabaseAdmin";
import type { AuthenticatedRequest } from "./security";

const BUCKET = "student-intro-videos";
const SIGNED_URL_SECONDS = 5 * 60;

async function companyHasApprovedMatch(companyId: string, studentId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("app_records")
    .select("record_id")
    .eq("collection_name", "applications")
    .eq("data->>companyId", companyId)
    .eq("data->>studentId", studentId)
    .eq("data->>status", "approved")
    .limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

function isOwnedVideoPath(studentId: string, value: unknown): value is string {
  return typeof value === "string"
    && value.startsWith(`${studentId}/`)
    && !value.includes("..");
}

export function registerTalentVideoRoutes(app: Express) {
  app.get("/api/talent-videos/:studentId", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requester = req.user;
      const studentId = String(req.params.studentId || "").trim();
      if (!requester?.uid) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      if (!/^[0-9a-f-]{36}$/i.test(studentId)) {
        res.status(400).json({ error: "Invalid student identifier" });
        return;
      }

      const canView = requester.uid === studentId
        || requester.role === "admin"
        || (requester.role === "company" && await companyHasApprovedMatch(requester.uid, studentId));
      if (!canView) {
        res.status(403).json({ error: "The introduction video is available only after this application is approved." });
        return;
      }

      const admin = getSupabaseAdmin();
      const { data: profileRow, error: profileError } = await admin
        .from("app_records")
        .select("data")
        .eq("collection_name", "student_profiles")
        .eq("record_id", studentId)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profileRow) {
        res.status(404).json({ error: "Student profile not found" });
        return;
      }

      const profile = profileRow.data as Record<string, unknown>;
      if (!isOwnedVideoPath(studentId, profile.introVideoPath)) {
        res.status(404).json({ error: "This student has not uploaded an introduction video." });
        return;
      }

      const { data: signed, error: signedError } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(profile.introVideoPath, SIGNED_URL_SECONDS);
      if (signedError || !signed?.signedUrl) throw signedError || new Error("Signed video URL was not created");

      res.setHeader("Cache-Control", "private, no-store");
      res.json({
        url: signed.signedUrl,
        expiresIn: SIGNED_URL_SECONDS,
        durationSeconds: Number(profile.introVideoDurationSeconds || 0),
        fileName: String(profile.introVideoFileName || "1? ????"),
        updatedAt: Number(profile.introVideoUpdatedAt || 0),
      });
    } catch (error) {
      console.error("Introduction video access failed:", error);
      res.status(500).json({ error: "The introduction video could not be loaded." });
    }
  });
}
