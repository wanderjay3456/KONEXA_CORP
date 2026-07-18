import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Bookmark, Users, Briefcase, GraduationCap, FileText, Search, 
  Trash2, ArrowRight, ExternalLink, Sliders
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface CompanyBookmarksProps {
  onNavigate: (tabId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export default function CompanyBookmarks({ onNavigate, onSelectStudent }: CompanyBookmarksProps) {
  const { studentProfile, projects } = useApp();
  const { success, info } = useToast();

  const [activeCategory, setActiveCategory] = useState<"all" | "student" | "project" | "university" | "report">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Stateful bookmarks listing
  const [bookmarks, setBookmarks] = useState<Array<{ id: string; type: string; targetId: string; title: string; subtitle: string; extra: string; dateSaved: string }>>([]);

  const handleRemoveBookmark = (id: string, title: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    success("Bookmark Removed", `Successfully removed "${title}" from saved workspace.`);
  };

  const filteredBookmarks = bookmarks.filter(b => {
    const matchesCategory = activeCategory === "all" || b.type === activeCategory;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            Workspace Storage
          </span>
          <h1 className="font-display font-bold text-3xl text-neutral-900 tracking-tight mt-1">
            Centralized Bookmarks Hub
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-light">
            Quick-access registry for high-performance students, target campuses, active projects, and vetting reports.
          </p>
        </div>
      </div>

      {/* Categories Tab Selector & Search bar */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 flex flex-wrap gap-1">
          {[
            { id: "all", label: "All Bookmarks" },
            { id: "student", label: "Students" },
            { id: "project", label: "Challenges" },
            { id: "university", label: "Universities" },
            { id: "report", label: "Reports" }
          ].map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeCategory === cat.id ? "bg-black text-white" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative md:col-span-4 text-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved elements..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Bookmarks Grid */}
      {filteredBookmarks.length === 0 ? (
        <div className="bg-white border border-neutral-200 p-12 rounded-3xl text-center space-y-2">
          <Bookmark className="w-8 h-8 text-neutral-300 mx-auto" />
          <p className="text-xs text-neutral-400 font-light">No saved entries matched your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookmarks.map((b) => (
            <div key={b.id} className="bg-white border border-neutral-200 rounded-2xl p-5 flex items-start justify-between gap-4 hover:border-neutral-300 transition-all">
              <div className="flex gap-3.5 items-start min-w-0">
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  b.type === "student" ? "bg-blue-50 border-blue-100 text-blue-600" :
                  b.type === "project" ? "bg-purple-50 border-purple-100 text-purple-600" :
                  b.type === "university" ? "bg-amber-50 border-amber-100 text-amber-500" :
                  "bg-neutral-50 border-neutral-100 text-neutral-600"
                }`}>
                  {b.type === "student" && <Users className="w-4.5 h-4.5" />}
                  {b.type === "project" && <Briefcase className="w-4.5 h-4.5" />}
                  {b.type === "university" && <GraduationCap className="w-4.5 h-4.5" />}
                  {b.type === "report" && <FileText className="w-4.5 h-4.5" />}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <h4 className="text-xs font-bold text-neutral-900 truncate">{b.title}</h4>
                  <p className="text-[11px] text-neutral-400 truncate font-light leading-relaxed">{b.subtitle}</p>
                  
                  <div className="flex items-center gap-3 pt-1.5 text-[9px] font-mono font-bold text-neutral-400">
                    <span className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded-lg">{b.extra}</span>
                    <span>Saved: {b.dateSaved}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 shrink-0 items-center">
                <button 
                  onClick={() => {
                    if (b.type === "student") {
                      onSelectStudent(b.targetId);
                      onNavigate("student-review");
                    } else if (b.type === "project") {
                      onNavigate("company-projects");
                    } else if (b.type === "university") {
                      onNavigate("university-management");
                    } else {
                      onNavigate("company-analytics");
                    }
                  }}
                  className="p-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-500 hover:text-neutral-900 cursor-pointer"
                  title="Navigate to Element"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleRemoveBookmark(b.id, b.title)}
                  className="p-1.5 hover:bg-rose-50 rounded-lg text-neutral-400 hover:text-rose-600 cursor-pointer"
                  title="Remove Bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
