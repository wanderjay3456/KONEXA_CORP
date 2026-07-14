import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../../context/AppContext";
import { UserRole, CompanyProfile } from "../../types";
import { 
  Building2, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  Mail, 
  Phone, 
  User, 
  Briefcase, 
  FileCheck2, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  Clock, 
  CheckCircle,
  ToggleRight,
  Plus,
  Trash2,
  ChevronRight
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface CompanyRegisterFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CompanyRegisterForm({ onCancel, onSuccess }: CompanyRegisterFormProps) {
  const { registerUser, studentProfile } = useApp();
  const { success, error, info } = useToast();
  
  const [step, setStep] = useState(1);
  const totalSteps = 4; // Steps 1 to 3 are forms, Step 4 is Onboarding Recommendations & Verification status
  
  // Form State
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({
    companyName: "",
    businessRegistrationNumber: "",
    country: "South Korea",
    industry: "AI & Deep Learning",
    companySize: "10-50 employees",
    website: "",
    linkedin: "",
    contactPerson: "",
    position: "VP of Engineering",
    corporateEmail: "",
    phoneNumber: "",
    companyIntroduction: "",
    hiringIndustry: "Computer Science",
    preferredMajors: ["Computer Science", "Information Technology"],
    requiredSkills: ["React", "TypeScript", "Node.js"],
    preferredLanguages: ["English"],
    companyBenefits: ["Stock options", "Flexible hours", "Lunch allowance"],
    remotePolicy: "Flexible (Hybrid model)",
    recruitmentStatus: "Open",
    officeLocation: "Teheran-ro, Gangnam, Seoul",
    notificationPreferences: { email: true, system: true },
    verified: false,
    verifiedStatus: "Pending",
    description: ""
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [termsAgreement, setTermsAgreement] = useState(false);
  const [password, setPassword] = useState("");

  // Custom skills or benefits inputs helpers
  const [skillInput, setSkillInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

  // AI Matching Report State
  const [aiReport, setAiReport] = useState<{
    verificationStatus: string;
    auditDetails: string;
    matchingTalentsCount: number;
    recommendedCandidates: string[];
    matchingStrategy: string;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (step > 1 && step < 4) {
      setIsSaving(true);
      const timer = setTimeout(() => setIsSaving(false), 500);
      return () => clearTimeout(timer);
    }
  }, [formData, step]);

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const res = ev.target.result as string;
          setLogoPreview(res);
          updateField("companyLogo", res);
          success("Logo attached", "Organization avatar loaded.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    const current = formData.requiredSkills || [];
    if (current.includes(skillInput.trim())) return;
    updateField("requiredSkills", [...current, skillInput.trim()]);
    setSkillInput("");
  };

  const removeSkill = (sk: string) => {
    updateField("requiredSkills", (formData.requiredSkills || []).filter(s => s !== sk));
  };

  const addBenefit = () => {
    if (!benefitInput.trim()) return;
    const current = formData.companyBenefits || [];
    if (current.includes(benefitInput.trim())) return;
    updateField("companyBenefits", [...current, benefitInput.trim()]);
    setBenefitInput("");
  };

  const removeBenefit = (ben: string) => {
    updateField("companyBenefits", (formData.companyBenefits || []).filter(b => b !== ben));
  };

  const validateStep = (): boolean => {
    const nextErrors: { [key: string]: string } = {};
    if (step === 1) {
      if (!formData.companyName?.trim()) nextErrors.companyName = "Corporate Legal Entity Name is required.";
      if (!formData.businessRegistrationNumber?.trim()) nextErrors.businessRegistrationNumber = "Business Registration Number is vital for corporate compliance audits.";
      if (!formData.website?.trim()) nextErrors.website = "Company website URL is required.";
    } else if (step === 2) {
      if (!formData.contactPerson?.trim()) nextErrors.contactPerson = "Contact Person Representative Name is required.";
      if (!formData.corporateEmail?.trim() || !formData.corporateEmail.includes("@")) {
        nextErrors.corporateEmail = "A valid corporate workspace email is required.";
      }
      if (!password.trim() || password.length < 6) {
        nextErrors.password = "A password of at least 6 characters is required for your credential account.";
      }
      if (!formData.companyIntroduction?.trim()) nextErrors.companyIntroduction = "Please write a brief corporate overview introduction.";
    } else if (step === 3) {
      if (!termsAgreement) nextErrors.terms = "You must accept our workspace sharing standards to launch challenges.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    } else {
      error("Validation Failed", "Please address all mandatory highlighted fields.");
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const triggerAiMatching = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setAiReport({
        verificationStatus: "Pending Audit",
        auditDetails: `Business ID [${formData.businessRegistrationNumber}] is queued for active validation with the National Corporate Registry database. Audit completes in ~4 hours. Under security protocols, you can publish challenges in Developer Sandbox mode immediately.`,
        matchingTalentsCount: 142,
        recommendedCandidates: [
          studentProfile?.name || "Alex Rivera",
          "Sophia Kim (SNU CS, Python Expert)",
          "Ji-Min Park (KAIST Fullstack, React core)"
        ],
        matchingStrategy: `Based on your requirement for [${formData.requiredSkills?.join(", ")}], KONEXA's Semantic Matching Engine identified 3 primary fits within a 5km radius of your office at ${formData.officeLocation}.`
      });
      setIsAiLoading(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    // description field fallback
    const desc = formData.companyIntroduction || "Corporate software matching partner.";
    try {
      await registerUser(
        formData.corporateEmail || "partner@company.com",
        formData.companyName || "Horizon Partner",
        UserRole.COMPANY,
        undefined,
        {
          ...formData,
          description: desc
        },
        password
      );

      setStep(4);
      triggerAiMatching();
    } catch (err: any) {
      error("Registration failed", err.message || "An account creation error occurred.");
    }
  };

  return (
    <div id="company-onboarding" className="max-w-3xl mx-auto py-12 px-6">
      {/* Head section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-extrabold text-neutral-400 uppercase tracking-widest block mb-1">
            Corporate Sponsor Deployment
          </span>
          <h2 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            Register Partner Entity
          </h2>
        </div>
        
        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono bg-neutral-100/50 px-3 py-1.5 rounded-xl border border-neutral-200/50">
          <Clock className={`w-3.5 h-3.5 ${isSaving ? "animate-spin text-black" : ""}`} />
          <span>{isSaving ? "Syncing draft..." : "Draft secured"}</span>
        </div>
      </div>

      {/* Steps bar */}
      {step <= 3 && (
        <div className="mb-10">
          <div className="flex justify-between text-xs font-sans font-bold text-neutral-400 mb-2">
            <span>Corporate Checklist: Step {step} of 3</span>
            <span>{Math.round(((step - 1) / 2) * 100)}% Completed</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-black rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="grid grid-cols-3 gap-1 mt-3">
            {["Corporate Profile", "Verification & Bio", "Hiring Specs"].map((t, idx) => (
              <span 
                key={t} 
                className={`text-[9px] font-mono uppercase font-black text-center ${
                  step === idx + 1 ? "text-neutral-900" : "text-neutral-300"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-premium relative min-h-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* STEP 1: CORPORATE IDENTITY */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900">Corporate Legal Identity</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5">Supply corporate identification, registry values, and web URLs to begin.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Logo Picker */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center border border-dashed border-neutral-200 rounded-2xl p-4 bg-neutral-50 hover:bg-neutral-100/50 transition-colors relative">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain shadow-xs" />
                    ) : (
                      <Building2 className="w-8 h-8 text-neutral-400" />
                    )}
                    <span className="text-[10px] font-sans font-bold text-neutral-500 mt-2 text-center">Corporate Logo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>

                  {/* Company Details */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700">Company Name *</label>
                      <input
                        type="text"
                        value={formData.companyName || ""}
                        onChange={(e) => updateField("companyName", e.target.value)}
                        placeholder="Horizon Labs Inc."
                        className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden focus:border-black"
                      />
                      {errors.companyName && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.companyName}</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700">Business Registration Number *</label>
                        <div className="relative">
                          <FileCheck2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            value={formData.businessRegistrationNumber || ""}
                            onChange={(e) => updateField("businessRegistrationNumber", e.target.value)}
                            placeholder="120-88-14569"
                            className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans focus:outline-hidden focus:border-black"
                          />
                        </div>
                        {errors.businessRegistrationNumber && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.businessRegistrationNumber}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700">Website URL *</label>
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            value={formData.website || ""}
                            onChange={(e) => updateField("website", e.target.value)}
                            placeholder="https://horizonlabs.io"
                            className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans focus:outline-hidden focus:border-black"
                          />
                        </div>
                        {errors.website && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.website}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Corporate HQ Country</label>
                    <input
                      type="text"
                      value={formData.country || ""}
                      onChange={(e) => updateField("country", e.target.value)}
                      placeholder="South Korea"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Primary Industry Sector</label>
                    <input
                      type="text"
                      value={formData.industry || ""}
                      onChange={(e) => updateField("industry", e.target.value)}
                      placeholder="AI, Developer Tooling, SaaS"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Company Size Bracket</label>
                    <select
                      value={formData.companySize || ""}
                      onChange={(e) => updateField("companySize", e.target.value)}
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs font-sans focus:outline-hidden"
                    >
                      <option value="1-10 employees">1-10 employees (Early)</option>
                      <option value="10-50 employees">10-50 employees (Growth)</option>
                      <option value="50-250 employees">50-250 employees (Midsize)</option>
                      <option value="250+ Enterprise">250+ employees (Enterprise)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">LinkedIn Organization Page</label>
                    <input
                      type="text"
                      value={formData.linkedin || ""}
                      onChange={(e) => updateField("linkedin", e.target.value)}
                      placeholder="https://linkedin.com/company/horizonlabs"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Office Physical Location Address</label>
                    <input
                      type="text"
                      value={formData.officeLocation || ""}
                      onChange={(e) => updateField("officeLocation", e.target.value)}
                      placeholder="Gangnam Teheran-ro, Seoul"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: REPRESENTATIVE & BIO */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900">Partner Representative Contact</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5">Identify the prime human point of contact who authorizes candidate testing.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Contact Person Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.contactPerson || ""}
                        onChange={(e) => updateField("contactPerson", e.target.value)}
                        placeholder="Yoon-Woo Park"
                        className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans focus:outline-hidden focus:border-black"
                      />
                    </div>
                    {errors.contactPerson && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.contactPerson}</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Job Title Position</label>
                    <input
                      type="text"
                      value={formData.position || ""}
                      onChange={(e) => updateField("position", e.target.value)}
                      placeholder="Lead Recruiter / CTO"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 font-sans">Representative Corporate Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="email"
                        value={formData.corporateEmail || ""}
                        onChange={(e) => updateField("corporateEmail", e.target.value)}
                        placeholder="yoonwoo@horizonlabs.io"
                        className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans focus:outline-hidden focus:border-black"
                      />
                    </div>
                    {errors.corporateEmail && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.corporateEmail}</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 font-sans">Account Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden focus:border-black"
                    />
                    {errors.password && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.password}</span>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 font-sans">Corporate Mobile Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={formData.phoneNumber || ""}
                      onChange={(e) => updateField("phoneNumber", e.target.value)}
                      placeholder="+82-10-9876-5432"
                      className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans focus:outline-hidden focus:border-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 font-sans">Corporate Introduction Mission *</label>
                  <textarea
                    value={formData.companyIntroduction || ""}
                    onChange={(e) => updateField("companyIntroduction", e.target.value)}
                    rows={4}
                    placeholder="Provide a description of your company, core products, and corporate values..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-xs font-sans focus:outline-hidden focus:border-black leading-relaxed font-light"
                  />
                  {errors.companyIntroduction && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.companyIntroduction}</span>}
                </div>
              </div>
            )}

            {/* STEP 3: HIRING PARAMETERS */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900">Talent Requirements & Specs</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5">Detail what skill stacks and majors qualify for your active developer listings.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Remote Office Policy</label>
                    <input
                      type="text"
                      value={formData.remotePolicy || ""}
                      onChange={(e) => updateField("remotePolicy", e.target.value)}
                      placeholder="Hybrid (2 days onsite)"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Initial Recruitment Pipeline Status</label>
                    <select
                      value={formData.recruitmentStatus || "Open"}
                      onChange={(e) => updateField("recruitmentStatus", e.target.value)}
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs font-sans focus:outline-hidden"
                    >
                      <option value="Open">Active Hiring (Challenges active)</option>
                      <option value="Closed">Inactive (Hold / Closed)</option>
                    </select>
                  </div>
                </div>

                {/* Required Tech Skills Tags */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 block">Required Skill Competencies (e.g. React, PyTorch)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="React"
                      className="flex-1 h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 h-11 bg-black text-white hover:bg-neutral-800 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(formData.requiredSkills || []).map(s => (
                      <span key={s} className="text-[10px] font-sans font-bold text-neutral-700 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span>{s}</span>
                        <button type="button" onClick={() => removeSkill(s)} className="text-neutral-400 hover:text-rose-500 font-bold ml-1 font-mono">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Company Benefits Tags */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 block">Organization Benefits (e.g. Stock options, Lunch)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      placeholder="Stock Options"
                      className="flex-1 h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="px-4 h-11 bg-black text-white hover:bg-neutral-800 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(formData.companyBenefits || []).map(b => (
                      <span key={b} className="text-[10px] font-sans font-bold text-neutral-700 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span>{b}</span>
                        <button type="button" onClick={() => removeBenefit(b)} className="text-neutral-400 hover:text-rose-500 font-bold ml-1 font-mono">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Terms Acceptance */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAgreement}
                      onChange={(e) => setTermsAgreement(e.target.checked)}
                      className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer mt-0.5"
                    />
                    <div className="text-xs font-sans text-neutral-500 leading-tight select-none">
                      <span>I authorize the verification audits of our physical business coordinates and registry, and agree to keep workspace postings compliant with <strong>KONEXA Sponsor Regulations</strong>. *</span>
                    </div>
                  </label>
                  {errors.terms && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.terms}</span>}
                </div>
              </div>
            )}

            {/* STEP 4: AI RECRUITING RECOMMENDATION SCREEN */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-3 shadow-xs animate-pulse">
                    <Sparkles className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="font-display font-black text-2xl text-neutral-900">Partner Entity Initialized</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5">Our semantic parser is indexing your corporate targets against live developer portfolios.</p>
                </div>

                {isAiLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Cpu className="w-10 h-10 text-neutral-300 animate-spin" />
                    <span className="text-xs font-sans text-neutral-500 font-bold">Auditing registry credentials & running semantic talent scanning...</span>
                  </div>
                ) : (
                  aiReport && (
                    <motion.div 
                      className="space-y-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Security Status Box */}
                      <div className="bg-neutral-50 border border-neutral-200 p-6 rounded-2xl space-y-3 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                            Verification: {aiReport.verificationStatus}
                          </span>
                          <span className="text-[9px] font-mono text-neutral-400">Compliance Audit Active</span>
                        </div>
                        <p className="font-sans text-xs text-neutral-500 leading-relaxed font-light">
                          {aiReport.auditDetails}
                        </p>
                      </div>

                      {/* Hiring Recommendation Matches */}
                      <div className="p-6 border border-neutral-200 rounded-2xl bg-white space-y-4 shadow-premium">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-widest block mb-1">
                            AI Recommendation Matches
                          </span>
                          <h4 className="font-display font-bold text-base text-neutral-900">
                            Semantic Candidates matched: {aiReport.matchingTalentsCount} profiles
                          </h4>
                          <p className="font-sans text-xs text-neutral-400 leading-relaxed font-light mt-1">
                            {aiReport.matchingStrategy}
                          </p>
                        </div>

                        {/* Profiles preview list */}
                        <div className="space-y-2 pt-2 border-t border-neutral-100">
                          <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Recommended Matches</span>
                          {aiReport.recommendedCandidates.map((c, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-neutral-50 border border-neutral-200/50 text-xs font-sans">
                              <span className="font-bold text-neutral-800">{c}</span>
                              <span className="text-[10px] font-mono text-green-600 bg-green-50 border border-green-100/50 px-2 py-0.5 rounded-md">98% Match</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => onSuccess()}
                        className="w-full h-12 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-sans font-semibold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                      >
                        <span>Launch First Code Challenge & Enter Workspace</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )
                )}
              </div>
            )}

            {/* Step Controls Footer */}
            {step <= 3 && (
              <div className="border-t border-neutral-100 pt-6 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={step === 1 ? onCancel : handleBack}
                  className="px-5 h-11 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-sans font-semibold text-neutral-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{step === 1 ? "Exit Onboarding" : "Previous Step"}</span>
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 h-11 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-sans font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Proceed Forward</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="px-5 h-11 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-sans font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Register Corporate Account</span>
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
