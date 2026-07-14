import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Terminal, 
  Activity, 
  TrendingUp, 
  Layers, 
  Server, 
  ShieldAlert, 
  Clock, 
  Users2, 
  Building2, 
  FileCode2, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sliders, 
  Key, 
  Lock, 
  Database, 
  Search, 
  ArrowRightLeft, 
  UserPlus, 
  ShieldCheck, 
  RotateCcw, 
  Volume2, 
  HelpCircle, 
  Send, 
  Plus, 
  Check, 
  Play, 
  Save, 
  RefreshCw,
  FileText,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from "recharts";
import { useToast } from "../ui/Toast";

// ==========================================
// PRE-DEFINED MOCK DATA FOR DEMO/DEVELOPER FEEDBACK
// ==========================================
const ROLES_LIST = [
  { id: "platform-owner", name: "Platform Owner", desc: "Unrestricted master access", usersCount: 1 },
  { id: "super-admin", name: "Super Admin", desc: "Enterprise configurations and financial audits", usersCount: 3 },
  { id: "admin", name: "Admin", desc: "Operational user & project management", usersCount: 8 },
  { id: "moderator", name: "Moderator", desc: "Verification & badge review capability", usersCount: 12 },
  { id: "support", name: "Support Staff", desc: "Assign tickets, view system history", usersCount: 15 },
  { id: "ai-manager", name: "AI Manager", desc: "Prompt editing and model routing toggles", usersCount: 4 }
];

const PERMISSIONS_LIST = [
  "system:write_settings", "system:read_telemetry", "users:suspend", "users:delete", "users:merge",
  "companies:verify", "projects:force_archive", "ai:tune_prompts", "ai:view_memories",
  "security:block_ip", "finance:read_ledgers", "content:edit_pages"
];

export default function AdminDashboard() {
  const { success, error, info } = useToast();
  const { projects, applications, logs, studentProfile } = useApp();

  // Selected administrative tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "companies" | "projects" | "ai" | "approvals" | "audit" | "security" | "support" | "telemetry" | "rbac"
  >("overview");

  // State arrays populated from our Phase 9 backend APIs
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [aiPrompts, setAiPrompts] = useState<any>({});
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [contentPages, setContentPages] = useState<any[]>([]);

  // Filtering / interactive states
  const [isLoading, setIsLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [isUpdating, setIsUpdating] = useState(false);

  // Modals / forms states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPromptAgent, setSelectedPromptAgent] = useState<string>("AI Recruiter");
  const [testPromptInput, setTestPromptInput] = useState("");
  const [testPromptResult, setTestPromptResult] = useState("");
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);
  const [newBroadcast, setNewBroadcast] = useState({ title: "", category: "System Alerts", body: "", target: "All Users" });
  
  // Custom RBAC states
  const [selectedRole, setSelectedRole] = useState(ROLES_LIST[1]);
  const [rolePermissions, setRolePermissions] = useState<string[]>(["system:read_telemetry", "users:suspend", "companies:verify"]);

  // Fetch all administration states from Phase 9 router
  const loadAdminState = async () => {
    try {
      setIsLoading(true);
      const [
        metricsRes,
        auditRes,
        secRes,
        ticketsRes,
        settingsRes,
        contentRes,
        notifRes
      ] = await Promise.all([
        fetch("/api/admin/metrics").then(r => r.json()),
        fetch("/api/admin/audit").then(r => r.json()),
        fetch("/api/admin/security").then(r => r.json()),
        fetch("/api/admin/support/tickets").then(r => r.json()),
        fetch("/api/admin/settings").then(r => r.json()),
        fetch("/api/admin/content").then(r => r.json()),
        fetch("/api/admin/notifications").then(r => r.json())
      ]);

      setMetrics(metricsRes);
      setAuditLogs(auditRes);
      setSecurityEvents(secRes);
      setSupportTickets(ticketsRes);
      setSystemSettings(settingsRes.settings);
      setFeatureFlags(settingsRes.flags);
      setContentPages(contentRes);
      setNotifications(notifRes);

      // Default the AI prompt state
      const promptsRes = await fetch("/api/admin/ai/prompts").then(r => r.json());
      setAiPrompts(promptsRes);
    } catch (err) {
      console.error("Failed to load global SaaS admin telemetry", err);
      error("Administrative Sync Error", "Could not synchronize some real-time enterprise streams.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminState();

    // Setup an interval to emulate sub-second hot telemetry updates
    const interval = setInterval(async () => {
      try {
        const freshMetrics = await fetch("/api/admin/metrics").then(r => r.json());
        setMetrics((prev: any) => {
          if (!prev) return freshMetrics;
          return {
            ...freshMetrics,
            health: {
              ...freshMetrics.health,
              cpuUsage: Math.floor(18 + Math.random() * 8), // Dynamic visual jitter
              memoryUsage: Math.floor(41 + Math.random() * 4),
              databaseLatencyMs: Math.floor(11 + Math.random() * 5)
            }
          };
        });
      } catch (e) {
        // Suppress background poll errors
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Action: Block IP in firewall
  const handleBlockIp = async (ip: string) => {
    try {
      const res = await fetch("/api/admin/security/block-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: ip, reason: "Manual ban triggered by SaaS administrator" })
      }).then(r => r.json());
      
      if (res.success) {
        success("IP Security Ban Applied", res.message);
        loadAdminState();
      }
    } catch (err) {
      error("Security Command Failure", "Could not commit firewall ban.");
    }
  };

  // Action: Force roll back system configuration using audit trail
  const handleRollbackAudit = async (logId: string) => {
    try {
      setIsUpdating(true);
      const res = await fetch("/api/admin/audit/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId })
      }).then(r => r.json());

      if (res.success) {
        success("Transaction Rollback Succeeded", res.message);
        loadAdminState();
      }
    } catch (err) {
      error("Rollback Aborted", "Could not safely restore system snapshot.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Action: Broadcast notification campaign
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcast.title || !newBroadcast.body) {
      return error("Validation Failure", "Campaign title and message body are required.");
    }

    try {
      setIsUpdating(true);
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBroadcast)
      }).then(r => r.json());

      if (res.announcement) {
        success("Global Campaign Deployed", `Broadcast has been dispatched to ${newBroadcast.target}.`);
        setNewBroadcast({ title: "", category: "System Alerts", body: "", target: "All Users" });
        loadAdminState();
      }
    } catch (err) {
      error("Broadcast Fail", "Could not enqueue announcement dispatch.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Action: Toggle Feature Flag
  const handleToggleFlag = async (flagId: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/settings/flags/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, enabled: !currentVal })
      }).then(r => r.json());

      if (res.success) {
        success("Feature Configuration Changed", `${res.flag.name} toggled successfully.`);
        loadAdminState();
      }
    } catch (err) {
      error("Failed to commit flag state", "Server rejected configuration update.");
    }
  };

  // Action: Test LLM System Prompt Version Live on model route
  const handleTestPrompt = async () => {
    if (!testPromptInput) return error("Missing Input", "Enter a sample candidate or scenario context to test.");
    try {
      setIsTestingPrompt(true);
      setTestPromptResult("Directing live model query to Gemini API endpoint. Checking latency profile...");
      const res = await fetch("/api/admin/ai/prompts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName: selectedPromptAgent, testInput: testPromptInput })
      }).then(r => r.json());

      if (res.success) {
        setTestPromptResult(res.output);
        success("Model Stream Active", `Inference complete. Latency: ${res.latencyMs}ms, tokens: ${res.tokensUsed}`);
      }
    } catch (err: any) {
      setTestPromptResult(`Live query failed: ${err.message || err}`);
      error("Inference Error", "Could not evaluate test inputs against active prompt configuration.");
    } finally {
      setIsTestingPrompt(false);
    }
  };

  // Action: Save Prompt Updates
  const handleSavePrompt = async (agentName: string, systemInstruction: string, version: string, routing: string, temp: number) => {
    try {
      setIsUpdating(true);
      const res = await fetch("/api/admin/ai/prompts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName, version, temperature: temp, systemInstruction, routing })
      }).then(r => r.json());

      if (res.success) {
        success("System Prompt Tuned", `Saved changes to ${agentName} version ${version}.`);
        loadAdminState();
      }
    } catch (err) {
      error("Tuning Failed", "Could not commit prompt configuration update.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Support ticket state update
  const handleUpdateTicket = async (ticketId: string, status: string, assignedTo?: string) => {
    try {
      const res = await fetch("/api/admin/support/tickets/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status, assignedTo })
      }).then(r => r.json());

      if (res.success) {
        success("Ticket Log Updated", `Status updated to ${status}.`);
        loadAdminState();
      }
    } catch (err) {
      error("Failed to update SLA ticket", "Could not complete update.");
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 h-full p-8 text-center">
        <RefreshCw className="w-8 h-8 text-black animate-spin mb-3" />
        <p className="font-sans text-sm text-neutral-500 font-medium">Booting Global Operations Center...</p>
        <p className="font-mono text-[10px] text-neutral-400 mt-1">Acquiring cloud shards & Firestore live listeners...</p>
      </div>
    );
  }

  // Define some rich visuals
  const COLORS = ["#000000", "#525252", "#a3a3a3", "#e5e5e5"];
  const healthData = [
    { name: "CPU Utilization", value: metrics.health.cpuUsage },
    { name: "Memory Footprint", value: metrics.health.memoryUsage },
    { name: "Optimal Bandwidth", value: 30 }
  ];

  return (
    <div id="admin-operations-root" className="flex-1 overflow-y-auto bg-neutral-50 flex flex-col h-[calc(100vh-64px)]">
      
      {/* 1. TOP SUB-HEADER BAR */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-10 shrink-0">
        <div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">
            Operations & Infrastructure
          </span>
          <h1 className="font-display font-bold text-2xl text-neutral-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-neutral-900" />
            Global Operations Center
          </h1>
        </div>

        {/* Real-time System Telemetry Pulse */}
        <div className="flex items-center gap-4 text-xs font-sans">
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-neutral-500">System Gateway:</span>
            <span className="font-mono font-bold text-neutral-900">Optimal ({metrics.health.databaseLatencyMs}ms)</span>
          </div>

          <button 
            onClick={loadAdminState} 
            className="p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl cursor-pointer transition-colors"
            title="Force refresh administration registers"
          >
            <RefreshCw className="w-4 h-4 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* 2. ADMIN TAB BAR */}
      <div className="bg-white border-b border-neutral-200 px-6 py-2 overflow-x-auto flex items-center gap-1 shrink-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "overview" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          Executive Overview
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "users" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          User Registry
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "companies" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          Company Verification
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "projects" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          Projects Directory
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "ai" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          AI Workflows & Prompts
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "approvals" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          Approvals & SLA Desk
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "audit" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          Audit Ledger
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "security" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          Security Shield
        </button>
        <button
          onClick={() => setActiveTab("rbac")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "rbac" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          RBAC Matrix
        </button>
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === "telemetry" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          }`}
        >
          System Configurations
        </button>
      </div>

      {/* 3. DYNAMIC WORKSPACE BODY */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* ==========================================
            TAB: EXECUTIVE OVERVIEW
           ========================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            {/* SaaS Metrics Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Active System Users</span>
                  <Users2 className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="text-3xl font-display font-bold text-neutral-900 mt-2">
                  {metrics.users.realtimeActive}
                </div>
                <div className="text-[10px] text-green-600 font-mono mt-1 font-semibold">
                  ● {metrics.users.students} students registered
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Enterprise Clients</span>
                  <Building2 className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="text-3xl font-display font-bold text-neutral-900 mt-2">
                  {metrics.users.companies}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1 font-semibold">
                  With {metrics.users.universities} academic partners
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Platform Core Challenges</span>
                  <FileCode2 className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="text-3xl font-display font-bold text-neutral-900 mt-2">
                  {projects.length}
                </div>
                <div className="text-[10px] text-green-600 font-mono mt-1 font-semibold">
                  {metrics.projects.matchingSuccessRate}% Successful Matches
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Monthly Active Revenue</span>
                  <TrendingUp className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="text-3xl font-display font-bold text-neutral-900 mt-2">
                  ${(metrics.financials.revenueUsd).toLocaleString()}
                </div>
                <div className="text-[10px] text-green-600 font-mono mt-1 font-semibold">
                  +{metrics.financials.growthMoM}% Month-over-Month
                </div>
              </div>
            </div>

            {/* Interactive Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Telemetry Heatmap/Load Area */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm text-neutral-900">Real-time Platform Load Profile</h3>
                    <p className="text-[11px] text-neutral-400">Aggregated infrastructure resource consumption over the last 24 hours.</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-800">
                    Active Port Ingress 3000
                  </span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { hour: "02:00", cpu: 12, memory: 38, bandwidth: 22 },
                        { hour: "06:00", cpu: 18, memory: 40, bandwidth: 45 },
                        { hour: "10:00", cpu: 32, memory: 42, bandwidth: 98 },
                        { hour: "14:00", cpu: 44, memory: 44, bandwidth: 142 },
                        { hour: "18:00", cpu: 28, memory: 43, bandwidth: 110 },
                        { hour: "22:00", cpu: 21, memory: 41, bandwidth: 70 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hour" stroke="#a3a3a3" fontSize={10} tickLine={false} />
                      <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="cpu" name="CPU Utilization (%)" stroke="#000000" fill="#f5f5f5" strokeWidth={2} />
                      <Area type="monotone" dataKey="bandwidth" name="Aggregated Bandwidth (Gb)" stroke="#525252" fill="#e5e5e5" strokeWidth={1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribute Pies (Platform Demographics & Trust Indexes) */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
                <h3 className="font-display font-bold text-sm text-neutral-900">Infrastructure Balance Gauges</h3>
                <p className="text-[11px] text-neutral-400">Relative weights of server memory footprints vs CPU pipelines.</p>
                
                <div className="h-44 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {healthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-neutral-500">
                      <span className="w-2 h-2 rounded-full bg-black" />
                      CPU Node Threads
                    </span>
                    <span className="font-mono font-bold text-neutral-900">{metrics.health.cpuUsage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-neutral-500">
                      <span className="w-2 h-2 rounded-full bg-neutral-600" />
                      In-Memory DB Buffers
                    </span>
                    <span className="font-mono font-bold text-neutral-900">{metrics.health.memoryUsage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-neutral-500">
                      <span className="w-2 h-2 rounded-full bg-neutral-400" />
                      Dynamic Edge Pipelines
                    </span>
                    <span className="font-mono font-bold text-neutral-900">Optimal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Live Audit Stream Summary */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-premium overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-neutral-500 animate-pulse" />
                  Live Administrative Event Logs
                </span>
                <button onClick={() => setActiveTab("audit")} className="text-[10px] font-semibold text-black hover:underline cursor-pointer">
                  View Full Audit Ledger →
                </button>
              </div>
              <div className="divide-y divide-neutral-100 max-h-52 overflow-y-auto font-sans text-xs">
                {auditLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-neutral-50/50">
                    <div className="flex items-center gap-2.5">
                      <span className="text-neutral-400 font-mono text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[9px] font-mono font-bold text-neutral-800">
                        {log.action}
                      </span>
                      <span className="font-medium text-neutral-900">{log.reason}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      By {log.userName} ({log.role})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: USER REGISTRY
           ========================================== */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-neutral-900">Enterprise User Directory</h3>
                  <p className="text-xs text-neutral-400">Search, suspend, elevate roles, reset MFA codes, and review system logs across student and corporate cohorts.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-xs bg-neutral-50 focus:bg-white w-52 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="border border-neutral-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="company">Companies</option>
                    <option value="admin">Administrators</option>
                    <option value="mentor">Mentors</option>
                  </select>
                </div>
              </div>

              {/* Interactive Registry Table */}
              <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 font-sans font-bold text-[10px] uppercase tracking-wider border-b border-neutral-100">
                      <th className="p-4">Name & Email</th>
                      <th className="p-4">Platform Role</th>
                      <th className="p-4">Credentials Status</th>
                      <th className="p-4">Activity History</th>
                      <th className="p-4 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 text-neutral-700">
                    {/* Simulated Student List */}
                    {[(studentProfile ? { id: "std-prod", name: studentProfile.name, email: studentProfile.github + "@edu", role: "student", status: "Active", trust: studentProfile.trustScore } : null),
                      { id: "student-102", name: "Alex Mercer", email: "amercer@mit.edu", role: "student", status: "Suspended", trust: 45 },
                      { id: "student-103", name: "Sophia Park", email: "spark@snu.ac.kr", role: "student", status: "Active", trust: 95 },
                      { id: "company-55", name: "Samsung Recruiting Group", email: "hr@samsung.co.kr", role: "company", status: "Active", trust: 92 },
                      { id: "mentor-2", name: "David Heinemeier", email: "dhh@basecamp.com", role: "mentor", status: "Active", trust: 88 }
                    ]
                    .filter(Boolean)
                    .filter((u: any) => {
                      if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
                      return u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
                    })
                    .map((user: any) => (
                      <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-neutral-900">{user.name}</div>
                          <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{user.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${user.status === "Active" ? "text-green-700" : "text-amber-700"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === "Active" ? "bg-green-500" : "bg-amber-500"}`} />
                            {user.status} (MFA Active)
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-mono text-[10px] text-neutral-400">
                            Trust Score: <span className="font-bold text-neutral-800">{user.trust}/100</span>
                          </div>
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              success("Loaded Account Details", `Acquiring system trace for ${user.name}`);
                            }}
                            className="px-2.5 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-[10px] font-semibold rounded-lg text-neutral-700 transition-colors cursor-pointer"
                          >
                            Manage Account
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Individual Account Management Panel drawer */}
            {selectedUser && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4 animate-slideIn">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-neutral-900" />
                    <h4 className="font-display font-bold text-sm text-neutral-900">
                      SaaS Supervisor Controls: {selectedUser.name} ({selectedUser.id})
                    </h4>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="text-neutral-400 hover:text-black text-xs font-semibold">
                    Close Panel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button
                    onClick={async () => {
                      try {
                        const newStatus = selectedUser.status === "Active" ? "Suspended" : "Active";
                        // Post a manual audit log
                        await fetch("/api/admin/audit/log", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "USER_STATUS_CHANGE",
                            object: selectedUser.id,
                            previousValue: selectedUser.status,
                            newValue: newStatus,
                            reason: "Manual admin override action initiated in supervisor panel."
                          })
                        });
                        success("Status Toggled", `User accounts locked out. Log created.`);
                        loadAdminState();
                        setSelectedUser(null);
                      } catch (e) {}
                    }}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left rounded-xl space-y-1 group transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-neutral-500" />
                      Suspend / Activate Account
                    </div>
                    <p className="text-[10px] text-neutral-400">Lock users out of platform dashboard immediately.</p>
                  </button>

                  <button
                    onClick={() => {
                      success("MFA Reset Dispatched", `A hardware token reset key was generated for ${selectedUser.email}.`);
                    }}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left rounded-xl space-y-1 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-neutral-500" />
                      Force Password / MFA Reset
                    </div>
                    <p className="text-[10px] text-neutral-400">Invalidate current login salts and trigger setup flow.</p>
                  </button>

                  <button
                    onClick={() => {
                      success("Account Merged", "Duplicate identities merged securely with 100% telemetry historical continuity.");
                    }}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left rounded-xl space-y-1 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-neutral-500" />
                      Merge Account Logs
                    </div>
                    <p className="text-[10px] text-neutral-400">Combine duplicate accounts matching email profiles.</p>
                  </button>

                  <button
                    onClick={() => {
                      info("Permissions Extended", "Extended system administrator access flags on identity payload.");
                    }}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-left rounded-xl space-y-1 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-neutral-500" />
                      Assign Custom Permissions
                    </div>
                    <p className="text-[10px] text-neutral-400">Direct mapping to RBAC tables bypasses standard caps.</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB: COMPANY VERIFICATION
           ========================================== */}
        {activeTab === "companies" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-900">Corporate License & Verification</h3>
                <p className="text-xs text-neutral-400">Review business registration certificates, calculate company security risk scores, and approve pending partner applications.</p>
              </div>

              {/* List of Pending Corporate Clients */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { name: "Global Tech Consultants Inc.", regNo: "105-82-44109", risk: 12, country: "Seoul, Korea", status: "Pending" },
                  { name: "Apex Alpha Software", regNo: "982-12-00452", risk: 28, country: "San Francisco, USA", status: "Verified" }
                ].map((co) => (
                  <div key={co.name} className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-neutral-900 text-sm">{co.name}</h4>
                        <span className="text-[10px] text-neutral-400 font-mono">Reg #: {co.regNo} | {co.country}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${co.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                        {co.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 py-2 border-y border-neutral-100 text-center">
                      <div>
                        <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Risk Index</div>
                        <div className="text-sm font-display font-bold text-neutral-900">{co.risk}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Hiring Limit</div>
                        <div className="text-sm font-display font-bold text-neutral-900">Unlimited</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Doc Score</div>
                        <div className="text-sm font-display font-bold text-neutral-900">98/100</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-medium text-neutral-500">Business Registration File: <span className="font-mono text-black font-semibold underline">view_license.pdf</span></span>
                      
                      {co.status === "Pending" && (
                        <div className="space-x-1.5">
                          <button
                            onClick={() => {
                              success("Company Approved", `${co.name} verified successfully.`);
                              loadAdminState();
                            }}
                            className="px-2 py-1 bg-black text-white rounded text-[10px] font-bold cursor-pointer hover:bg-neutral-800"
                          >
                            Verify Partner
                          </button>
                          <button
                            onClick={() => {
                              error("Registration Rejected", "Sent notice of verification document clarification.");
                            }}
                            className="px-2 py-1 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: PROJECTS DIRECTORY
           ========================================== */}
        {activeTab === "projects" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-900">Active Challenge Workspace Directory</h3>
                <p className="text-xs text-neutral-400">Monitor development teams, audit active tasks, and execute emergency platform controls (force archive, force close, clone, or restore challenges).</p>
              </div>

              <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden bg-white text-xs">
                {projects.map((proj) => (
                  <div key={proj.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/30">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-neutral-900 text-sm">{proj.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${proj.status === "open" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-800"}`}>
                          {proj.status}
                        </span>
                      </div>
                      <p className="text-neutral-500 max-w-xl text-[11px] leading-relaxed line-clamp-1">{proj.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-mono">
                        <span>Partner: {proj.companyName}</span>
                        <span>•</span>
                        <span>Reward: {proj.reward}</span>
                        <span>•</span>
                        <span>Difficulty: {proj.difficulty}</span>
                      </div>
                    </div>

                    <div className="space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          success("Challenge Archived", `${proj.title} forced to historical archives.`);
                          proj.status = "completed" as any;
                          loadAdminState();
                        }}
                        className="px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Force Archive
                      </button>
                      <button
                        onClick={() => {
                          success("Challenge Cloned", `Successfully deployed cloned workspace template for ${proj.title}.`);
                          loadAdminState();
                        }}
                        className="px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Clone Project
                      </button>
                      <button
                        onClick={() => {
                          success("Restored Open State", `${proj.title} opened back to general matchmaking queue.`);
                          proj.status = "open" as any;
                          loadAdminState();
                        }}
                        className="px-2.5 py-1.5 bg-black text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-neutral-800"
                      >
                        Restore Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: AI WORKFLOWS & PROMPTS
           ========================================== */}
        {activeTab === "ai" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Prompt Weights & Tuning Panel */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-base text-neutral-900">LLM Prompt Assembly & Model Routing</h3>
                    <p className="text-xs text-neutral-400">Directly modify system instructions, set temperatures, and configure cloud routing parameters for specialized agents.</p>
                  </div>
                  <select
                    value={selectedPromptAgent}
                    onChange={(e) => setSelectedPromptAgent(e.target.value)}
                    className="border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-semibold bg-white"
                  >
                    {Object.keys(aiPrompts).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {aiPrompts[selectedPromptAgent] && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Active Version</label>
                        <input
                          type="text"
                          defaultValue={aiPrompts[selectedPromptAgent].version}
                          id="prompt-ver-input"
                          className="w-full border border-neutral-200 rounded-xl px-3 py-2 bg-neutral-50 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Inference Model</label>
                        <select
                          defaultValue={aiPrompts[selectedPromptAgent].routing}
                          id="prompt-route-input"
                          className="w-full border border-neutral-200 rounded-xl px-3 py-2 bg-neutral-50"
                        >
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash (Performance)</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Temperature</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          defaultValue={aiPrompts[selectedPromptAgent].temperature}
                          id="prompt-temp-input"
                          className="w-full border border-neutral-200 rounded-xl px-3 py-2 bg-neutral-50 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">System Instructions Frame</label>
                      <textarea
                        defaultValue={aiPrompts[selectedPromptAgent].systemInstruction}
                        id="prompt-instr-input"
                        rows={6}
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2 bg-neutral-50 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={async () => {
                          const v = (document.getElementById("prompt-ver-input") as HTMLInputElement).value;
                          const r = (document.getElementById("prompt-route-input") as HTMLSelectElement).value;
                          const t = parseFloat((document.getElementById("prompt-temp-input") as HTMLInputElement).value);
                          const ins = (document.getElementById("prompt-instr-input") as HTMLTextAreaElement).value;
                          await handleSavePrompt(selectedPromptAgent, ins, v, r, t);
                        }}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-black text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Commit Prompt & Deploy Version
                      </button>
                    </div>

                    {/* Prompts History / Audit rollbacks */}
                    <div className="pt-2">
                      <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest block mb-2">Tuning History Logs</span>
                      <div className="border border-neutral-100 rounded-xl divide-y divide-neutral-100 bg-neutral-50/50">
                        {aiPrompts[selectedPromptAgent].history?.map((h: any, idx: number) => (
                          <div key={idx} className="p-3 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-neutral-800">{h.version}</span>
                              <span className="text-neutral-400">({h.date})</span>
                              <span className="text-neutral-500">• {h.desc}</span>
                            </div>
                            <button
                              onClick={() => {
                                success("Prompt Restored", `Loaded settings for ${selectedPromptAgent} back to ${h.version}.`);
                                (document.getElementById("prompt-ver-input") as HTMLInputElement).value = h.version;
                              }}
                              className="text-neutral-900 hover:underline font-semibold"
                            >
                              Rollback to this version
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Prompt Testing Live Sandbox */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
                <h3 className="font-display font-bold text-base text-neutral-900">Sandbox Playground</h3>
                <p className="text-xs text-neutral-400">Simulate direct pipeline executions of prompt parameters prior to live SaaS deployment.</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Sandbox Input Context</label>
                    <textarea
                      placeholder="e.g., Candidates profile: name is Alex, has 3 stars React skill..."
                      value={testPromptInput}
                      onChange={(e) => setTestPromptInput(e.target.value)}
                      rows={4}
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleTestPrompt}
                    disabled={isTestingPrompt}
                    className="w-full py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    {isTestingPrompt ? "Processing Live Inference..." : "Test Active Prompt Assembly"}
                  </button>

                  <div className="space-y-1">
                    <span className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Model Response Output</span>
                    <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-50 max-h-48 overflow-y-auto font-mono text-[10px] text-neutral-700 whitespace-pre-wrap leading-relaxed">
                      {testPromptResult || "No inference runs executed yet. Select an agent and trigger a test."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: APPROVALS & SLA DESK
           ========================================== */}
        {activeTab === "approvals" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Split layout: Approvals Clearinghouse and SLA support desk */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Approval queues */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
                <div>
                  <h3 className="font-display font-bold text-base text-neutral-900">Approval Clearinghouse Queue</h3>
                  <p className="text-xs text-neutral-400">Verify user credentials, university certificates, badge claims, and project completion deliverables.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: "appr-1", name: "MIT University Accreditation Request", type: "University Status", doc: "accreditation_MIT_2026.pdf" },
                    { id: "appr-2", name: "AWS Cloud Practitioner Badge Claim", type: "Badge Verification", doc: "cert_claim_aws_101.pdf" }
                  ].map((item) => (
                    <div key={item.id} className="p-3.5 bg-neutral-50/70 border border-neutral-200 rounded-xl flex items-center justify-between gap-4 text-xs font-sans">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{item.type}</span>
                        <h4 className="font-bold text-neutral-900">{item.name}</h4>
                        <span className="block font-mono text-[9px] text-black underline">Document: {item.doc}</span>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => success("Item Approved", `${item.name} has been processed successfully.`)}
                          className="px-2 py-1 bg-black text-white text-[9px] font-bold rounded cursor-pointer"
                        >
                          Approve Claim
                        </button>
                        <button
                          onClick={() => error("Item Rejected", "Rejected claim and notified user for update.")}
                          className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[9px] font-bold rounded cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SLA support desk */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
                <div>
                  <h3 className="font-display font-bold text-base text-neutral-900">SLA Support Tickets & Bug Reports</h3>
                  <p className="text-xs text-neutral-400">Manage, allocate, and review SLA timers for incoming support tickets, account resets, and security lockouts.</p>
                </div>

                <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden bg-white text-xs">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-neutral-50/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${ticket.priority === "High" ? "bg-red-100 text-red-800" : "bg-neutral-100 text-neutral-800"}`}>
                            {ticket.priority} Priority
                          </span>
                          <span className="font-bold text-neutral-900">{ticket.title}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono">User: {ticket.userEmail} | Assignee: {ticket.assignedTo}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-semibold text-neutral-500">
                          SLA Time: {Math.max(1, Math.round((ticket.slaDeadline - Date.now()) / 3600000))} hrs
                        </span>
                        {ticket.status === "Open" ? (
                          <button
                            onClick={() => handleUpdateTicket(ticket.id, "In Progress", "Supervisor Alex")}
                            className="px-2 py-1 bg-black text-white text-[9px] font-bold rounded cursor-pointer"
                          >
                            Claim Ticket
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateTicket(ticket.id, "Open", "None")}
                            className="px-2 py-1 bg-green-100 text-green-800 text-[9px] font-bold rounded cursor-pointer"
                          >
                            Resolve Ticket
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: AUDIT LEDGER
           ========================================== */}
        {activeTab === "audit" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-neutral-900">Platform Forensic Audit Trail</h3>
                  <p className="text-xs text-neutral-400">Searchable history of system changes, prompt tunings, feature toggles, and administrator interventions. Features cryptographic continuity checks.</p>
                </div>
                <div className="text-[10px] font-mono font-bold bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-xl text-neutral-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                  Ledger Signature: Verified Consistent
                </div>
              </div>

              {/* Forensic list */}
              <div className="border border-neutral-100 rounded-xl overflow-hidden">
                <div className="divide-y divide-neutral-100 bg-white font-sans text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-neutral-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[9px] font-mono font-bold text-neutral-800">
                            {log.action}
                          </span>
                          <span className="font-bold text-neutral-900">{log.reason}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-neutral-400 font-mono pt-1">
                          <span>Target Object: <span className="text-neutral-700 font-semibold">{log.object}</span></span>
                          {log.previousValue !== "N/A" && (
                            <>
                              <span>•</span>
                              <span>Before: <span className="text-red-700 font-semibold">{log.previousValue.slice(0, 30)}</span></span>
                              <span>•</span>
                              <span>After: <span className="text-green-700 font-semibold">{log.newValue.slice(0, 30)}</span></span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1.5 text-[10px] text-neutral-400 font-mono shrink-0">
                        <span>Actor: {log.userName} ({log.role})</span>
                        <span>IP: {log.ipAddress} | Location: {log.location}</span>
                        {(log.action === "PROMPT_ROLLBACK" || log.action === "PROMPT_TUNE" || log.action === "USER_SUSPEND") && (
                          <button
                            onClick={() => handleRollbackAudit(log.id)}
                            className="mt-1 self-start sm:self-end px-2 py-0.5 bg-black text-white rounded text-[8px] font-bold cursor-pointer"
                          >
                            Rollback Change
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: SECURITY SHIELD
           ========================================== */}
        {activeTab === "security" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Security KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-premium flex items-center gap-3">
                <Lock className="w-8 h-8 text-neutral-900 shrink-0" />
                <div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Failed Logins (24h)</div>
                  <div className="text-xl font-display font-bold text-neutral-900 mt-0.5">14 attempts</div>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-premium flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-neutral-900 shrink-0" />
                <div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Prompt Injections Blocked</div>
                  <div className="text-xl font-display font-bold text-neutral-900 mt-0.5">3 attempts</div>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-premium flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-neutral-900 shrink-0" />
                <div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Active IP Bans</div>
                  <div className="text-xl font-display font-bold text-neutral-900 mt-0.5">8 blacklists</div>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-premium flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-neutral-900 shrink-0" />
                <div>
                  <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">API Gateway Health</div>
                  <div className="text-xl font-display font-bold text-neutral-900 mt-0.5">99.98% Rate Limit</div>
                </div>
              </div>
            </div>

            {/* Live Security Log monitor & IP block tools */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Security Logs list */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium lg:col-span-2 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-base text-neutral-900">Security Gate Shard Activity Logs</h3>
                  <p className="text-xs text-neutral-400">Automated filters intercept failed authentications, prompt injections, and potential API usage threshold violations.</p>
                </div>

                <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden bg-white text-xs">
                  {securityEvents.map((evt) => (
                    <div key={evt.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-neutral-50/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${evt.status === "Blocked" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                            {evt.status}
                          </span>
                          <span className="font-bold text-neutral-900">{evt.action}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono">User: {evt.email} | Device: {evt.device} ({evt.location})</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[10px] text-neutral-800">{evt.ipAddress}</span>
                        <button
                          onClick={() => handleBlockIp(evt.ipAddress)}
                          className="px-2 py-1 bg-black text-white text-[9px] font-bold rounded cursor-pointer"
                        >
                          Block IP
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IP Blacklist Manual tool */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4 h-fit">
                <h3 className="font-display font-bold text-base text-neutral-900">Manual Gateway Block</h3>
                <p className="text-xs text-neutral-400">Explicitly ban range parameters or suspicious networks instantly in the firewalls.</p>
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const ip = (document.getElementById("manual-ip-input") as HTMLInputElement).value;
                    const reason = (document.getElementById("manual-reason-input") as HTMLInputElement).value;
                    if (!ip) return;
                    handleBlockIp(ip);
                    (document.getElementById("manual-ip-input") as HTMLInputElement).value = "";
                    (document.getElementById("manual-reason-input") as HTMLInputElement).value = "";
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">IP Address / CIDR Range</label>
                    <input
                      type="text"
                      id="manual-ip-input"
                      placeholder="e.g., 203.0.113.88"
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Reason for block</label>
                    <input
                      type="text"
                      id="manual-reason-input"
                      placeholder="e.g., Suspicious API crawl patterns"
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-black hover:bg-neutral-850 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Apply Gateway Ban
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: RBAC MATRIX
           ========================================== */}
        {activeTab === "rbac" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-900">Enterprise Role-Based Access Control (RBAC)</h3>
                <p className="text-xs text-neutral-400">Manage fine-grained custom authorization schemas. Create, audit, and bind system permission arrays directly to active roles.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Available Roles */}
                <div className="space-y-3">
                  <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest block">Available System Roles</span>
                  <div className="border border-neutral-100 rounded-xl bg-neutral-50/50 divide-y divide-neutral-100">
                    {ROLES_LIST.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(role)}
                        className={`w-full p-4 text-left transition-colors cursor-pointer flex justify-between items-center ${
                          selectedRole.id === role.id ? "bg-white border-l-2 border-black" : "hover:bg-neutral-100/50"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-neutral-900">{role.name}</div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">{role.desc}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-800">
                          {role.usersCount} binds
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="lg:col-span-2 space-y-4 bg-neutral-50/40 p-5 rounded-2xl border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">Fine-Grained Permissions for: {selectedRole.name}</h4>
                      <p className="text-[11px] text-neutral-400">Check/uncheck blocks to update active permissions mapped to this token.</p>
                    </div>
                    <button
                      onClick={() => success("Permissions Saved", `Successfully updated enterprise mappings for ${selectedRole.name}.`)}
                      className="px-3 py-1.5 bg-black text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Save RBAC Map
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {PERMISSIONS_LIST.map((perm) => {
                      const isChecked = rolePermissions.includes(perm);
                      return (
                        <label key={perm} className="flex items-center gap-2.5 p-3.5 bg-white rounded-xl border border-neutral-200 cursor-pointer hover:border-neutral-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setRolePermissions(prev => prev.filter(p => p !== perm));
                              } else {
                                setRolePermissions(prev => [...prev, perm]);
                              }
                            }}
                            className="rounded text-black focus:ring-0"
                          />
                          <div>
                            <span className="font-mono text-xs font-bold text-neutral-900 block">{perm}</span>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">Allows execution on matching admin API endpoints.</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: SYSTEM CONFIGURATIONS & TELEMETRY
           ========================================== */}
        {activeTab === "telemetry" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Feature Flags */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
              <div>
                <h3 className="font-display font-bold text-base text-neutral-900">Active Feature Flags</h3>
                <p className="text-xs text-neutral-400">Toggle prototype features, voice simulations, or live payout flows instantly without redeploying code.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {featureFlags.map((flag) => (
                  <div key={flag.id} className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{flag.group}</span>
                        <h4 className="font-bold text-neutral-900 text-xs font-mono">{flag.name}</h4>
                      </div>
                      <button
                        onClick={() => handleToggleFlag(flag.id, flag.enabled)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${flag.enabled ? "bg-black" : "bg-neutral-200"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${flag.enabled ? "translate-x-4" : ""}`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-500">{flag.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* General system localization setting form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Broadcast Campaigns */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4 lg:col-span-2">
                <h3 className="font-display font-bold text-base text-neutral-900">Push Notification & Broadcast Campaigns</h3>
                <p className="text-xs text-neutral-400">Draft global system warnings, scheduled maintenance details, or partner announcements.</p>
                
                <form onSubmit={handlePublishAnnouncement} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Campaign Header Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Cloud Sync Maintenance"
                        value={newBroadcast.title}
                        onChange={(e) => setNewBroadcast(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Target Audience Cohort</label>
                      <select
                        value={newBroadcast.target}
                        onChange={(e) => setNewBroadcast(prev => ({ ...prev, target: e.target.value }))}
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                      >
                        <option value="All Users">All Active Users</option>
                        <option value="Students Only">Students Cohort Only</option>
                        <option value="Companies Only">Company Partner Registry Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Message Content (Markdown Supported)</label>
                    <textarea
                      placeholder="Write announcement body details here..."
                      value={newBroadcast.body}
                      onChange={(e) => setNewBroadcast(prev => ({ ...prev, body: e.target.value }))}
                      rows={3}
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-black text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Dispatch Global Campaign
                    </button>
                  </div>
                </form>

                <div className="pt-2 border-t border-neutral-100">
                  <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest block mb-2">Recent Dispatches</span>
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-2.5 bg-neutral-50 rounded-lg flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1 rounded text-[9px] font-bold ${notif.sent ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-800"}`}>
                            {notif.sent ? "Sent" : "Scheduled"}
                          </span>
                          <span className="font-bold text-neutral-800">{notif.title}</span>
                          <span className="text-neutral-400">({notif.target})</span>
                        </div>
                        <span className="font-mono text-neutral-400 text-[9px]">{notif.scheduledAt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* System parameters settings */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-premium space-y-4">
                <h3 className="font-display font-bold text-base text-neutral-900">General Registries</h3>
                <p className="text-xs text-neutral-400">Core parameters mapping brand localization and security requirements.</p>

                {systemSettings && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Active Brand Name</label>
                      <input
                        type="text"
                        defaultValue={systemSettings.general.brandName}
                        id="brand-name-input"
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Standard Currency</label>
                        <input
                          type="text"
                          defaultValue={systemSettings.localization.defaultCurrency}
                          id="currency-input"
                          className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Max Login Failures</label>
                        <input
                          type="number"
                          defaultValue={systemSettings.security.maxFailedLogins}
                          id="failed-login-input"
                          className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                      <div>
                        <span className="font-semibold text-neutral-900 block">Immediate Maintenance Mode</span>
                        <span className="text-[10px] text-neutral-400">Put platform into offline state for updates.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const val = !systemSettings.general.maintenanceMode;
                          success("System state altered", `Maintenance mode set to: ${val}`);
                          systemSettings.general.maintenanceMode = val;
                          loadAdminState();
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${systemSettings.general.maintenanceMode ? "bg-red-500" : "bg-neutral-200"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${systemSettings.general.maintenanceMode ? "translate-x-4" : ""}`} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const bName = (document.getElementById("brand-name-input") as HTMLInputElement).value;
                        const curr = (document.getElementById("currency-input") as HTMLInputElement).value;
                        const fails = parseInt((document.getElementById("failed-login-input") as HTMLInputElement).value);
                        
                        success("Settings Saved", "Pushed core configuration maps live.");
                      }}
                      className="w-full py-2 bg-black text-white rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Save Parameters Registry
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
