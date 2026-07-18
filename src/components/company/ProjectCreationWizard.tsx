import { useState, type FormEvent } from "react";
import { BriefcaseBusiness, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ProjectDifficulty } from "../../types";
import { useToast } from "../ui/Toast";

interface ProjectCreationWizardProps {
  onNavigate: (tabId: string) => void;
}

const inputClass = "mt-2 h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
const textareaClass = "mt-2 w-full resize-y rounded-xl border border-neutral-200 bg-white p-3 text-sm leading-6 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";

export default function ProjectCreationWizard({ onNavigate }: ProjectCreationWizardProps) {
  const { createProject, companyProfile } = useApp();
  const { error, success } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [skills, setSkills] = useState("");
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>(ProjectDifficulty.MEDIUM);
  const [workType, setWorkType] = useState<"Remote" | "Hybrid" | "Onsite">("Remote");
  const [durationWeeks, setDurationWeeks] = useState("4");
  const [hoursPerWeek, setHoursPerWeek] = useState("10");
  const [weeklyPayKrw, setWeeklyPayKrw] = useState("");
  const [requiredLanguage, setRequiredLanguage] = useState("English");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [hiringOpportunity, setHiringOpportunity] = useState(false);
  const [contactPolicyAccepted, setContactPolicyAccepted] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requirements = deliverables.split("\n").map((item) => item.trim()).filter(Boolean);
    const tags = skills.split(",").map((item) => item.trim()).filter(Boolean);
    const weeklyPay = Number(weeklyPayKrw);
    const duration = Number(durationWeeks);
    const hours = Number(hoursPerWeek);

    if (title.trim().length < 5 || description.trim().length < 30 || requirements.length === 0 || tags.length === 0) {
      error("필수 내용을 확인해 주세요", "제목, 30자 이상의 설명, 결과물, 필요 기술을 모두 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(weeklyPay) || weeklyPay <= 0 || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(hours) || hours <= 0) {
      error("금액과 기간을 확인해 주세요", "주급, 기간, 주당 예상시간은 0보다 큰 숫자로 입력해야 합니다.");
      return;
    }
    if (!contactPolicyAccepted) {
      error("플랫폼 보호정책 동의가 필요합니다", "계약 전 연락처 비공개와 플랫폼 내 계약·결제 원칙을 확인해 주세요.");
      return;
    }

    setSubmitting(true);
    const published = await createProject(
      title.trim(),
      description.trim(),
      requirements,
      difficulty,
      `${weeklyPay.toLocaleString("ko-KR")}원 / 주`,
      tags,
      {
        workType,
        durationWeeks: duration,
        hoursPerWeek: hours,
        weeklyPayKrw: weeklyPay,
        requiredLanguage: requiredLanguage.trim(),
        applicationDeadline: applicationDeadline || undefined,
        hiringOpportunity,
        contactPolicyAccepted,
      },
    );
    setSubmitting(false);

    if (published) {
      success("프로젝트가 공개되었습니다", "학생 프로젝트 페이지에 즉시 반영됩니다.");
      onNavigate("company-projects");
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className="overflow-hidden rounded-3xl bg-neutral-950 p-7 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              <BriefcaseBusiness className="h-4 w-4" /> Live project posting
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight">기업 프로젝트 등록</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">학생이 업무범위와 보상을 오해하지 않도록 필수 조건을 구조화했습니다. 공개 후 학생 페이지에 실시간으로 표시됩니다.</p>
          </div>
          <button type="button" onClick={() => onNavigate("company-projects")} className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10">내 프로젝트 보기</button>
        </div>
      </header>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <div className="border-b border-neutral-100 pb-5">
          <h2 className="text-lg font-black text-neutral-950">1. 프로젝트 기본정보</h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">기업명은 인증 프로필의 {companyProfile?.companyName || "기업명"}으로 자동 표시됩니다.</p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-xs font-bold text-neutral-700 md:col-span-2">프로젝트 제목 *
            <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="수행할 업무를 한 문장으로 입력" required />
          </label>
          <label className="text-xs font-bold text-neutral-700 md:col-span-2">상세 설명 *
            <textarea className={textareaClass} value={description} onChange={(event) => setDescription(event.target.value)} rows={6} maxLength={4000} placeholder="프로젝트 배경, 해결할 문제, 포함·제외 업무, 기업이 제공할 자료를 구체적으로 작성" required />
          </label>
          <label className="text-xs font-bold text-neutral-700">난이도 *
            <select className={inputClass} value={difficulty} onChange={(event) => setDifficulty(event.target.value as ProjectDifficulty)}>
              <option value={ProjectDifficulty.EASY}>Easy</option>
              <option value={ProjectDifficulty.MEDIUM}>Medium</option>
              <option value={ProjectDifficulty.HARD}>Hard</option>
            </select>
          </label>
          <label className="text-xs font-bold text-neutral-700">진행 방식 *
            <select className={inputClass} value={workType} onChange={(event) => setWorkType(event.target.value as typeof workType)}>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <div className="border-b border-neutral-100 pb-5">
          <h2 className="text-lg font-black text-neutral-950">2. 결과물과 지원조건</h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">업무범위를 명확히 할수록 추가업무와 검수 분쟁을 줄일 수 있습니다.</p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-xs font-bold text-neutral-700 md:col-span-2">필수 결과물 *
            <textarea className={textareaClass} value={deliverables} onChange={(event) => setDeliverables(event.target.value)} rows={5} placeholder={"한 줄에 하나씩 입력\n예: 반응형 웹 화면\n예: 소스코드와 배포 문서"} required />
          </label>
          <label className="text-xs font-bold text-neutral-700 md:col-span-2">필요 기술 *
            <input className={inputClass} value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="React, TypeScript, Figma처럼 쉼표로 구분" required />
          </label>
          <label className="text-xs font-bold text-neutral-700">필요 언어
            <input className={inputClass} value={requiredLanguage} onChange={(event) => setRequiredLanguage(event.target.value)} placeholder="English" />
          </label>
          <label className="text-xs font-bold text-neutral-700">지원 마감일
            <input type="date" className={inputClass} value={applicationDeadline} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setApplicationDeadline(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <div className="border-b border-neutral-100 pb-5">
          <h2 className="text-lg font-black text-neutral-950">3. 기간과 주급</h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">주급은 예시 없이 기업이 확정한 실제 금액만 입력합니다.</p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <label className="text-xs font-bold text-neutral-700">기간(주) *
            <input type="number" min="1" max="52" className={inputClass} value={durationWeeks} onChange={(event) => setDurationWeeks(event.target.value)} required />
          </label>
          <label className="text-xs font-bold text-neutral-700">주당 예상시간 *
            <input type="number" min="1" max="60" className={inputClass} value={hoursPerWeek} onChange={(event) => setHoursPerWeek(event.target.value)} required />
          </label>
          <label className="text-xs font-bold text-neutral-700">주급(KRW) *
            <input type="number" min="1" step="1000" className={inputClass} value={weeklyPayKrw} onChange={(event) => setWeeklyPayKrw(event.target.value)} placeholder="금액 입력" required />
          </label>
        </div>
        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={hiringOpportunity} onChange={(event) => setHiringOpportunity(event.target.checked)} />
          <span><b className="block text-neutral-950">프로젝트 종료 후 채용 전환 검토 가능</b><span className="mt-1 block text-xs leading-5 text-neutral-500">채용을 보장한다는 의미가 아니며, 별도 근로조건 협의와 계약이 필요합니다.</span></span>
        </label>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <h2 className="text-sm font-black text-emerald-950">연락처·계약 보호 확인</h2>
            <p className="mt-1 text-xs leading-5 text-emerald-900/75">지원 단계에서는 전화번호와 개인 이메일을 공개하지 않습니다. 매칭 승인 후에도 계약·결제·범위 변경 기록은 KONEXA 안에서 관리해야 합니다.</p>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs font-bold text-emerald-950">
              <input type="checkbox" checked={contactPolicyAccepted} onChange={(event) => setContactPolicyAccepted(event.target.checked)} /> 위 내용을 확인하고 프로젝트 공개에 동의합니다. *
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button type="button" onClick={() => onNavigate("company-projects")} className="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-xs font-bold text-neutral-700">취소</button>
        <button type="submit" disabled={submitting || !contactPolicyAccepted} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
          {submitting ? "공개 중…" : "학생 페이지에 공개"}
          {submitting ? <CheckCircle2 className="h-4 w-4 animate-pulse" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}