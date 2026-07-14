import React, { useState } from "react";
import { useAi } from "../../context/AiContext";
import { 
  Cpu, 
  Brain, 
  ShieldAlert, 
  Sparkles, 
  Send, 
  Code, 
  Terminal, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  Clock, 
  Activity, 
  Search, 
  Eye, 
  Lock, 
  RefreshCw, 
  FileText, 
  Database, 
  User, 
  Sliders, 
  Layers, 
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Settings,
  HelpCircle
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { AgentStatus, MemoryType, AiAgent, PromptVersion } from "../../types/ai";

interface AiAgentWorkspaceProps {
  activeTab: string;
}

export default function AiAgentWorkspace({ activeTab }: AiAgentWorkspaceProps) {
  const { 
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
  } = useAi();

  const { success, error, info } = useToast();

  // Selected agent for direct task execution
  const [selectedAgentForTask, setSelectedAgentForTask] = useState<AiAgent | null>(null);
  const [customTaskInput, setCustomTaskInput] = useState("");
  const [isRunningTask, setIsRunningTask] = useState(false);
  const [taskResult, setTaskResult] = useState<any>(null);

  // Security sandbox state
  const [securityInput, setSecurityInput] = useState("");
  const [securityResult, setSecurityResult] = useState<{ safe: boolean; issues: string[] } | null>(null);
  const [isAuditingSecurity, setIsAuditingSecurity] = useState(false);

  // Prompt design editor state
  const [editingPrompt, setEditingPrompt] = useState<Partial<PromptVersion> | null>(null);

  // Filter state for memories
  const [memorySearch, setMemorySearch] = useState("");
  const [memoryTypeFilter, setMemoryTypeFilter] = useState<string>("all");

  // Report hub state
  const [selectedReportType, setSelectedReportType] = useState<string>("weekly");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeReportOutput, setActiveReportOutput] = useState<any>(null);

  // Automated suite tests state
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningSuiteTests, setIsRunningSuiteTests] = useState(false);

  // Developer manual tab state
  const [devManualTab, setDevManualTab] = useState<"arch" | "memory" | "prompts" | "routing" | "api">("arch");

  // Handler for custom task sandbox dispatch
  const handleDispatchTask = async () => {
    if (!selectedAgentForTask) {
      info("No Agent Selected", "Please select an active agent to assign a task.");
      return;
    }
    if (!customTaskInput.trim()) {
      info("No Task Written", "Enter task details or query for the agent first.");
      return;
    }

    setIsRunningTask(true);
    setTaskResult(null);
    try {
      const result = await runAgentTask(
        selectedAgentForTask.id,
        `Manual Workspace Directive: ${customTaskInput.slice(0, 40)}...`,
        { prompt: customTaskInput, requestedBy: "Supervisor" }
      );
      setTaskResult(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunningTask(false);
    }
  };

  // Run security scan
  const handleSecurityScan = async () => {
    if (!securityInput.trim()) {
      info("Input empty", "Provide a code or text snippet to audit.");
      return;
    }
    setIsAuditingSecurity(true);
    setSecurityResult(null);
    try {
      const result = await runSecurityAudit(securityInput);
      setSecurityResult(result);
      if (result.safe) {
        success("Security Clear!", "No vulnerabilities or prompt injections identified.");
      } else {
        error("Vulnerabilities Detected", "Text flagged with potential system risks.");
      }
    } catch (err: any) {
      error("Audit Failed", err.message);
    } finally {
      setIsAuditingSecurity(false);
    }
  };

  // Run dynamic report compilation via Gemini
  const handleCompileReport = async () => {
    setIsGeneratingReport(true);
    setActiveReportOutput(null);
    try {
      const report = await generateReport(selectedReportType, {
        totalAgents: agents.length,
        activeTasksCount: tasks.filter(t => t.status === "running").length,
        systemCost: metrics[0]?.cost || 14.25,
        latencyTargetMs: metrics[0]?.latency || 240,
        userScoreAvg: 96.8
      });
      setActiveReportOutput(report);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Run workspace test triggers
  const handleRunVerificationSuite = async () => {
    setIsRunningSuiteTests(true);
    setTestResults([]);
    try {
      const results = await runWorkspaceTests();
      setTestResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningSuiteTests(false);
    }
  };

  // Filter memories
  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.key.toLowerCase().includes(memorySearch.toLowerCase()) || 
                          m.value.toLowerCase().includes(memorySearch.toLowerCase());
    const matchesType = memoryTypeFilter === "all" || m.type === memoryTypeFilter;
    return matchesSearch && matchesType;
  });

  const activeMetrics = metrics[0] || {
    accuracy: 97.4,
    latency: 210,
    cost: 15.42,
    usageCount: 1580,
    acceptanceRate: 95.1,
    userSatisfaction: 4.8
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6">

      {/* -------------------------------------------------------------
          TAB 1: AI OVERVIEW & TEAM DIRECTORY
         ------------------------------------------------------------- */}
      {activeTab === "ai-overview" && (
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Dashboard Metrics banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest block">System Integrity</span>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-display font-bold text-neutral-900">{activeMetrics.accuracy}%</span>
                <span className="text-xs text-green-700 font-sans font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">SLA Met</span>
              </div>
              <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
                <div className="bg-green-600 h-full" style={{ width: `${activeMetrics.accuracy}%` }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest block">Average Latency</span>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-display font-bold text-neutral-900">{activeMetrics.latency}ms</span>
                <span className="text-xs text-neutral-500 font-sans font-medium">99th percentile</span>
              </div>
              <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
                <div className="bg-black h-full" style={{ width: "40%" }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest block">Operational Cost</span>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-display font-bold text-neutral-900">${activeMetrics.cost}</span>
                <span className="text-xs text-neutral-400 font-sans">USD This Cycle</span>
              </div>
              <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full" style={{ width: "25%" }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-2">
              <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest block">Core Model Node</span>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-display font-bold text-neutral-900">Gemini 3.5</span>
                <span className="text-xs text-green-700 font-sans font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                  Active
                </span>
              </div>
              <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
                <div className="bg-neutral-800 h-full w-full" />
              </div>
            </div>
          </div>

          {/* MAIN GRID split: Agents directory on left, active task runner sandbox on right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: 14 Agent Roster Directory */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Enterprise Team</span>
                  <h2 className="font-display font-bold text-2xl text-neutral-900 tracking-tight flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-black" />
                    AI Workforce Directory
                  </h2>
                </div>
                <span className="text-xs font-mono bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-1 rounded-lg">
                  {agents.length} Agent Profiles
                </span>
              </div>

              {/* Grid Layout of the 14 agents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <div 
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgentForTask(agent);
                      setCustomTaskInput(`Execute evaluation routine using your designated core responsibilities: ${agent.role}`);
                    }}
                    className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-left space-y-4 ${
                      selectedAgentForTask?.id === agent.id ? "border-black ring-2 ring-black/5" : "border-neutral-200"
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <img 
                        src={agent.avatar} 
                        alt={agent.name} 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-100" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-display font-bold text-sm text-neutral-900 truncate">{agent.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider font-mono ${
                            agent.status === AgentStatus.WORKING 
                              ? "bg-amber-50 text-amber-700 border border-amber-100" 
                              : "bg-green-50 text-green-700 border border-green-100"
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono font-medium tracking-wide uppercase mt-0.5">{agent.role}</p>
                      </div>
                    </div>

                    <p className="font-sans text-xs text-neutral-600 font-light leading-relaxed line-clamp-2">
                      {agent.goal}
                    </p>

                    <div className="flex justify-between text-[10px] font-mono border-t border-neutral-100 pt-3 text-neutral-500">
                      <span>Efficiency: <strong className="text-neutral-900">{agent.efficiency}%</strong></span>
                      <span>Tasks: <strong className="text-neutral-900">{agent.completedTasks}</strong></span>
                      <span>Accuracy: <strong className="text-neutral-900">{agent.accuracyRate}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Interactive Agent task dispatch sandbox */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-5 sticky top-24">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">Execution Sandbox</span>
                  <h3 className="font-display font-bold text-lg text-neutral-900">Task Control Sandbox</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Select any profile from the directory on the left to dispatch direct instruction queries into the sandbox compiler.
                  </p>
                </div>

                {selectedAgentForTask ? (
                  <div className="space-y-4">
                    {/* Selected Agent card mini-view */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-3">
                      <img 
                        src={selectedAgentForTask.avatar} 
                        alt={selectedAgentForTask.name} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-neutral-200" 
                      />
                      <div>
                        <div className="text-xs font-bold text-neutral-900">{selectedAgentForTask.name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-wide">{selectedAgentForTask.role}</div>
                      </div>
                    </div>

                    {/* Task details text box */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Workspace Input Instruction</label>
                      <textarea
                        value={customTaskInput}
                        onChange={(e) => setCustomTaskInput(e.target.value)}
                        rows={4}
                        placeholder="State your clear query, directive or input code to process..."
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 font-sans text-xs focus:outline-hidden leading-relaxed resize-none text-neutral-700"
                      />
                    </div>

                    {/* Dispatch button */}
                    <button
                      onClick={handleDispatchTask}
                      disabled={isRunningTask}
                      className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-sans font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-neutral-800"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isRunningTask ? "Running Inference..." : "Dispatch Instruction"}</span>
                    </button>

                    {/* Sandbox Task Logs and Result View */}
                    {isRunningTask && (
                      <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 animate-pulse">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>SANDBOX VERIFICATION ACTIVE</span>
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 space-y-1 leading-snug">
                          <p>&gt; Initializing task payload...</p>
                          <p>&gt; Requesting model routing parameters...</p>
                          <p>&gt; Loading memory state arrays...</p>
                        </div>
                      </div>
                    )}

                    {taskResult && (
                      <div className="space-y-3 pt-2">
                        <div className="border-t border-neutral-100 pt-3">
                          <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest block mb-1">Sandbox Return Output</span>
                          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-300 space-y-2 leading-relaxed overflow-x-auto max-h-60 overflow-y-auto">
                            <p className="text-green-500 font-bold">&gt; Execution complete!</p>
                            <p className="font-sans text-xs font-light text-neutral-300">{taskResult.result}</p>
                            {taskResult.logs && (
                              <div className="border-t border-neutral-800 pt-2 space-y-0.5 text-neutral-500 text-[10px]">
                                {taskResult.logs.map((l: string, i: number) => (
                                  <p key={i}>&gt; {l}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-neutral-200 rounded-xl text-center text-xs text-neutral-400 font-sans space-y-2">
                    <Cpu className="w-8 h-8 text-neutral-300 mx-auto" />
                    <p>Select any AI Employee profile in the directory to begin running operations.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verification / Testing Panel */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm max-w-7xl mx-auto space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Evaluation Pipeline</span>
                <h3 className="font-display font-bold text-xl text-neutral-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-neutral-900" />
                  AI System Verification Panel
                </h3>
                <p className="font-sans text-xs text-neutral-400 mt-1">
                  Run standard system-wide integrity checks mapping the memory version controllers, token cost metrics, and injection protection limits.
                </p>
              </div>

              <button
                onClick={handleRunVerificationSuite}
                disabled={isRunningSuiteTests}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer flex items-center gap-2 transition-colors disabled:bg-neutral-700"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isRunningSuiteTests ? "Processing Audit..." : "Run Global Tests"}</span>
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="border border-neutral-100 rounded-xl overflow-hidden divide-y divide-neutral-100">
                {testResults.map((t, idx) => (
                  <div key={idx} className="p-4 flex items-start gap-3 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                    <CheckCircle className="w-4.5 h-4.5 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-semibold text-neutral-900">{t.name}</h4>
                        <span className="text-[10px] font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase">
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5 leading-relaxed">{t.notes}</p>
                      <div className="text-[9px] text-neutral-400 font-mono mt-1">SLA Latency: {t.latency}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: PROMPT DESIGN & SECURITY
         ------------------------------------------------------------- */}
      {activeTab === "ai-config" && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Prompt Studio, Active Config */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Dynamic Prompt editor */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-5">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">Template Studio</span>
                  <h3 className="font-display font-bold text-xl text-neutral-900">Enterprise Prompt Configuration</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-1">
                    Directly modify systemic instructions and roletemplates governing candidate review and learning coaching.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Target Role Template</label>
                    <select
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 focus:outline-hidden"
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = prompts.find(p => p.role === val);
                        if (match) setEditingPrompt(match);
                        else {
                          setEditingPrompt({
                            role: val,
                            systemPrompt: `You are the lead ${val} on KONEXA. Assist users with professional guidance.`,
                            userTemplate: "Review details: {{input}}",
                            version: 1,
                            variables: ["input"],
                            localization: "en"
                          });
                        }
                      }}
                    >
                      <option value="">-- Choose Role --</option>
                      <option value="AI Recruiter">AI Recruiter (Cerebro)</option>
                      <option value="AI Project Manager">AI Project Manager (Scribe)</option>
                      <option value="AI Growth Coach">AI Growth Coach (Athena)</option>
                      <option value="AI Resume Reviewer">AI Resume Reviewer (Clarion)</option>
                      <option value="AI Portfolio Reviewer">AI Portfolio Reviewer (Vinci)</option>
                      <option value="AI Interview Coach">AI Interview Coach (Socrates)</option>
                    </select>
                  </div>

                  {editingPrompt && (
                    <div className="space-y-4 pt-2 border-t border-neutral-100">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700">System Prompt</label>
                        <textarea
                          value={editingPrompt.systemPrompt}
                          onChange={(e) => setEditingPrompt({...editingPrompt, systemPrompt: e.target.value})}
                          rows={6}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 font-mono text-xs focus:outline-hidden text-neutral-700 leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700">User Context Template</label>
                        <input
                          type="text"
                          value={editingPrompt.userTemplate}
                          onChange={(e) => setEditingPrompt({...editingPrompt, userTemplate: e.target.value})}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-700 focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-700">Locale Optimization</label>
                          <select
                            value={editingPrompt.localization}
                            onChange={(e) => setEditingPrompt({...editingPrompt, localization: e.target.value})}
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 focus:outline-hidden"
                          >
                            <option value="en">English (US Standard)</option>
                            <option value="ko">Korean (Seoul Native)</option>
                            <option value="en-ko">Bilingual (English / Korean Mixed)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-700">A/B Testing Segment</label>
                          <select
                            value={editingPrompt.abTestSegment || ""}
                            onChange={(e) => setEditingPrompt({...editingPrompt, abTestSegment: e.target.value as any})}
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-700 focus:outline-hidden"
                          >
                            <option value="">Disabled</option>
                            <option value="A">Segment A (Control)</option>
                            <option value="B">Segment B (Challenger)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (editingPrompt) {
                            await savePromptVersion({
                              ...editingPrompt,
                              version: (editingPrompt.version || 1) + 1
                            });
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-sans text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Save & Commit New Version
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Prompt Vault */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-lg text-neutral-900">Prompt Registry Vault</h3>
                
                <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
                  {prompts.map((p) => (
                    <div key={p.id} className="p-4 flex justify-between items-center bg-neutral-50/30 hover:bg-neutral-50/80 transition-colors text-xs font-sans">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-neutral-900">{p.role}</strong>
                          <span className="text-[10px] font-mono text-neutral-400">v{p.version}</span>
                          {p.active && (
                            <span className="text-[9px] font-mono font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100 uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 font-mono mt-1 font-light truncate max-w-md">{p.systemPrompt}</p>
                      </div>

                      <button
                        onClick={() => rollbackPrompt(p.id)}
                        className="px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[11px] font-semibold text-neutral-900 transition-colors cursor-pointer"
                      >
                        Rollback
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: LLM Models and Security Sandbox */}
            <div className="space-y-6">
              
              {/* Active Model Routing Configuration */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">Dual-Model Routing</span>
                  <h3 className="font-display font-bold text-base text-neutral-900">Automatic Router Registry</h3>
                </div>

                <div className="space-y-3">
                  {models.map((m) => (
                    <div key={m.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-neutral-900">{m.modelName}</span>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">Provider: {m.provider}</span>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${m.active ? "bg-green-500 animate-pulse" : "bg-neutral-300"}`} />
                      </div>
                      <div className="flex justify-between font-mono text-[10px] text-neutral-500 pt-1.5 border-t border-neutral-200/50">
                        <span>Latency: <strong className="text-neutral-700">{m.latencyRating}</strong></span>
                        <span>Cost: <strong className="text-neutral-700">${m.costPerMillion}/M</strong></span>
                        <span>Accuracy: <strong className="text-neutral-700">{m.accuracyScore}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Audit Sandbox */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-0.5">Firewall Guard</span>
                  <h3 className="font-display font-bold text-base text-neutral-900">Prompt Injection Sandbox</h3>
                  <p className="font-sans text-[11px] text-neutral-400 mt-1 leading-relaxed">
                    Test text, prompts or markdown snippets against potential Cross-Site Scripting (XSS), leaks or instruction override patterns.
                  </p>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={securityInput}
                    onChange={(e) => setSecurityInput(e.target.value)}
                    placeholder="Enter any text string to inspect (e.g., 'ignore previous instructions'...) "
                    rows={4}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-mono focus:outline-hidden text-neutral-700 leading-relaxed"
                  />

                  <button
                    onClick={handleSecurityScan}
                    disabled={isAuditingSecurity}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-sans font-semibold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{isAuditingSecurity ? "Auditing Payload..." : "Test Security Threat"}</span>
                  </button>

                  {securityResult && (
                    <div className={`p-4 rounded-xl border text-xs font-sans space-y-2 ${
                      securityResult.safe 
                        ? "bg-green-50 border-green-100 text-green-900" 
                        : "bg-red-50 border-red-100 text-red-900"
                    }`}>
                      <div className="flex items-center gap-2 font-bold">
                        {securityResult.safe ? (
                          <CheckCircle className="w-4 h-4 text-green-700" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-700" />
                        )}
                        <span>{securityResult.safe ? "Security Clear" : "Security Threat Blocked!"}</span>
                      </div>
                      
                      {!securityResult.safe && securityResult.issues.length > 0 && (
                        <ul className="list-disc pl-4 space-y-1 text-[11px] font-light">
                          {securityResult.issues.map((iss, i) => (
                            <li key={i}>{iss}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 3: MEMORY VAULT, AUDITS, REPORTS
         ------------------------------------------------------------- */}
      {activeTab === "ai-logs" && (
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle: Memories and Reports */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Dynamic Memory Viewer */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">Durable Core Vault</span>
                    <h3 className="font-display font-bold text-xl text-neutral-900 flex items-center gap-2">
                      <Database className="w-5 h-5 text-black" />
                      Central Memory Vault
                    </h3>
                  </div>

                  {/* Filter Selects */}
                  <div className="flex gap-2">
                    <select
                      value={memoryTypeFilter}
                      onChange={(e) => setMemoryTypeFilter(e.target.value)}
                      className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-600 focus:outline-hidden"
                    >
                      <option value="all">All Types</option>
                      <option value={MemoryType.SHORT_TERM}>Short-term</option>
                      <option value={MemoryType.LONG_TERM}>Long-term</option>
                      <option value={MemoryType.DECISION}>Decision</option>
                      <option value={MemoryType.TRUST}>Trust</option>
                      <option value={MemoryType.PERFORMANCE}>Performance</option>
                    </select>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search keys..."
                        value={memorySearch}
                        onChange={(e) => setMemorySearch(e.target.value)}
                        className="bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-1 text-xs text-neutral-600 focus:outline-hidden w-40"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredMemories.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                      No matching memorized parameters mapped. Assign work sandbox tasks to generate dynamic long-term thoughts.
                    </div>
                  ) : (
                    filteredMemories.map((m) => (
                      <div key={m.id} className="p-4 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-100 rounded-xl space-y-2 transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 font-mono">{m.key}</span>
                            <span className="text-[9px] font-semibold bg-neutral-200/80 text-neutral-600 px-2 py-0.5 rounded font-mono uppercase">
                              {m.type}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                            {m.sensitive && (
                              <Lock className="w-3 h-3 text-amber-600" title="Sensitive / Encrypted" />
                            )}
                            {m.compressed && (
                              <Layers className="w-3 h-3 text-blue-600" title="Semantic Compressed" />
                            )}
                            <span>v{m.version}</span>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-600 font-sans font-light leading-relaxed">
                          {m.value}
                        </p>

                        <div className="text-[9px] font-mono text-neutral-400 flex justify-between pt-1 border-t border-neutral-200/30">
                          <span>Recorded: {new Date(m.createdAt).toLocaleDateString()}</span>
                          {m.expiredAt && (
                            <span>Expires: {new Date(m.expiredAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dynamic Reports Hub */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-5">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">Automated Analysis</span>
                  <h3 className="font-display font-bold text-xl text-neutral-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-black" />
                    AI Diagnostic Reports Hub
                  </h3>
                  <p className="font-sans text-xs text-neutral-400 mt-1">
                    Trigger real-time compilation of enterprise Weekly digests, Student learning profiles, or compiler trust assessments using our Gemini engine.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-600 focus:outline-hidden flex-1"
                  >
                    <option value="weekly">Weekly Operational Status Report</option>
                    <option value="monthly">Monthly Enterprise Pipeline Summary</option>
                    <option value="trust">System-wide Compiler Trust Assessment</option>
                    <option value="performance">Candidate Code Contribution Review</option>
                  </select>

                  <button
                    onClick={handleCompileReport}
                    disabled={isGeneratingReport}
                    className="px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-sans text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2 justify-center"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingReport ? "animate-spin" : ""}`} />
                    <span>{isGeneratingReport ? "Generating Report..." : "Compile Report"}</span>
                  </button>
                </div>

                {activeReportOutput && (
                  <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                      <h4 className="font-display font-bold text-sm text-neutral-900">{activeReportOutput.title}</h4>
                      <span className="text-[9px] font-mono bg-neutral-900 text-white px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                        {activeReportOutput.type}
                      </span>
                    </div>

                    <div className="prose prose-sm text-xs text-neutral-700 leading-relaxed font-sans font-light space-y-3 max-h-96 overflow-y-auto">
                      <p className="whitespace-pre-wrap">{activeReportOutput.content}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Inference Trace and developer Manual */}
            <div className="space-y-6">
              
              {/* Developer Reference manual guide */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-0.5">Staff Reference</span>
                  <h3 className="font-display font-bold text-base text-neutral-900">Developer Architecture Guide</h3>
                </div>

                {/* Sub tab selectors */}
                <div className="grid grid-cols-5 gap-1 text-[10px] font-mono border-b border-neutral-100 pb-2">
                  <button onClick={() => setDevManualTab("arch")} className={`pb-1 text-center font-bold ${devManualTab === "arch" ? "border-b-2 border-black text-black" : "text-neutral-400"}`}>Arch</button>
                  <button onClick={() => setDevManualTab("memory")} className={`pb-1 text-center font-bold ${devManualTab === "memory" ? "border-b-2 border-black text-black" : "text-neutral-400"}`}>Mem</button>
                  <button onClick={() => setDevManualTab("prompts")} className={`pb-1 text-center font-bold ${devManualTab === "prompts" ? "border-b-2 border-black text-black" : "text-neutral-400"}`}>Prompt</button>
                  <button onClick={() => setDevManualTab("routing")} className={`pb-1 text-center font-bold ${devManualTab === "routing" ? "border-b-2 border-black text-black" : "text-neutral-400"}`}>Route</button>
                  <button onClick={() => setDevManualTab("api")} className={`pb-1 text-center font-bold ${devManualTab === "api" ? "border-b-2 border-black text-black" : "text-neutral-400"}`}>API</button>
                </div>

                <div className="text-[11px] text-neutral-500 leading-relaxed font-sans font-light min-h-[140px]">
                  {devManualTab === "arch" && (
                    <div className="space-y-2">
                      <p className="font-bold text-neutral-900">Multi-Agent Orchestrator Model</p>
                      <p>The platform executes a hierarchical worker routing model. Aegis (Orchestrator) intercepts inputs, assesses memory arrays, and spawns targeted sub-agent pipelines.</p>
                      <p className="text-[10px] font-mono bg-neutral-50 p-1 rounded">Pattern: hierarchical routing & feedback loops.</p>
                    </div>
                  )}
                  {devManualTab === "memory" && (
                    <div className="space-y-2">
                      <p className="font-bold text-neutral-900">Dual-state memory layer</p>
                      <p>1. Short-term caching buffers logs during active interviews.</p>
                      <p>2. Long-term memory captures structural candidate profile metrics, compiled using semantic summarization to bypass token limits.</p>
                    </div>
                  )}
                  {devManualTab === "prompts" && (
                    <div className="space-y-2">
                      <p className="font-bold text-neutral-900">Prompt management registry</p>
                      <p>Role templates and system instructions are fully versioned in Firestore. Direct schema mapping prevents unauthorized instruction overrides.</p>
                    </div>
                  )}
                  {devManualTab === "routing" && (
                    <div className="space-y-2">
                      <p className="font-bold text-neutral-900">Optimized cost-router</p>
                      <p>Default inference runs on gemini-3.5-flash to hit cost/SLA guidelines. Promoted complex evaluations failover to gemini-3.1-pro-preview.</p>
                    </div>
                  )}
                  {devManualTab === "api" && (
                    <div className="space-y-2">
                      <p className="font-bold text-neutral-900">Backend API Endpoints</p>
                      <ul className="list-disc pl-4 space-y-1 font-mono text-[10px]">
                        <li>POST /api/ai/orchestrator</li>
                        <li>POST /api/ai/reports</li>
                        <li>GET /api/ai/matching</li>
                        <li>POST /api/ai/security</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Inference audit stream */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
                <h3 className="font-display font-bold text-base text-neutral-900">Real-time Auditing Stream</h3>
                <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="pt-2 flex items-start gap-2.5 text-[11px] font-sans">
                      <span className="font-mono text-neutral-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-neutral-800">{log.action}</div>
                        <p className="text-neutral-500 font-light text-[10px] mt-0.5 leading-snug">{log.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
