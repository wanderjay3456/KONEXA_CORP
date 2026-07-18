import React, { useState, useEffect, useRef } from "react";
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
  XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell
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

// ==========================================
// MAIN COMPONENT
// ==========================================
interface ProjectWorkspaceProps {
  onNavigate: (tabId: string) => void;
}

export default function ProjectWorkspace({ onNavigate }: ProjectWorkspaceProps) {
  const { applications, projects, updateStudentProfile, studentProfile } = useApp();
  const { success, error, info } = useToast();

  // Active workspace projects (from claimed applications or auto-seeded templates)
  const activeApps = applications.filter(a => a.status !== "rejected");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  
  // Back up mock active project if no applications are present (to guarantee a fully live playground)
  const fallbackProject = {
    id: "proj_perf_opt_99",
    title: "Vite + React Core Performance Optimizer",
    companyName: "Vercel Core Technologies",
    status: "open",
    requirements: [
      "Implement a custom React hook `usePerformanceProfiler`",
      "Generate beautiful visual SVG rendering trees",
      "Zero bundle overhead in production environments",
      "Deploy with sub-millisecond execution logs"
    ]
  };

  const activeApp = activeApps.find(a => a.id === selectedAppId) || (activeApps.length > 0 ? activeApps[0] : null) || {
    id: fallbackProject.id,
    projectTitle: fallbackProject.title,
    studentName: studentProfile?.name || "Alex Rivera",
    createdAt: Date.now(),
    status: "approved"
  };

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
  >("overview");

  // Sub-navigation state
  const [tasksView, setTasksView] = useState<"kanban" | "list">("kanban");

  // ==========================================
  // INITIAL STATE SEEDING
  // ==========================================

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
      assignee: "Alex Rivera",
      dependencies: [],
      checklist: [
        { id: "c_1", text: "Declare TS signature options interface", done: true },
        { id: "c_2", text: "Bind React root state render counters", done: false }
      ],
      comments: [
        { id: "co_1", user: "David Kang (Mentor)", text: "Verify type compatibility with React 19 concurrent renders.", time: "4h ago", role: "mentor" }
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
      assignee: "Alex Rivera",
      dependencies: ["t_1"],
      checklist: [
        { id: "c_3", text: "Regular expression filter list", done: false },
        { id: "c_4", text: "Write HTML entity encoder test cases", done: false }
      ],
      comments: [],
      approvals: [],
      recurring: false
    },
    {
      id: "t_3",
      title: "Epic: High-fidelity Vector Visualizations",
      type: "Epic",
      priority: "High",
      status: "todo",
      dueDate: "2026-07-20",
      estimatedTime: 25,
      actualTime: 0,
      labels: ["D3", "SVG Canvas"],
      assignee: "Alex Rivera",
      dependencies: [],
      checklist: [],
      comments: [],
      approvals: [],
      recurring: false
    },
    {
      id: "t_4",
      title: "Milestone: Zero Bundle Overhead Verification",
      type: "Milestone",
      priority: "High",
      status: "progress",
      dueDate: "2026-07-17",
      milestoneId: "ms_2",
      estimatedTime: 2,
      actualTime: 1,
      labels: ["Build Optimisation"],
      assignee: "David Kang (Mentor)",
      dependencies: ["t_1"],
      checklist: [],
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
      uploader: "Horizon Labs Reviewer",
      time: "2 days ago",
      version: "v2.1",
      history: [
        { version: "v1.0", date: "2026-07-02", uploader: "David Kang", action: "Uploaded initial spec outline" },
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
      uploader: "Alex Rivera",
      time: "1 day ago",
      version: "v1.2",
      history: [
        { version: "v1.0", date: "2026-07-05", uploader: "Alex Rivera", action: "Created blank hook skeleton" },
        { version: "v1.2", date: "2026-07-08", uploader: "Alex Rivera", action: "Integrated useRef counters" }
      ],
      permissions: [
        { role: "student", access: "write" },
        { role: "mentor", access: "write" }
      ],
      contentSnippet: `import { useRef, useEffect } from 'react';\n\nexport function usePerformanceProfiler(id: string) {\n  const startTime = useRef(performance.now());\n  const renderCount = useRef(0);\n\n  useEffect(() => {\n    const elapsed = performance.now() - startTime.current;\n    console.log(\`[Profiler:\${id}] Render #\${renderCount.current} elapsed: \${elapsed}ms\`);\n    renderCount.current++;\n  });\n}`
    },
    {
      id: "f_3",
      name: "hiring_roadmap_gantt.png",
      type: "image",
      size: "1.2 MB",
      folderId: "fol_3",
      uploader: "System Admin",
      time: "4 days ago",
      version: "v1.0",
      history: [{ version: "v1.0", date: "2026-07-05", uploader: "System Admin", action: "Uploaded roadmap diagram" }],
      permissions: [{ role: "student", access: "read" }]
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
      user: "David Kang (Mentor)",
      role: "mentor",
      text: "Welcome to the Vercel Performance Optimizer workspace! Our core engineering team will audit this build weekly.",
      time: "2 days ago",
      reactions: [
        { emoji: "🚀", users: ["You"] },
        { emoji: "🔥", users: ["System"] }
      ],
      replies: [
        {
          id: "m_1_1",
          user: "Alex Rivera (You)",
          role: "student",
          text: "Thanks David! Glad to be on this challenge. I have drafted the hook skeleton and types.",
          time: "1 day ago",
          reactions: []
        }
      ]
    },
    {
      id: "m_2",
      user: "Horizon Recruiter",
      role: "partner",
      text: "📢 Reminder: Candidates with a completed first-stage evaluation are fast-tracked into final review boards next Monday.",
      time: "18 hours ago",
      reactions: [{ emoji: "👀", users: ["You"] }]
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<string[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState<string | null>("m_2");

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
    },
    {
      id: "mt_2",
      platform: "Zoom",
      title: "Final Code Handover & Conversion Vetting",
      scheduledAt: "2026-07-28 10:00",
      duration: 45,
      joinUrl: "https://zoom.us/j/123456789",
      recordingUrl: "https://recordings.horizonlabs.io/vercel-final-vetting.mp4",
      recordingSize: "148 MB",
      notes: "Review student metrics, trust compliance, and verify full-time recruitment fit."
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
      submittedBy: "Alex Rivera",
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
      submittedBy: "Alex Rivera",
      submittedAt: "Just now",
      status: "pending",
      codeSnippet: `export function SVGVisualizerTree({ rootNode }) {\n  // Render vector matrices with recursive loops\n  return <svg className="w-full h-96">...</svg>\n}`,
      history: [
        { version: "v2.0.1", date: "1 day ago", status: "revision_requested", notes: "Lacks zoom-matrix handlers." },
        { version: "v2.0.2", date: "Just now", status: "pending", notes: "Added matrix viewport scale parameters." }
      ]
    }
  ]);
  const [submittingDelTitle, setSubmittingDelTitle] = useState("");
  const [submittingDelSnippet, setSubmittingDelSnippet] = useState("");

  // Trust Evidence State
  const [trustEvidences, setTrustEvidences] = useState<TrustEvidence[]>([
    { id: "tr_1", category: "Attendance", description: "Attended all sprint standups and aligned milestones.", scoreBonus: 2, hash: "sha256_8f0a21...", timestamp: "2 days ago" },
    { id: "tr_2", category: "Deadline", description: "Completed Milestone 1 (Arch-specs) 4 hours early.", scoreBonus: 3, hash: "sha256_3b11da...", timestamp: "1 day ago" },
    { id: "tr_3", category: "Task Quality", description: "TypeScript coverage is strictly verified to 100%.", scoreBonus: 4, hash: "sha256_e199d2...", timestamp: "3 hours ago" }
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

    // Log in global system activity
    setTrustEvidences(prev => [
      {
        id: `tr_${Date.now()}`,
        category: "Reliability",
        description: `Lifecycle transition logged: "${nextStage}"`,
        scoreBonus: 1,
        hash: "sha256_" + Math.random().toString(36).substring(7),
        timestamp: "Just now"
      },
      ...prev
    ]);
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
      assignee: "Alex Rivera",
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
        // Trigger trust evidence if task is completed
        if (nextStatus === "completed" && t.status !== "completed") {
          setTrustEvidences(prevEv => [
            {
              id: `tr_${Date.now()}`,
              category: "Deadline",
              description: `Completed task: "${t.title}"`,
              scoreBonus: 2,
              hash: "sha256_" + Math.random().toString(36).substring(7),
              timestamp: "Just now"
            },
            ...prevEv
          ]);
        }
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
      uploader: "Alex Rivera",
      time: "Just now",
      version: "v1.0",
      history: [{ version: "v1.0", date: "Just now", uploader: "Alex Rivera", action: "Uploaded file to cloud" }],
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
      user: "Alex Rivera (You)",
      role: "student",
      text: chatInput.trim(),
      time: "Just now",
      reactions: []
    };

    setChatMessages(prev => [...prev, added]);
    setChatInput("");
    success("Message Synced", "Broadcasting workspace node notification.");
  };

  const handleVoiceMessageRecord = () => {
    if (!voiceRecording) {
      setVoiceRecording(true);
      info("Audio Recording started", "Speak clearly. Press again to stop and attach script.");
    } else {
      setVoiceRecording(false);
      setVoiceMessages(prev => [...prev, "Voice Memo #" + (prev.length + 1) + " (0:12)"]);
      success("Voice Message attached", "Audio note converted and attached to project timeline.");
    }
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

  // Submit Deliverable
  const handleDeliverableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingDelTitle.trim()) return;

    const added: Deliverable = {
      id: `del_${Date.now()}`,
      title: submittingDelTitle.trim(),
      version: "v1.0.0",
      submittedBy: "Alex Rivera",
      submittedAt: "Just now",
      status: "pending",
      codeSnippet: submittingDelSnippet || `// Default starter file`,
      fileSize: "42 KB",
      history: [{ version: "v1.0.0", date: "Just now", status: "pending", notes: "First production challenge upload." }]
    };

    setDeliverables(prev => [added, ...prev]);
    setSubmittingDelTitle("");
    setSubmittingDelSnippet("");
    success("Deliverable Uploaded", "Solution submitted for mentor and AI evaluation review.");
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
      // Prompt 9 separate agents to cooperate and reply
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
      setAiCoopChat(prev => [
        ...prev,
        { agent: "AI Project Team", avatar: "AI", color: "text-indigo-600 bg-indigo-50 border-indigo-200", text: data.reply, time: "Just now" }
      ]);
    } catch (cause) {
      error("AI 프로젝트 분석 실패", cause instanceof Error ? cause.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setAiGenerating(false);
    }
  };

  // ==========================================
  // CALCULATIONS (METRICS)
  // ==========================================
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100) || 0;

  // Real-time automatic calculations of Performance KPIs
  const performanceKpis = {
    taskCompletion: completionPercentage,
    deadlineCompliance: 92, // mock metric
    productivity: 88,
    participation: 95,
    leadership: 85,
    communication: 90,
    problemSolving: 94,
    quality: 91,
    consistency: 89
  };

  const performanceRadarData = [
    { subject: "Task Completion", A: performanceKpis.taskCompletion, B: 85, fullMark: 100 },
    { subject: "Deadline", A: performanceKpis.deadlineCompliance, B: 80, fullMark: 100 },
    { subject: "Productivity", A: performanceKpis.productivity, B: 85, fullMark: 100 },
    { subject: "Participation", A: performanceKpis.participation, B: 90, fullMark: 100 },
    { subject: "Leadership", A: performanceKpis.leadership, B: 75, fullMark: 100 },
    { subject: "Quality", A: performanceKpis.quality, B: 85, fullMark: 100 }
  ];

  const analyticsBurndown = [
    { name: "Day 1", Planned: 40, Actual: 40 },
    { name: "Day 5", Planned: 32, Actual: 31 },
    { name: "Day 10", Planned: 24, Actual: 20 },
    { name: "Day 15", Planned: 16, Actual: 14 },
    { name: "Day 20", Planned: 8, Actual: 5 },
    { name: "Day 25", Planned: 0, Actual: 0 }
  ];

  if (activeApps.length === 0) {
    return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-sm"><Layers className="mx-auto h-9 w-9 text-neutral-300" /><h1 className="mt-4 text-2xl font-black text-neutral-950">진행 중인 프로젝트가 없습니다</h1><p className="mt-2 text-sm leading-6 text-neutral-500">실제 공고에 지원하고 기업 승인을 받으면 프로젝트 작업 공간이 생성됩니다.</p><button onClick={() => onNavigate("marketplace")} className="mt-6 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white">공고 살펴보기</button></div></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6 scrollbar">
      
      {/* ==========================================
          HEADER SECTION
         ========================================== */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
              PROJECT OPERATING SYSTEM
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-[10px] font-mono text-neutral-400 font-semibold uppercase">
              {activeApp.projectTitle}
            </span>
          </div>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            Konexa Workspace Operating System
          </h1>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            Real-time synchronization across the Student Portfolio, Company Dashboard, Trust Vault, and AI Recruiter Core.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3">
          {/* Google/Outlook integration indicator */}
          <div className="px-3 py-1.5 bg-white border border-neutral-200 rounded-xl flex items-center gap-2 shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-neutral-600 font-semibold">Integrations Live</span>
          </div>

          <a 
            href="https://meet.google.com" 
            target="_blank" 
            rel="noreferrer"
            className="px-4 py-2.5 bg-neutral-900 text-white hover:bg-black rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Video className="w-4 h-4 text-emerald-400" />
            <span>Launch Google Meet</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
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
            const isArchivedOrCancelled = stage === ProjectLifecycle.ARCHIVED || stage === ProjectLifecycle.CANCELLED;
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
            <span className="text-[9px] font-mono font-bold text-neutral-400 block uppercase">MANAGEMENT MENU</span>
            <span className="text-sm font-display font-black text-neutral-800 block">Workspace OS Panel</span>
          </div>

          <div className="space-y-1">
            {[
              { id: "overview", label: "Project Overview", icon: Layers },
              { id: "tasks", label: "Task Board & Epics", icon: CheckSquare },
              { id: "files", label: "Secure Document File system", icon: Folder },
              { id: "calendar", label: "Deadline Calendars", icon: Calendar },
              { id: "chat", label: "Realtime Threaded Chat", icon: MessageSquare },
              { id: "meetings", label: "Video Scheduling", icon: Video },
              { id: "deliverables", label: "Deliverables Console", icon: FileCheck },
              { id: "reviews", label: "Evaluation Reviews", icon: Award },
              { id: "performance", label: "Performance Trackers", icon: TrendingUp },
              { id: "trust", label: "Trust Evidence Vault", icon: ShieldCheck },
              { id: "hiring", label: "Hiring Preparation", icon: FileSearch },
              { id: "analytics", label: "Sponsor Analytics", icon: BarChart2 },
              { id: "ai-coop", label: "AI Workforce Coop", icon: Cpu }
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

          <div className="pt-4 border-t border-neutral-100 flex flex-col gap-1.5 text-[10px] text-neutral-400 font-sans">
            <div className="flex justify-between">
              <span>Sprint Task Completion:</span>
              <span className="font-bold text-neutral-700">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-teal-500 h-full transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
            </div>
          </div>
        </div>

        {/* Central dynamic viewport (9/12) */}
        <div className="xl:col-span-9 bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs min-h-[620px] flex flex-col justify-between">
          <div className="space-y-6">

            {/* ==========================================
                TAB 1: OVERVIEW & GENERAL INFO
               ========================================== */}
            {workspaceTab === "overview" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Project Overview</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Vitals parameters, sponsor definitions and expected deliverables guidelines.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md">
                      Reward: $2,800
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                      Vercel Core Node
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Specs */}
                  <div className="space-y-4">
                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/50 space-y-2">
                      <h4 className="text-xs font-bold text-neutral-800">Objectives & Deliverables</h4>
                      <p className="text-xs text-neutral-500 font-light leading-relaxed">
                        To construct a sub-millisecond drawing state profiling engine inside React 19 concurrent renders, using strict typed ESM parameters and custom SVG canvas layers.
                      </p>
                    </div>

                    <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/50 space-y-3">
                      <h4 className="text-xs font-bold text-neutral-800">Working Parameters</h4>
                      <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-neutral-600">
                        <div>
                          <strong className="text-neutral-400 block text-[9px] uppercase font-bold">TYPE</strong>
                          <span>Remote Node</span>
                        </div>
                        <div>
                          <strong className="text-neutral-400 block text-[9px] uppercase font-bold">HOURS</strong>
                          <span>Flexible (~15 hrs/wk)</span>
                        </div>
                        <div>
                          <strong className="text-neutral-400 block text-[9px] uppercase font-bold">TIMELINE</strong>
                          <span>4 Weeks schedule</span>
                        </div>
                        <div>
                          <strong className="text-neutral-400 block text-[9px] uppercase font-bold">COACH</strong>
                          <span>David Kang (Staff)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Policies & Integration settings */}
                  <div className="p-5 border border-neutral-200 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Hiring Opportunity & Policy Checks</h4>
                    
                    <div className="space-y-3 text-xs leading-relaxed">
                      <div className="flex gap-2.5 items-start text-neutral-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <strong>Hiring Pathway:</strong> Fast-track junior platform engineer conversions upon approved submission verification.
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start text-neutral-600">
                        <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <strong>Trust Minimum:</strong> Minimum Trust Score of 75 required to submit final stage evaluation runs.
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start text-neutral-600">
                        <Activity className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong>Performance Checkpoints:</strong> Continuous automatic linting and render metrics analysis logged to performance boards.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Timeline */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Audit Stage History Log</span>
                  <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-100 text-xs">
                    {lifecycleHistory.map((h, i) => (
                      <div key={i} className="p-3.5 flex justify-between items-start gap-4">
                        <div>
                          <strong className="font-semibold text-neutral-800 block">{h.stage}</strong>
                          <span className="text-neutral-400 text-[10px] font-light">{h.note}</span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">{h.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 2: TASKS & KANBAN (WITH EPICS)
               ========================================== */}
            {workspaceTab === "tasks" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Sprint Tasks & Epic Board</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Organize work in Epics, assign subtasks, declare dependencies and track actual timeline hours.</p>
                  </div>

                  <div className="flex gap-1.5 bg-neutral-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setTasksView("kanban")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${tasksView === "kanban" ? "bg-white text-black shadow-xs" : "text-neutral-500"}`}
                    >
                      Kanban Board
                    </button>
                    <button 
                      onClick={() => setTasksView("list")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${tasksView === "list" ? "bg-white text-black shadow-xs" : "text-neutral-500"}`}
                    >
                      Flat List
                    </button>
                  </div>
                </div>

                {/* Quick create task form */}
                <form onSubmit={handleAddTask} className="bg-neutral-50 border border-neutral-200/50 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                  <input 
                    type="text" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="New task, epic, or milestone title..."
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

                {tasksView === "kanban" ? (
                  /* KANBAN columns */
                  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {/* Columns map */}
                    {([
                      { id: "todo", label: "To Do" },
                      { id: "progress", label: "In Progress" },
                      { id: "review", label: "In Review" },
                      { id: "blocked", label: "Blocked" },
                      { id: "completed", label: "Completed" }
                    ] as const).map((col) => {
                      const colTasks = tasks.filter(t => t.status === col.id);
                      return (
                        <div key={col.id} className="bg-neutral-50/60 border border-neutral-200/50 rounded-2xl p-3 flex flex-col h-[480px]">
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
                                <div className="flex justify-between items-start gap-2">
                                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    t.priority === "High" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-neutral-50 text-neutral-500"
                                  }`}>{t.priority}</span>
                                  <span className="text-[8px] font-mono text-neutral-400 font-bold">{t.type}</span>
                                </div>

                                <h4 className="text-xs font-semibold text-neutral-800 leading-snug line-clamp-2">{t.title}</h4>

                                <div className="flex justify-between items-center border-t border-neutral-100/60 pt-2.5 text-[10px] text-neutral-400">
                                  <span className="font-mono">{t.dueDate}</span>
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateTaskStatus(t.id, col.id === "todo" ? "progress" : col.id === "progress" ? "review" : "completed");
                                      }}
                                      className="text-teal-600 hover:text-teal-700 font-bold font-mono text-[9px] cursor-pointer"
                                    >
                                      Move →
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Tabular view of tasks */
                  <div className="border border-neutral-200 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 font-bold text-neutral-600 select-none">
                          <th className="p-3">Title</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Priority</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 font-mono">Time (Est/Act)</th>
                          <th className="p-3">Options</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {tasks.map((t) => (
                          <tr key={t.id} className="hover:bg-neutral-50/50">
                            <td className="p-3 font-medium text-neutral-800">{t.title}</td>
                            <td className="p-3 text-neutral-500">{t.type}</td>
                            <td className="p-3">
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                t.priority === "High" ? "bg-rose-50 text-rose-600" : "bg-neutral-50 text-neutral-500"
                              }`}>{t.priority}</span>
                            </td>
                            <td className="p-3 capitalize text-neutral-600 font-semibold">{t.status}</td>
                            <td className="p-3 font-mono text-neutral-500">{t.estimatedTime}h / {t.actualTime}h</td>
                            <td className="p-3">
                              <button 
                                onClick={() => handleDeleteTask(t.id)}
                                className="text-neutral-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ==========================================
                TAB 3: SECURE FILES & FOLDERS SYSTEM
               ========================================== */}
            {workspaceTab === "files" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Secure Document Storage</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Review reference plans, wireframes, CAD specs, and track revision history hashes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Folders structure */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Workspace Folders</span>
                    
                    <form onSubmit={handleCreateFolder} className="flex gap-2">
                      <input 
                        type="text" 
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="New folder name..."
                        className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden"
                      />
                      <button type="submit" className="px-3 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer">
                        <FolderPlus className="w-3.5 h-3.5" />
                      </button>
                    </form>

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
                    
                    {/* Quick upload file form */}
                    <form onSubmit={handleUploadFileSim} className="bg-neutral-50 border border-neutral-200/50 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <input 
                        type="text" 
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="File name (e.g. wireframe_v3)..."
                        className="md:col-span-5 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden"
                      />
                      <select 
                        value={newFileType}
                        onChange={(e) => setNewFileType(e.target.value as any)}
                        className="md:col-span-3 bg-white border border-neutral-200 rounded-xl px-2 py-2 text-xs focus:outline-hidden text-neutral-600"
                      >
                        <option value="code">TypeScript (.ts)</option>
                        <option value="pdf">PDF (.pdf)</option>
                        <option value="image">Image (.png)</option>
                        <option value="zip">ZIP Archive (.zip)</option>
                      </select>
                      <button type="submit" className="md:col-span-4 h-9 bg-black text-white hover:bg-neutral-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer">
                        <FilePlus className="w-4 h-4" />
                        <span>Upload File</span>
                      </button>
                      {newFileType === "code" && (
                        <textarea 
                          value={fileSnippetInput}
                          onChange={(e) => setFileSnippetInput(e.target.value)}
                          placeholder="Paste TS code module boilerplate..."
                          rows={2}
                          className="md:col-span-12 bg-white border border-neutral-200 rounded-xl p-3 text-xs font-mono focus:outline-hidden resize-none mt-1"
                        />
                      )}
                    </form>

                    <div className="space-y-2">
                      {files.filter(f => activeFolderId === null || f.folderId === activeFolderId).map(file => (
                        <div key={file.id} className="p-4 border border-neutral-200 rounded-2xl flex justify-between items-center flex-wrap gap-4">
                          <div className="flex gap-3 items-center">
                            <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                              {file.type === "code" ? <FileText className="w-4 h-4 text-blue-500" /> : <File className="w-4 h-4 text-neutral-400" />}
                            </div>
                            <div>
                              <strong className="text-xs text-neutral-800 block">{file.name}</strong>
                              <span className="text-[10px] font-mono text-neutral-400">{file.size} • Uploaded by {file.uploader}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {file.contentSnippet && (
                              <button 
                                onClick={() => setSelectedFile(file)}
                                className="px-2 py-1 bg-neutral-50 hover:bg-neutral-100 rounded border border-neutral-200 text-[10px] font-mono text-neutral-600 cursor-pointer"
                              >
                                Preview
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                info("Downloading...", `Downloading secure attachment hash: ${file.name}`);
                              }}
                              className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 4: MONTH-GRID CALENDAR
               ========================================== */}
            {workspaceTab === "calendar" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Deadline & Meeting Calendar</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Timezone-aware sprint planning, deadline compliance schedules and meeting milestones.</p>
                  </div>
                </div>

                {/* Calendar monthly layout block */}
                <div className="p-5 border border-neutral-200 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <strong className="text-neutral-800 font-display">July 2026</strong>
                    <span className="font-mono text-neutral-400 font-bold">KST Offset (GMT+9)</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] text-neutral-400 select-none pb-1.5 border-b border-neutral-100">
                    <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-xs text-neutral-600 h-[280px]">
                    {/* Empty days offset */}
                    {Array.from({ length: 3 }).map((_, idx) => <div key={`offset_${idx}`} className="bg-neutral-50/20 rounded" />)}
                    {/* July Days */}
                    {Array.from({ length: 28 }).map((_, idx) => {
                      const day = idx + 1;
                      const hasMilestone = day === 10 || day === 17 || day === 24;
                      const hasMeeting = day === 11 || day === 28;

                      return (
                        <div 
                          key={`day_${day}`}
                          className={`p-2.5 border rounded-xl flex flex-col justify-between transition-all ${
                            day === 9 
                              ? "bg-black border-black text-white shadow-xs" 
                              : hasMilestone 
                              ? "bg-rose-50/50 border-rose-200 text-neutral-800"
                              : hasMeeting
                              ? "bg-blue-50/50 border-blue-200 text-neutral-800"
                              : "bg-white border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <span className="font-mono text-[10px] font-bold block text-left">{day}</span>
                          <div className="flex gap-1 justify-end">
                            {hasMilestone && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Project Milestone" />}
                            {hasMeeting && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Scheduled Meeting" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 5: REALTIME CHAT (WITH REACTIONS)
               ========================================== */}
            {workspaceTab === "chat" && (
              <div className="flex flex-col h-[520px] justify-between animate-fadeIn">
                <div>
                  <h2 className="font-display font-black text-xl text-neutral-900">Workspace Collaboration Chat</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Secure conversation nodes syncing with enterprise notification queues.</p>
                </div>

                {/* Message display board */}
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

                        {/* Reactions and replies */}
                        {msg.reactions.length > 0 && (
                          <div className="flex gap-1 items-center pt-1">
                            {msg.reactions.map((react, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[9px] font-bold text-neutral-600">
                                {react.emoji} {react.users.length}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Threaded replies */}
                        {msg.replies && msg.replies.map(reply => (
                          <div key={reply.id} className="pl-6 pt-2 border-l border-neutral-200 flex gap-2.5">
                            <div className="w-6 h-6 rounded bg-neutral-50 border text-[10px] font-bold flex items-center justify-center text-neutral-500">
                              {reply.user[0]}
                            </div>
                            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-xl rounded-tl-none text-[11px] leading-relaxed text-neutral-600 max-w-lg">
                              <span className="font-bold block text-[9px] font-mono mb-0.5">{reply.user} • {reply.time}</span>
                              <p className="font-light">{reply.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input block */}
                <form onSubmit={handleSendChat} className="flex gap-2.5 items-center">
                  <button 
                    type="button"
                    onClick={handleVoiceMessageRecord}
                    className={`w-10 h-10 border rounded-xl flex items-center justify-center cursor-pointer transition-all ${voiceRecording ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200"}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type alignment message... (Markdown and emojis supported)"
                    className="flex-1 bg-white border border-neutral-200 focus:border-black rounded-xl px-4 py-2.5 text-xs focus:outline-hidden font-light"
                  />

                  <button type="submit" className="w-10 h-10 bg-black hover:bg-neutral-800 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-xs">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* ==========================================
                TAB 6: MEETINGS & SCHEDULING
               ========================================== */}
            {workspaceTab === "meetings" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Google Meet & Video Scheduler</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Reserve meeting timelines, check recording metadata logs and download sprint review records.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column (5/12): Reserve meeting form */}
                  <div className="md:col-span-5 p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Schedule Sync Meeting</span>
                    
                    <form onSubmit={handleScheduleMeet} className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700">Meeting Topic</label>
                        <input 
                          type="text" 
                          value={newMeetTitle}
                          onChange={(e) => setNewMeetTitle(e.target.value)}
                          placeholder="e.g. Code Review & Vector optimization"
                          className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700">Video Platform</label>
                        <select 
                          value={newMeetPlatform}
                          onChange={(e) => setNewMeetPlatform(e.target.value as any)}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-2 py-2 focus:outline-hidden text-neutral-600"
                        >
                          <option value="Google Meet">Google Meet</option>
                          <option value="Teams">Microsoft Teams</option>
                          <option value="Zoom">Zoom Video</option>
                          <option value="Jitsi">Jitsi Meet</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700">Date & Time Offset</label>
                        <input 
                          type="text" 
                          value={newMeetDate}
                          onChange={(e) => setNewMeetDate(e.target.value)}
                          placeholder="2026-07-12 14:00"
                          className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 font-mono focus:outline-hidden"
                        />
                      </div>

                      <button type="submit" className="w-full h-10 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer transition-colors pt-1">
                        Reserve Meeting Block
                      </button>
                    </form>
                  </div>

                  {/* Right Column (7/12): Scheduled Lists */}
                  <div className="md:col-span-7 space-y-4">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Meeting History & Upcoming Syncs</span>

                    <div className="space-y-3.5">
                      {meetings.map(meet => (
                        <div key={meet.id} className="p-4 border border-neutral-200 rounded-2xl bg-white space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <strong className="text-xs text-neutral-800 block">{meet.title}</strong>
                              <span className="text-[10px] font-mono text-neutral-400">{meet.scheduledAt} | Platform: {meet.platform}</span>
                            </div>

                            <a 
                              href={meet.joinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-mono font-bold cursor-pointer"
                            >
                              Join Sync →
                            </a>
                          </div>

                          <p className="text-[11px] text-neutral-500 font-light leading-relaxed">{meet.notes}</p>

                          {meet.recordingUrl && (
                            <div className="pt-2 border-t border-neutral-100 flex justify-between items-center text-[10px] font-mono">
                              <span className="text-neutral-400">Recording payload: {meet.recordingSize}</span>
                              <button 
                                onClick={() => {
                                  info("Downloading MP4...", "Vetting video download node in progress.");
                                }}
                                className="text-blue-600 hover:underline cursor-pointer"
                              >
                                Download MP4
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 7: DELIVERABLES MANAGEMENT
               ========================================== */}
            {workspaceTab === "deliverables" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Sponsor Deliverables Console</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Upload solution build, review feedback diagnostics and compare version logs.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column (5/12): Submission panel */}
                  <div className="md:col-span-5 p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Deposit Deliverable Solution</span>

                    <form onSubmit={handleDeliverableSubmit} className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700">Challenge Deliverable Title</label>
                        <input 
                          type="text" 
                          value={submittingDelTitle}
                          onChange={(e) => setSubmittingDelTitle(e.target.value)}
                          placeholder="e.g. usePerformanceProfiler hook ts package"
                          className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-neutral-700">Boilerplate / Code payload</label>
                        <textarea 
                          value={submittingDelSnippet}
                          onChange={(e) => setSubmittingDelSnippet(e.target.value)}
                          placeholder="Paste TS module implementation code block..."
                          rows={6}
                          className="w-full bg-white border border-neutral-200 rounded-xl p-3 font-mono focus:outline-hidden"
                        />
                      </div>

                      <button type="submit" className="w-full h-10 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs">
                        Publish for Evaluation
                      </button>
                    </form>
                  </div>

                  {/* Right Column (7/12): Deliverable status listing */}
                  <div className="md:col-span-7 space-y-4">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Submission History Vitals</span>

                    <div className="space-y-4">
                      {deliverables.map(del => (
                        <div key={del.id} className="p-4 border border-neutral-200 rounded-2xl bg-white space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <strong className="text-xs text-neutral-800 block">{del.title}</strong>
                              <span className="text-[10px] font-mono text-neutral-400">{del.submittedAt} • Version {del.version}</span>
                            </div>

                            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                              del.status === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              del.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" :
                              "bg-rose-50 text-rose-600 border-rose-100"
                            }`}>{del.status}</span>
                          </div>

                          {del.codeSnippet && (
                            <div className="bg-neutral-950 text-neutral-200 font-mono text-[10px] p-3 rounded-xl overflow-x-auto max-h-32">
                              <pre>{del.codeSnippet}</pre>
                            </div>
                          )}

                          {del.feedback && (
                            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/50 text-[11px] text-neutral-600 font-light leading-relaxed">
                              <strong className="font-bold text-neutral-800">Sponsor Feedback: </strong>
                              "{del.feedback}"
                            </div>
                          )}

                          {/* Version comparison list */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">File Revision History Log</span>
                            <div className="divide-y divide-neutral-100">
                              {del.history.map((h, i) => (
                                <div key={i} className="py-1.5 flex justify-between items-center text-[10px] font-mono text-neutral-500">
                                  <span>{h.version} • {h.date}</span>
                                  <span className="font-bold uppercase text-neutral-700">{h.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 8: PROJECT REVIEWS
               ========================================== */}
            {workspaceTab === "reviews" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Verified Mutual Reviews</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Your project review stays protected until both sides submit.</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-emerald-50 p-6 md:p-8">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-blue-700"><ShieldCheck className="h-4 w-4" /> Double-blind transaction review</div>
                      <h3 className="mt-3 text-xl font-black text-neutral-900">정직하게 평가해도 먼저 쓴 사람이 불리하지 않습니다.</h3>
                      <p className="mt-3 text-xs leading-6 text-neutral-600">결제가 검증된 프로젝트에서만 리뷰를 제출할 수 있으며, 기업 평가가 접수되기 전에는 내 리뷰가 공개되지 않습니다. 양측 제출 후 동시에 공개되고 이의신청이 가능합니다.</p>
                    </div>
                    <button type="button" onClick={() => onNavigate("trust-operations")} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-xs font-black text-white">리뷰 작성·확인 <ArrowRight className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 9: PERFORMANCE TRACKING
               ========================================== */}
            {workspaceTab === "performance" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Performance Metrics Radar</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Auto-calculated indicators mapping task speeds, deadline consistency, and overall code quality.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Recharts radar chart */}
                  <div className="h-[280px] w-full bg-neutral-50/50 border border-neutral-200/50 rounded-2xl flex items-center justify-center p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceRadarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#666", fontSize: 10, fontFamily: "sans-serif" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Alex Rivera" dataKey="A" stroke="#000" fill="#000" fillOpacity={0.15} />
                        <Radar name="Baseline Average" dataKey="B" stroke="#999" fill="#999" fillOpacity={0.05} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Metrics description list */}
                  <div className="space-y-3 font-sans">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Automatic Metrics Scorecard</span>
                    
                    <div className="grid grid-cols-2 gap-3.5">
                      {[
                        { label: "Task Speed", value: performanceKpis.productivity, color: "text-blue-600 bg-blue-50 border-blue-100" },
                        { label: "Deadlines Compliance", value: performanceKpis.deadlineCompliance, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                        { label: "Platform Quality", value: performanceKpis.quality, color: "text-rose-600 bg-rose-50 border-rose-100" },
                        { label: "Sprint Participation", value: performanceKpis.participation, color: "text-amber-600 bg-amber-50 border-amber-100" }
                      ].map((item, i) => (
                        <div key={i} className={`p-4 border rounded-2xl ${item.color} text-center`}>
                          <strong className="text-[10px] font-mono block uppercase tracking-wider">{item.label}</strong>
                          <span className="text-2xl font-display font-black mt-1 block">{item.value}/100</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Timeline */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Continuous Performance Logs Timeline</span>
                  <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-100 text-xs">
                    <div className="p-3.5 flex justify-between items-center text-neutral-600">
                      <span>✓ usePerformanceProfiler hook code linter rules validated successfully</span>
                      <span className="font-mono text-neutral-400">2 hours ago</span>
                    </div>
                    <div className="p-3.5 flex justify-between items-center text-neutral-600">
                      <span>✓ Milestone 1 architecture specifications approved</span>
                      <span className="font-mono text-neutral-400">1 day ago</span>
                    </div>
                    <div className="p-3.5 flex justify-between items-center text-neutral-600">
                      <span>✓ Completed sprint standing session #4</span>
                      <span className="font-mono text-neutral-400">2 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 10: TRUST EVIDENCE VAULT
               ========================================== */}
            {workspaceTab === "trust" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Trust Evidence Ledger</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Vetted contributions securely hashed into the company and student portfolios (Zero manual entries allowed).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Summary metric card */}
                  <div className="p-5 bg-neutral-900 text-white rounded-3xl space-y-4">
                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-400">Workspace Trust Tier</div>
                    <h3 className="text-3xl font-display font-black text-white">Trust Score: 85</h3>
                    <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: "85%" }} />
                    </div>
                    <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                      Generated dynamically from verifiable tasks, standups attendance, and reviewed deliveries hashes. No manual entry modifications are allowed.
                    </p>
                  </div>

                  {/* List of Evidence */}
                  <div className="xl:col-span-2 space-y-3">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Verifiable Sandbox Evidence Chain</span>

                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar">
                      {trustEvidences.map(ev => (
                        <div key={ev.id} className="p-4 border border-neutral-200 rounded-2xl bg-white flex justify-between items-center flex-wrap gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded uppercase">{ev.category}</span>
                            <p className="text-xs text-neutral-800 font-medium pt-1">{ev.description}</p>
                            <span className="text-[9px] font-mono text-neutral-400 block font-light">Secure Node Hash: {ev.hash}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-green-600">+{ev.scoreBonus} Trust</span>
                            <span className="text-[9px] text-neutral-400 block font-mono">{ev.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 11: HIRING PREPARATION REPORTS
               ========================================== */}
            {workspaceTab === "hiring" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Recruiter Preparation Engine</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Generate hiring reports, portfolio trust scorecards, and compile full-time employment readiness charts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Generated summary lists */}
                  <div className="p-5 border border-neutral-200 rounded-3xl space-y-4">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Verifiable Recruiter Summaries</span>
                    
                    <div className="space-y-3.5 text-xs text-neutral-600">
                      <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                        <span>Project Technical Summary</span>
                        <button 
                          onClick={() => success("Document Generated", "Successfully compiled Project Technical Summary to PDF.")}
                          className="text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          Generate PDF
                        </button>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                        <span>Student Performance Scorecard</span>
                        <button 
                          onClick={() => success("Document Generated", "Successfully compiled Student Performance Scorecard to PDF.")}
                          className="text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          Generate PDF
                        </button>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                        <span>Hiring Recommendation Report</span>
                        <button 
                          onClick={() => success("Document Generated", "Successfully compiled Hiring Recommendation Report to PDF.")}
                          className="text-blue-600 hover:underline font-bold cursor-pointer"
                        >
                          Generate PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Readiness rating */}
                  <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-4 text-center">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">AI Matching Verification</span>
                    <h3 className="text-3xl font-display font-black text-neutral-800">Ready for Conversion</h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                      <Award className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                      <span>Employment Readiness: 94%</span>
                    </div>

                    <p className="text-xs text-neutral-500 font-light leading-relaxed">
                      Sponsor Vercel Core Technologies has scheduled your vetting review. Completion of Milestone 3 unlocks your final contract offer.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 12: SPONSOR ANALYTICS (DASHBOARD)
               ========================================== */}
            {workspaceTab === "analytics" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-start flex-wrap gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-display font-black text-xl text-neutral-900">Project Velocity & Analytics</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Sponsor diagnostics, burndown charts, and hiring conversion probability indexes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recharts area chart (Burndown) */}
                  <div className="p-4 border border-neutral-200 rounded-3xl bg-neutral-50/40 space-y-3">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Sprint Burndown Velocity</span>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsBurndown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                          <YAxis tick={{ fontSize: 9 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="Planned" stroke="#ccc" fill="#e5e5e5" />
                          <Area type="monotone" dataKey="Actual" stroke="#000" fill="#a3a3a3" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Vitals scorecard bento */}
                  <div className="space-y-4">
                    <div className="p-4 border border-neutral-200 rounded-3xl bg-white flex justify-between items-center shadow-xs">
                      <div>
                        <strong className="text-xs text-neutral-800 block">Workspace Velocity Rating</strong>
                        <span className="text-[10px] text-neutral-400 font-sans">Calculated compared to corporate baselines</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-teal-600">A+ Stable</span>
                    </div>

                    <div className="p-4 border border-neutral-200 rounded-3xl bg-white flex justify-between items-center shadow-xs">
                      <div>
                        <strong className="text-xs text-neutral-800 block">Hiring Transition Probability</strong>
                        <span className="text-[10px] text-neutral-400 font-sans">Aggregated match index score</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-neutral-800">95.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                TAB 13: COOPERATIVE AI AGENTS FORUM
               ========================================== */}
            {workspaceTab === "ai-coop" && (
              <div className="flex flex-col h-[520px] justify-between animate-fadeIn">
                <div className="border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-5 h-5 text-purple-600 animate-pulse" />
                    <h2 className="font-display font-black text-xl text-neutral-900">AI Workforce Cooperative Forum</h2>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">등록된 프로젝트 맥락을 바탕으로 일정, 작업 범위와 위험요소를 함께 검토합니다.</p>
                </div>

                {/* Cooperative agent discussions */}
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
                        AI가 등록된 요청과 프로젝트 정보를 검토하고 있습니다...
                      </div>
                    </div>
                  )}
                </div>

                {/* Cooperative Action Input */}
                <form onSubmit={handleTriggerAiCoopAction} className="flex gap-2.5">
                  <input 
                    type="text" 
                    value={aiCoopInput}
                    onChange={(e) => setAiCoopInput(e.target.value)}
                    placeholder="일정, 작업 범위 또는 기술 위험을 질문해 주세요"
                    className="flex-1 bg-white border border-purple-100 focus:border-purple-600 rounded-xl px-4 py-2.5 text-xs focus:outline-hidden font-light"
                  />

                  <button 
                    type="submit" 
                    disabled={aiGenerating || !aiCoopInput.trim()}
                    className="px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-100 disabled:text-neutral-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shrink-0 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Trigger AI Coop Debate</span>
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Footer informational row */}
          <div className="border-t border-neutral-100 pt-4 flex justify-between items-center text-[10px] text-neutral-400 font-mono select-none">
            <span>KONEXA Environment Subnet: 10.0.4.x</span>
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
                {/* Drawer Header */}
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

                {/* Parameters metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-neutral-100 pb-4">
                  <div>
                    <span className="text-[9px] text-neutral-400 block font-bold">STATUS</span>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => handleUpdateTaskStatus(selectedTask.id, e.target.value as any)}
                      className="bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-neutral-600 font-semibold focus:outline-hidden mt-1"
                    >
                      <option value="todo">To Do</option>
                      <option value="progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[9px] text-neutral-400 block font-bold">ESTIMATED / ACTUAL HOURS</span>
                    <span className="text-neutral-700 block mt-1 font-semibold">{selectedTask.estimatedTime} hrs / {selectedTask.actualTime} hrs</span>
                  </div>
                </div>

                {/* Subtasks checklist */}
                {selectedTask.checklist && (
                  <div className="space-y-2 border-b border-neutral-100 pb-4 text-xs font-sans">
                    <h4 className="font-bold text-neutral-800">Checklist Subtasks</h4>
                    
                    <div className="space-y-1.5">
                      {selectedTask.checklist.map((check, idx) => (
                        <div key={check.id} className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={check.done}
                            onChange={() => {
                              const updatedChecklist = [...selectedTask.checklist];
                              updatedChecklist[idx] = { ...check, done: !check.done };
                              setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, checklist: updatedChecklist } : t));
                              setSelectedTask({ ...selectedTask, checklist: updatedChecklist });
                            }}
                            className="rounded border-neutral-300 text-teal-600"
                          />
                          <span className={check.done ? "line-through text-neutral-300" : "text-neutral-600"}>{check.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestions */}
                {selectedTask.aiSuggestions && (
                  <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2 text-xs font-sans">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                      <strong className="font-bold text-purple-900">AI Optimization Suggestions</strong>
                    </div>

                    <div className="space-y-1 text-purple-800 font-light leading-relaxed">
                      {selectedTask.aiSuggestions.map((sug, i) => (
                        <p key={i}>• {sug}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments & Mentions */}
                <div className="space-y-3 font-sans">
                  <h4 className="font-bold text-neutral-800 text-xs">Comments & Mentions</h4>
                  
                  <div className="space-y-2.5 max-h-[140px] overflow-y-auto">
                    {selectedTask.comments.map(c => (
                      <div key={c.id} className="p-3 bg-neutral-50 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                          <strong>{c.user} ({c.role})</strong>
                          <span>{c.time}</span>
                        </div>
                        <p className="text-neutral-600">"{c.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Close Button */}
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

              <div className="p-4 bg-neutral-50 flex justify-between items-center text-xs">
                <span className="font-mono text-neutral-400">Version: {selectedFile.version}</span>
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
