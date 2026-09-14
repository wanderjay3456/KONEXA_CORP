import crypto from "node:crypto";
import { deferNotificationWork } from "./deferredWork";
import { isTransientDependencyError } from './dependencyResilience';
import type { Express, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { requireAuth, type AuthenticatedRequest } from "./security";
import { requestProjectContractSignature } from "./modusign";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
  type EmailTemplate,
  EMAIL_TEMPLATES,
} from "./email";
import { reviewVisibilityFilter, shouldDeliverAccountEmail } from './workflowVisibility';
import {
  ApiInputError,
  enumValue,
  idempotencyKey,
  parseApplicationPayload,
  parseApplicationReview,
  parseContractPayload,
  parseDisputePayload,
  parseMilestonePayload,
  parseMilestoneSubmission,
  parseProjectPayload,
  parseRelationshipPayload,
  parseReviewPayload,
  plainObject,
  text,
  uuid,
} from "./backendV2Validation";

type JsonRecord = Record<string, any>;

const registrationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const publicReadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

const supportedOutboxTemplates = new Set<EmailTemplate>(EMAIL_TEMPLATES);

function requestId(req: Request) {
  const supplied = req.header("x-request-id");
  return supplied && supplied.length <= 160
    ? supplied
    : crypto.randomUUID();
}

function keyFromRequest(req: Request) {
  return idempotencyKey(req.header("x-idempotency-key"));
}

function asErrorMessage(error: unknown) {
  const value = error as { message?: unknown; details?: unknown; hint?: unknown };
  return [value?.message, value?.details, value?.hint]
    .filter((item): item is string => typeof item === "string" && Boolean(item))
    .join(" ");
}

function routeError(res: Response, error: unknown, fallback = "The request could not be completed.") {
  if (isTransientDependencyError(error)) {
    console.warn('KONEXA database dependency is temporarily unavailable');
    res.setHeader('Retry-After', '3');
    res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'The data service is temporarily unavailable. Please try again shortly.' } });
    return;
  }
  const message = asErrorMessage(error);
  const inputError = error instanceof ApiInputError;
  const declaredStatus = Number((error as { statusCode?: unknown })?.statusCode);
  let status = inputError
    ? error.statusCode
    : Number.isInteger(declaredStatus) && declaredStatus >= 400 && declaredStatus <= 599
      ? declaredStatus
      : 500;
  let code = inputError ? error.code : "BACKEND_ERROR";

  const rules: Array<[RegExp, number, string]> = [
    [/not_found|not found/i, 404, "NOT_FOUND"],
    [/forbidden|role_required|role required|owner mismatch/i, 403, "FORBIDDEN"],
    [/verified_company_required|verification is required/i, 409, "VERIFICATION_REQUIRED"],
    [/already|duplicate|unique|idempotency_key_reused/i, 409, "CONFLICT"],
    [/command_in_progress/i, 409, "COMMAND_IN_PROGRESS"],
    [/invalid_|must |required|deadline_passed|not_open|not_ready/i, 400, "INVALID_REQUEST"],
  ];
  if (!inputError && status === 500) {
    const matched = rules.find(([pattern]) => pattern.test(message));
    if (matched) [, status, code] = matched;
  }

  if (status >= 500) {
    console.error("KONEXA backend v2 route failed:", error);
  }
  res.status(status).json({
    error: {
      code,
      message: status >= 500 ? fallback : (inputError ? error.message : message || fallback),
    },
  });
}

async function rpc<T = JsonRecord>(name: string, parameters: JsonRecord) {
  const { data, error } = await getSupabaseAdmin().rpc(name, parameters);
  if (error) throw error;
  return data as T;
}

function processOutboxSoon() {
  // Keep the invocation alive after the HTTP response. Durable outbox retries
  // still handle provider failures and the function's maximum runtime.
  deferNotificationWork(() => processNotificationOutboxBatch(8));
}

interface NotificationOutboxRow {
  id: string;
  recipient_id: string;
  template: string;
  payload: JsonRecord;
  idempotency_key: string;
}

export async function processNotificationOutboxBatch(limit = 20) {
  const workerId = `api-${process.pid}-${crypto.randomUUID()}`;
  const claimed = await rpc<NotificationOutboxRow[]>(
    "konexa_claim_notification_outbox_v2",
    { p_worker_id: workerId, p_limit: Math.max(1, Math.min(limit, 100)) },
  );
  const summary = { claimed: claimed?.length || 0, sent: 0, failed: 0, suppressed: 0 };

  for (const item of claimed || []) {
    try {
      if (!supportedOutboxTemplates.has(item.template as EmailTemplate)) {
        throw new Error(`Unsupported notification template: ${item.template}`);
      }
      const { data, error } = await getSupabaseAdmin().auth.admin.getUserById(item.recipient_id);
      if (error) throw error;
      if (!data.user?.email) throw new Error("Recipient email is unavailable");

      const { data: records, error: preferencesError } = await getSupabaseAdmin()
        .from('app_records').select('collection_name,data').eq('owner_id', item.recipient_id)
        .in('collection_name', ['users', 'student_profiles', 'company_profiles']);
      if (preferencesError) throw preferencesError;
      const user = records?.find(row => row.collection_name === 'users')?.data || {};
      const profile = records?.find(row => row.collection_name === `${user.role}_profiles`)?.data || {};
      if (!shouldDeliverAccountEmail(profile, user)) {
        const { error: suppressionError } = await getSupabaseAdmin().from('konexa_notification_outbox')
          .update({ status: 'suppressed', last_error: 'disabled_by_preferences_or_account', locked_at: null, locked_by: null })
          .eq('id', item.id).eq('locked_by', workerId);
        if (suppressionError) throw suppressionError;
        summary.suppressed += 1;
        continue;
      }

      const payload = item.payload && typeof item.payload === "object" ? item.payload : {};
      const email = await sendTransactionalEmail({
        to: data.user.email,
        userId: item.recipient_id,
        template: item.template as EmailTemplate,
        data: Object.fromEntries(
          Object.entries(payload).filter(([, value]) => (
            typeof value === "string" || typeof value === "number" || value === undefined
          )),
        ),
        idempotencyKey: `outbox/${item.idempotency_key}`,
      });
      await rpc("konexa_complete_notification_outbox_v2", {
        p_id: item.id,
        p_worker_id: workerId,
        p_success: true,
        p_provider_message_id: email.id,
        p_error: null,
      });
      summary.sent += 1;
    } catch (error) {
      await rpc("konexa_complete_notification_outbox_v2", {
        p_id: item.id,
        p_worker_id: workerId,
        p_success: false,
        p_provider_message_id: null,
        p_error: asErrorMessage(error).slice(0, 1_000) || "Delivery failed",
      }).catch((completionError) => {
        console.error("Could not release failed outbox item:", completionError);
      });
      summary.failed += 1;
    }
  }
  return summary;
}

let readinessCache: { checkedAt: number; value: BackendV2Readiness } | null = null;

export interface BackendV2Readiness {
  schema: boolean;
  outbox: boolean;
  pendingNotifications: number | null;
  reason?: string;
}

export async function getBackendV2Readiness(): Promise<BackendV2Readiness> {
  if (readinessCache && Date.now() - readinessCache.checkedAt < 30_000) {
    return readinessCache.value;
  }
  try {
    const [{ error: projectError }, { count, error: outboxError }] = await Promise.all([
      getSupabaseAdmin().from("konexa_projects").select("id", { head: true, count: "exact" }),
      getSupabaseAdmin()
        .from("konexa_notification_outbox")
        .select("id", { head: true, count: "exact" })
        .in("status", ["pending", "failed", "dead_letter"]),
    ]);
    if (projectError) throw projectError;
    if (outboxError) throw outboxError;
    const emailReady = isTransactionalEmailConfigured();
    const value = {
      schema: true,
      outbox: emailReady,
      pendingNotifications: count ?? 0,
      ...(!emailReady ? { reason: "Transactional email is not configured." } : {}),
    };
    readinessCache = { checkedAt: Date.now(), value };
    return value;
  } catch (error) {
    const value = {
      schema: false,
      outbox: false,
      pendingNotifications: null,
      reason: asErrorMessage(error).slice(0, 300) || "Database readiness check failed.",
    };
    readinessCache = { checkedAt: Date.now(), value };
    return value;
  }
}

export function registerBackendV2PublicRoutes(app: Express) {
  app.get("/api/public/projects", publicReadRateLimit, async (_req, res) => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("konexa_projects")
        .select(
          "id,company_name,title,description,requirements,tags,difficulty,reward_text,weekly_pay_krw,work_type,duration_weeks,hours_per_week,required_language,application_deadline,hiring_opportunity,status,created_at",
        )
        .eq("status", "open")
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      const projects = (data || []).map((item) => ({
        id: item.id,
        companyName: item.company_name,
        title: item.title,
        description: item.description,
        requirements: item.requirements || [],
        tags: item.tags || [],
        difficulty: item.difficulty,
        reward: item.reward_text,
        weeklyPayKrw: item.weekly_pay_krw,
        workType: item.work_type,
        durationWeeks: item.duration_weeks,
        hoursPerWeek: item.hours_per_week,
        requiredLanguage: item.required_language,
        applicationDeadline: item.application_deadline,
        hiringOpportunity: item.hiring_opportunity,
        status: item.status,
        createdAt: new Date(item.created_at).getTime(),
      }));
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
      res.json({ data: projects });
    } catch (error) {
      routeError(res, error, "Public opportunities are temporarily unavailable.");
    }
  });

  app.post(
    "/api/auth/google-registration-intents",
    registrationRateLimit,
    async (req, res) => {
      try {
        const body = plainObject(req.body, "registration");
        const role = enumValue(body.role, "role", ["student", "company"] as const);
        const consents = plainObject(body.consents, "consents");
        const profile = body.profile && typeof body.profile === "object" && !Array.isArray(body.profile)
          ? body.profile
          : {};
        if (
          consents.terms !== true
          || consents.nonCircumvention !== true
          || consents.messageAnalysis !== true
          || consents.crossBorderPrivacy !== true
          || typeof consents.documentVersion !== "string"
          || !consents.documentVersion.trim()
        ) {
          throw new ApiInputError(
            "All required signup agreements must be accepted.",
            "CONSENT_REQUIRED",
          );
        }
        if (JSON.stringify(profile).length > 50_000 || JSON.stringify(consents).length > 10_000) {
          throw new ApiInputError("The registration payload is too large.", "PAYLOAD_TOO_LARGE", 413);
        }
        const registrationId = await rpc<string>("begin_google_registration", {
          requested_role: role,
          consent_payload: consents,
          profile_payload: profile,
        });
        res.status(201).json({ data: { registrationId } });
      } catch (error) {
        routeError(res, error, "Google registration could not be initialized.");
      }
    },
  );

  app.post(
    "/api/auth/google-registration-complete",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
        const registrationId = uuid(req.body?.registrationId, "registrationId");
        const role = await rpc<string>("konexa_complete_google_registration_v2", {
          p_registration_id: registrationId,
          p_caller_id: req.user.uid,
        });
        res.json({ data: { role } });
      } catch (error) {
        routeError(res, error, "Google registration could not be completed.");
      }
    },
  );

  const runNotificationWorker = async (req: Request, res: Response) => {
    const configuredSecret = process.env.CRON_SECRET;
    const authorization = req.header("authorization");
    if (
      !configuredSecret
      || authorization !== `Bearer ${configuredSecret}`
    ) {
      res.status(configuredSecret ? 401 : 503).json({
        error: {
          code: configuredSecret ? "UNAUTHORIZED" : "CRON_NOT_CONFIGURED",
          message: configuredSecret
            ? "A valid cron authorization token is required."
            : "The notification worker is not configured.",
        },
      });
      return;
    }
    try {
      res.json({ data: await processNotificationOutboxBatch(50) });
    } catch (error) {
      routeError(res, error, "The notification worker could not complete its batch.");
    }
  };
  app.get("/api/internal/outbox/process", runNotificationWorker);
  app.post("/api/internal/outbox/process", runNotificationWorker);
}

export function registerBackendV2Routes(app: Express) {
  app.post("/api/v2/projects", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
      const payload = parseProjectPayload(req.body);
      const data = await rpc("konexa_create_project_v2", {
        p_actor: req.user.uid,
        p_payload: payload,
        p_idempotency_key: keyFromRequest(req),
      });
      processOutboxSoon();
      res.status(201).json({ data, requestId: requestId(req) });
    } catch (error) {
      routeError(res, error, "The project could not be created.");
    }
  });

  app.post(
    "/api/v2/projects/:projectId/applications",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
        const payload = parseApplicationPayload(req.body);
        const data = await rpc("konexa_apply_to_project_v2", {
          p_actor: req.user.uid,
          p_project_id: uuid(req.params.projectId, "projectId"),
          p_payload: payload,
          p_idempotency_key: keyFromRequest(req),
        });
        processOutboxSoon();
        res.status(201).json({ data, requestId: requestId(req) });
      } catch (error) {
        routeError(res, error, "The application could not be submitted.");
      }
    },
  );

  app.post(
    "/api/v2/applications/:applicationId/review",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
        const review = parseApplicationReview(req.body);
        const data = await rpc("konexa_review_application_v2", {
          p_actor: req.user.uid,
          p_application_id: uuid(req.params.applicationId, "applicationId"),
          p_status: review.status,
          p_feedback: review.feedback,
          p_score: review.score,
          p_idempotency_key: keyFromRequest(req),
        });
        processOutboxSoon();
        res.json({ data, requestId: requestId(req) });
      } catch (error) {
        routeError(res, error, "The application review could not be saved.");
      }
    },
  );

  app.post("/api/v2/relationships", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
      const payload = parseRelationshipPayload(req.body);
      const data = await rpc("konexa_create_relationship_v2", {
        p_actor: req.user.uid,
        p_student_id: payload.studentId,
        p_project_id: payload.projectId,
        p_purpose: payload.purpose,
        p_existing_relationship: payload.existingRelationship,
        p_idempotency_key: keyFromRequest(req),
      });
      processOutboxSoon();
      res.status(201).json({ data, requestId: requestId(req) });
    } catch (error) {
      routeError(res, error, "The introduction could not be requested.");
    }
  });

  app.post("/api/v2/contracts", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
      const payload = parseContractPayload(req.body);
      const data = await rpc("konexa_create_contract_v2", {
        p_actor: req.user.uid,
        p_relationship_id: payload.relationshipId,
        p_payload: payload,
        p_idempotency_key: keyFromRequest(req),
      });
      processOutboxSoon();
      res.status(201).json({ data, requestId: requestId(req) });
    } catch (error) {
      routeError(res, error, "The contract could not be created.");
    }
  });

  app.post(
    "/api/v2/contracts/:contractId/signature-request",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
        const data = await requestProjectContractSignature({
          actor: req.user,
          contractId: uuid(req.params.contractId, "contractId"),
          idempotencyKey: keyFromRequest(req),
        });
        res.status(201).json({ data, requestId: requestId(req) });
      } catch (error) {
        routeError(res, error, "The electronic signature request could not be created.");
      }
    },
  );

  app.post("/api/v2/milestones", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
      const payload = parseMilestonePayload(req.body);
      const data = await rpc("konexa_create_milestone_v2", {
        p_actor: req.user.uid,
        p_contract_id: payload.contractId,
        p_payload: payload,
        p_idempotency_key: keyFromRequest(req),
      });
      processOutboxSoon();
      res.status(201).json({ data, requestId: requestId(req) });
    } catch (error) {
      routeError(res, error, "The milestone could not be created.");
    }
  });

  app.post(
    "/api/v2/milestones/:milestoneId/submissions",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
        const submission = parseMilestoneSubmission(req.body);
        const data = await rpc("konexa_submit_milestone_v2", {
          p_actor: req.user.uid,
          p_milestone_id: uuid(req.params.milestoneId, "milestoneId"),
          p_notes: submission.notes,
          p_storage_paths: submission.storagePaths,
          p_idempotency_key: keyFromRequest(req),
        });
        processOutboxSoon();
        res.status(201).json({ data, requestId: requestId(req) });
      } catch (error) {
        routeError(res, error, "The milestone submission could not be saved.");
      }
    },
  );

  app.post(
    "/api/v2/milestones/:milestoneId/review",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
        const decision = enumValue(req.body?.decision, "decision", ["approved", "rejected"] as const);
        const data = await rpc("konexa_review_milestone_v2", {
          p_actor: req.user.uid,
          p_milestone_id: uuid(req.params.milestoneId, "milestoneId"),
          p_decision: decision,
          p_idempotency_key: keyFromRequest(req),
        });
        processOutboxSoon();
        res.json({ data, requestId: requestId(req) });
      } catch (error) {
        routeError(res, error, "The milestone review could not be saved.");
      }
    },
  );

  app.post("/api/v2/disputes", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
      const payload = parseDisputePayload(req.body);
      const data = await rpc("konexa_create_dispute_v2", {
        p_actor: req.user.uid,
        p_relationship_id: payload.relationshipId,
        p_contract_id: payload.contractId,
        p_milestone_id: payload.milestoneId,
        p_category: payload.category,
        p_summary: payload.summary,
        p_idempotency_key: keyFromRequest(req),
      });
      processOutboxSoon();
      res.status(201).json({ data, requestId: requestId(req) });
    } catch (error) {
      routeError(res, error, "The dispute could not be opened.");
    }
  });

  app.post("/api/v2/reviews", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
      const payload = parseReviewPayload(req.body);
      const data = await rpc("konexa_create_review_v2", {
        p_actor: req.user.uid,
        p_relationship_id: payload.relationshipId,
        p_contract_id: payload.contractId,
        p_overall_rating: payload.overallRating,
        p_quality_rating: payload.qualityRating,
        p_communication_rating: payload.communicationRating,
        p_reliability_rating: payload.reliabilityRating,
        p_scope_clarity_rating: payload.scopeClarityRating,
        p_comment: payload.comment,
        p_idempotency_key: keyFromRequest(req),
      });
      processOutboxSoon();
      res.status(201).json({ data, requestId: requestId(req) });
    } catch (error) {
      routeError(res, error, "The verified transaction review could not be saved.");
    }
  });

  app.post(
    "/api/v2/admin/reviews/:reviewId/moderate",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (req.user?.role !== "admin" || !req.user.uid) {
          throw new ApiInputError("Administrator access is required.", "FORBIDDEN", 403);
        }
        const decision = enumValue(
          req.body?.decision,
          "decision",
          ["approved", "rejected"] as const,
        );
        const data = await rpc("konexa_moderate_review_v2", {
          p_actor: req.user.uid,
          p_review_id: uuid(req.params.reviewId, "reviewId"),
          p_decision: decision,
          p_idempotency_key: keyFromRequest(req),
        });
        processOutboxSoon();
        res.json({ data, requestId: requestId(req) });
      } catch (error) {
        routeError(res, error, "The review moderation decision could not be saved.");
      }
    },
  );

  app.get("/api/v2/operations", async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.uid) throw new ApiInputError("Authentication is required.", "AUTH_REQUIRED", 401);
      const supabase = getSupabaseAdmin();
      const id = req.user.uid;
      const role = req.user.role;
      const isAdmin = role === "admin";
      const company = role === "company";
      const scoped = (
        table: string,
        companyColumn: string,
        studentColumn: string,
      ) => {
        let query = supabase.from(table).select("*");
        if (!isAdmin) query = query.eq(company ? companyColumn : studentColumn, id);
        return query.order("created_at", { ascending: false }).limit(100);
      };
      let signatureQuery = supabase.from("konexa_contract_signatures").select("*");
      if (!isAdmin) signatureQuery = signatureQuery.eq("signer_id", id);
      let reviewQuery = supabase.from("konexa_reviews").select("*");
      if (!isAdmin) reviewQuery = reviewQuery.or(reviewVisibilityFilter(id));
      let passportQuery = supabase.from("konexa_work_passport_entries").select("*");
      if (!isAdmin) passportQuery = passportQuery.eq("student_id", company ? "00000000-0000-0000-0000-000000000000" : id);

      const [relationships, contracts, signatures, milestones, payments, disputes, reviews, workPassport] = await Promise.all([
        scoped("konexa_relationships", "company_id", "student_id"),
        scoped("konexa_contracts", "company_id", "student_id"),
        signatureQuery.order("created_at", { ascending: false }).limit(100),
        scoped("konexa_milestones", "company_id", "student_id"),
        scoped("konexa_payment_orders", "payer_company_id", "payee_student_id"),
        scoped("konexa_disputes", "company_id", "student_id"),
        reviewQuery.order("created_at", { ascending: false }).limit(100),
        passportQuery.order("created_at", { ascending: false }).limit(100),
      ]);
      const failed = [
        relationships,
        contracts,
        signatures,
        milestones,
        payments,
        disputes,
        reviews,
        workPassport,
      ].find((result) => result.error);
      if (failed?.error) throw failed.error;
      res.json({
        data: {
          relationships: relationships.data || [],
          contracts: contracts.data || [],
          signatures: signatures.data || [],
          milestones: milestones.data || [],
          payments: payments.data || [],
          disputes: disputes.data || [],
          reviews: reviews.data || [],
          workPassport: workPassport.data || [],
        },
      });
    } catch (error) {
      routeError(res, error, "Your project operations could not be loaded.");
    }
  });

  app.post("/api/v2/admin/outbox/process", async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Administrator access is required." } });
      return;
    }
    try {
      res.json({ data: await processNotificationOutboxBatch(50) });
    } catch (error) {
      routeError(res, error, "The notification worker could not complete its batch.");
    }
  });
}
