import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc
} from "../lib/supabaseStore";
import { db } from "../config/supabase";
import { auth } from "../lib/supabaseAuth";
import { useToast } from "../components/ui/Toast";
import { 
  AiAgent, 
  AiMemory, 
  AiTask, 
  PromptVersion, 
  AiReport, 
  AiMetric, 
  ModelConfig, 
  AiFeedback, 
  AiLog,
  AgentStatus
} from "../types/ai";

interface AiContextType {
  agents: AiAgent[];
  memories: AiMemory[];
  tasks: AiTask[];
  prompts: PromptVersion[];
  reports: AiReport[];
  metrics: AiMetric[];
  models: ModelConfig[];
  logs: AiLog[];
  feedback: AiFeedback[];
  activeAgent: AiAgent | null;
  setActiveAgent: (agent: AiAgent | null) => void;
  runAgentTask: (agentId: string, taskTitle: string, inputData: Record<string, any>) => Promise<any>;
  savePromptVersion: (prompt: Partial<PromptVersion>) => Promise<void>;
  rollbackPrompt: (promptId: string) => Promise<void>;
  addMemory: (memory: Omit<AiMemory, "id" | "createdAt" | "version" | "compressed">) => Promise<void>;
  generateReport: (type: string, metadata: Record<string, any>) => Promise<AiReport>;
  runMatchingEngine: (projectId: string) => Promise<any[]>;
  triggerEvent: (eventName: string, payload: Record<string, any>) => Promise<void>;
  runSecurityAudit: (text: string) => Promise<{ safe: boolean; issues: string[] }>;
  submitFeedback: (agentId: string, rating: number, comment?: string) => Promise<void>;
  runWorkspaceTests: () => Promise<any>;
}

const AiContext = createContext<AiContextType | null>(null);

export function useAi() {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error("useAi must be used within an AiDataProvider");
  }
  return context;
}

/*
 * Retired prototype fixture kept only for historical source context.
 * It is deliberately commented out and can never seed or render production data.
const SEED_AGENTS: Omit<AiAgent, "id">[] = [
  {
    name: "Aegis",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=120",
    role: "Global AI Orchestrator",
    goal: "Coordinate operations across all agents, resolve dependencies, optimize costs, and route incoming requests.",
    responsibilities: [
      "Task routing & priority scheduling",
      "Memory synchronization & caching",
      "Model routing, load-balancing & cost boundaries",
      "Consolidating agent dependencies & state"
    ],
    permissions: ["READ:ALL", "WRITE:ALL", "EXECUTE:ORCHESTRATOR"],
    status: AgentStatus.IDLE,
    efficiency: 98,
    completedTasks: 142,
    accuracyRate: 99.4,
    latencyMs: 140,
    costEstimate: 0.12,
    memoryCount: 54,
    subscribedEvents: ["ProfileUpdated", "ProjectCreated", "ApplicationSubmitted"]
  },
  {
    name: "Cerebro",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    role: "AI Recruiter",
    goal: "Evaluate student code submissions, analyze resume ATS scores, and predict hiring retention rates.",
    responsibilities: [
      "Critique student repository code correctness",
      "Explain and justify matching scorecards",
      "Identify hiring risks & background inconsistencies",
      "Formulate highly relevant follow-up interview guides"
    ],
    permissions: ["READ:STUDENT", "READ:APPLICATIONS", "WRITE:FEEDBACK"],
    status: AgentStatus.IDLE,
    efficiency: 94,
    completedTasks: 840,
    accuracyRate: 95.8,
    latencyMs: 380,
    costEstimate: 0.85,
    memoryCount: 120,
    subscribedEvents: ["ApplicationSubmitted", "ResumeUploaded"]
  },
  {
    name: "Scribe",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    role: "AI Project Manager",
    goal: "Supervise challenge execution, predict deadlines, draft micro-tasks, and audit project health.",
    responsibilities: [
      "Synthesize clear task milestones",
      "Analyze pipeline deadlines vs actual student commits",
      "Forecast project delays and risk of failure",
      "Coordinate weekly human-agent work syncs"
    ],
    permissions: ["READ:PROJECT", "WRITE:TASKS", "READ:LOGS"],
    status: AgentStatus.IDLE,
    efficiency: 92,
    completedTasks: 412,
    accuracyRate: 94.1,
    latencyMs: 250,
    costEstimate: 0.45,
    memoryCount: 78,
    subscribedEvents: ["ProjectCreated", "TaskCompleted"]
  },
  {
    name: "Athena",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
    role: "AI Growth Coach",
    goal: "Deliver highly targeted educational roadmaps, identify skill gaps, and fuel student career motivation.",
    responsibilities: [
      "Draft dynamic, project-specific learning curriculums",
      "Flag skill gaps relative to high-paying challenges",
      "Nudge student goals and monitor streak engagement",
      "Recommend micro-credentials and certificates"
    ],
    permissions: ["READ:STUDENT", "WRITE:RECOMMENDATIONS"],
    status: AgentStatus.IDLE,
    efficiency: 96,
    completedTasks: 980,
    accuracyRate: 97.2,
    latencyMs: 310,
    costEstimate: 0.60,
    memoryCount: 154,
    subscribedEvents: ["ProfileUpdated", "PerformanceChanged"]
  },
  {
    name: "Clarion",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120",
    role: "AI Resume Reviewer",
    goal: "Audit resumes for applicant tracking systems, verify keyword alignment, and enforce international standards.",
    responsibilities: [
      "Parse and rate resume layouts & hierarchy",
      "Conduct keyword-stuffing / ATS compatibility test",
      "Deliver grammar & professional formatting audits",
      "Synthesize version-to-version resume updates"
    ],
    permissions: ["READ:STUDENT", "WRITE:AUDITS"],
    status: AgentStatus.IDLE,
    efficiency: 91,
    completedTasks: 310,
    accuracyRate: 93.4,
    latencyMs: 190,
    costEstimate: 0.35,
    memoryCount: 45,
    subscribedEvents: ["ResumeUploaded"]
  },
  {
    name: "Vinci",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120",
    role: "AI Portfolio Reviewer",
    goal: "Vet visual story aesthetics, quality of evidence, and technical depth of candidate portfolios.",
    responsibilities: [
      "Audit portfolio layout visual balance & hierarchy",
      "Check documentation readability and code references",
      "Rate design-system depth and interface aesthetics",
      "Provide step-by-step suggestions for premium appeal"
    ],
    permissions: ["READ:STUDENT", "WRITE:AUDITS"],
    status: AgentStatus.IDLE,
    efficiency: 89,
    completedTasks: 215,
    accuracyRate: 91.8,
    latencyMs: 410,
    costEstimate: 0.70,
    memoryCount: 38,
    subscribedEvents: ["ProfileUpdated"]
  },
  {
    name: "Socrates",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
    role: "AI Interview Coach",
    goal: "Administer high-fidelity interview simulations across technical, case, and conversational tracks.",
    responsibilities: [
      "Simulate standard technical whiteboard loops",
      "Host bilingual (English/Korean) behavioral assessments",
      "Score candidate structure, communication & terminology",
      "Record logs of transcript performance"
    ],
    permissions: ["READ:STUDENT", "WRITE:INTERVIEW", "EXECUTE:CHAT"],
    status: AgentStatus.IDLE,
    efficiency: 95,
    completedTasks: 1250,
    accuracyRate: 96.5,
    latencyMs: 320,
    costEstimate: 1.10,
    memoryCount: 190,
    subscribedEvents: ["ApplicationSubmitted"]
  },
  {
    name: "Vortex",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    role: "AI Matching Engine",
    goal: "Maintain live candidate ranking vectors utilizing real-time trust, performance, and cultural fit inputs.",
    responsibilities: [
      "Run multidimensional vector similarity metrics",
      "Weigh profile language skills vs project context",
      "Match user availability timezone overlap requirements",
      "Generate explanations for hiring match indexes"
    ],
    permissions: ["READ:ALL"],
    status: AgentStatus.IDLE,
    efficiency: 99,
    completedTasks: 3450,
    accuracyRate: 99.1,
    latencyMs: 80,
    costEstimate: 0.20,
    memoryCount: 300,
    subscribedEvents: ["ProfileUpdated", "ProjectCreated", "TrustChanged"]
  },
  {
    name: "Veritas",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=120",
    role: "AI Trust Analyst",
    goal: "Deconstruct student Trust Scores, flag anomalies, and protect the system against grading fraud.",
    responsibilities: [
      "Audit compiler integrity logs on Sandbox VMs",
      "Detect plagiarized submissions & prompt injections",
      "Explain the exact logic backing student trust drops",
      "Recommend step-by-step restoration tasks"
    ],
    permissions: ["READ:LOGS", "WRITE:TRUST", "READ:STUDENT"],
    status: AgentStatus.IDLE,
    efficiency: 97,
    completedTasks: 1840,
    accuracyRate: 98.6,
    latencyMs: 220,
    costEstimate: 0.50,
    memoryCount: 84,
    subscribedEvents: ["TrustChanged", "ApplicationSubmitted"]
  },
  {
    name: "Helix",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=120",
    role: "AI Performance Analyst",
    goal: "Inspect actual workspace collaboration, milestone speed, and individual code contributions.",
    responsibilities: [
      "Parse Git commits, line-deltas & code cleanlines",
      "Evaluate individual impact in collaborative channels",
      "Assign objective communication & efficiency ratings",
      "Generate monthly developer performance reports"
    ],
    permissions: ["READ:LOGS", "READ:APPLICATIONS", "WRITE:REPORTS"],
    status: AgentStatus.IDLE,
    efficiency: 93,
    completedTasks: 560,
    accuracyRate: 94.8,
    latencyMs: 280,
    costEstimate: 0.55,
    memoryCount: 65,
    subscribedEvents: ["ProjectCompleted", "PerformanceChanged"]
  },
  {
    name: "Synergy",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
    role: "AI Company Advisor",
    goal: "Advise enterprise partners on project scope optimization, pipeline structures, and hiring forecasts.",
    responsibilities: [
      "Analyze hiring trend vectors relative to company industry",
      "Suggest bounty / reward sizing optimized for best matches",
      "Forecast timeline conversion rates from challenge to hire",
      "Synthesize budget and capacity utilization reports"
    ],
    permissions: ["READ:COMPANY", "WRITE:RECOMMENDATIONS"],
    status: AgentStatus.IDLE,
    efficiency: 94,
    completedTasks: 280,
    accuracyRate: 96.0,
    latencyMs: 340,
    costEstimate: 0.75,
    memoryCount: 92,
    subscribedEvents: ["CompanyUpdated", "ProjectCompleted"]
  },
  {
    name: "Nexus",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120",
    role: "AI University Advisor",
    goal: "Empower academic partnerships with macro-skill metrics, curriculum alignments, and employment forecasts.",
    responsibilities: [
      "Correlate student sandbox outcomes with course curriculum",
      "Identify emerging industry skill trends for course audits",
      "Generate university-level student placement statistics",
      "Flag struggling student segments for advisory review"
    ],
    permissions: ["READ:STUDENT", "WRITE:RECOMMENDATIONS", "READ:ALL"],
    status: AgentStatus.IDLE,
    efficiency: 91,
    completedTasks: 180,
    accuracyRate: 92.7,
    latencyMs: 360,
    costEstimate: 0.65,
    memoryCount: 71,
    subscribedEvents: ["ProfileUpdated", "ProjectCompleted"]
  },
  {
    name: "Genesis",
    avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=120",
    role: "AI Report Engine",
    goal: "Compile multi-tiered, professional diagnostic reports on demand across system clusters.",
    responsibilities: [
      "Synthesize quarterly executive summaries",
      "Automate student weekly learning progress summaries",
      "Draft project post-mortems and trust verification reports",
      "Translate heavy logs into clean markdown digests"
    ],
    permissions: ["READ:ALL", "WRITE:REPORTS"],
    status: AgentStatus.IDLE,
    efficiency: 96,
    completedTasks: 720,
    accuracyRate: 98.2,
    latencyMs: 290,
    costEstimate: 0.50,
    memoryCount: 110,
    subscribedEvents: ["ProjectCompleted", "ApplicationSubmitted"]
  },
  {
    name: "Chronos",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=120",
    role: "AI Analytics",
    goal: "Record, audit, and display LLM operational health: inference latency, API costs, and accuracy rates.",
    responsibilities: [
      "Maintain strict sliding logs of API invocation stats",
      "Aggregate user helpfulness ratings and A/B test feedback",
      "Flag sudden SLA drops or API timeout spikes",
      "Generate load sync dashboard telemetry vectors"
    ],
    permissions: ["READ:LOGS", "WRITE:METRICS"],
    status: AgentStatus.IDLE,
    efficiency: 99,
    completedTasks: 1540,
    accuracyRate: 99.8,
    latencyMs: 60,
    costEstimate: 0.10,
    memoryCount: 140,
    subscribedEvents: ["TaskCompleted"]
  }
];
*/

export function AiDataProvider({ children }: { children: React.ReactNode }) {
  const { success, error, info } = useToast();

  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [memories, setMemories] = useState<AiMemory[]>([]);
  const [tasks, setTasks] = useState<AiTask[]>([]);
  const [prompts, setPrompts] = useState<PromptVersion[]>([]);
  const [reports, setReports] = useState<AiReport[]>([]);
  const [metrics, setMetrics] = useState<AiMetric[]>([]);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [feedback, setFeedback] = useState<AiFeedback[]>([]);
  const [activeAgent, setActiveAgent] = useState<AiAgent | null>(null);

  // Load live Supabase collections
  useEffect(() => {
    // 1. Subscribe to Agents
    const agentsCol = collection(db, "ai_agents");
    const unsubAgents = onSnapshot(agentsCol, async (snapshot) => {
      const items: AiAgent[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AiAgent);
      });

      items.sort((a, b) => a.name.localeCompare(b.name));
      setAgents(items);
      if (items.length === 0) {
        setActiveAgent(null);
      } else {
        setActiveAgent((current) => current && items.some((item) => item.id === current.id)
          ? current
          : items[0]);
      }
    });

    // 2. Subscribe to Memories
    const memoriesCol = collection(db, "ai_memories");
    const unsubMemories = onSnapshot(memoriesCol, (snapshot) => {
      const items: AiMemory[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AiMemory);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setMemories(items);
    });

    // 3. Subscribe to Tasks
    const tasksCol = collection(db, "ai_tasks");
    const unsubTasks = onSnapshot(tasksCol, (snapshot) => {
      const items: AiTask[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AiTask);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setTasks(items);
    });

    // 4. Subscribe to Prompt Versions
    const promptsCol = collection(db, "prompt_versions");
    const unsubPrompts = onSnapshot(promptsCol, (snapshot) => {
      const items: PromptVersion[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as PromptVersion);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setPrompts(items);
    });

    // 5. Subscribe to Reports
    const reportsCol = collection(db, "ai_reports");
    const unsubReports = onSnapshot(reportsCol, (snapshot) => {
      const items: AiReport[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AiReport);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setReports(items);
    });

    // 6. Subscribe to Metrics
    const metricsCol = collection(db, "ai_metrics");
    const unsubMetrics = onSnapshot(metricsCol, (snapshot) => {
      const items: AiMetric[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AiMetric);
      });
      items.sort((a, b) => b.timestamp - a.timestamp);
      setMetrics(items);
    });

    // 7. Subscribe to Model Registry
    const modelsCol = collection(db, "model_registry");
    const unsubModels = onSnapshot(modelsCol, (snapshot) => {
      const items: ModelConfig[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ModelConfig);
      });
      setModels(items);
    });

    // 8. Subscribe to AI Logs
    const logsCol = collection(db, "ai_logs");
    const unsubLogs = onSnapshot(logsCol, (snapshot) => {
      const items: AiLog[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AiLog);
      });
      items.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(items.slice(0, 100)); // limit to last 100 in local memory
    });

    // 9. Subscribe to Feedback
    const feedbackCol = collection(db, "ai_feedback");
    const unsubFeedback = onSnapshot(feedbackCol, (snapshot) => {
      const items: AiFeedback[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as AiFeedback);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setFeedback(items);
    });

    return () => {
      unsubAgents();
      unsubMemories();
      unsubTasks();
      unsubPrompts();
      unsubReports();
      unsubMetrics();
      unsubModels();
      unsubLogs();
      unsubFeedback();
    };
  }, []);

  // Helper helper to write system audit trace
  const logAiAction = async (agentId: string, action: string, details: string, level: "info" | "warning" | "error" | "security" = "info") => {
    try {
      const agent = agents.find(a => a.id === agentId);
      await addDoc(collection(db, "ai_logs"), {
        agentId,
        agentName: agent?.name || "Global Orchestrator",
        action,
        details,
        level,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Failed to write AI audit log", err);
    }
  };

  // Run AI Agent task through Backend Orchestrator APIs
  const runAgentTask = async (agentId: string, taskTitle: string, inputData: Record<string, any>) => {
    const taskRef = await addDoc(collection(db, "ai_tasks"), {
      title: taskTitle,
      description: `Task dispatched to Agent ${agentId}`,
      assignedTo: agentId,
      status: "running",
      progress: 10,
      logs: ["Dispatched task by Global AI Orchestrator", "Spinning up dedicated agent sandbox context..."],
      cost: 0,
      createdAt: Date.now()
    });

    // Temporarily set agent state to WORKING
    const agentRef = doc(db, "ai_agents", agentId);
    await setDoc(agentRef, { status: AgentStatus.WORKING, currentTask: taskTitle }, { merge: true });
    await logAiAction(agentId, "TASK_DISPATCHED", `Active task assigned: "${taskTitle}"`);

    try {
      // Connect to server proxy orchestration
      const response = await fetch("/api/ai/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: taskRef.id,
          agentId,
          taskTitle,
          inputData
        })
      });

      if (!response.ok) {
        throw new Error("Orchestration pipeline responded with internal server error");
      }

      const resultData = await response.json();

      // Write results to Supabase task doc
      await setDoc(doc(db, "ai_tasks", taskRef.id), {
        status: "completed",
        progress: 100,
        result: typeof resultData.result === "string" ? resultData.result : JSON.stringify(resultData.result, null, 2),
        completedAt: Date.now(),
        cost: Number(resultData.cost) || 0,
        logs: Array.isArray(resultData.logs) ? resultData.logs : []
      }, { merge: true });

      // Save key outcomes to AI Central memory!
      if (resultData.memories && Array.isArray(resultData.memories)) {
        for (const m of resultData.memories) {
          await addDoc(collection(db, "ai_memories"), {
            ...m,
            createdAt: Date.now()
          });
        }
      }

      // Restore agent status to IDLE
      await setDoc(agentRef, { status: AgentStatus.IDLE, currentTask: "" }, { merge: true });
      await logAiAction(agentId, "TASK_SUCCESS", `Completed task: "${taskTitle}"`);
      
      success("Task Completed!", `${agents.find(a => a.id === agentId)?.name} completed the job.`);
      return resultData;

    } catch (err: any) {
      console.error("Task execution error:", err);
      // Mark task as failed
      await setDoc(doc(db, "ai_tasks", taskRef.id), {
        status: "failed",
        progress: 100,
        result: `Failure: ${err.message || err}`,
        completedAt: Date.now(),
        logs: [`Execution failed: ${err.message || String(err)}`]
      }, { merge: true });

      await setDoc(agentRef, { status: AgentStatus.IDLE, currentTask: "" }, { merge: true });
      await logAiAction(agentId, "TASK_FAILED", `Failed task: "${taskTitle}". ${err.message}`, "error");

      error("AI Task Failed", err.message || "Failed to finalize workflow execution.");
      throw err;
    }
  };

  const savePromptVersion = async (promptData: Partial<PromptVersion>) => {
    try {
      const pId = promptData.id || `prompt_${promptData.role?.replace(/\s+/g, "_").toLowerCase()}_v${Date.now()}`;
      await setDoc(doc(db, "prompt_versions", pId), {
        ...promptData,
        id: pId,
        createdAt: Date.now()
      }, { merge: true });
      
      await logAiAction("agent_aegis", "PROMPT_UPDATED", `Saved prompt version for: ${promptData.role}`);
      success("Prompt Saved", `Version successfully updated in registry.`);
    } catch (err: any) {
      error("Prompt Save Failed", err.message);
    }
  };

  const rollbackPrompt = async (promptId: string) => {
    try {
      const pRef = doc(db, "prompt_versions", promptId);
      await setDoc(pRef, { active: true }, { merge: true });
      success("Prompt Restored", "Rolled back prompt configuration.");
    } catch (err: any) {
      error("Rollback failed", err.message);
    }
  };

  const addMemory = async (memoryData: Omit<AiMemory, "id" | "createdAt" | "version" | "compressed">) => {
    try {
      await addDoc(collection(db, "ai_memories"), {
        ...memoryData,
        version: 1,
        compressed: false,
        createdAt: Date.now()
      });
      await logAiAction(memoryData.agentId, "MEMORY_ADDED", `Recorded memory item: ${memoryData.key}`);
    } catch (err: any) {
      console.error("Failed to add memory:", err);
    }
  };

  const generateReport = async (type: string, metadata: Record<string, any>) => {
    try {
      info("Synthesizing Report...", "Report Engine is compiling logs and structuring the digest.");
      
      const response = await fetch("/api/ai/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, metadata })
      });

      if (!response.ok) throw new Error("Report generation failed");
      const result = await response.json();

      const newReport: Omit<AiReport, "id"> = {
        title: result.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Audit Report`,
        type: type as any,
        author: "agent_genesis",
        content: result.content,
        metadata: result.metadata || metadata,
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, "ai_reports"), newReport);
      await logAiAction("agent_genesis", "REPORT_GENERATED", `Successfully synthesized ${type} report.`);
      
      success("Report Generated!", "New diagnostic report saved to collection.");
      return { id: docRef.id, ...newReport } as AiReport;

    } catch (err: any) {
      error("Report synthesis failed", err.message);
      throw err;
    }
  };

  const runMatchingEngine = async (projectId: string) => {
    try {
      info("Matching Engine Active", "Computing multi-dimensional user compatibility profiles.");
      const response = await fetch(`/api/ai/matching?projectId=${projectId}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Matching metrics timeout");
      return Array.isArray(payload.matches) ? payload.matches : [];
    } catch (err: any) {
      error("Matching metrics unavailable", err.message);
      throw err;
    }
  };

  const triggerEvent = async (eventName: string, payload: Record<string, any>) => {
    const eventAgent = activeAgent?.id || "system";
    await logAiAction(
      eventAgent,
      "EVENT_RECEIVED",
      `Received ${eventName} with fields: ${Object.keys(payload).slice(0, 20).join(", ") || "none"}.`,
    );
  };

  const runSecurityAudit = async (text: string) => {
    try {
      const response = await fetch("/api/ai/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text })
      });
      if (!response.ok) throw new Error("Security audit error");
      return await response.json();
    } catch (err) {
      console.error("Security audit unavailable:", err);
      return {
        safe: false,
        issues: ["자동 보안 검사를 완료하지 못했습니다. 검사가 복구될 때까지 안전한 입력으로 처리하지 않습니다."],
      };
    }
  };

  const submitFeedback = async (agentId: string, rating: number, comment?: string) => {
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error("로그인 후 피드백을 제출해 주세요.");
      await addDoc(collection(db, "ai_feedback"), {
        agentId,
        userId: user.uid,
        userName: user.displayName || user.email || "KONEXA user",
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        comment,
        createdAt: Date.now()
      });
      
      await logAiAction(agentId, "USER_FEEDBACK", `User rating: ${rating}/5 stars. ${comment || ""}`);
      success("Feedback Submitted", "Thank you for supporting our AI team.");
    } catch (err: any) {
      error("Feedback save failed", err.message);
    }
  };

  // Automated suite tests execution panel
  const runWorkspaceTests = async () => {
    try {
      info("실제 시스템 점검 중", "데이터베이스와 AI 공급자에 직접 연결해 상태를 확인합니다.");
      const response = await fetch("/api/ai/diagnostics", { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!Array.isArray(payload?.checks)) {
        throw new Error(payload?.error || "시스템 진단 응답을 확인할 수 없습니다.");
      }
      const failed = payload.checks.filter((check: any) => check.status !== "passed");
      if (failed.length === 0) {
        success("실제 점검 통과", "데이터베이스와 AI 공급자의 응답을 확인했습니다.");
      } else {
        error("점검 항목 확인 필요", `${failed.length}개 항목이 통과되지 않았습니다.`);
      }
      return payload.checks;
    } catch (err: any) {
      error("점검 실패", err.message || "시스템 진단을 완료하지 못했습니다.");
      throw err;
    }
  };

  return (
    <AiContext.Provider
      value={{
        agents,
        memories,
        tasks,
        prompts,
        reports,
        metrics,
        models,
        logs,
        feedback,
        activeAgent,
        setActiveAgent,
        runAgentTask,
        savePromptVersion,
        rollbackPrompt,
        addMemory,
        generateReport,
        runMatchingEngine,
        triggerEvent,
        runSecurityAudit,
        submitFeedback,
        runWorkspaceTests
      }}
    >
      {children}
    </AiContext.Provider>
  );
}
