import React from "react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";
import { 
  Code, 
  FileCode2, 
  HelpCircle, 
  User, 
  Settings, 
  PlusSquare, 
  FolderGit2, 
  Users2, 
  Terminal, 
  Activity, 
  TrendingUp, 
  Brain, 
  ShieldAlert,
  GraduationCap,
  MessageSquare,
  Layers,
  ShieldCheck,
  Award,
  Scale
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { activeRole, studentProfile, companyProfile } = useApp();

  const getNavItems = () => {
    switch (activeRole) {
      case UserRole.STUDENT:
        return [
          { id: "student-dashboard", label: "Career Command Center", icon: TrendingUp },
          { id: "project-marketplace", label: "Project Marketplace", icon: Code },
          { id: "workspace", label: "Project Workspace", icon: Layers },
          { id: "resume-builder", label: "AI Resume Builder", icon: FileCode2 },
          { id: "career-roadmap", label: "AI Growth Roadmap", icon: Brain },
          { id: "skill-center", label: "Skill Center", icon: Activity },
          { id: "achievement-center", label: "Gamification & Badges", icon: ShieldCheck },
          { id: "ai-workspace", label: "AI Coach Suite", icon: Brain },
          { id: "messaging", label: "Realtime Messaging", icon: MessageSquare },
          { id: "trust-operations", label: "Contracts & Protection", icon: Scale },
          { id: "profile", label: "Dynamic Portfolio", icon: User }
        ];
      case UserRole.COMPANY:
        return [
          { id: "company-home", label: "Enterprise Home", icon: TrendingUp },
          { id: "company-projects", label: "Organization Challenges", icon: Code },
          { id: "create-challenge", label: "Deploy Challenge", icon: PlusSquare },
          { id: "company-applications", label: "Pipeline & Submissions", icon: Users2 },
          { id: "ai-recruiter", label: "AI Recruitment Center", icon: Brain },
          { id: "project-workspace", label: "Project Workspace", icon: Layers },
          { id: "employee-conversions", label: "Employee Conversions", icon: Award },
          { id: "trust-operations", label: "Contracts & Protection", icon: Scale },
          { id: "company-analytics", label: "Talent Analytics", icon: Activity },
          { id: "university-management", label: "Academic Networks", icon: GraduationCap },
          { id: "company-bookmarks", label: "Central Bookmarks", icon: ShieldCheck },
          { id: "company-messaging", label: "Communications Feed", icon: MessageSquare },
          { id: "role-management", label: "Roles & RBAC Control", icon: ShieldAlert },
          { id: "company-settings", label: "Settings Registry", icon: Settings }
        ];
      case UserRole.ADMIN:
        return [
          { id: "admin-logs", label: "System Audit Logs", icon: Terminal },
          { id: "admin-analytics", label: "SaaS Analytics", icon: TrendingUp },
          { id: "admin-health", label: "Database Monitors", icon: Activity },
          { id: "trust-operations", label: "Trust & Disputes", icon: Scale }
        ];
      case UserRole.AI:
        return [
          { id: "ai-overview", label: "Evaluation Overview", icon: Brain },
          { id: "ai-config", label: "LLM Pipeline Config", icon: Settings },
          { id: "ai-logs", label: "Inference Audits", icon: ShieldAlert }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 hidden md:flex flex-col justify-between shrink-0 h-[calc(100vh-64px)] sticky top-16 p-6">
      {/* Upper Navigation block */}
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="px-3 py-1.5 text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer ${
                    isActive 
                      ? "bg-neutral-100 text-neutral-900" 
                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-neutral-900" : "text-neutral-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2">
          <div className="px-3 py-1.5 text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">
            Enterprise Spec
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("intelligence-center")}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "intelligence-center" 
                  ? "bg-neutral-100 text-neutral-900" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50/50"
              }`}
            >
              <Brain className={`w-4 h-4 shrink-0 ${activeTab === "intelligence-center" ? "text-neutral-900" : "text-neutral-400"}`} />
              <span>Intelligence Center</span>
            </button>
            <button
              onClick={() => setActiveTab("identity-center")}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "identity-center" 
                  ? "bg-neutral-100 text-neutral-900" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50/50"
              }`}
            >
              <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === "identity-center" ? "text-neutral-900" : "text-neutral-400"}`} />
              <span>Identity Center</span>
            </button>
            <button
              onClick={() => setActiveTab("design-system")}
              className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "design-system" 
                  ? "bg-neutral-100 text-neutral-900" 
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50/50"
              }`}
            >
              <Layers className={`w-4 h-4 shrink-0 ${activeTab === "design-system" ? "text-neutral-900" : "text-neutral-400"}`} />
              <span>Design System</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Footer: User profile / trust summary badge */}
      <div className="border-t border-neutral-100 pt-6">
        {activeRole === UserRole.STUDENT && studentProfile && (
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">
                Trust Rating
              </span>
              <span className="text-xs font-mono font-bold text-neutral-900">
                {studentProfile.trustScore}/100
              </span>
            </div>
            
            {/* Visual Rating Bar */}
            <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black transition-all duration-1000"
                style={{ width: `${studentProfile.trustScore}%` }}
              />
            </div>

            <div className="text-[10px] text-neutral-500 font-sans leading-relaxed">
              Based on {studentProfile.completedProjects} real-world verified submissions.
            </div>
          </div>
        )}

        {activeRole === UserRole.COMPANY && companyProfile && (
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
              <PlusSquare className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-neutral-900 truncate">
                {companyProfile.companyName}
              </div>
              <div className="text-[10px] text-green-700 font-sans flex items-center gap-1 font-semibold uppercase tracking-wider">
                Verified Partner
              </div>
            </div>
          </div>
        )}

        {activeRole === UserRole.ADMIN && (
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-neutral-900">
                Supervisor
              </div>
              <div className="text-[10px] text-neutral-400 font-sans uppercase tracking-wider font-semibold">
                SaaS Administrator
              </div>
            </div>
          </div>
        )}

        {activeRole === UserRole.AI && (
          <div className="p-4 rounded-xl bg-black text-white border border-neutral-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">
                Gemini Node #09
              </div>
              <div className="text-[9px] text-neutral-400 font-mono">
                gemini-3.5-flash
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
