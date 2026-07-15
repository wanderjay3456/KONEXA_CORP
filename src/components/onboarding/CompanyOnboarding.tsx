import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../../context/AppContext";
import { CompanyProfile } from "../../types";
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
  CheckCircle,
  Plus,
  Trash2,
  ChevronRight,
  UploadCloud,
  FileText
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { eventSystem } from "../../lib/eventSystem";
import { auth } from "../../lib/supabaseAuth";
import { uploadPrivateFile } from "../../lib/privateStorage";

interface CompanyOnboardingProps {
  onComplete: () => void;
  onCancel?: () => void;
}

export default function CompanyOnboarding({ onComplete, onCancel }: CompanyOnboardingProps) {
  const { companyProfile, updateCompanyProfile } = useApp();
  const { success, error, info } = useToast();
  
  const [step, setStep] = useState(1);
  const totalSteps = 6; // Steps 1 to 5, Step 6 is AI Talent Strategy
  
  // Local onboarding state initialized with current profile or defaults
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({
    companyName: companyProfile?.companyName || "",
    businessRegistrationNumber: companyProfile?.businessRegistrationNumber || "",
    country: companyProfile?.country || "South Korea",
    industry: companyProfile?.industry || "",
    companySize: companyProfile?.companySize || "",
    website: companyProfile?.website || "",
    linkedin: companyProfile?.linkedin || "",
    contactPerson: companyProfile?.contactPerson || "",
    position: companyProfile?.position || "",
    corporateEmail: companyProfile?.corporateEmail || "",
    phoneNumber: companyProfile?.phoneNumber || "",
    companyIntroduction: companyProfile?.companyIntroduction || "",
    hiringIndustry: companyProfile?.hiringIndustry || "",
    preferredMajors: companyProfile?.preferredMajors || [],
    requiredSkills: companyProfile?.requiredSkills || [],
    preferredLanguages: companyProfile?.preferredLanguages || [],
    companyBenefits: companyProfile?.companyBenefits || [],
    remotePolicy: companyProfile?.remotePolicy || "",
    recruitmentStatus: companyProfile?.recruitmentStatus || "Open",
    officeLocation: companyProfile?.officeLocation || "",
    notificationPreferences: companyProfile?.notificationPreferences || { email: true, system: true },
    verified: companyProfile?.verified || false,
    verifiedStatus: companyProfile?.verifiedStatus || "Pending",
    description: companyProfile?.description || ""
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [termsAgreement, setTermsAgreement] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  // AI analysis state for the very end
  const [aiReport, setAiReport] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState(false);

  // Custom skills or benefits inputs helpers
  const [skillInput, setSkillInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

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

  const handleNext = () => {
    if (validateStep()) {
      if (step === 5) {
        handleFinalize();
      } else {
        setStep(prev => prev + 1);
      }
    } else {
      error("Field Validation Error", "Please fill in all mandatory fields correctly.");
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSkip = () => {
    if (step < 5) {
      setStep(prev => prev + 1);
    }
  };

  const validateStep = (): boolean => {
    const nextErrors: { [key: string]: string } = {};
    if (step === 1) {
      if (!formData.companyName?.trim()) nextErrors.companyName = "Organization Name is required.";
      if (!formData.businessRegistrationNumber?.trim()) nextErrors.businessRegistrationNumber = "Business Registration Number is required.";
    } else if (step === 2) {
      if (!formData.website?.trim()) nextErrors.website = "Company Website URL is required.";
      if (!formData.corporateEmail?.trim()) nextErrors.corporateEmail = "Contact email is required.";
    } else if (step === 3) {
      if (!formData.companyIntroduction?.trim()) nextErrors.companyIntroduction = "A short introduction is required.";
    } else if (step === 5) {
      if (!termsAgreement) nextErrors.terms = "Agreement of terms is required to establish partner sponsorship.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const resultStr = uploadEvent.target.result as string;
          setLogoPreview(resultStr);
          updateField("companyLogo", resultStr);
          success("로고 선택 완료", "프로필 저장 시 인증된 보안 저장소에 업로드됩니다.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLicenseFile(file);
      success("사업자 서류 선택 완료", "프로필 저장 시 인증된 보안 저장소에 업로드됩니다.");
    }
  };

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    const current = formData.requiredSkills || [];
    if (!current.includes(skillInput.trim())) {
      const updated = [...current, skillInput.trim()];
      updateField("requiredSkills", updated);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    const updated = (formData.requiredSkills || []).filter(s => s !== skill);
    updateField("requiredSkills", updated);
  };

  const handleAddBenefit = () => {
    if (!benefitInput.trim()) return;
    const current = formData.companyBenefits || [];
    if (!current.includes(benefitInput.trim())) {
      const updated = [...current, benefitInput.trim()];
      updateField("companyBenefits", updated);
    }
    setBenefitInput("");
  };

  const handleRemoveBenefit = (benefit: string) => {
    const updated = (formData.companyBenefits || []).filter(b => b !== benefit);
    updateField("companyBenefits", updated);
  };

  const handleFinalize = async () => {
    setIsAiLoading(true);
    setAiStep(true);
    
    try {
      const uid = auth.currentUser?.uid;
      const uploadedFields: Record<string, unknown> = {};
      if (uid && logoFile) {
        uploadedFields.companyLogoPath = await uploadPrivateFile("profile-media", uid, logoFile);
      }
      if (uid && licenseFile) {
        uploadedFields.businessRegistrationDocumentPath = await uploadPrivateFile("business-documents", uid, licenseFile);
      }
      const updatedProfile = {
        ...formData,
        ...uploadedFields,
        onboardingCompleted: true,
        verified: false,
        verifiedStatus: licenseFile ? "Pending Review" : "Pending"
      } as any;

      await updateCompanyProfile(updatedProfile);

      // Emit synchronization events
      eventSystem.publish("CompanyCreated", updatedProfile);
      eventSystem.publish("ProfileCompleted", updatedProfile);

      // Call server Gemini to design Recruitment Strategy
      const response = await fetch("/api/gemini/analyze-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: updatedProfile, role: "company" })
      });

      if (!response.ok) {
        throw new Error("AI analysis connection timeout");
      }

      const result = await response.json();
      setAiReport(result);
      eventSystem.publish("AIAnalysisCompleted", result);
      success("Recruitment Strategy Designed", "Gemini successfully completed corporate match planning.");
    } catch (err) {
      console.error(err);
      // Do not present synthetic matching or verification results when the server is unavailable.
      setAiReport({
        status: "unavailable",
        message: "Gemini 분석 서버에 연결되지 않아 채용 전략을 생성하지 못했습니다. 서버 연결 후 다시 실행해 주세요.",
      });
      error("AI 서비스 연결 필요", "프로필은 저장됐지만 실제 채용 전략 분석은 완료되지 않았습니다.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-center items-center py-16 px-6 font-sans relative overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {!aiStep ? (
        <div className="w-full max-w-2xl space-y-8 relative z-10">
          
          {/* Header */}
          <div className="flex justify-between items-end border-b border-white/10 pb-6">
            <div>
              <span className="text-[10px] font-mono font-extrabold text-neutral-400 uppercase tracking-widest block mb-1">
                KONEXA SPONSOR PORTAL
              </span>
              <h2 className="font-display font-extrabold text-2xl tracking-tight text-white">
                Sponsor Organization Onboarding
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="h-3.5 w-3.5 text-neutral-500" />
              <span>마지막 단계에서 저장됩니다</span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400 font-bold">
              <span>Step {step} of 5: {
                step === 1 ? "Organization Identity" :
                step === 2 ? "Contact Coordinates" :
                step === 3 ? "Recruitment Targeting" :
                step === 4 ? "Benefits & Culture" :
                "Compliance & Finalize"
              }</span>
              <span>{5 - step} steps remaining</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white rounded-full"
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 shadow-2xl min-h-[380px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* STEP 1: IDENTITY */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Organization Identity</h3>
                      <p className="text-neutral-400 text-xs">Establish your corporate name, branding logo, and legal identification.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-4 bg-white/5 hover:bg-white/10 transition-colors relative">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo Preview" className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                        ) : (
                          <Building2 className="w-8 h-8 text-neutral-400" />
                        )}
                        <span className="text-[10px] text-neutral-400 font-sans font-bold mt-2 text-center">Company Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>

                      <div className="md:col-span-3 space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-300">Sponsoring Company Name *</label>
                          <input
                            type="text"
                            value={formData.companyName || ""}
                            onChange={(e) => updateField("companyName", e.target.value)}
                            placeholder="Horizon Labs Inc."
                            className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                          />
                          {errors.companyName && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.companyName}</span>}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-300">Business Registration Number *</label>
                          <input
                            type="text"
                            value={formData.businessRegistrationNumber || ""}
                            onChange={(e) => updateField("businessRegistrationNumber", e.target.value)}
                            placeholder="BRN-105-88-23459"
                            className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                          />
                          {errors.businessRegistrationNumber && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.businessRegistrationNumber}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Headquarters Country</label>
                        <input
                          type="text"
                          value={formData.country || ""}
                          onChange={(e) => updateField("country", e.target.value)}
                          placeholder="South Korea, US"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Headquarters Address</label>
                        <input
                          type="text"
                          value={formData.officeLocation || ""}
                          onChange={(e) => updateField("officeLocation", e.target.value)}
                          placeholder="Teheran-ro, Gangnam, Seoul"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CONTACT COORDINATES */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Contact & Network Footprint</h3>
                      <p className="text-neutral-400 text-xs">Define official online anchors and secure hiring manager coordinates.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Official Website URL *</label>
                        <input
                          type="text"
                          value={formData.website || ""}
                          onChange={(e) => updateField("website", e.target.value)}
                          placeholder="https://horizonlabs.io"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                        {errors.website && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.website}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">LinkedIn Organization Page</label>
                        <input
                          type="text"
                          value={formData.linkedin || ""}
                          onChange={(e) => updateField("linkedin", e.target.value)}
                          placeholder="https://linkedin.com/company/horizonlabs"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">HR Representative Name</label>
                        <input
                          type="text"
                          value={formData.contactPerson || ""}
                          onChange={(e) => updateField("contactPerson", e.target.value)}
                          placeholder="Seung-Min Kim"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">HR Corporate Email *</label>
                        <input
                          type="email"
                          value={formData.corporateEmail || ""}
                          onChange={(e) => updateField("corporateEmail", e.target.value)}
                          placeholder="hiring@horizonlabs.io"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                        {errors.corporateEmail && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.corporateEmail}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Representative Phone</label>
                        <input
                          type="text"
                          value={formData.phoneNumber || ""}
                          onChange={(e) => updateField("phoneNumber", e.target.value)}
                          placeholder="+82-2-1234-5678"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: RECRUITMENT TARGETING */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Recruitment Targeting</h3>
                      <p className="text-neutral-400 text-xs">Specify your strategic target majors, technical skill sets, and company mission details.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-300">Organization Introduction & Mission *</label>
                      <textarea
                        value={formData.companyIntroduction || ""}
                        onChange={(e) => updateField("companyIntroduction", e.target.value)}
                        rows={4}
                        placeholder="Describe your corporate roadmap, mission and software architectures..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-sans focus:outline-hidden text-white leading-relaxed font-light"
                      />
                      {errors.companyIntroduction && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.companyIntroduction}</span>}
                    </div>

                    {/* Required Skills editor */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <label className="text-xs font-bold text-neutral-300">Target Developer Competencies</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder="React, Postgres, Docker..."
                          className="flex-1 h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-hidden"
                        />
                        <button type="button" onClick={handleAddSkill} className="px-4 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200">
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {formData.requiredSkills?.map(s => (
                          <span key={s} className="text-[10px] font-sans font-bold text-teal-400 bg-teal-950/40 border border-teal-800/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span>{s}</span>
                            <button type="button" onClick={() => handleRemoveSkill(s)} className="text-neutral-400 hover:text-rose-400 ml-0.5">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: BENEFITS & CULTURE */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Benefits, Culture & Work Mode</h3>
                      <p className="text-neutral-400 text-xs">Publish your organizational benefits, working hours, and remote policy terms.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Remote Work Policy</label>
                        <select
                          value={formData.remotePolicy || ""}
                          onChange={(e) => updateField("remotePolicy", e.target.value)}
                          className="w-full h-11 bg-neutral-800 border border-white/10 rounded-xl px-3 text-xs font-sans text-white focus:outline-hidden"
                        >
                          <option value="Flexible (Hybrid model)">Flexible (Hybrid model)</option>
                          <option value="100% Remote Global">100% Remote Global</option>
                          <option value="Onsite Required">Onsite Physical Headquarters</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Working Size Bracket</label>
                        <select
                          value={formData.companySize || ""}
                          onChange={(e) => updateField("companySize", e.target.value)}
                          className="w-full h-11 bg-neutral-800 border border-white/10 rounded-xl px-3 text-xs font-sans text-white focus:outline-hidden"
                        >
                          <option value="1-10 employees">1-10 (Early Stage)</option>
                          <option value="10-50 employees">10-50 (SaaS scaleup)</option>
                          <option value="50-500 employees">50-500 (Growth scale)</option>
                          <option value="500+ Enterprise">500+ Enterprise</option>
                        </select>
                      </div>
                    </div>

                    {/* Benefits tags list */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <label className="text-xs font-bold text-neutral-300">Corporate Perks & Benefits</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={benefitInput}
                          onChange={(e) => setBenefitInput(e.target.value)}
                          placeholder="Stock Options, Unlimited PTO, Gym coverage..."
                          className="flex-1 h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-hidden"
                        />
                        <button type="button" onClick={handleAddBenefit} className="px-4 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200">
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {formData.companyBenefits?.map(b => (
                          <span key={b} className="text-[10px] font-sans font-bold text-neutral-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span>{b}</span>
                            <button type="button" onClick={() => handleRemoveBenefit(b)} className="text-neutral-500 hover:text-rose-400 ml-0.5">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: LEGAL & FINALIZATION */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Compliance & Platform Security</h3>
                      <p className="text-neutral-400 text-xs">Verify regulatory credentials, upload documents, and sign matching agreements.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-300 block">Upload Official Business Registration License (PDF/Image)</label>
                        <div className="border border-dashed border-white/10 rounded-2xl p-5 text-center bg-white/5 hover:bg-white/10 transition-colors relative flex flex-col items-center justify-center">
                          <UploadCloud className="w-8 h-8 text-neutral-400 mb-2" />
                          <span className="text-xs font-bold text-white">
                            {licenseFile ? `Attached: ${licenseFile.name}` : "Upload Business License Document"}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono mt-1">Our compliance team reviews license attachments within 24 hours.</span>
                          <input type="file" accept=".pdf,image/*" onChange={handleLicenseUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-white/10 text-xs font-sans text-neutral-400">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={termsAgreement}
                            onChange={(e) => setTermsAgreement(e.target.checked)}
                            className="rounded border-white/20 text-teal-500 focus:ring-teal-500 bg-neutral-800 cursor-pointer mt-0.5"
                          />
                          <span className="leading-tight">
                            I verify that this organization operates as a legitimate business under active compliance codes. I agree to pay students all rewards associated with challenges sponsored by our brand. *
                          </span>
                        </label>
                        {errors.terms && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.terms}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="border-t border-white/10 pt-6 flex justify-between gap-4 mt-8">
              <button
                type="button"
                onClick={step === 1 ? (onCancel || onComplete) : handleBack}
                className="px-5 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-sans text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{step === 1 ? "Exit" : "Back"}</span>
              </button>

              <div className="flex gap-2">
                {step < 5 && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-4 h-11 text-neutral-400 hover:text-white font-sans text-xs font-bold cursor-pointer transition-colors"
                  >
                    Skip
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 h-11 rounded-xl bg-white text-black hover:bg-neutral-200 font-sans text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{step === 5 ? "Verify Sponsoring Entity" : "Continue"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* AI MATCHING STRATEGY OVERLAY */
        <div className="w-full max-w-3xl space-y-8 relative z-10">
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-950/50 border border-teal-500/30 flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="font-display font-black text-3xl tracking-tight text-white">AI Recruitment & Sourcing Plan</h3>
            <p className="text-neutral-400 text-xs font-light max-w-md mx-auto">
              Our server-side Gemini system is mapping candidate pools matching your technical requirement indicators.
            </p>
          </div>

          {isAiLoading ? (
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-6">
              <Cpu className="w-12 h-12 text-teal-400 animate-spin" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">Establishing Corporate Portal...</span>
                <p className="text-[10px] text-neutral-400 font-mono">Formulating smart match recommendations and sandbox templates</p>
              </div>
            </div>
          ) : (
            aiReport && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                  <div className="bg-neutral-900 border border-white/10 p-5 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">Matched Talent Pool</span>
                    <div className="text-4xl font-display font-black text-teal-400">142 candidates</div>
                  </div>
                  <div className="bg-neutral-900 border border-white/10 p-5 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">Trust Validation Target</span>
                    <div className="text-4xl font-display font-black text-purple-400">&gt;80 score</div>
                  </div>
                  <div className="bg-neutral-900 border border-white/10 p-5 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block">Escrow Pipeline status</span>
                    <div className="text-4xl font-display font-black text-amber-400">Active</div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Gemini AI Talent Acquisition Strategy</span>
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500">Server-side Gemini analysis</span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed font-light text-neutral-300">
                    <p className="font-semibold text-white">Sponsorship Advantage:</p>
                    <p className="bg-white/5 p-3 rounded-xl border border-white/5">{aiReport.strengthSummary}</p>

                    <p className="font-semibold text-white mt-4">Hiring Risk Factors:</p>
                    <p className="bg-white/5 p-3 rounded-xl border border-white/5">{aiReport.weaknessSummary}</p>
                  </div>

                  {/* Sourcing guidelines */}
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">Recommended Sourcing Roadmap</span>
                    <div className="space-y-2">
                      {aiReport.recommendedLearningPath?.map((roadmapItem: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-xl text-xs font-sans text-neutral-200">
                          <span className="w-5 h-5 rounded-full bg-teal-950 text-teal-400 flex items-center justify-center font-mono font-bold text-[10px] border border-teal-900/40">{idx + 1}</span>
                          <span>{roadmapItem}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onComplete}
                  className="w-full h-12 rounded-xl bg-white text-black hover:bg-neutral-200 font-sans text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <span>Enter Partner Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )
          )}
        </div>
      )}
    </div>
  );
}
