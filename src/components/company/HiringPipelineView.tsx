import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  TrendingUp, Users, Calendar, ArrowRight, ArrowLeft, RefreshCw, 
  CheckCircle, Plus, Eye, MoreHorizontal, UserCheck, Trash2
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface HiringPipelineViewProps {
  onNavigate: (tabId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

const STAGES = [
  { id: "applied", name: "Applied", color: "bg-neutral-100 border-neutral-200 text-neutral-800" },
  { id: "screening", name: "Screening", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { id: "project", name: "Project Sandbox", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { id: "review", name: "Vetting Review", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { id: "interview", name: "Interviewing", color: "bg-teal-50 border-teal-200 text-teal-800" },
  { id: "offer", name: "Offer Stage", color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
  { id: "hired", name: "Hired & Accepted", color: "bg-emerald-50 border-emerald-200 text-emerald-800" }
];

export default function HiringPipelineView({ onNavigate, onSelectStudent }: HiringPipelineViewProps) {
  const { studentProfile } = useApp();
  const { success, info } = useToast();

  // Active candidates list and their active stage mapping
  const [candidates, setCandidates] = useState([
    {
      id: "usr_fndtn_konexa_99",
      name: studentProfile?.name || "Alex Rivera",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
      school: "Seoul National University",
      matchScore: 96,
      stage: "review",
      role: "Full-Stack Engineer"
    },
    {
      id: "std_2",
      name: "Min-jun Kim",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
      school: "KAIST",
      matchScore: 91,
      stage: "interview",
      role: "Backend Platform Engineer"
    },
    {
      id: "std_3",
      name: "Chloe Chen",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120",
      school: "NUS",
      matchScore: 87,
      stage: "project",
      role: "ML Research Engineer"
    },
    {
      id: "std_4",
      name: "Liam Davies",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
      school: "University of Sydney",
      matchScore: 82,
      stage: "screening",
      role: "Security Engineer"
    }
  ]);

  const handleMoveCandidate = (candId: string, direction: "forward" | "backward") => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candId) {
        const curIdx = STAGES.findIndex(s => s.id === c.stage);
        let nextIdx = curIdx;
        if (direction === "forward" && curIdx < STAGES.length - 1) nextIdx = curIdx + 1;
        if (direction === "backward" && curIdx > 0) nextIdx = curIdx - 1;

        const nextStage = STAGES[nextIdx];
        if (nextIdx !== curIdx) {
          success("Funnel Shifted", `Successfully moved ${c.name} to: ${nextStage.name}.`);
        }
        return { ...c, stage: nextStage.id };
      }
      return c;
    }));
  };

  const handleHireCandidate = (cand: any) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === cand.id) {
        return { ...c, stage: "hired" };
      }
      return c;
    }));
    success("Employee Hired!", `Initiating onboarding and offer contracts for ${cand.name}!`);
    onNavigate("employee-conversion");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            Visual Funnel
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            Hiring Pipeline Board
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Map applicants across recruitment stages, evaluate sandbox submissions, and fast-track hires.
          </p>
        </div>
      </div>

      {/* Analytics metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Average Funnel Cycle</span>
          <div className="text-xl font-display font-black text-neutral-900 mt-1">11.4 Days</div>
          <p className="text-[9px] text-neutral-400 mt-0.5">Time from initial submission to contract sign-off</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Screening Pass Rate</span>
          <div className="text-xl font-display font-black text-neutral-900 mt-1">42.8%</div>
          <p className="text-[9px] text-neutral-400 mt-0.5">Challenge completion benchmark ratio</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Offer Acceptance Rate</span>
          <div className="text-xl font-display font-black text-neutral-900 mt-1">94.1%</div>
          <p className="text-[9px] text-neutral-400 mt-0.5">Vetted hires accepting financial compensation packages</p>
        </div>
      </div>

      {/* Kanban Scroll Board */}
      <div className="overflow-x-auto pb-6 scrollbar">
        <div className="flex gap-4 min-w-[1200px] h-[34rem]">
          {STAGES.map((stage) => {
            const stageCandidates = candidates.filter(c => c.stage === stage.id);
            return (
              <div key={stage.id} className="w-80 shrink-0 bg-neutral-50/50 rounded-2xl p-4 flex flex-col border border-neutral-200/50">
                {/* Column Title */}
                <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900">{stage.name}</span>
                    <span className="text-[9px] font-mono bg-neutral-200/60 text-neutral-700 font-bold px-1.5 py-0.5 rounded-full">
                      {stageCandidates.length}
                    </span>
                  </div>
                </div>

                {/* Candidates cards */}
                <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-0.5 scrollbar">
                  {stageCandidates.length === 0 ? (
                    <div className="h-24 border border-dashed border-neutral-200/60 rounded-xl flex items-center justify-center text-[10px] text-neutral-400 font-light">
                      Drag or transition cards here
                    </div>
                  ) : (
                    stageCandidates.map((cand) => (
                      <div key={cand.id} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-neutral-300 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img 
                              src={cand.avatar} 
                              alt={cand.name} 
                              className="w-8 h-8 rounded-full object-cover shrink-0" 
                            />
                            <div className="min-w-0">
                              <h4 
                                onClick={() => {
                                  onSelectStudent(cand.id);
                                  onNavigate("student-review");
                                }}
                                className="text-xs font-bold text-neutral-900 truncate hover:underline cursor-pointer"
                              >
                                {cand.name}
                              </h4>
                              <span className="text-[10px] text-neutral-400 truncate block font-light">{cand.school}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-black text-neutral-900 shrink-0 bg-neutral-100 px-1.5 py-0.5 rounded">
                            {cand.matchScore}%
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-500 font-light truncate">{cand.role}</p>

                        {/* Transition arrows */}
                        <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-[10px]">
                          <div className="flex gap-1">
                            <button 
                              disabled={stage.id === "applied"}
                              onClick={() => handleMoveCandidate(cand.id, "backward")}
                              className="p-1 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-neutral-500 disabled:opacity-40 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              disabled={stage.id === "hired"}
                              onClick={() => handleMoveCandidate(cand.id, "forward")}
                              className="p-1 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-neutral-500 disabled:opacity-40 cursor-pointer"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {stage.id === "offer" && (
                            <button 
                              onClick={() => handleHireCandidate(cand)}
                              className="px-2.5 py-1 bg-black text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors cursor-pointer text-[9px]"
                            >
                              Hire Student
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
