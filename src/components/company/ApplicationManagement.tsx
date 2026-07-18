import React, { useMemo, useState } from "react";
import { Award, CheckCircle2, Clock3, Search, ShieldCheck, XCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ApplicationStatus, type Application } from "../../types";
import CandidateIntroVideo from "./CandidateIntroVideo";

interface ApplicationManagementProps {
  onNavigate: (tabId: string) => void;
  onSelectStudent: (studentId: string) => void;
  onSelectApplication: (app: Application) => void;
}

export default function ApplicationManagement({ onSelectStudent, onSelectApplication }: ApplicationManagementProps) {
  const { applications, projects, currentUser, reviewApplication } = useApp();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const ownedProjectIds = useMemo(() => new Set(projects.filter((project) => project.companyId === currentUser?.uid).map((project) => project.id)), [projects, currentUser?.uid]);
  const visible = useMemo(() => applications.filter((application) => {
    const owned = application.companyId === currentUser?.uid || ownedProjectIds.has(application.projectId);
    const text = `${application.studentName} ${application.projectTitle}`.toLowerCase();
    return owned && text.includes(query.trim().toLowerCase());
  }), [applications, currentUser?.uid, ownedProjectIds, query]);

  const updateStatus = async (application: Application, status: ApplicationStatus) => {
    setBusyId(application.id);
    try {
      await reviewApplication(application.id, status, status === ApplicationStatus.APPROVED ? "기업 검토 승인" : "기업 검토 결과 미선정", application.score || 0);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl bg-neutral-950 p-7 text-white">
        <div className="text-[10px] font-bold uppercase tracking-[.2em] text-neutral-400">Verified applications</div>
        <h1 className="mt-2 text-3xl font-black">지원자 관리</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">현재 기업이 등록한 프로젝트의 실제 지원서만 표시합니다. 임의 후보나 기본 점수는 생성하지 않습니다.</p>
        <label className="mt-6 flex max-w-lg items-center gap-3 rounded-2xl bg-white px-4 text-neutral-900"><Search className="h-4 w-4 text-neutral-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름 또는 프로젝트 검색" className="h-12 flex-1 bg-transparent text-sm outline-none" /></label>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center"><Clock3 className="mx-auto h-7 w-7 text-neutral-300" /><h2 className="mt-4 font-black">아직 지원서가 없습니다</h2><p className="mt-2 text-sm text-neutral-500">공개 프로젝트에 학생이 지원하면 이곳에 표시됩니다.</p></div>
      ) : (
        <div className="space-y-3">
          {visible.map((application) => (
            <article key={application.id} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={() => { onSelectStudent(application.studentId); onSelectApplication(application); }} className="text-left"><div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{application.projectTitle}</div><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="text-lg font-black">{application.studentName}</h2>{application.earlyPioneer && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700"><Award className="h-3.5 w-3.5" />Early Pioneer</span>}</div><div className="mt-2 flex items-center gap-2 text-xs text-neutral-500"><ShieldCheck className="h-4 w-4" />상태: {application.status}</div></button>
                <div className="flex gap-2"><button disabled={busyId === application.id} onClick={() => updateStatus(application, ApplicationStatus.APPROVED)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />승인</button><button disabled={busyId === application.id} onClick={() => updateStatus(application, ApplicationStatus.REJECTED)} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-xs font-bold text-neutral-700 disabled:opacity-50"><XCircle className="h-4 w-4" />미선정</button></div>
              </div>
              <CandidateIntroVideo application={application} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
