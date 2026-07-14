import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  FileText, Briefcase, Award, ShieldCheck, DollarSign, Calendar, 
  Sparkles, Check, CheckCircle2, RefreshCw, ChevronRight, Lock, 
  Download, FileSpreadsheet, Send
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface EmployeeConversionProps {
  onNavigate: (tabId: string) => void;
}

export default function EmployeeConversion({ onNavigate }: EmployeeConversionProps) {
  const { studentProfile } = useApp();
  const { success, error, info } = useToast();

  const [selectedCandidateId, setSelectedCandidateId] = useState("usr_fndtn_konexa_99");
  const [jobTitle, setJobTitle] = useState("Junior Platform Engineer");
  const [salary, setSalary] = useState("$125,000");
  const [equity, setEquity] = useState("0.10%");
  const [startDate, setStartDate] = useState("August 1, 2026");
  const [department, setDepartment] = useState("Platform Infrastructure");
  const [probationPeriod, setProbationPeriod] = useState("Exempted (Waived due to Sandbox evidence)");
  const [contractStatus, setContractStatus] = useState<"Draft" | "Sent" | "Signed" | "Rejected">("Draft");
  
  // Local ledger of verified historical conversions
  const [conversionLedger, setConversionLedger] = useState([
    { id: "h1", name: "Sarah Jenkins", role: "Frontend UI Developer", school: "Seoul National University", salary: "$110,000", trustScore: 89, date: "June 12, 2026", status: "Active" },
    { id: "h2", name: "Takashi Saito", role: "Rust WASM Engineer", school: "University of Tokyo", salary: "$140,000", trustScore: 94, date: "May 28, 2026", status: "Active" }
  ]);

  // Candidates list mapping sandbox metrics
  const candidates = [
    { id: "usr_fndtn_konexa_99", name: studentProfile?.name || "Alex Rivera", school: "Seoul National University", trustScore: studentProfile?.trustScore || 82, performanceScore: 94, projectsCount: 1 },
    { id: "std_2", name: "Min-jun Kim", school: "KAIST", trustScore: 89, performanceScore: 91, projectsCount: 2 },
    { id: "std_3", name: "Chloe Chen", school: "National University of Singapore", trustScore: 78, performanceScore: 88, projectsCount: 1 }
  ];

  const activeCand = candidates.find(c => c.id === selectedCandidateId) || candidates[0];

  const handleGenerateContract = () => {
    success("Offer Draft Generated", "Vetted contract draft formatted successfully below.");
    setContractStatus("Draft");
  };

  const handleSendOffer = () => {
    setContractStatus("Sent");
    success("Offer Transmitted", `Employment package sent to ${activeCand.name}. Verification status set to Sent.`);
  };

  const handleSimulateSign = () => {
    setContractStatus("Signed");
    success("Contract Fully Executed!", `Congratulations! ${activeCand.name} signed the employment contract and is now registered in your Corporate Talent Node.`);
    
    // Add to verified ledger
    setConversionLedger(prev => [
      {
        id: Date.now().toString(),
        name: activeCand.name,
        role: jobTitle,
        school: activeCand.school,
        salary: salary,
        trustScore: activeCand.trustScore,
        date: "Just now",
        status: "Active"
      },
      ...prev
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            End-to-End Vetting
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            Student-to-Employee Conversions
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Formulate high-integrity hiring offers, construct standard employment agreements, and audit signing status.
          </p>
        </div>
      </div>

      {/* Main Grid: Form Left (5/12) and Legal Render Right (7/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Form Controls */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-base text-neutral-900">Configure Offer Terms</h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-light">Enter compensation guidelines. All structures sync to active sandbox history logs.</p>
          </div>

          <div className="space-y-4 text-xs font-sans">
            {/* Target Candidate */}
            <div className="space-y-1">
              <label className="font-bold text-neutral-700 block">Select Candidate</label>
              <select 
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.school})</option>
                ))}
              </select>
            </div>

            {/* Target Job Title */}
            <div className="space-y-1">
              <label className="font-bold text-neutral-700 block">Corporate Job Title</label>
              <input 
                type="text" 
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="font-bold text-neutral-700 block">Target Department</label>
              <input 
                type="text" 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Annual Salary */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Annual Base Salary</label>
                <input 
                  type="text" 
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
                />
              </div>

              {/* Equity Options */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Equity Options (%)</label>
                <input 
                  type="text" 
                  value={equity}
                  onChange={(e) => setEquity(e.target.value)}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Onboarding Start Date</label>
                <input 
                  type="text" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
                />
              </div>

              {/* Probation period */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">Probation Period Status</label>
                <input 
                  type="text" 
                  value={probationPeriod}
                  onChange={(e) => setProbationPeriod(e.target.value)}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-neutral-100 flex gap-2">
              <button 
                onClick={handleGenerateContract}
                className="flex-1 h-10 bg-neutral-950 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Compile Document</span>
              </button>
              
              {contractStatus === "Draft" && (
                <button 
                  onClick={handleSendOffer}
                  className="h-10 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Send Offer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Legal Agreement Rendering Frame */}
        <div className="lg:col-span-7 bg-neutral-50 border border-neutral-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-neutral-200 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-neutral-800" />
              <h3 className="font-display font-black text-sm text-neutral-900 uppercase tracking-tight">Vetted Service Agreement Preview</h3>
            </div>
            
            <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg border ${
              contractStatus === "Signed" ? "bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse" :
              contractStatus === "Sent" ? "bg-blue-50 text-blue-600 border-blue-100" :
              "bg-neutral-100 text-neutral-600 border-neutral-200"
            }`}>
              Contract: {contractStatus}
            </span>
          </div>

          {/* Legal Scroll Sheet */}
          <div className="h-[28rem] overflow-y-auto bg-white border border-neutral-200 rounded-2xl p-6 text-[10px] leading-relaxed text-neutral-600 font-sans shadow-xs space-y-4 scrollbar font-light">
            <div className="text-center font-bold text-neutral-900 border-b border-neutral-100 pb-3 uppercase text-xs tracking-wider space-y-1">
              <h4>KONEXA STANDARD ENTERPRISE EMPLOYMENT AGREEMENT</h4>
              <p className="text-[9px] font-mono font-normal text-neutral-400">Sandbox Verified Verification Node: SN-{activeCand.trustScore}</p>
            </div>

            <p>
              This Service and Employment Agreement (the "Agreement") is compiled and executed in real-time within the KONEXA Talents Ecosystem.
            </p>

            <div className="space-y-1 pt-1">
              <h5 className="font-bold text-neutral-900 uppercase">THE PARTIES</h5>
              <p>
                <strong>FIRST PARTY (EMPLOYER):</strong> Horizon Corporate Labs, represented by its Recruiting Lead.
              </p>
              <p>
                <strong>SECOND PARTY (CANDIDATE):</strong> {activeCand.name}, verified graduate of {activeCand.school}.
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <h5 className="font-bold text-neutral-900 uppercase">SANDBOX VETTING CRITERIA AUDIT</h5>
              <p>
                This covenant is established in direct recognition of Sandbox compiler metrics, with historical evaluations as certified evidence:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Vetted Platform Trust Index: <strong>{activeCand.trustScore}/100</strong></li>
                <li>Performance Compilation Level: <strong>{activeCand.performanceScore}/100</strong></li>
                <li>Completed Corporate Challenges: <strong>{activeCand.projectsCount} verified sandbox projects</strong></li>
              </ul>
            </div>

            <div className="space-y-1 pt-1">
              <h5 className="font-bold text-neutral-900 uppercase">1. ASSIGNMENT & DUTIES</h5>
              <p>
                The Second Party is designated as <strong>{jobTitle}</strong> in the <strong>{department}</strong> division, reporting directly to assigned Corporate Architects.
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <h5 className="font-bold text-neutral-900 uppercase">2. COMPENSATION & INCENTIVES</h5>
              <p>
                The First Party shall provide a gross annual base salary of <strong>{salary}</strong>, payable on a monthly basis, alongside a <strong>{equity}</strong> equity options incentive subject to standard 1-year cliff vesting.
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <h5 className="font-bold text-neutral-900 uppercase">3. PROBATION STATUS</h5>
              <p>
                The standard 3-month probationary testing cycle is: <strong>{probationPeriod}</strong>.
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <h5 className="font-bold text-neutral-900 uppercase">4. INTELLECTUAL PROPERTY & TRUST COVENANTS</h5>
              <p>
                All software assets, compiled structures, and layout nodes generated by the Second Party within sandbox workspaces remain exclusive corporate assets of the First Party.
              </p>
            </div>

            {contractStatus === "Signed" && (
              <div className="border-t border-dashed border-neutral-200 pt-4 flex justify-between font-mono text-[9px] text-neutral-400">
                <div>Employer: [SIGNED ELECTRONICALLY]</div>
                <div>Employee: {activeCand.name} [SIGNED ELECTRONICALLY]</div>
              </div>
            )}
          </div>

          {/* Electronic sign controls */}
          {contractStatus === "Sent" && (
            <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-teal-800 font-light">
                Offer transmitted successfully. Simulating candidate signature loop...
              </div>
              <button 
                onClick={handleSimulateSign}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Simulate Sign Contract
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Verified Corporate Ledger */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-display font-bold text-sm text-neutral-900">Verified Corporate Hiring Ledger</h3>
          <p className="text-xs text-neutral-400 mt-0.5 font-light">Tamper-proof ledger logs of all candidate conversions executed on the KONEXA operating system.</p>
        </div>

        <div className="overflow-x-auto text-[11px] font-mono leading-normal">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400">
                <th className="pb-2">Name</th>
                <th className="pb-2">Corporate Role</th>
                <th className="pb-2">University</th>
                <th className="pb-2">Compensation</th>
                <th className="pb-2">Vetted Trust</th>
                <th className="pb-2 text-right">Conversion Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {conversionLedger.map((led) => (
                <tr key={led.id} className="text-neutral-600">
                  <td className="py-2.5 font-bold text-neutral-800">{led.name}</td>
                  <td className="py-2.5">{led.role}</td>
                  <td className="py-2.5">{led.school}</td>
                  <td className="py-2.5">{led.salary}</td>
                  <td className="py-2.5">SN-{led.trustScore}</td>
                  <td className="py-2.5 text-right text-neutral-400">{led.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
