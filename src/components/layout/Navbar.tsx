import React from "react";
import { Building2, LayoutDashboard, LogOut, ShieldCheck, User } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";
import NotificationMenu from "./NotificationMenu";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavbarProps { onLogout: () => void; onNavigate?: (tab: string) => void }

export default function Navbar({ onLogout, onNavigate }: NavbarProps) {
  const { currentUser, activeRole } = useApp();
  const isCompany = activeRole === UserRole.COMPANY;
  const isAdmin = activeRole === UserRole.ADMIN;
  const RoleIcon = isAdmin ? ShieldCheck : isCompany ? Building2 : User;
  const dashboardTab = isCompany ? "create-challenge" : "project-marketplace";

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate?.(dashboardTab)} className="flex items-center gap-2" aria-label="KONEXA 대시보드로 이동">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-950 text-sm font-black text-white">K</span>
            <span className="font-display text-sm font-black tracking-[.18em] text-neutral-950">KONEXA</span>
          </button>
          <span className="hidden h-4 w-px bg-neutral-200 sm:block" />
          <div className="hidden items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-neutral-700 sm:flex"><RoleIcon className="h-3.5 w-3.5" />{isAdmin ? "관리자 계정" : isCompany ? "기업 계정" : "학생 계정"}</div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <NotificationMenu onNavigate={onNavigate} />
          <div className="hidden items-center gap-2 text-xs text-neutral-500 md:flex"><ShieldCheck className="h-4 w-4 text-emerald-600" /><span className="max-w-56 truncate">{currentUser?.email}</span></div>
          <button type="button" onClick={() => onNavigate?.(dashboardTab)} className="hidden items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 lg:inline-flex"><LayoutDashboard className="h-3.5 w-3.5" />대시보드</button>
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"><LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">로그아웃</span></button>
        </div>
      </div>
    </nav>
  );
}
