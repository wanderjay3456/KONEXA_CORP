import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Search, Shield, Star, Award, Zap, Code, Mail, Github, 
  Linkedin, Globe, Calendar, MapPin, CheckCircle, FileText,
  ChevronRight, ArrowUpRight, TrendingUp, Sparkles, BookOpen, Clock
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface StudentProfileReviewProps {
  studentId?: string | null;
  onNavigate: (tabId: string) => void;
}

export default function StudentProfileReview({ studentId, onNavigate }: StudentProfileReviewProps) {
  const { studentProfile } = useApp();
  const { success, info } = useToast();

  const [searchQuery, setSearchQuery] = useState("");

  // Seed list of student candidates for search indexing
  const candidates = [
    {
      id: "usr_fndtn_konexa_99",
      name: studentProfile?.name || "Alex Rivera",
      preferredName: "Alex",
      university: "Seoul National University",
      degree: "B.S. Computer Science & Engineering",
      graduationYear: "2027",
      email: "alex.rivera@snu.ac.kr",
      github: studentProfile?.github || "https://github.com/alexrivera-dev",
      linkedin: "https://linkedin.com/in/alexrivera-dev",
      portfolio: "https://alexrivera.dev",
      bio: studentProfile?.bio || "Full-stack enthusiast focused on building high-performance interactive interfaces and clean software architectures.",
      skills: studentProfile?.skills || ["React", "TypeScript", "Node.js", "TailwindCSS", "Framer Motion"],
      languages: ["English (Native)", "Korean (Fluent)", "Spanish (Intermediate)"],
      certificates: ["Google Professional Cloud Architect", "AWS Certified Developer"],
      trustScore: studentProfile?.trustScore || 82,
      performanceScore: 94,
      aiMatchScore: 96,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
      careerGoals: "Aims to specialize in React layout optimization, compiler optimizations, and robust global SaaS deployments.",
      achievements: [
        { name: "Sponsor Approved", desc: "First clean challenge compilation approved by Vercel partner", icon: Zap },
        { name: "Top-Tier Optimizer", desc: "Maintained render performance below 10ms under heavy stress tests", icon: Award }
      ],
      badges: ["Alpha Builder", "Zero-Bug Hero", "Trust Node"],
      timeline: [
        { date: "July 2026", title: "Completed Vercel Core Challenge", desc: "Evaluated 96/100 by Gemini AI audit." },
        { date: "June 2026", title: "Joined KONEXA Platform", desc: "Verified business credentials and credentials logs." },
        { date: "March 2026", title: "Open Source Contributor", desc: "Vite layout rendering engine optimizer fork approved." }
      ]
    },
    {
      id: "std_2",
      name: "Min-jun Kim",
      preferredName: "MJ",
      university: "KAIST",
      degree: "M.S. Software Engineering",
      graduationYear: "2026",
      email: "mj.kim@kaist.ac.kr",
      github: "https://github.com/mjkim-backend",
      linkedin: "https://linkedin.com/in/mjkim-backend",
      portfolio: "https://mjkim.io",
      bio: "Focusing on highly-concurrent distributed engines, database transaction modeling, and low-latency API architectures.",
      skills: ["Go", "gRPC", "Redis", "Docker", "PostgreSQL", "Kubernetes", "TypeScript"],
      languages: ["Korean (Native)", "English (Professional)"],
      certificates: ["Certified Kubernetes Administrator (CKA)", "Professional Scrum Master"],
      trustScore: 89,
      performanceScore: 91,
      aiMatchScore: 88,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
      careerGoals: "Aims to architect transactional data pipelines handling sub-millisecond sync layers at global scale.",
      achievements: [
        { name: "Distributed Champion", desc: "Implemented concurrent transaction isolation queue matching", icon: Award }
      ],
      badges: ["Kube Master", "Algorithmic Master"],
      timeline: [
        { date: "July 2026", title: "Completed Framer Syncer Milestone", desc: "Sync latency tested below 5ms." },
        { date: "April 2026", title: "KAIST Lab research project", desc: "Authored sub-millisecond socket ring buffer specs." }
      ]
    },
    {
      id: "std_3",
      name: "Chloe Chen",
      preferredName: "Chloe",
      university: "National University of Singapore",
      degree: "B.S. Artificial Intelligence & Analytics",
      graduationYear: "2026",
      email: "chloe.chen@nus.edu.sg",
      github: "https://github.com/chloechen-ml",
      linkedin: "https://linkedin.com/in/chloechen-ml",
      portfolio: "https://chloechen.ai",
      bio: "Passionate about large language model alignment, semantic vector embedding compression, and generative AI proxy layers.",
      skills: ["Python", "PyTorch", "Transformers", "FastAPI", "React", "PostgreSQL"],
      languages: ["Mandarin (Native)", "English (Bilingual)", "Japanese (Intermediate)"],
      certificates: ["TensorFlow Developer Certificate", "DeepLearning.AI Generative AI Specialist"],
      trustScore: 78,
      performanceScore: 88,
      aiMatchScore: 87,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120",
      careerGoals: "Seeking to build light-weight fine-tuning routines for enterprise workflow automation.",
      achievements: [
        { name: "LLM Architect", desc: "Fine-tuned 7B parameters with 40% memory latency savings", icon: Zap }
      ],
      badges: ["AI Pioneer", "Embeddings Champion"],
      timeline: [
        { date: "June 2026", title: "Completed Google Sidebar AI Challenge", desc: "Scored 91/100 by sponsor verification team." }
      ]
    }
  ];

  // Active student selection state
  const [activeId, setActiveId] = useState(studentId || "usr_fndtn_konexa_99");

  // Search logic
  const filteredCandidates = candidates.filter(cand => {
    const term = searchQuery.toLowerCase();
    return cand.name.toLowerCase().includes(term) || 
           cand.skills.some(s => s.toLowerCase().includes(term)) ||
           cand.university.toLowerCase().includes(term);
  });

  const activeCand = candidates.find(c => c.id === activeId) || candidates[0];

  const handleBookmarkToggle = (name: string) => {
    success("Student Bookmarked", `${name} added to your Saved Students list.`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">
            Talent Search Engine
          </span>
          <h1 className="font-display font-black text-3xl text-neutral-900 tracking-tight mt-1">
            Dynamic Candidate Portfolios
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Browse verified students, inspect sandbox milestones, and review cross-examined scorecards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Candidates list & search indexing (4/12) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skills, school..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-hidden font-light"
            />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Index matching results</span>
            <div className="space-y-1.5">
              {filteredCandidates.map((cand) => (
                <div 
                  key={cand.id}
                  onClick={() => setActiveId(cand.id)}
                  className={`p-3 rounded-2xl border text-xs flex gap-3 items-center transition-all cursor-pointer ${
                    activeId === cand.id 
                      ? "bg-neutral-950 border-neutral-950 text-white shadow-sm" 
                      : "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-800"
                  }`}
                >
                  <img 
                    src={cand.avatar} 
                    alt={cand.name} 
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-200/50"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{cand.name}</div>
                    <div className={`text-[10px] truncate font-light ${activeId === cand.id ? "text-neutral-300" : "text-neutral-400"}`}>
                      {cand.university}
                    </div>
                  </div>
                  <div className={`text-[10px] font-mono font-black shrink-0 px-2 py-0.5 rounded-lg border ${
                    activeId === cand.id 
                      ? "bg-neutral-800 border-neutral-700 text-white" 
                      : "bg-neutral-50 border-neutral-200 text-neutral-800"
                  }`}>
                    {cand.aiMatchScore}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Beautiful Profile details (8/12) */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-3xl p-8 shadow-premium space-y-8">
          
          {/* Header Portfolio banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-neutral-100">
            <div className="flex items-start gap-4">
              <img 
                src={activeCand.avatar} 
                alt={activeCand.name} 
                className="w-20 h-20 rounded-full object-cover border border-neutral-200 shadow-xs shrink-0" 
              />
              <div className="space-y-1.5">
                <div className="flex items-center flex-wrap gap-2">
                  <h2 className="font-display font-black text-2xl text-neutral-900 tracking-tight">{activeCand.name}</h2>
                  <span className="bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Verified ID
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-light font-sans">{activeCand.degree} • {activeCand.university}</p>
                
                {/* Social icons */}
                <div className="flex items-center gap-3 pt-1 text-neutral-400">
                  <a href={activeCand.github} target="_blank" rel="noreferrer" className="hover:text-black transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                  <a href={activeCand.linkedin} target="_blank" rel="noreferrer" className="hover:text-black transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a href={activeCand.portfolio} target="_blank" rel="noreferrer" className="hover:text-black transition-colors">
                    <Globe className="w-4 h-4" />
                  </a>
                  <a href={`mailto:${activeCand.email}`} className="hover:text-black transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
              <button 
                onClick={() => handleBookmarkToggle(activeCand.name)}
                className="w-full px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Save to Bookmarks</span>
              </button>
              <button 
                onClick={() => {
                  success("Messaging Channel Connected", `Real-time chat active with ${activeCand.preferredName}.`);
                  onNavigate("messaging");
                }}
                className="w-full px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <span>Initiate Student Chat</span>
              </button>
            </div>
          </div>

          {/* Core score cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/50 space-y-1">
              <div className="flex justify-between items-center text-neutral-400 font-mono text-[9px] uppercase tracking-wider">
                <span>Trust Score</span>
                <Shield className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-xl font-display font-black text-neutral-900">{activeCand.trustScore}/100</div>
              <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden mt-2">
                <div className="bg-blue-600 h-full" style={{ width: `${activeCand.trustScore}%` }} />
              </div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/50 space-y-1">
              <div className="flex justify-between items-center text-neutral-400 font-mono text-[9px] uppercase tracking-wider">
                <span>Performance Index</span>
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-xl font-display font-black text-neutral-900">{activeCand.performanceScore}/100</div>
              <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden mt-2">
                <div className="bg-amber-500 h-full" style={{ width: `${activeCand.performanceScore}%` }} />
              </div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/50 space-y-1">
              <div className="flex justify-between items-center text-neutral-400 font-mono text-[9px] uppercase tracking-wider">
                <span>AI Match Alignment</span>
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <div className="text-xl font-display font-black text-neutral-900">{activeCand.aiMatchScore}%</div>
              <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden mt-2">
                <div className="bg-teal-500 h-full" style={{ width: `${activeCand.aiMatchScore}%` }} />
              </div>
            </div>
          </div>

          {/* Profile Bio & Goals */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">01. Candidate Pitch</span>
              <p className="text-xs text-neutral-700 leading-relaxed font-light">{activeCand.bio}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">02. Career Interests & Goals</span>
              <p className="text-xs text-neutral-600 leading-relaxed font-light">{activeCand.careerGoals}</p>
            </div>
          </div>

          {/* Tech stack & Languages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">03. Technology Stack</span>
              <div className="flex flex-wrap gap-1">
                {activeCand.skills.map((skill, idx) => (
                  <span key={idx} className="text-xs bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-xl text-neutral-700 font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">04. Languages</span>
              <div className="flex flex-wrap gap-1">
                {activeCand.languages.map((lang, idx) => (
                  <span key={idx} className="text-xs bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-xl text-neutral-600 font-light">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Achievements & Badges */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">05. Achievements & Badges</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCand.achievements.map((ach, idx) => {
                const Icon = ach.icon;
                return (
                  <div key={idx} className="p-4 border border-neutral-200/60 rounded-2xl bg-neutral-50/30 flex gap-3 items-start">
                    <div className="p-2 bg-neutral-100 rounded-xl text-neutral-800">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{ach.name}</h4>
                      <p className="text-[10px] text-neutral-400 font-light leading-normal mt-0.5">{ach.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {activeCand.badges.map((badge, idx) => (
                <span key={idx} className="text-[9px] font-mono bg-teal-50 text-teal-600 border border-teal-100 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">06. Verification Timeline</span>
            
            <div className="space-y-4 border-l border-neutral-100 pl-4 ml-2">
              {activeCand.timeline.map((item, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-neutral-900 border border-white" />
                  <div className="text-[10px] font-mono text-neutral-400">{item.date}</div>
                  <h4 className="text-xs font-bold text-neutral-900">{item.title}</h4>
                  <p className="text-xs text-neutral-500 font-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
