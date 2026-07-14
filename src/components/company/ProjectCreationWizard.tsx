import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ProjectDifficulty, ProjectStatus } from "../../types";
import { 
  Sparkles, ChevronLeft, ChevronRight, Check, RefreshCw, 
  HelpCircle, Info, Paperclip, GraduationCap, ShieldAlert,
  Star, Clock, Building, Plus, X
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface ProjectCreationWizardProps {
  onNavigate: (tabId: string) => void;
}

export default function ProjectCreationWizard({ onNavigate }: ProjectCreationWizardProps) {
  const { createProject, companyProfile } = useApp();
  const { success, error, info } = useToast();

  const [step, setStep] = useState(1);
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState("");
  const [expectedOutcomes, setExpectedOutcomes] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [timeline, setTimeline] = useState("4 weeks");
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>(ProjectDifficulty.MEDIUM);
  const [requiredSkills, setRequiredSkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [requiredLanguages, setRequiredLanguages] = useState("English");
  const [targetUniversities, setTargetUniversities] = useState("All Partnerships");
  const [targetCountries, setTargetCountries] = useState("Global");
  const [projectType, setProjectType] = useState<"Remote" | "Hybrid" | "Onsite">("Remote");
  const [compensation, setCompensation] = useState("$2,000 + Token incentives");
  const [workingHours, setWorkingHours] = useState("Flexible (approx. 15 hrs/week)");
  const [mentors, setMentors] = useState("Staff Platform Architect");
  const [attachments, setAttachments] = useState("");
  const [evaluationCriteria, setEvaluationCriteria] = useState("");
  const [trustRequirements, setTrustRequirements] = useState("Minimum Trust Score of 75");
  const [performanceRequirements, setPerformanceRequirements] = useState("Demonstrated competence in React hook lifecycle structures");
  const [futureHiringOpportunity, setFutureHiringOpportunity] = useState("Full-time junior platform engineer conversion upon approved completion");

  // Call server-side Gemini API proxy to suggest content for any specific field!
  const handleGetAiSuggestion = async (fieldName: string, fieldSetter: (val: string) => void) => {
    setIsAiLoading(fieldName);
    try {
      const prompt = `You are an expert technical recruiter drafting a student code challenge for "${title || "Software Engineering Challenge"}".
      Provide a concise, professional suggestion (maximum 2 sentences) for the project field: "${fieldName}".`;

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) throw new Error("API Offline");
      const data = await response.json();
      
      const cleanedText = data.reply.trim().replace(/^["']|["']$/g, ""); // clean enclosing quotes
      fieldSetter(cleanedText);
      success("AI Suggestion Applied", `Populated "${fieldName}" with Gemini recommendation.`);
    } catch (err) {
      // Fallback generator based on fields
      const fallbacks: { [key: string]: string } = {
        title: "SVG Canvas State Syncer and Profiler Engine",
        description: "Implement a highly performant drawing state machine capable of recording and playing back client clicks with sub-millisecond lag.",
        objectives: "Verify structural alignment with React 19 concurrent features and web vital profiling APIs.",
        expectedOutcomes: "A secure, tested rendering canvas with a customized audit panel.",
        deliverables: "1. Core state profiling React hook\n2. SVG vector drawing viewport component\n3. High-quality Jest test suite",
        evaluationCriteria: "Adherence to zero heavy external libraries, render benchmark metrics, and clean TypeScript type parameters.",
        trustRequirements: "Applicant must possess an active, verified KONEXA Trust Score of 80+.",
        performanceRequirements: "Excellent understanding of React profiling hooks, requestAnimationFrame, and SVG canvas trees.",
        futureHiringOpportunity: "Fast-track onboarding and standard developer interview conversion upon successful verification."
      };
      
      const val = fallbacks[fieldName.toLowerCase()] || "Highly optimized technical criteria based on standard enterprise best practices.";
      fieldSetter(val);
      info("Offline Suggestion Applied", "Applied standard fallback recommendation.");
    } finally {
      setIsAiLoading(null);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !deliverables.trim()) {
      error("Verification Error", "Title, description, and deliverables are required to publish the challenge.");
      return;
    }

    info("Publishing...", "Saving your multi-step challenge to global database...");
    
    // Build combined requirements
    const combinedReqs = [
      ...deliverables.split("\n").filter(Boolean),
      ...trustRequirements.split("\n").filter(Boolean),
      ...evaluationCriteria.split("\n").filter(Boolean)
    ];

    const tagsList = [
      ...requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
      ...preferredSkills.split(",").map(s => s.trim()).filter(Boolean),
      projectType
    ];

    await createProject(
      title,
      `${description}\n\nObjectives:\n${objectives}\n\nExpected Outcomes:\n${expectedOutcomes}\n\nFuture Hiring Option: ${futureHiringOpportunity}`,
      combinedReqs.length > 0 ? combinedReqs : ["Submit clean, modular types", "Pass automatic sandbox performance linting"],
      difficulty,
      compensation,
      tagsList.length > 0 ? tagsList : ["React", "TypeScript", "Onboarding"]
    );

    success("Challenge Published!", "Your verified technical challenge is now active in the Student Marketplace!");
    onNavigate("company-projects");
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm space-y-8 pb-12">
      {/* Wizard Header */}
      <div className="flex justify-between items-start border-b border-neutral-100 pb-5">
        <div>
          <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Step {step} of 4
          </span>
          <h2 className="font-display font-black text-2xl text-neutral-900 mt-2 tracking-tight">
            Configure Hiring Challenge Wizard
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">Collect granular specs for sandbox tests. Tap Sparkles next to any field for AI suggestions.</p>
        </div>
        <button 
          onClick={() => onNavigate("company-projects")}
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Progress Line */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((num) => (
          <div 
            key={num} 
            className={`h-1.5 rounded-full transition-all ${
              step >= num ? "bg-black" : "bg-neutral-100"
            }`}
          />
        ))}
      </div>

      {/* Step Components */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-neutral-50 border border-neutral-200/50 p-4 rounded-2xl flex gap-3 items-start">
            <Info className="w-5 h-5 text-neutral-800 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-600 font-light leading-relaxed">
              <strong>Step 1: Core Definitions</strong>. Pitch the project to students, outlining specific technical objectives, expected outcomes, and main code deliverables.
            </div>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-700">Project Title *</label>
                <button 
                  onClick={() => handleGetAiSuggestion("Title", setTitle)}
                  disabled={isAiLoading !== null}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  {isAiLoading === "Title" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Suggest Title</span>
                </button>
              </div>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. SVG Performance Engine Profiler"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-700">Detailed Description *</label>
                <button 
                  onClick={() => handleGetAiSuggestion("Description", setDescription)}
                  disabled={isAiLoading !== null}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  {isAiLoading === "Description" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Draft Description</span>
                </button>
              </div>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the context, target scenario, and software stack constraints..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs font-sans focus:outline-hidden font-light leading-relaxed"
              />
            </div>

            {/* Objectives */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-700">Objectives & Focus Areas</label>
                <button 
                  onClick={() => handleGetAiSuggestion("Objectives", setObjectives)}
                  disabled={isAiLoading !== null}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  {isAiLoading === "Objectives" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Suggest Objectives</span>
                </button>
              </div>
              <textarea 
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                rows={3}
                placeholder="What parameters should candidates optimize? (e.g., render speed, network overhead)"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs font-sans focus:outline-hidden font-light leading-relaxed"
              />
            </div>

            {/* Expected Outcomes */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-700">Expected Outcomes</label>
                <button 
                  onClick={() => handleGetAiSuggestion("ExpectedOutcomes", setExpectedOutcomes)}
                  disabled={isAiLoading !== null}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  {isAiLoading === "ExpectedOutcomes" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Suggest Outcomes</span>
                </button>
              </div>
              <input 
                type="text" 
                value={expectedOutcomes}
                onChange={(e) => setExpectedOutcomes(e.target.value)}
                placeholder="e.g. A fully-tested module deploying zero hydration glitches."
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Deliverables */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-700">Code Deliverables (One per line) *</label>
                <button 
                  onClick={() => handleGetAiSuggestion("Deliverables", setDeliverables)}
                  disabled={isAiLoading !== null}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  {isAiLoading === "Deliverables" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Generate Deliverables</span>
                </button>
              </div>
              <textarea 
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                rows={3}
                placeholder="e.g. Must write complete usePerformanceProfiler hooks&#10;Must export diagnostic SVG trees"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs font-sans focus:outline-hidden font-light leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-neutral-50 border border-neutral-200/50 p-4 rounded-2xl flex gap-3 items-start">
            <Info className="w-5 h-5 text-neutral-800 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-600 font-light leading-relaxed">
              <strong>Step 2: Technical Parameters</strong>. Set difficulty brackets, required skills, preferred languages, and project types. Determine financial reward and work policy structures.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Target Difficulty</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as ProjectDifficulty)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              >
                <option value={ProjectDifficulty.EASY}>Easy (Quick tasks, bugs)</option>
                <option value={ProjectDifficulty.MEDIUM}>Medium (Features, layouts)</option>
                <option value={ProjectDifficulty.HARD}>Hard (Platform, vector sync, security)</option>
              </select>
            </div>

            {/* Compensation */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Compensation & Reward Structure *</label>
              <input 
                type="text" 
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                placeholder="e.g. $1,500 + Retainer Options"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Required Skills */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Required Skills (Comma separated)</label>
              <input 
                type="text" 
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                placeholder="React, TypeScript, Framer Motion"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Preferred Skills */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Preferred Skills (Optional)</label>
              <input 
                type="text" 
                value={preferredSkills}
                onChange={(e) => setPreferredSkills(e.target.value)}
                placeholder="WebSocket, SVG Render engines"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Required Languages */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Required Communication Languages</label>
              <input 
                type="text" 
                value={requiredLanguages}
                onChange={(e) => setRequiredLanguages(e.target.value)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Project Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Working Structure</label>
              <select 
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as any)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              >
                <option value="Remote">Remote (Digital Workspace)</option>
                <option value="Hybrid">Hybrid (Offices & Remote)</option>
                <option value="Onsite">Onsite (Local headquarters)</option>
              </select>
            </div>

            {/* Working Hours */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-neutral-700">Working Hours and Commits</label>
              <input 
                type="text" 
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-neutral-50 border border-neutral-200/50 p-4 rounded-2xl flex gap-3 items-start">
            <Info className="w-5 h-5 text-neutral-800 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-600 font-light leading-relaxed">
              <strong>Step 3: Audience & Mentors</strong>. Direct your technical challenge to specific university networks, declare corporate mentors, upload guidelines, and state post-project hiring offers.
            </div>
          </div>

          <div className="space-y-4">
            {/* Target Universities */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Target Universities</label>
              <input 
                type="text" 
                value={targetUniversities}
                onChange={(e) => setTargetUniversities(e.target.value)}
                placeholder="e.g. KAIST, Seoul National University, NUS"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Target Countries */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Target Countries</label>
              <input 
                type="text" 
                value={targetCountries}
                onChange={(e) => setTargetCountries(e.target.value)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Mentors */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Assigned Corporate Mentors</label>
              <input 
                type="text" 
                value={mentors}
                onChange={(e) => setMentors(e.target.value)}
                placeholder="e.g. John Doe (Platform Lead)"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Reference Attachments (Documentation URLs)</label>
              <input 
                type="text" 
                value={attachments}
                onChange={(e) => setAttachments(e.target.value)}
                placeholder="https://docs.horizonlabs.io/svg-specs.pdf"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Future Hiring Opportunity */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-700">Future Hiring Opportunities & Conversions *</label>
                <button 
                  onClick={() => handleGetAiSuggestion("FutureHiringOpportunity", setFutureHiringOpportunity)}
                  disabled={isAiLoading !== null}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  {isAiLoading === "FutureHiringOpportunity" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Suggest Conversion</span>
                </button>
              </div>
              <textarea 
                value={futureHiringOpportunity}
                onChange={(e) => setFutureHiringOpportunity(e.target.value)}
                rows={3}
                placeholder="Detail conversion pathways (e.g., fast-track junior hiring, monthly stipend retainers)..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs font-sans focus:outline-hidden font-light leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="bg-neutral-50 border border-neutral-200/50 p-4 rounded-2xl flex gap-3 items-start">
            <Info className="w-5 h-5 text-neutral-800 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-600 font-light leading-relaxed">
              <strong>Step 4: Quality & Trust Framework</strong>. Fine-tune your evaluation metrics. Set minimum trust benchmarks for applicants, specify target timelines, and lock review criteria.
            </div>
          </div>

          <div className="space-y-4">
            {/* Timeline */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Submission Timeline Constraint</label>
              <input 
                type="text" 
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g. 4 weeks from enrollment"
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Evaluation Criteria */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-700">Evaluation Criteria (One per line)</label>
                <button 
                  onClick={() => handleGetAiSuggestion("EvaluationCriteria", setEvaluationCriteria)}
                  disabled={isAiLoading !== null}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  {isAiLoading === "EvaluationCriteria" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Suggest Criteria</span>
                </button>
              </div>
              <textarea 
                value={evaluationCriteria}
                onChange={(e) => setEvaluationCriteria(e.target.value)}
                rows={3}
                placeholder="e.g. Core profiling Hook validation&#10;Zero bundle overhead verification"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs font-sans focus:outline-hidden font-light leading-relaxed"
              />
            </div>

            {/* Trust Requirements */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-700">Trust Requirements</label>
                <button 
                  onClick={() => handleGetAiSuggestion("TrustRequirements", setTrustRequirements)}
                  disabled={isAiLoading !== null}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  {isAiLoading === "TrustRequirements" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Suggest Trust Limits</span>
                </button>
              </div>
              <input 
                type="text" 
                value={trustRequirements}
                onChange={(e) => setTrustRequirements(e.target.value)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Performance Requirements */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-700">Performance Requirements</label>
                <button 
                  onClick={() => handleGetAiSuggestion("PerformanceRequirements", setPerformanceRequirements)}
                  disabled={isAiLoading !== null}
                  className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
                >
                  {isAiLoading === "PerformanceRequirements" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Suggest Performance Limits</span>
                </button>
              </div>
              <textarea 
                value={performanceRequirements}
                onChange={(e) => setPerformanceRequirements(e.target.value)}
                rows={2}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs font-sans focus:outline-hidden font-light leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-neutral-100">
        <button 
          disabled={step === 1}
          onClick={() => setStep(prev => prev - 1)}
          className="h-10 px-4 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {step < 4 ? (
          <button 
            onClick={() => setStep(prev => prev + 1)}
            className="h-10 px-4 bg-neutral-950 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            className="h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Publish Challenge Live</span>
          </button>
        )}
      </div>

    </div>
  );
}
