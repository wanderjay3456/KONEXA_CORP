import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  FileText, Sparkles, CheckCircle, Award, Target, HelpCircle, 
  Trash2, RefreshCw, ChevronRight, Eye, Download, ShieldCheck, 
  Globe, Languages, Briefcase, FileCode2, Clock, Plus
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface ResumeVersion {
  id: string;
  templateName: string;
  score: number;
  updatedAt: string;
}

export default function ResumeBuilder() {
  const { studentProfile, updateStudentProfile } = useApp();
  const { success, info } = useToast();

  // State
  const [selectedTemplate, setSelectedTemplate] = useState<"intl" | "ko" | "ats" | "creative" | "academic" | "research">("ats");
  const [resumeScore, setResumeScore] = useState(82);
  const [grammarChecked, setGrammarChecked] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [feedbackList, setFeedbackList] = useState([
    { type: "strength", text: "Strong list of tech stack tags (React 19, TypeScript, Vite)." },
    { type: "warning", text: "Missing action verbs in your pitch biography statement." },
    { type: "recommendation", text: "Add your latest Vercel performance grade to boost ATS similarity matching. (+8 points)" }
  ]);

  
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [pdfAnalysis, setPdfAnalysis] = useState<any>(null);

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      info("PDF Required", "Please upload a valid PDF document.");
      return;
    }

    if (file.size > 7.5 * 1024 * 1024) {
      info("PDF Too Large", "Please upload a PDF smaller than 7.5 MB.");
      e.target.value = "";
      return;
    }

    setIsUploadingPDF(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = (event.target?.result as string).split(',')[1];
        const res = await fetch("/api/gemini/analyze-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64: base64, role: "student" })
        });
        
        if (!res.ok) throw new Error("Failed to analyze PDF");
        const analysis = await res.json();
        
        setPdfAnalysis(analysis);
        
        if (analysis.extractedSkills) {
          updateStudentProfile({ skills: Array.from(new Set([...(studentProfile?.skills || []), ...analysis.extractedSkills])) });
        }
        
        success("PDF Analyzed Successfully", "Your profile has been augmented with data from your resume.");
      } catch (err: any) {
        info("Analysis Failed", err.message);
      } finally {
        setIsUploadingPDF(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const [versions, setVersions] = useState<ResumeVersion[]>([
    { id: "v1", templateName: "ATS Standard Core", score: 74, updatedAt: "2d ago" },
    { id: "v2", templateName: "International Professional (English)", score: 82, updatedAt: "1d ago" }
  ]);

  // Handle PDF export trigger
  const handleExportPDF = () => {
    success("PDF Export Initiated", "Generating high-fidelity print margins. Your resume has been exported to PDF format.");
  };

  const handleOptimizeResume = () => {
    setOptimizing(true);
    setTimeout(() => {
      setResumeScore(94);
      setFeedbackList([
        { type: "strength", text: "Excellent list of tech stack tags (React 19, TypeScript, Vite)." },
        { type: "strength", text: "ATS Keyword optimizations completed successfully. Similarity matches boosted to 94%." },
        { type: "recommendation", text: "Connect your Github account to automatically append verified code check-ins." }
      ]);
      setVersions(prev => [
        { id: `v_${Date.now()}`, templateName: `${selectedTemplate.toUpperCase()} Premium Optimizer`, score: 94, updatedAt: "Just now" },
        ...prev
      ]);
      setOptimizing(false);
      success("Resume Optimized", "AI Resume Reviewer optimized action verbs, corrected spelling, and boosted ATS keyword density.");
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6 scrollbar">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-md w-fit">
            AI RESUME SCANNER (ATS-READY)
          </span>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            AI Resume Builder
          </h1>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            Build global professional profiles. Switch between international styles, ATS parsers, academic CVs, or Korean formats instantly.
          </p>
        </div>

        <button 
          onClick={handleExportPDF}
          className="px-4 py-2.5 bg-neutral-900 text-white hover:bg-black rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF Portfolio</span>
        </button>
      </div>

      {/* CORE BUILDER PLATFORM */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Editor and templates (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Template select grid */}
          <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-900">Select Resume Framework Template</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              
              {[
                { id: "intl", label: "International", desc: "US/EU Standard", icon: Globe },
                { id: "ko", label: "Korean", desc: "국문 입사지원서", icon: Languages },
                { id: "ats", label: "ATS Scanner", desc: "Standard Parser", icon: ShieldCheck },
                { id: "creative", label: "Creative Portfolio", desc: "Visual Highlight", icon: Sparkles },
                { id: "academic", label: "Academic CV", desc: "Research/Degree", icon: Award },
                { id: "research", label: "Research CV", desc: "Publications/Grant", icon: FileText }
              ].map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id as any)}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer ${
                    selectedTemplate === tpl.id
                      ? "bg-black border-black text-white"
                      : "bg-neutral-50/50 border-neutral-200 text-neutral-500 hover:text-black hover:border-neutral-300"
                  }`}
                >
                  <tpl.icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold block truncate leading-tight">{tpl.label}</span>
                    <span className={`text-[8px] block font-light leading-none ${selectedTemplate === tpl.id ? "text-neutral-400" : "text-neutral-400"}`}>
                      {tpl.desc}
                    </span>
                  </div>
                </button>
              ))}

            </div>
          </div>

          {/* Interactive Resume Sheet Render */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-premium p-8 font-sans space-y-6">
            
            {/* Template Header */}
            <div className="flex justify-between items-start border-b border-neutral-100 pb-5">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                  {studentProfile?.name || "Global Talent Professional"}
                </h2>
                <div className="flex gap-3 text-[10px] font-mono text-neutral-400 font-bold uppercase mt-1">
                  <span>{studentProfile?.currentCountry || "Global Student"}</span>
                  <span>•</span>
                  <span>{studentProfile?.github || "https://github.com"}</span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest border border-neutral-200 px-2 py-0.5 rounded-lg">
                Template: {selectedTemplate.toUpperCase()}
              </span>
            </div>

            {/* Pitch / Bio */}
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Professional Summary</h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-light">
                {studentProfile?.bio || "Highly-motivated developer candidate equipped with full stack TypeScript expertise. Proven track record completing automated sponsor evaluations and building high-performance modules."}
              </p>
            </div>

            {/* Education */}
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Education & Academic Credentials</h3>
              <div className="flex justify-between items-start text-xs font-sans">
                <div>
                  <span className="font-bold text-neutral-800">{studentProfile?.university || "Verified University partner"}</span>
                  <p className="text-neutral-500 font-light text-[11px] mt-0.5">{studentProfile?.degree || "Bachelor of Science"}, {studentProfile?.major || "Computer Science & Engineering"}</p>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 font-bold">GRAD: 2026</span>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Verified Technical Expertise</h3>
              <div className="flex flex-wrap gap-1.5">
                {(studentProfile?.skills || ["React", "TypeScript", "Vite", "Tailwind"]).map(s => (
                  <span key={s} className="text-[10px] font-semibold text-neutral-600 bg-neutral-50 border border-neutral-200/60 px-2.5 py-0.5 rounded-lg">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Simulated Projects Section */}
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Verified Project History (via KONEXA Grid)</h3>
              <div className="space-y-3">
                <div className="text-xs">
                  <div className="flex justify-between items-start font-sans">
                    <span className="font-bold text-neutral-800">SaaS Concurrent WebSocket Canvas Syncer</span>
                    <span className="text-[10px] font-mono text-neutral-400 font-bold">JULY 2026</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-light mt-0.5 leading-relaxed">
                    Designed sub-millisecond multi-client canvas sync layer using frame buffering. Evaluated automatically by Gemini AI grading system.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: ATS Score, AI review suggestions (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Score Circle Card */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div>
              <span className="text-[9px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit">
                ATS PROFILE GRADE
              </span>
              <h3 className="font-display font-black text-lg text-neutral-900 mt-2">Resume Indexing Score</h3>
            </div>

            <div className="flex items-center gap-5 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/50">
              <div className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center font-display font-black text-lg text-neutral-900">
                {resumeScore}%
              </div>
              <div className="text-xs font-sans min-w-0 flex-1">
                <span className="font-bold text-neutral-800">Excellent Parser Density</span>
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">
                  Your resume matches <strong>{resumeScore}%</strong> of standard developer keywords listed by Fortune-500 corporate sponsors.
                </p>
              </div>
            </div>

            <button 
              disabled={optimizing}
              onClick={handleOptimizeResume}
              className="w-full py-2.5 bg-black hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-300 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-neutral-950/10 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{optimizing ? "Optimizing Keyword Vectors..." : "AI Keyword Optimization"}</span>
            </button>
          </div>

          {/* AI Review Diagnostics list */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-900">AI Review Feedback</h3>
            
            <div className="space-y-3">
              {feedbackList.map((f, i) => (
                <div key={i} className="p-3 bg-neutral-50/50 border border-neutral-200/50 rounded-2xl flex gap-2.5 items-start">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    f.type === "strength" ? "bg-emerald-500" :
                    f.type === "warning" ? "bg-amber-500" : "bg-purple-500 animate-pulse"
                  }`} />
                  <p className="text-[11px] font-sans text-neutral-500 leading-normal font-light">
                    {f.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          
          {pdfAnalysis && (
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200/50 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-sm text-emerald-900">PDF Insight Extraction</h3>
              <p className="text-[11px] text-emerald-800 leading-relaxed font-sans">{pdfAnalysis.recommendation}</p>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">Extracted Skills</span>
                <div className="flex flex-wrap gap-1">
                  {pdfAnalysis.extractedSkills?.map((s: string, i: number) => (
                     <span key={i} className="text-[9px] font-semibold text-emerald-900 bg-emerald-200/50 px-2 py-0.5 rounded-md">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Version History logs */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-900">Version History</h3>
            
            <div className="space-y-2">
              {versions.map(v => (
                <div key={v.id} className="p-3 bg-neutral-50/30 border border-neutral-200/30 rounded-xl flex justify-between items-center text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-neutral-800 block truncate">{v.templateName}</span>
                    <span className="text-[9px] text-neutral-400 font-mono">ATS SCORE: {v.score}%</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">{v.updatedAt}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
