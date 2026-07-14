import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ApplicationStatus, Application } from "../../types";
import { 
  Users, Search, Filter, ArrowUpDown, Download, CheckCircle, 
  XCircle, Clock, Star, ShieldAlert, Sparkles, ChevronRight, 
  Grid, List, Check, Trash2, ArrowRight, Eye, Calendar, Award
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface ApplicationManagementProps {
  onNavigate: (tabId: string) => void;
  onSelectStudent: (studentId: string) => void;
  onSelectApplication: (app: Application) => void;
}

export default function ApplicationManagement({ onNavigate, onSelectStudent, onSelectApplication }: ApplicationManagementProps) {
  const { applications, reviewApplication, projects } = useApp();
  const { success, info } = useToast();

  // Selected applications for bulk actions
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "createdAt" | "studentName">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Multi-state management including custom ones (Shortlisted, Interview Requested, Withdrawn, Completed)
  // We can track custom student application statuses inside local state mapping
  const [localApps, setLocalApps] = useState<any[]>([]);

  React.useEffect(() => {
    if (applications.length > 0 && localApps.length === 0) {
      setLocalApps(applications.map(app => ({
        ...app,
        extendedStatus: app.status === "approved" ? "Accepted" : 
                        app.status === "rejected" ? "Rejected" : 
                        app.status === "reviewed" ? "Shortlisted" : "Pending",
        notes: "",
        history: [{ status: "Submitted", timestamp: app.createdAt, author: "System" }]
      })));
    } else if (applications.length > localApps.length) {
      const existingIds = localApps.map(a => a.id);
      const newApps = applications.filter(a => !existingIds.includes(a.id)).map(app => ({
        ...app,
        extendedStatus: "Pending",
        notes: "",
        history: [{ status: "Submitted", timestamp: app.createdAt, author: "System" }]
      }));
      setLocalApps(prev => [...newApps, ...prev]);
    }
  }, [applications]);

  // Bulk Actions
  const handleBulkAction = (action: "Shortlisted" | "Interview Requested" | "Accepted" | "Rejected") => {
    if (selectedApps.length === 0) return;

    setLocalApps(prev => prev.map(app => {
      if (selectedApps.includes(app.id)) {
        const authStatus = action === "Accepted" ? ApplicationStatus.APPROVED : 
                           action === "Rejected" ? ApplicationStatus.REJECTED : ApplicationStatus.REVIEWED;
        
        // Sync to global Supabase
        reviewApplication(app.id, authStatus, `Bulk action review: ${action}`, app.score || 85);
        
        return {
          ...app,
          extendedStatus: action,
          history: [...app.history, { status: action, timestamp: Date.now(), author: "Enterprise HR" }]
        };
      }
      return app;
    }));

    success("Bulk Action Success", `Updated ${selectedApps.length} applications to: ${action}.`);
    setSelectedApps([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApps(filteredApps.map(a => a.id));
    } else {
      setSelectedApps([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApps(prev => [...prev, id]);
    } else {
      setSelectedApps(prev => prev.filter(item => item !== id));
    }
  };

  const handleUpdateSingleStatus = (appId: string, status: string) => {
    setLocalApps(prev => prev.map(app => {
      if (app.id === appId) {
        const authStatus = status === "Accepted" ? ApplicationStatus.APPROVED : 
                           status === "Rejected" ? ApplicationStatus.REJECTED : ApplicationStatus.REVIEWED;
        
        reviewApplication(app.id, authStatus, `Status updated manually to: ${status}`, app.score || 80);

        return {
          ...app,
          extendedStatus: status,
          history: [...app.history, { status, timestamp: Date.now(), author: "Recruitment Manager" }]
        };
      }
      return app;
    }));
    success("Applicant Status Updated", `Candidate shifted to: ${status}.`);
  };

  // Simulated Export CSV
  const handleExportData = () => {
    info("Preparing export...", "Generating talent specifications audit CSV...");
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Candidate Name", "Project", "Evaluation Score", "Status", "Date"].join(",") + "\n"
      + filteredApps.map(a => [a.studentName, a.projectTitle, a.score, a.extendedStatus, new Date(a.createdAt).toLocaleDateString()].join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KONEXA_Hiring_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Export Complete", "Enterprise candidate logs successfully generated.");
  };

  // Filter & Search
  const filteredApps = localApps.filter(app => {
    const matchesSearch = app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.extendedStatus === statusFilter;
    const matchesProject = projectFilter === "all" || app.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Sorting
  const sortedApps = [...filteredApps].sort((a, b) => {
    let fieldA: any = a[sortBy];
    let fieldB: any = b[sortBy];

    if (sortBy === "studentName") {
      fieldA = a.studentName.toLowerCase();
      fieldB = b.studentName.toLowerCase();
    }

    if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            Hiring Workflow
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            Application Tracking Suite
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage student submissions, verify AI scorecards, apply bulk transitions, and export files.
          </p>
        </div>

        <button 
          onClick={handleExportData}
          className="h-10 px-4 bg-white border border-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4 text-neutral-900" />
          <span>Export Candidate Records</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-px">
        {["all", "Pending", "Shortlisted", "Interview Requested", "Accepted", "Rejected"].map((tab) => (
          <button 
            key={tab}
            onClick={() => setStatusFilter(tab === "all" ? "all" : tab)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              (statusFilter === "all" && tab === "all") || statusFilter === tab
                ? "border-black text-black"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            }`}
          >
            {tab === "all" ? "All Submissions" : tab}
          </button>
        ))}
      </div>

      {/* Bulk Action Panel */}
      {selectedApps.length > 0 && (
        <div className="bg-neutral-950 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slideUp">
          <span className="text-xs font-mono font-bold text-neutral-300">
            {selectedApps.length} candidates selected for bulk action:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button 
              onClick={() => handleBulkAction("Shortlisted")}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
            >
              Shortlist
            </button>
            <button 
              onClick={() => handleBulkAction("Interview Requested")}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
            >
              Request Interview
            </button>
            <button 
              onClick={() => handleBulkAction("Accepted")}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
            >
              Approve & Offer
            </button>
            <button 
              onClick={() => handleBulkAction("Rejected")}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Advanced Filters Block */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or challenge..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-hidden"
          />
        </div>

        {/* Project filter */}
        <select 
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-600 focus:outline-hidden"
        >
          <option value="all">All Published Challenges</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>

        {/* Sorters */}
        <div className="flex gap-2 justify-end">
          <button 
            onClick={() => toggleSort("score")}
            className="px-3 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 text-neutral-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Score</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button 
            onClick={() => toggleSort("createdAt")}
            className="px-3 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 text-neutral-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Date</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Grid List */}
      {sortedApps.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-neutral-300 mx-auto" />
          <p className="text-xs text-neutral-500 font-light">No submissions matched your current search filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-200 text-neutral-400 font-semibold text-[10px] uppercase tracking-wider font-mono">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={selectedApps.length === filteredApps.length && filteredApps.length > 0}
                      className="rounded"
                    />
                  </th>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Challenge</th>
                  <th className="p-4 text-center">AI Match score</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sortedApps.map((app) => (
                  <tr key={app.id} className="hover:bg-neutral-50/30 transition-colors">
                    <td className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedApps.includes(app.id)}
                        onChange={(e) => handleSelectRow(app.id, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <span 
                          onClick={() => {
                            onSelectStudent(app.studentId);
                            onNavigate("student-review");
                          }}
                          className="font-bold text-neutral-900 hover:underline cursor-pointer"
                        >
                          {app.studentName}
                        </span>
                        <div className="text-[10px] text-neutral-400 font-light mt-0.5">Applied via Sandbox IDE</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-neutral-600">{app.projectTitle}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-mono font-bold text-black bg-neutral-100 border border-neutral-200/50 px-2 py-0.5 rounded-lg text-[11px]">
                        {app.score || 85}/100
                      </span>
                    </td>
                    <td className="p-4">
                      <select 
                        value={app.extendedStatus}
                        onChange={(e) => handleUpdateSingleStatus(app.id, e.target.value)}
                        className={`text-[10px] font-mono font-bold border rounded-lg px-2 py-1 focus:outline-hidden ${
                          app.extendedStatus === "Accepted" ? "bg-teal-50 text-teal-600 border-teal-200" :
                          app.extendedStatus === "Rejected" ? "bg-rose-50 text-rose-600 border-rose-200" :
                          app.extendedStatus === "Shortlisted" ? "bg-blue-50 text-blue-600 border-blue-200" :
                          "bg-amber-50 text-amber-600 border-amber-200"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview Requested">Interview</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => {
                            onSelectApplication(app);
                            onNavigate("company-workspace");
                          }}
                          title="Examine Code Submission"
                          className="p-1.5 bg-neutral-50 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 border border-neutral-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review History Audit feed */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-display font-bold text-sm text-neutral-900">Application Audit Logs</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Chronological record of vetting and review activities.</p>
        </div>

        <div className="space-y-3 font-mono text-[11px]">
          {sortedApps.slice(0, 4).map((app, idx) => (
            <div key={idx} className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-600 font-bold">{app.studentName}</span>
                <span className="text-neutral-400">reviewed for</span>
                <span className="text-neutral-800 font-semibold truncate max-w-xs">"{app.projectTitle}"</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{app.extendedStatus}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
