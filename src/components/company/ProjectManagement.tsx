import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ProjectDifficulty, ProjectStatus, Project } from "../../types";
import { 
  Plus, Edit2, Copy, Archive, Trash2, Pause, Play, Sparkles, 
  ChevronRight, ArrowUpRight, Search, Sliders, Globe, Lock, 
  UserCheck, AlertCircle, RefreshCw, FileText
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface ProjectManagementProps {
  onNavigate: (tabId: string) => void;
  onEditProject?: (project: Project) => void;
}

const TEMPLATES = [
  {
    title: "SaaS Performance Optimizer",
    description: "Implement a lightweight diagnostic hook for measuring react component render performance with visual trees.",
    difficulty: ProjectDifficulty.HARD,
    reward: "$2,500 + Full-time offer",
    requirements: ["Must support React 19", "Lightweight bundle (<5kb)", "Complete test coverage"],
    tags: ["React 19", "Vite", "SVG Canvas"]
  },
  {
    title: "Secure Google Calendar Companion",
    description: "Write an enterprise calendar companion module parsing agenda summaries with local RLS and zero-leak tokens.",
    difficulty: ProjectDifficulty.MEDIUM,
    reward: "$1,800 + Fast internship interview",
    requirements: ["Google OAuth2 validation", "Responsive workspace design", "Typescript ESM"],
    tags: ["OAuth 2.0", "Google Workspace", "Typescript"]
  },
  {
    title: "Dynamic Collaborative Canvas Sync",
    description: "Architect sub-millisecond vector math sync over WebSockets with localized state buffers and rollbacks.",
    difficulty: ProjectDifficulty.HARD,
    reward: "$3,000 + Engineering retainer",
    requirements: ["Drag-and-drop vector engine", "Simulated frame loss recovery", "Framer animations"],
    tags: ["WebSockets", "Canvas API", "Framer Motion"]
  }
];

export default function ProjectManagement({ onNavigate }: ProjectManagementProps) {
  const { projects, createProject } = useApp();
  const { success, error, info } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Managing local copies/state of projects to demonstrate Pause, Archive, Delete, and Visibility toggles
  // Since supabase database is listening to global, we can support visual updates in state
  const [managedProjects, setManagedProjects] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  React.useEffect(() => {
    if (projects.length > 0 && managedProjects.length === 0) {
      // Map global projects into our stateful managed list with visibility modifiers
      setManagedProjects(projects.map(p => ({
        ...p,
        visibility: p.status === "completed" ? "Public" : "Published", // Published, Private, Draft, Invite Only
        isArchived: false,
        isPaused: false
      })));
    } else if (projects.length > managedProjects.length) {
      // Add any newly created projects to our managed list
      const existingIds = managedProjects.map(p => p.id);
      const newProjects = projects.filter(p => !existingIds.includes(p.id)).map(p => ({
        ...p,
        visibility: "Published",
        isArchived: false,
        isPaused: false
      }));
      setManagedProjects(prev => [...newProjects, ...prev]);
    }
  }, [projects]);

  const handlePauseToggle = (id: string) => {
    setManagedProjects(prev => prev.map(p => {
      if (p.id === id) {
        const nextState = !p.isPaused;
        success(nextState ? "Project Paused" : "Project Resumed", `Successfully ${nextState ? "paused" : "resumed"} submissions for "${p.title}".`);
        return { ...p, isPaused: nextState };
      }
      return p;
    }));
  };

  const handleArchiveProject = (id: string) => {
    setManagedProjects(prev => prev.map(p => {
      if (p.id === id) {
        success("Project Archived", `Successfully archived "${p.title}". Submissions closed.`);
        return { ...p, isArchived: true, status: ProjectStatus.FILLED };
      }
      return p;
    }));
  };

  const handleDeleteProject = (id: string) => {
    setManagedProjects(prev => prev.filter(p => p.id !== id));
    success("Project Deleted", "The challenge was removed from the student marketplace.");
  };

  const handleDuplicateProject = async (proj: any) => {
    info("Duplicating...", `Creating duplicate of "${proj.title}"...`);
    await createProject(
      `Copy of ${proj.title}`,
      proj.description,
      proj.requirements || [],
      proj.difficulty || ProjectDifficulty.MEDIUM,
      proj.reward || "$1,500",
      proj.tags || []
    );
  };

  const handleCloneTemplate = async (template: typeof TEMPLATES[0]) => {
    info("Cloning Template...", `Deploying "${template.title}" challenge to active workspace...`);
    await createProject(
      template.title,
      template.description,
      template.requirements,
      template.difficulty,
      template.reward,
      template.tags
    );
    success("Template Deployed", `Standard enterprise challenge "${template.title}" is now live!`);
  };

  const handleVisibilityChange = (id: string, visibility: string) => {
    setManagedProjects(prev => prev.map(p => {
      if (p.id === id) {
        success("Visibility Updated", `"${p.title}" is now ${visibility}.`);
        return { ...p, visibility };
      }
      return p;
    }));
  };

  // AI Assisted creation suggestions
  const handleAiSuggestions = async () => {
    if (!prompt.trim()) {
      error("Prompt required", "Please describe what software challenge you want to build.");
      return;
    }
    setIsAiLoading(true);
    setAiSuggestions([]);

    try {
      // Fetch dynamic suggestions from our server-side proxy
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Draft a high-trust software coding challenge for a hiring candidate. Goal: "${prompt}".
              Provide the details as a clean, structured text list containing:
              1. A concise, professional title.
              2. 3 actionable testable requirement constraints.
              3. Target technologies/tags.`
            }
          ]
        })
      });

      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      const suggestions = data.reply.split("\n").filter((l: string) => l.trim().length > 0);
      setAiSuggestions(suggestions);
      success("AI Suggestions Drafted", "Use the suggestions to create your project challenge.");
    } catch (err) {
      // fallback suggestions
      setAiSuggestions([
        `Title: High-fidelity ${prompt} Challenge`,
        "Constraint 1: Deliver clean, functional components in TypeScript",
        "Constraint 2: Optimize render cycles with 0-flicker animations",
        "Constraint 3: Secure all client-facing state inputs",
        "Tags: TypeScript, React, TailwindCSS, State Optimization"
      ]);
      error("AI Service Fallback", "Using template drafting recommendations.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const applySuggestionToWizard = () => {
    onNavigate("create-challenge");
  };

  // Filter & Search computation
  const filteredProjects = managedProjects.filter(p => {
    if (p.isArchived) return false;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === "all" || p.difficulty === selectedDifficulty;
    
    let matchesStatus = true;
    if (selectedStatus === "paused") matchesStatus = p.isPaused;
    else if (selectedStatus === "open") matchesStatus = p.status === "open" && !p.isPaused;
    else if (selectedStatus === "filled") matchesStatus = p.status === "filled";
    else if (selectedStatus === "completed") matchesStatus = p.status === "completed";

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            Hiring Sandbox Architecture
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            Enterprise Project Management
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Build, duplicate, pause, or configure sandbox code environments mapped to target talent specifications.
          </p>
        </div>
        <button 
          onClick={() => onNavigate("create-challenge")}
          className="h-10 px-4 bg-black text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Project Wizard</span>
        </button>
      </div>

      {/* 2. AI Assisted drafting drawer */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-neutral-900" />
          <h3 className="font-display font-bold text-sm text-neutral-900">AI-Assisted Project Design Lab</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-9">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Build an SVG performance engine or a WebSocket real-time synchronizer"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs focus:outline-hidden focus:border-black font-light"
            />
          </div>
          <button 
            onClick={handleAiSuggestions}
            disabled={isAiLoading}
            className="md:col-span-3 h-10 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Draft with Gemini AI</span>
          </button>
        </div>

        {aiSuggestions.length > 0 && (
          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4 text-xs space-y-3 font-sans leading-relaxed animate-fadeIn">
            <span className="font-bold text-neutral-900 block">Gemini Recommended Draft Constraints:</span>
            <div className="text-[11px] text-neutral-600 space-y-1 font-light">
              {aiSuggestions.map((s, i) => (
                <p key={i} className="flex gap-2 items-start">
                  <span className="text-neutral-900 font-bold">•</span>
                  <span>{s}</span>
                </p>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={applySuggestionToWizard}
                className="px-3.5 py-1.5 bg-black text-white rounded-lg text-[10px] font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Populate Project Wizard</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Pre-defined Templates cloning */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-display font-bold text-sm text-neutral-900">Standard Corporate Templates</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Deploy vetted software tests to evaluate general development frameworks immediately.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((tmpl, idx) => (
            <div key={idx} className="border border-neutral-200 hover:border-neutral-300 rounded-2xl p-4 bg-neutral-50/50 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-neutral-900">{tmpl.title}</h4>
                  <span className="text-[9px] font-mono font-bold bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200">
                    {tmpl.difficulty}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-light leading-relaxed line-clamp-2">{tmpl.description}</p>
              </div>

              <button 
                onClick={() => handleCloneTemplate(tmpl)}
                className="mt-4 px-3 py-1.5 bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-800 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Clone and Deploy Template</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Active List section */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges by title..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-600 focus:outline-hidden w-full md:w-auto"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-600 focus:outline-hidden w-full md:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="open">Active Open</option>
              <option value="paused">Paused</option>
              <option value="filled">Filled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* List table */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 rounded-2xl space-y-2">
            <AlertCircle className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">No challenges match your criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((p) => (
              <div 
                key={p.id} 
                className={`border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                  p.isPaused 
                    ? "bg-neutral-50/50 border-neutral-200/50 opacity-75" 
                    : "bg-white border-neutral-200 hover:border-neutral-300 shadow-xs"
                }`}
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900 truncate">{p.title}</h3>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                      p.difficulty === "Hard" ? "bg-rose-50 text-rose-600 border-rose-100" :
                      p.difficulty === "Medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}>
                      {p.difficulty}
                    </span>
                    <span className="text-[9px] font-mono bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
                      {p.visibility || "Published"}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500 font-light leading-relaxed line-clamp-2">
                    {p.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-neutral-400">
                    <span>Reward: <strong className="text-neutral-800">{p.reward}</strong></span>
                    <span>•</span>
                    <span>Created: {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Operations */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 md:border-l md:border-neutral-100 md:pl-6">
                  {/* Visibility Toggler */}
                  <select 
                    value={p.visibility || "Published"}
                    onChange={(e) => handleVisibilityChange(p.id, e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-[10px] text-neutral-600 focus:outline-hidden"
                  >
                    <option value="Published">Published</option>
                    <option value="Private">Private</option>
                    <option value="Draft">Draft</option>
                    <option value="Invite Only">Invite Only</option>
                  </select>

                  <button 
                    onClick={() => handlePauseToggle(p.id)}
                    title={p.isPaused ? "Resume submissions" : "Pause submissions"}
                    className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors"
                  >
                    {p.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>

                  <button 
                    onClick={() => handleDuplicateProject(p)}
                    title="Duplicate Project"
                    className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => handleArchiveProject(p.id)}
                    title="Archive Project"
                    className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => handleDeleteProject(p.id)}
                    title="Delete Project"
                    className="p-2 hover:bg-rose-50 rounded-lg text-neutral-400 hover:text-rose-600 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
