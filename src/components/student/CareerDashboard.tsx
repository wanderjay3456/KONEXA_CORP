import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  TrendingUp, Shield, Star, Award, Zap, Calendar as CalendarIcon, 
  Clock, CheckCircle, Flame, Target, BookOpen, AlertCircle, 
  Bookmark, Briefcase, ChevronRight, Play, Check, Sparkles, 
  Github, FileText, ArrowUpRight, MessageSquare, Plus, Bell
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { motion } from "motion/react";

interface CareerDashboardProps {
  onNavigate: (tabId: string) => void;
}

export default function CareerDashboard({ onNavigate }: CareerDashboardProps) {
  const { studentProfile, projects, applications, updateStudentProfile } = useApp();
  const { success, info } = useToast();
  const [dailyStreakChecked, setDailyStreakChecked] = useState(false);

  // Generate some state data
  const trustScore = studentProfile?.trustScore ?? 85;
  const performanceScore = 92;
  const employabilityScore = 88;
  const aiReadinessScore = 95;
  const resumeScore = 82;

  // Track achievements, badges, certificates
  const [badges, setBadges] = useState([
    { id: "1", name: "Alpha Builder", desc: "First clean challenge compile approved by Gemini AI", icon: Zap, color: "text-amber-500 bg-amber-50 border-amber-100" },
    { id: "2", name: "Zero-Bug Hero", desc: "Completed a Hard difficulty challenge with 100/100 evaluation", icon: Shield, color: "text-teal-500 bg-teal-50 border-teal-100" },
    { id: "3", name: "Security Guardian", desc: "Successfully resolved all RLS and access token constraints", icon: CheckCircle, color: "text-blue-500 bg-blue-50 border-blue-100" }
  ]);

  const [notifications, setNotifications] = useState([
    { id: "n1", category: "AI", title: "Gemini Matchmaking Evaluation Complete", text: "Your Vite Optimizer solution scored 94/100. Employability Index boosted by 4 points!", priority: "high", time: "10m ago", read: false },
    { id: "n2", category: "Project", title: "Milestone Deadline Approaching", text: "Linear Inc. challenge requires code check-in within 24 hours.", priority: "medium", time: "2h ago", read: false },
    { id: "n3", category: "System", title: "Trust Rank Upgrade", text: "Congratulations! Your Trust Score reached 89, unlocking premium sponsor challenges.", priority: "low", time: "1d ago", read: true }
  ]);

  const [weeklyGoals, setWeeklyGoals] = useState([
    { id: "g1", text: "Complete 1 Hard-tier challenge", completed: false },
    { id: "g2", text: "Optimize portfolio ATS keywords", completed: true },
    { id: "g3", text: "Maintain a 5-day GitHub green-dot streak", completed: true }
  ]);

  const [calendarEvents, setCalendarEvents] = useState([
    { id: "e1", title: "Google Sidebar Project Milestone #2", date: "July 12", type: "milestone" },
    { id: "e2", title: "Live Mentor Consultation with Google Architect", date: "July 15", type: "meeting" },
    { id: "e3", title: "Framer WebSocket sync demo deadline", date: "July 18", type: "deadline" }
  ]);

  const handleClaimDailyEXP = () => {
    if (dailyStreakChecked) return;
    setDailyStreakChecked(true);
    const currentStreak = studentProfile?.completedProjects ?? 0;
    updateStudentProfile({
      trustScore: Math.min(100, trustScore + 2),
      completedProjects: currentStreak + 1
    });
    success("Daily Streak Claimed!", "+50 EXP, +2 Trust Score. Keep the flame active!");
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    success("Notification", "Notification marked as read.");
  };

  const toggleGoal = (id: string) => {
    setWeeklyGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6 scrollbar">
      
      {/* 1. WELCOME BANNER & EXP HERO */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-8 space-y-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
            KONEXA TALENT OPERATING SYSTEM
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight">
            Welcome back, {studentProfile?.preferredName || studentProfile?.name || "Global Talent"}
          </h1>
          <p className="font-sans text-xs text-neutral-500 max-w-xl leading-relaxed">
            Your career node is connected to the sandbox evaluation grid. Build high-trust code, complete milestones, and get auto-matched with elite global corporate clients.
          </p>
        </div>

        {/* Daily Streak & Gamified EXP Tracker */}
        <div className="md:col-span-4 bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">LEVEL 4 BUILDER</span>
            <div className="flex items-center gap-1">
              <Flame className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
              <span className="font-display font-black text-2xl text-neutral-900">7 Day Streak</span>
            </div>
            <p className="text-[10px] text-neutral-400">Claim daily EXP checks to boost search priority.</p>
          </div>
          <button 
            disabled={dailyStreakChecked}
            onClick={handleClaimDailyEXP}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              dailyStreakChecked 
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                : "bg-neutral-900 text-white hover:bg-black cursor-pointer shadow-sm"
            }`}
          >
            {dailyStreakChecked ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{dailyStreakChecked ? "Claimed" : "Check-In"}</span>
          </button>
        </div>
      </div>

      {/* 2. CORE SCORE MATRIX GRID (Bento Styles) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Trust Score */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Trust Score</span>
              <div className="text-3xl font-display font-black text-neutral-900">{trustScore}</div>
            </div>
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${trustScore}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
              <span>MIN TRUST: 70</span>
              <span className="text-blue-600 font-bold">Top 5% Builder</span>
            </div>
          </div>
        </div>

        {/* Performance Score */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Performance Index</span>
              <div className="text-3xl font-display font-black text-neutral-900">{performanceScore}/100</div>
            </div>
            <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${performanceScore}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
              <span>GRADES AVERAGE</span>
              <span className="text-amber-600 font-bold">Excellent</span>
            </div>
          </div>
        </div>

        {/* Employability Score */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Employability Rating</span>
              <div className="text-3xl font-display font-black text-neutral-900">{employabilityScore}%</div>
            </div>
            <div className="p-2 bg-teal-50 border border-teal-100 rounded-xl text-teal-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="bg-teal-600 h-full rounded-full transition-all duration-500" style={{ width: `${employabilityScore}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
              <span>SPONSOR INTEREST</span>
              <span className="text-teal-600 font-bold">Extremely High</span>
            </div>
          </div>
        </div>

        {/* AI Readiness Score */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">AI Readiness Rating</span>
              <div className="text-3xl font-display font-black text-neutral-900">{aiReadinessScore}%</div>
            </div>
            <div className="p-2 bg-purple-50 border border-purple-100 rounded-xl text-purple-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${aiReadinessScore}%` }}></div>
            </div>
            <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
              <span>COACH EVALUATION</span>
              <span className="text-purple-600 font-bold">Elite Spec</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. MAIN DASHBOARD CONTENT BLOCK */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Main actions, goals, calendars (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Actions Bar */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-900">Command Center Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <button 
                onClick={() => onNavigate("resume-builder")}
                className="p-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 hover:border-neutral-300 rounded-2xl flex flex-col items-start gap-2 text-left transition-all cursor-pointer group"
              >
                <div className="p-2 bg-white rounded-xl shadow-xs text-neutral-800">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-900 block flex items-center gap-1">
                    AI Resume review
                    <ArrowUpRight className="w-3 h-3 text-neutral-400 group-hover:text-black transition-colors" />
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-tight block mt-0.5">Optimize keywords for ATS scanners.</span>
                </div>
              </button>

              <button 
                onClick={() => onNavigate("career-roadmap")}
                className="p-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 hover:border-neutral-300 rounded-2xl flex flex-col items-start gap-2 text-left transition-all cursor-pointer group"
              >
                <div className="p-2 bg-white rounded-xl shadow-xs text-neutral-800">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-900 block flex items-center gap-1">
                    AI Growth Roadmap
                    <ArrowUpRight className="w-3 h-3 text-neutral-400 group-hover:text-black transition-colors" />
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-tight block mt-0.5">Construct custom curriculum timelines.</span>
                </div>
              </button>

              <button 
                onClick={() => onNavigate("project-marketplace")}
                className="p-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 hover:border-neutral-300 rounded-2xl flex flex-col items-start gap-2 text-left transition-all cursor-pointer group"
              >
                <div className="p-2 bg-white rounded-xl shadow-xs text-neutral-800">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-900 block flex items-center gap-1">
                    Find challenges
                    <ArrowUpRight className="w-3 h-3 text-neutral-400 group-hover:text-black transition-colors" />
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-tight block mt-0.5">Browse paid, open sponsor projects.</span>
                </div>
              </button>
            </div>
          </div>

          {/* Current Projects in Workspace & Calendar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Active Submissions / Projects list */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-bold text-sm text-neutral-900">Current active workspaces</h3>
                  <button onClick={() => onNavigate("workspace")} className="text-[10px] font-bold text-neutral-400 hover:text-black uppercase tracking-wider flex items-center gap-0.5 cursor-pointer">
                    <span>Workspace Hub</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {applications.length === 0 ? (
                  <div className="p-6 text-center bg-neutral-50 border border-neutral-200/50 rounded-2xl space-y-2 mt-2">
                    <Briefcase className="w-6 h-6 text-neutral-300 mx-auto" />
                    <span className="text-xs font-semibold text-neutral-500 block">No active workspaces</span>
                    <p className="text-[10px] text-neutral-400">Claim and solve sponsor code challenges inside the marketplace to boot sandbox workspaces.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app) => (
                      <div key={app.id} className="p-3.5 bg-neutral-50 border border-neutral-200/40 rounded-2xl flex justify-between items-center hover:border-neutral-300 transition-all">
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono text-neutral-400 block uppercase">ACTIVE WORKSPACE</span>
                          <span className="text-xs font-bold text-neutral-800 truncate block">{app.projectTitle}</span>
                        </div>
                        <button 
                          onClick={() => onNavigate("workspace")}
                          className="px-2.5 py-1.5 bg-black text-white hover:bg-neutral-800 text-[10px] font-semibold rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <span>Open IDE</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-neutral-100 mt-4 text-[10px] text-neutral-400 font-sans leading-tight">
                *Accepted projects automatically boot realtime collaborative Kanban workspace and Gemini debug boards.
              </div>
            </div>

            {/* 2. Interactive Calendar Widget */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-neutral-400" />
                    <span>My Calendar</span>
                  </h3>
                  <span className="text-[9px] font-mono font-bold text-neutral-400">JULY 2026</span>
                </div>

                <div className="space-y-3">
                  {calendarEvents.map((evt) => (
                    <div key={evt.id} className="flex gap-3 items-start text-xs font-sans">
                      <div className="w-12 text-center shrink-0 p-1.5 bg-neutral-50 rounded-lg border border-neutral-200/50">
                        <span className="text-[9px] font-mono font-bold text-neutral-400 block uppercase">JULY</span>
                        <span className="text-sm font-display font-bold text-neutral-800 block leading-none">{evt.date.split(" ")[1]}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-neutral-800 block truncate">{evt.title}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider block mt-0.5 ${
                          evt.type === "deadline" ? "text-rose-500" :
                          evt.type === "milestone" ? "text-purple-500" : "text-teal-500"
                        }`}>
                          {evt.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center text-[10px] text-neutral-400 font-sans">
                <span>Total items: {calendarEvents.length}</span>
                <span className="font-mono text-green-600 font-semibold underline cursor-pointer">Sync with Google Calendar</span>
              </div>
            </div>

          </div>

          {/* Recommended learning modules & Saved projects */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-900">Recommended Next Steps (AI Customized)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-teal-50/20 border border-teal-100/40 rounded-2xl">
                <div className="flex gap-2 items-center text-teal-800 font-bold text-xs mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Missing Skill Track</span>
                </div>
                <h4 className="text-xs font-bold text-neutral-800">Advanced React 19 Concurrent Fibers</h4>
                <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                  Required by <strong>Google Cloud</strong> and <strong>Vercel Core</strong>. Completing this mini-course triggers +4% matching score.
                </p>
                <button 
                  onClick={() => onNavigate("skill-center")}
                  className="mt-3 text-[10px] font-semibold text-teal-700 hover:text-teal-800 underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Explore Skill Center</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 bg-purple-50/20 border border-purple-100/40 rounded-2xl">
                <div className="flex gap-2 items-center text-purple-800 font-bold text-xs mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Sponsor Suggestion</span>
                </div>
                <h4 className="text-xs font-bold text-neutral-800">Sub-millisecond Canvas Syncing</h4>
                <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                  Framer Inc. is actively recruiting builders. Your TS performance score aligns with 94% of their candidate profile.
                </p>
                <button 
                  onClick={() => onNavigate("project-marketplace")}
                  className="mt-3 text-[10px] font-semibold text-purple-700 hover:text-purple-800 underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Claim Framer Challenge</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Goals, badges, achievements, notifications (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Realtime Active Notification Center */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-neutral-400" />
                <span>Recent Notifications</span>
              </h3>
              <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                {notifications.filter(n => !n.read).length} Unread
              </span>
            </div>

            <div className="space-y-3">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 rounded-2xl border transition-all text-xs flex gap-2.5 items-start ${
                    n.read 
                      ? "bg-white border-neutral-200/50 opacity-60" 
                      : "bg-neutral-50 border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    n.priority === "high" ? "bg-rose-500" :
                    n.priority === "medium" ? "bg-amber-500" : "bg-neutral-300"
                  }`} />
                  <div className="flex-1 min-w-0 font-sans">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-neutral-800 truncate block">{n.title}</span>
                      <span className="text-[9px] font-mono text-neutral-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">{n.text}</p>
                    
                    {!n.read && (
                      <button 
                        onClick={() => handleMarkNotificationRead(n.id)}
                        className="mt-2 text-[9px] text-teal-600 hover:text-teal-700 font-semibold uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Gamified Weekly Goals Checklist */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm text-neutral-900">Weekly Milestones</h3>
              <p className="font-sans text-[10px] text-neutral-400 mt-0.5">Fulfill goals to multiplier your weekly streak EXP.</p>
            </div>

            <div className="space-y-2.5">
              {weeklyGoals.map((g) => (
                <div 
                  key={g.id} 
                  onClick={() => toggleGoal(g.id)}
                  className={`p-3.5 rounded-xl border flex gap-3 items-center cursor-pointer transition-all ${
                    g.completed 
                      ? "bg-emerald-50/20 border-emerald-100 text-neutral-500" 
                      : "bg-neutral-50/50 border-neutral-200 text-neutral-700 hover:border-neutral-300"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all ${
                    g.completed 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "bg-white border-neutral-300"
                  }`}>
                    {g.completed && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className={`text-xs font-sans ${g.completed ? "line-through text-neutral-400" : "font-medium"}`}>
                    {g.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Achievements & Badges Showcase */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-neutral-900">Unlocked Badges ({badges.length})</h3>
              <button onClick={() => onNavigate("achievement-center")} className="text-[10px] font-bold text-neutral-400 hover:text-black uppercase tracking-wider flex items-center gap-0.5 cursor-pointer">
                <span>Showcase</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {badges.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.id} className="flex gap-3 items-start p-3 bg-neutral-50/30 border border-neutral-200/50 rounded-2xl hover:border-neutral-300 transition-all">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${b.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-neutral-800 block">{b.name}</span>
                      <span className="text-[10px] text-neutral-400 leading-normal block mt-0.5">{b.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
