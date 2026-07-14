import React, { useState } from "react";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, BarChart3, PieChart, Info, HelpCircle, 
  Sparkles, RefreshCw, Calendar, ArrowUpRight, Zap
} from "lucide-react";
import { useToast } from "../ui/Toast";

// Datasets
const TRUST_DISTRIBUTION_DATA = [
  { name: "Score 70-75", SNU: 5, KAIST: 4, NUS: 3 },
  { name: "Score 76-80", SNU: 12, KAIST: 9, NUS: 11 },
  { name: "Score 81-85", SNU: 24, KAIST: 18, NUS: 15 },
  { name: "Score 86-90", SNU: 32, KAIST: 28, NUS: 22 },
  { name: "Score 91-95", SNU: 18, KAIST: 25, NUS: 19 },
  { name: "Score 96-100", SNU: 8, KAIST: 11, NUS: 7 }
];

const CHALLENGE_PRODUCTIVITY_DATA = [
  { name: "SVG Engine", submissions: 42, approved: 14, rejected: 28 },
  { name: "WASMSync", submissions: 25, approved: 8, rejected: 17 },
  { name: "Calendar Oauth", submissions: 31, approved: 19, rejected: 12 },
  { name: "Performance Hook", submissions: 56, approved: 22, rejected: 34 }
];

const ROI_FORECAST_DATA = [
  { month: "Month 1", standardCost: 15000, sandboxCost: 2000, standardVelocity: 40, sandboxVelocity: 90 },
  { month: "Month 2", standardCost: 14000, sandboxCost: 1500, standardVelocity: 45, sandboxVelocity: 92 },
  { month: "Month 3", standardCost: 15500, sandboxCost: 1800, standardVelocity: 42, sandboxVelocity: 95 },
  { month: "Month 4", standardCost: 16000, sandboxCost: 1200, standardVelocity: 48, sandboxVelocity: 96 }
];

export default function CompanyAnalytics() {
  const { success, info } = useToast();
  const [activeSegment, setActiveSegment] = useState<"talent" | "challenges" | "roi">("talent");

  const handleRefreshAnalytics = () => {
    success("Metrics Synchronized", "Real-time sandbox data streams updated.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            Executive Ledger
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            Corporate Talent Analytics
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Monitor verified trust distributions, challenge execution metrics, and predictive ROI models.
          </p>
        </div>

        <button 
          onClick={handleRefreshAnalytics}
          className="h-10 px-4 bg-white border border-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-4 h-4 text-neutral-900 animate-pulse" />
          <span>Sync Realtime Streams</span>
        </button>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-4 rounded-2xl">
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Average Developer ROI</span>
          <div className="text-xl font-display font-black text-neutral-900 mt-1">8.4x Reduction</div>
          <p className="text-[9px] text-neutral-400 mt-0.5">Vetting spend compared to agency contracts</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl">
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Talent Pool Density</span>
          <div className="text-xl font-display font-black text-neutral-900 mt-1">452 Verified Nodes</div>
          <p className="text-[9px] text-neutral-400 mt-0.5">Students enrolled across target universities</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl">
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Sandbox Integrity Score</span>
          <div className="text-xl font-display font-black text-neutral-900 mt-1">99.8% Zero-Leak</div>
          <p className="text-[9px] text-neutral-400 mt-0.5">Vetted code passes standard security lints</p>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl col-span-2 lg:col-span-1">
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Predictive Onboard Speed</span>
          <div className="text-xl font-display font-black text-neutral-900 mt-1">3.5 Days</div>
          <p className="text-[9px] text-neutral-400 mt-0.5">Average checkout-to-commit duration</p>
        </div>
      </div>

      {/* Tab Segment Controls */}
      <div className="flex gap-2 bg-neutral-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveSegment("talent")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeSegment === "talent" ? "bg-white text-black shadow-xs" : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          Trust & University Demographics
        </button>
        <button 
          onClick={() => setActiveSegment("challenges")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeSegment === "challenges" ? "bg-white text-black shadow-xs" : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          Challenge Productivity Indexes
        </button>
        <button 
          onClick={() => setActiveSegment("roi")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeSegment === "roi" ? "bg-white text-black shadow-xs" : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          Predictive ROI & Time-to-Market
        </button>
      </div>

      {/* Main Graph Grid (Bento style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Graphic (8/12) */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
          {activeSegment === "talent" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Verified Trust Score Demographic Curves</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Shows density matching index of student profiles across target institutional partnerships.</p>
              </div>

              <div className="h-96 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TRUST_DISTRIBUTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSnu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e40af" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorKaist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e5e7eb" }} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <Area type="monotone" dataKey="SNU" stroke="#1e40af" strokeWidth={2} fillOpacity={1} fill="url(#colorSnu)" name="Seoul National University" />
                    <Area type="monotone" dataKey="KAIST" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorKaist)" name="KAIST Hub" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeSegment === "challenges" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Sandbox Code Challenge Deliverable Pass Rates</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Audits submission approval frequencies relative to required constraints and test suites.</p>
              </div>

              <div className="h-96 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CHALLENGE_PRODUCTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e5e7eb" }} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <Bar dataKey="submissions" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Total Submissions" />
                    <Bar dataKey="approved" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Approved Deliverables" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeSegment === "roi" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Vetting Cost & Onboard Velocity Forecaster</h3>
                <p className="text-xs text-neutral-400 mt-0.5 font-light">Projections based on actual platform metrics. Solid lines represent sandbox performance velocity multipliers.</p>
              </div>

              <div className="h-96 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ROI_FORECAST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" fontSize={10} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e5e7eb" }} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="standardVelocity" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="4 4" name="Standard Hire Velocity (%)" />
                    <Line type="monotone" dataKey="sandboxVelocity" stroke="#000000" strokeWidth={2.5} name="KONEXA Sandbox Velocity (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right: Explanatory Context card (4/12) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">AI Data Assessment</span>
          
          <div className="space-y-3 text-xs leading-relaxed text-neutral-600 font-light font-sans">
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="font-bold text-neutral-900 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Predictive Hiring Alpha</span>
              </span>
              <p className="text-[11px] text-neutral-500 leading-normal font-light pt-0.5">
                Vetting student nodes inside our isolated sandbox environments removes 98% of HR administration costs. You bypass standard technical screening calls entirely.
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-neutral-800">1. Quality Assurance Benchmarks</span>
              <p className="text-[11px] text-neutral-500">
                Peer reviews on compiled SVG layouts reflect an average rating score of 91/100, certifying that developers are production-ready.
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-neutral-800">2. Institutional Alignment</span>
              <p className="text-[11px] text-neutral-500">
                KAIST and SNU graduates express highly elevated conversion rates when challenge milestones are embedded directly into localized computer science department workflows.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
