import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "../server/supabaseAdmin";

function toRecord(row: any) {
  return {
    id: row.record_id,
    ...(row.data || {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function writeAdminLog(supabase: ReturnType<typeof getSupabaseAdmin>, req: any, action: string, details: string) {
  const id = randomUUID();
  const actorId = req.user?.uid;
  const data = {
    id,
    userId: actorId,
    userName: req.user?.email || "KONEXA administrator",
    action,
    details,
    timestamp: Date.now(),
  };
  const { error } = await supabase.from("app_records").insert({
    collection_name: "logs",
    record_id: id,
    owner_id: actorId,
    data,
    is_public: false,
  });
  if (error) throw error;
}

export function registerAdminRoutes(app: any, _getAIClient: unknown) {
  app.get("/api/admin/directory", async (_req: any, res: any) => {
    try {
      const supabase = getSupabaseAdmin();
      const [{ data: users, error: usersError }, { data: students, error: studentsError }, { data: companies, error: companiesError }] = await Promise.all([
        supabase.from("app_records").select("record_id,data,created_at,updated_at").eq("collection_name", "users").order("updated_at", { ascending: false }),
        supabase.from("app_records").select("record_id,data").eq("collection_name", "student_profiles"),
        supabase.from("app_records").select("record_id,data").eq("collection_name", "company_profiles"),
      ]);
      if (usersError || studentsError || companiesError) throw usersError || studentsError || companiesError;

      const profiles = new Map<string, Record<string, unknown>>();
      [...(students || []), ...(companies || [])].forEach((row: any) => profiles.set(row.record_id, row.data || {}));
      res.json({
        users: (users || []).map((row: any) => ({
          id: row.record_id,
          ...(row.data || {}),
          profile: profiles.get(row.record_id) || null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      });
    } catch (cause) {
      res.status(500).json({ error: "Failed to load the live user directory", details: cause instanceof Error ? cause.message : "Unknown error" });
    }
  });

  app.get("/api/admin/verifications", async (_req: any, res: any) => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("app_records")
        .select("record_id,data,created_at,updated_at")
        .eq("collection_name", "verification_requests")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      res.json({ requests: (data || []).map(toRecord) });
    } catch (cause) {
      res.status(500).json({ error: "Failed to load verification requests", details: cause instanceof Error ? cause.message : "Unknown error" });
    }
  });

  app.post("/api/admin/verifications/:requestId/review", async (req: any, res: any) => {
    try {
      const status = String(req.body?.status || "");
      const adminNotes = String(req.body?.adminNotes || "").trim().slice(0, 1_000);
      if (!["Approved", "Rejected"].includes(status)) return res.status(400).json({ error: "Status must be Approved or Rejected" });

      const supabase = getSupabaseAdmin();
      const { data: requestRow, error: requestError } = await supabase
        .from("app_records")
        .select("data")
        .eq("collection_name", "verification_requests")
        .eq("record_id", req.params.requestId)
        .single();
      if (requestError || !requestRow) return res.status(404).json({ error: "Verification request not found" });

      const requestData = requestRow.data as Record<string, any>;
      const userId = String(requestData.userId || "");
      const role = String(requestData.role || "");
      if (!/^[0-9a-f-]{36}$/i.test(userId) || !["student", "company"].includes(role)) {
        return res.status(400).json({ error: "Verification request has an invalid account reference" });
      }

      const profileCollection = role === "company" ? "company_profiles" : "student_profiles";
      const { data: profileRow, error: profileReadError } = await supabase
        .from("app_records")
        .select("data")
        .eq("collection_name", profileCollection)
        .eq("record_id", userId)
        .single();
      if (profileReadError || !profileRow) throw profileReadError || new Error("Profile not found");

      const reviewedAt = Date.now();
      const reviewedRequest = { ...requestData, status, adminNotes, reviewedAt, reviewedBy: req.user?.uid };
      const profileStatus = status === "Approved" ? "Verified" : "Rejected";
      const notificationId = randomUUID();
      const notification = {
        id: notificationId,
        recipientId: userId,
        kind: "verification",
        title: status === "Approved" ? "인증이 승인되었습니다" : "인증 보완이 필요합니다",
        message: status === "Approved" ? "제출하신 필수정보와 증빙이 승인되었습니다." : (adminNotes || "제출 서류를 확인하고 다시 제출해 주세요."),
        entityType: "verification_request",
        entityId: req.params.requestId,
        actionTab: "profile",
        createdAt: reviewedAt,
        readAt: null,
      };

      const { error: updateRequestError } = await supabase.from("app_records").update({ data: reviewedRequest }).eq("collection_name", "verification_requests").eq("record_id", req.params.requestId);
      if (updateRequestError) throw updateRequestError;
      const { error: updateProfileError } = await supabase.from("app_records").update({ data: { ...(profileRow.data as Record<string, any>), verified: status === "Approved", verifiedStatus: profileStatus, verificationReviewedAt: reviewedAt } }).eq("collection_name", profileCollection).eq("record_id", userId);
      if (updateProfileError) throw updateProfileError;
      const { error: notificationError } = await supabase.from("app_records").insert({ collection_name: "notifications", record_id: notificationId, owner_id: userId, data: notification, is_public: false });
      if (notificationError) throw notificationError;
      await writeAdminLog(supabase, req, "VERIFICATION_REVIEW", `${role} verification ${req.params.requestId} changed to ${status}`);

      res.json({ success: true, request: reviewedRequest, profileStatus });
    } catch (cause) {
      res.status(500).json({ error: "Could not review the verification request", details: cause instanceof Error ? cause.message : "Unknown error" });
    }
  });

  app.post("/api/admin/users/:userId/status", async (req: any, res: any) => {
    try {
      const accountStatus = String(req.body?.accountStatus || "");
      if (!["Active", "Suspended"].includes(accountStatus)) return res.status(400).json({ error: "Invalid account status" });
      if (req.params.userId === req.user?.uid && accountStatus === "Suspended") return res.status(400).json({ error: "Administrators cannot suspend their own active session" });

      const supabase = getSupabaseAdmin();
      const { data: row, error: readError } = await supabase.from("app_records").select("data").eq("collection_name", "users").eq("record_id", req.params.userId).single();
      if (readError || !row) return res.status(404).json({ error: "User not found" });
      const { error } = await supabase.from("app_records").update({ data: { ...(row.data as Record<string, any>), accountStatus, statusUpdatedAt: Date.now(), statusUpdatedBy: req.user?.uid } }).eq("collection_name", "users").eq("record_id", req.params.userId);
      if (error) throw error;
      await writeAdminLog(supabase, req, "ACCOUNT_STATUS_UPDATE", `User ${req.params.userId} changed to ${accountStatus}`);
      res.json({ success: true, accountStatus });
    } catch (cause) {
      res.status(500).json({ error: "Could not update account status", details: cause instanceof Error ? cause.message : "Unknown error" });
    }
  });

  app.get("/api/admin/metrics", async (_req: any, res: any) => {
    try {
      const startedAt = Date.now();
      const { data, error } = await getSupabaseAdmin().from("app_records").select("collection_name,data").in("collection_name", ["users", "projects", "applications", "verification_requests"]);
      if (error) throw error;
      const rows = data || [];
      const users = rows.filter((row: any) => row.collection_name === "users");
      const projects = rows.filter((row: any) => row.collection_name === "projects");
      const applications = rows.filter((row: any) => row.collection_name === "applications");
      const verifications = rows.filter((row: any) => row.collection_name === "verification_requests");
      res.json({
        generatedAt: new Date().toISOString(),
        databaseLatencyMs: Date.now() - startedAt,
        users: {
          total: users.length,
          students: users.filter((row: any) => row.data?.role === "student").length,
          companies: users.filter((row: any) => row.data?.role === "company").length,
          suspended: users.filter((row: any) => row.data?.accountStatus === "Suspended").length,
        },
        projects: {
          total: projects.length,
          open: projects.filter((row: any) => row.data?.status === "open").length,
          completed: projects.filter((row: any) => row.data?.status === "completed").length,
        },
        applications: {
          total: applications.length,
          submitted: applications.filter((row: any) => row.data?.status === "submitted").length,
          approved: applications.filter((row: any) => row.data?.status === "approved").length,
        },
        verifications: {
          pending: verifications.filter((row: any) => row.data?.status === "Pending").length,
        },
      });
    } catch (cause) {
      res.status(500).json({ error: "Failed to load live metrics", details: cause instanceof Error ? cause.message : "Unknown error" });
    }
  });

  app.get("/api/admin/audit", async (_req: any, res: any) => {
    try {
      const { data, error } = await getSupabaseAdmin().from("app_records").select("record_id,data,created_at,updated_at").eq("collection_name", "logs").order("updated_at", { ascending: false }).limit(200);
      if (error) throw error;
      res.json({ logs: (data || []).map(toRecord) });
    } catch (cause) {
      res.status(500).json({ error: "Failed to load live audit records", details: cause instanceof Error ? cause.message : "Unknown error" });
    }
  });
}