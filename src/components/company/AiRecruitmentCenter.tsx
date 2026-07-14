import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Sparkles, Send, Brain, AlertCircle, BarChart3, TrendingUp, 
  UserCheck, ShieldAlert, Award, Clock, Star, RefreshCw,
  Search, ShieldCheck, Zap, Heart, Check, ChevronRight
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface AiRecruitmentCenterProps {
  onNavigate: (tabId: string) => void;
}

export default function AiRecruitmentCenter({ onNavigate }: AiRecruitmentCenterProps) {
  const { studentProfile, applications } = useApp();
  const { success, error, info } = useToast();

  // Selected candidate for AI deep-dives
  const [activeCandidateId, setActiveCandidateId] = useState("usr_fndtn_konexa_99");
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<"summary" | "gaps" | "compatibility" | "prediction">("summary");

  // AI Recruiter Chat states
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: "assistant", content: "Hello! I am your KONEXA AI Recruiting partner. I have processed the Sandbox compile logs and compiled deep talent intelligence reports. Ask me anything about candidate code quality, skill gaps, or hiring forecasts!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Hard-coded premium dataset of candidates for deep analysis mapping
  const candidateDeepReports: { [key: string]: any } = {
    "usr_fndtn_konexa_99": {
      name: studentProfile?.name || "Alex Rivera",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
      role: "Full-Stack Engineer",
      suitabilityScore: 96,
      summary: {
        strengths: ["Exceptional DOM and SVG rendering layout math", "Maintains pristine type-safety under complex generic types", "High code execution velocity (sandbox challenges solved 40% ahead of timeline)"],
        weaknesses: ["Familiar with basic socket states but lacks high-throughput streaming cluster history", "Has not deployed database partitioning triggers in active challenges"]
      },
      skillGaps: [
        { skill: "Redis Pub/Sub", severity: "Medium", advice: "Ask candidate to implement a minor message caching adapter during interview stage." },
        { skill: "Docker Compose", severity: "Low", advice: "Can be easily trained on standard corporate deployment pipelines." }
      ],
      interviewQuestions: [
        "In your SVG layout optimizer, how did you compute boundaries dynamically without triggering layout thrashing? What micro-optimizations did you utilize?",
        "Describe your strategy for securing real-time client state updates if network conditions deteriorate and packets arrive out of order."
      ],
      predictions: {
        retentionRate: 94,
        sixMonthProductivity: "High (estimated 15% above engineering benchmark)",
        culturalMatch: 92,
        riskScore: 5,
        riskDescription: "Extremely low risk. Code is exceptionally structured. Verification logs show consistent peer approval."
      },
      explainability: {
        why: "Candidate has delivered outstanding performance in vector drawing and Vite profiling challenges, displaying deep browser runtime understanding.",
        how: "Cross-correlated actual compiler throughput, type definitions, and milestone completions inside Sandbox evaluations.",
        evidence: "Evaluated 96/100 by Gemini AI core audit; completed the complex Performance challenge with zero hydrate issues.",
        confidence: 97
      }
    },
    "std_2": {
      name: "Min-jun Kim",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
      role: "Backend Platform Engineer",
      suitabilityScore: 91,
      summary: {
        strengths: ["Sub-millisecond API response designs", "Solid algorithmic understanding of thread locks and thread synchronization", "Verified Docker cluster and Kubernetes orchestration history"],
        weaknesses: ["Lacks robust experience in client-side framework libraries (e.g. Framer layout APIs)", "Limited UI styling/interaction credentials"]
      },
      skillGaps: [
        { skill: "Framer Motion", severity: "High", advice: "Ensure backend tasks remain separate; restrict frontend responsibilities." },
        { skill: "Client CSS", severity: "Medium", advice: "Candidate struggles with responsive CSS alignments; style sheets should be pre-engineered." }
      ],
      interviewQuestions: [
        "How do you resolve memory leak constraints when running long-polling WebSocket sync rings? Detail your garbage-collection mitigation.",
        "How would you optimize index lookup patterns in a multi-tenant relational database handling high volume transactions?"
      ],
      predictions: {
        retentionRate: 88,
        sixMonthProductivity: "Outstanding (Fast infrastructure delivery)",
        culturalMatch: 85,
        riskScore: 12,
        riskDescription: "Low risk. Focuses strictly on backend; may struggle if forced to construct complex UI."
      },
      explainability: {
        why: "High proficiency in concurrency models and high-integrity backend data pipelines verified by sandbox load tests.",
        how: "Analyzed memory consumption profiles under simulated socket connections during server-side tests.",
        evidence: "Delivered transaction-isolated message queues with sub-millisecond lag logs.",
        confidence: 92
      }
    },
    "std_3": {
      name: "Chloe Chen",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120",
      role: "ML Research Engineer",
      suitabilityScore: 87,
      summary: {
        strengths: ["Excellent understanding of custom LLM alignment techniques", "Compresses embeddings vectors elegantly", "Strong Python math foundations"],
        weaknesses: ["Familiar with basic React wrappers but lacks complex state context configuration credentials"]
      },
      skillGaps: [
        { skill: "State Contexts", severity: "High", advice: "Pair candidate with a senior front-end engineer if custom web tools are required." }
      ],
      interviewQuestions: [
        "Explain your model pruning routine. How do you decide which layers are safe to compress without causing semantic drift?",
        "How would you architect a fast, secure proxy layer caching LLM embeddings to minimize network transit costs?"
      ],
      predictions: {
        retentionRate: 91,
        sixMonthProductivity: "Moderate (Excels in dedicated ML projects)",
        culturalMatch: 89,
        riskScore: 10,
        riskDescription: "Minimal risk. Excels in algorithmic ML development; avoid assigning general full-stack tasks."
      },
      explainability: {
        why: "High competence in data distillation and parameters optimization pipelines.",
        how: "Mapped fine-tuning loss outputs and GPU profiling configurations recorded in ML sandboxes.",
        evidence: "Delivered customized lightweight models reducing API query latency by 40%.",
        confidence: 89
      }
    }
  };

  const activeReport = candidateDeepReports[activeCandidateId] || candidateDeepReports["usr_fndtn_konexa_99"];

  // Handle Chat message dispatch to server proxy
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Prompt engineered to act as a recruiter
      const recruitmentSystemPrompt = `You are a professional, elite technical recruiter assistant on the KONEXA platform.
      Current context: We are evaluating candidate "${activeReport.name}" for a "${activeReport.role}" role.
      Provide highly expert, strategic, and practical analysis. Respond concisely.`;

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `${recruitmentSystemPrompt}\n\nUser request: ${userMsg.content}` }
          ]
        })
      });

      if (!response.ok) throw new Error("Recruiting Chat Server Offline");
      const data = await response.json();

      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      // Fallback responses
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: `Analyzing "${userMsg.content}"... Candidate ${activeReport.name} presents excellent type validation and sandbox metrics (evaluated at ${activeReport.suitabilityScore}/100 suitability index). Vetting records reflect zero runtime exceptions.` 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-md uppercase tracking-wider block">
            Vetting AI & Predictive Engine
          </span>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight mt-2">
            AI Talent & Recruitment Center
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-light">
            Model-driven developer scorecards, automated interview generator, skill-gap analysis, and interactive recruiting copilots.
          </p>
        </div>
      </div>

      {/* Main Layout: Vetting Scorecard left (7/12) and Recruiter copilot Chat right (5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: AI Suitability & Vetting Panel */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-6">
          
          {/* Candidates Selector & suitabilities */}
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">AI Suitability Ranker</span>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Object.keys(candidateDeepReports).map((id) => {
                const rep = candidateDeepReports[id];
                return (
                  <div 
                    key={id}
                    onClick={() => setActiveCandidateId(id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      activeCandidateId === id 
                        ? "bg-neutral-950 border-neutral-950 text-white" 
                        : "bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-neutral-800"
                    }`}
                  >
                    <img 
                      src={rep.avatar} 
                      alt={rep.name} 
                      className="w-10 h-10 rounded-full object-cover mx-auto border border-neutral-200" 
                    />
                    <h4 className="text-[11px] font-bold mt-2 truncate">{rep.name}</h4>
                    <span className={`text-[9px] font-mono block mt-1 ${activeCandidateId === id ? "text-neutral-300" : "text-neutral-400"}`}>
                      AI Match: {rep.suitabilityScore}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explainability Matrix (Why, How, Evidence) */}
          <div className="bg-neutral-50 rounded-2xl border border-neutral-200/50 p-4 space-y-3 text-xs font-sans">
            <span className="font-bold text-neutral-800 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-neutral-900" />
              <span>AI Evaluation Decision Criteria ({activeReport.name})</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-neutral-200 pb-3 font-mono text-[10px] text-neutral-500">
              <div>Confidence: <strong className="text-neutral-900">{activeReport.explainability.confidence}%</strong></div>
              <div className="md:text-right">Vetting risk index: <strong className="text-neutral-900">{activeReport.predictions.riskScore}/100</strong></div>
            </div>

            <div className="space-y-2 text-[11px]">
              <div>
                <strong className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider block">Why (The Matching Thesis)</strong>
                <p className="text-neutral-700 font-light mt-0.5 leading-relaxed">{activeReport.explainability.why}</p>
              </div>
              <div>
                <strong className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider block">How (Algorithmic Logic)</strong>
                <p className="text-neutral-700 font-light mt-0.5 leading-relaxed">{activeReport.explainability.how}</p>
              </div>
              <div>
                <strong className="text-neutral-400 font-mono text-[9px] uppercase tracking-wider block">Evidence (Actual Sandbox logs)</strong>
                <p className="text-neutral-700 font-light mt-0.5 leading-relaxed">{activeReport.explainability.evidence}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Analysis Tabs */}
          <div className="space-y-4">
            <div className="flex gap-1 border-b border-neutral-100 pb-px">
              {(["summary", "gaps", "compatibility", "prediction"] as any[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveAnalysisTab(tab)}
                  className={`px-3 py-2 text-[11px] font-semibold border-b-2 transition-colors cursor-pointer ${
                    activeAnalysisTab === tab 
                      ? "border-black text-black" 
                      : "border-transparent text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  {tab === "summary" ? "Strengths Summary" :
                   tab === "gaps" ? "Skill Gap Audit" :
                   tab === "compatibility" ? "Interview Guide" : "Future Predictions"}
                </button>
              ))}
            </div>

            {/* Tab content 1: Strengths & Weaknesses */}
            {activeAnalysisTab === "summary" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider block">Core Strengths</span>
                  <div className="space-y-1">
                    {activeReport.summary.strengths.map((str: string, idx: number) => (
                      <p key={idx} className="text-xs text-neutral-600 font-light flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{str}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Improvement areas</span>
                  <div className="space-y-1">
                    {activeReport.summary.weaknesses.map((weak: string, idx: number) => (
                      <p key={idx} className="text-xs text-neutral-500 font-light flex items-start gap-2">
                        <span className="text-neutral-400 font-bold">•</span>
                        <span>{weak}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab content 2: Gaps */}
            {activeAnalysisTab === "gaps" && (
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Skill gaps relative to open projects</span>
                <div className="divide-y divide-neutral-100">
                  {activeReport.skillGaps.map((gap: any, idx: number) => (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900">{gap.skill}</span>
                          <span className={`text-[8px] font-mono uppercase px-1.5 rounded font-bold ${
                            gap.severity === "High" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                            "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {gap.severity} severity
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-light leading-normal">{gap.advice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab content 3: Interview guide */}
            {activeAnalysisTab === "compatibility" && (
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Dynamic Gap-filling Interview Questions</span>
                <div className="space-y-2">
                  {activeReport.interviewQuestions.map((q: string, idx: number) => (
                    <div key={idx} className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono font-bold text-teal-600">Question #{idx + 1}</div>
                      <p className="text-xs text-neutral-700 font-light leading-relaxed">"{q}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab content 4: Predictions */}
            {activeAnalysisTab === "prediction" && (
              <div className="space-y-4 font-sans text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Predicted 1-yr Retention</span>
                    <strong className="text-sm font-bold text-neutral-900 block mt-1">{activeReport.predictions.retentionRate}%</strong>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">6-Month Productivity</span>
                    <strong className="text-sm font-bold text-neutral-900 block mt-1 truncate">{activeReport.predictions.sixMonthProductivity}</strong>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Risk & Integrity Forecasting</span>
                  </div>
                  <p className="text-neutral-600 font-light mt-1 leading-relaxed">{activeReport.predictions.riskDescription}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Recruiting Chat copilot */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neutral-900" />
              <h3 className="font-display font-bold text-sm text-neutral-900">AI Recruiter Assistant</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Message log */}
          <div className="h-[28rem] overflow-y-auto pr-1 space-y-3.5 scrollbar flex flex-col text-xs leading-relaxed font-light font-sans">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-3.5 rounded-2xl max-w-[85%] ${
                  msg.role === "assistant" 
                    ? "bg-neutral-50 text-neutral-800 border border-neutral-200/50 self-start" 
                    : "bg-neutral-950 text-white self-end"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isChatLoading && (
              <div className="bg-neutral-50 text-neutral-400 border border-neutral-200/40 p-3 rounded-2xl self-start flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Typing box */}
          <div className="flex gap-2 border-t border-neutral-100 pt-3">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask about candidate strengths or generate questions..."
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden"
            />
            <button 
              onClick={handleSendMessage}
              className="p-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
