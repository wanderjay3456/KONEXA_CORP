export class ApiInputError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, code = "INVALID_INPUT", statusCode = 400) {
    super(message);
    this.name = "ApiInputError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function uuid(value: unknown, field: string) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!UUID_PATTERN.test(normalized)) {
    throw new ApiInputError(`${field} must be a valid UUID.`, "INVALID_UUID");
  }
  return normalized;
}

export function optionalUuid(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") return null;
  return uuid(value, field);
}

export function text(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new ApiInputError(
      `${field} must contain between ${minimum} and ${maximum} characters.`,
      "INVALID_TEXT",
    );
  }
  return normalized;
}

export function optionalText(value: unknown, field: string, maximum: number) {
  if (value === null || value === undefined || value === "") return null;
  return text(value, field, 1, maximum);
}

export function stringList(
  value: unknown,
  field: string,
  minimumItems: number,
  maximumItems: number,
  maximumLength = 100,
) {
  if (!Array.isArray(value)) {
    throw new ApiInputError(`${field} must be an array.`, "INVALID_LIST");
  }
  const normalized = [...new Set(value.map((item) => (
    typeof item === "string" ? item.trim() : ""
  )).filter(Boolean))];
  if (normalized.length < minimumItems || normalized.length > maximumItems) {
    throw new ApiInputError(
      `${field} must contain between ${minimumItems} and ${maximumItems} unique values.`,
      "INVALID_LIST",
    );
  }
  if (normalized.some((item) => item.length > maximumLength)) {
    throw new ApiInputError(`${field} contains a value that is too long.`, "INVALID_LIST");
  }
  return normalized;
}

export function integer(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new ApiInputError(
      `${field} must be a whole number between ${minimum} and ${maximum}.`,
      "INVALID_NUMBER",
    );
  }
  return parsed;
}

export function optionalInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
) {
  if (value === null || value === undefined || value === "") return null;
  return integer(value, field, minimum, maximum);
}

export function decimal(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) {
    throw new ApiInputError(
      `${field} must be between ${minimum} and ${maximum}.`,
      "INVALID_NUMBER",
    );
  }
  return Math.round(parsed * 100) / 100;
}

export function optionalDecimal(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
) {
  if (value === null || value === undefined || value === "") return null;
  return decimal(value, field, minimum, maximum);
}

export function booleanValue(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new ApiInputError(`${field} must be true or false.`, "INVALID_BOOLEAN");
  }
  return value;
}

export function enumValue<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
) {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ApiInputError(
      `${field} must be one of: ${allowed.join(", ")}.`,
      "INVALID_ENUM",
    );
  }
  return value as T;
}

export function isoDate(value: unknown, field: string, required = false) {
  if (value === null || value === undefined || value === "") {
    if (required) throw new ApiInputError(`${field} is required.`, "INVALID_DATE");
    return null;
  }
  if (typeof value !== "string") {
    throw new ApiInputError(`${field} must be an ISO date.`, "INVALID_DATE");
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new ApiInputError(`${field} must be an ISO date.`, "INVALID_DATE");
  }
  return parsed.toISOString();
}

export function idempotencyKey(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length < 8 || normalized.length > 160 || !/^[A-Za-z0-9._:/-]+$/.test(normalized)) {
    throw new ApiInputError(
      "A valid X-Idempotency-Key header is required.",
      "INVALID_IDEMPOTENCY_KEY",
    );
  }
  return normalized;
}

export function plainObject(value: unknown, field: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiInputError(`${field} must be an object.`, "INVALID_OBJECT");
  }
  return value as Record<string, unknown>;
}

export const APPLICATION_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  submitted: ["reviewed", "shortlisted", "approved", "rejected"],
  reviewed: ["shortlisted", "approved", "rejected"],
  shortlisted: ["approved", "rejected"],
  approved: ["contracted"],
  rejected: [],
  withdrawn: [],
  contracted: [],
};

export const MILESTONE_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  scheduled: ["in_progress", "submitted", "cancelled"],
  in_progress: ["submitted", "cancelled"],
  submitted: ["approved", "rejected", "disputed"],
  rejected: ["submitted", "cancelled"],
  approved: ["payout_ready", "disputed"],
  payout_ready: ["paid", "disputed"],
  paid: [],
  disputed: ["approved", "rejected", "cancelled"],
  cancelled: [],
};

export function canTransition(
  transitions: Readonly<Record<string, readonly string[]>>,
  from: string,
  to: string,
) {
  return Boolean(transitions[from]?.includes(to));
}

export function parseProjectPayload(input: unknown) {
  const value = plainObject(input, "project");
  const contactPolicyAccepted = booleanValue(value.contactPolicyAccepted, "contactPolicyAccepted");
  if (!contactPolicyAccepted) {
    throw new ApiInputError(
      "The project contact and non-circumvention policy must be accepted.",
      "CONTACT_POLICY_REQUIRED",
      409,
    );
  }

  return {
    title: text(value.title, "title", 5, 180),
    description: text(value.description, "description", 20, 10_000),
    requirements: stringList(value.requirements, "requirements", 1, 30),
    difficulty: enumValue(value.difficulty, "difficulty", ["Easy", "Medium", "Hard"] as const),
    reward: optionalText(value.reward, "reward", 200) || "",
    tags: Array.isArray(value.tags) ? stringList(value.tags, "tags", 0, 30) : [],
    workType: value.workType
      ? enumValue(value.workType, "workType", ["Remote", "Hybrid", "Onsite"] as const)
      : null,
    durationWeeks: optionalInteger(value.durationWeeks, "durationWeeks", 1, 52),
    hoursPerWeek: optionalDecimal(value.hoursPerWeek, "hoursPerWeek", 1, 80),
    weeklyPayKrw: optionalInteger(value.weeklyPayKrw, "weeklyPayKrw", 1_000, 100_000_000),
    requiredLanguage: optionalText(value.requiredLanguage, "requiredLanguage", 100),
    applicationDeadline: isoDate(value.applicationDeadline, "applicationDeadline"),
    hiringOpportunity: typeof value.hiringOpportunity === "boolean" ? value.hiringOpportunity : false,
    contactPolicyAccepted,
    contactPolicyVersion: optionalText(value.contactPolicyVersion, "contactPolicyVersion", 100) || "signup-v1",
  };
}

export function parseApplicationPayload(input: unknown) {
  const value = plainObject(input, "application");
  return {
    submission: typeof value.submission === "string"
      ? text(value.submission, "submission", 0, 50_000)
      : "",
  };
}

export function parseApplicationReview(input: unknown) {
  const value = plainObject(input, "review");
  return {
    status: enumValue(
      value.status,
      "status",
      ["reviewed", "shortlisted", "approved", "rejected"] as const,
    ),
    feedback: typeof value.feedback === "string"
      ? text(value.feedback, "feedback", 0, 10_000)
      : "",
    score: integer(value.score, "score", 0, 100),
  };
}

export function parseRelationshipPayload(input: unknown) {
  const value = plainObject(input, "relationship");
  return {
    studentId: uuid(value.studentId, "studentId"),
    projectId: optionalUuid(value.projectId, "projectId"),
    purpose: enumValue(value.purpose, "purpose", ["interview", "project", "hire"] as const),
    existingRelationship: value.existingRelationship === true,
  };
}

export function parseContractPayload(input: unknown) {
  const value = plainObject(input, "contract");
  const scope = plainObject(value.scope, "scope");
  return {
    relationshipId: uuid(value.relationshipId, "relationshipId"),
    title: text(value.title, "title", 3, 200),
    contractType: value.contractType
      ? enumValue(value.contractType, "contractType", ["company_project", "hiring_conversion"] as const)
      : "company_project",
    documentVersion: optionalText(value.documentVersion, "documentVersion", 100) || "konexa-contract-v1",
    scope: {
      includedDeliverables: text(scope.includedDeliverables, "scope.includedDeliverables", 10, 10_000),
      excludedWork: typeof scope.excludedWork === "string"
        ? text(scope.excludedWork, "scope.excludedWork", 0, 10_000)
        : "",
      weeklyHours: decimal(scope.weeklyHours, "scope.weeklyHours", 1, 80),
      revisions: integer(scope.revisions, "scope.revisions", 0, 20),
      reviewDays: integer(scope.reviewDays, "scope.reviewDays", 1, 30),
      clientMaterialsDue: optionalText(scope.clientMaterialsDue, "scope.clientMaterialsDue", 300),
      changeRequestRateKrw: optionalInteger(
        scope.changeRequestRateKrw,
        "scope.changeRequestRateKrw",
        0,
        100_000_000,
      ) || 0,
      clientDelayExtendsSchedule: true,
    },
    monthlyAmountKrw: integer(value.monthlyAmountKrw, "monthlyAmountKrw", 10_000, 1_000_000_000),
    paymentProviderType: optionalText(value.paymentProviderType, "paymentProviderType", 100)
      || "domestic_pg_escrow",
  };
}

export function parseMilestonePayload(input: unknown) {
  const value = plainObject(input, "milestone");
  return {
    contractId: uuid(value.contractId, "contractId"),
    title: text(value.title, "title", 3, 200),
    deliverable: text(value.deliverable, "deliverable", 10, 10_000),
    dueAt: isoDate(value.dueAt, "dueAt", true),
    amountKrw: integer(value.amountKrw, "amountKrw", 1_000, 1_000_000_000),
  };
}

export function parseMilestoneSubmission(input: unknown) {
  const value = plainObject(input, "submission");
  const result = {
    notes: typeof value.notes === "string" ? text(value.notes, "notes", 0, 10_000) : "",
    storagePaths: Array.isArray(value.storagePaths)
      ? stringList(value.storagePaths, "storagePaths", 0, 20, 500)
      : [],
  };
  if (result.notes.trim().length < 10 && result.storagePaths.length === 0) {
    throw new ApiInputError('Add a deliverable file or describe the result in at least 10 characters.', 'EVIDENCE_REQUIRED', 400);
  }
  return result;
}

export function parseDisputePayload(input: unknown) {
  const value = plainObject(input, "dispute");
  return {
    relationshipId: uuid(value.relationshipId, "relationshipId"),
    contractId: optionalUuid(value.contractId, "contractId"),
    milestoneId: optionalUuid(value.milestoneId, "milestoneId"),
    category: text(value.category, "category", 2, 100),
    summary: text(value.summary, "summary", 20, 5_000),
  };
}

export function parseReviewPayload(input: unknown) {
  const value = plainObject(input, "review");
  return {
    relationshipId: uuid(value.relationshipId, "relationshipId"),
    contractId: optionalUuid(value.contractId, "contractId"),
    overallRating: integer(value.overallRating, "overallRating", 1, 5),
    qualityRating: integer(value.qualityRating, "qualityRating", 1, 5),
    communicationRating: integer(value.communicationRating, "communicationRating", 1, 5),
    reliabilityRating: integer(value.reliabilityRating, "reliabilityRating", 1, 5),
    scopeClarityRating: integer(value.scopeClarityRating, "scopeClarityRating", 1, 5),
    comment: text(value.comment, "comment", 20, 1_000),
  };
}
