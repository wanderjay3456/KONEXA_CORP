import { BriefcaseBusiness, CalendarDays, Clock3, Plus, Users2, WalletCards } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "../../context/AppContext";

interface CompanyProjectListProps {
  onNavigate: (tabId: string) => void;
}

export default function CompanyProjectList({ onNavigate }: CompanyProjectListProps) {
  const { currentUser, companyProfile, projects, applications } = useApp();
  const ownedProjects = useMemo(
    () => projects
      .filter((project) => project.companyId === currentUser?.uid)
      .sort((left, right) => right.createdAt - left.createdAt),
    [currentUser?.uid, projects],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="flex flex-col justify-between gap-4 rounded-3xl bg-neutral-950 p-7 text-white md:flex-row md:items-end">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">Live Supabase records</div>
          <h1 className="mt-2 text-3xl font-black">내 프로젝트</h1>
          <p className="mt-2 text-sm text-neutral-300">현재 기업 계정으로 실제 등록된 공고만 표시됩니다.</p>
        </div>
        <button onClick={() => onNavigate("create-challenge")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-neutral-950">
          <Plus className="h-4 w-4" /> 새 프로젝트 등록
        </button>
      </header>

      {companyProfile?.earlyBirdEligible && <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><b>기업 얼리버드 자격이 기록되었습니다.</b><span className="ml-2">정식 과금 시작 후 5개월간 구독료 30% 할인과 프리미엄 인재 열람권 1회 대상입니다.</span></section>}

      {ownedProjects.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <BriefcaseBusiness className="mx-auto h-8 w-8 text-neutral-300" />
          <h2 className="mt-4 text-lg font-black text-neutral-950">등록한 프로젝트가 없습니다</h2>
          <p className="mt-2 text-sm text-neutral-500">프로젝트를 등록하면 학생 페이지에 바로 공개됩니다.</p>
          <button onClick={() => onNavigate("create-challenge")} className="mt-6 rounded-xl bg-neutral-950 px-5 py-3 text-xs font-bold text-white">첫 프로젝트 등록</button>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {ownedProjects.map((project) => {
            const applicantCount = applications.filter((application) => application.projectId === project.id).length;
            return (
              <article key={project.id} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{project.difficulty} · {project.workType || "Remote"}</div>
                    <h2 className="mt-2 text-xl font-black text-neutral-950">{project.title}</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${project.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>{project.status}</span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-500">{project.description}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-neutral-50 p-4 text-xs text-neutral-600 sm:grid-cols-4">
                  <div><Clock3 className="mb-1 h-4 w-4 text-neutral-400" /><b>{project.hoursPerWeek || "-"}시간/주</b></div>
                  <div><CalendarDays className="mb-1 h-4 w-4 text-neutral-400" /><b>{project.durationWeeks || "-"}주</b></div>
                  <div><WalletCards className="mb-1 h-4 w-4 text-neutral-400" /><b>{project.weeklyPayKrw ? `${project.weeklyPayKrw.toLocaleString("ko-KR")}원` : project.reward}</b></div>
                  <div><Users2 className="mb-1 h-4 w-4 text-neutral-400" /><b>{applicantCount}명 지원</b></div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.tags.map((tag) => <span key={tag} className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">{tag}</span>)}
                </div>
                <button onClick={() => onNavigate("company-applications")} className="mt-6 w-full rounded-xl border border-neutral-200 px-4 py-3 text-xs font-bold text-neutral-800 hover:border-neutral-900">지원자 확인</button>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}