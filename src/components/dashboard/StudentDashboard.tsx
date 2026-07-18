import React from "react";
import { ShieldCheck } from "lucide-react";
import ProjectMarketplace from "../student/ProjectMarketplace";
import ProfileSettingsView from "../profile/ProfileSettingsView";
import StudentIntroVideo from "../student/StudentIntroVideo";
import StudentMorBilling from "../student/StudentMorBilling";

interface StudentDashboardProps {
  activeTab: string;
  onNavigate: (tabId: string) => void;
}

function UnavailablePanel({ onNavigate }: { onNavigate: (tabId: string) => void }) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
      <ShieldCheck className="mx-auto h-7 w-7 text-neutral-500" />
      <h1 className="mt-4 text-xl font-black text-neutral-900">이 기능은 운영 검증 중입니다</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">실제 데이터와 권한 검증이 끝난 기능만 공개합니다. 모의 점수나 가상 메시지는 표시하지 않습니다.</p>
      <button onClick={() => onNavigate("project-marketplace")} className="mt-6 rounded-xl bg-neutral-950 px-5 py-3 text-xs font-bold text-white">프로젝트 보기</button>
    </div>
  );
}

export default function StudentDashboard({ activeTab, onNavigate }: StudentDashboardProps) {
  if (activeTab === "project-marketplace") return <ProjectMarketplace />;
  if (activeTab === "profile") return <ProfileSettingsView />;
  if (activeTab === "intro-video") return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><div className="mx-auto max-w-5xl"><StudentIntroVideo /></div></div>;
  if (activeTab === "student-billing") return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><StudentMorBilling /></div>;

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6">
      <UnavailablePanel onNavigate={onNavigate} />
    </div>
  );
}
