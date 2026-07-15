import React, { useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Search, ShieldCheck, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { Project } from "../../types";
import { useToast } from "../ui/Toast";

export default function ProjectMarketplace() {
  const { projects, applications, applyToProject, studentProfile } = useApp();
  const { error } = useToast();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [proposal, setProposal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const visible = useMemo(() => projects.filter((project) => {
    const value = `${project.title} ${project.companyName} ${project.description} ${project.tags.join(" ")}`.toLowerCase();
    return value.includes(query.trim().toLowerCase());
  }), [projects, query]);

  const hasApplied = (projectId: string) => applications.some((application) => application.projectId === projectId);
  const matchingSkills = (project: Project) => project.tags.filter((tag) =>
    (studentProfile?.skills || []).some((skill) => skill.toLowerCase() === tag.toLowerCase())
  );

  const submit = async () => {
    if (!selected || proposal.trim().length < 30) {
      error("지원 내용을 확인해 주세요", "프로젝트 수행 계획을 30자 이상 작성해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await applyToProject(selected.id, proposal.trim());
      setSelected(null);
      setProposal("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-neutral-950 p-7 text-white">
          <div className="text-[10px] font-bold uppercase tracking-[.2em] text-neutral-400">Verified project marketplace</div>
          <h1 className="mt-2 text-3xl font-black">실제 등록 프로젝트</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">Supabase에 등록된 프로젝트만 표시합니다. 가상 기업, 모의 추천 점수, 생성된 후기는 사용하지 않습니다.</p>
          <label className="mt-6 flex max-w-xl items-center gap-3 rounded-2xl bg-white px-4 text-neutral-900">
            <Search className="h-4 w-4 text-neutral-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="프로젝트, 기업, 기술 검색" className="h-12 flex-1 bg-transparent text-sm outline-none" />
          </label>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center">
            <BriefcaseBusiness className="mx-auto h-7 w-7 text-neutral-300" />
            <h2 className="mt-4 font-black">현재 공개된 프로젝트가 없습니다</h2>
            <p className="mt-2 text-sm text-neutral-500">기업이 검증된 프로젝트를 등록하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((project) => {
              const skills = matchingSkills(project);
              const applied = hasApplied(project.id);
              return (
                <article key={project.id} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div><div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{project.companyName}</div><h2 className="mt-2 text-xl font-black">{project.title}</h2></div>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold">{project.status}</span>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-500">{project.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">{project.tags.map((tag) => <span key={tag} className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">{tag}</span>)}</div>
                  {skills.length > 0 && <p className="mt-4 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />프로필 기술과 일치: {skills.join(", ")}</p>}
                  <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-5"><div><div className="text-[10px] text-neutral-400">주급·보상</div><b className="text-sm">{project.reward}</b></div><button disabled={applied || project.status !== "open"} onClick={() => setSelected(project)} className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-white disabled:bg-neutral-200 disabled:text-neutral-500">{applied ? "지원 완료" : "지원하기"}<ArrowRight className="h-3.5 w-3.5" /></button></div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="프로젝트 지원">
        <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{selected.companyName}</div><h2 className="mt-1 text-xl font-black">{selected.title}</h2></div><button onClick={() => setSelected(null)} className="rounded-full p-2 hover:bg-neutral-100" aria-label="닫기"><X className="h-4 w-4" /></button></div>
          <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-900"><ShieldCheck className="mr-2 inline h-4 w-4" />연락처 대신 프로젝트 수행 계획만 기업에 전달됩니다.</div>
          <label className="mt-5 block text-xs font-bold">수행 계획 및 관련 경험</label>
          <textarea value={proposal} onChange={(event) => setProposal(event.target.value)} rows={7} maxLength={4000} placeholder="이 프로젝트를 어떻게 수행할지 30자 이상 작성해 주세요." className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 outline-none focus:border-neutral-900" />
          <button onClick={submit} disabled={submitting} className="mt-4 w-full rounded-xl bg-neutral-950 py-3.5 text-xs font-bold text-white disabled:opacity-50">{submitting ? "제출 중…" : "지원서 제출"}</button>
        </div>
      </div>}
    </div>
  );
}
