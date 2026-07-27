import assert from "node:assert/strict";
import test from "node:test";
import {
  APPLICATION_TRANSITIONS,
  ApiInputError,
  MILESTONE_TRANSITIONS,
  canTransition,
  idempotencyKey,
  parseApplicationReview,
  parseContractPayload,
  parseProjectPayload,
  parseReviewPayload,
} from "../src/server/backendV2Validation";

test("project input is normalized without inventing a public contact", () => {
  const project = parseProjectPayload({
    title: "Vietnam market research sprint",
    description: "Validate customer demand and produce an evidence-based market-entry report.",
    requirements: ["Research", "English", "Research"],
    tags: ["Market entry"],
    difficulty: "Medium",
    workType: "Remote",
    durationWeeks: 4,
    hoursPerWeek: 15,
    weeklyPayKrw: 450_000,
    contactPolicyAccepted: true,
    contactPolicyVersion: "signup-v2",
  });
  assert.deepEqual(project.requirements, ["Research", "English"]);
  assert.equal(project.weeklyPayKrw, 450_000);
  assert.equal("email" in project, false);
});

test("project creation requires the contact and non-circumvention policy", () => {
  assert.throws(
    () => parseProjectPayload({
      title: "Valid project title",
      description: "A sufficiently detailed project description for validation.",
      requirements: ["Research"],
      difficulty: "Medium",
      contactPolicyAccepted: false,
    }),
    (error: unknown) => (
      error instanceof ApiInputError
      && error.code === "CONTACT_POLICY_REQUIRED"
      && error.statusCode === 409
    ),
  );
});

test("idempotency keys reject weak and unsafe values", () => {
  assert.equal(idempotencyKey("project:12345678"), "project:12345678");
  assert.throws(() => idempotencyKey("short"), ApiInputError);
  assert.throws(() => idempotencyKey("project key with spaces"), ApiInputError);
});

test("application and milestone state machines reject terminal transitions", () => {
  assert.equal(canTransition(APPLICATION_TRANSITIONS, "submitted", "shortlisted"), true);
  assert.equal(canTransition(APPLICATION_TRANSITIONS, "rejected", "approved"), false);
  assert.equal(canTransition(MILESTONE_TRANSITIONS, "submitted", "approved"), true);
  assert.equal(canTransition(MILESTONE_TRANSITIONS, "paid", "rejected"), false);
});

test("application review score is bounded", () => {
  assert.deepEqual(
    parseApplicationReview({ status: "shortlisted", feedback: "Strong evidence.", score: 91 }),
    { status: "shortlisted", feedback: "Strong evidence.", score: 91 },
  );
  assert.throws(
    () => parseApplicationReview({ status: "approved", feedback: "", score: 101 }),
    ApiInputError,
  );
});

test("contract scope and transaction review require complete evidence", () => {
  const contract = parseContractPayload({
    relationshipId: "11111111-1111-4111-8111-111111111111",
    title: "Market validation project",
    scope: {
      includedDeliverables: "Interview notes and a final market-entry report.",
      excludedWork: "Paid advertising and legal advice.",
      weeklyHours: 20,
      revisions: 2,
      reviewDays: 5,
      clientMaterialsDue: "Three business days before kickoff",
      changeRequestRateKrw: 100_000,
    },
    monthlyAmountKrw: 2_000_000,
  });
  assert.equal(contract.scope.clientDelayExtendsSchedule, true);
  assert.equal(contract.paymentProviderType, "domestic_pg_escrow");

  const review = parseReviewPayload({
    relationshipId: "11111111-1111-4111-8111-111111111111",
    contractId: "22222222-2222-4222-8222-222222222222",
    overallRating: 5,
    qualityRating: 5,
    communicationRating: 4,
    reliabilityRating: 5,
    scopeClarityRating: 4,
    comment: "The work matched the agreed scope and was delivered with clear communication.",
  });
  assert.equal(review.overallRating, 5);
  assert.equal(review.contractId, "22222222-2222-4222-8222-222222222222");
});
