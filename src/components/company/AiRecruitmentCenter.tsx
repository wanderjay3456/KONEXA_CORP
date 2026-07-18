import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Brain, BriefcaseBusiness, Check, RefreshCw, Send, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { maskedTalentName } from "../../lib/offPlatformGuard";
import { useToast } from "../ui/Toast";

interface AiRecruitmentCenterProps {
  onNavigate: (tabId: string) => void;
}

interface TalentMatch {
  id: string;
  major: string;
  skills: string[];
  languages: string[];
  preferredJob: string;
  preferredIndustry: string;
  availability: string;
  workPreference: string;
  timezone: string;
  trustScore: number;
  completedProjects: number;
  careerReadiness: number;
  employabilityScore: number;
  suitabilityScore: number;
  confidence: number;
  matchingFactors: string[];
  explanation: string;
  strengths: string[];
  weaknesses: string[];
  skillGaps: Array<{ skill: string; severity: "High" | "Medium" | "Low"; advice: string }>;
  interviewQuestions: string[];
}

export default function AiRecruitmentCenter({ onNavigate }: AiRecruitmentCenterProps) {
  const { currentUser, companyProfile, projects } = useApp();
  const { success, error } = useToast();
  const ownedProjects = useMemo(
    () => projects.filter((project) => project.companyId === currentUser?.uid && project.status === "open"),
    [currentUser?.uid, projects],
  );
  const [projectId, setProjectId] = useState("");
  const [matches, setMatches] = useState<TalentMatch[]>([]);
  const [activeId, setActiveId] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!ownedProjects.some((project) => project.id === projectId)) setProjectId(ownedProjects[0]?.id || "");
  }, [ownedProjects, projectId]);

  const activeProject = ownedProjects.find((project) => project.id === projectId);
  const activeMatch = matches.find((match) => match.id === activeId) || matches[0];

  const runMatching = async () => {
    if (!projectId) return;
    setLoading(true);
    setLoadError("");
    setMatches([]);
    setActiveId("");
    setChatMessages([]);
    try {
      const response = await fetch(`/api/ai/matching?projectId=${encodeURIComponent(projectId)}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "AI 인재 매칭을 실행하지 못했습니다.");
      const nextMatches = Array.isArray(payload.matches) ? payload.matches : [];
      setMatches(nextMatches);
      setActiveId(nextMatches[0]?.id || "");
      setModel(typeof payload.model === "string" ? payload.model : null);
      success("AI 매칭 완료", `${nextMatches.length}명의 실제 인재 카드를 공고 기준으로 분석했습니다.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "AI 인재 매칭을 실행하지 못했습니다.";
      setLoadError(message);
      error("AI 매칭 실패", message);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    const message = chatInput.trim();
    if (!message || !activeMatch || !activeProject || chatLoading) return;
    const nextMessages = [...chatMessages, { role: "user" as const, content: message }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context: {
            companyContext: {
              industry: companyProfile?.industry,
              requiredSkills: activeProject.requirements,
              projectTitle: activeProject.title,
            },
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.reply) throw new Error(payload.error || "AI 채용 도우미가 응답하지 않았습니다.");
      setChatMessages((current) => [...current, { role: "assistant", content: payload.reply }]);
    } catch (cause) {
      error("AI 채용 도우미 오류", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setChatLoading(false);
    }
  };

  if (!companyProfile?.verified || companyProfile.verifiedStatus !== "Verified") {
    return <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-10 text-center">
      <ShieldCheck className="mx-auto h-9 w-9 text-neutral-300" />
      <h1 className="mt-4 text-2xl font-black text-neutral-950">기업 인증 후 AI 매칭을 사용할 수 있습니다</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-500">실제 인재 데이터는 인증된 기업에만 제공되며, 연락처는 계약 전까지 공개되지 않습니다.</p>
      <button onClick={() => onNavigate("identity")} className="mt-6 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white">기업 인증 진행하기</button>
    </div>;
  }

  if (!ownedProjects.length) {
    return <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-10 text-center">
      <BriefcaseBusiness className="mx-auto h-9 w-9 text-neutral-300" />
      <h1 className="mt-4 text-2xl font-black text-neutral-950">먼저 실제 공고를 등록해 주세요</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-500">AI는 공고의 업무 범위와 요구 기술을 기준으로 검증된 인재 카드만 비교합니다.</p>
      <button onClick={() => onNavigate("create-challenge")} className="mt-6 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white">공고 등록하기</button>
    </div>;
  }

  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">Evidence-based AI matching</span><h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">AI 인재 매칭</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">등록된 공고와 실제 인재 카드만 비교합니다. AI가 만든 가상 후보나 임의 점수는 표시하지 않습니다.</p></div>
      <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="min-w-64 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none">
          {ownedProjects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
        <button onClick={runMatching} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{loading ? "분석 중" : "실제 인재 분석"}</button>
      </div>
    </header>

    {loadError && <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><b>분석을 완료하지 못했습니다.</b><p className="mt-1">{loadError}</p></div></div>}
    {!loading && !loadError && matches.length === 0 && <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center"><Target className="mx-auto h-8 w-8 text-neutral-300" /><h2 className="mt-4 text-lg font-black">공고를 선택하고 실제 인재 분석을 실행해 주세요</h2><p className="mt-2 text-sm text-neutral-500">분석 결과가 없으면 점수 대신 빈 상태를 유지합니다.</p></div>}

    {activeMatch && <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
      <aside className="space-y-2 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400"><span>실제 후보</span><span>{matches.length}</span></div>
        {matches.map((match) => <button key={match.id} onClick={() => { setActiveId(match.id); setChatMessages([]); }} className={`w-full rounded-2xl border p-4 text-left ${match.id === activeMatch.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 hover:border-neutral-400"}`}>
          <div className="flex items-center justify-between gap-3"><b>{maskedTalentName(match.id)}</b><span className="text-sm font-black">{match.suitabilityScore}%</span></div>
          <p className={`mt-1 text-xs ${match.id === activeMatch.id ? "text-neutral-300" : "text-neutral-500"}`}>{match.preferredJob || match.major || "직무 정보 검증 중"}</p>
          <div className="mt-3 flex flex-wrap gap-1">{match.skills.slice(0, 3).map((skill) => <span key={skill} className={`rounded-lg px-2 py-1 text-[9px] ${match.id === activeMatch.id ? "bg-white/10" : "bg-neutral-100"}`}>{skill}</span>)}</div>
        </button>)}
      </aside>

      <main className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <section className="flex flex-col justify-between gap-4 border-b border-neutral-100 pb-6 sm:flex-row"><div><span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">AI match for {activeProject?.title}</span><h2 className="mt-2 text-2xl font-black">{maskedTalentName(activeMatch.id)}</h2><p className="mt-2 text-sm leading-6 text-neutral-600">{activeMatch.explanation || "설명 가능한 분석 결과가 없습니다."}</p></div><div className="grid min-w-40 grid-cols-2 gap-2"><div className="rounded-2xl bg-neutral-950 p-4 text-white"><span className="text-[9px] uppercase text-neutral-400">적합도</span><b className="mt-1 block text-xl">{activeMatch.suitabilityScore}%</b></div><div className="rounded-2xl bg-neutral-100 p-4"><span className="text-[9px] uppercase text-neutral-400">근거 신뢰도</span><b className="mt-1 block text-xl">{activeMatch.confidence}%</b></div></div></section>
        <section className="grid gap-5 md:grid-cols-2"><div><h3 className="flex items-center gap-2 text-sm font-black"><Check className="h-4 w-4 text-emerald-600" />확인된 강점</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">{activeMatch.strengths.length ? activeMatch.strengths.map((item) => <li key={item}>• {item}</li>) : <li>충분한 근거가 없습니다.</li>}</ul></div><div><h3 className="flex items-center gap-2 text-sm font-black"><AlertCircle className="h-4 w-4 text-amber-600" />확인할 점</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-600">{activeMatch.weaknesses.length ? activeMatch.weaknesses.map((item) => <li key={item}>• {item}</li>) : <li>추가 확인 항목이 없습니다.</li>}</ul></div></section>
        <section><h3 className="text-sm font-black">매칭 근거</h3><div className="mt-3 flex flex-wrap gap-2">{activeMatch.matchingFactors.map((factor) => <span key={factor} className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">{factor}</span>)}</div></section>
        <section><h3 className="text-sm font-black">면접에서 확인할 질문</h3><div className="mt-3 space-y-2">{activeMatch.interviewQuestions.map((question, index) => <div key={question} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6"><b className="mr-2 text-teal-700">Q{index + 1}</b>{question}</div>)}</div></section>
        <section className="rounded-3xl bg-neutral-950 p-5 text-white"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-black"><Brain className="h-4 w-4" />AI 채용 도우미</h3><span className="text-[9px] text-neutral-400">{model || "Gemini"}</span></div><div className="mt-4 max-h-64 space-y-3 overflow-y-auto">{chatMessages.map((message, index) => <div key={index} className={`max-w-[88%] rounded-2xl p-3 text-xs leading-6 ${message.role === "user" ? "ml-auto bg-white text-neutral-950" : "bg-white/10 text-neutral-100"}`}>{message.content}</div>)}{chatLoading && <div className="text-xs text-neutral-400">응답을 작성하고 있습니다.</div>}</div><div className="mt-4 flex gap-2"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendChat(); }} placeholder="이 후보에게 확인할 질문이나 평가 기준을 물어보세요" className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-500" /><button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="rounded-xl bg-white p-3 text-neutral-950 disabled:opacity-40"><Send className="h-4 w-4" /></button></div></section>
      </main>
    </div>}
  </div>;
}
