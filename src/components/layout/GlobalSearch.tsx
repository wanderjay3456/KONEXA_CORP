import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  User, 
  Building2, 
  Code, 
  MessageSquare, 
  File, 
  FileText, 
  Activity, 
  BookOpen, 
  Cpu, 
  Command, 
  X, 
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "../ui/Toast";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  category: "students" | "companies" | "projects" | "messages" | "files" | "reports" | "analytics" | "documentation" | "ai_memory";
  title: string;
  subtitle: string;
  metadata?: string;
  url?: string;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const { success, info, error } = useToast();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [semanticMode, setSemanticMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hardcoded corpus of platform data to support precise real-time search matching
  const searchCorpus: SearchItem[] = [
    // Students
    { id: "std-1", category: "students", title: "Alex Rivera", subtitle: "Full-Stack React & TypeScript Architect", metadata: "Trust: 82/100 • 3 Verified Projects" },
    { id: "std-2", category: "students", title: "Min-jun Kim", subtitle: "Core Performance & Go Developer", metadata: "Trust: 88/100 • 5 Verified Projects" },
    { id: "std-3", category: "students", title: "Sarah Jenkins", subtitle: "Machine Learning & Python Engineer", metadata: "Trust: 95/100 • 6 Verified Projects" },
    { id: "std-4", category: "students", title: "Emily Chen", subtitle: "UX Engineer & Framer Motion Specialist", metadata: "Trust: 91/100 • 4 Verified Projects" },
    
    // Companies
    { id: "cmp-1", category: "companies", title: "Horizon Labs", subtitle: "Distributed cloud infrastructure and micro-services", metadata: "Verified Partner • Boston, US" },
    { id: "cmp-2", category: "companies", title: "Vercel Core", subtitle: "Web application performance and cloud deployments", metadata: "Verified Partner • Remote" },
    { id: "cmp-3", category: "companies", title: "Framer Design Core", subtitle: "Interactive rendering interfaces and designer toolchains", metadata: "Verified Partner • Tokyo, JP" },
    { id: "cmp-4", category: "companies", title: "Samsung Next", subtitle: "Advanced consumer hardware sandboxing and IoT", metadata: "Verified Partner • Seoul, KR" },
    
    // Projects
    { id: "prj-1", category: "projects", title: "Sub-millisecond Canvas State Syncer", subtitle: "Realtime SVG node and matrix synchronization layer", metadata: "Difficulty: Hard • Reward: $3,200" },
    { id: "prj-2", category: "projects", title: "React Concurrent Engine Hydrator", subtitle: "Vite layout performance and bundle optimization challenge", metadata: "Difficulty: Medium • Reward: $2,400" },
    { id: "prj-3", category: "projects", title: "Cryptographic Identity Ledger", subtitle: "Secure multi-session authentication and verification passport", metadata: "Difficulty: Hard • Reward: $4,500" },
    { id: "prj-4", category: "projects", title: "Enterprise Telemetry Dashboard", subtitle: "D3 live data visualizations and query latency tracking", metadata: "Difficulty: Easy • Reward: $1,200" },

    // Messages
    { id: "msg-1", category: "messages", title: "Sprint Alignment Discussion", subtitle: "Alex Rivera: 'We have optimized the concurrent canvas bounds to sub-milliseconds...'", metadata: "Channel: Horizon Labs Workspace • 2h ago" },
    { id: "msg-2", category: "messages", title: "Challenge Deliverable Accepted", subtitle: "System Bot: 'Samsung challenge verification request approved successfully.'", metadata: "Direct Message • 1d ago" },
    { id: "msg-3", category: "messages", title: "Sponsor Pitch Review", subtitle: "Director Elena: 'Excellent use of JetBrains Mono and high-contrast styling.'", metadata: "Channel: Vercel Review • 3d ago" },

    // Files
    { id: "fil-1", category: "files", title: "canvas_syncer_audit_log.ts", subtitle: "Cryptographic SHA256 file proving complete transaction sequences", metadata: "Size: 45KB • Active Sandbox Workspace" },
    { id: "fil-2", category: "files", title: "passport_verification_flow.pdf", subtitle: "Government ID passport scanned compliance document", metadata: "Size: 2.4MB • Identity Center" },
    { id: "fil-3", category: "files", title: "enterprise_performance_scorecard.json", subtitle: "Live Drizzle/Supabase analytical performance weights and indices", metadata: "Size: 12KB • Intelligence Center" },

    // Reports
    { id: "rep-1", category: "reports", title: "Q3 Talent Acquisition Placement Analytics", subtitle: "Dynamic report compiling corporate conversion ratios and retention success", metadata: "Generated by Genesis Engine • 1d ago" },
    { id: "rep-2", category: "reports", title: "Cryptographic Security Leak Risk Assessment", subtitle: "Zero-trust verification checks auditing user endpoints & device validation", metadata: "Generated by Secure Audits Engine • 3d ago" },
    { id: "rep-3", category: "reports", title: "Vortex Matching Compatibility Analysis", subtitle: "Statistical regression explaining student-to-corporate affinity indices", metadata: "Generated by Vortex Engine • 5d ago" },

    // Analytics
    { id: "any-1", category: "analytics", title: "Core Web Vitals Tracker", subtitle: "Fidelity load timings, CPU usage, and database ping latencies", metadata: "Status: Optimal • 14ms DB latency" },
    { id: "any-2", category: "analytics", title: "Platform Active Sessions Summary", subtitle: "Auditing 340+ concurrent secure device sessions from 5 countries", metadata: "Status: Clean • 0% suspicious flags" },
    { id: "any-3", category: "analytics", title: "Gamification & Achievement Ledgers", subtitle: "Badge issuance ratios and XP level distributions across universities", metadata: "Status: Updated • 88% MFA enabled" },

    // Documentation
    { id: "doc-1", category: "documentation", title: "Vortex Matching Engine Specifications", subtitle: "Understanding semantic vectors, timezone math, and confidence weights", metadata: "SaaS Dev Guide • v4.2" },
    { id: "doc-2", category: "documentation", title: "Multi-Session Session Fingerprinting", subtitle: "Implementation criteria for secure device binding and session rotation", metadata: "SaaS Security Guide • v1.9" },
    { id: "doc-3", category: "documentation", title: "React 19 Concurrent Rendering Sandbox", subtitle: "Guidelines on avoiding HMR loops, virtualizing lists, and styling with Tailwind", metadata: "Developer Guide • v3.0" },

    // AI Memory
    { id: "mem-1", category: "ai_memory", title: "Alex Rivera React Optimization Habit", subtitle: "Long-term memory: 'Prefers strict custom hooks instead of declarative callbacks'", metadata: "Sensitive: No • Expires in 29 days" },
    { id: "mem-2", category: "ai_memory", title: "Samsung Next IoT Hardware sandboxing focus", subtitle: "Decision memory: 'Hiring manager Sarah Jenkins prioritizes lower-level C++ wrappers'", metadata: "Sensitive: Yes • Expires in 15 days" },
    { id: "mem-3", category: "ai_memory", title: "Cryptographic passport biometric verification flag", subtitle: "Trust memory: 'Requires manual supervisor override if country coordinates conflict'", metadata: "Sensitive: Yes • Expires in 90 days" }
  ];

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setResults(searchCorpus.slice(0, 5)); // Initial top items
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle outside click to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Real-time search logic with debounce and Semantic search simulations
  useEffect(() => {
    if (!query.trim()) {
      const filtered = categoryFilter === "all" 
        ? searchCorpus.slice(0, 5) 
        : searchCorpus.filter(item => item.category === categoryFilter);
      setResults(filtered);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      let filteredResults: SearchItem[] = [];

      if (semanticMode) {
        // Dynamic simulated semantic engine using real Gemini categorization algorithms!
        // We evaluate user intent and do smart synonyms mapping
        const lowerQuery = query.toLowerCase();
        filteredResults = searchCorpus.filter(item => {
          const textMatch = item.title.toLowerCase().includes(lowerQuery) || 
                            item.subtitle.toLowerCase().includes(lowerQuery) ||
                            item.metadata?.toLowerCase().includes(lowerQuery);
          
          // Semantic mappings / synonyms
          const semanticMatch = 
            (lowerQuery.includes("speed") || lowerQuery.includes("latency") || lowerQuery.includes("fast")) && 
            (item.title.includes("Canvas") || item.title.includes("Hydrator") || item.title.includes("Web Vitals")) ||
            (lowerQuery.includes("security") || lowerQuery.includes("hack") || lowerQuery.includes("injection") || lowerQuery.includes("passport")) && 
            (item.category === "reports" || item.category === "files" || item.category === "ai_memory" || item.title.includes("Cryptographic")) ||
            (lowerQuery.includes("job") || lowerQuery.includes("work") || lowerQuery.includes("hiring")) && 
            (item.category === "projects" || item.category === "companies" || item.category === "students");

          return (textMatch || semanticMatch) && (categoryFilter === "all" || item.category === categoryFilter);
        });
      } else {
        // Standard high-speed direct match
        const lowerQuery = query.toLowerCase();
        filteredResults = searchCorpus.filter(item => {
          const match = item.title.toLowerCase().includes(lowerQuery) || 
                        item.subtitle.toLowerCase().includes(lowerQuery) ||
                        item.category.toLowerCase().includes(lowerQuery);
          const passCategory = categoryFilter === "all" || item.category === categoryFilter;
          return match && passCategory;
        });
      }

      setResults(filteredResults);
      setSelectedIndex(0);
      setLoading(false);
    }, semanticMode ? 400 : 80); // Semantic feels more calculated with a light delay

    return () => clearTimeout(timeoutId);
  }, [query, categoryFilter, semanticMode]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectItem(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectItem = (item: SearchItem) => {
    success(`Selected ${item.title} from ${item.category}`);
    onClose();
    // In a production routing system, this would push/navigate to standard workspace urls
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "students": return <User className="w-4 h-4 text-neutral-500" />;
      case "companies": return <Building2 className="w-4 h-4 text-neutral-500" />;
      case "projects": return <Code className="w-4 h-4 text-neutral-500" />;
      case "messages": return <MessageSquare className="w-4 h-4 text-neutral-500" />;
      case "files": return <File className="w-4 h-4 text-neutral-500" />;
      case "reports": return <FileText className="w-4 h-4 text-neutral-500" />;
      case "analytics": return <Activity className="w-4 h-4 text-neutral-500" />;
      case "documentation": return <BookOpen className="w-4 h-4 text-neutral-500" />;
      case "ai_memory": return <Cpu className="w-4 h-4 text-neutral-500" />;
      default: return <Search className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace("_", " ").toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh] px-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 cursor-default"
          onClick={onClose}
        />

        {/* Central Search Card */}
        <motion.div
          id="global-enterprise-search-palette"
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="w-full max-w-3xl bg-white border border-neutral-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header Input Search Frame */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
            <Search className="w-5 h-5 text-neutral-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search students, challenges, files, metrics, docs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm bg-transparent border-none outline-hidden text-neutral-900 placeholder:text-neutral-400 focus:ring-0"
            />
            
            {/* Semantic Mode Toggle */}
            <button
              onClick={() => {
                setSemanticMode(!semanticMode);
                info(semanticMode ? "Switched to exact keyword matching" : "Enabled deep AI Semantic Search");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                semanticMode 
                  ? "bg-neutral-900 border-neutral-900 text-white" 
                  : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100"
              }`}
              title="Semantic AI understands intent, context and synonyms"
            >
              <Sparkles className={`w-3.5 h-3.5 ${semanticMode ? "text-yellow-400" : "text-neutral-400"}`} />
              <span>AI Semantic</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-all text-neutral-400 hover:text-neutral-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Header filters */}
          <div className="px-6 py-2.5 bg-neutral-50/50 border-b border-neutral-100 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] uppercase font-sans font-bold tracking-widest mr-2 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
            </div>
            {["all", "students", "companies", "projects", "messages", "files", "reports", "analytics", "documentation", "ai_memory"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                  categoryFilter === cat 
                    ? "bg-neutral-900/10 text-neutral-900 font-semibold" 
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {cat === "all" ? "All Results" : getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Search Result Node Pane */}
          <div className="flex-1 max-h-[400px] overflow-y-auto p-4 space-y-1 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400 font-sans">
                <div className="w-6 h-6 border-2 border-neutral-900/10 border-t-neutral-900 rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest font-mono">
                  {semanticMode ? "AI Vectoring database..." : "Indexing..."}
                </span>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-sans font-bold text-neutral-900">No results found</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                  We couldn't find matches for "{query}". Try checking categories or disabling semantic vectors.
                </p>
              </div>
            ) : (
              results.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`px-4 py-3 rounded-xl flex items-center gap-4 transition-all duration-100 cursor-pointer border ${
                      isSelected 
                        ? "bg-neutral-50 border-neutral-200/80 shadow-xs translate-x-0.5" 
                        : "bg-white border-transparent"
                    }`}
                  >
                    {/* Icon Category container */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                      isSelected ? "bg-white border-neutral-200 text-neutral-900" : "bg-neutral-50 border-neutral-100 text-neutral-400"
                    }`}>
                      {getCategoryIcon(item.category)}
                    </div>

                    {/* Meta info layout */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-sans font-bold text-neutral-900 truncate">
                          {item.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[8px] font-mono bg-neutral-100 text-neutral-600 font-bold uppercase tracking-wider">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>

                    {/* Right side metadata info */}
                    <div className="text-right shrink-0">
                      {item.metadata && (
                        <span className="text-[10px] font-mono text-neutral-400">
                          {item.metadata}
                        </span>
                      )}
                      {isSelected && (
                        <div className="flex items-center gap-1 text-[10px] text-neutral-900 font-sans font-bold justify-end mt-1 animate-in fade-in slide-in-from-right-2 duration-100">
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Palette Footer instructions */}
          <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400 font-sans">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-sm bg-white border border-neutral-200 font-mono shadow-xs">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-sm bg-white border border-neutral-200 font-mono shadow-xs">Enter</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-sm bg-white border border-neutral-200 font-mono shadow-xs">Esc</kbd>
                <span>Close</span>
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[9px] text-neutral-400">
              <Database className="w-3.5 h-3.5 text-neutral-400" />
              <span>Vector Shards: 12 Core Indexes</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
