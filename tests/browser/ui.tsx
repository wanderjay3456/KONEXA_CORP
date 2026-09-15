import React from 'react';
import { createRoot } from 'react-dom/client';
import CareerRoadmap from '../../src/components/student/CareerRoadmap';
import AiRecruitmentCenter from '../../src/components/company/AiRecruitmentCenter';
import { LocaleProvider } from '../../src/i18n/LocaleContext';
import { ToastProvider } from '../../src/components/ui/Toast';
import { FixtureProvider, useApp } from './appFixture';
import PendingGoogleRegistration from '../../src/components/auth/PendingGoogleRegistration';
import RequiredProfileSetup from '../../src/components/onboarding/RequiredProfileSetup';
import { company, student, admin } from './ids';
import AdminDecisionWorkspace from '../../src/components/dashboard/AdminDecisionWorkspace';
const parameters = new URLSearchParams(location.search);
const role = parameters.get('role') || 'student';
localStorage.setItem('konexa_locale', parameters.get('locale') || 'en');
const originalFetch = window.fetch.bind(window);
window.fetch = (input, options) => originalFetch(input, { ...options, headers: { ...options?.headers, 'x-test-actor': role === 'admin' ? admin : role === 'company' ? company : student } });
function SignupScreen() {
  const { currentUser, studentProfile, companyProfile } = useApp();
  if (currentUser.onboardingStatus === 'pending_google') return <PendingGoogleRegistration />;
  if (!(studentProfile || companyProfile)?.onboardingCompleted) return <RequiredProfileSetup />;
  return <h1>Profile ready without admin approval</h1>;
}
createRoot(document.getElementById('root')!).render(<LocaleProvider><ToastProvider><FixtureProvider>{parameters.has('signup') ? <SignupScreen /> : role === 'admin' ? <AdminDecisionWorkspace /> : role === 'company' ? <AiRecruitmentCenter onNavigate={() => {}} /> : <CareerRoadmap />}</FixtureProvider></ToastProvider></LocaleProvider>);
