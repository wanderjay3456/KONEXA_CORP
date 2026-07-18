import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import ProjectCreationWizard from "../company/ProjectCreationWizard";
import ApplicationManagement from "../company/ApplicationManagement";
import EmployeeConversion from "../company/EmployeeConversion";
import type { Application } from "../../types";
import CompanyBankTransferPayment from "../company/CompanyBankTransferPayment";
import CompanyProjectList from "../company/CompanyProjectList";
import CompanyHome from "../company/CompanyHome";
import AiRecruitmentCenter from "../company/AiRecruitmentCenter";
import HiringPipelineView from "../company/HiringPipelineView";
import CompanyBookmarks from "../company/CompanyBookmarks";

interface CompanyDashboardProps {
  activeTab: string;
  onNavigate: (tabId: string) => void;
}

export default function CompanyDashboard({ activeTab, onNavigate }: CompanyDashboardProps) {
  const [, setSelectedStudentId] = useState("");
  const [, setSelectedApplication] = useState<Application | null>(null);

  if (activeTab === "company-home") return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><CompanyHome onNavigate={onNavigate} onSelectStudent={setSelectedStudentId} /></div>;
  if (activeTab === "create-challenge") return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><ProjectCreationWizard onNavigate={onNavigate} /></div>;
  if (activeTab === "company-projects") return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><CompanyProjectList onNavigate={onNavigate} /></div>;
  if (activeTab === "company-applications") {
    return (
      <div className="flex-1 overflow-y-auto bg-neutral-50 p-6">
        <ApplicationManagement onNavigate={onNavigate} onSelectStudent={setSelectedStudentId} onSelectApplication={setSelectedApplication} />
      </div>
    );
  }
  if (activeTab === "employee-conversions") return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><EmployeeConversion onNavigate={onNavigate} /></div>;
  if (activeTab === "ai-recruitment") return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><AiRecruitmentCenter onNavigate={onNavigate} /></div>;
  if (activeTab === "hiring-pipeline") return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><HiringPipelineView onNavigate={onNavigate} onSelectStudent={setSelectedStudentId} /></div>;
  if (activeTab === "company-bookmarks") return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><CompanyBookmarks onNavigate={onNavigate} onSelectStudent={setSelectedStudentId} /></div>;
  if (activeTab === "company-payments") return <div className="flex-1 overflow-y-auto bg-neutral-50 p-6"><CompanyBankTransferPayment /></div>;

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-7 w-7 text-neutral-500" />
        <h1 className="mt-4 text-xl font-black">운영 검증 중인 기능입니다</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-neutral-500">실제 기업·인재 데이터와 권한을 확인한 기능만 공개합니다. 아직 준비되지 않은 화면 대신 프로젝트 등록으로 이동할 수 있습니다.</p>
        <button onClick={() => onNavigate("create-challenge")} className="mt-6 rounded-xl bg-neutral-950 px-5 py-3 text-xs font-bold text-white">프로젝트 등록</button>
      </div>
    </div>
  );
}
