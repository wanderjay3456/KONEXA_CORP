import React, { useState } from "react";
import { BookOpen, RefreshCw, Target } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useToast } from "../ui/Toast";

interface RoadmapResult {
  summary: string;
  milestones: Array<{ title: string; nextAction: string; evidenceNeeded: string }>;
  skillGaps: string[];
  learningActions: string[];
  relevantProjectIds: string[];
  model?: string;
}

export default function CareerRoadmap() {
  const { studentProfile, projects } = useApp();
  const { success, error } = useToast();
  const [careerGoal, setCareerGoal] = useState(studentProfile?.preferredJob || "");
  const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generateRoadmap = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/student-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerGoal }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "로드맵을 생성하지 못했습니다.");
      setRoadmap(payload);
      success("AI 로드맵 생성 완료", "등록된 프로필과 현재 공개 공고를 기준으로 분석했습니다.");
    } catch (cause) {
      error("AI 로드맵 오류", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const matchedProjects = (roadmap?.relevantProjectIds || [])
    .map((id) => projects.find((project) => project.id === id))
    .filter(Boolean);

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">Evidence-based roadmap</span>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">AI 성장 로드맵</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">등록한 전공, 기술, 희망 직무와 현재 공개된 프로젝트만 사용합니다. 확인되지 않은 기업이나 경력은 만들지 않습니다.</p>
          </div>
          {roadmap?.model && <span className="text-xs text-neutral-400">{roadmap.model}</span>}
        </header>

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <label className="text-xs font-bold text-neutral-700" htmlFor="career-goal">목표 직무 또는 준비 방향</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input id="career-goal" value={careerGoal} onChange={(event) => setCareerGoal(event.target.value)} placeholder="예: 한국 SaaS 기업의 프론트엔드 엔지니어" className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-500" />
            <button onClick={generateRoadmap} disabled={loading || !careerGoal.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-40">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "분석 중" : roadmap ? "다시 분석" : "로드맵 만들기"}
            </button>
          </div>
        </section>

        {!roadmap ? (
          <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <Target className="mx-auto h-8 w-8 text-neutral-300" />
            <h2 className="mt-4 text-lg font-black text-neutral-900">아직 생성된 로드맵이 없습니다</h2>
            <p className="mt-2 text-sm text-neutral-500">목표를 입력하면 현재 프로필에서 확인되는 근거와 부족한 정보를 나누어 보여드립니다.</p>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="space-y-4 lg:col-span-2">
              <div className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="text-sm font-black text-neutral-950">분석 요약</h2><p className="mt-3 text-sm leading-7 text-neutral-600">{roadmap.summary}</p></div>
              <div className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="text-sm font-black text-neutral-950">다음 단계</h2><div className="mt-5 space-y-4">{roadmap.milestones.map((milestone, index) => <article key={`${milestone.title}-${index}`} className="rounded-2xl bg-neutral-50 p-5"><span className="text-[10px] font-bold text-teal-700">STEP {index + 1}</span><h3 className="mt-1 font-black text-neutral-900">{milestone.title}</h3><p className="mt-2 text-sm leading-6 text-neutral-600">{milestone.nextAction}</p><p className="mt-3 text-xs text-neutral-500"><b>추가로 필요한 근거:</b> {milestone.evidenceNeeded}</p></article>)}</div></div>
            </section>
            <aside className="space-y-4">
              <div className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="text-sm font-black">보완할 역량</h2><ul className="mt-4 space-y-2 text-sm text-neutral-600">{roadmap.skillGaps.length ? roadmap.skillGaps.map((item) => <li key={item} className="rounded-xl bg-neutral-50 p-3">{item}</li>) : <li className="text-neutral-400">확인된 항목 없음</li>}</ul></div>
              <div className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="flex items-center gap-2 text-sm font-black"><BookOpen className="h-4 w-4" />학습·실행 제안</h2><ul className="mt-4 space-y-2 text-sm text-neutral-600">{roadmap.learningActions.map((item) => <li key={item} className="rounded-xl bg-neutral-50 p-3">{item}</li>)}</ul></div>
              <div className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="text-sm font-black">연관된 실제 공고</h2><div className="mt-4 space-y-2">{matchedProjects.length ? matchedProjects.map((project) => <div key={project!.id} className="rounded-xl bg-neutral-50 p-3 text-sm font-bold text-neutral-800">{project!.title}</div>) : <p className="text-sm text-neutral-400">현재 조건에 맞는 공개 공고가 없습니다.</p>}</div></div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
