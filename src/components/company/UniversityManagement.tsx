import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Building2, GraduationCap, Search, Star, Bookmark, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, Sliders, Info, RefreshCw, BarChart2
} from "lucide-react";
import { useToast } from "../ui/Toast";

export default function UniversityManagement() {
  const { success, info } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniv1, setSelectedUniv1] = useState("snu");
  const [selectedUniv2, setSelectedUniv2] = useState("kaist");

  // Universities database
  const [universities, setUniversities] = useState([
    {
      id: "snu",
      name: "Seoul National University",
      abbrev: "SNU",
      logo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=120",
      country: "South Korea",
      activeStudents: 154,
      avgTrustScore: 84,
      avgMatchScore: 86,
      topSkills: ["React", "TypeScript", "WASM", "PostgreSQL"],
      partnershipStatus: "Active Partner",
      favorite: true,
      partnershipDetails: "MoU signed March 2025. Direct integration with CS curriculum."
    },
    {
      id: "kaist",
      name: "KAIST",
      abbrev: "KAIST",
      logo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=120",
      country: "South Korea",
      activeStudents: 112,
      avgTrustScore: 88,
      avgMatchScore: 89,
      topSkills: ["Go", "Docker", "gRPC", "Redis"],
      partnershipStatus: "Active Partner",
      favorite: false,
      partnershipDetails: "Engineering internship feeder pool arrangement since June 2024."
    },
    {
      id: "nus",
      name: "National University of Singapore",
      abbrev: "NUS",
      logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&q=80&w=120",
      country: "Singapore",
      activeStudents: 98,
      avgTrustScore: 79,
      avgMatchScore: 81,
      topSkills: ["Python", "PyTorch", "Transformers", "React"],
      partnershipStatus: "Pending Approval",
      favorite: false,
      partnershipDetails: "Syllabus mapping stage. Proposed Launch Q3 2026."
    }
  ]);

  const handleToggleFavorite = (id: string) => {
    setUniversities(prev => prev.map(u => {
      if (u.id === id) {
        const nextState = !u.favorite;
        success(nextState ? "Added to Favorites" : "Removed from Favorites", `Successfully modified bookmark status for "${u.name}".`);
        return { ...u, favorite: nextState };
      }
      return u;
    }));
  };

  const handleRequestPartnership = (name: string) => {
    success("Partnership Request Transmitted", `Initiated formal CS department syllabus integration proposal to: "${name}".`);
  };

  const filteredUnivs = universities.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const u1 = universities.find(u => u.id === selectedUniv1) || universities[0];
  const u2 = universities.find(u => u.id === selectedUniv2) || universities[1];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            Academic Networks
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            University Partnerships
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-light">
            Monitor partner campus talent pools, request syllabus integrations, and compare demographics side-by-side.
          </p>
        </div>
      </div>

      {/* Main Grid: Directory Left (7/12) and Side-by-Side Compare Right (5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Directory & Search (7/12) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-base text-neutral-900">Institutional Directory</h3>
            
            <div className="relative w-64 text-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search university or country..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 focus:outline-hidden font-light"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredUnivs.map((univ) => (
              <div key={univ.id} className="border border-neutral-200 hover:border-neutral-300 rounded-2xl p-5 bg-neutral-50/50 space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
                <div className="flex gap-4 items-start min-w-0 flex-1">
                  <div className="p-2.5 bg-white border border-neutral-200 rounded-2xl shrink-0">
                    <GraduationCap className="w-8 h-8 text-neutral-900" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">{univ.name}</h4>
                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border ${
                        univ.partnershipStatus === "Active Partner" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-neutral-100 text-neutral-500 border-neutral-200"
                      }`}>
                        {univ.partnershipStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 font-mono">{univ.country} • {univ.activeStudents} active nodes enrolled</p>
                    <p className="text-[11px] text-neutral-500 font-light pt-0.5 line-clamp-1">"{univ.partnershipDetails}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 md:border-l md:border-neutral-100 md:pl-6">
                  <button 
                    onClick={() => handleToggleFavorite(univ.id)}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                      univ.favorite 
                        ? "bg-amber-50 border-amber-200 text-amber-500" 
                        : "bg-white border-neutral-200 text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>

                  {univ.partnershipStatus !== "Active Partner" && (
                    <button 
                      onClick={() => handleRequestPartnership(univ.name)}
                      className="px-3.5 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Request Partner CS Sync
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side-by-Side Comparative (5/12) */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-display font-bold text-base text-neutral-900">Side-by-Side Spec Comparison</h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-light">Examine aggregate grading matrices of student bodies before allocating challenge rewards.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="font-bold text-neutral-700">University A</label>
              <select 
                value={selectedUniv1}
                onChange={(e) => setSelectedUniv1(e.target.value)}
                className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 focus:outline-hidden"
              >
                {universities.map(u => (
                  <option key={u.id} value={u.id}>{u.abbrev}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-neutral-700">University B</label>
              <select 
                value={selectedUniv2}
                onChange={(e) => setSelectedUniv2(e.target.value)}
                className="w-full h-10 bg-neutral-50 border border-neutral-200 rounded-xl px-3 focus:outline-hidden"
              >
                {universities.map(u => (
                  <option key={u.id} value={u.id}>{u.abbrev}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix Sheet */}
          <div className="border border-neutral-200 rounded-2xl overflow-hidden font-sans text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 font-bold border-b border-neutral-200 text-neutral-500">
                  <th className="p-3">Metric Indicator</th>
                  <th className="p-3">{u1.abbrev}</th>
                  <th className="p-3">{u2.abbrev}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-light">
                <tr>
                  <td className="p-3 font-medium text-neutral-800">Active Students</td>
                  <td className="p-3 font-mono text-black font-bold">{u1.activeStudents}</td>
                  <td className="p-3 font-mono text-black font-bold">{u2.activeStudents}</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-neutral-800">Avg Trust Score</td>
                  <td className="p-3 font-mono text-blue-600 font-bold">{u1.avgTrustScore}/100</td>
                  <td className="p-3 font-mono text-blue-600 font-bold">{u2.avgTrustScore}/100</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-neutral-800">Avg AI Match alignment</td>
                  <td className="p-3 font-mono text-emerald-600 font-bold">{u1.avgMatchScore}%</td>
                  <td className="p-3 font-mono text-emerald-600 font-bold">{u2.avgMatchScore}%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-neutral-800">Top Skills Focus</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u1.topSkills.slice(0, 2).map((s, i) => (
                        <span key={i} className="text-[9px] bg-neutral-100 text-neutral-600 px-1 py-0.5 rounded font-bold font-mono uppercase">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u2.topSkills.slice(0, 2).map((s, i) => (
                        <span key={i} className="text-[9px] bg-neutral-100 text-neutral-600 px-1 py-0.5 rounded font-bold font-mono uppercase">{s}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
