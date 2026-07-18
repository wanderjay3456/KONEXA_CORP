import React, { useMemo } from "react";
import { CheckCircle, Clock, FileSearch, ShieldCheck, Users } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { maskedTalentName } from "../../lib/offPlatformGuard";

interface HiringPipelineViewProps {
  onNavigate: (tabId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

const stages = [
  { id: "submitted", name: "지원 접수", helper: "기업 검토 전", tone: "border-neutral-200 bg-neutral-50" },
  { id: "reviewed", name: "검토 완료", helper: "AI 또는 운영 검토", tone: "border-blue-200 bg-blue-50" },
  { id: "approved", name: "선발", helper: "프로젝트·면접 진행", tone: "border-teal-200 bg-teal-50" },
  { id: "rejected", name: "종료", helper: "이번 공고에서 미선발", tone: "border-rose-200 bg-rose-50" },
] as const;

export default function HiringPipelineView({ onNavigate, onSelectStudent }: HiringPipelineViewProps) {
  const { currentUser, projects, applications } = useApp();
  const ownedProjectIds = useMemo(
    () => new Set(projects.filter((project) => project.companyId === currentUser?.uid).map((project) => project.id)),
    [currentUser?.uid, projects],
  );
  const candidates = useMemo(
    () => applications.filter((application) => ownedProjectIds.has(application.projectId)),
    [applications, ownedProjectIds],
  );
  const reviewed = candidates.filter((application) => application.status === "reviewed" || application.status === "approved").length;
  const approved = candidates.filter((application) => application.status === "approved").length;

  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <header><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Verified hiring pipeline</span><h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">채용 진행 현황</h1><p className="mt-2 text-sm text-neutral-500">등록한 공고에 접수된 실제 지원서만 단계별로 표시합니다.</p></header>

    <section className="grid gap-3 sm:grid-cols-3">{[
      ["전체 지원", candidates.length, Users],
      ["검토 완료", reviewed, FileSearch],
      ["선발", approved, CheckCircle],
    ].map(([label, value, Icon]) => <div key={String(label)} className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400"><span>{label as string}</span><Icon className="h-4 w-4" /></div><b className="mt-3 block text-3xl text-neutral-950">{value as number}</b></div>)}</section>

    {!candidates.length ? <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center"><Clock className="mx-auto h-8 w-8 text-neutral-300" /><h2 className="mt-4 text-xl font-black text-neutral-950">아직 접수된 지원서가 없습니다</h2><p className="mt-2 text-sm text-neutral-500">기업 공고에 학생이 지원하면 이 화면에 자동으로 표시됩니다.</p><button onClick={() => onNavigate("company-projects")} className="mt-5 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white">공고 확인하기</button></section> : <div className="grid gap-4 xl:grid-cols-4">{stages.map((stage) => {
      const stageCandidates = candidates.filter((application) => application.status === stage.id);
      return <section key={stage.id} className={`min-h-80 rounded-3xl border p-4 ${stage.tone}`}><div className="flex items-center justify-between border-b border-black/5 pb-3"><div><h2 className="text-sm font-black text-neutral-950">{stage.name}</h2><p className="mt-0.5 text-[10px] text-neutral-500">{stage.helper}</p></div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-neutral-700">{stageCandidates.length}</span></div><div className="mt-3 space-y-3">{stageCandidates.length ? stageCandidates.map((application) => <article key={application.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><button onClick={() => { onSelectStudent(application.studentId); onNavigate("student-review"); }} className="truncate text-left text-sm font-black text-neutral-950 hover:underline">{maskedTalentName(application.studentId)}</button><p className="mt-1 truncate text-xs text-neutral-500">{application.projectTitle}</p></div>{application.score > 0 && <span className="rounded-lg bg-neutral-950 px-2 py-1 text-[10px] font-bold text-white">{application.score}/100</span>}</div><div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3"><span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-neutral-400"><ShieldCheck className="h-3.5 w-3.5" />{application.score > 0 ? "검토 점수" : "점수 미산정"}</span><button onClick={() => onNavigate("applications")} className="text-[10px] font-bold text-teal-700">지원서 보기</button></div></article>) : <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-xs text-neutral-400">해당 단계의 지원서가 없습니다.</div>}</div></section>;
    })}</div>}
  </div>;
}
