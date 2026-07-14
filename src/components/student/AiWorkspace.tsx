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
  const { success, info } = useToast();

  const coaches: Coach[] = [
    { id: "career", name: "AI Career Coach", desc: "Avanaced general engineering career pathing", greet: "Hello! I am your AI Career Coach. Based on your target vision to secure high-trust Senior TypeScript Systems roles, let's lay out your next tactical application steps.", icon: Briefcase, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { id: "resume", name: "AI Resume Reviewer", desc: "Specifically audits ATS compliance and keywords", greet: "Resume Reviewer active. I have loaded your biography and academic files. Let's optimize your action verb densities to exceed the 90% ATS threshold.", icon: Award, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { id: "portfolio", name: "AI Portfolio Reviewer", desc: "Ensures portfolio fields meet verified weights", greet: "Portfolio Reviewer initialized. Your profile integrity score is currently at 85%. Connecting your GitHub commit stream will boost matching speeds with Vercel.", icon: Sparkles, color: "text-teal-600 bg-teal-50 border-teal-100" },
    { id: "interview", name: "AI Interview Coach", desc: "Simulates live mock interview loops and tests", greet: "Welcome to mock interview mode! I will pose React 19 concurrent state performance questions. Reply below, and I will grade your answers immediately.", icon: Bot, color: "text-purple-600 bg-purple-50 border-purple-100" },
    { id: "learning", name: "AI Learning Coach", desc: "Proposes course pathways based on missing skills", greet: "Learning Advisor active. You have targeted 'WebSockets Sync Systems'. I suggest starting Framer Core's 8-hour WebSocket synchronization masterclass.", icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { id: "project", name: "AI Project Advisor", desc: "Guides design pattern structures and libraries", greet: "Project Advisor online. Ready to review sandbox main.tsx modules. I suggest using recursive memoization coordinates inside your SVG trees.", icon: Brain, color: "text-rose-600 bg-rose-50 border-rose-100" },
    { id: "skill", name: "AI Skill Advisor", desc: "Maps competency vectors to market demands", greet: "Skill Advisor ready. TypeScript and React 19 are your verified pillars. Let's add full-stack SaaS API credentials to unlock high-yield contract bids.", icon: Target, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { id: "productivity", name: "AI Productivity Coach", desc: "Evaluates active streak logs and habits", greet: "Productivity Coach engaged. You are on an active 7-day streak! Let's schedule a daily 15-minute code submission habit to maximize trust-ranks.", icon: Clock, color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
    { id: "weekly", name: "AI Weekly Review", desc: "Collates weekly metrics into structured digests", greet: "Here is your custom AI Weekly review. You completed 2 core milestones, increased trust score by +4, and unlocked the Alpha Builder achievement badge!", icon: Activity, color: "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100" }
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

      if (!response.ok) throw new Error("Proxy error");
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      // Graceful local fallbacks
      setTimeout(() => {
        let fallbackReply = `I am analyzing your live KONEXA profile. Your verified skills list includes: ${studentProfile?.skills?.join(", ") || "TypeScript, React 19"}. To maximize your progress in ${activeCoach.name}, let's build a concrete code submission plan to verify skills directly in the sandbox evaluation marketplace!`;
        setMessages(prev => [...prev, { role: "assistant", content: fallbackReply }]);
        setTyping(false);
      }, 1000);
    } finally {
      if (!typing) {
        // Will set typing false in timeout if caught
      }
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
            Access 9 highly specialized development and career coaches. Powered by live context data from your active portfolio and code sandbox evaluations.
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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
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
