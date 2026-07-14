import React, { useState } from "react";
import { 
  ShieldCheck, Users, Lock, Plus, ToggleLeft, ToggleRight, 
  Trash2, Mail, CheckCircle2, UserCheck, Star, Sliders, AlertCircle
} from "lucide-react";
import { useToast } from "../ui/Toast";

export default function RoleManagement() {
  const { success, error, info } = useToast();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Recruiter");

  // Staff registry
  const [staff, setStaff] = useState([
    { id: "s1", name: "Marcus Aurelius", email: "marcus@horizonlabs.io", role: "Company Owner", status: "Active" },
    { id: "s2", name: "Sophia Loren", email: "sophia@horizonlabs.io", role: "HR Manager", status: "Active" },
    { id: "s3", name: "David Hasselhoff", email: "david@horizonlabs.io", role: "Project Manager", status: "Active" },
    { id: "s4", name: "Yuki Tanaka", email: "yuki@horizonlabs.io", role: "Mentor", status: "Pending Invite" }
  ]);

  // Roles permission mapping
  const [rolePermissions, setRolePermissions] = useState<any>({
    "Company Owner": { createChallenges: true, signContracts: true, viewAnalytics: true, inviteUsers: true },
    "HR Manager": { createChallenges: true, signContracts: true, viewAnalytics: true, inviteUsers: true },
    "Recruiter": { createChallenges: true, signContracts: false, viewAnalytics: true, inviteUsers: false },
    "Project Manager": { createChallenges: true, signContracts: false, viewAnalytics: false, inviteUsers: false },
    "Mentor": { createChallenges: false, signContracts: false, viewAnalytics: false, inviteUsers: false }
  });

  const [activeRoleIndex, setActiveRoleIndex] = useState("Recruiter");

  const handleTogglePermission = (field: string) => {
    setRolePermissions(prev => {
      const currentRoleData = prev[activeRoleIndex];
      const nextVal = !currentRoleData[field];
      success("Permissions Synchronized", `Updated "${field}" status for role: "${activeRoleIndex}".`);
      return {
        ...prev,
        [activeRoleIndex]: {
          ...currentRoleData,
          [field]: nextVal
        }
      };
    });
  };

  const handleInviteTeammate = () => {
    if (!inviteEmail.trim()) {
      error("Email Required", "Please input teammate email coordinate.");
      return;
    }
    setStaff(prev => [
      ...prev,
      { id: Date.now().toString(), name: inviteEmail.split("@")[0], email: inviteEmail, role: inviteRole, status: "Pending Invite" }
    ]);
    success("Invitation Sent", `Dispatched access key invitation to: ${inviteEmail}`);
    setInviteEmail("");
  };

  const handleRoleChange = (staffId: string, nextRole: string) => {
    setStaff(prev => prev.map(s => {
      if (s.id === staffId) {
        success("Role Updated", `Role for ${s.name} changed to: ${nextRole}`);
        return { ...s, role: nextRole };
      }
      return s;
    }));
  };

  const handleRemoveStaff = (id: string, name: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    success("Access Revoked", `Revoked access keys and credentials for "${name}".`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            Workspace Governance
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            Role & RBAC Security Center
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-light">
            Control seat allocations, manage granular role permissions, and grant access coordinates to corporate mentors.
          </p>
        </div>
      </div>

      {/* Main Grid: Staff Directory Left (7/12) and Permissions Config Right (5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Staff list & Invite (7/12) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-base text-neutral-900">Workspace Teammates</h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-light">Invite and assign directories to recruiters, hiring coordinates, and developer mentors.</p>
          </div>

          {/* List */}
          <div className="space-y-3">
            {staff.map((s) => (
              <div key={s.id} className="p-4 border border-neutral-200 rounded-2xl bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900">{s.name}</span>
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                      s.status === "Active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-neutral-100 text-neutral-500 border-neutral-200"
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono">{s.email}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select 
                    value={s.role}
                    onChange={(e) => handleRoleChange(s.id, e.target.value)}
                    className="bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-[10px] text-neutral-600 focus:outline-hidden"
                  >
                    <option value="Company Owner">Company Owner</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Mentor">Mentor</option>
                  </select>

                  <button 
                    onClick={() => handleRemoveStaff(s.id, s.name)}
                    className="p-2 hover:bg-rose-50 rounded-lg text-neutral-400 hover:text-rose-600 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Invite form */}
          <div className="border-t border-neutral-100 pt-6 space-y-3">
            <span className="text-xs font-bold text-neutral-800 block">Invite Team Member</span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-6 relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="co-worker@company.com"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3">
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs focus:outline-hidden text-neutral-600"
                >
                  <option value="Company Owner">Company Owner</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Mentor">Mentor</option>
                </select>
              </div>

              <button 
                onClick={handleInviteTeammate}
                className="sm:col-span-3 h-10 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Invite teammate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Permissions Configuration (5/12) */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-base text-neutral-900">Configure Permissions Matrix</h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-light">Toggle granular operational keys for roles below.</p>
          </div>

          {/* Active role category */}
          <div className="space-y-1 text-xs font-semibold text-neutral-500">
            <label className="text-neutral-700 block">Select Target Role</label>
            <select 
              value={activeRoleIndex}
              onChange={(e) => setActiveRoleIndex(e.target.value)}
              className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden text-neutral-800 font-bold"
            >
              {Object.keys(rolePermissions).map(roleName => (
                <option key={roleName} value={roleName}>{roleName}</option>
              ))}
            </select>
          </div>

          {/* Permissions switches list */}
          <div className="space-y-4 border-t border-neutral-100 pt-5 text-xs font-sans">
            {[
              { id: "createChallenges", label: "Build & Edit Code Challenges", desc: "Allows publishing custom sandbox tests to Marketplace" },
              { id: "signContracts", label: "Generate & Execute Hiring Contracts", desc: "Allows final offer validation and electronic signing" },
              { id: "viewAnalytics", label: "Read Vetting Reports & Metrics", desc: "Allows viewing productivity spreadsheets and demographic charts" },
              { id: "inviteUsers", label: "Allocate Teammate Seats", desc: "Allows sending workspace invitation keys to email coordinates" }
            ].map((p) => {
              const checked = rolePermissions[activeRoleIndex]?.[p.id] ?? false;
              return (
                <div key={p.id} className="flex justify-between items-start gap-4 p-2 hover:bg-neutral-50/50 rounded-xl transition-colors">
                  <div className="space-y-0.5">
                    <strong className="font-bold text-neutral-800">{p.label}</strong>
                    <p className="text-[10px] text-neutral-400 font-light leading-normal">{p.desc}</p>
                  </div>

                  <button 
                    onClick={() => handleTogglePermission(p.id)}
                    className="text-neutral-400 hover:text-neutral-800 cursor-pointer shrink-0 pt-0.5"
                  >
                    {checked ? (
                      <ToggleRight className="w-7 h-7 text-neutral-950" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-neutral-300" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
