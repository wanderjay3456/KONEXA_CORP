import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  Code, 
  ShieldCheck, 
  Briefcase, 
  Zap, 
  Star, 
  Sparkles, 
  Globe, 
  Building2, 
  User, 
  Users, 
  HelpCircle, 
  TrendingUp, 
  CheckCircle,
  LogIn,
  Layers,
  Heart,
  ChevronDown
} from "lucide-react";
import { UserRole } from "../../types";
import AuthModal from "../auth/AuthModal";
import StudentRegisterForm from "../auth/StudentRegisterForm";
import CompanyRegisterForm from "../auth/CompanyRegisterForm";
import { db } from "../../config/supabase";
import { collection, addDoc } from "../../lib/supabaseStore";
import { useToast } from "../ui/Toast";

interface LandingHeroProps {
  onEnterApp: (role: UserRole) => void;
}

export default function LandingHero({ onEnterApp }: LandingHeroProps) {
  // Navigation states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => typeof window !== "undefined" && (window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery")));
  const [activeRegisterRole, setActiveRegisterRole] = useState<UserRole | null>(null);
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({ 0: true });

  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    
    setIsWaitlistSubmitting(true);
    try {
      await addDoc(collection(db, "waitlist"), {
        email: waitlistEmail,
        createdAt: Date.now()
      });
      setWaitlistEmail("");
      success("Joined Waitlist!", "You'll be the first to know when we open full public access.");
    } catch (err: any) {
      error("Waitlist Error", err.message);
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

  // Custom Company Logo Mockups
  const sponsorLogos = [
    { name: "Vercel", icon: "▲" },
    { name: "Stripe", icon: "⌗" },
    { name: "Linear", icon: "⎋" },
    { name: "Figma", icon: "❖" },
    { name: "Mercury", icon: "☊" },
    { name: "Scale AI", icon: "⌆" }
  ];

  // Live Statistics
  const stats = [
    { value: "$2.4M+", label: "Aggregate Student Payouts", icon: TrendingUp },
    { value: "48,000+", label: "Verified Code Submissions", icon: Code },
    { value: "120+", label: "Global Corporate Partners", icon: Building2 },
    { value: "99.2%", label: "Recruiter Retention Rate", icon: ShieldCheck }
  ];

  // Core Features Grid
  const features = [
    {
      icon: Code,
      title: "Real-World Code Sandboxes",
      desc: "Solve production-grade code issues pulled directly from corporate GitHub roadmaps. No generic tests, no abstract quizzes."
    },
    {
      icon: Sparkles,
      title: "Vetted by Gemini AI Engine",
      desc: "Get instantaneous code evaluations assessing structural performance, types integrity, architectural cleanliness, and style."
    },
    {
      icon: ShieldCheck,
      title: "Algorithmic Trust Scores",
      desc: "Build a non-fungible Trust Metric based on verified challenge score averages, language competencies, and submission timeliness."
    },
    {
      icon: Users,
      title: "1-Click Recruitment Pipeline",
      desc: "Skip resume screens. Companies recruit directly from the verified catalog based on skill match telemetry and high scores."
    },
    {
      icon: Globe,
      title: "Borderless Global Compliance",
      desc: "Fully integrated payment escrow pipelines and local contractor compliance managers handling international matching easily."
    },
    {
      icon: Layers,
      title: "Autonomous Agent Guardrails",
      desc: "Real-time system telemetry and sandbox managers checking code submissions to protect intellectual property and secure servers."
    }
  ];

  // Step-by-step Workflow Timeline
  const workflowSteps = [
    {
      num: "01",
      title: "Assemble Core Portfolio",
      desc: "Deploy your credentials, GitHub assets, and educational backgrounds within our 5-step registration wizard.",
      role: "Student Pathway"
    },
    {
      num: "02",
      title: "Solve Verified Challenges",
      desc: "Claim active challenges on the dashboard, code locally or in-browser, and submit for evaluation.",
      role: "Interactive Sandbox"
    },
    {
      num: "03",
      title: "Gemini Quality Analysis",
      desc: "Our server-side Gemini system runs automated performance benchmarks and awards Trust points instantly.",
      role: "AI Orchestration"
    },
    {
      num: "04",
      title: "Direct Corporate Placement",
      desc: "Recruiters unlock your verified transcripts, schedule fast-track chats, and finalize global contracts.",
      role: "Placement Engine"
    }
  ];

  // FAQ Items
  const faqItems = [
    {
      q: "How does the Trust Score system work?",
      a: "The Trust Score (80-100) is KONEXA's objective reputation metric. It scales based on your average Gemini evaluation scores, submission consistency, code readability, and successfully completed project milestones. Highly trusted profiles are auto-recommended to top-tier partners."
    },
    {
      q: "Are the corporate payouts real?",
      a: "Yes. Every active project has real, verified budget escrowed by the sponsoring company. Upon successful code review and system validation, funds are directly wired via global banking networks."
    },
    {
      q: "Can companies create admin accounts?",
      a: "No. Administrator status is reserved exclusively for KONEXA system supervisors to ensure strict neutral audit standards. Partner organizations register as Companies to launch challenges and recruit."
    },
    {
      q: "Do I need prior work experience to join?",
      a: "Absolutely not. KONEXA is designed to bypass the 'experience paradox'. If you can write clean, high-performing code, our system verifies it algorithmically, giving you direct access to premier international hiring pipelines."
    }
  ];

  const handleRegisterSuccess = (role: UserRole) => {
    onEnterApp(role);
  };

  const toggleFaq = (idx: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div id="landing-master" className="min-h-screen bg-neutral-50 flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Absolute Aesthetic Enhancements */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-teal-50/50 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      {/* HEADER NAVIGATION */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-lg shadow-black/10">
            <span className="font-display font-black text-white text-lg">K</span>
          </div>
          <span className="font-display font-black text-xl tracking-tight text-neutral-900">KONEXA</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="font-sans font-bold text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          
          <button 
            onClick={() => setActiveRegisterRole(UserRole.STUDENT)}
            className="px-4.5 py-2.5 rounded-xl bg-black text-white font-sans font-bold text-xs hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
          >
            Launch Platform
          </button>
        </div>
      </header>

      {/* DYNAMIC REGISTRATION OR HERO VIEW */}
      <AnimatePresence mode="wait">
        {activeRegisterRole === UserRole.STUDENT ? (
          <motion.div 
            key="student-reg"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="relative z-10 w-full"
          >
            <StudentRegisterForm 
              onCancel={() => setActiveRegisterRole(null)} 
              onSuccess={() => handleRegisterSuccess(UserRole.STUDENT)} 
            />
          </motion.div>
        ) : activeRegisterRole === UserRole.COMPANY ? (
          <motion.div 
            key="company-reg"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="relative z-10 w-full"
          >
            <CompanyRegisterForm 
              onCancel={() => setActiveRegisterRole(null)} 
              onSuccess={() => handleRegisterSuccess(UserRole.COMPANY)} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="hero-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            {/* HERO SECTION */}
            <section className="w-full max-w-7xl mx-auto px-6 py-12 md:py-24 text-center relative z-10 flex flex-col items-center">
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-sans font-bold tracking-wide shadow-xs mb-8"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>VERIFIABLE WORKSPACE PROTOCOL v2.0</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="font-display font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-neutral-900 tracking-tight leading-none max-w-6xl mx-auto text-balance"
              >
                Project <span className="text-teal-600">→</span> Trust <span className="text-teal-600">→</span> Placement
              </motion.h1>

              {/* Subtext */}
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-sans text-neutral-500 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-light mt-6"
              >
                Bypass traditional CV filters. Solve active corporate coding challenges. 
                Verify skill depth through real-time Gemini AI and human review. Build durable professional trust.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full max-w-md sm:max-w-none"
              >
                <button
                  onClick={() => setActiveRegisterRole(UserRole.STUDENT)}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-sans font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Build Projects as Student</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button
                  onClick={() => setActiveRegisterRole(UserRole.COMPANY)}
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 font-sans font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-neutral-400" />
                  <span>Deploy Corporate Challenge</span>
                </button>
              </motion.div>

              {/* Corporate Sponsors Bar */}
              <div className="mt-20 w-full max-w-4xl border-y border-neutral-200/60 py-6">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-4">
                  Matching ecosystems with world-class engineering teams
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 items-center justify-center">
                  {sponsorLogos.map(logo => (
                    <div key={logo.name} className="flex items-center justify-center gap-1.5 text-neutral-400 hover:text-neutral-900 transition-colors">
                      <span className="font-mono text-base font-black">{logo.icon}</span>
                      <span className="font-display font-extrabold text-xs tracking-tight uppercase">{logo.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* LIVE TELEMETRY STATS SECTION */}
            <section className="bg-white border-y border-neutral-200 py-16 relative z-10">
              <div className="w-full max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {stats.map((st, index) => (
                    <div key={index} className="space-y-2 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 text-teal-600">
                        <st.icon className="w-4 h-4" />
                        <span className="text-[9px] font-mono font-bold tracking-widest uppercase">System Audit</span>
                      </div>
                      <div className="font-display font-black text-4xl text-neutral-900 tracking-tight">{st.value}</div>
                      <div className="font-sans text-xs text-neutral-400 leading-tight">{st.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* PRODUCT MODULES & FEATURES */}
            <section className="w-full max-w-7xl mx-auto px-6 py-20 relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-[10px] font-mono font-black text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Platform Core Features
                </span>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-neutral-900 mt-4 tracking-tight text-balance">
                  A high-integrity hiring network built for scale
                </h2>
                <p className="font-sans text-xs sm:text-sm text-neutral-400 mt-2 font-light text-pretty">
                  KONEXA merges cloud sandboxing with Gemini intelligence to provide a secure environment where skills represent the ultimate currency.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feat, index) => (
                  <div 
                    key={index} 
                    className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm hover:shadow-premium transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-6">
                        <feat.icon className="w-5 h-5 text-neutral-900" />
                      </div>
                      <h3 className="font-display font-extrabold text-lg text-neutral-900 tracking-tight">{feat.title}</h3>
                      <p className="font-sans text-xs text-neutral-400 mt-2.5 leading-relaxed font-light">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* WORKFLOW TIMELINE */}
            <section className="bg-neutral-900 text-white py-20 relative overflow-hidden z-10">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
              
              <div className="w-full max-w-7xl mx-auto px-6">
                <div className="max-w-2xl mb-16">
                  <span className="text-[10px] font-mono font-black text-teal-400 uppercase tracking-widest block mb-1">
                    System Architecture
                  </span>
                  <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight text-balance">
                    The Trust Validation Workflow
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                  {workflowSteps.map((step, idx) => (
                    <div key={idx} className="space-y-4 border-l border-neutral-800 pl-6 relative">
                      <span className="font-mono text-5xl font-black text-teal-500/30 block mb-2">{step.num}</span>
                      <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-900/30 border border-teal-800/40 px-2 py-0.5 rounded-md">
                        {step.role}
                      </span>
                      <h4 className="font-display font-bold text-lg text-white mt-2">{step.title}</h4>
                      <p className="font-sans text-xs text-neutral-400 leading-relaxed font-light">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* TRUST TESTIMONIALS BENTO GRID */}
            <section className="w-full max-w-7xl mx-auto px-6 py-20 relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-[10px] font-mono font-black text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  Success Testimonials
                </span>
                <h2 className="font-display font-black text-3xl tracking-tight mt-4 text-balance">
                  Vouched by builders, verified by partners
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Testimonial 1 */}
                <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm flex flex-col justify-between">
                  <p className="font-sans text-xs text-neutral-500 leading-relaxed italic font-light">
                    "Using KONEXA, I skip conventional CV applications entirely. I solved the Vercel edge latency challenge and was interviewed and hired as a remote engineer within 72 hours."
                  </p>
                  <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center font-display font-bold text-white text-xs">AR</div>
                    <div>
                      <h4 className="font-sans font-bold text-xs text-neutral-900">Alex Rivera</h4>
                      <span className="text-[10px] font-mono text-neutral-400 block">Staff Developer • SNU Major</span>
                    </div>
                  </div>
                </div>

                {/* Testimonial 2 */}
                <div className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-sm flex flex-col justify-between md:col-span-2">
                  <p className="font-sans text-xs text-neutral-500 leading-relaxed italic font-light">
                    "Traditional technical hiring is broken; resume fluff takes up all our screen cycles. With KONEXA's sandbox, we only speak with candidates whose code has already been run and analyzed by Gemini for architectural cleanliness. It has saved our engineering team hundreds of wasted interview hours."
                  </p>
                  <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-display font-bold text-white text-xs">SK</div>
                    <div>
                      <h4 className="font-sans font-bold text-xs text-neutral-900">Seung-Min Kim</h4>
                      <span className="text-[10px] font-mono text-neutral-400 block">VP of Engineering • Horizon Labs Inc.</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ ACCORDIAN */}
            <section className="bg-white border-t border-neutral-200 py-20 relative z-10">
              <div className="w-full max-w-4xl mx-auto px-6">
                <div className="text-center mb-12">
                  <span className="text-[10px] font-mono font-black text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    Frequently Asked Questions
                  </span>
                  <h2 className="font-display font-black text-3xl tracking-tight mt-4">
                    Platform Mechanics
                  </h2>
                </div>

                <div className="space-y-4">
                  {faqItems.map((item, idx) => (
                    <div key={idx} className="border border-neutral-200 rounded-2xl overflow-hidden transition-all duration-200 bg-white shadow-xs">
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-5 flex justify-between items-center text-left hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        <span className="font-sans font-bold text-sm text-neutral-900">{item.q}</span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${faqOpen[idx] ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {faqOpen[idx] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <p className="px-5 pb-5 font-sans text-xs text-neutral-400 leading-relaxed font-light border-t border-neutral-100 pt-3">
                              {item.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* WAITLIST SECTION */}
            <section className="bg-neutral-900 border-t border-neutral-800 py-24 relative z-10 text-center">
              <div className="w-full max-w-2xl mx-auto px-6">
                <h2 className="font-display font-black text-3xl tracking-tight text-white mb-4">
                  Join the Beta Waitlist
                </h2>
                <p className="font-sans text-neutral-400 text-sm mb-8 leading-relaxed">
                  We're slowly rolling out full public access. Register your email below to get notified when new invites are released and bypass the standard screening queue.
                </p>
                <form onSubmit={handleWaitlistSubmit} className="flex max-w-md mx-auto gap-2">
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 h-12 px-4 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-sans text-sm focus:outline-hidden focus:border-teal-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isWaitlistSubmitting}
                    className="h-12 px-6 rounded-xl bg-white text-black font-sans font-bold text-sm hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {isWaitlistSubmitting ? "Joining..." : "Join Waitlist"}
                  </button>
                </form>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-12 border-t border-neutral-200/60 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs font-sans text-neutral-400">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center">
              <span className="font-display font-black text-white text-xs">K</span>
            </div>
            <span className="font-display font-black text-sm tracking-tight text-neutral-900">KONEXA</span>
          </div>
          <p className="font-light leading-relaxed text-[11px]">The secure global sandbox standard validating software talent through production tasks.</p>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-neutral-900 uppercase tracking-widest block">For Students</span>
          <span onClick={() => setActiveRegisterRole(UserRole.STUDENT)} className="block hover:text-neutral-900 transition-colors cursor-pointer font-light">Explore Code Challenges</span>
          <span onClick={() => setActiveRegisterRole(UserRole.STUDENT)} className="block hover:text-neutral-900 transition-colors cursor-pointer font-light">Claim Cash Rewards</span>
          <span onClick={() => setActiveRegisterRole(UserRole.STUDENT)} className="block hover:text-neutral-900 transition-colors cursor-pointer font-light">Reputation Ledgers</span>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-neutral-900 uppercase tracking-widest block">For Corporates</span>
          <span onClick={() => setActiveRegisterRole(UserRole.COMPANY)} className="block hover:text-neutral-900 transition-colors cursor-pointer font-light">Sponsor Challenges</span>
          <span onClick={() => setActiveRegisterRole(UserRole.COMPANY)} className="block hover:text-neutral-900 transition-colors cursor-pointer font-light">Hiring Matchmaker</span>
          <span onClick={() => setActiveRegisterRole(UserRole.COMPANY)} className="block hover:text-neutral-900 transition-colors cursor-pointer font-light">Verification Audits</span>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-neutral-900 uppercase tracking-widest block">Security Protocol</span>
          <span className="block font-light">Gemini AI Sandbox Shield</span>
          <span className="block font-light">Supabase Live Sync</span>
          <div className="flex items-center gap-1.5 text-[10px] text-teal-600 bg-teal-50 border border-teal-100/50 px-2 py-0.5 rounded-md w-fit font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Sandbox safe</span>
          </div>
        </div>
      </footer>

      {/* CORE LOGIN HANDSHAKE MODAL */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => handleRegisterSuccess(UserRole.STUDENT)}
        onSwitchToRegister={(role) => setActiveRegisterRole(role)}
      />
    </div>
  );
}
