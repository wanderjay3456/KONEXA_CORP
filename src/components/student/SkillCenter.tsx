import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Activity, Sparkles, CheckCircle, Award, Target, HelpCircle, 
  Trash2, RefreshCw, ChevronRight, Eye, Download, ShieldCheck, 
  Globe, Languages, Briefcase, FileCode2, Clock, Plus, Github
} from "lucide-react";
import { useToast } from "../ui/Toast";

export default function SkillCenter() {
  const { studentProfile, updateStudentProfile } = useApp();
  const { success, info } = useToast();

  const [activeTab, setActiveTab] = useState<"verified" | "developing" | "learning">("verified");
  const [newSkillText, setNewSkillText] = useState("");

  const skills = studentProfile?.skills ?? ["React", "TypeScript", "Vite", "TailwindCSS"];

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillText.trim()) return;
    if (skills.includes(newSkillText.trim())) {
      info("Skill Exists", "This skill is already listed in your workspace profile.");
      return;
    }
    const updated = [...skills, newSkillText.trim()];
    updateStudentProfile({ skills: updated });
    setNewSkillText("");
    success("Skill Added", `Added "${newSkillText.trim()}" to learning targets list.`);
  };

  const handleRemoveSkill = (skill: string) => {
    const updated = skills.filter(s => s !== skill);
    updateStudentProfile({ skills: updated });
    info("Skill Removed", `Removed "${skill}" from profile listing.`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6 scrollbar">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-md w-fit">
            SKILL GROWTH EVIDENCE SYSTEM
          </span>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            Skill Center
          </h1>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            Audit your technical competencies. Complete code challenge sandbox reviews to accumulate verified skill badges and increase matching weight.
          </p>
        </div>
      </div>

      {/* BODY COLUMN SPLIT */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Skill Graph & List (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Interactive SVG Skill Radar Chart */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-neutral-900">Skill Growth Visualization (Radar Projection)</h3>
              <span className="text-[9px] font-mono text-neutral-400 font-bold uppercase">UPDATES INSTANTLY</span>
            </div>

            {/* Render a custom high-integrity SVG Radar Chart */}
            <div className="flex justify-center items-center py-6 bg-neutral-50/50 border border-neutral-200/40 rounded-2xl">
              <svg viewBox="0 0 220 220" className="w-56 h-56">
                {/* Concentric rings */}
                <circle cx="110" cy="110" r="100" fill="none" stroke="#E5E5E5" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="110" cy="110" r="75" fill="none" stroke="#E5E5E5" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="110" cy="110" r="50" fill="none" stroke="#E5E5E5" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="110" cy="110" r="25" fill="none" stroke="#E5E5E5" strokeWidth="1" strokeDasharray="3 3" />

                {/* Axes */}
                <line x1="110" y1="10" x2="110" y2="210" stroke="#E5E5E5" strokeWidth="1" />
                <line x1="10" y1="110" x2="210" y2="110" stroke="#E5E5E5" strokeWidth="1" />

                {/* Axis Labels */}
                <text x="110" y="8" textAnchor="middle" className="text-[8px] font-mono font-bold fill-neutral-400">TypeScript</text>
                <text x="110" y="218" textAnchor="middle" className="text-[8px] font-mono font-bold fill-neutral-400">React Core</text>
                <text x="212" y="113" textAnchor="start" className="text-[8px] font-mono font-bold fill-neutral-400">SaaS APIs</text>
                <text x="8" y="113" textAnchor="end" className="text-[8px] font-mono font-bold fill-neutral-400">WebSockets</text>

                {/* Skill polygon coordinates representing mock levels */}
                <polygon 
                  points="110,35 185,110 110,185 50,110" 
                  fill="rgba(13, 148, 136, 0.15)" 
                  stroke="rgba(13, 148, 136, 0.7)" 
                  strokeWidth="2" 
                />

                {/* Legend points */}
                <circle cx="110" cy="35" r="4" className="fill-teal-600 text-teal-600" />
                <circle cx="185" cy="110" r="4" className="fill-teal-600 text-teal-600" />
                <circle cx="110" cy="185" r="4" className="fill-teal-600 text-teal-600" />
                <circle cx="50" cy="110" r="4" className="fill-teal-600 text-teal-600" />
              </svg>
            </div>
          </div>

          {/* Core Skill categories lists */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            
            {/* Inner navigation bar */}
            <div className="flex gap-2.5 border-b border-neutral-100 pb-3">
              {[
                { id: "verified", label: "Verified Core Skills" },
                { id: "developing", label: "Developing competencies" },
                { id: "learning", label: "Learning target tracks" }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveTab(subTab.id as any)}
                  className={`text-xs font-semibold pb-1 border-b-2 transition-all cursor-pointer ${
                    activeTab === subTab.id
                      ? "border-black text-black font-extrabold"
                      : "border-transparent text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* List block */}
            <div className="space-y-3 pt-1">
              
              {activeTab === "verified" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skills.map((s) => (
                    <div key={s} className="p-4 bg-neutral-50/50 border border-neutral-200/40 rounded-2xl flex justify-between items-center hover:border-neutral-300 transition-all">
                      <div className="flex gap-3 items-center">
                        <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-neutral-800">{s}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveSkill(s)}
                        className="text-[10px] font-bold text-neutral-400 hover:text-rose-600 uppercase tracking-wider cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "developing" && (
                <div className="p-4 text-center bg-neutral-50/30 border border-neutral-200/30 rounded-2xl space-y-2">
                  <Activity className="w-6 h-6 text-neutral-300 mx-auto" />
                  <span className="text-xs font-semibold text-neutral-500 block">No developing skills yet</span>
                  <p className="text-[10px] text-neutral-400 max-w-xs mx-auto">Claim Hard-tier code challenges to start accumulating development history data.</p>
                </div>
              )}

              {activeTab === "learning" && (
                <div className="p-4 text-center bg-neutral-50/30 border border-neutral-200/30 rounded-2xl space-y-2">
                  <Target className="w-6 h-6 text-neutral-300 mx-auto animate-pulse" />
                  <span className="text-xs font-semibold text-neutral-500 block">No targeted tracks active</span>
                  <p className="text-[10px] text-neutral-400 max-w-xs mx-auto">Add new targeted skills below to dynamically append recommendation tracks.</p>
                </div>
              )}

            </div>

            {/* Add custom skill input */}
            <form onSubmit={handleAddSkill} className="flex gap-3 pt-3 border-t border-neutral-100">
              <input 
                type="text"
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                placeholder="Declare new competence skill badge (e.g. NextJS)..."
                className="flex-1 bg-neutral-50 border border-neutral-200 focus:border-black/50 rounded-xl px-4 py-2 text-xs font-sans focus:outline-hidden"
              />
              <button type="submit" className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl cursor-pointer">
                Add competence
              </button>
            </form>

          </div>

        </div>

        {/* RIGHT COLUMN: Evidence tracking (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Project Evidence Card */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-900">Project evidence log</h3>
            <p className="text-[10px] text-neutral-400 font-sans mt-0.5">Automated proof-of-work records verifying competency values.</p>

            <div className="space-y-2.5">
              {[
                { skill: "TypeScript", source: "Vite Profiler Optimizer", score: "Score: 94/100", status: "Verified" },
                { skill: "React 19", source: "Collaborative Sync Canvas", score: "Score: 88/100", status: "Verified" }
              ].map((ev, i) => (
                <div key={i} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/40 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-neutral-800 block">{ev.skill}</span>
                    <span className="text-[10px] text-neutral-400">{ev.source}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-emerald-600 font-bold block">{ev.status}</span>
                    <span className="text-[8px] text-neutral-400 block mt-0.5">{ev.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub / External Evidence API integration */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex gap-2 items-center text-xs font-bold text-neutral-900">
              <Github className="w-4 h-4 text-neutral-400" />
              <span>GitHub Verified Evidence</span>
            </div>

            <div className="p-4 bg-neutral-50 border border-neutral-200/40 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-800 block">Repository check-in syncing</span>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">
                  Connect your verified GitHub account to automatically map commit logs to active skill vectors.
                </p>
              </div>
              <button 
                onClick={() => success("GitHub Sycned", "Pulling repositories metadata. Your Skill evidence is refreshed.")}
                className="mt-4 w-full py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer text-center"
              >
                Sync GitHub Commits
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
