import React, { createContext, useContext, useEffect, useState } from 'react';
import { company, student, projectId, admin } from './ids';
import { SignupProvider } from './signupFixture';
const Context = createContext<any>(null);
export const useApp = () => useContext(Context);
export function FixtureProvider({ children }: { children: React.ReactNode }) {
  if (new URLSearchParams(location.search).has('signup')) return <SignupProvider context={Context}>{children}</SignupProvider>;
  return <WorkforceProvider>{children}</WorkforceProvider>;
}
function WorkforceProvider({ children }: { children: React.ReactNode }) {
  const role = new URLSearchParams(location.search).get('role') || 'student';
  const uid = role === 'admin' ? admin : role === 'company' ? company : student;
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => { void fetch('/__qa/profile').then(r => r.json()).then(setProfile); }, []);
  if (!profile) return <p>Loading QA fixture</p>;
  return <Context.Provider value={{ activeRole: role, currentUser: { uid, role }, studentProfile: role === 'student' ? profile : null,
    companyProfile: role === 'company' ? profile : null,
    projects: new URLSearchParams(location.search).has('empty') ? [] : [{ id: projectId, companyId: company, title: 'Market research', status: 'open' }], applications: [],
    updateStudentProfile: async (change: any) => {
      const response = await fetch('/__qa/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change) });
      if (!response.ok) return false; setProfile(await response.json()); return true;
    } }}>{children}</Context.Provider>;
}
