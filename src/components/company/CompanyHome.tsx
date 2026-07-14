import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  TrendingUp, Briefcase, Users, CheckCircle2, Clock, Sparkles, 
  ShieldCheck, Calendar, Bookmark, FileText, Search, Building, 
  Check, X, ChevronRight, Play, Award, Zap, Star, ArrowUpRight,
  MoreHorizontal, Plus, MapPin, Bell
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface CompanyHomeProps {
  onNavigate: (tabId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export default function CompanyHome({ onNavigate, onSelectStudent }: CompanyHomeProps) {
  const { projects, applications, studentProfile, companyProfile } = useApp();
  const { success, info } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecommendation, setSelectedRecommendation] = useState<any | null>(null);

  // Dynamic Metrics
  const openProjectsCount = projects.filter(p => p.status === "open").length;
  const pendingSubmissionsCount = applications.filter(a => a.status === "submitted" || a.status === "reviewed").length;
  
  // Real-time KPIs
  const hiringSuccessRate = 92;
  const projectCompletionRate = 88;
  const avgTrustScore = studentProfile ? studentProfile.trustScore : 84;
  const avgPerformanceScore = 91;
  const avgAiMatchScore = 86;

  // Recommended Students data
  const recommendedStudents = [
    {
      id: "usr_fndtn_konexa_99",
      name: studentProfile?.name || "Alex Rivera",
      role: "Full-Stack Engineer",
      university: studentProfile?.university || "Seoul National University",
      skills: studentProfile?.skills || ["React", "TypeScript", "Node.js"],
      trustScore: studentProfile?.trustScore || 82,
      performanceScore: 94,
      matchScore: 96,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
      why: "Exceptional SVG render profiling submission and solid TypeScript foundation.",
      how: "Cross-referenced Sandbox metrics against high-performance vector requirements.",
      evidence: "Completed 'Vite Performance Optimizer' challenge in 3.5 hours with zero rendering degradation.",
      confidence: 98
    },
    {
      id: "std_2",
      name: "Min-jun Kim",
      role: "Backend Platform Engineer",
      university: "KAIST",
      skills: ["Go", "gRPC", "Redis", "Docker", "PostgreSQL"],
      trustScore: 89,
      performanceScore: 92,
      matchScore: 91,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
      why: "Strong algorithmic complexity score and asynchronous queue designs.",
      how: "System matching based on database transaction isolation profiling.",
      evidence: "Delivered highly concurrent message sync server under sub-millisecond loads.",
      confidence: 93
    },
    {
      id: "std_3",
      name: "Chloe Chen",
      role: "ML Research Engineer",
      university: "National University of Singapore",
      skills: ["PyTorch", "Transformers", "Python", "FastAPI"],
      trustScore: 78,
      performanceScore: 88,
      matchScore: 87,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120",
      why: "Expertise in token pruning, model distillation and fast embeddings.",
      how: "Compared academic ML achievements and live custom endpoint projects.",
      evidence: "Fine-tuned lightweight LLaMA parameters with 40% latency reduction in sandbox environment.",
      confidence: 89
    }
  ];

  // Quick Tasks
  const [tasks, setTasks] = useState([
    { id: "1", text: "Review 'SVG Optimizer' code submissions", done: false, priority: "high" },
    { id: "2", text: "Approve budget for new Smart Calendar challenge", done: true, priority: "medium" },
    { id: "3", text: "Confirm meeting with KAIST partnership office", done: false, priority: "medium" },
    { id: "4", text: "Generate contract draft for Alex Rivera conversion", done: false, priority: "high" }
  ]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    success("Task Updated", "Task status synchronized in real-time.");
  };

  const handleBookmarkItem = (type: string, title: string) => {
    success("Saved to Bookmarks", `Successfully bookmarked ${type}: "${title}".`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            KONEXA Enterprise OS
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            {companyProfile?.companyName || "Horizon Labs"} Workspace
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Project-based recruitment, real-time trust metrics, and automated decision engineering.
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onNavigate("create-challenge")}
            className="h-10 px-4 bg-black text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Challenge</span>
          </button>
          <button 
            onClick={() => onNavigate("ai-workspace")}
            className="h-10 px-4 bg-white border border-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-neutral-900" />
            <span>AI Workforce</span>
          </button>
        </div>
      </div>

      {/* 2. Real-time KPI Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Hiring Success</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-display font-black text-neutral-900 mt-2">{hiringSuccessRate}%</div>
          <p className="text-[9px] text-neutral-400 mt-1">Based on project conversions</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Project Completion</span>
            <CheckCircle2 className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="text-2xl font-display font-black text-neutral-900 mt-2">{projectCompletionRate}%</div>
          <p className="text-[9px] text-neutral-400 mt-1">Challenge success benchmark</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avg Trust Score</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-display font-black text-neutral-900 mt-2">{avgTrustScore}/100</div>
          <p className="text-[9px] text-neutral-400 mt-1">Live peer-evaluated status</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avg Performance</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-display font-black text-neutral-900 mt-2">{avgPerformanceScore}/100</div>
          <p className="text-[9px] text-neutral-400 mt-1">Evaluated execution metrics</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Avg AI Match</span>
            <Sparkles className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="text-2xl font-display font-black text-neutral-900 mt-2">{avgAiMatchScore}%</div>
          <p className="text-[9px] text-neutral-400 mt-1">Skill & compatibility index</p>
        </div>
      </div>

      {/* 3. Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Projects, recommended students, AI pipeline (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Open Projects summary */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-neutral-900">Active Technical Projects</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Coding milestones active for remote talent evaluation.</p>
              </div>
              <button 
                onClick={() => onNavigate("company-projects")}
                className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-0.5"
              >
                <span>View All ({projects.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-neutral-100">
              {projects.slice(0, 3).map((p) => {
                const subCount = applications.filter(a => a.projectId === p.id).length;
                return (
                  <div key={p.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 truncate">{p.title}</span>
                        <span className="text-[9px] font-mono bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div className="text-xs">
                        <span className="text-neutral-400">Reward: </span>
                        <strong className="text-neutral-900">{p.reward}</strong>
                      </div>
                      <div className="text-xs font-mono text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-xl border border-neutral-200/50">
                        {subCount} submissions
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Hiring Recommendations & Talent intelligence (Evidence-based evaluation) */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-neutral-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-neutral-900" />
                  <span>AI Talent Intelligence & Match Scorecard</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">High-integrity match predictions cross-referencing sandbox evidence.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedStudents.map((rs) => (
                <div 
                  key={rs.id} 
                  className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-300 transition-all cursor-pointer"
                  onClick={() => setSelectedRecommendation(rs)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <img 
                          src={rs.avatar} 
                          alt={rs.name} 
                          className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0" 
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 truncate">{rs.name}</h4>
                          <span className="text-[10px] text-neutral-400 truncate block">{rs.university}</span>
                        </div>
                      </div>
                      <div className="p-1.5 bg-neutral-900 text-white font-mono font-black text-xs rounded-xl flex items-center justify-center shrink-0">
                        {rs.matchScore}%
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {rs.skills.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="text-[9px] bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-600">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {rs.why}
                    </p>
                  </div>

                  <div className="border-t border-neutral-200/50 mt-4 pt-3 flex justify-between items-center text-[10px]">
                    <span className="text-neutral-400 font-mono">Confidence: <strong>{rs.confidence}%</strong></span>
                    <span className="text-neutral-900 font-bold hover:underline flex items-center gap-0.5">
                      <span>Review Scorecard</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Recommendation Explainability Modal/Drawer (In-page) */}
            {selectedRecommendation && (
              <div className="bg-neutral-950 text-white rounded-2xl p-5 space-y-4 border border-neutral-800 animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedRecommendation.avatar} 
                      alt={selectedRecommendation.name} 
                      className="w-12 h-12 rounded-full object-cover border border-neutral-700" 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-base">{selectedRecommendation.name}</h4>
                        <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                          AI Top Match
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{selectedRecommendation.role} • {selectedRecommendation.university}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedRecommendation(null)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-neutral-800 py-4 font-mono text-xs">
                  <div className="space-y-1">
                    <span className="text-neutral-500 uppercase text-[9px] block">Matching Confidence</span>
                    <div className="text-lg font-bold text-white">{selectedRecommendation.confidence}%</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-neutral-500 uppercase text-[9px] block">Verified Trust Score</span>
                    <div className="text-lg font-bold text-blue-400">{selectedRecommendation.trustScore}/100</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-neutral-500 uppercase text-[9px] block">Performance Index</span>
                    <div className="text-lg font-bold text-amber-400">{selectedRecommendation.performanceScore}/100</div>
                  </div>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-400 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Why (Hiring Match Hypothesis)</span>
                    </span>
                    <p className="text-neutral-200 font-light leading-relaxed">{selectedRecommendation.why}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-neutral-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-blue-400" />
                      <span>How (Computational Alignment)</span>
                    </span>
                    <p className="text-neutral-200 font-light leading-relaxed">{selectedRecommendation.how}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-neutral-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Evidence (Sandbox Execution Log)</span>
                    </span>
                    <p className="text-neutral-200 font-light leading-relaxed">{selectedRecommendation.evidence}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    onClick={() => {
                      onSelectStudent(selectedRecommendation.id);
                      onNavigate("student-review");
                    }}
                    className="px-4 py-2 bg-white text-black text-xs font-semibold rounded-xl hover:bg-neutral-100 transition-all cursor-pointer"
                  >
                    Examine Student Profile
                  </button>
                  <button 
                    onClick={() => {
                      success("Hiring Pipeline Updated", `${selectedRecommendation.name} shortlisted for Screening.`);
                      onNavigate("hiring-pipeline");
                    }}
                    className="px-4 py-2 bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-semibold rounded-xl hover:bg-neutral-700 transition-all cursor-pointer"
                  >
                    Shortlist Candidate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Today's Tasks, Saved items, Calendar (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Today's Tasks widget */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-bold text-base text-neutral-900">Today's Operating Tasks</h3>
              <p className="text-xs text-neutral-400 mt-0.5 font-light">Workspace tasks and reviewer action items.</p>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 rounded-xl border text-xs flex gap-3 items-center transition-all cursor-pointer ${
                    task.done 
                      ? "bg-neutral-50/50 border-neutral-200 text-neutral-400 line-through" 
                      : "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-800"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                    task.done 
                      ? "bg-black border-black text-white" 
                      : "border-neutral-300 bg-white"
                  }`}>
                    {task.done && <Check className="w-3 h-3" />}
                  </div>
                  <span className="flex-1 min-w-0 truncate font-light text-[11px]">{task.text}</span>
                  <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                    task.priority === "high" 
                      ? "bg-rose-50 text-rose-600 border border-rose-100" 
                      : "bg-neutral-100 text-neutral-500"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hiring & Partnership Calendar */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-display font-bold text-base text-neutral-900 flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-neutral-900" />
                <span>Hiring & Partnership Calendar</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5 font-light font-sans">Upcoming interviews, milestones & syncs.</p>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-neutral-900 text-[11px]">
                  <span>Alex Rivera - Final Verification</span>
                  <span className="text-neutral-400 font-mono font-light">July 10, 10:00 AM</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal font-light">Technical review chat with Framer Design Lead mentor.</p>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-neutral-900 text-[11px]">
                  <span>Vite core challenge milestone check</span>
                  <span className="text-neutral-400 font-mono font-light">July 12, 11:59 PM</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal font-light">Sandbox automatic testing runs compiled and matched.</p>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-neutral-900 text-[11px]">
                  <span>KAIST Partnership Session</span>
                  <span className="text-neutral-400 font-mono font-light">July 15, 2:00 PM</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal font-light">Reviewing corporate challenge deployment to university portal.</p>
              </div>
            </div>
          </div>

          {/* Saved bookmarks system preview */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-neutral-900 flex items-center gap-1.5">
                <Bookmark className="w-4.5 h-4.5 text-neutral-900" />
                <span>Bookmarks & Saved Hub</span>
              </h3>
              <button 
                onClick={() => onNavigate("bookmark-system")}
                className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100/50 transition-colors">
                <span className="font-medium text-neutral-700">Alex Rivera (Student Profile)</span>
                <span className="font-mono text-neutral-400 text-[9px]">Student</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100/50 transition-colors">
                <span className="font-medium text-neutral-700">Seoul National University (Talent Pool)</span>
                <span className="font-mono text-neutral-400 text-[9px]">University</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100/50 transition-colors">
                <span className="font-medium text-neutral-700">Vite Performance Optimizer (Challenge)</span>
                <span className="font-mono text-neutral-400 text-[9px]">Project</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
