import React from "react";
import { BriefcaseBusiness, Code, FileText, Scale, User, Users2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { activeRole, studentProfile, companyProfile } = useApp();
  const items = activeRole === UserRole.STUDENT
    ? [
        { id: "project-marketplace", label: "프로젝트", icon: Code },
        { id: "trust-operations", label: "계약·보호·리뷰", icon: Scale },
        { id: "profile", label: "프로필", icon: User },
      ]
    : activeRole === UserRole.COMPANY
      ? [
          { id: "create-challenge", label: "프로젝트 등록", icon: BriefcaseBusiness },
          { id: "company-applications", label: "지원자 관리", icon: Users2 },
          { id: "employee-conversions", label: "채용 전환", icon: FileText },
          { id: "trust-operations", label: "계약·보호·리뷰", icon: Scale },
        ]
      : [{ id: "trust-operations", label: "운영·분쟁 관리", icon: Scale }];

  const displayName = activeRole === UserRole.STUDENT
    ? studentProfile?.name
    : activeRole === UserRole.COMPANY
      ? companyProfile?.companyName
      : "KONEXA";

  return (
    <>
    <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 shrink-0 flex-col justify-between border-r border-neutral-200 bg-white p-6 md:flex">
      <div>
        <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-600">Workspace</div>
        <nav className="mt-2 space-y-1" aria-label="Workspace navigation">
          {items.map((item) => {
            const Icon = item.icon;
            const selected = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} aria-current={selected ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${selected ? "bg-neutral-950 text-white" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"}`}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-600">Authenticated account</div>
        <div className="mt-2 truncate text-sm font-black text-neutral-900">{displayName || "Profile pending"}</div>
        <p className="mt-1 text-xs leading-5 text-neutral-700">운영 데이터가 확인된 메뉴만 표시됩니다.</p>
      </div>
    </aside>
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-neutral-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl md:hidden" aria-label="모바일 워크스페이스 메뉴">
      {items.map((item) => {
        const Icon = item.icon;
        const selected = activeTab === item.id;
        return <button key={item.id} onClick={() => setActiveTab(item.id)} aria-current={selected ? "page" : undefined} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold ${selected ? "bg-neutral-950 text-white" : "text-neutral-700"}`}><Icon className="h-4 w-4" /><span className="max-w-full truncate">{item.label}</span></button>;
      })}
    </nav>
    </>
  );
}
