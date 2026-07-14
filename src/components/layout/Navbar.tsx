import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";
import { 
  Database, 
  Clock, 
  Smartphone, 
  ChevronDown, 
  LogOut, 
  User, 
  Layers, 
  Building2, 
  Cpu, 
  Briefcase,
  Search
} from "lucide-react";
import GlobalSearch from "./GlobalSearch";

interface NavbarProps {
  onLogout: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
  const { activeRole, setActiveRole, currentUser } = useApp();
  const [currentTime, setCurrentTime] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Command+K / Ctrl+K global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT:
        return <User className="w-4 h-4 text-black" />;
      case UserRole.COMPANY:
        return <Building2 className="w-4 h-4 text-black" />;
      case UserRole.ADMIN:
        return <Layers className="w-4 h-4 text-black" />;
      case UserRole.AI:
        return <Cpu className="w-4 h-4 text-black" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT: return "Student Sandbox";
      case UserRole.COMPANY: return "Company Partner";
      case UserRole.ADMIN: return "SaaS Administrator";
      case UserRole.AI: return "AI Workforce";
    }
  };

  return (
    <nav className="w-full bg-white/90 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Branding & Role Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onLogout}>
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-xs">
              <span className="font-display font-bold text-white text-sm">K</span>
            </div>
            <span className="font-display font-bold text-base tracking-widest text-neutral-900">KONEXA</span>
          </div>

          <div className="h-4 w-px bg-neutral-200" />

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer text-xs font-sans font-bold text-neutral-700"
            >
              {getRoleIcon(activeRole)}
              <span>{getRoleLabel(activeRole)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {showRoleDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowRoleDropdown(false)}
                />
                <div className="absolute left-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white shadow-lg py-1.5 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">
                    Switch Sandbox View
                  </div>
                  {Object.values(UserRole).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setActiveRole(role);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full px-3 py-2 flex items-center gap-2.5 text-left text-xs font-sans transition-colors cursor-pointer ${
                        activeRole === role 
                          ? "bg-neutral-50 text-neutral-900 font-bold" 
                          : "text-neutral-600 hover:bg-neutral-50/50 hover:text-neutral-900"
                      }`}
                    >
                      {getRoleIcon(role)}
                      <span>{getRoleLabel(role)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Middle: Integrated Search Trigger Bar */}
        <div className="flex-1 max-w-md mx-6 hidden lg:block">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 text-neutral-400 hover:text-neutral-500 hover:border-neutral-300 cursor-pointer text-xs font-sans transition-all duration-150"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span>Search platform...</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[9px] bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 text-neutral-500">
              <span>⌘</span>
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right: Technical diagnostics & User Profile */}
        <div className="flex items-center gap-4 text-xs font-sans text-neutral-500">
          {/* Mobile/Tablet Search icon button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="lg:hidden p-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            title="Search Platform"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Firestore connection status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-xl text-neutral-700 font-mono">
            <Database className="w-3.5 h-3.5 text-black" />
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Firestore Live Sync</span>
          </div>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 font-mono bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>{currentTime}</span>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-neutral-700 hover:text-black transition-colors border border-neutral-200 hover:border-neutral-300 rounded-xl px-3 py-1.5 cursor-pointer bg-white font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Sandbox</span>
          </button>
        </div>
      </div>
      
      {/* Global Search command palette */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}
