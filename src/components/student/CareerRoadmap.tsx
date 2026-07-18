import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Brain, Target, Shield, BookOpen, Star, Compass, Award, 
  MapPin, Check, Plus, Edit, RefreshCw, Zap, TrendingUp, Calendar, ChevronRight
} from "lucide-react";
import { useToast } from "../ui/Toast";

export default function CareerRoadmap() {
  const { studentProfile } = useApp();
  const { success, error } = useToast();

  const [visionText, setVisionText] = useState(
    studentProfile?.preferredJob || ""
  );
  const [editingVision, setEditingVision] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  const [milestones, setMilestones] = useState<Array<{ id: string; term: string; title: string; desc: string; status: string }>>([]);
  const [skillGaps, setSkillGaps] = useState<string[]>([]);

  const [courses, setCourses] = useState<Array<{ title: string; provider: string; duration: string; matchesSkill: string }>>([]);

  const handleRecalculateRoadmap = async () => {
    setLoadingRoadmap(true);
    try {
      const response = await fetch("/api/ai/student-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerGoal: visionText }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "AI 로드맵을 생성하지 못했습니다.");
      setMilestones((payload.milestones || []).map((item: any, index: number) => ({
        id: `m${index + 1}`,
        term: `STEP ${index + 1}`,
        title: item.title,
        desc: `${item.nextAction}${item.evidenceNeeded ? ` 필요한 근거: ${item.evidenceNeeded}` : ""}`,
        status: index === 0 ? "current" : "pending",
      })));
      setSkillGaps(Array.isArray(payload.skillGaps) ? payload.skillGaps : []);
      setCourses((payload.learningActions || []).map((title: string) => ({ title, provider: "KONEXA AI 제안", duration: "직접 계획", matchesSkill: "" })));
      success("AI 로드맵 생성 완료", "등록된 프로필과 실제 공개 프로젝트만 기준으로 분석했습니다.");
    } catch (cause) {
      error("AI 로드맵 오류", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setLoadingRoadmap(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6 scrollbar">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-md w-fit">
            AI-GENERATED CURRICULUM PATHWAY
          </span>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            AI Growth Roadmap
          </h1>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            Chart your continuous growth. Our Gemini model maps missing skills to industry challenges and recommended training logs.
          </p>
        </div>

        <button 
          onClick={handleRecalculateRoadmap}
          disabled={loadingRoadmap}
          className="px-4 py-2.5 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loadingRoadmap ? "animate-spin" : ""}`} />
          <span>{loadingRoadmap ? "Calculating vectors..." : "Recalculate AI Goals"}</span>
        </button>
      </div>

      {/* BODY COLUMN SPLIT */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Roadmap Timeline, Vision (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Career Vision Card */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center text-xs font-bold text-neutral-900">
                <Target className="w-4 h-4 text-neutral-400" />
                <span>My Career Vision Statement</span>
              </div>
              <button 
                onClick={() => {
                  if (editingVision) {
                    success("Vision Saved", "Custom vision statement synchronized to AI matching filters.");
                  }
                  setEditingVision(!editingVision);
                }}
                className="text-xs font-semibold text-neutral-400 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{editingVision ? "Save Vision" : "Edit Statement"}</span>
              </button>
            </div>

            {editingVision ? (
              <textarea
                value={visionText}
                onChange={(e) => setVisionText(e.target.value)}
                rows={3}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-xs font-sans focus:outline-hidden focus:border-black/50 leading-relaxed"
              />
            ) : (
              <p className="text-xs text-neutral-600 leading-relaxed font-light italic bg-neutral-50 p-4 rounded-2xl border border-neutral-200/20">
                "{visionText}"
              </p>
            )}
          </div>

          {/* Interactive Timeline Milestone steps */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <h3 className="font-display font-bold text-sm text-neutral-900">Expected Career Growth Timeline</h3>
            
            <div className="relative border-l border-neutral-100 pl-6 ml-3 space-y-6">
              {milestones.map((mil, idx) => (
                <div key={mil.id} className="relative">
                  {/* Timeline bullet indicator */}
                  <div className={`absolute -left-10 top-0.5 w-7.5 h-7.5 rounded-full border-4 flex items-center justify-center font-mono font-bold text-[10px] ${
                    mil.status === "current"
                      ? "bg-black border-white text-white shadow-md ring-2 ring-black/10"
                      : "bg-white border-neutral-200 text-neutral-400"
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="space-y-1 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/40 hover:border-neutral-300 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-teal-600 uppercase">{mil.term}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        mil.status === "current" ? "bg-black text-white" : "bg-neutral-200/60 text-neutral-500"
                      }`}>{mil.status}</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-800 block">{mil.title}</span>
                    <p className="text-[11px] text-neutral-500 font-light leading-relaxed mt-1">{mil.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Missing skills, recommended courses (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Missing Skills Indicator */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-900">Missing Target Skills</h3>
            <p className="text-[10px] text-neutral-400 font-sans mt-0.5">Highly requested by sponsor targets matching your vision.</p>
            
            <div className="space-y-2.5">
              {skillGaps.map((name, idx) => (
                <div key={idx} className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/40 flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-neutral-800 block">{name}</span>
                    <span className="text-[9px] text-neutral-400 font-sans">프로필과 공개 공고의 차이</span>
                  </div>
                  <span className="shrink-0 rounded-md bg-teal-50 px-2 py-0.5 text-[8px] font-mono font-bold uppercase text-teal-600">Review</span>
                </div>
              ))}
              {!skillGaps.length && <p className="py-4 text-center text-xs text-neutral-400">AI 분석을 실행하면 확인된 역량 차이가 표시됩니다.</p>}
            </div>
          </div>

          {/* Recommended Learning / Courses */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-neutral-400" />
              <span>Recommended Courses</span>
            </h3>

            <div className="space-y-3">
              {courses.map((course, idx) => (
                <div key={idx} className="p-3.5 bg-neutral-50/50 border border-neutral-200/50 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">{course.provider}</span>
                    <span className="text-xs font-bold text-neutral-800 block mt-1 leading-normal">{course.title}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-100 text-[10px] text-neutral-400">
                    <span>Duration: {course.duration}</span>
                    <span className="text-teal-600 font-semibold underline cursor-pointer">Start course</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
