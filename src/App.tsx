import React, { useState } from "react";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { AppProvider, useApp } from "./context/AppContext";
import { AiDataProvider } from "./context/AiContext";
import { UserRole } from "./types";
import LandingHero from "./components/landing/LandingHero";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import StudentDashboard from "./components/dashboard/StudentDashboard";
import CompanyDashboard from "./components/dashboard/CompanyDashboard";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import AiAgentWorkspace from "./components/dashboard/AiAgentWorkspace";
import StudentOnboarding from "./components/onboarding/StudentOnboarding";
import CompanyOnboarding from "./components/onboarding/CompanyOnboarding";
import DesignSystemShowcase from "./components/dashboard/DesignSystemShowcase";
import IdentityCenter from "./components/dashboard/IdentityCenter";
import IntelligenceCenter from "./components/dashboard/IntelligenceCenter";

function AppContent() {
  const { activeRole, setActiveRole, studentProfile, companyProfile, updateStudentProfile, updateCompanyProfile, logoutUser } = useApp();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Track active tab within each dashboard role
  const [activeTab, setActiveTab] = useState("challenges");

  const handleEnterApp = (role: UserRole) => {
    setActiveRole(role);
    // Set matching default tabs
    if (role === UserRole.STUDENT) setActiveTab("challenges");
    else if (role === UserRole.COMPANY) setActiveTab("company-home");
    else if (role === UserRole.ADMIN) setActiveTab("admin-logs");
    else if (role === UserRole.AI) setActiveTab("ai-overview");
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
  };

  // Sync default tabs when role is switched from Navbar dropdown
  React.useEffect(() => {
    if (activeRole === UserRole.STUDENT) setActiveTab("challenges");
    else if (activeRole === UserRole.COMPANY) setActiveTab("company-home");
    else if (activeRole === UserRole.ADMIN) setActiveTab("admin-logs");
    else if (activeRole === UserRole.AI) setActiveTab("ai-overview");
  }, [activeRole]);

  if (!isLoggedIn) {
    return <LandingHero onEnterApp={handleEnterApp} />;
  }

  // Route newly registered or un-onboarded profiles to premium interactive onboarding wizards
  const showStudentOnboarding = activeRole === UserRole.STUDENT && studentProfile && !(studentProfile as any).onboardingCompleted;
  const showCompanyOnboarding = activeRole === UserRole.COMPANY && companyProfile && !(companyProfile as any).onboardingCompleted;

  if (showStudentOnboarding) {
    return (
      <StudentOnboarding 
        onComplete={async () => {
          if (studentProfile) {
            await updateStudentProfile({ onboardingCompleted: true } as any);
          }
        }} 
      />
    );
  }

  if (showCompanyOnboarding) {
    return (
      <CompanyOnboarding 
        onComplete={async () => {
          if (companyProfile) {
            await updateCompanyProfile({ onboardingCompleted: true } as any);
          }
        }} 
      />
    );
  }

  return (
    <div id="app-workspace" className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar onLogout={handleLogout} />

      {/* Main Body split */}
      <div className="flex-1 flex relative">
        {/* Left collapsable sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic central workspace */}
        <main className="flex-1 flex flex-col min-w-0">
          {activeTab === "design-system" ? (
            <DesignSystemShowcase />
          ) : activeTab === "identity-center" ? (
            <IdentityCenter />
          ) : activeTab === "intelligence-center" ? (
            <IntelligenceCenter />
          ) : (
            <>
              {activeRole === UserRole.STUDENT && (
                <StudentDashboard activeTab={activeTab} onNavigate={setActiveTab} />
              )}
              {activeRole === UserRole.COMPANY && (
                <CompanyDashboard activeTab={activeTab} onNavigate={setActiveTab} />
              )}
              {activeRole === UserRole.ADMIN && (
                <AdminDashboard activeTab={activeTab} />
              )}
              {activeRole === UserRole.AI && (
                <AiAgentWorkspace activeTab={activeTab} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AiDataProvider>
          <AppContent />
        </AiDataProvider>
      </AppProvider>
    </ToastProvider>
  );
}
