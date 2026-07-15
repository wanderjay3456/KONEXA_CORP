import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Project, ApplicationStatus, ProjectDifficulty } from "../../types";
import { 
  Code, 
  Search, 
  MapPin, 
  TrendingUp, 
  Briefcase, 
  Cpu, 
  Clock, 
  Send, 
  CheckCircle, 
  X, 
  Github, 
  Sparkles, 
  ChevronRight,
  ListFilter,
  User,
  Award,
  FileText,
  ShieldCheck,
  Check
} from "lucide-react";
import { Modal } from "../ui/Dialogs";
import { useToast } from "../ui/Toast";
import { motion } from "motion/react";
import ProfileSettingsView from "../profile/ProfileSettingsView";
import GoogleChatHub from "../chat/GoogleChatHub";

// Student Ecosystem Subcomponents
import CareerDashboard from "../student/CareerDashboard";
import ProjectMarketplace from "../student/ProjectMarketplace";
import ProjectWorkspace from "../student/ProjectWorkspace";
import ResumeBuilder from "../student/ResumeBuilder";
import CareerRoadmap from "../student/CareerRoadmap";
import SkillCenter from "../student/SkillCenter";
import AchievementCenter from "../student/AchievementCenter";
import AiWorkspace from "../student/AiWorkspace";
import MessagingCenter from "../student/MessagingCenter";

interface StudentDashboardProps {
  activeTab: string;
  onNavigate: (tabId: string) => void;
}

export default function StudentDashboard({ activeTab, onNavigate }: StudentDashboardProps) {
  const { 
    projects, 
    applications, 
    applyToProject, 
    studentProfile, 
    updateStudentProfile 
  } = useApp();
  const { success, info } = useToast();

  // Component state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Submit code modal state
  const [submitCode, setSubmitCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Edit Form State
  const [profileForm, setProfileForm] = useState<Partial<typeof studentProfile>>({});
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  // Sync profile form once when profile is available
  React.useEffect(() => {
    if (studentProfile && !isFormInitialized) {
      setProfileForm({ ...studentProfile });
      setIsFormInitialized(true);
    }
  }, [studentProfile, isFormInitialized]);

  // AI Copilot state
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: "Hello! I am **KONEXA AI**. I can help you review system requirements, write clean TypeScript types, or debug your solution before submitting it for cloud evaluation. What are we building today?" }
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty = filterDifficulty === "All" || p.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const handleApply = async () => {
    if (!selectedProject) return;
    if (!submitCode.trim()) {
      info("No code written", "Write or paste your code solution inside the editor.");
      return;
    }
    
    setIsSubmitting(true);
    setSelectedProject(null);
    
    // Call Context apply logic
    await applyToProject(selectedProject.id, submitCode);
    
    setIsSubmitting(false);
    setSubmitCode("");
  };

  const handleSendToCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim() || isCopilotTyping) return;

    const userMsg = { role: "user", content: copilotInput };
    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotInput("");
    setIsCopilotTyping(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...copilotMessages, userMsg] })
      });

      if (!response.ok) {
        throw new Error("Chat proxy error");
      }

      const data = await response.json();
      setCopilotMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setCopilotMessages(prev => [...prev, { role: "assistant", content: "I encountered a minor connection issue while syncing with my LLM core server. Please verify that your `GEMINI_API_KEY` is loaded and try again!" }]);
    } finally {
      setIsCopilotTyping(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name?.trim()) {
      info("Validation error", "Display Name is required.");
      return;
    }
    await updateStudentProfile(profileForm);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const current = profileForm.skills || [];
    if (current.includes(newSkill.trim())) return;
    const updated = [...current, newSkill.trim()];
    setProfileForm(prev => ({ ...prev, skills: updated }));
    updateStudentProfile({ skills: updated });
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = (profileForm.skills || []).filter(s => s !== skillToRemove);
    setProfileForm(prev => ({ ...prev, skills: updated }));
    updateStudentProfile({ skills: updated });
  };

  if (activeTab === "student-dashboard") {
    return <CareerDashboard onNavigate={onNavigate} />;
  }
  if (activeTab === "project-marketplace") {
    return <ProjectMarketplace />;
  }
  if (activeTab === "workspace") {
    return <ProjectWorkspace onNavigate={onNavigate} />;
  }
  if (activeTab === "resume-builder") {
    return <ResumeBuilder />;
  }
  if (activeTab === "career-roadmap") {
    return <CareerRoadmap />;
  }
  if (activeTab === "skill-center") {
    return <SkillCenter />;
  }
  if (activeTab === "achievement-center") {
    return <AchievementCenter />;
  }
  if (activeTab === "ai-workspace") {
    return <AiWorkspace />;
  }
  if (activeTab === "messaging") {
    return <MessagingCenter />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6">
      
      {/* 1. CHALLENGES TAB */}
      {activeTab === "challenges" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          {/* Main Column (8/12): Challenges List & Search */}
          <div className="lg:col-span-8 space-y-6">
            {/* Dashboard Welcome Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                  Clean Architecture Model
                </span>
                <h2 className="font-display font-bold text-3xl text-neutral-900 tracking-tight">
                  Core Foundation Layer
                </h2>
                <p className="font-sans text-xs text-neutral-400 mt-1">
                  Complete real engineering milestones. Real code builds direct hiring trust.
                </p>
              </div>
              <div className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold uppercase tracking-wider">
                Production Ready
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search challenges, keywords, stack components..."
                  className="w-full bg-white border border-neutral-200 rounded-xl py-2 pl-9 pr-4 text-xs font-sans focus:outline-hidden focus:border-black/60 shadow-xs"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-neutral-400" />
                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className="bg-white border border-neutral-200 rounded-xl py-2 px-3 text-xs font-sans text-neutral-600 focus:outline-hidden focus:border-black/60"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Grid of Challenges */}
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center bg-white border border-neutral-200 rounded-2xl space-y-3 shadow-sm">
                <Code className="w-8 h-8 text-neutral-300 mx-auto" />
                <h3 className="font-display font-medium text-sm text-neutral-600">No active challenges found</h3>
                <p className="font-sans text-xs text-neutral-400 max-w-sm mx-auto">
                  No corporate listings matched your filters. Clear filters or check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredProjects.map((p) => (
                  <div 
                    key={p.id}
                    className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-premium hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                            {p.companyName}
                          </span>
                          <h3 className="font-display font-bold text-lg text-neutral-900 group-hover:text-black transition-colors">
                            {p.title}
                          </h3>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-sans font-bold uppercase tracking-wider border ${
                          p.difficulty === ProjectDifficulty.HARD ? "bg-rose-50 text-rose-600 border-rose-100" :
                          p.difficulty === ProjectDifficulty.MEDIUM ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-teal-50 text-teal-600 border-teal-100"
                        }`}>
                          {p.difficulty}
                        </span>
                      </div>

                      <p className="font-sans text-xs text-neutral-500 leading-relaxed font-light line-clamp-3">
                        {p.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {p.tags.map(t => (
                          <span key={t} className="text-[10px] font-sans font-medium text-neutral-500 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-lg">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="border-t border-neutral-100 mt-5 pt-4 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                        {p.reward}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedProject(p);
                          const requirementsComments = (p.requirements || [])
                            .map(req => `  // - ${req}`)
                            .join("\n");
                          
                          // Preseed mock clean starter code for evaluation test
                          setSubmitCode(`// KONEXA Sandbox IDE Workspace
// Write your custom solution TypeScript module below.

import React from 'react';

export function ${p.title.replace(/[^a-zA-Z0-9]/g, "")}() {
  // Solutions Checklist:
${requirementsComments}

  return (
    <div className="p-6 bg-white rounded-2xl border border-neutral-200">
      <h2 className="text-xl font-bold text-neutral-900">${p.title} Solution</h2>
      <p className="text-sm text-neutral-500 mt-2">Built for ${p.companyName}</p>
    </div>
  );
}`);
                        }}
                        className="px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Claim Challenge</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Performance Footer row */}
            <div className="flex gap-4 border-t border-neutral-200 pt-6">
              <div className="flex-1 bg-white border border-neutral-200 rounded-xl p-3 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1">API Performance</div>
                <div className="text-xl font-mono font-bold text-neutral-900">12ms</div>
              </div>
              <div className="flex-1 bg-white border border-neutral-200 rounded-xl p-3 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Auth Latency</div>
                <div className="text-xl font-mono font-bold text-neutral-900">48ms</div>
              </div>
              <div className="flex-1 bg-white border border-neutral-200 rounded-xl p-3 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1">Vector Search</div>
                <div className="text-xl font-mono font-bold text-green-600 underline">Optimized</div>
              </div>
            </div>
          </div>

          {/* Side Column (4/12): Bento status grids */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. Dark Bento Card: AI Placement Alignment */}
            <div className="bg-black text-white rounded-2xl p-6 flex flex-col shadow-lg">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  AI Alignment Index
                </span>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              </div>
              <h2 className="text-2xl font-bold font-display mt-2">Placement Matching</h2>
              
              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="text-neutral-400">Match Accuracy</span>
                  <span className="font-mono text-neutral-200 font-semibold">94% Confidence</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="w-[94%] h-full bg-white rounded-full"></div>
                </div>

                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="text-neutral-400">Skill Coverage</span>
                  <span className="font-mono text-neutral-200 font-semibold">88% (Frontend/SaaS)</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div className="w-[88%] h-full bg-white rounded-full"></div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10">
                <div className="p-4 bg-white/15 rounded-xl backdrop-blur-md border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-neutral-300 mb-1">Genesis Matchmaker</div>
                  <div className="text-xs leading-relaxed text-neutral-200 font-sans">
                    Autonomous matchmaking agent found 3 high-affinity corporate sponsor matches this week.
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Blue Bento Card: Trust Ledger Verification */}
            <div className="bg-[#EBF5FF] border border-blue-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div className="text-xs font-bold text-blue-800 uppercase tracking-widest">
                Verification Ledger
              </div>
              <div className="space-y-4 mt-3">
                <div>
                  <div className="text-4xl font-bold text-blue-900 font-display">Lv. 3</div>
                  <div className="text-xs text-blue-700 mt-1 font-semibold">Trust Verification level</div>
                </div>
                <p className="text-xs leading-relaxed text-blue-800/80 font-sans">
                  Academic enrollment, GitHub historic contributions, and core identity validation verified. Unlock priority access to elite enterprise challenges.
                </p>
              </div>
              <div className="mt-6 py-2 px-3 bg-white/50 rounded-lg border border-blue-200 text-[10px] text-blue-900 font-bold uppercase tracking-widest text-center">
                MFA Passport Status: Verified
              </div>
            </div>

            {/* 3. Academic Criteria / Skills Card */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 block">
                Academics & Skills
              </span>
              <h3 className="text-lg font-bold font-display text-neutral-900 mb-4 text-balance">Mastery Indices</h3>
              <div className="space-y-3 font-sans">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-medium text-neutral-600">
                    <span>Clean Code Delivery</span>
                    <span className="font-mono font-bold text-neutral-900">92%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full w-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full w-[92%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-medium text-neutral-600">
                    <span>Performance Optimization</span>
                    <span className="font-mono font-bold text-neutral-900">95%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full w-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full w-[95%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-medium text-neutral-600">
                    <span>System Architecture</span>
                    <span className="font-mono font-bold text-neutral-900">85%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full w-full overflow-hidden">
                    <div className="bg-slate-400 h-full rounded-full w-[85%]"></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-neutral-100">
                  <div className="text-[10px] text-neutral-400 font-mono tracking-tight">
                    Audit updated based on last 4 sandbox sessions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUBMIT CHALLENGE SCREEN (MODAL VIEW) */}
      <Modal 
        isOpen={selectedProject !== null} 
        onClose={() => setSelectedProject(null)} 
        title={selectedProject?.title || "SaaS Solution Workspace"}
      >
        <div className="space-y-5">
          <div>
            <span className="text-[10px] font-sans font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
              AI-Powered Real-Time Evaluator Included
            </span>
            <p className="text-xs font-sans text-neutral-500 mt-2">
              Your code will be evaluated immediately by the Gemini server proxy to test logic, structures, and types.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-display font-semibold text-neutral-800">Milestone Requirements:</h4>
            <ul className="list-disc pl-4 space-y-1">
              {(selectedProject?.requirements || []).map((r, i) => (
                <li key={i} className="text-xs font-sans text-neutral-500">{r}</li>
              ))}
            </ul>
          </div>

          {/* Code IDE Sandbox */}
          <div className="space-y-1.5">
            <label className="text-xs font-display font-medium text-neutral-700">Code Editor Solution</label>
            <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-sm bg-neutral-950">
              <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>main.tsx</span>
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              </div>
              <textarea
                value={submitCode}
                onChange={(e) => setSubmitCode(e.target.value)}
                rows={10}
                className="w-full bg-transparent text-neutral-100 p-4 font-mono text-xs focus:outline-hidden leading-relaxed resize-y"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setSelectedProject(null)}
              className="px-4 py-2 rounded-xl border border-neutral-200/80 text-neutral-600 hover:bg-neutral-50 font-sans text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-sans text-xs font-medium cursor-pointer shadow-md shadow-teal-600/10"
            >
              Submit to Cloud Review
            </button>
          </div>
        </div>
      </Modal>

      {/* 3. APPLICATIONS TAB */}
      {activeTab === "applications" && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
              Hiring Pipeline Tracking
            </span>
            <h2 className="font-display font-bold text-2xl text-neutral-900 tracking-tight">
              My Sandbox Submissions
            </h2>
            <p className="font-sans text-xs text-neutral-400 mt-1">
              Track progress, view real-time scorecards, and review Gemini engineering evaluations.
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center bg-white border border-neutral-200 rounded-2xl space-y-3 shadow-sm">
              <Briefcase className="w-8 h-8 text-neutral-300 mx-auto" />
              <h3 className="font-display font-semibold text-sm text-neutral-600">No submissions found</h3>
              <p className="font-sans text-xs text-neutral-400">
                Claim a challenge, solve the requirements, and submit your code to begin.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-premium space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                        SaaS Verification Completed
                      </span>
                      <h3 className="font-display font-bold text-base text-neutral-900">
                        {app.projectTitle}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono font-medium text-neutral-400">
                          SUBMITTED: {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      {app.score > 0 && (
                        <span className="text-xs font-mono font-bold text-black bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-lg">
                          Score: {app.score}/100
                        </span>
                      )}
                      <span className={`text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        app.status === ApplicationStatus.APPROVED ? "bg-teal-50 text-teal-600 border-teal-100" :
                        app.status === ApplicationStatus.REJECTED ? "bg-rose-50 text-rose-600 border-rose-100" :
                        app.status === ApplicationStatus.REVIEWED ? "bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse" :
                        "bg-neutral-50 text-neutral-600 border-neutral-200"
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {/* Feedback summary */}
                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-xs font-sans text-neutral-700 leading-relaxed whitespace-pre-line space-y-1.5">
                    <div className="font-display font-bold text-neutral-900 text-[10px] uppercase tracking-widest">
                      Review Diagnostics
                    </div>
                    <p className="font-light">{app.feedback}</p>
                  </div>

                  {/* Accordion Solution Preview */}
                  <details className="group">
                    <summary className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest hover:text-black cursor-pointer select-none">
                      [+] View submitted code block
                    </summary>
                    <pre className="bg-black text-neutral-200 text-xs p-4 rounded-xl font-mono leading-relaxed mt-2 overflow-x-auto max-h-48 scrollbar">
                      {app.codeSubmission}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. AI SPEC COPILOT TAB */}
      {activeTab === "ai-copilot" && (
        <div className="h-[calc(100vh-140px)] flex flex-col justify-between max-w-4xl bg-white border border-neutral-200 rounded-2xl shadow-premium overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0 border border-neutral-800 shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-neutral-900">
                  KONEXA AI Developer Copilot
                </h3>
                <span className="text-[9px] text-neutral-400 font-mono font-bold block mt-0.5 uppercase tracking-wider">
                  model: gemini-3.5-flash
                </span>
              </div>
            </div>
          </div>

          {/* Chat scrollable pane */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar">
            {copilotMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.role === "user" 
                    ? "bg-neutral-100 text-neutral-600 border-neutral-200/50" 
                    : "bg-teal-50 text-teal-600 border-teal-100/50"
                }`}>
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                </div>

                <div className={`p-4 rounded-2xl text-xs font-sans leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-neutral-900 text-white rounded-tr-none"
                    : "bg-neutral-50 border border-neutral-200/40 text-neutral-700 rounded-tl-none font-light"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isCopilotTyping && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 border border-teal-100/50 flex items-center justify-center shrink-0">
                  <Cpu className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="bg-neutral-50 border border-neutral-200/40 p-4 rounded-2xl rounded-tl-none text-xs font-sans text-neutral-400">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendToCopilot} className="p-4 border-t border-neutral-100 flex gap-2">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              placeholder="Ask anything about architecture, TypeScript typings, hooks, or challenge specs..."
              className="flex-1 bg-neutral-50 border border-neutral-200/80 rounded-xl px-4 py-2 text-xs font-sans focus:outline-hidden focus:border-teal-500/60"
            />
            <button
              type="submit"
              disabled={isCopilotTyping || !copilotInput.trim()}
              className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-neutral-100 disabled:text-neutral-300 text-white flex items-center justify-center cursor-pointer shadow-sm shadow-teal-600/10 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 4b. GOOGLE CHAT & MEET HUB TAB */}
      {activeTab === "google-chat" && (
        <GoogleChatHub />
      )}

      {/* 5. STUDENT PORTFOLIO / PROFILE TAB WITH COMPLETION ENGINE */}
      {activeTab === "profile" && studentProfile && (() => {
        // Real-time Profile Completion Engine calculation
        const getProfileCompletion = () => {
          let score = 0;
          const items = [];
          
          // 1. Basic Info: Legal Name, Country, Timezone, emergency contact (+15%)
          let basicCount = 0;
          if (studentProfile?.name) basicCount += 1;
          if (studentProfile?.preferredName) basicCount += 1;
          if (studentProfile?.timezone) basicCount += 1;
          if (studentProfile?.currentCountry) basicCount += 1;
          if (studentProfile?.emergencyContact) basicCount += 1;
          const basicWeight = Math.round((basicCount / 5) * 15);
          score += basicWeight;
          items.push({
            label: "Profile Identity Settings",
            weight: 15,
            completed: basicCount === 5,
            boost: "+15%",
            desc: "Complete basic personal details, country coordinates & timezone offsets."
          });

          // 2. Resume Upload (+25%)
          const resumeCompleted = !!studentProfile?.resumeUrl;
          if (resumeCompleted) score += 25;
          items.push({
            label: "Resume Upload",
            weight: 25,
            completed: resumeCompleted,
            boost: "+25%",
            desc: "Attach a verified PDF resume for our Gemini model to index."
          });

          // 3. GitHub connected (+20%)
          const githubCompleted = !!studentProfile?.github && studentProfile.github !== "https://github.com";
          if (githubCompleted) score += 20;
          items.push({
            label: "GitHub Account Integration",
            weight: 20,
            completed: githubCompleted,
            boost: "+20%",
            desc: "Link your verified GitHub repository to enable autonomous code grading."
          });

          // 4. Pitch Bio (+15%)
          const bioCompleted = !!studentProfile?.bio && studentProfile.bio.trim().length > 10;
          if (bioCompleted) score += 15;
          items.push({
            label: "Creative Pitch Biography",
            weight: 15,
            completed: bioCompleted,
            boost: "+15%",
            desc: "Construct an engaging career story summarizing specializations."
          });

          // 5. Academic Degrees (+15%)
          const academicCompleted = !!studentProfile?.university && !!studentProfile?.major;
          if (academicCompleted) score += 15;
          items.push({
            label: "Academic Identity Validation",
            weight: 15,
            completed: academicCompleted,
            boost: "+15%",
            desc: "Verify active enrollment, degrees, GPA averages and upload credentials."
          });

          // 6. Security & Notifications Config (+10%)
          const configCompleted = !!studentProfile?.notificationPreferences && !!studentProfile?.privacySettings;
          if (configCompleted) score += 10;
          items.push({
            label: "Security & Visibility Locks",
            weight: 10,
            completed: configCompleted,
            boost: "+10%",
            desc: "Establish target recruiter search settings and customize push digests."
          });

          return { score, items };
        };

        const completion = getProfileCompletion();

        return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-7xl mx-auto items-start">
            
            {/* Left Column (8/12): Core tabbed control panel settings */}
            <div className="xl:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm">
                <ProfileSettingsView />
              </div>
            </div>

            {/* Right Column (4/12): Actionable Profile Completion Engine */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Radial/Linear Progress Score Card */}
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-premium space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-md uppercase tracking-wider block w-fit">
                    AI Talent Match Score
                  </span>
                  <h4 className="font-display font-black text-2xl text-neutral-900 mt-2 tracking-tight text-balance">
                    Profile Integrity Level
                  </h4>
                  <p className="font-sans text-[11px] text-neutral-400 mt-0.5">High-integrity profiles unlock verified sponsor payouts faster.</p>
                </div>

                {/* Score visualization */}
                <div className="flex items-center gap-5 bg-neutral-50 p-5 rounded-2xl border border-neutral-200/50">
                  <div className="relative shrink-0 flex items-center justify-center">
                    {/* Visual Radial Bar Simulator */}
                    <div className="w-16 h-16 rounded-full border-4 border-neutral-200 flex items-center justify-center text-sm font-mono font-black text-black">
                      {completion.score}%
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-800 block">Talent Visibility Index</span>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">
                      Your profile score is <strong>{completion.score}%</strong>. Achieve 100% to maximize automated matching indexing speeds.
                    </p>
                  </div>
                </div>

                {/* Checklist with suggestions */}
                <div className="space-y-4">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Actionable Suggestions List</span>
                  
                  <div className="space-y-2.5">
                    {completion.items.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3.5 rounded-xl border transition-all text-xs flex gap-3 items-start ${
                          item.completed 
                            ? "bg-emerald-50/20 border-emerald-100/40 text-neutral-700" 
                            : "bg-white border-neutral-200/80 hover:border-neutral-300 text-neutral-500"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border font-mono font-bold text-[10px] ${
                          item.completed 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                            : "bg-neutral-50 border-neutral-200 text-neutral-400"
                        }`}>
                          {item.completed ? <Check className="w-3 h-3" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between font-semibold text-neutral-800">
                            <span className="truncate">{item.label}</span>
                            <span className={`text-[10px] font-mono font-bold ${item.completed ? "text-emerald-600" : "text-neutral-400"}`}>
                              {item.completed ? "Completed" : item.boost}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-light mt-0.5 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verified Metrics Counter */}
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-premium space-y-4">
                <h4 className="font-display font-bold text-sm text-neutral-900">Interactive Metrics Counter</h4>
                <div className="grid grid-cols-2 gap-3 font-sans">
                  <div className="bg-neutral-50 p-4 border border-neutral-200/50 rounded-2xl text-center">
                    <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Completed</div>
                    <div className="text-2xl font-display font-black text-neutral-900 mt-1">
                      {studentProfile.completedProjects || 0}
                    </div>
                  </div>
                  <div className="bg-neutral-50 p-4 border border-neutral-200/50 rounded-2xl text-center">
                    <div className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Evaluations</div>
                    <div className="text-2xl font-display font-black text-neutral-900 mt-1">
                      {applications.filter(a => a.status === ApplicationStatus.REVIEWED).length}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-2xl text-amber-800 text-xs font-sans">
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>AI Engine Active</span>
                  </div>
                  <p className="font-light text-[11px] text-amber-900/80 mt-1">KONEXA's real-time matchmakers are mapping your profile to <strong>12 matching corporate sponsors</strong>.</p>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
