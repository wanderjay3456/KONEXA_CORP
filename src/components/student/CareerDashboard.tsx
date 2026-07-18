import React from "react";
import { ArrowRight, Bell, Briefcase, FileText, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useApp } from "../../context/AppContext";

interface CareerDashboardProps {
  onNavigate: (tabId: string) => void;
}

export default function CareerDashboard({ onNavigate }: CareerDashboardProps) {
  const { studentProfile, projects, applications, notifications } = useApp();
  const reviewed = applications.filter((application) => application.status === "reviewed");
  const active = applications.filter((application) => !["rejected", "reviewed"].includes(application.status));
  const averageScore = reviewed.length
    ? Math.round(reviewed.reduce((total, application) => total + (Number(application.score) || 0), 0) / reviewed.length)
    : null;
  const openProjects = projects.filter((project) => project.status === "open");
  const scores = [
    { label: "신뢰 점수", value: studentProfile?.trustScore ?? 0, helper: "검증된 활동에서 반영", icon: ShieldCheck },
    { label: "AI 경력 준비도", value: studentProfile?.aiCareerReadiness ?? 0, helper: studentProfile?.aiAnalysisStatus === "completed" ? "프로필 분석 완료" : "분석 대기", icon: Sparkles },
    { label: "AI 취업 준비도", value: studentProfile?.aiEmployabilityScore ?? 0, helper: studentProfile?.aiAnalysisStatus === "completed" ? "프로필 근거 기준" : "분석 대기", icon: Target },
    { label: "프로젝트 평가", value: averageScore, helper: reviewed.length ? `검토 완료 ${reviewed.length}건 평균` : "검토 완료 기록 없음", icon: Briefcase },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">KONEXA Talent</span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">안녕하세요, {studentProfile?.preferredName || studentProfile?.name || "글로벌 인재"}님</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">등록한 프로필, 실제 지원서와 검토 결과만 보여드립니다. 새로운 공고를 확인하거나 AI 도구로 다음 준비 단계를 구체화해 보세요.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {scores.map(({ label, value, helper, icon: Icon }) => <article key={label} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</span><b className="mt-2 block text-3xl text-neutral-950">{value === null ? "—" : `${value}/100`}</b></div><Icon className="h-5 w-5 text-neutral-400" /></div><p className="mt-4 text-xs text-neutral-500">{helper}</p></article>)}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <button onClick={() => onNavigate("resume-builder")} className="rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-sm"><FileText className="h-5 w-5 text-teal-700" /><b className="mt-4 block text-neutral-950">AI 이력서 검토</b><p className="mt-2 text-sm leading-6 text-neutral-500">등록된 이력 근거의 강점과 빠진 정보를 확인합니다.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold">열기<ArrowRight className="h-3.5 w-3.5" /></span></button>
          <button onClick={() => onNavigate("career-roadmap")} className="rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-sm"><Target className="h-5 w-5 text-teal-700" /><b className="mt-4 block text-neutral-950">AI 성장 로드맵</b><p className="mt-2 text-sm leading-6 text-neutral-500">희망 직무와 현재 공개 공고를 기준으로 다음 단계를 정리합니다.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold">열기<ArrowRight className="h-3.5 w-3.5" /></span></button>
          <button onClick={() => onNavigate("project-marketplace")} className="rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-sm"><Briefcase className="h-5 w-5 text-teal-700" /><b className="mt-4 block text-neutral-950">공개 프로젝트</b><p className="mt-2 text-sm leading-6 text-neutral-500">현재 지원 가능한 실제 기업 공고 {openProjects.length}건을 확인합니다.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold">공고 보기<ArrowRight className="h-3.5 w-3.5" /></span></button>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between"><div><h2 className="font-black text-neutral-950">지원 및 프로젝트 현황</h2><p className="mt-1 text-xs text-neutral-500">Supabase에 저장된 실제 지원 기록입니다.</p></div><button onClick={() => onNavigate("workspace")} className="text-xs font-bold">워크스페이스</button></div>
            <div className="mt-5 divide-y divide-neutral-100">{applications.length ? applications.slice(0, 6).map((application) => <article key={application.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><b className="block truncate text-sm text-neutral-900">{application.projectTitle}</b><p className="mt-1 text-xs text-neutral-500">{application.status === "reviewed" ? `검토 완료 · ${application.score}/100` : `상태 · ${application.status}`}</p></div><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase text-neutral-600">{application.status}</span></article>) : <div className="py-10 text-center"><Briefcase className="mx-auto h-7 w-7 text-neutral-300" /><p className="mt-3 text-sm font-bold text-neutral-700">아직 지원한 프로젝트가 없습니다.</p><button onClick={() => onNavigate("project-marketplace")} className="mt-3 text-xs font-bold text-teal-700">공개 공고 확인하기</button></div>}</div>
            {active.length > 0 && <p className="mt-4 text-xs text-neutral-500">진행 중이거나 검토 대기인 지원 {active.length}건</p>}
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-black text-neutral-950"><Bell className="h-4 w-4" />최근 알림</h2>
            <div className="mt-5 space-y-3">{notifications.length ? notifications.slice(0, 6).map((notification) => <article key={notification.id} className="rounded-2xl bg-neutral-50 p-4"><b className="text-sm text-neutral-800">{notification.title}</b><p className="mt-1 text-xs leading-5 text-neutral-500">{notification.message}</p></article>) : <p className="py-8 text-center text-sm text-neutral-400">새 알림이 없습니다.</p>}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
