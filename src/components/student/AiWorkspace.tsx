import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Sparkles, Send, Brain, Bot, HelpCircle, RefreshCw, ChevronRight, 
  Target, Award, BookOpen, Clock, Activity, Briefcase, Zap, ShieldAlert, User
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface Coach {
  id: string;
  name: string;
  desc: string;
  greet: string;
  icon: any;
  color: string;
}

export default function AiWorkspace() {
  const { studentProfile, projects, applications } = useApp();
  const { error } = useToast();

  const coaches: Coach[] = [
    { id: "career", name: "AI Career Coach", desc: "희망 직무와 현재 경험을 바탕으로 다음 단계를 정리합니다", greet: "희망 직무와 준비 중인 경력을 알려주세요. 등록된 프로필 정보와 함께 실행 가능한 다음 단계를 정리해 드릴게요.", icon: Briefcase, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { id: "resume", name: "AI Resume Reviewer", desc: "이력서의 표현과 근거를 점검합니다", greet: "검토할 이력서 문장이나 지원 공고를 보내주세요. 확인할 수 있는 내용만 바탕으로 개선안을 제안하겠습니다.", icon: Award, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { id: "portfolio", name: "AI Portfolio Reviewer", desc: "포트폴리오의 구조와 성과 표현을 검토합니다", greet: "포트폴리오에서 가장 강조하고 싶은 프로젝트를 알려주세요. 역할, 결과물, 성과 근거가 잘 드러나는지 함께 살펴보겠습니다.", icon: Sparkles, color: "text-teal-600 bg-teal-50 border-teal-100" },
    { id: "interview", name: "AI Interview Coach", desc: "지원 직무에 맞춘 모의 면접을 진행합니다", greet: "지원하려는 직무와 공고 내용을 알려주세요. 그 기준에 맞춘 질문을 하나씩 드리고 답변을 구체적으로 피드백하겠습니다.", icon: Bot, color: "text-purple-600 bg-purple-50 border-purple-100" },
    { id: "learning", name: "AI Learning Coach", desc: "부족한 역량을 학습 계획으로 바꿉니다", greet: "보완하고 싶은 기술이나 목표 프로젝트를 알려주세요. 현재 수준을 먼저 확인한 뒤 현실적인 학습 순서를 제안하겠습니다.", icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { id: "project", name: "AI Project Advisor", desc: "프로젝트 범위와 구현 계획을 구체화합니다", greet: "진행 중인 프로젝트의 목표와 막힌 부분을 알려주세요. 요구사항, 위험요소, 다음 작업 순서로 나누어 정리하겠습니다.", icon: Brain, color: "text-rose-600 bg-rose-50 border-rose-100" },
    { id: "skill", name: "AI Skill Advisor", desc: "등록 기술과 희망 직무의 차이를 분석합니다", greet: "희망 직무나 관심 있는 공고를 알려주세요. 등록된 기술과 비교해 우선 보완할 항목을 정리하겠습니다.", icon: Target, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { id: "productivity", name: "AI Productivity Coach", desc: "지속 가능한 실행 계획을 설계합니다", greet: "이번 주에 확보할 수 있는 시간과 완료해야 할 일을 알려주세요. 무리하지 않고 지킬 수 있는 계획으로 바꿔 드릴게요.", icon: Clock, color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
    { id: "weekly", name: "AI Weekly Review", desc: "실제 활동을 바탕으로 한 주를 정리합니다", greet: "이번 주에 완료한 작업과 어려웠던 점을 알려주세요. 확인된 활동과 함께 다음 주 우선순위를 정리하겠습니다.", icon: Activity, color: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100" }
  ];

  const [selectedCoachId, setSelectedCoachId] = useState("career");
  const activeCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];

  // Chat message thread
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: activeCoach.greet }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [typing, setTyping] = useState(false);

  // When changing coach, reseed conversation thread
  const handleSelectCoach = (coachId: string) => {
    setSelectedCoachId(coachId);
    const target = coaches.find(c => c.id === coachId) || coaches[0];
    setMessages([
      { role: "assistant", content: target.greet }
    ]);
    setInputMsg("");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userMsg = { role: "user", content: inputMsg };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg("");
    setTyping(true);

    try {
      // Forward to backend gemini chat routing with live student profile details
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: {
            coachType: activeCoach.name,
            studentProfile: {
              name: studentProfile?.name,
              skills: studentProfile?.skills,
              bio: studentProfile?.bio,
              trustScore: studentProfile?.trustScore,
              completedProjects: studentProfile?.completedProjects
            }
          }
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.reply) throw new Error(payload.error || "AI 코치가 응답하지 않았습니다.");
      setMessages(prev => [...prev, { role: "assistant", content: payload.reply }]);
    } catch (cause) {
      error("AI 코치 연결 오류", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6 scrollbar">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-md w-fit">
            GEMINI COGNITIVE COACH SUITE
          </span>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            AI Coach Suite
          </h1>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            등록한 프로필과 대화 내용을 바탕으로 진로, 이력서, 포트폴리오, 면접과 프로젝트 준비를 도와드립니다.
          </p>
        </div>
      </div>

      {/* CORE SPLIT GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Coaches Sidebar Selector (4/12) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-3xl p-4 space-y-3.5 shadow-xs">
          <div>
            <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block pl-2">ACTIVE COACHES MATRIX</span>
            <span className="text-xs font-semibold text-neutral-500 block pl-2 mt-0.5">Toggle live cognitive contexts</span>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[500px] pr-1 scrollbar">
            {coaches.map(c => {
              const Icon = c.icon;
              const isActive = selectedCoachId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectCoach(c.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isActive
                      ? "bg-neutral-900 border-neutral-900 text-white shadow-md shadow-neutral-900/10"
                      : "bg-white border-neutral-200/40 hover:border-neutral-300 text-neutral-500 hover:text-black"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border shrink-0 ${c.color} ${isActive ? "bg-white/10 border-white/10" : ""}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block">{c.name}</span>
                    <span className="text-[10px] text-neutral-400 leading-normal block mt-0.5 truncate">{c.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Frame (8/12) */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-[580px]">
          
          {/* Coach Chat header */}
          <div className="border-b border-neutral-100 pb-4 flex justify-between items-center shrink-0">
            <div className="flex gap-3 items-center">
              <div className={`p-2.5 rounded-xl border shrink-0 ${activeCoach.color}`}>
                {React.createElement(activeCoach.icon, { className: "w-4 h-4" })}
              </div>
              <div>
                <h3 className="font-display font-black text-sm text-neutral-900">{activeCoach.name}</h3>
                <span className="text-[9px] font-mono font-bold text-neutral-400 block mt-0.5 uppercase tracking-wider">MODEL: GEMINI-3.5-FLASH</span>
              </div>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${typing ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
          </div>

          {/* Scrollable messages context */}
          <div className="flex-1 overflow-y-auto space-y-4 my-4 p-2 scrollbar bg-neutral-50/20 border border-neutral-100 rounded-2xl">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] border shrink-0 ${
                  msg.role === "user" ? "bg-neutral-100 text-neutral-700 border-neutral-200/50" : "bg-purple-50 text-purple-600 border-purple-100/50"
                }`}>
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : "AI"}
                </div>
                <div className={`p-4 rounded-2xl text-xs font-sans leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user" 
                    ? "bg-neutral-900 text-white rounded-tr-none" 
                    : "bg-white border border-neutral-200/40 rounded-tl-none text-neutral-700 font-light"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold text-[10px] animate-pulse shrink-0">
                  AI
                </div>
                <div className="bg-white border border-neutral-200/40 p-4 rounded-2xl rounded-tl-none text-xs text-neutral-400">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Form input messaging */}
          <form onSubmit={handleSend} className="flex gap-2.5 shrink-0 pt-2 border-t border-neutral-100">
            <input 
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={`Consult ${activeCoach.name} regarding your profile details...`}
              className="flex-1 bg-neutral-50 border border-neutral-200 focus:border-black/50 rounded-2xl px-4 py-2.5 text-xs font-sans focus:outline-hidden transition-colors"
            />
            <button 
              type="submit" 
              disabled={typing || !inputMsg.trim()}
              className="w-10 h-10 bg-black hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-300 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
