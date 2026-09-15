import React, { createContext, useContext, useEffect, useState } from 'react';
import { company, student, projectId } from './ids';
const Context = createContext<any>(null);
export const useApp = () => useContext(Context);
export function FixtureProvider({ children }: { children: React.ReactNode }) {
  const role = new URLSearchParams(location.search).get('role') || 'student';
  const uid = role === 'company' ? company : student;
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => { void fetch('/__qa/profile').then(r => r.json()).then(setProfile); }, []);
  if (!profile) return <p>Loading QA fixture</p>;
  return <Context.Provider value={{ currentUser: { uid, role }, studentProfile: role === 'student' ? profile : null,
    companyProfile: role === 'company' ? profile : null,
    projects: new URLSearchParams(location.search).has('empty') ? [] : [{ id: projectId, companyId: company, title: 'Market research', status: 'open' }], applications: [],
    updateStudentProfile: async (change: any) => {
      const response = await fetch('/__qa/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change) });
      if (!response.ok) return false; setProfile(await response.json()); return true;
    } }}>{children}</Context.Provider>;
}
