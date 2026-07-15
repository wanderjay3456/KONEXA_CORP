import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, BriefcaseBusiness, Check, ChevronRight, CircleDollarSign, FileSignature,
  Fingerprint, Flag, LockKeyhole, RefreshCw, Scale, ShieldCheck, Star, UserRoundSearch,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";
import {
  contactReleaseStages, contractDocuments, feePolicy, legalSources, platformBenefits, privacyNotice, providerPlan, riskRules,
} from "../../config/compliancePolicy";
import {
  createHiringOffer, createMilestone, createProjectContract, loadTrustSnapshot, recordConsent,
  reportDispute, requestIntroduction, submitTransactionReview, type TrustSnapshot,
} from "../../lib/trustOperations";
import { useToast } from "../ui/Toast";
import { payProjectContract } from "../../lib/portonePayments";

const emptySnapshot: TrustSnapshot = {
  consents: [], introductions: [], contracts: [], signatures: [], milestones: [], payments: [],
  contactUnlocks: [], hiringOffers: [], disputes: [], riskEvents: [], reviews: [], workPassport: [],
};

const won = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 });

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "green" | "amber" }) {
  const color = tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-neutral-900";
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</div>
      <div className={`mt-1 text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function StatusPill({ children, good = false }: { children: React.ReactNode; good?: boolean }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${good ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{children}</span>;
}

export default function TrustOperationsCenter() {
  const { activeRole, currentUser, companyProfile, studentProfile } = useApp();
  const { success, error, info } = useToast();
  const [snapshot, setSnapshot] = useState<TrustSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"workflow" | "contracts" | "reviews" | "policy" | "privacy">("workflow");

  const [talentId, setTalentId] = useState("");
  const [purpose, setPurpose] = useState<"interview" | "project" | "hire">("project");
  const [existingRelationship, setExistingRelationship] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [jobTitle, setJobTitle] = useState("주니어 소프트웨어 엔지니어");
  const [salary, setSalary] = useState(48_000_000);
  const [location, setLocation] = useState("서울 / 하이브리드");
  const [managementFees, setManagementFees] = useState(0);
  const [scope, setScope] = useState("합의된 기능 명세에 따른 웹 애플리케이션 구현 및 소스코드 제출");
  const [excludedWork, setExcludedWork] = useState("운영서버 직접 배포, 별도 합의가 없는 콘텐츠 제작 및 추가 기능");
  const [monthlyAmount, setMonthlyAmount] = useState(2_000_000);
  const [disputeSummary, setDisputeSummary] = useState("");
  const [processingPaymentId, setProcessingPaymentId] = useState("");
  const [reviewRatings, setReviewRatings] = useState({ overall: 5, quality: 5, communication: 5, reliability: 5, scope: 5 });
  const [reviewComment, setReviewComment] = useState("");

  const refresh = async () => {
    if (!currentUser || currentUser.email === "guest@konexa.dev") return;
    setLoading(true);
    try {
      setSnapshot(await loadTrustSnapshot());
    } catch (cause) {
      error("운영기록 조회 실패", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, [currentUser?.uid]);

  useEffect(() => {
    if (!selectedRelationship && snapshot.introductions[0]?.id) setSelectedRelationship(snapshot.introductions[0].id);
  }, [snapshot.introductions, selectedRelationship]);

  const selectedIntro = snapshot.introductions.find((item) => item.id === selectedRelationship);
  const unlockedRelationships = new Set(snapshot.contactUnlocks.filter((item) => item.status === "unlocked").map((item) => asText(item.relationshipId)));
  const isVerifiedCompany = Boolean(companyProfile?.verified && companyProfile?.verifiedStatus === "Verified");
  const signupConsent = snapshot.consents.some((item) => item.stage === "signup");
  const introductionConsent = snapshot.consents.some((item) => item.stage === "introduction");
  const privacyConsent = snapshot.consents.some((item) => item.stage === "message_analysis" || item.stage === "cross_border_privacy");
  const quote = useMemo(() => {
    const credit = Math.min(Math.round(managementFees * feePolicy.projectFeeCreditRate), feePolicy.projectFeeCreditCapKrw);
    return { credit, total: Math.max(0, Math.round(salary * feePolicy.directHireRate) - credit) };
  }, [salary, managementFees]);

  const requireSignedIn = () => {
    if (!currentUser || currentUser.email === "guest@konexa.dev") {
      info("로그인이 필요합니다", "실제 동의와 계약 기록은 로그인한 계정에만 저장됩니다.");
      return false;
    }
    return true;
  };

  const handleConsent = async (stage: "introduction" | "message_analysis" | "cross_border_privacy") => {
    if (!requireSignedIn()) return;
    try {
      await recordConsent(stage);
      success("동의 기록 완료", "문서 버전과 동의 시각이 변경 불가능한 기록으로 저장되었습니다.");
      await refresh();
    } catch (cause) {
      error("동의 기록 실패", cause instanceof Error ? cause.message : "다시 시도해 주세요.");
    }
  };

  const handleIntroduction = async () => {
    if (!requireSignedIn()) return;
    if (!isVerifiedCompany) return error("기업 확인 필요", "사업자등록 확인이 완료된 기업만 소개를 요청할 수 있습니다.");
    if (!talentId.trim()) return error("인재 식별번호 필요", "후보 프로필에 표시된 KONEXA 인재 식별번호를 입력해 주세요.");
    try {
      const id = await requestIntroduction({ talentId: talentId.trim(), purpose, existingRelationship });
      setSelectedRelationship(id);
      success("소개 요청 접수", "연락처는 아직 비공개이며, 계약·양측 서명·등록 PG 대금확보 후 자동 공개됩니다.");
      await refresh();
    } catch (cause) {
      error("소개 요청 실패", cause instanceof Error ? cause.message : "다시 시도해 주세요.");
    }
  };

  const handleOffer = async () => {
    if (!selectedIntro) return error("소개 선택 필요", "먼저 소개 요청을 생성하거나 선택해 주세요.");
    try {
      const result = await createHiringOffer({
        relationshipId: selectedIntro.id,
        talentId: asText(selectedIntro.talentId),
        jobTitle,
        annualSalaryKrw: salary,
        location,
        employmentType: "정규직",
        projectManagementFeesKrw: managementFees,
      });
      success("채용 제안 초안 저장", `예상 소개요금 ${won.format(result.quotedFee)}이 기록되었습니다. E-7은 사전 적합성 검토 항목으로만 표시됩니다.`);
      await refresh();
    } catch (cause) {
      error("채용 제안 저장 실패", cause instanceof Error ? cause.message : "다시 시도해 주세요.");
    }
  };

  const handleContract = async () => {
    if (!selectedIntro) return error("소개 선택 필요", "먼저 소개 요청을 생성하거나 선택해 주세요.");
    try {
      const contractId = await createProjectContract({
        relationshipId: selectedIntro.id,
        talentId: asText(selectedIntro.talentId),
        title: `${jobTitle} 프로젝트 참여계약`,
        includedDeliverables: scope,
        excludedWork,
        weeklyHours: 20,
        revisions: 2,
        clientMaterialsDue: "프로젝트 시작 전 영업일 3일",
        reviewDays: 5,
        changeRequestRateKrw: 100_000,
        monthlyAmountKrw: monthlyAmount,
      });
      success("계약 초안 발행", "범위·검수·추가업무·선결제 조건이 운영기록에 저장되었습니다.");
      setActiveSection("contracts");
      await refresh();
      return contractId;
    } catch (cause) {
      error("계약 발행 실패", cause instanceof Error ? cause.message : "다시 시도해 주세요.");
    }
  };

  const handleMilestone = async (contract: Record<string, unknown>) => {
    try {
      await createMilestone({
        relationshipId: asText(contract.relationshipId), contractId: asText(contract.id), talentId: asText(contract.talentId),
        title: "1주차 범위·기술검증", deliverable: "실행 가능한 초기 결과물과 진행 보고", dueAt: Date.now() + 7 * 86400000, amountKrw: Math.round(monthlyAmount / 4),
      });
      success("마일스톤 생성", "주 단위 제출·검수·정산 기준이 저장되었습니다.");
      await refresh();
    } catch (cause) {
      error("마일스톤 생성 실패", cause instanceof Error ? cause.message : "다시 시도해 주세요.");
    }
  };

  const handleDispute = async () => {
    if (!selectedIntro || !disputeSummary.trim()) return error("분쟁 내용 필요", "소개관계와 사실 요약을 입력해 주세요.");
    try {
      await reportDispute({ relationshipId: selectedIntro.id, companyId: asText(selectedIntro.companyId), talentId: asText(selectedIntro.talentId), category: "scope_or_payment", summary: disputeSummary.trim() });
      setDisputeSummary("");
      success("분쟁 접수 완료", "관리자 검토대기 상태로 기록되었습니다.");
      await refresh();
    } catch (cause) {
      error("분쟁 접수 실패", cause instanceof Error ? cause.message : "다시 시도해 주세요.");
    }
  };

  const handleProjectPayment = async (contract: Record<string, unknown>) => {
    const contractId = asText(contract.id);
    if (!contractId || processingPaymentId) return;
    setProcessingPaymentId(contractId);
    try {
      const result = await payProjectContract(contractId);
      if (result.status !== "funds_secured" || !result.amountMatches) throw new Error("PG 결제 검증이 아직 완료되지 않았습니다.");
      success("결제 검증 완료", "PG가 확인한 금액과 계약 금액이 일치합니다.");
      await refresh();
    } catch (cause) {
      error("결제를 완료하지 못했습니다", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setProcessingPaymentId("");
    }
  };

  const handleReview = async () => {
    if (!selectedIntro) return error("거래 선택 필요", "평가할 소개 관계를 선택해 주세요.");
    if (!requireSignedIn()) return;
    const reviewerRole = activeRole === UserRole.COMPANY ? "company" : "student";
    const revieweeId = reviewerRole === "company" ? asText(selectedIntro.talentId) : asText(selectedIntro.companyId);
    if (!revieweeId) return error("상대방 확인 실패", "소개 관계의 상대방 계정을 확인할 수 없습니다.");
    const contract = snapshot.contracts.find((item) => asText(item.relationshipId) === selectedIntro.id);
    try {
      await submitTransactionReview({
        relationshipId: selectedIntro.id,
        contractId: contract?.id,
        revieweeId,
        reviewerRole,
        overallRating: reviewRatings.overall,
        qualityRating: reviewRatings.quality,
        communicationRating: reviewRatings.communication,
        reliabilityRating: reviewRatings.reliability,
        scopeClarityRating: reviewRatings.scope,
        comment: reviewComment,
      });
      setReviewComment("");
      success("리뷰가 봉인되었습니다", "상대방도 리뷰를 제출하면 두 리뷰가 동시에 공개됩니다.");
      await refresh();
    } catch (cause) {
      error("리뷰 제출 실패", cause instanceof Error ? cause.message : "다시 시도해 주세요.");
    }
  };

  const signedIn = Boolean(currentUser && currentUser.email !== "guest@konexa.dev");

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-7">
      <div className="mx-auto max-w-7xl space-y-6 pb-14">
        <div className="rounded-3xl border border-neutral-200 bg-neutral-950 p-6 text-white md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-400"><Scale className="h-4 w-4" /> Trust & Contract Operations</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight">계약·대금·채용전환 운영센터</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-300">연락처 공개는 소개 약정, 양측 서명, 국내 등록 PG/에스크로 대금 확보가 모두 확인된 경우에만 진행됩니다. KONEXA는 고객 자금을 직접 장기 보관하지 않습니다.</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill good={signedIn}>{signedIn ? "실계정 기록 모드" : "로그인 필요"}</StatusPill>
              <button onClick={() => void refresh()} disabled={loading} className="rounded-xl border border-white/20 p-2.5 text-neutral-300 hover:bg-white/10 disabled:opacity-50" aria-label="운영기록 새로고침"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="소개관계" value={snapshot.introductions.length} />
          <Metric label="계약서" value={snapshot.contracts.length} />
          <Metric label="연락처 공개" value={snapshot.contactUnlocks.filter((item) => item.status === "unlocked").length} tone="green" />
          <Metric label="분쟁·위험 검토" value={snapshot.disputes.length + snapshot.riskEvents.length} tone={snapshot.disputes.length + snapshot.riskEvents.length ? "amber" : "neutral"} />
        </div>

        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-2">
          {([
            ["workflow", "소개·채용"], ["contracts", "계약·마일스톤"], ["reviews", "상호 리뷰"], ["policy", "요금·보증·문서"], ["privacy", "개인정보·탐지"],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setActiveSection(id)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold ${activeSection === id ? "bg-neutral-950 text-white" : "text-neutral-500 hover:bg-neutral-50"}`}>{label}</button>
          ))}
        </div>

        {activeSection === "workflow" && (
          <div className="space-y-6">
            <section className="rounded-3xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-2"><LockKeyhole className="h-5 w-5" /><h2 className="text-lg font-black">연락처 단계별 공개</h2></div>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {contactReleaseStages.map((stage, index) => (
                  <div key={stage.label} className="relative rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="text-[10px] font-bold text-neutral-400">0{index + 1}</div><div className="mt-1 font-black">{stage.label}</div>
                    <p className="mt-2 text-xs leading-5 text-neutral-500">{stage.detail}</p><div className="mt-3 text-[10px] font-bold text-neutral-700">{stage.state}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 bg-white p-6">
                <div className="flex items-center gap-2"><Fingerprint className="h-5 w-5" /><h2 className="font-black">필수 동의 기록</h2></div>
                <div className="mt-4 space-y-3 text-xs">
                  {[
                    { label: "회원가입 이용약관", done: signupConsent, action: null },
                    { label: "소개·면접 요청 이탈거래 확인", done: introductionConsent, action: () => handleConsent("introduction") },
                    { label: "메시지 패턴 분석 및 국외이전 고지", done: privacyConsent, action: () => handleConsent("message_analysis") },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4">
                      <span className="font-semibold text-neutral-700">{item.label}</span>
                      {item.done ? <StatusPill good>기록됨</StatusPill> : item.action ? <button onClick={item.action} className="rounded-xl bg-neutral-950 px-3 py-2 font-bold text-white">동의하고 기록</button> : <StatusPill>신규 가입 시 기록</StatusPill>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-6">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><UserRoundSearch className="h-5 w-5" /><h2 className="font-black">소개·면접 요청</h2></div><StatusPill good={isVerifiedCompany}>{isVerifiedCompany ? "사업자 확인" : "확인 대기"}</StatusPill></div>
                {activeRole === UserRole.COMPANY ? (
                  <div className="mt-4 space-y-3">
                    <input value={talentId} onChange={(e) => setTalentId(e.target.value)} placeholder="KONEXA 인재 식별번호" className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs outline-none focus:border-black" />
                    <select value={purpose} onChange={(e) => setPurpose(e.target.value as typeof purpose)} className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs"><option value="project">프로젝트 소개</option><option value="interview">면접 요청</option><option value="hire">직접채용 제안</option></select>
                    <label className="flex items-start gap-2 text-xs leading-5 text-neutral-500"><input type="checkbox" checked={existingRelationship} onChange={(e) => setExistingRelationship(e.target.checked)} className="mt-1" /><span>소개 전에 이미 알고 있던 인재이며 요청 시 증빙을 제출할 수 있습니다.</span></label>
                    <button onClick={handleIntroduction} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-xs font-bold text-white">소개 요청하기 <ChevronRight className="h-4 w-4" /></button>
                  </div>
                ) : <p className="mt-4 text-xs leading-5 text-neutral-500">기업의 소개 요청이 접수되면 여기에서 별도 약정과 계약서를 확인할 수 있습니다.</p>}
              </div>
            </section>

            {activeRole === UserRole.COMPANY && (
              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-neutral-200 bg-white p-6">
                  <div className="flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5" /><h2 className="font-black">이 인재에게 채용 제안하기</h2></div>
                  <div className="mt-4 space-y-3">
                    <select value={selectedRelationship} onChange={(e) => setSelectedRelationship(e.target.value)} className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs"><option value="">소개관계 선택</option>{snapshot.introductions.map((item) => <option key={item.id} value={item.id}>{asText(item.talentId)} · {asText(item.status)}</option>)}</select>
                    <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs" aria-label="직무" />
                    <div className="grid grid-cols-2 gap-3"><input type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} className="h-11 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs" aria-label="연봉" /><input value={location} onChange={(e) => setLocation(e.target.value)} className="h-11 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs" aria-label="근무지" /></div>
                    <input type="number" value={managementFees} onChange={(e) => setManagementFees(Number(e.target.value))} className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs" aria-label="기납부 프로젝트 관리수수료" placeholder="기납부 프로젝트 관리수수료" />
                    <div className="rounded-2xl bg-neutral-50 p-4 text-xs"><div className="flex justify-between"><span className="text-neutral-500">기본 채용수수료(연봉 10%)</span><b>{won.format(Math.round(salary * feePolicy.directHireRate))}</b></div><div className="mt-2 flex justify-between"><span className="text-neutral-500">프로젝트 수수료 차감</span><b>-{won.format(quote.credit)}</b></div><div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-sm"><span className="font-bold">예상 소개요금</span><b>{won.format(quote.total)}</b></div></div>
                    <p className="text-[11px] leading-5 text-amber-700">E-7 직무·전공 사전 적합성만 점검하며 비자 발급을 보장하지 않습니다. 최종 검토는 행정사·출입국 전문가가 수행해야 합니다.</p>
                    <button onClick={handleOffer} className="h-11 w-full rounded-xl bg-neutral-950 text-xs font-bold text-white">채용 제안 초안 저장</button>
                  </div>
                </div>

                <div className="rounded-3xl border border-neutral-200 bg-white p-6">
                  <div className="flex items-center gap-2"><CircleDollarSign className="h-5 w-5" /><h2 className="font-black">국내 PG/에스크로 상태</h2></div>
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900"><b>{providerPlan.paymentOrchestration} 기본안</b><br />PG 후보: {providerPlan.pgEscrowCandidate}<br />프로젝트 대금은 월 100% 선결제하고 등록 PG/에스크로에서 보호합니다. KONEXA 데이터베이스에는 결제참조번호·상태·정산증빙만 저장합니다. 가맹점 계약이 완료되기 전에는 결제 완료로 처리하거나 연락처를 공개하지 않습니다.</div>
                  <div className="mt-4 space-y-2 text-xs">{snapshot.payments.length ? snapshot.payments.map((item) => <div key={item.id} className="flex justify-between rounded-xl border border-neutral-200 p-3"><span>{asText(item.relationshipId)}</span><b>{asText(item.status)}</b></div>) : <p className="text-neutral-400">확인된 결제기록이 없습니다.</p>}</div>
                </div>
              </section>
            )}
          </div>
        )}

        {activeSection === "contracts" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {activeRole === UserRole.COMPANY && (
              <section className="rounded-3xl border border-neutral-200 bg-white p-6">
                <div className="flex items-center gap-2"><FileSignature className="h-5 w-5" /><h2 className="font-black">프로젝트 계약 발행</h2></div>
                <div className="mt-4 space-y-3">
                  <select value={selectedRelationship} onChange={(e) => setSelectedRelationship(e.target.value)} className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs"><option value="">소개관계 선택</option>{snapshot.introductions.map((item) => <option key={item.id} value={item.id}>{asText(item.talentId)}</option>)}</select>
                  <textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={3} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs" aria-label="포함 결과물" />
                  <textarea value={excludedWork} onChange={(e) => setExcludedWork(e.target.value)} rows={3} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs" aria-label="제외 업무" />
                  <input type="number" value={monthlyAmount} onChange={(e) => setMonthlyAmount(Number(e.target.value))} className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs" aria-label="월 프로젝트 금액" />
                  <div className="rounded-xl bg-neutral-50 p-3 text-[11px] leading-5 text-neutral-500">주 20시간 예상 · 수정 2회 · 검수 5일 · 기업 자료 지연 시 일정 자동연장 · 추가업무는 변경요청 승인 후 착수 · 대금 완납 시 지식재산권 이전</div>
                  <button onClick={handleContract} className="h-11 w-full rounded-xl bg-neutral-950 text-xs font-bold text-white">계약 초안 발행</button>
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /><h2 className="font-black">계약·서명·마일스톤</h2></div><span className="text-[10px] text-neutral-400">{snapshot.contracts.length}건</span></div>
              <div className="mt-4 space-y-3">
                {snapshot.contracts.map((contract) => {
                  const mySigned = snapshot.signatures.some((sig) => sig.contractId === contract.id && sig.userId === currentUser?.uid);
                  const relationshipUnlocked = unlockedRelationships.has(asText(contract.relationshipId));
                  return (
                    <div key={contract.id} className="rounded-2xl border border-neutral-200 p-4">
                      <div className="flex items-start justify-between gap-3"><div><b className="text-sm">{asText(contract.title) || "프로젝트 계약"}</b><p className="mt-1 text-[11px] text-neutral-400">{contract.id}</p></div><StatusPill good={relationshipUnlocked}>{relationshipUnlocked ? "연락처 공개" : "연락처 잠금"}</StatusPill></div>
                      <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled className="rounded-xl bg-neutral-200 px-3 py-2 text-[11px] font-bold text-neutral-500">{mySigned ? "모두싸인 검증 완료" : "모두싸인 가맹 승인 후 서명 가능"}</button>{activeRole === UserRole.COMPANY && <button onClick={() => handleMilestone(contract)} className="rounded-xl border border-neutral-200 px-3 py-2 text-[11px] font-bold">1주차 마일스톤 생성</button>}{activeRole === UserRole.COMPANY && <button onClick={() => void handleProjectPayment(contract)} disabled={Boolean(processingPaymentId)} className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">{processingPaymentId === contract.id ? "결제창 준비 중…" : "PG로 결제하기"}</button>}</div>
                    </div>
                  );
                })}
                {!snapshot.contracts.length && <p className="rounded-2xl bg-neutral-50 p-5 text-xs text-neutral-400">현재 확인할 계약서가 없습니다.</p>}
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6 lg:col-span-2">
              <div className="flex items-center gap-2"><Flag className="h-5 w-5" /><h2 className="font-black">분쟁 접수</h2></div>
              <div className="mt-4 flex flex-col gap-3 md:flex-row"><select value={selectedRelationship} onChange={(e) => setSelectedRelationship(e.target.value)} className="h-11 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs md:w-64"><option value="">소개관계 선택</option>{snapshot.introductions.map((item) => <option key={item.id} value={item.id}>{asText(item.talentId)}</option>)}</select><input value={disputeSummary} onChange={(e) => setDisputeSummary(e.target.value)} placeholder="범위·대금·품질·연락두절 등 사실관계 요약" className="h-11 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs" /><button onClick={handleDispute} className="h-11 rounded-xl bg-neutral-950 px-5 text-xs font-bold text-white">관리자 검토 요청</button></div>
            </section>
          </div>
        )}

        {activeSection === "reviews" && (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <section className="rounded-3xl border border-neutral-200 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div><div className="flex items-center gap-2"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /><h2 className="font-black">검증 거래 상호 리뷰</h2></div><p className="mt-2 text-xs leading-5 text-neutral-500">등록 PG에서 대금 확보가 확인된 거래만 평가할 수 있습니다. 먼저 제출한 평가는 상대방에게 보이지 않으며 양측 제출 후 동시에 공개됩니다.</p></div>
                <StatusPill good>거래 기반</StatusPill>
              </div>
              <div className="mt-6 space-y-4">
                <label className="block text-[11px] font-bold text-neutral-600">평가할 거래
                  <select value={selectedRelationship} onChange={(event) => setSelectedRelationship(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs">
                    <option value="">소개 관계 선택</option>
                    {snapshot.introductions.map((item) => <option key={item.id} value={item.id}>{asText(item.projectId) || asText(item.talentId) || item.id} · {asText(item.status)}</option>)}
                  </select>
                </label>
                {([
                  ["overall", "종합 만족도"], ["quality", "결과물 품질"], ["communication", "커뮤니케이션"], ["reliability", "일정·약속 준수"], ["scope", "업무 범위 명확성"],
                ] as const).map(([key, label]) => <div key={key} className="flex flex-col justify-between gap-2 rounded-2xl bg-neutral-50 p-4 sm:flex-row sm:items-center"><span className="text-xs font-bold text-neutral-700">{label}</span><div className="flex gap-1" role="radiogroup" aria-label={label}>{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" role="radio" aria-checked={reviewRatings[key] === rating} onClick={() => setReviewRatings((current) => ({ ...current, [key]: rating }))} className="rounded-lg p-1.5 transition hover:bg-white" aria-label={`${rating}점`}><Star className={`h-5 w-5 ${rating <= reviewRatings[key] ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} /></button>)}</div></div>)}
                <label className="block text-[11px] font-bold text-neutral-600">구체적인 협업 경험
                  <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength={1000} rows={5} placeholder="업무 범위, 소통, 결과물에 대한 사실 중심의 경험을 20자 이상 작성해 주세요." className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-xs leading-6 outline-none focus:border-neutral-900" />
                </label>
                <div className="flex items-center justify-between text-[10px] text-neutral-400"><span>차별·외모·국적 관련 표현과 보복성 평가는 제한됩니다.</span><span>{reviewComment.length}/1,000</span></div>
                <button onClick={() => void handleReview()} disabled={reviewComment.trim().length < 20} className="h-12 w-full rounded-xl bg-neutral-950 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-35">리뷰 봉인 제출</button>
              </div>
            </section>

            <section className="rounded-3xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center justify-between"><h2 className="font-black">내 리뷰 기록</h2><span className="text-[10px] font-bold text-neutral-400">{snapshot.reviews.length}건</span></div>
              <div className="mt-5 space-y-3">
                {snapshot.reviews.map((review) => {
                  const published = review.status === "published";
                  return <div key={review.id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((rating) => <Star key={rating} className={`h-3.5 w-3.5 ${rating <= Number(review.overallRating || 0) ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`} />)}</div><StatusPill good={published}>{published ? "양측 공개" : "상대방 제출 대기"}</StatusPill></div>
                    <p className="mt-3 text-xs leading-6 text-neutral-600">{asText(review.comment)}</p>
                    <div className="mt-3 text-[10px] text-neutral-400">{asText(review.relationshipId)} · {asText(review.reviewerRole)}</div>
                  </div>;
                })}
                {!snapshot.reviews.length && <div className="rounded-2xl bg-neutral-50 p-6 text-center"><LockKeyhole className="mx-auto h-6 w-6 text-neutral-300" /><p className="mt-3 text-xs text-neutral-400">아직 제출한 리뷰가 없습니다.</p></div>}
              </div>
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-[11px] leading-5 text-blue-800"><b>공정성 원칙</b><br />종료 전에는 상대 평가를 공개하지 않고, 사실과 의견을 구분해 검토합니다. 공개 후에도 관리자 이의신청과 차별 표현 신고가 가능합니다.</div>
            </section>
          </div>
        )}

        {activeSection === "policy" && (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2">{contractDocuments.map((doc) => <div key={doc.title} className="rounded-3xl border border-neutral-200 bg-white p-5"><FileSignature className="h-5 w-5" /><h3 className="mt-3 font-black">{doc.title}</h3><p className="mt-2 text-xs leading-5 text-neutral-500">{doc.purpose}</p><ol className="mt-4 space-y-2">{doc.clauses.map((clause, index) => <li key={clause} className="flex gap-2 text-[11px] leading-5 text-neutral-600"><span className="font-mono font-black text-neutral-400">{index + 1}.</span><span>{clause}</span></li>)}</ol></div>)}</section>
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="font-black">전환수수료 운영기준</h2><div className="mt-4 space-y-3 text-xs leading-5 text-neutral-600"><p><b>프로젝트 진행 중</b> 플랫폼 외 거래 금지</p><p><b>종료 후 {feePolicy.conversionWindowMonths}개월</b> 정상 전환수수료 적용</p><p><b>직접채용</b> 연봉의 10%</p><p><b>프리랜서·용역</b> 6개월 계약금액의 15~20% 이내에서 실제 정상 수수료 기준</p><p><b>예외</b> 소개 전 기존 인연 증빙 및 독립 공개채용은 사실관계 검토</p><p className="rounded-xl bg-amber-50 p-3 text-amber-800">고정 벌금이나 학생 대상 거액 위약금 대신 기업이 원래 지급했어야 할 합리적 서비스 수수료를 정산하는 구조입니다. 최종 약관은 한국 변호사 검토가 필요합니다.</p></div></div>
              <div className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="font-black">플랫폼 안에서 제공되는 보호</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{platformBenefits.map((benefit) => <div key={benefit} className="flex gap-2 rounded-xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{benefit}</div>)}</div></div>
            </section>
            <section className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="font-black">법적 근거와 검토 상태</h2><p className="mt-2 text-xs leading-5 text-neutral-500">사이트는 과도한 위약금, 비자 보장, 자체 에스크로 보관을 피하도록 설계되었습니다. 아래 자료는 운영 기준의 근거이며 계약서 확정 전 직업안정법상 등록·요금 기준과 개인정보 국외이전 구조를 변호사·노무사·행정사와 검토해야 합니다.</p><div className="mt-4 flex flex-wrap gap-2">{legalSources.map((source) => <a key={source.label} href={source.href} target="_blank" rel="noreferrer" className="rounded-full border border-neutral-200 px-3 py-2 text-[11px] font-bold hover:bg-neutral-50">{source.label}</a>)}</div></section>
          </div>
        )}

        {activeSection === "privacy" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-neutral-200 bg-white p-6"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><h2 className="font-black">메시지 분석 고지</h2></div><p className="mt-4 text-xs leading-6 text-neutral-600">{privacyNotice}</p><button onClick={() => handleConsent("message_analysis")} className="mt-4 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-bold text-white">분석 고지 확인 기록</button></section>
            <section className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="font-black">탐지 규칙과 관리자 조치</h2><div className="mt-4 space-y-2">{riskRules.map((rule) => <div key={rule.code} className="rounded-2xl border border-neutral-200 p-4"><div className="flex justify-between gap-3"><b className="text-xs">{rule.label}</b><code className="text-[10px] text-neutral-400">{rule.code}</code></div><p className="mt-2 text-[11px] leading-5 text-neutral-500">{rule.action}</p></div>)}</div></section>
            {activeRole === UserRole.ADMIN && <section className="rounded-3xl border border-neutral-200 bg-white p-6 lg:col-span-2"><h2 className="font-black">관리자 위험·분쟁 큐</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{[...snapshot.riskEvents, ...snapshot.disputes].map((item) => <div key={item.id} className="rounded-2xl border border-neutral-200 p-4 text-xs"><div className="flex justify-between"><b>{asText(item.code) || asText(item.category) || "검토 항목"}</b><StatusPill>{asText(item.status) || "open"}</StatusPill></div><p className="mt-2 text-neutral-500">{asText(item.summary) || asText(item.privacyNote) || "관련 기록 ID를 확인해 수동 검토하세요."}</p></div>)}{!snapshot.riskEvents.length && !snapshot.disputes.length && <p className="text-xs text-neutral-400">대기 중인 위험·분쟁 기록이 없습니다.</p>}</div></section>}
          </div>
        )}
      </div>
    </div>
  );
}
