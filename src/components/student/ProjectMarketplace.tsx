import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Project, ProjectDifficulty, ApplicationStatus } from "../../types";
import { 
  Search, SlidersHorizontal, ArrowUpDown, Bookmark, Star, Sparkles, 
  MapPin, Clock, DollarSign, ArrowRight, X, ChevronRight, CheckCircle, 
  FileCode2, ShieldAlert, Users, MessageCircle, HelpCircle, FileText, 
  Briefcase, Globe, Code, AlertTriangle
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Dialogs";

export default function ProjectMarketplace() {
  const { projects, applications, applyToProject, studentProfile } = useApp();
  const { success, info } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterIndustry, setFilterIndustry] = useState("All");
  const [filterDuration, setFilterDuration] = useState("All");
  const [filterType, setFilterType] = useState("All"); // Paid, Volunteer, Research, Internship
  const [filterLocation, setFilterLocation] = useState("All"); // Remote, Hybrid, Onsite
  const [sortBy, setSortBy] = useState("ai-match"); // popularity, deadline, ai-match, newest
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Application Code Editor State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [submitCode, setSubmitCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter lists options
  const categories = ["All", "Frontend", "Backend", "Full Stack", "System", "SaaS", "Security"];
  const industries = ["All", "FinTech", "DevTools", "E-commerce", "AI/ML", "Cloud Systems"];
  const types = ["All", "Paid", "Volunteer", "Research", "Internship"];
  const locations = ["All", "Remote", "Hybrid", "Onsite"];

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(prev => prev.filter(bId => bId !== id));
      info("Bookmark Removed", "Project removed from your bookmarks list.");
    } else {
      setBookmarkedIds(prev => [...prev, id]);
      success("Project Bookmarked", "Project saved to your bookmarks list.");
    }
  };

  const handleShare = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/project/${p.id}`);
      success("Link Copied", "Project sharing link copied to clipboard.");
    } else {
      success("Project Copied", `Copied details for ${p.title}`);
    }
  };

  // AI Match similarity percentage and reason calculation
  const getAiMatchData = (p: Project) => {
    const userSkills = studentProfile?.skills ?? [];
    const matchedSkills = p.tags.filter(tag => 
      userSkills.some(us => us.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(us.toLowerCase()))
    );
    
    let baseScore = 60;
    if (p.difficulty === ProjectDifficulty.EASY) baseScore += 15;
    if (p.difficulty === ProjectDifficulty.MEDIUM) baseScore += 25;
    if (p.difficulty === ProjectDifficulty.HARD) baseScore += 35;

    // Cap at 98%
    const finalScore = Math.min(98, baseScore + (matchedSkills.length * 5));
    
    // AI recommendation reason
    let reason = "This project aligns with your core TypeScript stack.";
    if (matchedSkills.length > 0) {
      reason = `Highly recommended because it matches your verified skills in ${matchedSkills.slice(0, 2).join(" & ")}.`;
    } else if (p.difficulty === ProjectDifficulty.HARD) {
      reason = "Perfect stretch project to boost your Trust Score and unlock elite sponsor reviews.";
    }

    return { score: finalScore, reason, matchedSkills };
  };

  // Process and Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty = filterDifficulty === "All" || p.difficulty === filterDifficulty;
    const matchesCategory = filterCategory === "All" || p.tags.some(t => t.toLowerCase().includes(filterCategory.toLowerCase()));
    
    // Some industries mappings
    const matchesIndustry = filterIndustry === "All" || 
      (filterIndustry === "DevTools" && (p.companyName.includes("Vercel") || p.companyName.includes("Framer") || p.companyName.includes("Linear"))) ||
      (filterIndustry === "Cloud Systems" && p.companyName.includes("Google"));

    // Simple mappings for demo filtering
    const matchesType = filterType === "All" || (filterType === "Paid" && p.reward.includes("$"));
    const matchesLocation = filterLocation === "All" || filterLocation === "Remote"; // Pre-assume remote/hybrid

    return matchesSearch && matchesDifficulty && matchesCategory && matchesIndustry && matchesType && matchesLocation;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === "ai-match") {
      return getAiMatchData(b).score - getAiMatchData(a).score;
    }
    if (sortBy === "newest") {
      return b.createdAt - a.createdAt;
    }
    return 0; // Default preserved
  });

  const handleOpenApplyModal = () => {
    if (!selectedProject) return;
    const requirementsComments = (selectedProject.requirements || [])
      .map(req => `  // - ${req}`)
      .join("\n");

    setSubmitCode(`// KONEXA Multi-client Sandbox Editor v1.2
// Write your production-ready TypeScript component/module below.
// Gemini AI Auto-Evaluator will evaluate compliance.

import React, { useState, useEffect } from "react";

export function ${selectedProject.title.replace(/[^a-zA-Z0-9]/g, "")}() {
  // Solutions Checklist:
${requirementsComments}

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-neutral-200">
      <h2 className="text-xl font-bold text-neutral-900">${selectedProject.title} Solution</h2>
      <p className="text-sm text-neutral-500 mt-2">Engineered for: ${selectedProject.companyName}</p>
    </div>
  );
}`);
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async () => {
    if (!selectedProject) return;
    if (!submitCode.trim()) {
      info("Code submission empty", "Please write your TS module code solution before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      await applyToProject(selectedProject.id, submitCode);
      success("Code Solution Submitted!", "Evaluating logic and compiling modules now. Check 'Project Workspace' or 'My Applications' for real-time reviews.");
      setApplyModalOpen(false);
      setSelectedProject(null);
    } catch (err) {
      info("Error", "Unable to complete cloud submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6 scrollbar">
      
      {/* 1. HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-md w-fit">
            AUTONOMOUS HIRING PROTOCOL
          </span>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            Global Project Marketplace
          </h1>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            Solve production codebase challenges. Earn verified sponsor payouts and build elite employability ranks.
          </p>
        </div>
      </div>

      {/* 2. SEARCH AND FILTER HUB */}
      <div className="max-w-7xl mx-auto bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3.5">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges by title, tags, stacks, or corporate sponsors..."
              className="w-full bg-neutral-50 border border-neutral-200 focus:border-black/50 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-sans focus:outline-hidden transition-all shadow-inner"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-2xl py-2.5 px-4 text-xs font-sans text-neutral-600 focus:outline-hidden"
            >
              <option value="ai-match">Sort by: AI Best Match</option>
              <option value="newest">Sort by: Newest Listed</option>
            </select>
          </div>
        </div>

        {/* Granular Filtering Rails */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          
          {/* Category */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2 text-xs font-sans text-neutral-600 focus:outline-hidden"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Difficulty */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2 text-xs font-sans text-neutral-600 focus:outline-hidden"
            >
              <option value="All">All Levels</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Industry */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Industry</label>
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2 text-xs font-sans text-neutral-600 focus:outline-hidden"
            >
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          {/* Job Type */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Job Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2 text-xs font-sans text-neutral-600 focus:outline-hidden"
            >
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Location</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2 text-xs font-sans text-neutral-600 focus:outline-hidden"
            >
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Bookmarks Toggle (Quick Filter) */}
          <div className="space-y-1 flex flex-col justify-end">
            <button 
              onClick={() => {
                if (filterCategory === "BookmarksOnly") {
                  setFilterCategory("All");
                } else {
                  setFilterCategory("BookmarksOnly");
                }
              }}
              className={`w-full py-2 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                filterCategory === "BookmarksOnly"
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${filterCategory === "BookmarksOnly" ? "fill-rose-500 text-rose-500" : ""}`} />
              <span>Bookmarks ({bookmarkedIds.length})</span>
            </button>
          </div>

        </div>
      </div>

      {/* 3. GRID OF PROJECTS */}
      <div className="max-w-7xl mx-auto">
        
        {sortedProjects.length === 0 ? (
          <div className="p-16 text-center bg-white border border-neutral-200 rounded-3xl space-y-4 shadow-xs">
            <Code className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="font-display font-bold text-base text-neutral-700">No projects found matching filters</h3>
            <p className="font-sans text-xs text-neutral-400 max-w-md mx-auto">
              Please clear some search fields or filter sliders. Check in later for active listings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedProjects.map((p) => {
              const aiData = getAiMatchData(p);
              const isBookmarked = bookmarkedIds.includes(p.id);

              return (
                <div 
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-premium hover:shadow-card-hover hover:border-neutral-300 transition-all duration-300 flex flex-col justify-between cursor-pointer relative group"
                >
                  
                  {/* Bookmark indicator */}
                  <button 
                    onClick={(e) => handleToggleBookmark(p.id, e)}
                    className="absolute top-6 right-6 p-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200/50 transition-all cursor-pointer z-10"
                  >
                    <Bookmark className={`w-4 h-4 transition-colors ${isBookmarked ? "text-rose-500 fill-rose-500" : "text-neutral-400 hover:text-black"}`} />
                  </button>

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="space-y-1.5 pr-8">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
                        {p.companyName}
                      </span>
                      <h3 className="font-display font-black text-xl text-neutral-900 leading-snug group-hover:text-black transition-colors">
                        {p.title}
                      </h3>
                    </div>

                    {/* AI Recommendation Banner */}
                    <div className="p-3 bg-purple-50/40 border border-purple-100/50 rounded-2xl flex gap-3 items-center">
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center font-display font-black text-xs text-purple-700">
                        {aiData.score}%
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono font-bold text-purple-700 block uppercase tracking-wider">AI MATCH SCORE</span>
                        <p className="text-[10px] text-neutral-500 truncate leading-tight font-light">{aiData.reason}</p>
                      </div>
                    </div>

                    <p className="font-sans text-xs text-neutral-500 leading-relaxed font-light line-clamp-3">
                      {p.description}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.tags.map(t => (
                        <span key={t} className="text-[10px] font-mono font-semibold text-neutral-500 bg-neutral-50 border border-neutral-200/60 px-2.5 py-0.5 rounded-lg">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer metadata details */}
                  <div className="border-t border-neutral-100 mt-5 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-400 font-bold uppercase">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{p.reward}</span>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-neutral-300" />
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Remote</span>
                      </span>
                    </div>

                    <div className="text-[10px] font-bold text-neutral-800 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>View Specifications</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. PREMIUM PROJECT DETAIL MODAL */}
      <Modal
        isOpen={selectedProject !== null}
        onClose={() => setSelectedProject(null)}
        title=""
      >
        {selectedProject && (() => {
          const aiData = getAiMatchData(selectedProject);
          return (
            <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 scrollbar">
              
              {/* Header block */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                    {selectedProject.companyName}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleToggleBookmark(selectedProject.id, e)}
                      className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Bookmark</span>
                    </button>
                    <button 
                      onClick={(e) => handleShare(selectedProject, e)}
                      className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
                <h2 className="font-display font-black text-2xl text-neutral-900 tracking-tight leading-snug">
                  {selectedProject.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-neutral-400 font-bold uppercase pt-1">
                  <span className="text-neutral-800 font-extrabold bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-lg">
                    {selectedProject.reward}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <span>Timeline: 2 Weeks</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <span>Category: Tech Challenge</span>
                </div>
              </div>

              {/* AI Match Overview */}
              <div className="p-4 bg-purple-50/30 border border-purple-100/50 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-purple-700 uppercase tracking-widest block">AI Match Analysis</span>
                  <span className="font-display font-black text-purple-700 text-sm">{aiData.score}% Compatibility</span>
                </div>
                <p className="text-xs text-neutral-600 font-light leading-relaxed">
                  {aiData.reason} Our real-time matchmaking model indicates that implementing this codebase challenge will boost your <strong>Employability Index by +3 points</strong> and register verified evidence in your <strong>Skill Center</strong>.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block w-full">Verified Skills Mapping:</span>
                  {selectedProject.tags.map(tag => (
                    <span 
                      key={tag} 
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        studentProfile?.skills?.includes(tag) 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-neutral-50 text-neutral-400 border border-neutral-200/50"
                      }`}
                    >
                      {tag} {studentProfile?.skills?.includes(tag) ? "✓" : "⚡"}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabs specification details */}
              <div className="space-y-4 font-sans text-xs">
                
                {/* 1. Overview */}
                <div className="space-y-1.5">
                  <h4 className="font-display font-bold text-neutral-900 text-sm">Project Overview</h4>
                  <p className="text-neutral-500 leading-relaxed font-light whitespace-pre-line">
                    {selectedProject.description}
                  </p>
                </div>

                {/* 2. Milestones & Timelines */}
                <div className="space-y-1.5">
                  <h4 className="font-display font-bold text-neutral-900 text-sm">Project Milestones & Deliverables</h4>
                  <div className="space-y-2 mt-2">
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/40 flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-neutral-800 block">Milestone 1: Architectural Validation</span>
                        <span className="text-[10px] text-neutral-400">Implement custom profiler hooks and types definitions.</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded-md">Day 3</span>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/40 flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-neutral-800 block">Milestone 2: SVG Render Visualizer</span>
                        <span className="text-[10px] text-neutral-400">Assemble responsive SVG vector canvas and profiling charts.</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded-md">Day 8</span>
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/40 flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-neutral-800 block">Milestone 3: Peer & Mentor Audit</span>
                        <span className="text-[10px] text-neutral-400">Final sandbox evaluations, code review, and sponsor check-in.</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded-md">Day 14</span>
                    </div>
                  </div>
                </div>

                {/* 3. Deliverables */}
                <div className="space-y-1.5">
                  <h4 className="font-display font-bold text-neutral-900 text-sm">Required Technical Deliverables</h4>
                  <ul className="list-disc pl-4 space-y-1 text-neutral-500 font-light">
                    {selectedProject.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>

                {/* 4. Mentors, FAQ, Benefits */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-neutral-50/50 border border-neutral-200/40 rounded-2xl">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">ASSIGNED MENTORS</span>
                    <span className="text-xs font-semibold text-neutral-800 block mt-1">David Kang, Principal Architect</span>
                    <span className="text-[10px] text-neutral-400">Google Developer Relations Team</span>
                  </div>

                  <div className="p-3 bg-neutral-50/50 border border-neutral-200/40 rounded-2xl">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">SPONSOR BENEFIT</span>
                    <span className="text-xs font-semibold text-neutral-800 block mt-1">Hiring Fast-Track Invitation</span>
                    <span className="text-[10px] text-neutral-400">Skips core algorithm rounds upon score 90+</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="border-t border-neutral-100 pt-5 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleOpenApplyModal}
                  className="px-5 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode2 className="w-4 h-4" />
                  <span>Open Coding Workspace</span>
                </button>
              </div>

            </div>
          );
        })()}
      </Modal>

      {/* 5. CODE IDE MODAL FOR CLAIMING CHALLENGES */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={selectedProject?.title ? `Code Sandbox: ${selectedProject.title}` : "Code Sandbox"}
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-neutral-50 border border-neutral-200/60 rounded-2xl flex gap-3 items-center">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
            <div className="text-xs font-sans">
              <span className="font-bold text-neutral-800 block">AI Sandbox Evaluator Engaged</span>
              <p className="text-neutral-400 mt-0.5">Your TypeScript logic, API structures, and HTML layout tags will be evaluated immediately upon submission.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Sandbox IDE Editor</label>
            <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-inner bg-neutral-950 font-mono text-xs">
              <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center text-neutral-400 text-[10px]">
                <span>App.tsx</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <textarea
                value={submitCode}
                onChange={(e) => setSubmitCode(e.target.value)}
                rows={12}
                className="w-full bg-transparent text-neutral-100 p-4 focus:outline-hidden leading-relaxed resize-y font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
            >
              Back to Specs
            </button>
            <button
              onClick={handleApplySubmit}
              disabled={isSubmitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/10 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Solution to Cloud</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
