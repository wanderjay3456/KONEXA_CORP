import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { UserRole, ProjectDifficulty } from "../../types";
import { 
  Layers, CheckSquare, Calendar, Video, FileText, MessageSquare, 
  Sparkles, Clock, AlertTriangle, ArrowRight, User, Plus, Trash2, 
  Send, ListTodo, Eye, Edit, CheckCircle, Flame, ExternalLink, ChevronRight,
  FolderPlus, FilePlus, Download, Share2, Shield, Folder, File, ArrowLeft,
  Workflow, FileCheck, Award, TrendingUp, BarChart2, ShieldCheck, Cpu, Play, Undo, Save,
  X, CheckCircle2, AlertCircle, RefreshCw, FileSearch, HelpCircle, Activity, Pin,
  Volume2, Smile, ArrowUpRight, Search, ListFilter
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

// ==========================================
// DB/SCHEMA ENUMS & TYPES
// ==========================================
enum ProjectLifecycle {
  DRAFT = "Draft",
  PUBLISHED = "Published",
  RECRUITING = "Recruiting",
  CANDIDATE_SELECTION = "Candidate Selection",
  STARTED = "Project Started",
  PLANNING = "Planning",
  EXECUTION = "Execution",
  REVIEW = "Review",
  REVISION = "Revision",
  COMPLETED = "Completed",
  EVALUATION = "Evaluation",
  HIRING_DECISION = "Hiring Decision",
  ARCHIVED = "Archived",
  CANCELLED = "Cancelled"
}

interface WorkspaceTask {
  id: string;
  title: string;
  type: "Task" | "Subtask" | "Epic" | "Milestone";
  priority: "High" | "Medium" | "Low";
  status: "backlog" | "todo" | "progress" | "review" | "blocked" | "completed";
  dueDate: string;
  epicId?: string;
  milestoneId?: string;
  estimatedTime: number; // hours
  actualTime: number; // hours
  labels: string[];
  assignee: string;
  dependencies: string[]; // Task IDs
  checklist: { id: string; text: string; done: boolean }[];
  comments: { id: string; user: string; text: string; time: string; role: string }[];
  approvals: { role: string; approved: boolean; date: string; comments?: string }[];
  recurring: boolean;
  aiSuggestions?: string[];
}

interface WorkspaceFile {
  id: string;
  name: string;
  type: "pdf" | "image" | "code" | "zip" | "video" | "cad" | "doc";
  size: string;
  folderId: string | null;
  uploader: string;
  time: string;
  version: string;
  history: { version: string; date: string; uploader: string; action: string }[];
  permissions: { role: string; access: "read" | "write" | "admin" }[];
  url?: string;
  contentSnippet?: string;
}

interface WorkspaceFolder {
  id: string;
  name: string;
  parentId: string | null;
}

interface ThreadedComment {
  id: string;
  taskId?: string;
  user: string;
  role: string;
  text: string;
  time: string;
  reactions: { emoji: string; users: string[] }[];
  replies?: ThreadedComment[];
}

interface VideoMeeting {
  id: string;
  platform: "Google Meet" | "Teams" | "Zoom" | "Jitsi";
  title: string;
  scheduledAt: string;
  duration: number; // minutes
  joinUrl: string;
  recordingUrl?: string;
  recordingSize?: string;
  notes: string;
}

interface Deliverable {
  id: string;
  title: string;
  version: string;
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected" | "revision_requested";
  codeSnippet?: string;
  fileSize?: string;
  feedback?: string;
  history: { version: string; date: string; status: string; notes?: string }[];
}

interface TrustEvidence {
  id: string;
  category: "Attendance" | "Deadline" | "Task Quality" | "Communication" | "Review Quality" | "Mentoring" | "Project Contribution" | "Leadership" | "Reliability" | "Professionalism";
  description: string;
  scoreBonus: number;
  hash: string;
  timestamp: string;
}

interface CompanyProjectWorkspaceProps {
  onNavigate: (tabId: string) => void;
}

export default function CompanyProjectWorkspace({ onNavigate }: CompanyProjectWorkspaceProps) {
  const { studentProfile } = useApp();
  const { success, error, info } = useToast();

  // Active workspace projects (from claimed applications or auto-seeded templates)
  const activeStudentName = studentProfile?.name || "Alex Rivera";
  
  // Current project's complete lifecycle state
  const [currentLifecycle, setCurrentLifecycle] = useState<ProjectLifecycle>(ProjectLifecycle.EXECUTION);
  const [lifecycleHistory, setLifecycleHistory] = useState<Array<{ stage: ProjectLifecycle; timestamp: string; note: string }>>([
    { stage: ProjectLifecycle.DRAFT, timestamp: "2026-07-01 10:00", note: "Initial design uploaded by sponsor." },
    { stage: ProjectLifecycle.PUBLISHED, timestamp: "2026-07-02 11:30", note: "Challenge set live to platform." },
    { stage: ProjectLifecycle.RECRUITING, timestamp: "2026-07-02 12:00", note: "Student claims unlocked." },
    { stage: ProjectLifecycle.STARTED, timestamp: "2026-07-04 09:00", note: "Sponsor approved sandbox team creation." },
    { stage: ProjectLifecycle.PLANNING, timestamp: "2026-07-05 14:00", note: "Milestone schedule established." },
    { stage: ProjectLifecycle.EXECUTION, timestamp: "2026-07-06 09:00", note: "Active development node spin-up." }
  ]);

  // Workspace sub-tabs (Project Operating System menu)
  const [workspaceTab, setWorkspaceTab] = useState<
    "overview" | "tasks" | "files" | "calendar" | "chat" | "meetings" | "deliverables" | "reviews" | "performance" | "trust" | "hiring" | "analytics" | "ai-coop"
  >("deliverables");

  // Sub-navigation state
  const [tasksView, setTasksView] = useState<"kanban" | "list">("kanban");

  // Epics & Milestones Schema
  const [epics] = useState([
    { id: "epic_1", title: "React Hook Core Engine", description: "All hook structures, timers and performance profiling." },
    { id: "epic_2", title: "SVG Visualizations Hub", description: "Responsive drawing vectors, coordinates matrices and zooms." }
  ]);

  const [milestones] = useState([
    { id: "ms_1", title: "Milestone 1: Hook Architecture & Types", date: "2026-07-10", status: "completed" },
    { id: "ms_2", title: "Milestone 2: SVG Render Tree Canvas", date: "2026-07-17", status: "in-progress" },
    { id: "ms_3", title: "Milestone 3: WebSocket Synchronization Loop", date: "2026-07-24", status: "pending" }
  ]);

  // Task System State
  const [tasks, setTasks] = useState<WorkspaceTask[]>([
    {
      id: "t_1",
      title: "Define profiling hook usePerformanceProfiler signatures",
      type: "Task",
      priority: "High",
      status: "progress",
      dueDate: "2026-07-12",
      epicId: "epic_1",
      milestoneId: "ms_1",
      estimatedTime: 8,
      actualTime: 6.5,
      labels: ["TypeScript", "React Core"],
      assignee: activeStudentName,
      dependencies: [],
      checklist: [
        { id: "c_1", text: "Declare TS signature options interface", done: true },
        { id: "c_2", text: "Bind React root state render counters", done: false }
      ],
      comments: [
        { id: "co_1", user: "You (Sponsor Reviewer)", text: "Verify type compatibility with React 19 concurrent renders.", time: "4h ago", role: "mentor" }
      ],
      approvals: [],
      recurring: false,
      aiSuggestions: ["Wrap options in a persistent ref to bypass rendering lags", "Ensure useLayoutEffect is guarded for server side compilation"]
    },
    {
      id: "t_2",
      title: "Deploy lightweight HTML sanitization parser",
      type: "Task",
      priority: "Medium",
      status: "todo",
      dueDate: "2026-07-15",
      estimatedTime: 5,
      actualTime: 0,
      labels: ["Security", "Helper"],
      assignee: activeStudentName,
      dependencies: ["t_1"],
      checklist: [
        { id: "c_3", text: "Regular expression filter list", done: false },
        { id: "c_4", text: "Write HTML entity encoder test cases", done: false }
      ],
      comments: [],
      approvals: [],
      recurring: false
    }
  ]);

  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState<"Task" | "Subtask" | "Epic" | "Milestone">("Task");
  const [newTaskPriority, setNewTaskPriority] = useState<"High" | "Medium" | "Low">("Medium");

  // Files & Folders State
  const [folders, setFolders] = useState<WorkspaceFolder[]>([
    { id: "fol_1", name: "Specification Specs", parentId: null },
    { id: "fol_2", name: "React Profiler Boilerplates", parentId: null },
    { id: "fol_3", name: "Assets & Diagrams", parentId: null }
  ]);

  const [files, setFiles] = useState<WorkspaceFile[]>([
    {
      id: "f_1",
      name: "vercel_architecture_specs_v2.pdf",
      type: "pdf",
      size: "2.4 MB",
      folderId: "fol_1",
      uploader: "Sponsor Administrator",
      time: "2 days ago",
      version: "v2.1",
      history: [
        { version: "v1.0", date: "2026-07-02", uploader: "Sponsor Reviewer", action: "Uploaded initial spec outline" },
        { version: "v2.1", date: "2026-07-07", uploader: "Horizon Labs Reviewer", action: "Updated performance thresholds" }
      ],
      permissions: [
        { role: "student", access: "read" },
        { role: "mentor", access: "admin" }
      ]
    },
    {
      id: "f_2",
      name: "profiler_hook_diagnostic.ts",
      type: "code",
      size: "18 KB",
      folderId: "fol_2",
      uploader: activeStudentName,
      time: "1 day ago",
      version: "v1.2",
      history: [
        { version: "v1.0", date: "2026-07-05", uploader: activeStudentName, action: "Created blank hook skeleton" },
        { version: "v1.2", date: "2026-07-08", uploader: activeStudentName, action: "Integrated useRef counters" }
      ],
      permissions: [
        { role: "student", access: "write" },
        { role: "mentor", access: "write" }
      ],
      contentSnippet: `import { useRef, useEffect } from 'react';\n\nexport function usePerformanceProfiler(id: string) {\n  const startTime = useRef(performance.now());\n  const renderCount = useRef(0);\n\n  useEffect(() => {\n    const elapsed = performance.now() - startTime.current;\n    console.log(\`[Profiler:\${id}] Render #\${renderCount.current} elapsed: \${elapsed}ms\`);\n    renderCount.current++;\n  });\n}`
    }
  ]);

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState<WorkspaceFile["type"]>("code");
  const [fileSnippetInput, setFileSnippetInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);

  // Communications State
  const [chatMessages, setChatMessages] = useState<ThreadedComment[]>([
    {
      id: "m_1",
      user: "You (Sponsor Reviewer)",
      role: "mentor",
      text: "Welcome to the performance optimizer workspace node. Make sure to optimize SVG memory allocations.",
      time: "2 days ago",
      reactions: [{ emoji: "🚀", users: ["You"] }],
      replies: [
        {
          id: "m_1_1",
          user: `${activeStudentName} (Candidate)`,
          role: "student",
          text: "I am allocating custom rendering micro-buffers. Let me know if you need to run performance profiles on Chrome v8 engines.",
          time: "1 day ago",
          reactions: []
        }
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Meetings State
  const [meetings, setMeetings] = useState<VideoMeeting[]>([
    {
      id: "mt_1",
      platform: "Google Meet",
      title: "Sprint Alignment & Architecture Review",
      scheduledAt: "2026-07-11 15:00",
      duration: 30,
      joinUrl: "https://meet.google.com/abc-defg-hij",
      notes: "Establish vector drawing schemas and discuss sub-millisecond sync latencies."
    }
  ]);
  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [newMeetPlatform, setNewMeetPlatform] = useState<VideoMeeting["platform"]>("Google Meet");
  const [newMeetDate, setNewMeetDate] = useState("2026-07-12 14:00");

  // Deliverables State
  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    {
      id: "del_1",
      title: "Phase 1: Performance Profiler Skeleton",
      version: "v1.1.0",
      submittedBy: activeStudentName,
      submittedAt: "2 days ago",
      status: "approved",
      codeSnippet: `export function usePerformanceProfiler() {\n  // Skeleton code accepted\n}`,
      feedback: "Architecture schema is elegant. Commencing full feature build.",
      history: [{ version: "v1.1.0", date: "2 days ago", status: "approved", notes: "Approved on first pass." }]
    },
    {
      id: "del_2",
      title: "Phase 2: Live SVG Vector Tree Visualizer",
      version: "v2.0.2",
      submittedBy: activeStudentName,
      submittedAt: "Just now",
      status: "pending",
      codeSnippet: `export function SVGVisualizerTree({ rootNode }) {\n  // Render vector matrices with recursive loops\n  return <svg className="w-full h-96">...</svg>\n}`,
      history: [
        { version: "v2.0.1", date: "1 day ago", status: "revision_requested", notes: "Lacks zoom-matrix handlers." },
        { version: "v2.0.2", date: "Just now", status: "pending", notes: "Added matrix viewport scale parameters." }
      ]
    }
  ]);

  // Trust Evidence State
  const [trustEvidences, setTrustEvidences] = useState<TrustEvidence[]>([
    { id: "tr_1", category: "Attendance", description: "Attended all sprint standups and aligned milestones.", scoreBonus: 2, hash: "sha256_8f0a21...", timestamp: "2 days ago" },
    { id: "tr_2", category: "Deadline", description: "Completed Milestone 1 (Arch-specs) 4 hours early.", scoreBonus: 3, hash: "sha256_3b11da...", timestamp: "1 day ago" }
  ]);

  // AI Cooperative Chat State (9 Cooperative Agents)
  const [aiCoopChat, setAiCoopChat] = useState<Array<{ agent: string; avatar: string; color: string; text: string; time: string }>>([]);
  const [aiCoopInput, setAiCoopInput] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  // ==========================================
  // HANDLERS & OPERATIONS
  // ==========================================

  // Lifecycle & Rollback Handler
  const handleLifecycleTransition = (nextStage: ProjectLifecycle) => {
    setCurrentLifecycle(nextStage);
    const newRecord = {
      stage: nextStage,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      note: `Transitioned project lifecycle to ${nextStage}.`
    };
    setLifecycleHistory(prev => [newRecord, ...prev]);
    success("Lifecycle Updated", `Project is now in the "${nextStage}" phase.`);
  };

  const handleRollbackLifecycle = () => {
    if (lifecycleHistory.length <= 1) {
      info("Rollback Blocked", "No historical stages detected to roll back to.");
      return;
    }
    const previous = lifecycleHistory[1].stage;
    setCurrentLifecycle(previous);
    setLifecycleHistory(prev => [
      {
        stage: previous,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        note: `ROLLBACK: Rolled back lifecycle from ${lifecycleHistory[0].stage} to ${previous}.`
      },
      ...prev.slice(1)
    ]);
    success("Lifecycle Restored", `Rolled back project environment to "${previous}" phase.`);
  };

  // Kanban & Task Operations
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const added: WorkspaceTask = {
      id: `t_${Date.now()}`,
      title: newTaskTitle.trim(),
      type: newTaskType,
      priority: newTaskPriority,
      status: "todo",
      dueDate: "2026-07-22",
      estimatedTime: 8,
      actualTime: 0,
      labels: [newTaskType, "Hiring Candidate"],
      assignee: activeStudentName,
      dependencies: [],
      checklist: [],
      comments: [],
      approvals: [],
      recurring: false
    };

    setTasks(prev => [...prev, added]);
    setNewTaskTitle("");
    success("Task Created", `Successfully logged new "${newTaskType}": ${added.title}`);
  };

  const handleUpdateTaskStatus = (id: string, nextStatus: WorkspaceTask["status"]) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: nextStatus };
      }
      return t;
    }));
    success("Board Synced", "Task status synchronized across the collaboration nodes.");
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    info("Task Deleted", "Removed task node from global timeline.");
  };

  // File Operations
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const added: WorkspaceFolder = {
      id: `fol_${Date.now()}`,
      name: newFolderName.trim(),
      parentId: activeFolderId
    };

    setFolders(prev => [...prev, added]);
    setNewFolderName("");
    success("Folder Created", `Created folder: "${added.name}"`);
  };

  const handleUploadFileSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const added: WorkspaceFile = {
      id: `f_${Date.now()}`,
      name: newFileName.trim() + (newFileName.includes(".") ? "" : "." + (newFileType === "code" ? "ts" : newFileType === "pdf" ? "pdf" : "png")),
      type: newFileType,
      size: "124 KB",
      folderId: activeFolderId,
      uploader: "You (Sponsor Reviewer)",
      time: "Just now",
      version: "v1.0",
      history: [{ version: "v1.0", date: "Just now", uploader: "Sponsor", action: "Uploaded file to cloud" }],
      permissions: [
        { role: "student", access: "write" },
        { role: "mentor", access: "write" }
      ],
      contentSnippet: newFileType === "code" ? (fileSnippetInput || "// Skeleton code") : undefined
    };

    setFiles(prev => [...prev, added]);
    setNewFileName("");
    setFileSnippetInput("");
    success("File Deposited", `Uploaded secure document "${added.name}" to workspace.`);
  };

  // Chat Operations
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const added: ThreadedComment = {
      id: `m_${Date.now()}`,
      user: "You (Sponsor Reviewer)",
      role: "mentor",
      text: chatInput.trim(),
      time: "Just now",
      reactions: []
    };

    setChatMessages(prev => [...prev, added]);
    setChatInput("");
    success("Message Synced", "Broadcasting workspace node notification.");
  };

  // Video Meeting Scheduling
  const handleScheduleMeet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetTitle.trim()) return;

    const added: VideoMeeting = {
      id: `mt_${Date.now()}`,
      platform: newMeetPlatform,
      title: newMeetTitle.trim(),
      scheduledAt: newMeetDate,
      duration: 30,
      joinUrl: `https://${newMeetPlatform.toLowerCase().replace(" ", "")}.com/meet_${Math.random().toString(36).substring(6)}`,
      notes: "Sprint check-in and automated testing audit."
    };

    setMeetings(prev => [added, ...prev]);
    setNewMeetTitle("");
    success("Meeting Scheduled", `Successfully reserved Google/Outlook slots for "${added.title}".`);
  };

  // Moderate deliverables (Reject/Revision/Approve)
  const handleModerateDeliverable = (delId: string, action: "approved" | "rejected" | "revision_requested", feedbackText: string) => {
    setDeliverables(prev => prev.map(del => {
      if (del.id === delId) {
        const updatedRecord = {
          ...del,
          status: action,
          feedback: feedbackText || `Solution has been marked as ${action}.`,
          history: [...del.history, { version: del.version, date: "Just now", status: action, notes: feedbackText }]
        };

        if (action === "approved") {
          // Grant trust reward
          setTrustEvidences(prevEv => [
            {
              id: `tr_${Date.now()}`,
              category: "Task Quality",
              description: `Approved Deliverable: "${del.title}"`,
              scoreBonus: 5,
              hash: "sha256_" + Math.random().toString(36).substring(7),
              timestamp: "Just now"
            },
            ...prevEv
          ]);
        }

        success("Deliverable Audited", `Status locked to ${action}. Audit synced to Trust Ledger.`);
        return updatedRecord;
      }
      return del;
    }));
  };

  // AI Cooperatives Discussion Trigger
  const handleTriggerAiCoopAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCoopInput.trim() || aiGenerating) return;

    const userPrompt = aiCoopInput.trim();
    setAiCoopChat(prev => [...prev, {
      agent: "You",
      avatar: "U",
      color: "text-neutral-700 bg-neutral-100 border-neutral-300",
      text: userPrompt,
      time: "Just now"
    }]);
    setAiCoopInput("");
    setAiGenerating(true);

    try {
      const prompt = `You are simulating 3 distinct AI Project agents collaborating on a task.
      User request: "${userPrompt}".
      Agent 1: AI Project Manager (focused on timeline and milestones).
      Agent 2: AI Scrum Master (focused on sprint velocity and tasks).
      Agent 3: AI Risk Analyzer (focused on code issues, scale risks and performance constraints).
      Write a short collaborative thread where these 3 agents discuss the user's request and offer an aligned solution.
      Format your response as direct, concise quote snippets from each agent.`;

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] })
      });

      if (!response.ok) throw new Error("Offline");
      const data = await response.json();
      
      if (!data.reply) throw new Error("AI 응답이 비어 있습니다.");
      setAiCoopChat(prev => [...prev, { agent: "AI Project Team", avatar: "AI", color: "text-indigo-600 bg-indigo-50 border-indigo-200", text: data.reply, time: "Just now" }]);
    } catch (cause) {
      error("AI 협업 분석 실패", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setAiGenerating(false);
    }
  };

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100) || 0;

  const performanceRadarData = [
    { subject: "Task Completion", A: completionPercentage || 75, B: 85, fullMark: 100 },
    { subject: "Deadline", A: 92, B: 80, fullMark: 100 },
    { subject: "Productivity", A: 88, B: 85, fullMark: 100 },
    { subject: "Participation", A: 95, B: 90, fullMark: 100 },
    { subject: "Leadership", A: 85, B: 75, fullMark: 100 },
    { subject: "Quality", A: 91, B: 85, fullMark: 100 }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6 scrollbar">
      
      {/* ==========================================
          HEADER SECTION
         ========================================== */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
              SPONSOR OPERATIONS HUB
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-[10px] font-mono text-neutral-400 font-semibold uppercase">
              SANDBOX TEAM NODE
            </span>
          </div>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            Sponsor Workspace Control Center
          </h1>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            Vetting candidate deliveries, setting sprint checkpoints, and analyzing full-time hiring readiness metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate("company-projects")}
            className="px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Project Management</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          PROJECT LIFECYCLE & TIMELINE RAIL
         ========================================== */}
      <div className="max-w-7xl mx-auto bg-white border border-neutral-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-neutral-700" />
            <h3 className="font-display font-bold text-sm text-neutral-900">Active Project Lifecycle Status</h3>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleRollbackLifecycle}
              className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Rollback environment and state to previous lifecycle phase."
            >
              <Undo className="w-3.5 h-3.5" />
              <span>Rollback Stage</span>
            </button>
            <select
              value={currentLifecycle}
              onChange={(e) => handleLifecycleTransition(e.target.value as ProjectLifecycle)}
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-[10px] text-neutral-600 focus:outline-hidden"
            >
              {Object.values(ProjectLifecycle).map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Lifecycle Steps Indicator */}
        <div className="grid grid-cols-2 md:grid-cols-7 xl:grid-cols-15 gap-2 pt-2 text-[10px] font-mono select-none">
          {Object.values(ProjectLifecycle).map((stage) => {
            const isCurrent = currentLifecycle === stage;
            const historyMatch = lifecycleHistory.some(h => h.stage === stage);

            return (
              <div 
                key={stage}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col justify-between ${
                  isCurrent 
                    ? "bg-black border-black text-white shadow-md shadow-neutral-900/10 scale-102" 
                    : historyMatch 
                    ? "bg-neutral-50/80 border-neutral-200 text-neutral-800" 
                    : "bg-white/40 border-neutral-100 text-neutral-400 font-light"
                }`}
              >
                <div className="font-bold truncate" title={stage}>{stage}</div>
                <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-2 ${isCurrent ? "bg-emerald-400" : historyMatch ? "bg-neutral-800" : "bg-neutral-100"}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ==========================================
          WORKSPACE GRID MENU RAILS
         ========================================== */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Navigation panel (3/12) */}
        <div className="xl:col-span-3 bg-white border border-neutral-200 rounded-3xl p-4 space-y-4 shadow-xs">
          <div>
            <span className="text-[9px] font-mono font-bold text-neutral-400 block uppercase">SPONSOR MODERATION</span>
            <span className="text-sm font-display font-black text-neutral-800 block">Workspace OS Panel</span>
          </div>

          <div className="space-y-1">
            {[
              { id: "deliverables", label: "Deliverables Audit", icon: FileCheck },
              { id: "overview", label: "Project Vitals", icon: Layers },
              { id: "tasks", label: "Task Board & Epics", icon: CheckSquare },
              { id: "files", label: "Secure Document File system", icon: Folder },
              { id: "calendar", label: "Schedules Calendars", icon: Calendar },
              { id: "chat", label: "Communication Chat", icon: MessageSquare },
              { id: "meetings", label: "Video Scheduling", icon: Video },
              { id: "reviews", label: "Hiring Evaluations", icon: Award },
              { id: "performance", label: "Candidate Performance", icon: TrendingUp },
              { id: "trust", label: "Verifiable Trust Ledger", icon: ShieldCheck },
              { id: "hiring", label: "Employment Preparation", icon: FileSearch },
              { id: "ai-coop", label: "AI Workforce Forum", icon: Cpu }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setWorkspaceTab(tab.id as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    workspaceTab === tab.id ? "bg-neutral-900 text-white shadow-xs" : "text-neutral-500 hover:text-black hover:bg-neutral-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.id === "ai-coop" && workspaceTab !== "ai-coop" ? "text-purple-500" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Central dynamic viewport (9/12) */}
        <div className="xl:col-span-9 bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs min-h-[620px] flex flex-col justify-between">
          <div className="space-y-6">

            {/* ==========================================
                TAB 1: DELIVERABLES MANAGEMENT & AUDIT
               ========================================== */}
            {workspaceTab === "deliverables" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Deliverable Vetting & Rewrite Console</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Audit candidate uploads, request revision loops, write comments, and grant code approvals.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {deliverables.map(del => {
                    const [feedbackInput, setFeedbackInput] = useState("");
                    return (
                      <div key={del.id} className="p-5 border border-neutral-200 rounded-2xl bg-neutral-50/40 space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                          <div>
                            <strong className="text-sm text-neutral-800 block">{del.title}</strong>
                            <span className="text-[10px] font-mono text-neutral-400">Submitted by {del.submittedBy} • Version {del.version} | {del.submittedAt}</span>
                          </div>

                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            del.status === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            del.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" :
                            "bg-rose-50 text-rose-600 border-rose-100"
                          }`}>{del.status}</span>
                        </div>

                        {del.codeSnippet && (
                          <div className="bg-neutral-950 text-neutral-200 font-mono text-[10px] p-4 rounded-xl overflow-x-auto max-h-48 shadow-inner">
                            <pre>{del.codeSnippet}</pre>
                          </div>
                        )}

                        {del.status === "pending" ? (
                          <div className="space-y-3.5 border-t border-neutral-200/50 pt-4 text-xs">
                            <div className="space-y-1">
                              <label className="font-bold text-neutral-700">Write Vetting Audit Feedback / Request Rewrite Guideline</label>
                              <input 
                                type="text" 
                                value={feedbackInput}
                                onChange={(e) => setFeedbackInput(e.target.value)}
                                placeholder="e.g. Excellent generic implementation. Ready for final scale tests..."
                                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 focus:outline-hidden"
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleModerateDeliverable(del.id, "rejected", feedbackInput)}
                                className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-[10px] font-semibold cursor-pointer"
                              >
                                Reject & Request Rewrite Loop
                              </button>
                              <button 
                                onClick={() => handleModerateDeliverable(del.id, "approved", feedbackInput)}
                                className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl text-[10px] font-semibold cursor-pointer flex items-center gap-1.5 shadow-sm"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Lock Code Approval</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-white border border-neutral-200 rounded-xl space-y-1">
                            <strong className="text-xs font-bold text-neutral-800 block">Committed Audit Feedback:</strong>
                            <p className="text-xs text-neutral-500 font-light font-sans">"{del.feedback || "Approved on first pass."}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 2: OVERVIEW
               ========================================== */}
            {workspaceTab === "overview" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Project Vitals</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Parameters, timeline guidelines, and expected delivery targets.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/50 space-y-2">
                    <h4 className="text-xs font-bold text-neutral-800">Objectives & Focus Areas</h4>
                    <p className="text-xs text-neutral-500 font-light leading-relaxed">
                      Build modular usePerformanceProfiler generic hooks capable of zero runtime memory overhead, rendering high-resolution SVG drawing matrices inside React 19 sandbox concurrent modules.
                    </p>
                  </div>

                  <div className="p-5 border border-neutral-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Hiring Guidelines</h4>
                    <p className="text-xs text-neutral-600 font-light leading-relaxed">
                      Sponsor conversion pathways scheduled immediately upon approved completion of Milestone #3.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 3: TASKS BOARD
               ========================================== */}
            {workspaceTab === "tasks" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Sprint Tasks Board</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Moderate candidate task boards, assign new features, and review estimated hours.</p>
                  </div>
                </div>

                {/* Quick create task form */}
                <form onSubmit={handleAddTask} className="bg-neutral-50 border border-neutral-200/50 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                  <input 
                    type="text" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Assign new task, epic, or milestone..."
                    className="md:col-span-2 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-xs focus:outline-hidden focus:border-black font-light"
                  />
                  <div className="flex gap-2 w-full md:col-span-2">
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as any)}
                      className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 text-xs focus:outline-hidden text-neutral-600"
                    >
                      <option value="Task">Task</option>
                      <option value="Epic">Epic</option>
                      <option value="Milestone">Milestone</option>
                    </select>

                    <button 
                      type="submit"
                      className="px-4 bg-black text-white hover:bg-neutral-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {([
                    { id: "todo", label: "To Do" },
                    { id: "progress", label: "In Progress" },
                    { id: "completed", label: "Completed" }
                  ] as const).map((col) => {
                    const colTasks = tasks.filter(t => t.status === col.id);
                    return (
                      <div key={col.id} className="bg-neutral-50/60 border border-neutral-200/50 rounded-2xl p-3 flex flex-col h-[320px]">
                        <div className="flex justify-between items-center pb-3 border-b border-neutral-200 mb-3 select-none">
                          <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">{col.label}</span>
                          <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-200/50 px-2 py-0.5 rounded-md">{colTasks.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar pr-0.5">
                          {colTasks.map((t) => (
                            <div 
                              key={t.id}
                              onClick={() => setSelectedTask(t)}
                              className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl p-3.5 shadow-xs space-y-2 cursor-pointer transition-all"
                            >
                              <h4 className="text-xs font-semibold text-neutral-800 leading-snug line-clamp-2">{t.title}</h4>
                              <div className="flex justify-between items-center border-t border-neutral-100/60 pt-2.5 text-[10px] text-neutral-400">
                                <span className="font-mono">{t.dueDate}</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateTaskStatus(t.id, col.id === "todo" ? "progress" : "completed");
                                  }}
                                  className="text-teal-600 hover:text-teal-700 font-bold font-mono text-[9px] cursor-pointer"
                                >
                                  Move →
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 4: SECURE FILES & FOLDERS
               ========================================== */}
            {workspaceTab === "files" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Secure Document Storage</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Audit reference specs, wireframes, and track file revisions hashes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Folders structure */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Workspace Folders</span>
                    <div className="space-y-1">
                      <button 
                        onClick={() => setActiveFolderId(null)}
                        className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-left cursor-pointer ${activeFolderId === null ? "bg-neutral-100 text-neutral-800" : "text-neutral-500"}`}
                      >
                        <Layers className="w-4 h-4" />
                        <span>All Documents</span>
                      </button>
                      {folders.map(fol => (
                        <button 
                          key={fol.id}
                          onClick={() => setActiveFolderId(fol.id)}
                          className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-left cursor-pointer ${activeFolderId === fol.id ? "bg-neutral-100 text-neutral-800" : "text-neutral-500"}`}
                        >
                          <Folder className="w-4 h-4 text-amber-500" />
                          <span className="truncate">{fol.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column (2/3): Files listing */}
                  <div className="md:col-span-2 space-y-4">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Documents Files</span>
                    <div className="space-y-2">
                      {files.filter(f => activeFolderId === null || f.folderId === activeFolderId).map(file => (
                        <div key={file.id} className="p-4 border border-neutral-200 rounded-2xl flex justify-between items-center flex-wrap gap-4">
                          <div className="flex gap-3 items-center">
                            <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                              <FileText className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                              <strong className="text-xs text-neutral-800 block">{file.name}</strong>
                              <span className="text-[10px] font-mono text-neutral-400">{file.size} • Uploaded by {file.uploader}</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => setSelectedFile(file)}
                            className="px-2 py-1 bg-neutral-50 hover:bg-neutral-100 rounded border border-neutral-200 text-[10px] font-mono text-neutral-600 cursor-pointer"
                          >
                            Preview Code
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 5: CALENDAR
               ========================================== */}
            {workspaceTab === "calendar" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Deadline & Meeting Calendar</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Timezone-aware planning, deadlines compatibility and meeting slots.</p>
                  </div>
                </div>

                <div className="p-5 border border-neutral-200 rounded-3xl text-center text-xs text-neutral-500 py-12">
                  <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <span>Interactive Calendar view synchronized with active Google Calendar / Microsoft Outlook schedules.</span>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 6: CHAT
               ========================================== */}
            {workspaceTab === "chat" && (
              <div className="flex flex-col h-[520px] justify-between animate-fadeIn">
                <div>
                  <h2 className="font-display font-black text-xl text-neutral-900">Sponsor Alignment Chat</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Broadcast guidelines and communicate dynamically with sandbox developers.</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 my-4 p-4 border border-neutral-200/60 rounded-2xl bg-neutral-50/40 scrollbar">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex gap-3.5 max-w-[85%] ${msg.user.includes("You") ? "ml-auto flex-row-reverse" : ""}`}>
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200/80 font-bold text-xs flex items-center justify-center text-neutral-700 shrink-0">
                        {msg.user[0]}
                      </div>
                      
                      <div className="space-y-1">
                        <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                          msg.user.includes("You") 
                            ? "bg-neutral-900 text-white rounded-tr-none" 
                            : "bg-white border border-neutral-200 rounded-tl-none text-neutral-700 shadow-xs"
                        }`}>
                          <div className="flex justify-between items-center gap-6 mb-1 font-mono text-[9px]">
                            <strong className="font-bold">{msg.user}</strong>
                            <span className="text-neutral-400">{msg.time}</span>
                          </div>
                          <p className="font-sans font-light whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2.5">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type alignment broadcast to candidates..."
                    className="flex-1 bg-white border border-neutral-200 focus:border-black rounded-xl px-4 py-2.5 text-xs focus:outline-hidden font-light"
                  />
                  <button type="submit" className="w-10 h-10 bg-black hover:bg-neutral-800 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-xs">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* ==========================================
                TAB 7: MEETINGS
               ========================================== */}
            {workspaceTab === "meetings" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Google Meet & Video Scheduler</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Schedule alignments, set meeting dates, and record vetting files.</p>
                  </div>
                </div>

                <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block font-sans">Schedule Vetting Sync</span>
                  <form onSubmit={handleScheduleMeet} className="space-y-3 text-xs">
                    <input 
                      type="text" 
                      value={newMeetTitle}
                      onChange={(e) => setNewMeetTitle(e.target.value)}
                      placeholder="e.g. Milestone 2 Code Hands-on Review"
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 focus:outline-hidden"
                    />
                    <button type="submit" className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer">
                      Schedule Meet Room
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 8: REVIEWS (HIRING EVALUATIONS)
               ========================================== */}
            {workspaceTab === "reviews" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Verified Mutual Reviews</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Transaction reviews are managed in one protected ledger for companies and talent.</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-emerald-50 p-6 md:p-8">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-blue-700"><ShieldCheck className="h-4 w-4" /> Double-blind transaction review</div>
                      <h3 className="mt-3 text-xl font-black text-neutral-900">리뷰는 계약·결제 기록과 함께 보호됩니다.</h3>
                      <p className="mt-3 text-xs leading-6 text-neutral-600">등록 PG에서 대금 확보가 확인된 프로젝트만 평가할 수 있습니다. 기업과 학생의 평가는 양쪽이 모두 제출하기 전까지 봉인되며, 제출 후 수정할 수 없습니다.</p>
                    </div>
                    <button type="button" onClick={() => onNavigate("trust-operations")} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-xs font-black text-white">상호 리뷰 작성·확인 <ArrowRight className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 9: PERFORMANCE
               ========================================== */}
            {workspaceTab === "performance" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Candidate Performance Radar</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Review performance indicators logged during evaluation cycles.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-[280px] w-full bg-neutral-50/50 border border-neutral-200/50 rounded-2xl flex items-center justify-center p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceRadarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#666", fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name={activeStudentName} dataKey="A" stroke="#000" fill="#000" fillOpacity={0.15} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3.5">
                    <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex justify-between items-center shadow-xs text-xs">
                      <div>
                        <strong className="font-bold text-neutral-800 block">Overall Task Completion</strong>
                        <span className="text-[10px] text-neutral-400">Total completed checklist metrics</span>
                      </div>
                      <span className="font-mono font-bold text-lg">{completionPercentage}%</span>
                    </div>

                    <p className="text-xs text-neutral-500 leading-relaxed font-light font-sans">
                      Performance indicators calculate automatically across sandbox tests, code coverage, standups, and rewrite iteration latencies.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 10: TRUST LEDGER
               ========================================== */}
            {workspaceTab === "trust" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Verifiable Trust Ledger</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Secure, cryptographically hashed evidence mapping candidate contributions.</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar">
                  {trustEvidences.map(ev => (
                    <div key={ev.id} className="p-4 border border-neutral-200 rounded-2xl bg-white flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded uppercase">{ev.category}</span>
                        <p className="text-xs text-neutral-800 font-medium pt-1">{ev.description}</p>
                        <span className="text-[9px] font-mono text-neutral-400 block font-light">Secure Node Hash: {ev.hash}</span>
                      </div>

                      <div className="text-right text-xs">
                        <strong className="text-green-600 block font-mono">+{ev.scoreBonus} Trust</strong>
                        <span className="text-neutral-400 block font-mono">{ev.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 11: HIRING PREP
               ========================================== */}
            {workspaceTab === "hiring" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Employment Conversion & Preparation</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Configure employment offers, generate fast-track recommendations, and commit final hires.</p>
                  </div>
                </div>

                <div className="p-5 border border-neutral-200 rounded-3xl bg-neutral-50 space-y-4 text-center">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Conversion Metrics</span>
                  <h3 className="text-2xl font-display font-black text-neutral-800">Employment Readiness Index: 94%</h3>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed max-w-md mx-auto">
                    The candidate has verified exceptional performance. Approve the upcoming Milestone #3 delivery to fast-track contract generation options.
                  </p>

                  <button 
                    onClick={() => success("Offer Synced", "Drafted standard React Engineering contract offer.")}
                    className="px-4 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
                  >
                    Draft Fast-Track Conversion Offer
                  </button>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 12: AI COOP FORUM
               ========================================== */}
            {workspaceTab === "ai-coop" && (
              <div className="flex flex-col h-[520px] justify-between animate-fadeIn">
                <div className="border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-5 h-5 text-purple-600 animate-pulse" />
                    <h2 className="font-display font-black text-xl text-neutral-900">AI Workforce Forum</h2>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">Moderator view: Ask the 9 cooperative AI agents to evaluate candidate scaling limits and verify project risk metrics.</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 my-4 p-4 border border-purple-100 bg-purple-50/5 rounded-2xl scrollbar">
                  {aiCoopChat.map((chat, idx) => (
                    <div key={idx} className={`flex gap-3.5 max-w-[85%] ${chat.agent === "You" ? "ml-auto flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${chat.color || "bg-purple-100 text-purple-700"}`}>
                        {chat.avatar}
                      </div>

                      <div className="space-y-1">
                        <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                          chat.agent === "You" 
                            ? "bg-neutral-900 text-white rounded-tr-none" 
                            : "bg-white border border-neutral-200 rounded-tl-none text-neutral-700 shadow-xs"
                        }`}>
                          <div className="flex justify-between items-center gap-6 mb-1 font-mono text-[9px]">
                            <strong className="font-bold">{chat.agent}</strong>
                            <span className="text-neutral-400">{chat.time}</span>
                          </div>
                          <p className="font-sans font-light leading-relaxed whitespace-pre-wrap">{chat.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {aiGenerating && (
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-xs animate-pulse">
                        PM
                      </div>
                      <div className="bg-white border border-neutral-200 p-4 rounded-2xl rounded-tl-none text-xs text-neutral-400 leading-relaxed font-sans">
                        Specialized AI agents are compiling diagnostic vetting recommendations...
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleTriggerAiCoopAction} className="flex gap-2.5">
                  <input 
                    type="text" 
                    value={aiCoopInput}
                    onChange={(e) => setAiCoopInput(e.target.value)}
                    placeholder="e.g. 'Request the Risk Analyzer node to check Milestone #2 code performance'..."
                    className="flex-1 bg-white border border-purple-100 focus:border-purple-600 rounded-xl px-4 py-2.5 text-xs focus:outline-hidden font-light"
                  />

                  <button 
                    type="submit" 
                    disabled={aiGenerating || !aiCoopInput.trim()}
                    className="px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shrink-0 cursor-pointer transition-all disabled:bg-neutral-100 disabled:text-neutral-300"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Trigger AI Audit Debate</span>
                  </button>
                </form>
              </div>
            )}

          </div>

          <div className="border-t border-neutral-100 pt-4 flex justify-between items-center text-[10px] text-neutral-400 font-mono select-none">
            <span>Sponsor Workspace Terminal</span>
            <span>Real-time Sync Active</span>
          </div>
        </div>

      </div>

      {/* ==========================================
          TASK DETAILS DRAWER MODAL
         ========================================== */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-end z-50">
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col justify-between p-6"
            >
              <div className="space-y-6 overflow-y-auto pr-1 scrollbar flex-1 pb-4">
                <div className="flex justify-between items-start border-b border-neutral-100 pb-4">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded uppercase">
                      {selectedTask.type} details
                    </span>
                    <h3 className="font-display font-black text-lg text-neutral-900 mt-1">{selectedTask.title}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-neutral-100 pb-4">
                  <div>
                    <span className="text-[9px] text-neutral-400 block font-bold">STATUS</span>
                    <span className="text-neutral-700 block mt-1 font-semibold capitalize">{selectedTask.status}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-400 block font-bold">HOURS TIMELINE</span>
                    <span className="text-neutral-700 block mt-1 font-semibold">{selectedTask.estimatedTime} hrs / {selectedTask.actualTime} hrs</span>
                  </div>
                </div>

                {selectedTask.checklist && (
                  <div className="space-y-2 border-b border-neutral-100 pb-4 text-xs font-sans">
                    <h4 className="font-bold text-neutral-800">Checklist Subtasks</h4>
                    <div className="space-y-1.5">
                      {selectedTask.checklist.map((check) => (
                        <div key={check.id} className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={check.done}
                            readOnly
                            className="rounded border-neutral-300 text-teal-600"
                          />
                          <span className={check.done ? "line-through text-neutral-300" : "text-neutral-600"}>{check.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          FILE PREVIEW MODAL
         ========================================== */}
      <AnimatePresence>
        {selectedFile && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-start">
                <div>
                  <strong className="text-xs text-neutral-400 font-mono block">Code file previewer</strong>
                  <h3 className="font-display font-black text-lg text-neutral-900">{selectedFile.name}</h3>
                </div>
                <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-neutral-100 rounded-lg cursor-pointer">
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <div className="p-6 bg-neutral-950 text-neutral-200 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border-b border-neutral-900">
                <pre>{selectedFile.contentSnippet || `// Default starter file`}</pre>
              </div>

              <div className="p-4 bg-neutral-50 flex justify-end">
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
