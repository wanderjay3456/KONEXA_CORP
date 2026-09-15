import React, { Suspense, lazy, useState } from "react";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { AppProvider, useApp } from "./context/AppContext";
import { UserRole } from "./types";
import LandingHero from "./components/landing/LandingHero";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import { StatusPage } from "./components/status/StatusPage";
import AutoTranslator from "./i18n/AutoTranslator";
import { LocaleProvider } from "./i18n/LocaleContext";
import { getCompanyCompletionErrors, getStudentCompletionErrors } from "./lib/profileCompletion";

const StudentDashboard = lazy(() => import("./components/dashboard/StudentDashboard"));
const CompanyDashboard = lazy(() => import("./components/dashboard/CompanyDashboard"));
const TrustOperationsCenter = lazy(() => import("./components/trust/TrustOperationsCenter"));
const AdminDashboard = lazy(() => import("./components/dashboard/AdminDashboard"));
const RequiredProfileSetup = lazy(() => import("./components/onboarding/RequiredProfileSetup"));
const PendingGoogleRegistration = lazy(() => import("./components/auth/PendingGoogleRegistration"));
const SupportChatbot = lazy(() => import('./components/support/SupportChatbot'));

function WorkspaceLoading() {
  return (
    <div className="flex min-h-[50dvh] flex-1 items-center justify-center" role="status" aria-live="polite">
      <div className="w-full max-w-sm space-y-3 px-6">
        <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
        <div className="h-8 w-full animate-pulse rounded bg-neutral-200" />
        <div className="h-20 w-full animate-pulse rounded bg-neutral-100" />
        <span className="sr-only">Loading workspace</span>
      </div>
    </div>
  );
}

function AppContent() {
  const { activeRole, setActiveRole, currentUser, studentProfile, companyProfile, logoutUser, isAuthReady } = useApp();
  
  // Track active tab within each dashboard role
  const [activeTab, setActiveTab] = useState("career-home");

  const handleEnterApp = (role: UserRole) => {
    setActiveRole(role);
    // Set matching default tabs
    if (role === UserRole.STUDENT) setActiveTab("career-home");
    else if (role === UserRole.COMPANY) setActiveTab("company-home");
    else if (role === UserRole.ADMIN) setActiveTab("admin-logs");
    else if (role === UserRole.AI) setActiveTab("ai-overview");
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  // Sync default tabs when role is switched from Navbar dropdown
  React.useEffect(() => {
    if (activeRole === UserRole.STUDENT) setActiveTab("career-home");
    else if (activeRole === UserRole.COMPANY) setActiveTab("company-home");
    else if (activeRole === UserRole.ADMIN) setActiveTab("admin-logs");
    else if (activeRole === UserRole.AI) setActiveTab("ai-overview");
  }, [activeRole]);

  if (!isAuthReady) {
    return <WorkspaceLoading />;
  }

  if (!currentUser) {
    return <LandingHero onEnterApp={handleEnterApp} />;
  }

  if (currentUser.onboardingStatus === "pending_google") {
    return <Suspense fallback={<WorkspaceLoading />}><PendingGoogleRegistration /></Suspense>;
  }

  // Authentication creates the account; onboarding makes it usable. Keep
  // incomplete users out of business screens until every required profile
  // field and document has been persisted successfully.
  if (currentUser.role === UserRole.STUDENT && (!studentProfile?.onboardingCompleted || Object.keys(getStudentCompletionErrors(studentProfile)).length > 0)) {
    return <Suspense fallback={<WorkspaceLoading />}><RequiredProfileSetup key={currentUser.uid} /></Suspense>;
  }
  if (currentUser.role === UserRole.COMPANY && (!companyProfile?.onboardingCompleted || Object.keys(getCompanyCompletionErrors(companyProfile)).length > 0)) {
    return <Suspense fallback={<WorkspaceLoading />}><RequiredProfileSetup key={currentUser.uid} /></Suspense>;
  }

  return (
    <div id="app-workspace" data-auto-translate className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar onLogout={handleLogout} onNavigate={setActiveTab} />

      {/* Main Body split */}
      <div className="flex-1 flex relative">
        {/* Left collapsable sidebar */}
        {(activeRole === UserRole.STUDENT || activeRole === UserRole.COMPANY) && (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* Dynamic central workspace */}
        <main className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
          <Suspense fallback={<WorkspaceLoading />}>
          {activeTab === "trust-operations" || ((activeRole === UserRole.STUDENT || activeRole === UserRole.COMPANY) && ["workspace", "company-workspace"].includes(activeTab)) ? (
            <TrustOperationsCenter />
          ) : (
            <>
              {activeRole === UserRole.STUDENT && (
                <StudentDashboard activeTab={activeTab} onNavigate={setActiveTab} />
              )}
              {activeRole === UserRole.COMPANY && (
                <CompanyDashboard activeTab={activeTab} onNavigate={setActiveTab} />
              )}
              {activeRole === UserRole.ADMIN && <AdminDashboard />}
              {activeRole !== UserRole.STUDENT && activeRole !== UserRole.COMPANY && activeRole !== UserRole.ADMIN && <TrustOperationsCenter />}
            </>
          )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  if (window.location.pathname.replace(/\/$/, "") === "/status") {
    return <StatusPage />;
  }

  return (
    <ToastProvider>
      <LocaleProvider>
        <AppProvider>
          <AutoTranslator />
          <AppContent />
          <Suspense fallback={null}><SupportChatbot /></Suspense>
        </AppProvider>
      </LocaleProvider>
    </ToastProvider>
  );
}
