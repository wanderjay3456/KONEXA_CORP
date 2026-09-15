// Isolated browser/API test doubles. Real DB permissions are covered by
// scripts/qa/signup-rollback.sql; this does not impersonate a real Google user.
import React, { useEffect, useState } from 'react';
import { submitGoogleRegistration } from '../../src/lib/googleRegistration';

export function SignupProvider({ context: Context, children }: { context: React.Context<any>; children: React.ReactNode }) {
  const [state, setState] = useState<any>(null);
  const reload = async () => { const value = await (await fetch('/__qa/signup')).json(); setState(value); };
  useEffect(() => { void reload(); }, []);
  if (!state) return <p>Loading signup fixture</p>;
  const updateProfile = async (profile: any) => {
    const response = await fetch('/__qa/signup/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    if (!response.ok) return false;
    setState(await response.json()); return true;
  };
  return <Context.Provider value={{ currentUser: state.user,
    studentProfile: state.user.role === 'student' ? state.profile : null,
    companyProfile: state.user.role === 'company' ? state.profile : null,
    completeGoogleRegistration: async (role: 'student' | 'company', consents: Record<string, unknown>) => {
      await submitGoogleRegistration(role, consents, { onboardingCompleted: false }); await reload();
    }, updateStudentProfile: updateProfile, updateCompanyProfile: updateProfile,
    refreshWorkspaceProfile: async () => {}, logoutUser: async () => {},
  }}>{children}</Context.Provider>;
}

export function getPendingGoogleAuthIntent() { return { role: new URLSearchParams(location.search).get('role') || 'student' }; }
export async function uploadPrivateFile(bucket: string, uid: string, file: File) { return `${uid}/qa-${bucket}-${file.name}`; }
