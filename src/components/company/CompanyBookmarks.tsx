import React from "react";
import { Bookmark, Briefcase, Users } from "lucide-react";

interface CompanyBookmarksProps {
  onNavigate: (tabId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export default function CompanyBookmarks({ onNavigate }: CompanyBookmarksProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <header>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Saved items</span>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">저장한 항목</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">저장 기능이 연결되면 기업이 직접 저장한 인재와 프로젝트만 이곳에 표시됩니다.</p>
      </header>
      <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center">
        <Bookmark className="mx-auto h-9 w-9 text-neutral-300" />
        <h2 className="mt-4 text-lg font-black text-neutral-900">저장한 항목이 없습니다</h2>
        <p className="mt-2 text-sm text-neutral-500">가상의 인재, 대학, 보고서나 매칭 점수는 표시하지 않습니다.</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button onClick={() => onNavigate("ai-recruitment")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white"><Users className="h-4 w-4" />실제 인재 매칭</button>
          <button onClick={() => onNavigate("company-projects")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-800"><Briefcase className="h-4 w-4" />내 프로젝트</button>
        </div>
      </section>
    </div>
  );
}
