import React, { useEffect, useMemo, useState } from "react";
import { Award, BriefcaseBusiness, CheckCircle, Clock, FileText, Languages, LockKeyhole, Search, Shield, Sparkles, Video } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { collection, onSnapshot } from "../../lib/supabaseStore";
import { db } from "../../lib/supabaseAuth";
import { isContactUnlocked, loadProtectedContact, requestIntroduction, type ProtectedContact } from "../../lib/trustOperations";
import { maskedTalentName } from "../../lib/offPlatformGuard";
import { useToast } from "../ui/Toast";

interface StudentProfileReviewProps {
  studentId?: string | null;
  onNavigate: (tabId: string) => void;
}

interface TalentCard {
  id: string;
  degree?: string;
  major?: string;
  graduationYear?: string;
  skills: string[];
  languages: string[];
  englishLevel?: string;
  koreanLevel?: string;
  careerInterests: string[];
  preferredIndustry?: string;
  preferredJob?: string;
  availability?: string;
  workPreference?: string;
  timezone?: string;
  trustScore: number;
  completedProjects: number;
  aiCareerReadiness: number;
  aiEmployabilityScore: number;
  portfolioAvailable: boolean;
  resumeAvailable: boolean;
  introVideoAvailable: boolean;
  earlyPioneerEligible: boolean;
  createdAt: number;
}

const numberValue = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const stringList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export default function StudentProfileReview({ studentId, onNavigate }: StudentProfileReviewProps) {
  const { currentUser, companyProfile } = useApp();
  const { success, error, info } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<TalentCard[]>([]);
  const [activeId, setActiveId] = useState(studentId || "");
  const [loading, setLoading] = useState(true);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [protectedContact, setProtectedContact] = useState<ProtectedContact | null>(null);

  useEffect(() => onSnapshot(collection(db, "talent_cards"), (snapshot) => {
    const items: TalentCard[] = [];
    snapshot.forEach((entry) => {
      const data = entry.data();
      items.push({
        id: entry.id,
        degree: typeof data.degree === "string" ? data.degree : undefined,
        major: typeof data.major === "string" ? data.major : undefined,
        graduationYear: typeof data.graduationYear === "string" ? data.graduationYear : undefined,
        skills: stringList(data.skills),
        languages: stringList(data.languages),
        englishLevel: typeof data.englishLevel === "string" ? data.englishLevel : undefined,
        koreanLevel: typeof data.koreanLevel === "string" ? data.koreanLevel : undefined,
        careerInterests: stringList(data.careerInterests),
        preferredIndustry: typeof data.preferredIndustry === "string" ? data.preferredIndustry : undefined,
        preferredJob: typeof data.preferredJob === "string" ? data.preferredJob : undefined,
        availability: typeof data.availability === "string" ? data.availability : undefined,
        workPreference: typeof data.workPreference === "string" ? data.workPreference : undefined,
        timezone: typeof data.timezone === "string" ? data.timezone : undefined,
        trustScore: numberValue(data.trustScore),
        completedProjects: numberValue(data.completedProjects),
        aiCareerReadiness: numberValue(data.aiCareerReadiness),
        aiEmployabilityScore: numberValue(data.aiEmployabilityScore),
        portfolioAvailable: data.portfolioAvailable === true,
        resumeAvailable: data.resumeAvailable === true,
        introVideoAvailable: data.introVideoAvailable === true,
        earlyPioneerEligible: data.earlyPioneerEligible === true,
        createdAt: numberValue(data.createdAt),
      });
    });
    items.sort((left, right) => Number(right.earlyPioneerEligible) - Number(left.earlyPioneerEligible)
      || right.trustScore - left.trustScore
      || right.createdAt - left.createdAt);
    setCandidates(items);
    setActiveId((current) => items.some((item) => item.id === (studentId || current)) ? (studentId || current) : (items[0]?.id || ""));
    setLoading(false);
  }, () => {
    setCandidates([]);
    setLoading(false);
    error("인재 목록을 불러오지 못했습니다", "잠시 후 다시 시도해 주세요.");
  }), [companyProfile?.verified, companyProfile?.verifiedStatus, error, studentId]);

  const filteredCandidates = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter((candidate) => [
      candidate.degree,
      candidate.major,
      candidate.preferredIndustry,
      candidate.preferredJob,
      ...candidate.skills,
      ...candidate.languages,
      ...candidate.careerInterests,
    ].some((value) => value?.toLowerCase().includes(term)));
  }, [candidates, searchQuery]);

  const activeCandidate = candidates.find((candidate) => candidate.id === activeId) || filteredCandidates[0] || candidates[0];

  useEffect(() => {
    let active = true;
    setProtectedContact(null);
    if (!currentUser?.uid || !activeCandidate?.id) {
      setContactUnlocked(false);
      return;
    }
    void isContactUnlocked(currentUser.uid, activeCandidate.id).then(async (unlocked) => {
      if (!active) return;
      setContactUnlocked(unlocked);
      setProtectedContact(unlocked ? await loadProtectedContact(activeCandidate.id) : null);
    }).catch(() => { if (active) setContactUnlocked(false); });
    return () => { active = false; };
  }, [activeCandidate?.id, currentUser?.uid]);

  const handleIntroductionRequest = async () => {
    if (!activeCandidate) return;
    if (!currentUser?.uid || currentUser.email === "guest@konexa.dev") return info("로그인이 필요합니다", "기업 계정으로 로그인한 뒤 소개를 요청해 주세요.");
    if (!companyProfile?.verified || companyProfile.verifiedStatus !== "Verified") return error("사업자 확인 필요", "사업자등록 확인이 완료된 기업만 소개를 요청할 수 있습니다.");
    try {
      await requestIntroduction({ talentId: activeCandidate.id, purpose: "interview" });
      success("소개 요청 접수", "연락처는 계약·양측 서명·국내 PG 대금 확보 후 공개됩니다.");
      onNavigate("trust-operations");
    } catch (cause) {
      error("소개 요청 실패", cause instanceof Error ? cause.message : "다시 시도해 주세요.");
    }
  };

  if (loading) return <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-sm text-neutral-500">검증된 인재 목록을 불러오는 중입니다.</div>;
  if (!companyProfile?.verified || companyProfile.verifiedStatus !== "Verified") return <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center"><Shield className="mx-auto h-8 w-8 text-neutral-300" /><h1 className="mt-4 text-xl font-black text-neutral-900">사업자 확인 후 인재를 열람할 수 있습니다</h1><p className="mt-2 text-sm text-neutral-500">검증된 기업 계정에만 연락처가 제거된 최소 인재 카드가 제공됩니다.</p><button onClick={() => onNavigate("identity")} className="mt-5 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-bold text-white">기업 인증 진행하기</button></div>;
  if (!activeCandidate) return <div className="rounded-3xl border border-neutral-200 bg-white p-10 text-center"><Shield className="mx-auto h-8 w-8 text-neutral-300" /><h1 className="mt-4 text-xl font-black text-neutral-900">현재 공개 가능한 검증 인재가 없습니다</h1><p className="mt-2 text-sm text-neutral-500">필수 프로필을 완료한 실제 학생만 이곳에 표시됩니다.</p></div>;

  const displayName = maskedTalentName(activeCandidate.id);
  const languageLabels = [...activeCandidate.languages, activeCandidate.englishLevel && `English · ${activeCandidate.englishLevel}`, activeCandidate.koreanLevel && `한국어 · ${activeCandidate.koreanLevel}`].filter(Boolean) as string[];

  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Verified talent directory</span><h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">실제 검증 인재</h1><p className="mt-2 text-sm text-neutral-500">연락처와 직접 검색 정보는 계약 전까지 숨기고, 직무 역량과 검증 데이터만 제공합니다.</p></div>
      <div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="기술·전공·언어·희망직무 검색" className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-neutral-500" /></div>
    </header>

    <div className="grid gap-7 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-2 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400"><span>Matching results</span><span>{filteredCandidates.length}</span></div>
        {filteredCandidates.length === 0 ? <p className="rounded-2xl bg-neutral-50 p-5 text-center text-xs text-neutral-500">검색 조건에 맞는 인재가 없습니다.</p> : filteredCandidates.map((candidate) => <button key={candidate.id} onClick={() => setActiveId(candidate.id)} className={`w-full rounded-2xl border p-4 text-left transition ${candidate.id === activeCandidate.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}>
          <div className="flex items-center gap-2"><b className="text-sm">{maskedTalentName(candidate.id)}</b>{candidate.earlyPioneerEligible && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800">Early Pioneer</span>}</div>
          <p className={`mt-1 text-xs ${candidate.id === activeCandidate.id ? "text-neutral-300" : "text-neutral-500"}`}>{candidate.major || candidate.degree || "전공 정보 검증 중"}{candidate.graduationYear ? ` · ${candidate.graduationYear}` : ""}</p>
          <div className="mt-3 flex flex-wrap gap-1">{candidate.skills.slice(0, 4).map((skill) => <span key={skill} className={`rounded-lg px-2 py-1 text-[9px] ${candidate.id === activeCandidate.id ? "bg-white/10" : "bg-neutral-100"}`}>{skill}</span>)}</div>
        </button>)}
      </aside>

      <main className="space-y-7 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <section className="flex flex-col justify-between gap-5 border-b border-neutral-100 pb-7 sm:flex-row">
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-black text-neutral-950">{displayName}</h2><span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700"><CheckCircle className="h-3.5 w-3.5" />필수정보 검증</span>{activeCandidate.earlyPioneerEligible && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800"><Award className="h-3.5 w-3.5" />Early Pioneer</span>}</div><p className="mt-2 text-sm text-neutral-500">{[activeCandidate.degree, activeCandidate.major, activeCandidate.graduationYear && `${activeCandidate.graduationYear} 졸업(예정)`].filter(Boolean).join(" · ") || "학력 정보 검증 중"}</p>
            {contactUnlocked ? <div className="mt-4 text-xs text-emerald-700">승인된 연락처: {protectedContact?.email || "관리자 확인 중"}</div> : <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-800"><LockKeyhole className="h-3.5 w-3.5" />이름·이메일·전화번호·SNS·상세주소 비공개</div>}
          </div>
          <div className="flex shrink-0 flex-col gap-2"><button onClick={handleIntroductionRequest} className="rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-bold text-white">소개·면접 요청하기</button><button onClick={() => onNavigate("trust-operations")} className="rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white">채용 제안하기</button></div>
        </section>

        <section className="grid gap-3 sm:grid-cols-4">{[
          ["Trust score", `${activeCandidate.trustScore}/100`, Shield],
          ["Career readiness", `${activeCandidate.aiCareerReadiness}/100`, Sparkles],
          ["Employability", `${activeCandidate.aiEmployabilityScore}/100`, BriefcaseBusiness],
          ["Completed", `${activeCandidate.completedProjects} projects`, CheckCircle],
        ].map(([label, value, Icon]) => <div key={String(label)} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-neutral-400"><span>{label as string}</span><Icon className="h-4 w-4" /></div><b className="mt-3 block text-lg text-neutral-950">{value as string}</b></div>)}</section>

        <section className="grid gap-6 md:grid-cols-2"><div><h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Skills</h3><div className="mt-3 flex flex-wrap gap-2">{activeCandidate.skills.length ? activeCandidate.skills.map((skill) => <span key={skill} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700">{skill}</span>) : <span className="text-xs text-neutral-400">등록된 기술이 없습니다.</span>}</div></div><div><h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Languages</h3><div className="mt-3 flex flex-wrap gap-2">{languageLabels.length ? languageLabels.map((language) => <span key={language} className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-700"><Languages className="h-3.5 w-3.5" />{language}</span>) : <span className="text-xs text-neutral-400">등록된 언어가 없습니다.</span>}</div></div></section>

        <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-neutral-200 p-4"><FileText className="h-5 w-5 text-neutral-500" /><b className="mt-3 block text-sm">포트폴리오</b><span className="mt-1 block text-xs text-neutral-500">{activeCandidate.portfolioAvailable ? "검증 자료 보유 · 소개 승인 후 공개" : "미등록"}</span></div><div className="rounded-2xl border border-neutral-200 p-4"><Video className="h-5 w-5 text-neutral-500" /><b className="mt-3 block text-sm">1분 소개 영상</b><span className="mt-1 block text-xs text-neutral-500">{activeCandidate.introVideoAvailable ? "업로드 완료 · 매칭 기업에만 공개" : "미등록"}</span></div><div className="rounded-2xl border border-neutral-200 p-4"><Clock className="h-5 w-5 text-neutral-500" /><b className="mt-3 block text-sm">업무 가능 조건</b><span className="mt-1 block text-xs text-neutral-500">{[activeCandidate.availability, activeCandidate.workPreference, activeCandidate.timezone].filter(Boolean).join(" · ") || "협의 필요"}</span></div></section>

        <section><h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Career direction</h3><p className="mt-3 text-sm leading-6 text-neutral-600">{[activeCandidate.preferredJob, activeCandidate.preferredIndustry, ...activeCandidate.careerInterests].filter(Boolean).join(" · ") || "희망 직무 정보를 준비 중입니다."}</p></section>
      </main>
    </div>
  </div>;
}