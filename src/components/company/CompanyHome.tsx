import React, { useMemo } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, FilePlus2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";

interface CompanyHomeProps {
  onNavigate: (tabId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export default function CompanyHome({ onNavigate }: CompanyHomeProps) {
  const { currentUser, projects, applications, companyProfile } = useApp();
  const ownedProjects = useMemo(
    () => projects.filter((project) => project.companyId === currentUser?.uid),
    [currentUser?.uid, projects],
  );
  const ownedProjectIds = useMemo(() => new Set(ownedProjects.map((project) => project.id)), [ownedProjects]);
  const receivedApplications = useMemo(
    () => applications.filter((application) => ownedProjectIds.has(application.projectId)),
    [applications, ownedProjectIds],
  );
  const openProjects = ownedProjects.filter((project) => project.status === "open");
  const completedProjects = ownedProjects.filter((project) => project.status === "completed");
  const reviewedApplications = receivedApplications.filter((application) => application.status === "reviewed" || application.status === "approved");
  const verified = companyProfile?.verified === true && companyProfile.verifiedStatus === "Verified";

  const metrics = [
    { label: "진행 중인 공고", value: openProjects.length, helper: "현재 학생에게 공개 중", icon: BriefcaseBusiness },
    { label: "접수된 지원", value: receivedApplications.length, helper: "실제 등록된 지원서", icon: Users },
    { label: "검토 완료", value: reviewedApplications.length, helper: "AI 또는 운영 검토 완료", icon: CheckCircle2 },
    { label: "완료 프로젝트", value: completedProjects.length, helper: "종료가 확인된 프로젝트", icon: ShieldCheck },
  ];

  return <div className="mx-auto max-w-7xl space-y-7 pb-12">
    <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Company workspace</span><h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">{companyProfile?.companyName || "기업"} 대시보드</h1><p className="mt-2 text-sm text-neutral-500">실제 공고, 지원서와 검증 상태만 표시합니다.</p></div>
      <div className="flex flex-wrap gap-2"><button onClick={() => onNavigate("create-challenge")} className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white"><FilePlus2 className="h-4 w-4" />공고 등록</button><button onClick={() => onNavigate("ai-recruitment")} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-900"><Sparkles className="h-4 w-4" />AI 인재 매칭</button></div>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(({ label, value, helper, icon: Icon }) => <article key={label} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400"><span>{label}</span><Icon className="h-4 w-4" /></div><b className="mt-4 block text-3xl text-neutral-950">{value}</b><p className="mt-1 text-xs text-neutral-500">{helper}</p></article>)}</section>

    <section className={`rounded-3xl border p-6 ${verified ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"}`}>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><div className="flex items-center gap-2"><ShieldCheck className={`h-5 w-5 ${verified ? "text-teal-700" : "text-amber-700"}`} /><h2 className="font-black text-neutral-950">{verified ? "기업 인증 완료" : "기업 인증이 필요합니다"}</h2></div><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{verified ? "인증된 인재 카드 열람과 실제 공고 기반 AI 매칭을 사용할 수 있습니다." : "인재 정보와 AI 매칭은 사업자등록 확인이 완료된 기업에만 제공됩니다."}</p></div><button onClick={() => onNavigate(verified ? "ai-recruitment" : "identity")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white">{verified ? "AI 매칭 시작" : "인증 상태 확인"}<ArrowRight className="h-4 w-4" /></button></div>
    </section>

    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-black text-neutral-950">등록한 공고</h2><p className="mt-1 text-xs text-neutral-500">기업 계정에서 실제 등록한 공고입니다.</p></div><button onClick={() => onNavigate("company-projects")} className="text-xs font-bold text-neutral-700">전체 보기</button></div><div className="mt-5 divide-y divide-neutral-100">{ownedProjects.length ? ownedProjects.slice(0, 5).map((project) => <button key={project.id} onClick={() => onNavigate("company-projects")} className="flex w-full items-center justify-between gap-4 py-4 text-left"><div className="min-w-0"><b className="block truncate text-sm text-neutral-950">{project.title}</b><p className="mt-1 line-clamp-1 text-xs text-neutral-500">{project.description}</p></div><span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase text-neutral-600">{project.status}</span></button>) : <div className="py-10 text-center"><BriefcaseBusiness className="mx-auto h-7 w-7 text-neutral-300" /><p className="mt-3 text-sm font-bold text-neutral-700">등록된 공고가 없습니다.</p><button onClick={() => onNavigate("create-challenge")} className="mt-3 text-xs font-bold text-teal-700">첫 공고 등록하기</button></div>}</div></section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"><div><h2 className="font-black text-neutral-950">최근 지원 현황</h2><p className="mt-1 text-xs text-neutral-500">등록된 공고에 접수된 실제 지원서입니다.</p></div><div className="mt-5 space-y-2">{receivedApplications.length ? receivedApplications.slice(0, 6).map((application) => <button key={application.id} onClick={() => onNavigate("applications")} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4 text-left"><div className="min-w-0"><b className="block truncate text-sm text-neutral-950">{application.projectTitle}</b><p className="mt-1 text-xs text-neutral-500">{application.status === "reviewed" ? `AI 보조 검토 완료 · ${application.score}/100` : "검토 대기"}</p></div><span className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-bold uppercase text-neutral-600">{application.status}</span></button>) : <div className="py-10 text-center"><Users className="mx-auto h-7 w-7 text-neutral-300" /><p className="mt-3 text-sm font-bold text-neutral-700">아직 접수된 지원서가 없습니다.</p><p className="mt-1 text-xs text-neutral-500">공고가 학생 페이지에 공개되면 지원 현황이 여기에 표시됩니다.</p></div>}</div></section>
    </div>
  </div>;
}
