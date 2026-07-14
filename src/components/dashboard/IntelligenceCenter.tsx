import React, { useState, useEffect } from "react";
import { 
  Brain, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Award, 
  ShieldAlert, 
  ThumbsUp, 
  CheckCircle, 
  Sliders, 
  RefreshCw, 
  Search, 
  FileCode2, 
  HelpCircle, 
  Code,
  MapPin,
  Clock,
  ExternalLink,
  Lock,
  History,
  TrendingDown,
  Info
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  BarChart,
  Bar,
  CartesianGrid,
  Legend
} from "recharts";
import { useToast } from "../ui/Toast";
import { motion, AnimatePresence } from "motion/react";
import { eventSystem } from "../../lib/eventSystem";

// ==========================================
// COMPONENT MAIN ENTRY POINT
// ==========================================
export default function IntelligenceCenter() {
  const { success, error, info } = useToast();
  
  // Subscribe to real-time event system to auto-recalculate
  useEffect(() => {
    const unsubscribes = [
      eventSystem.subscribe("ProjectCompleted", () => handleRecalculate()),
      eventSystem.subscribe("TaskCompleted", () => handleRecalculate()),
      eventSystem.subscribe("ReviewSubmitted", () => handleRecalculate()),
      eventSystem.subscribe("ProfileUpdated", () => handleRecalculate()),
      eventSystem.subscribe("ResumeUpdated", () => handleRecalculate()),
      eventSystem.subscribe("PortfolioUpdated", () => handleRecalculate()),
      eventSystem.subscribe("CertificateVerified", () => handleRecalculate()),
      eventSystem.subscribe("WarningCreated", () => handleRecalculate()),
      eventSystem.subscribe("TrustUpdated", () => handleRecalculate()),
      eventSystem.subscribe("PerformanceUpdated", () => handleRecalculate()),
      eventSystem.subscribe("ApplicationSubmitted", () => handleRecalculate())
    ];

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);
  
  // Dashboard active sub-sections
  const [activeTab, setActiveTab] = useState<
    "scoring" | "trust" | "performance" | "matching" | "recommendations" | "predictions" | "badges" | "warnings" | "approvals" | "analytics"
  >("scoring");

  // General state
  const [overview, setOverview] = useState<any>(null);
  const [trustProfile, setTrustProfile] = useState<any>(null);
  const [performanceProfile, setPerformanceProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Recalculation Trigger (emulates events or forced calculations)
  const [recalculateToken, setRecalculateToken] = useState(0);

  // 1. Fetch initial platform intelligence datasets
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [
          overviewRes,
          trustRes,
          perfRes,
          recsRes,
          predsRes,
          badgesRes,
          warningsRes,
          approvalsRes
        ] = await Promise.all([
          fetch("/api/intelligence/overview").then(res => res.json()),
          fetch("/api/intelligence/trust/usr_fndtn_konexa_99").then(res => res.json()),
          fetch("/api/intelligence/performance/usr_fndtn_konexa_99").then(res => res.json()),
          fetch("/api/intelligence/recommendations/usr_fndtn_konexa_99").then(res => res.json()),
          fetch("/api/intelligence/predictions/usr_fndtn_konexa_99").then(res => res.json()),
          fetch("/api/intelligence/badges/usr_fndtn_konexa_99").then(res => res.json()),
          fetch("/api/intelligence/warnings/usr_fndtn_konexa_99").then(res => res.json()),
          fetch("/api/intelligence/approvals").then(res => res.json())
        ]);

        if (overviewRes) setOverview(overviewRes);
        if (trustRes) setTrustProfile(trustRes);
        if (perfRes) setPerformanceProfile(perfRes);
        if (recsRes) setRecommendations(recsRes);
        if (predsRes) setPredictions(predsRes);
        if (badgesRes) setBadges(badgesRes);
        if (warningsRes) setWarnings(warningsRes);
        if (approvalsRes) setApprovals(approvalsRes);

      } catch (err: any) {
        console.error("Failed to load core intelligence data", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [recalculateToken]);

  // Recalculate platform data
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const res = await fetch("/api/intelligence/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "usr_fndtn_konexa_99" })
      });
      const data = await res.json();
      if (data.success) {
        success("Recalculation Complete", "Scoring indices, dynamic decays, and risk profiles recalculated.");
        setRecalculateToken(prev => prev + 1);
      }
    } catch (err: any) {
      error("Fault Intercepted", " Recalculation pipeline returned an active connection anomaly.");
    } finally {
      setIsRecalculating(false);
    }
  };

  // Add custom manual event / evidence marker
  const handleSimulateEvent = async (category: string, bonus: number, desc: string) => {
    try {
      const res = await fetch("/api/intelligence/evidence/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "usr_fndtn_konexa_99",
          category,
          description: desc,
          scoreBonus: bonus,
          sourceId: "manual_trigger"
        })
      });
      const data = await res.json();
      if (data.success) {
        success("Evidence Registered", `Successfully added "${desc}" immutable record to the Trust Ledger.`);
        setRecalculateToken(prev => prev + 1);
      }
    } catch (err: any) {
      error("Write Restitution Failed", "Could not commit evidence node to Supabase.");
    }
  };

  if (isLoading) {
    return (
      <div id="intel-loading" className="flex-1 flex flex-col items-center justify-center bg-neutral-50 h-[80vh] space-y-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Hydrating Core Intelligence Engines...</p>
      </div>
    );
  }

  return (
    <div id="intelligence-platform-container" className="flex-1 flex flex-col bg-neutral-50 overflow-y-auto">
      {/* 1. Header Hero Panel */}
      <div className="border-b border-neutral-200 bg-white px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-black text-white rounded uppercase tracking-widest">Phase 8</span>
              <span className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-neutral-500" /> Core Intelligence Platform
              </span>
            </div>
            <h1 className="text-2xl font-sans font-medium tracking-tight text-neutral-900">
              KONEXA Cognitive Systems
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl">
              High-integrity scoring matrix mapping Trust, Code Performance, Semantic Match Risk, Gamification Credentials, and Predictive Employment trends. Every rating is fully dynamic, decayeable, and explainable.
            </p>
          </div>

          {/* Core Recalculate Trigger & Sync Status */}
          <div className="flex items-center gap-3">
            <button 
              id="recalculate-trigger"
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white disabled:opacity-50 text-xs font-sans font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? "animate-spin" : ""}`} />
              {isRecalculating ? "Recalculating..." : "Recalculate Engines"}
            </button>
          </div>
        </div>

        {/* 2. Platform Highlights bar */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-neutral-100">
          <div className="space-y-1">
            <div className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Trust Index</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-neutral-900">{trustProfile?.currentScore || 82}</span>
              <span className="text-xs text-neutral-400">/100</span>
              <span className="text-[9px] font-mono text-green-700 ml-1 font-bold">+12% MoM</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Performance Score</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-neutral-900">{performanceProfile?.currentScore || 88}</span>
              <span className="text-xs text-neutral-400">/100</span>
              <span className="text-[9px] font-mono text-green-700 ml-1 font-bold">Stable</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Match Reliability</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-neutral-900">{overview?.platformAverages?.matchingScore || 91}%</span>
              <span className="text-xs text-neutral-400">Avg</span>
              <span className="text-[9px] font-mono text-neutral-400 ml-1">94% Confidence</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">Prediction Index</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-neutral-900">{predictions?.employmentProbability || 94}%</span>
              <span className="text-xs text-neutral-400">Job Chance</span>
              <span className="text-[9px] font-mono text-green-700 ml-1 font-bold">Excellent</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sub-tab Navigation */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10 px-8">
        <div className="max-w-7xl mx-auto flex items-center overflow-x-auto whitespace-nowrap scrollbar-none gap-2 py-3">
          {[
            { id: "scoring", label: "Central Scoring", icon: Sliders },
            { id: "trust", label: "Trust Center", icon: ShieldCheck },
            { id: "performance", label: "Performance Profile", icon: Activity },
            { id: "matching", label: "AI Matcher", icon: Brain },
            { id: "recommendations", label: "Recommendations", icon: Award },
            { id: "predictions", label: "Predictions & Risks", icon: TrendingUp },
            { id: "badges", label: "Gamified Badges", icon: Award },
            { id: "warnings", label: "Warning Console", icon: ShieldAlert },
            { id: "approvals", label: "Approval Workflows", icon: ThumbsUp },
            { id: "analytics", label: "Talent Analytics", icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-black text-white" 
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Sub-Engine view blocks */}
      <div className="p-8 max-w-7xl mx-auto w-full flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* ========================================================
                1. GLOBAL SCORING PANEL & SIMULATOR
                ======================================================== */}
            {activeTab === "scoring" && (
              <div id="scoring-subengine" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left block (8/12): Simulator & Versions */}
                  <div className="lg:col-span-8 space-y-6">
                    <ScoringWeightsSimulator onRecalculate={handleRecalculate} />
                    
                    {/* Active Rules Engine Overview */}
                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4">ACTIVE COGNITIVE RULES REGISTRY</h3>
                      <div className="space-y-3">
                        <div className="p-3 rounded bg-neutral-50 border border-neutral-100 flex items-start gap-2 text-xs font-mono text-neutral-600">
                          <span className="text-black font-bold">[RULE-01]</span>
                          <span>Baseline initialization score scales from 70/100 to support safe entry onboarding.</span>
                        </div>
                        <div className="p-3 rounded bg-neutral-50 border border-neutral-100 flex items-start gap-2 text-xs font-mono text-neutral-600">
                          <span className="text-black font-bold">[RULE-02]</span>
                          <span>Verification assertions (Passports, Transcripts) commit immediate +10 flat multiplier bonuses.</span>
                        </div>
                        <div className="p-3 rounded bg-neutral-50 border border-neutral-100 flex items-start gap-2 text-xs font-mono text-neutral-600">
                          <span className="text-black font-bold">[RULE-03]</span>
                          <span>Milestones submitted post-deadline decrease reliability index by dynamic decay multipliers.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right block (4/12): Audit logs & config */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                        <span>IMMUTABLE ENGINE VERSIONS</span>
                        <Lock className="w-3.5 h-3.5 text-neutral-400" />
                      </h3>
                      <div className="space-y-4">
                        {overview?.scoreVersions?.map((v: any) => (
                          <div key={v.id} className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-neutral-900">{v.engineName}</span>
                              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-neutral-200 text-neutral-800 rounded">{v.version}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 font-sans leading-relaxed">
                              Weights: {Object.entries(v.weights || {}).map(([k, val]) => `${k}: ${val}`).join(", ")}
                            </div>
                            <div className="text-[9px] text-neutral-400 font-mono">Updated: {new Date(v.updatedAt).toLocaleDateString()} by {v.updatedBy}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-neutral-500" /> CALCULATION AUDIT JOURNAL
                      </h3>
                      <div className="space-y-3 max-h-72 overflow-y-auto">
                        {overview?.recentAudits?.length > 0 ? (
                          overview.recentAudits.map((aud: any) => (
                            <div key={aud.id} className="text-xs space-y-1 pb-3 border-b border-neutral-100 last:border-b-0">
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-bold text-neutral-800">{aud.engineName}</span>
                                <span className="text-[10px] text-neutral-400">{new Date(aud.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-neutral-500 font-sans leading-normal">{aud.reason}</p>
                              <div className="flex items-center gap-1 font-mono text-[9px] text-neutral-400">
                                <span>Score shift: {aud.previousScore} ➔ {aud.newScore}</span>
                                <span className="text-black font-bold">({aud.newScore - aud.previousScore >= 0 ? "+" : ""}{aud.newScore - aud.previousScore})</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-neutral-400 text-center py-4 font-sans">No audit records recorded. Trigger a recalculation to commit records.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                2. TRUST ENGINE / TRUST CENTER
                ======================================================== */}
            {activeTab === "trust" && (
              <div id="trust-subengine" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Box (7/12): Score profile & timeline */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Score Gauge & AI Explanation */}
                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4">DYNAMIC TRUST INTERFACE</h3>
                      
                      <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                        {/* Circular progress bar emulator */}
                        <div className="relative w-36 h-36 flex items-center justify-center bg-neutral-50 border border-neutral-200 rounded-full shrink-0">
                          <div className="text-center">
                            <span className="text-4xl font-mono font-bold text-neutral-900">{trustProfile?.currentScore || 82}</span>
                            <span className="text-xs text-neutral-400 block mt-1 font-mono">Confidence {trustProfile?.confidence || 90}%</span>
                          </div>
                        </div>

                        <div className="space-y-3 flex-1">
                          <h4 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                            <Brain className="w-3.5 h-3.5 text-neutral-500" /> AI CLASSIFICATION THESIS
                          </h4>
                          <p className="text-xs text-neutral-600 font-sans leading-relaxed italic bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                            "{trustProfile?.aiExplanation || "Alex Rivera possesses deep integrity markers. Verification files have passed cryptographic audits and milestone completions reside early on the calendar bounds."}"
                          </p>
                          <div className="text-[10px] text-neutral-400 font-mono">Calculated using 100% platform activity. Manual overrides are strictly unauthorized.</div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline of Cryptographic Evidence */}
                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest">CRYPTOGRAPHIC EVIDENCE REGISTER</h3>
                        <span className="text-[10px] font-mono text-neutral-400">Total verified: {trustProfile?.evidenceTimeline?.length || 0}</span>
                      </div>
                      
                      {/* Interactive Events Simulator directly on page */}
                      <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">Events simulator</span>
                          <span className="text-xs font-sans text-neutral-700">Manually trigger platform activity to test live recalculation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSimulateEvent("Deadline Compliance", 4, "Submitted project checkpoint 12 hours early")}
                            className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded text-[10px] font-sans hover:bg-neutral-50 cursor-pointer"
                          >
                            + Submit Early
                          </button>
                          <button 
                            onClick={() => handleSimulateEvent("Attendance", 3, "Logged sprint alignment attendance record")}
                            className="px-2.5 py-1.5 bg-white border border-neutral-200 rounded text-[10px] font-sans hover:bg-neutral-50 cursor-pointer"
                          >
                            + Attend Sprint
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {trustProfile?.evidenceTimeline?.map((ev: any) => (
                          <div key={ev.id} className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-neutral-300 transition-colors space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-neutral-900">{ev.category}</span>
                              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-green-100 text-green-800 rounded-full">+{ev.scoreBonus} Trust</span>
                            </div>
                            <p className="text-xs text-neutral-600 font-sans">{ev.description}</p>
                            <div className="flex items-center justify-between pt-1 font-mono text-[9px] text-neutral-400">
                              <span>Hash: {ev.hash}</span>
                              <span>{new Date(ev.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Box (5/12): Trend curves & suggestions */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Visual 4-Week Forecast Projection Chart */}
                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4">4-WEEK COGNITIVE TRUST FORECAST</h3>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trustProfile?.trustForecast || []} margin={{ left: -20, top: 10, bottom: 0, right: 10 }}>
                            <defs>
                              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={9} fontStyle="italic" />
                            <YAxis stroke="#9ca3af" fontSize={9} domain={[60, 100]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="score" stroke="#000000" strokeWidth={1.5} fillOpacity={1} fill="url(#forecastGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-sans leading-relaxed mt-2 italic text-center">
                        Forecast projects a rise to 93 based on consistent early daily completions.
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-4">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest">TRUST INFLUENCE MATRIX</h3>
                      
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono font-bold text-green-700 block uppercase">POSSIBLE BOOST MARKERS</span>
                        {trustProfile?.positiveFactors?.map((f: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs font-sans text-neutral-600">
                            <span className="text-green-600 font-bold">✔</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] font-mono font-bold text-red-700 block uppercase">ACTIVE REDUCTION RISKS</span>
                        {trustProfile?.negativeFactors?.map((f: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs font-sans text-neutral-600">
                            <span className="text-red-500 font-bold">✖</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-neutral-100 space-y-2">
                        <span className="text-[10px] font-mono font-bold text-neutral-400 block uppercase">SUGGESTIONS FOR OPTIMIZATION</span>
                        {trustProfile?.improvementSuggestions?.map((s: string, i: number) => (
                          <div key={i} className="p-2 bg-neutral-50 rounded text-xs text-neutral-600 font-sans border-l-2 border-black">
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                3. PERFORMANCE ENGINE / PROFILE
                ======================================================== */}
            {activeTab === "performance" && (
              <div id="performance-subengine" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column (5/12): Radar stats & Breakdown */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4">PERFORMANCE PROFILE SPECTRUM</h3>
                      <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                            Object.entries(performanceProfile?.breakdown || {}).map(([subject, score]) => ({
                              subject,
                              A: score,
                              fullMark: 100
                            }))
                          }>
                            <PolarGrid stroke="#e5e5e5" />
                            <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={10} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9ca3af" fontSize={8} />
                            <Radar name="Alex Rivera" dataKey="A" stroke="#000000" fill="#000000" fillOpacity={0.06} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4">DETAILED METRIC METADATA</h3>
                      <div className="space-y-4">
                        {Object.entries(performanceProfile?.breakdown || {}).map(([key, val]: any) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-neutral-700">{key}</span>
                              <span className="font-mono font-bold text-neutral-950">{val}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-black" style={{ width: `${val}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (7/12): Strengths, Weaknesses, Skill Masteries */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4">COGNITIVE STRENGTH SUMMARY</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50/50 border border-green-200/50 rounded-xl space-y-2">
                          <div className="text-[10px] font-mono font-bold text-green-700 uppercase">IDENTIFIED STRENGTHS</div>
                          <ul className="space-y-2 text-xs text-neutral-600 font-sans list-disc list-inside">
                            {performanceProfile?.strengths?.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 bg-red-50/50 border border-red-200/50 rounded-xl space-y-2">
                          <div className="text-[10px] font-mono font-bold text-red-700 uppercase">GROWTH GAP MARKERS</div>
                          <ul className="space-y-2 text-xs text-neutral-600 font-sans list-disc list-inside">
                            {performanceProfile?.weaknesses?.map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4">PREDICTED SKILL GROWTH VELOCITY</h3>
                      <div className="space-y-4">
                        {predictions?.skillGrowthPrediction?.map((sg: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-neutral-900">{sg.skill}</span>
                              <span className="text-[10px] text-neutral-400 block font-sans">Predicted mastery timeline</span>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 bg-black text-white rounded text-[10px] font-mono font-bold">{sg.monthsToMastery} Months</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                4. AI MATCHING ENGINE
                ======================================================== */}
            {activeTab === "matching" && (
              <div id="matching-subengine" className="space-y-6">
                <AiMatcherWorkspace />
              </div>
            )}

            {/* ========================================================
                5. RECOMMENDATION ENGINE
                ======================================================== */}
            {activeTab === "recommendations" && (
              <div id="recommendations-subengine" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-xl border border-neutral-200 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-100 border border-neutral-200 text-neutral-800 rounded uppercase tracking-wider">{item.type}</span>
                          <span className="text-xs font-mono font-bold text-neutral-900">{item.confidence}% Fit</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-neutral-900">{item.title}</h4>
                          <p className="text-xs text-neutral-400 font-sans">{item.subtitle}</p>
                        </div>
                        <p className="text-xs text-neutral-600 font-sans leading-relaxed pt-2 border-t border-neutral-100 italic">
                          "{item.why}"
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-neutral-100">
                        <span className="text-[9px] font-mono font-bold text-neutral-400 block uppercase mb-1">EVIDENCE TIMELINE BASIS</span>
                        <div className="space-y-1 text-[10px] text-neutral-500 font-sans">
                          {item.evidence?.map((e: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="text-green-600">✔</span>
                              <span>{e}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================
                6. PREDICTIONS & RISK MANAGEMENT
                ======================================================== */}
            {activeTab === "predictions" && (
              <div id="predictions-subengine" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                  {/* Indicators (4/12) */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4">PREDICTIVE INDICATORS</h3>
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-700">Employment Probability</span>
                            <span className="text-xs font-mono font-bold text-neutral-900">{predictions?.employmentProbability || 94}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-black" style={{ width: `${predictions?.employmentProbability || 94}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-700">Project Success Probability</span>
                            <span className="text-xs font-mono font-bold text-neutral-900">{predictions?.projectSuccessProbability || 91}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-black" style={{ width: `${predictions?.projectSuccessProbability || 91}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-neutral-700">Learning Speed Class</span>
                            <span className="px-2 py-0.5 font-mono font-bold bg-green-100 text-green-800 rounded">{predictions?.learningSpeedPrediction || "Exceptional"}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-neutral-700">Risk of Dropout</span>
                            <span className="px-2 py-0.5 font-mono font-bold bg-green-100 text-green-800 rounded">{predictions?.dropoutRisk || "Low"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Market demands (8/12) */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-neutral-200">
                      <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-4">FUTURE CORPORATE DEMAND INDICATORS</h3>
                      <div className="space-y-4">
                        {predictions?.futureHiringDemand?.map((demand: string, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-neutral-900">{demand}</span>
                              <span className="text-[10px] text-neutral-400 block font-sans">Dynamic recruitment trending index</span>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-mono rounded font-bold">Rising Fast</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                7. BADGE ENGINE Console
                ======================================================== */}
            {activeTab === "badges" && (
              <div id="badges-subengine" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {badges.map((b: any) => (
                    <div key={b.id} className="bg-white p-6 rounded-xl border border-neutral-200 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white text-lg font-bold">
                            ★
                          </div>
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-green-100 text-green-800 rounded-full">ACTIVE VALID</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-neutral-900">{b.badgeName}</h4>
                          <p className="text-xs text-neutral-500 font-sans">{b.evidence}</p>
                        </div>
                      </div>
                      <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between font-mono text-[9px] text-neutral-400">
                        <span>Issued: {new Date(b.issuedAt).toLocaleDateString()}</span>
                        {b.expirationDate ? (
                          <span>Expires: {new Date(b.expirationDate).toLocaleDateString()}</span>
                        ) : (
                          <span>Never Expires</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================
                8. WARNING ENGINE / INTERACTIVE APPEALS
                ======================================================== */}
            {activeTab === "warnings" && (
              <div id="warnings-subengine" className="space-y-6">
                <WarningConsole warnings={warnings} onRecalculate={handleRecalculate} />
              </div>
            )}

            {/* ========================================================
                9. APPROVAL ENGINE / INTERACTIVE AUDITS
                ======================================================== */}
            {activeTab === "approvals" && (
              <div id="approvals-subengine" className="space-y-6">
                <ApprovalPipelineConsole approvals={approvals} onRecalculate={handleRecalculate} />
              </div>
            )}

            {/* ========================================================
                10. TALENT ANALYTICS HUB
                ======================================================== */}
            {activeTab === "analytics" && (
              <div id="analytics-subengine" className="space-y-6">
                <TalentAnalyticsHub />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==========================================
// SCORING WEIGHTS SIMULATOR MODULE
// ==========================================
function ScoringWeightsSimulator({ onRecalculate }: { onRecalculate: () => void }) {
  const { success, error } = useToast();
  
  // Weights state
  const [taskComp, setTaskComp] = useState(30);
  const [codeQual, setCodeQual] = useState(25);
  const [complexity, setComplexity] = useState(20);
  const [collab, setCollab] = useState(15);
  const [initiative, setInitiative] = useState(10);
  
  // Custom mock values to evaluate
  const [taskVal, setTaskVal] = useState(85);
  const [codeVal, setCodeVal] = useState(90);
  const [compVal, setCompVal] = useState(80);
  const [collabVal, setCollabVal] = useState(70);
  const [initVal, setInitVal] = useState(75);

  const [simulatedResult, setSimulatedResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const payload = {
        weights: {
          taskCompletion: taskComp / 100,
          codeQuality: codeQual / 100,
          complexity: complexity / 100,
          collaboration: collab / 100,
          initiative: initiative / 100
        },
        metrics: [
          { category: "taskCompletion", value: taskVal, max: 100 },
          { category: "codeQuality", value: codeVal, max: 100 },
          { category: "complexity", value: compVal, max: 100 },
          { category: "collaboration", value: collabVal, max: 100 },
          { category: "initiative", value: initVal, max: 100 }
        ],
        baseOffset: 60
      };

      const res = await fetch("/api/intelligence/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedResult(data.simulation);
        success("Simulation Computed", "Simulation computed dynamically using custom weights.");
      }
    } catch (_) {
      error("Solver Fault", "Could not run simulated weighted projection.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-neutral-500" /> CENTRALIZED SCORING WEIGHTS SIMULATOR
        </h3>
        <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-100 text-neutral-700 rounded border border-neutral-200">Simulation Active</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sliders for Weights */}
        <div className="space-y-4">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">DYNAMIC ALGORITHMIC WEIGHTS (%)</span>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Task Completion Rate</span>
                <span className="font-mono font-bold">{taskComp}%</span>
              </div>
              <input type="range" min="0" max="100" value={taskComp} onChange={e => setTaskComp(Number(e.target.value))} className="w-full accent-black h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Vetted Code Quality</span>
                <span className="font-mono font-bold">{codeQual}%</span>
              </div>
              <input type="range" min="0" max="100" value={codeQual} onChange={e => setCodeQual(Number(e.target.value))} className="w-full accent-black h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Project Complexity Multiplier</span>
                <span className="font-mono font-bold">{complexity}%</span>
              </div>
              <input type="range" min="0" max="100" value={complexity} onChange={e => setComplexity(Number(e.target.value))} className="w-full accent-black h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Team Collaboration Metric</span>
                <span className="font-mono font-bold">{collab}%</span>
              </div>
              <input type="range" min="0" max="100" value={collab} onChange={e => setCollab(Number(e.target.value))} className="w-full accent-black h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Open-Source Initiative</span>
                <span className="font-mono font-bold">{initiative}%</span>
              </div>
              <input type="range" min="0" max="100" value={initiative} onChange={e => setInitiative(Number(e.target.value))} className="w-full accent-black h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Sliders for Input values */}
        <div className="space-y-4">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">SIMULATED CANDIDATE METRIC ASSIGNMENTS</span>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Claimed Task Success Value</span>
                <span className="font-mono font-bold">{taskVal}/100</span>
              </div>
              <input type="range" min="0" max="100" value={taskVal} onChange={e => setTaskVal(Number(e.target.value))} className="w-full accent-black h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Dynamic Code Correctness</span>
                <span className="font-mono font-bold">{codeVal}/100</span>
              </div>
              <input type="range" min="0" max="100" value={codeVal} onChange={e => setCodeVal(Number(e.target.value))} className="w-full accent-black h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Challenge Difficulty Adapts</span>
                <span className="font-mono font-bold">{compVal}/100</span>
              </div>
              <input type="range" min="0" max="100" value={compVal} onChange={e => setCompVal(Number(e.target.value))} className="w-full accent-black h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Peer-Reviewed Collaboration</span>
                <span className="font-mono font-bold">{collabVal}/100</span>
              </div>
              <input type="range" min="0" max="100" value={collabVal} onChange={e => setCollabVal(Number(e.target.value))} className="w-full accent-black h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-600">
                <span>Sandbox Open Contributions</span>
                <span className="font-mono font-bold">{initVal}/100</span>
              </div>
              <input type="range" min="0" max="100" value={initVal} onChange={e => setInitVal(Number(e.target.value))} className="w-full accent-black h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-lg text-xs font-sans font-bold transition-colors cursor-pointer"
          >
            {isSimulating ? "Solving..." : "Run Simulated Engine Projection"}
          </button>
        </div>

        {simulatedResult && (
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-6 animate-fadeIn">
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">SIMULATION OUTPUT</span>
              <span className="text-xl font-mono font-bold text-neutral-900">{simulatedResult.score}/100</span>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">CONFIDENCE METRIC</span>
              <span className="text-sm font-mono font-bold text-neutral-600">{simulatedResult.confidence}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// AI MATCHING ENGINE WORKSPACE MODULE
// ==========================================
function AiMatcherWorkspace() {
  const { success, error } = useToast();
  const [selectedStudent, setSelectedStudent] = useState("usr_fndtn_konexa_99");
  const [selectedProject, setSelectedProject] = useState("proj_core_performance_optimizer");
  const [matchResult, setMatchResult] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);

  const handleComputeMatch = async () => {
    setIsMatching(true);
    try {
      const res = await fetch("/api/intelligence/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent, projectId: selectedProject })
      });
      const data = await res.json();
      if (data) {
        setMatchResult(data);
        success("Match Analysis Resolved", "Calculated candidate alignment index with explanations.");
      }
    } catch (_) {
      error("Solver Fault", "Matching logic could not establish candidate relation.");
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
          <Brain className="w-4 h-4 text-neutral-500" /> SEMANTIC COGNITIVE AI MATCH ENGINE
        </h3>
        <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-100 text-neutral-700 rounded border border-neutral-200">Matching Active</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase">TARGET STUDENT PROFILE</label>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-700 font-sans">
            <option value="usr_fndtn_konexa_99">Alex Rivera (Vetted React/SVG Expert)</option>
            <option value="usr_mock_slack_88">Min-jun Kim (Distributed Backend Expert)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase">DEPLOYED ENTERPRISE CHALLENGE</label>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-700 font-sans">
            <option value="proj_core_performance_optimizer">Vite + React Core Performance Optimizer (Hard)</option>
            <option value="proj_canvas_syncer">Sub-millisecond Canvas Sync Vector (Hard)</option>
          </select>
        </div>
      </div>

      <button 
        onClick={handleComputeMatch}
        disabled={isMatching}
        className="w-full md:w-auto px-4 py-2.5 bg-black text-white hover:bg-neutral-800 font-sans font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isMatching ? "animate-spin" : ""}`} />
        {isMatching ? "Executing Semantic Resolve..." : "Analyze Candidate Fit"}
      </button>

      {matchResult && (
        <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Math indicators */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 bg-white rounded-lg border border-neutral-100 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600">Suitability Index</span>
              <span className="text-lg font-mono font-bold text-neutral-950">{matchResult.matchScore}%</span>
            </div>
            <div className="p-4 bg-white rounded-lg border border-neutral-100 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600">Culture Compatibility</span>
              <span className="text-lg font-mono font-bold text-neutral-950">{matchResult.compatibilityScore}%</span>
            </div>
            <div className="p-4 bg-white rounded-lg border border-neutral-100 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600">Calculated Risk Index</span>
              <span className="text-lg font-mono font-bold text-red-700">{matchResult.riskScore}%</span>
            </div>
          </div>

          {/* AI Thesis explanation */}
          <div className="lg:col-span-8 space-y-4">
            <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase">COGNITIVE MATCH EXPLAINABILITY</h4>
            <div className="p-4 bg-white rounded-lg border border-neutral-100 space-y-2">
              <span className="text-xs font-bold text-neutral-900 block flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-neutral-900" /> AI VERDICT SUMMARY
              </span>
              <p className="text-xs text-neutral-600 font-sans leading-relaxed italic">
                "{matchResult.matchExplanation}"
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded border border-neutral-100 text-[10px]">
                <span className="font-mono font-bold text-neutral-400 block uppercase mb-1">Timezone Compatibility</span>
                <span className="text-neutral-700 font-sans">90% (Overlap: 4 hours daily)</span>
              </div>
              <div className="p-3 bg-white rounded border border-neutral-100 text-[10px]">
                <span className="font-mono font-bold text-neutral-400 block uppercase mb-1">Expected Growth velocity</span>
                <span className="text-neutral-700 font-sans">{matchResult.growthPotential}% (High Expansion Rate)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// WARNINGS & APPEALS MODULE
// ==========================================
function WarningConsole({ warnings, onRecalculate }: { warnings: any[]; onRecalculate: () => void }) {
  const { success, error } = useToast();
  const [appealNotes, setAppealNotes] = useState("");
  const [selectedWarningId, setSelectedWarningId] = useState<string | null>(null);
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarningId || !appealNotes.trim()) return;
    setIsSubmittingAppeal(true);
    try {
      const res = await fetch("/api/intelligence/warnings/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warningId: selectedWarningId, notes: appealNotes })
      });
      const data = await res.json();
      if (data.success) {
        success("Appeal Lodged", "Your warning appeal is currently being reviewed by compliance authorities.");
        setAppealNotes("");
        setSelectedWarningId(null);
        onRecalculate();
      }
    } catch (_) {
      error("Database Write Fail", "Could not commit appeal notes.");
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" /> COMPLIANCE & WARNING TRIGGERS
        </h3>
        <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-100 text-neutral-700 rounded border border-neutral-200">Warnings Monitored</span>
      </div>

      <div className="space-y-4">
        {warnings.length > 0 ? (
          warnings.map((w) => (
            <div key={w.id} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                    w.severity === "High" || w.severity === "Critical" 
                      ? "bg-red-100 text-red-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {w.severity} Severity
                  </span>
                  <span className="text-xs font-bold text-neutral-900">{w.type} Triggered</span>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-500">{w.status}</span>
              </div>
              
              <p className="text-xs text-neutral-600 font-sans">{w.message}</p>
              
              {w.appealNotes && (
                <div className="p-3 bg-white rounded border border-neutral-100 text-xs text-neutral-500 font-sans italic">
                  <strong>Student Appeal Notes:</strong> "{w.appealNotes}"
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2 border-t border-neutral-200">
                <div className="text-[10px] text-neutral-400 font-sans">
                  Recommended: {w.recommendedActions?.join(" | ")}
                </div>
                {w.status === "Active" && (
                  <button 
                    onClick={() => {
                      setSelectedWarningId(w.id);
                      setAppealNotes("");
                    }}
                    className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-sans font-bold text-[10px] rounded cursor-pointer"
                  >
                    Lodge Interactive Appeal
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-neutral-400 text-center py-6 font-sans">Your portfolio currently has 100% clean standing. Zero warnings logged.</p>
        )}
      </div>

      {selectedWarningId && (
        <form onSubmit={handleAppealSubmit} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">SUBMIT FORMAL COMPLIANCE APPEAL</span>
            <button type="button" onClick={() => setSelectedWarningId(null)} className="text-xs text-neutral-400 hover:text-black">Cancel</button>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-neutral-500 font-sans">Describe why this warn pattern is inaccurate (e.g. offline git sync):</label>
            <textarea 
              required
              value={appealNotes}
              onChange={e => setAppealNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-neutral-200 rounded text-xs text-neutral-700 font-sans h-24"
              placeholder="Provide evidence such as git tree revision numbers..."
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmittingAppeal}
            className="px-4 py-2 bg-black text-white hover:bg-neutral-800 font-sans font-bold text-xs rounded transition-colors cursor-pointer"
          >
            {isSubmittingAppeal ? "Lodging Appeal..." : "Submit Appeal to Audit Board"}
          </button>
        </form>
      )}
    </div>
  );
}

// ==========================================
// APPROVAL PIPELINE CONSOLE MODULE
// ==========================================
function ApprovalPipelineConsole({ approvals, onRecalculate }: { approvals: any[]; onRecalculate: () => void }) {
  const { success, error } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (approvalId: string, action: "Approve" | "Reject") => {
    setProcessingId(approvalId);
    try {
      const res = await fetch("/api/intelligence/approvals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId,
          action,
          notes: `${action} decision triggered manually via sandbox operational bypass.`,
          actor: "Sponsor Reviewer Override"
        })
      });
      const data = await res.json();
      if (data.success) {
        success(`Workflow Resolved`, `Approval updated to ${action}. Dynamic bonuses queued.`);
        onRecalculate();
      }
    } catch (_) {
      error("Pipeline Conflict", "Could not submit review decision.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
          <ThumbsUp className="w-4 h-4 text-neutral-500" /> COGNITIVE APPROVAL CHANNELS
        </h3>
        <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-100 text-neutral-700 rounded border border-neutral-200">Pipeline Operational</span>
      </div>

      <div className="space-y-4">
        {approvals.map((ap) => (
          <div key={ap.id} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-neutral-200 text-neutral-800 rounded uppercase">{ap.type}</span>
                <h4 className="text-xs font-bold text-neutral-900 mt-1">{ap.title}</h4>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                ap.status === "Pending" ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-green-100 text-green-800"
              }`}>{ap.status}</span>
            </div>

            {/* AI Recommendation details */}
            <div className="p-3 bg-white rounded border border-neutral-100 flex items-start gap-2.5">
              <Brain className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">AUTOMATED REVIEW ADVISEMENT</span>
                <span className="text-xs font-sans text-neutral-700 font-medium">Verdict: <strong className="text-black font-bold">{ap.aiRecommendation}</strong></span>
                <p className="text-xs text-neutral-500 font-sans leading-normal">"{ap.aiReasoning}"</p>
              </div>
            </div>

            {ap.status === "Pending" && (
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button 
                  disabled={processingId === ap.id}
                  onClick={() => handleAction(ap.id, "Reject")}
                  className="px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 font-sans font-bold text-[10px] rounded cursor-pointer"
                >
                  Reject Deliverable
                </button>
                <button 
                  disabled={processingId === ap.id}
                  onClick={() => handleAction(ap.id, "Approve")}
                  className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white font-sans font-bold text-[10px] rounded cursor-pointer"
                >
                  Approve Deliverable
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// TALENT ANALYTICS HUB MODULE
// ==========================================
function TalentAnalyticsHub() {
  const mockMonthlyData = [
    { month: "Jan", trust: 72, performance: 75, placements: 140 },
    { month: "Feb", trust: 74, performance: 77, placements: 155 },
    { month: "Mar", trust: 78, performance: 81, placements: 180 },
    { month: "Apr", trust: 80, performance: 83, placements: 195 },
    { month: "May", trust: 81, performance: 85, placements: 220 },
    { month: "Jun", trust: 83, performance: 88, placements: 245 }
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest">TALENT PLACEMENT & SKILL METRICS COHORT</h3>
        <span className="text-[10px] font-mono text-neutral-400 italic">Historical data span: 6 Months</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Placements trend */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">DYNAMIC PLACEMENTS VOLUME COHORT</span>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockMonthlyData} margin={{ left: -20, top: 10 }}>
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} />
                <YAxis stroke="#9ca3af" fontSize={9} />
                <Tooltip />
                <Bar dataKey="placements" fill="#000000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cognitive Index Trends */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">COGNITIVE RATINGS SHIFT CURVES</span>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyData} margin={{ left: -20, top: 10 }}>
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} />
                <YAxis stroke="#9ca3af" fontSize={9} domain={[60, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="trust" stroke="#000000" fill="none" strokeWidth={1.5} />
                <Area type="monotone" dataKey="performance" stroke="#6b7280" fill="none" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
