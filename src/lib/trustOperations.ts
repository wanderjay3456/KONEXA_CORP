import { addDoc, collection, doc, getDocs, query, setDoc, where } from "./supabaseStore";
import { auth, db } from "./supabaseAuth";
import { COMPLIANCE_VERSION, feePolicy } from "../config/compliancePolicy";

export interface TrustRecord {
  id: string;
  [key: string]: unknown;
}

export interface TrustSnapshot {
  consents: TrustRecord[];
  introductions: TrustRecord[];
  contracts: TrustRecord[];
  signatures: TrustRecord[];
  milestones: TrustRecord[];
  payments: TrustRecord[];
  contactUnlocks: TrustRecord[];
  hiringOffers: TrustRecord[];
  disputes: TrustRecord[];
  riskEvents: TrustRecord[];
  reviews: TrustRecord[];
  workPassport: TrustRecord[];
}

export interface ProtectedContact {
  email?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

function requireUser() {
  const user = auth.currentUser;
  if (!user?.uid || user.isAnonymous) throw new Error("로그인이 필요한 기능입니다.");
  return user;
}

async function list(collectionName: string) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as TrustRecord[];
}

export async function loadTrustSnapshot(): Promise<TrustSnapshot> {
  requireUser();
  const [consents, introductions, contracts, signatures, milestones, payments, contactUnlocks, hiringOffers, disputes, riskEvents, reviews, workPassport] = await Promise.all([
    list("consents"), list("introductions"), list("contracts"), list("contract_signatures"), list("milestones"),
    list("payment_records"), list("contact_unlocks"), list("hiring_offers"), list("disputes"), list("risk_events"),
    list("reviews"), list("work_passport_entries"),
  ]);
  return { consents, introductions, contracts, signatures, milestones, payments, contactUnlocks, hiringOffers, disputes, riskEvents, reviews, workPassport };
}

export async function recordConsent(stage: "introduction" | "project_contract" | "message_analysis" | "cross_border_privacy") {
  const user = requireUser();
  const existing = await getDocs(query(collection(db, "consents"), where("userId", "==", user.uid), where("stage", "==", stage)));
  if (!existing.empty) return existing.docs[0].id;
  const receipt = await addDoc(collection(db, "consents"), {
    userId: user.uid,
    role: "unknown",
    stage,
    terms: true,
    nonCircumvention: true,
    messageAnalysis: stage === "message_analysis",
    crossBorderPrivacy: stage === "cross_border_privacy",
    documentVersion: COMPLIANCE_VERSION,
    acceptedAt: Date.now(),
  });
  return receipt.id;
}

export async function requestIntroduction(input: { talentId: string; projectId?: string; purpose: "interview" | "project" | "hire"; existingRelationship?: boolean }) {
  const user = requireUser();
  await recordConsent("introduction");
  const relationship = await addDoc(collection(db, "introductions"), {
    userId: user.uid,
    companyId: user.uid,
    talentId: input.talentId,
    projectId: input.projectId || null,
    purpose: input.purpose,
    status: "requested",
    existingRelationshipClaimed: Boolean(input.existingRelationship),
    introducedAt: Date.now(),
    conversionWindowEndsAt: Date.now() + feePolicy.conversionWindowMonths * 30 * 24 * 60 * 60 * 1000,
    contactStatus: "locked",
  });
  return relationship.id;
}

export async function createHiringOffer(input: {
  relationshipId: string;
  talentId: string;
  jobTitle: string;
  annualSalaryKrw: number;
  location: string;
  employmentType: string;
  projectManagementFeesKrw: number;
}) {
  const user = requireUser();
  const credit = Math.min(Math.round(input.projectManagementFeesKrw * feePolicy.projectFeeCreditRate), feePolicy.projectFeeCreditCapKrw);
  const quotedFee = Math.max(0, Math.round(input.annualSalaryKrw * feePolicy.directHireRate) - credit);
  const offer = await addDoc(collection(db, "hiring_offers"), {
    userId: user.uid,
    companyId: user.uid,
    talentId: input.talentId,
    relationshipId: input.relationshipId,
    jobTitle: input.jobTitle,
    annualSalaryKrw: input.annualSalaryKrw,
    location: input.location,
    employmentType: input.employmentType,
    visaAssessment: "precheck_required",
    visaDisclaimer: "E-7 발급을 보장하지 않으며 행정사·출입국 전문가의 최종 검토가 필요합니다.",
    baseFeeRate: feePolicy.directHireRate,
    projectCreditKrw: credit,
    quotedFeeKrw: quotedFee,
    status: "draft",
    createdAt: Date.now(),
  });
  return { id: offer.id, quotedFee, credit };
}

export async function createProjectContract(input: {
  relationshipId: string;
  talentId: string;
  projectId?: string;
  title: string;
  includedDeliverables: string;
  excludedWork: string;
  weeklyHours: number;
  revisions: number;
  clientMaterialsDue: string;
  reviewDays: number;
  changeRequestRateKrw: number;
  monthlyAmountKrw: number;
}) {
  const user = requireUser();
  await recordConsent("project_contract");
  const contract = await addDoc(collection(db, "contracts"), {
    userId: user.uid,
    companyId: user.uid,
    talentId: input.talentId,
    relationshipId: input.relationshipId,
    projectId: input.projectId || null,
    contractType: "company_project",
    documentVersion: COMPLIANCE_VERSION,
    title: input.title,
    scope: {
      includedDeliverables: input.includedDeliverables,
      excludedWork: input.excludedWork,
      weeklyHours: input.weeklyHours,
      revisions: input.revisions,
      clientMaterialsDue: input.clientMaterialsDue,
      reviewDays: input.reviewDays,
      changeRequestRateKrw: input.changeRequestRateKrw,
      clientDelayExtendsSchedule: true,
    },
    payment: { monthlyAmountKrw: input.monthlyAmountKrw, advancePaymentRequired: true, providerType: "domestic_pg_escrow" },
    protections: { nda: true, ipTransfersAfterFullPayment: true, aiAndLicenseDisclosure: true, offPlatformDuringProjectProhibited: true },
    status: "issued",
    createdAt: Date.now(),
  });
  return contract.id;
}

export async function createMilestone(input: { relationshipId: string; contractId: string; talentId: string; title: string; deliverable: string; dueAt: number; amountKrw: number }) {
  const user = requireUser();
  const milestone = await addDoc(collection(db, "milestones"), {
    userId: user.uid,
    companyId: user.uid,
    talentId: input.talentId,
    relationshipId: input.relationshipId,
    contractId: input.contractId,
    title: input.title,
    deliverable: input.deliverable,
    dueAt: input.dueAt,
    amountKrw: input.amountKrw,
    status: "scheduled",
    createdAt: Date.now(),
  });
  return milestone.id;
}

export async function reportDispute(input: { relationshipId: string; companyId: string; talentId: string; category: string; summary: string }) {
  const user = requireUser();
  const dispute = await addDoc(collection(db, "disputes"), {
    userId: user.uid,
    createdBy: user.uid,
    companyId: input.companyId,
    talentId: input.talentId,
    relationshipId: input.relationshipId,
    category: input.category,
    summary: input.summary,
    status: "open",
    createdAt: Date.now(),
  });
  return dispute.id;
}

export async function recordRiskEvent(input: { matchId?: string; relationshipId?: string; code: string; matchedTypes?: string[] }) {
  const user = requireUser();
  await addDoc(collection(db, "risk_events"), {
    userId: user.uid,
    actorId: user.uid,
    matchId: input.matchId || null,
    relationshipId: input.relationshipId || null,
    code: input.code,
    matchedTypes: input.matchedTypes || [],
    severity: "medium",
    status: "open",
    createdAt: Date.now(),
    privacyNote: "메시지 원문은 위험기록에 복사하지 않습니다.",
  });
}

export async function submitTransactionReview(input: {
  relationshipId: string;
  contractId?: string;
  revieweeId: string;
  reviewerRole: "company" | "student";
  overallRating: number;
  qualityRating: number;
  communicationRating: number;
  reliabilityRating: number;
  scopeClarityRating: number;
  comment: string;
}) {
  const user = requireUser();
  const ratings = [input.overallRating, input.qualityRating, input.communicationRating, input.reliabilityRating, input.scopeClarityRating];
  if (ratings.some((rating) => !Number.isInteger(rating) || rating < 1 || rating > 5)) throw new Error("평점은 1점부터 5점까지 입력해 주세요.");
  const comment = input.comment.trim();
  if (comment.length < 20 || comment.length > 1000) throw new Error("리뷰는 20자 이상 1,000자 이하로 작성해 주세요.");
  const existing = await getDocs(query(collection(db, "reviews"), where("relationshipId", "==", input.relationshipId), where("reviewerId", "==", user.uid)));
  if (!existing.empty) throw new Error("이 거래에 대한 리뷰를 이미 제출했습니다.");
  const review = await addDoc(collection(db, "reviews"), {
    userId: user.uid,
    reviewerId: user.uid,
    revieweeId: input.revieweeId,
    relationshipId: input.relationshipId,
    contractId: input.contractId || null,
    reviewerRole: input.reviewerRole,
    overallRating: input.overallRating,
    qualityRating: input.qualityRating,
    communicationRating: input.communicationRating,
    reliabilityRating: input.reliabilityRating,
    scopeClarityRating: input.scopeClarityRating,
    comment,
    status: "sealed",
    moderationStatus: "pending",
    appealStatus: "none",
    createdAt: Date.now(),
  });
  return review.id;
}

export async function isContactUnlocked(companyId: string, talentId: string) {
  const snapshot = await getDocs(query(collection(db, "contact_unlocks"), where("companyId", "==", companyId), where("talentId", "==", talentId)));
  return !snapshot.empty && snapshot.docs.some((item) => item.data().status === "unlocked");
}

export async function isRelationshipContactUnlocked(relationshipId: string) {
  if (!relationshipId) return false;
  const snapshot = await getDocs(query(collection(db, "contact_unlocks"), where("relationshipId", "==", relationshipId)));
  return snapshot.docs.some((item) => item.data().status === "unlocked");
}

export async function loadProtectedContact(talentId: string): Promise<ProtectedContact | null> {
  requireUser();
  const snapshot = await getDocs(query(collection(db, "protected_contacts"), where("talentId", "==", talentId)));
  const record = snapshot.docs[0];
  if (!record) return null;
  const data = record.data();
  return {
    email: typeof data.email === "string" ? data.email : undefined,
    phone: typeof data.phone === "string" ? data.phone : undefined,
    github: typeof data.github === "string" ? data.github : undefined,
    linkedin: typeof data.linkedin === "string" ? data.linkedin : undefined,
    portfolio: typeof data.portfolio === "string" ? data.portfolio : undefined,
  };
}
