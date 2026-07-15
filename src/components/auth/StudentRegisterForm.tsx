import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../../context/AppContext";
import { UserRole, StudentProfile } from "../../types";
import { 
  User, 
  MapPin, 
  GraduationCap, 
  Globe, 
  Link2, 
  Github, 
  Linkedin, 
  FileText, 
  Award, 
  Compass, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  UploadCloud, 
  Sparkles, 
  Cpu, 
  Clock, 
  ShieldCheck, 
  ToggleLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface StudentRegisterFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function StudentRegisterForm({ onCancel, onSuccess }: StudentRegisterFormProps) {
  const { registerUser, projects } = useApp();
  const { success, error, info } = useToast();
  
  const [step, setStep] = useState(1);
  const totalSteps = 6; // Steps 1 to 5 are forms, Step 6 is AI Onboarding Recommendation
  
  // Form State
  const [formData, setFormData] = useState<Partial<StudentProfile>>({
    name: "",
    preferredName: "",
    nationality: "South Korea",
    currentCountry: "South Korea",
    university: "",
    degree: "Bachelor of Science",
    major: "",
    graduationYear: "2026",
    studentId: "",
    languages: ["English", "Korean"],
    englishLevel: "Fluent",
    koreanLevel: "Native",
    skills: ["React", "TypeScript", "TailwindCSS"],
    certificates: [],
    github: "",
    portfolio: "",
    linkedin: "",
    resumeUrl: "",
    careerInterests: ["Frontend Engineering", "Fullstack Engineering"],
    preferredIndustry: "AI & SaaS",
    preferredJob: "Software Engineer",
    preferredCountry: "South Korea",
    preferredSalary: "$45,000 - $60,000",
    availability: "Immediate (Full-time)",
    workPreference: "Remote",
    timezone: "GMT+9 (Seoul)",
    bio: "",
    emergencyContact: "",
    notificationPreferences: { email: true, push: true, marketing: false },
    privacySettings: { publicProfile: true, showResume: true }
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsAgreement, setTermsAgreement] = useState(false);
  const [nonCircumventionAgreement, setNonCircumventionAgreement] = useState(false);
  const [privacyTransferConsent, setPrivacyTransferConsent] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  // AI Generated Insights State (Step 6)
  const [aiReport, setAiReport] = useState<{
    profileAnalysis: string;
    score: number;
    skillsVerified: string[];
    roleRecommendations: string[];
    recommendedProjectId: string;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Auto-Save simulation to showcase premium local persistence
  useEffect(() => {
    if (step > 1 && step < 6) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        setIsSaving(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData, step]);

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    // Clear inline error
    if (errors[key]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const resultStr = uploadEvent.target.result as string;
          setProfilePhotoPreview(resultStr);
          updateField("profilePhoto", resultStr);
          success("Photo uploaded successfully", "Your avatar preview was created locally.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeName(file.name);
      updateField("resumeUrl", "https://konexa.storage/resumes/" + file.name);
      success("Resume attached", `Attached file "${file.name}" for AI indexing.`);
    }
  };

  const validateStep = (): boolean => {
    const nextErrors: { [key: string]: string } = {};
    if (step === 1) {
      if (!formData.name?.trim()) nextErrors.name = "Full legal name is required.";
      if (!formData.bio?.trim()) nextErrors.bio = "A brief biographical pitch is required.";
      if (!email.trim() || !email.includes("@")) nextErrors.email = "A valid email is required.";
      if (!password.trim() || password.length < 6) nextErrors.password = "A password of at least 6 characters is required.";
    } else if (step === 2) {
      if (!formData.university?.trim()) nextErrors.university = "University Name is required.";
      if (!formData.major?.trim()) nextErrors.major = "Academic major study field is required.";
    } else if (step === 3) {
      if (!formData.github?.trim()) nextErrors.github = "GitHub is crucial for global technical validation.";
    } else if (step === 5) {
      if (!termsAgreement || !nonCircumventionAgreement || !privacyTransferConsent) nextErrors.terms = "필수 이용약관, 이탈거래 방지, 메시지 분석·국외이전 고지에 모두 동의해야 합니다.";
    }
    
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    } else {
      error("Form Validation Error", "Please resolve all highlighted fields before proceeding.");
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  // Build AI Profile Analysis & recommendation
  const runAiAnalysis = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      // Find a suitable challenge project
      const matchProject = projects.find(p => p.tags.some(t => formData.skills?.includes(t))) || projects[0];
      
      setAiReport({
        profileAnalysis: `Alex Rivera exhibits robust familiarity with ${formData.skills?.join(", ")}. Their educational background at ${formData.university} suggests high-integrity theoretical computer science knowledge. With English verified at [${formData.englishLevel}] and Korean verified at [${formData.koreanLevel}], they are prime candidates for cross-border software collaborations.`,
        score: 84,
        skillsVerified: formData.skills || [],
        roleRecommendations: [
          formData.preferredJob || "Frontend Engineer",
          "International Developer Associate",
          "SaaS Performance Engineer"
        ],
        recommendedProjectId: matchProject?.id || "seed-1"
      });
      setIsAiLoading(false);
    }, 1800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      const result = await registerUser(email, formData.name || "Global Student", UserRole.STUDENT, formData, undefined, password, {
        terms: termsAgreement,
        nonCircumvention: nonCircumventionAgreement,
        messageAnalysis: privacyTransferConsent,
        crossBorderPrivacy: privacyTransferConsent,
        documentVersion: "2026-07-15",
      });
      setEmailConfirmationRequired(result.emailConfirmationRequired);
      
      // Jump to Step 6 (AI evaluation onboarding recommendations screen!)
      setStep(6);
      runAiAnalysis();
    } catch (err: any) {
      error("Registration failed", err.message || "An account creation error occurred.");
    }
  };

  const handleFinishOnboarding = () => {
    if (emailConfirmationRequired) onCancel();
    else onSuccess();
  };

  return (
    <div id="student-onboarding" className="max-w-3xl mx-auto py-12 px-6">
      {/* Head section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-extrabold text-neutral-400 uppercase tracking-widest block mb-1">
            Global Talent Provisioning
          </span>
          <h2 className="font-display font-black text-3xl text-neutral-900 tracking-tight">
            Deploy your KONEXA Profile
          </h2>
        </div>
        
        {/* Autosave status indicator */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono bg-neutral-100/50 px-3 py-1.5 rounded-xl border border-neutral-200/50">
          <Clock className={`w-3.5 h-3.5 ${isSaving ? "animate-spin text-black" : ""}`} />
          <span>{isSaving ? "Autosaving state..." : "Draft secured"}</span>
        </div>
      </div>

      {/* Modern Horizontal Progress bar */}
      {step <= 5 && (
        <div className="mb-10">
          <div className="flex justify-between text-xs font-sans font-bold text-neutral-400 mb-2">
            <span>Progress Metric: Step {step} of 5</span>
            <span>{Math.round(((step - 1) / 4) * 100)}% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-black rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((step - 1) / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="grid grid-cols-5 gap-1 mt-3">
            {["Culture", "Academic", "Artifacts", "Specialties", "Legal"].map((t, idx) => (
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

      {/* Main form card */}
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
            {/* STEP 1: IDENTITY & CULTURE */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900">Personal Identity & Culture</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5">Let’s begin with your legal naming, background localization, and personal pitch bio.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Photo picker */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center border border-dashed border-neutral-200 rounded-2xl p-4 bg-neutral-50 hover:bg-neutral-100/50 transition-colors relative">
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover shadow-sm" />
                    ) : (
                      <User className="w-8 h-8 text-neutral-400" />
                    )}
                    <span className="text-[10px] font-sans font-bold text-neutral-500 mt-2 text-center">Avatar Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProfilePhotoChange} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>

                  {/* Identity Names */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700">Full Legal Name *</label>
                        <input
                          type="text"
                          value={formData.name || ""}
                          onChange={(e) => updateField("name", e.target.value)}
                          placeholder="Alex Rivera"
                          className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden focus:border-black"
                        />
                        {errors.name && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.name}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700">Preferred Name / Alias</label>
                        <input
                          type="text"
                          value={formData.preferredName || ""}
                          onChange={(e) => updateField("preferredName", e.target.value)}
                          placeholder="Alex"
                          className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700">Email Address *</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@university.edu"
                          className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden focus:border-black"
                        />
                        {errors.email && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.email}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700">Account Password *</label>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700 font-sans">Nationality</label>
                        <input
                          type="text"
                          value={formData.nationality || ""}
                          onChange={(e) => updateField("nationality", e.target.value)}
                          placeholder="South Korea, US, etc."
                          className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-700 font-sans">Current Country Location</label>
                        <input
                          type="text"
                          value={formData.currentCountry || ""}
                          onChange={(e) => updateField("currentCountry", e.target.value)}
                          placeholder="Seoul, South Korea"
                          className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 font-sans">Time Zone Offset</label>
                    <input
                      type="text"
                      value={formData.timezone || ""}
                      onChange={(e) => updateField("timezone", e.target.value)}
                      placeholder="GMT+9 (Seoul Standard)"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 font-sans">Emergency Contact (Name/Phone)</label>
                    <input
                      type="text"
                      value={formData.emergencyContact || ""}
                      onChange={(e) => updateField("emergencyContact", e.target.value)}
                      placeholder="Mom (+82-10-1234-5678)"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 font-sans">Pitch Biography *</label>
                  <textarea
                    value={formData.bio || ""}
                    onChange={(e) => updateField("bio", e.target.value)}
                    rows={4}
                    placeholder="Describe your development focus, background, or aspirations in a single short paragraph..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-xs font-sans focus:outline-hidden focus:border-black leading-relaxed font-light"
                  />
                  {errors.bio && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.bio}</span>}
                </div>
              </div>
            )}

            {/* STEP 2: ACADEMICS & LANGUAGES */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900">Academic Integrity & Languages</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5">Define your degree status and language proficiencies to qualify for corporate projects.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">University Name *</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.university || ""}
                        onChange={(e) => updateField("university", e.target.value)}
                        placeholder="Seoul National University"
                        className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans focus:outline-hidden focus:border-black"
                      />
                    </div>
                    {errors.university && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.university}</span>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Academic Major Study Field *</label>
                    <input
                      type="text"
                      value={formData.major || ""}
                      onChange={(e) => updateField("major", e.target.value)}
                      placeholder="Computer Science & Engineering"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden focus:border-black"
                    />
                    {errors.major && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.major}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Degree Focus Level</label>
                    <select
                      value={formData.degree || ""}
                      onChange={(e) => updateField("degree", e.target.value)}
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs font-sans focus:outline-hidden"
                    >
                      <option value="Associate Degree">Associate Degree</option>
                      <option value="Bachelor of Science">Bachelor of Science</option>
                      <option value="Master of Science">Master of Science</option>
                      <option value="Ph.D. Researcher">Ph.D. Researcher</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 font-sans">Graduation Year</label>
                    <input
                      type="text"
                      value={formData.graduationYear || ""}
                      onChange={(e) => updateField("graduationYear", e.target.value)}
                      placeholder="2026"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 font-sans">Student ID (Optional)</label>
                    <input
                      type="text"
                      value={formData.studentId || ""}
                      onChange={(e) => updateField("studentId", e.target.value)}
                      placeholder="SNU-2023-14569"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">English Competency Level</label>
                    <select
                      value={formData.englishLevel || ""}
                      onChange={(e) => updateField("englishLevel", e.target.value)}
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs font-sans focus:outline-hidden"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate / Conversational</option>
                      <option value="Fluent">Fluent / Advanced</option>
                      <option value="Native / Bilingual">Native / Bilingual</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Korean Competency Level</label>
                    <select
                      value={formData.koreanLevel || ""}
                      onChange={(e) => updateField("koreanLevel", e.target.value)}
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs font-sans focus:outline-hidden"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate / Conversational</option>
                      <option value="Fluent">Fluent / Advanced</option>
                      <option value="Native">Native Speakers</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: ARTIFACTS & LINKS */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900">Technical Portfolio & Artifacts</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5">Integrate links to verify your engineering code repositories, documents, and professional footprints.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">GitHub Profile URL *</label>
                    <div className="relative">
                      <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.github || ""}
                        onChange={(e) => updateField("github", e.target.value)}
                        placeholder="https://github.com/your-username"
                        className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans focus:outline-hidden focus:border-black"
                      />
                    </div>
                    {errors.github && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.github}</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700">LinkedIn Profile URL</label>
                      <div className="relative">
                        <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="text"
                          value={formData.linkedin || ""}
                          onChange={(e) => updateField("linkedin", e.target.value)}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-700 font-sans">Personal Portfolio / Website</label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="text"
                          value={formData.portfolio || ""}
                          onChange={(e) => updateField("portfolio", e.target.value)}
                          placeholder="https://mywebsite.com"
                          className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-sans focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resume Simulated upload */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-neutral-700 font-sans block mb-1.5">Official Professional Resume (PDF format)</label>
                    <div className="border border-dashed border-neutral-200 rounded-2xl p-6 text-center bg-neutral-50 hover:bg-neutral-100/50 transition-colors relative flex flex-col items-center justify-center">
                      <UploadCloud className="w-8 h-8 text-neutral-400 mb-2" />
                      <span className="text-xs font-sans font-bold text-neutral-700">
                        {resumeName ? `Selected: ${resumeName}` : "Click to select or drag PDF file here"}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-sans mt-1">Recommended size limit: 5MB. AI will immediately index the content.</span>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleResumeChange}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: SKILLS & PREFERENCES */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900">Career Specialties & Preferences</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5">Specify your core technical competencies and preferred employment vectors.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Work Preference Mode</label>
                    <select
                      value={formData.workPreference || "Remote"}
                      onChange={(e) => updateField("workPreference", e.target.value)}
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-3 text-xs font-sans focus:outline-hidden"
                    >
                      <option value="Remote">100% Remote Workflow</option>
                      <option value="Hybrid">Hybrid Office Arrangement</option>
                      <option value="Onsite">Onsite Physical Headquarters</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Employment Availability</label>
                    <input
                      type="text"
                      value={formData.availability || ""}
                      onChange={(e) => updateField("availability", e.target.value)}
                      placeholder="Immediate (Full-time)"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Preferred Tech Sector/Industry</label>
                    <input
                      type="text"
                      value={formData.preferredIndustry || ""}
                      onChange={(e) => updateField("preferredIndustry", e.target.value)}
                      placeholder="AI, Developer Tooling, SaaS"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Preferred Target Role</label>
                    <input
                      type="text"
                      value={formData.preferredJob || ""}
                      onChange={(e) => updateField("preferredJob", e.target.value)}
                      placeholder="Full Stack Software Engineer"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 font-sans">Preferred Salary Expectation</label>
                    <input
                      type="text"
                      value={formData.preferredSalary || ""}
                      onChange={(e) => updateField("preferredSalary", e.target.value)}
                      placeholder="$50,000 - $70,000 / year"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 font-sans">Preferred Job Country</label>
                    <input
                      type="text"
                      value={formData.preferredCountry || ""}
                      onChange={(e) => updateField("preferredCountry", e.target.value)}
                      placeholder="South Korea, USA, Singapore"
                      className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Technical Skills selection list */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700">Core Technical Specialities (comma-separated list)</label>
                  <input
                    type="text"
                    value={formData.skills?.join(", ") || ""}
                    onChange={(e) => updateField("skills", e.target.value.split(",").map(s => s.trim()).filter(s => s !== ""))}
                    placeholder="React, TypeScript, TailwindCSS, Node.js, Postgres"
                    className="w-full h-11 bg-neutral-50 border border-neutral-200 rounded-xl px-4 text-xs font-sans focus:outline-hidden"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.skills?.map(s => (
                      <span key={s} className="text-[10px] font-sans font-bold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: CONSENTS & FINALIZE */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-neutral-900">Security & Agreement Signoff</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5">Commit to our global workspace terms, and configure your privacy filters.</p>
                </div>

                <div className="space-y-4">
                  {/* Privacy settings toggles */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/60 space-y-3">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Privacy Configurations</span>
                    
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-neutral-800">Public Profile Catalog Listing</span>
                        <p className="text-[10px] text-neutral-400 leading-tight">Allow companies to search, view, and recruit your verified profile globally.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.privacySettings?.publicProfile}
                        onChange={(e) => updateField("privacySettings", { ...formData.privacySettings, publicProfile: e.target.checked })}
                        className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer border-t border-neutral-200/50 pt-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-neutral-800">Direct Resume Download Accessibility</span>
                        <p className="text-[10px] text-neutral-400 leading-tight">Let verified recruiters fetch your official indexed resume directly in 1-click.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.privacySettings?.showResume}
                        onChange={(e) => updateField("privacySettings", { ...formData.privacySettings, showResume: e.target.checked })}
                        className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Consents list */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer mt-0.5"
                      />
                      <div className="text-xs font-sans text-neutral-500 leading-tight select-none">
                        <span>I consent to receive selective emails regarding new global projects, hackathons, and matching suggestions from KONEXA.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAgreement}
                        onChange={(e) => setTermsAgreement(e.target.checked)}
                        className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer mt-0.5"
                      />
                      <div className="text-xs font-sans text-neutral-500 leading-tight select-none">
                        <span>I confirm that I have reviewed and agree to the <strong>KONEXA Terms of Service</strong>, global matching policy, and <strong>Privacy Standards</strong>. *</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nonCircumventionAgreement}
                        onChange={(e) => setNonCircumventionAgreement(e.target.checked)}
                        className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer mt-0.5"
                      />
                      <div className="text-xs font-sans text-neutral-500 leading-tight select-none">
                        프로젝트 진행 중 플랫폼 외 거래를 하지 않고, KONEXA를 통해 소개받은 기업과의 직접 고용·용역 전환은 12개월간 플랫폼에 신고하는 정책을 확인했습니다. 학생에게 거액의 위약금을 부과하는 조항은 적용하지 않습니다. *
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacyTransferConsent}
                        onChange={(e) => setPrivacyTransferConsent(e.target.checked)}
                        className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer mt-0.5"
                      />
                      <div className="text-xs font-sans text-neutral-500 leading-tight select-none">
                        계약 전 연락처 공유 방지를 위한 메시지 패턴 탐지와 한국·해외 간 개인정보 이전 고지를 확인했습니다. 위험기록에는 메시지 원문 대신 탐지 유형과 기록 ID만 저장합니다. *
                      </div>
                    </label>
                    {errors.terms && <span className="text-[10px] text-rose-500 font-mono font-bold block">{errors.terms}</span>}
                  </div>
                </div>

                {/* Big register call */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full h-12 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-sans font-semibold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Provision Verified Identity & Scan Profile</span>
                </button>
              </div>
            )}

            {/* STEP 6: AI CO-PILOT ANALYSIS SCREEN */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-3 shadow-xs animate-pulse">
                    <Sparkles className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="font-display font-black text-2xl text-neutral-900">KONEXA Onboarding Analysis</h3>
                  <p className="font-sans text-xs text-neutral-400 mt-0.5">Let our real-time AI indexer audit your credentials, portfolio, and matching preferences.</p>
                </div>

                {isAiLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Cpu className="w-10 h-10 text-neutral-300 animate-spin" />
                    <span className="text-xs font-sans text-neutral-500 font-bold">Scanning GitHub, Resume, and Degree portfolios...</span>
                    <span className="text-[10px] font-mono text-neutral-400">Verifying security records through Supabase indexers</span>
                  </div>
                ) : (
                  aiReport && (
                    <motion.div 
                      className="space-y-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Analysis Block */}
                      <div className="bg-neutral-50 border border-neutral-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg">
                            AI Audit Completed
                          </span>
                          <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-lg">
                            Initial Trust Score: {aiReport.score}/100
                          </span>
                        </div>
                        
                        <p className="font-sans text-xs text-neutral-600 leading-relaxed font-light whitespace-pre-line">
                          {aiReport.profileAnalysis}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200/60">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1">Roles Matched</span>
                            <div className="flex flex-wrap gap-1">
                              {aiReport.roleRecommendations.map(r => (
                                <span key={r} className="text-[10px] font-sans font-bold text-neutral-700 bg-neutral-200/60 px-2.5 py-0.5 rounded-full">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1">Indexed Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {aiReport.skillsVerified.map(s => (
                                <span key={s} className="text-[10px] font-sans font-bold text-neutral-700 bg-neutral-200/60 px-2.5 py-0.5 rounded-full">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Matching Project suggestion */}
                      <div className="border border-neutral-200 p-5 rounded-2xl flex flex-col justify-between bg-white shadow-premium">
                        <div>
                          <span className="text-[9px] font-mono font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Recommended Challenge
                          </span>
                          <h4 className="font-display font-bold text-base text-neutral-900 mt-2">
                            {projects.find(p => p.id === aiReport.recommendedProjectId)?.title || "Vite + React Core Performance Optimizer"}
                          </h4>
                          <p className="font-sans text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                            {projects.find(p => p.id === aiReport.recommendedProjectId)?.description || "Complete this entry performance challenge to boost your initial trust metrics by up to 15 points."}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                          <span className="font-mono text-neutral-400">Reward: <strong className="text-neutral-900 font-bold">{projects.find(p => p.id === aiReport.recommendedProjectId)?.reward || "$2,800 + Fast-Track"}</strong></span>
                          <span className="text-neutral-400 text-[10px] font-mono font-extrabold uppercase">{projects.find(p => p.id === aiReport.recommendedProjectId)?.difficulty || "HARD"}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleFinishOnboarding}
                        className="w-full h-12 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-sans font-semibold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                      >
                        <span>{emailConfirmationRequired ? "Confirm Email, Then Sign In" : "Claim Recommended Challenge & Enter Dashboard"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )
                )}
              </div>
            )}

            {/* Stepper Footer Controls */}
            {step <= 5 && (
              <div className="border-t border-neutral-100 pt-6 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={step === 1 ? onCancel : handleBack}
                  className="px-5 h-11 border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-sans font-semibold text-neutral-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{step === 1 ? "Exit Onboarding" : "Previous Step"}</span>
                </button>

                {step < 5 ? (
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
                    <span>Register Account</span>
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
