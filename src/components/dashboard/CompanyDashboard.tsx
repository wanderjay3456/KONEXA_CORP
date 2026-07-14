import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import CompanyHome from "../company/CompanyHome";
import ProjectManagement from "../company/ProjectManagement";
import ProjectCreationWizard from "../company/ProjectCreationWizard";
import ApplicationManagement from "../company/ApplicationManagement";
import StudentProfileReview from "../company/StudentProfileReview";
import AiRecruitmentCenter from "../company/AiRecruitmentCenter";
import CompanyProjectWorkspace from "../company/CompanyProjectWorkspace";
import EmployeeConversion from "../company/EmployeeConversion";
import CompanyAnalytics from "../company/CompanyAnalytics";
import UniversityManagement from "../company/UniversityManagement";
import CompanyBookmarks from "../company/CompanyBookmarks";
import CompanyMessaging from "../company/CompanyMessaging";
import RoleManagement from "../company/RoleManagement";
import CompanySettingsView from "../company/CompanySettingsView";

interface CompanyDashboardProps {
  activeTab: string;
  onNavigate: (tabId: string) => void;
}

export default function CompanyDashboard({ activeTab, onNavigate }: CompanyDashboardProps) {
  // Central student tracking for deep vetting review
  const [selectedStudentId, setSelectedStudentId] = useState<string>("usr_fndtn_konexa_99");
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6">
      {/* 1. ENTERPRISE HOME */}
      {activeTab === "company-home" && (
        <CompanyHome onNavigate={onNavigate} onSelectStudent={handleSelectStudent} />
      )}

      {/* 2. CHALLENGE MANAGEMENT */}
      {activeTab === "company-projects" && (
        <ProjectManagement onNavigate={onNavigate} />
      )}

      {/* 3. MULTI-STEP CREATION WIZARD */}
      {activeTab === "create-challenge" && (
        <ProjectCreationWizard onNavigate={onNavigate} />
      )}

      {/* 4. PIPELINE & SUBMISSIONS */}
      {activeTab === "company-applications" && (
        <ApplicationManagement 
          onNavigate={onNavigate} 
          onSelectStudent={handleSelectStudent} 
          onSelectApplication={setSelectedApp}
        />
      )}

      {/* 5. AI RECRUITMENT CO-PILOT */}
      {activeTab === "ai-recruiter" && (
        <AiRecruitmentCenter onNavigate={onNavigate} />
      )}

      {/* 6. SANDBOX PROJECT WORKSPACE */}
      {activeTab === "project-workspace" && (
        <CompanyProjectWorkspace onNavigate={onNavigate} />
      )}

      {/* 7. EMPLOYEE CONVERSIONS */}
      {activeTab === "employee-conversions" && (
        <EmployeeConversion onNavigate={onNavigate} />
      )}

      {/* 8. TALENT ANALYTICS */}
      {activeTab === "company-analytics" && (
        <CompanyAnalytics />
      )}

      {/* 9. ACADEMIC NETWORKS */}
      {activeTab === "university-management" && (
        <UniversityManagement />
      )}

      {/* 10. CENTRAL BOOKMARKS */}
      {activeTab === "company-bookmarks" && (
        <CompanyBookmarks 
          onNavigate={onNavigate} 
          onSelectStudent={handleSelectStudent} 
        />
      )}

      {/* 11. COMMUNICATIONS FEED */}
      {activeTab === "company-messaging" && (
        <CompanyMessaging onNavigate={onNavigate} />
      )}

      {/* 12. ROLE & RBAC GOVERNANCE */}
      {activeTab === "role-management" && (
        <RoleManagement />
      )}

      {/* 13. SETTINGS REGISTRY */}
      {activeTab === "company-settings" && (
        <CompanySettingsView />
      )}

      {/* 14. STUDENT REVIEW POPUP (DRILLDOWN TARGET) */}
      {activeTab === "student-review" && (
        <StudentProfileReview 
          studentId={selectedStudentId} 
          onNavigate={onNavigate} 
        />
      )}
    </div>
  );
}
