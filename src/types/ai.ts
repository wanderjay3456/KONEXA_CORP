export enum AgentStatus {
  IDLE = "idle",
  WORKING = "working",
  COOPERATING = "cooperating",
  PAUSED = "paused",
  OFFLINE = "offline"
}

export interface AiAgent {
  id: string;
  name: string;
  avatar: string;
  role: string;
  goal: string;
  responsibilities: string[];
  permissions: string[];
  status: AgentStatus;
  efficiency: number; // 0-100%
  completedTasks: number;
  accuracyRate: number; // 0-100%
  latencyMs: number;
  costEstimate: number; // in USD
  memoryCount: number;
  activeContext?: string;
  currentTask?: string;
  subscribedEvents: string[];
}

export enum MemoryType {
  SHORT_TERM = "short-term",
  LONG_TERM = "long-term",
  PROJECT = "project",
  COMPANY = "company",
  STUDENT = "student",
  CONVERSATION = "conversation",
  LEARNING = "learning",
  DECISION = "decision",
  TRUST = "trust",
  PERFORMANCE = "performance"
}

export interface AiMemory {
  id: string;
  type: MemoryType;
  key: string;
  value: string;
  version: number;
  compressed: boolean;
  sensitive: boolean;
  expiredAt: number | null;
  agentId: string;
  referenceId?: string; // studentId, projectId, companyId etc
  createdAt: number;
}

export interface AiTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // agentId
  projectId?: string;
  studentId?: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number; // 0-100
  result?: string;
  logs: string[];
  cost: number;
  createdAt: number;
  completedAt?: number;
}

export interface PromptVersion {
  id: string;
  name: string;
  role: string; // e.g. "AI Recruiter", "AI Growth Coach"
  systemPrompt: string;
  userTemplate: string;
  version: number;
  active: boolean;
  variables: string[];
  createdAt: number;
  localization: string; // "en" | "ko" | "en-ko"
  abTestSegment?: "A" | "B";
}

export interface AiReport {
  id: string;
  title: string;
  type: "weekly" | "monthly" | "quarterly" | "project" | "trust" | "performance" | "hiring" | "learning";
  author: string; // agentId
  content: string; // Markdown summary
  metadata: Record<string, any>;
  createdAt: number;
}

export interface AiMetric {
  id: string;
  timestamp: number;
  accuracy: number;
  latency: number;
  cost: number;
  usageCount: number;
  acceptanceRate: number;
  userSatisfaction: number;
}

export interface ModelConfig {
  id: string;
  provider: "Gemini" | "OpenAI" | "Claude" | "OpenSource";
  modelName: string;
  active: boolean;
  latencyRating: "Low" | "Medium" | "High";
  costPerMillion: number;
  fallbackModelId?: string;
  accuracyScore: number;
}

export interface AiFeedback {
  id: string;
  agentId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: number;
}

export interface AiLog {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  details: string;
  level: "info" | "warning" | "error" | "security";
  timestamp: number;
}
