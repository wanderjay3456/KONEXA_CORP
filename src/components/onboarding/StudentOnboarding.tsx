import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../../context/AppContext";
import { AiProfileAnalysis, StudentProfile } from "../../types";
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
  ShieldCheck, 
  Lock, 
  Mail, 
  Settings, 
  Activity,
  AlertCircle
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { eventSystem } from "../../lib/eventSystem";
import { auth } from "../../lib/supabaseAuth";
import { uploadPrivateFile } from "../../lib/privateStorage";
import { firstValidationMessage, getStudentCompletionErrors } from "../../lib/profileCompletion";

interface StudentOnboardingProps {
  onComplete: () => void;
  onCancel?: () => void;
}

export default function StudentOnboarding({ onComplete, onCancel }: StudentOnboardingProps) {
  const { studentProfile, updateStudentProfile, projects } = useApp();
  const { success, error, info } = useToast();
  
  const [step, setStep] = useState(1);
  const totalSteps = 9;
  
  // Local onboarding state initialized with current profile or defaults
  const [formData, setFormData] = useState<Partial<StudentProfile>>({
    name: studentProfile?.name || "",
    preferredName: studentProfile?.preferredName || "",
    nationality: studentProfile?.nationality || "South Korea",
    currentCountry: studentProfile?.currentCountry || "South Korea",
    university: studentProfile?.university || "",
    degree: studentProfile?.degree || "",
    major: studentProfile?.major || "",
    graduationYear: studentProfile?.graduationYear || "",
    studentId: studentProfile?.studentId || "",
    languages: studentProfile?.languages || [],
    englishLevel: studentProfile?.englishLevel || "",
    koreanLevel: studentProfile?.koreanLevel || "",
    skills: studentProfile?.skills || [],
    certificates: studentProfile?.certificates || [],
    github: studentProfile?.github || "",
    portfolio: studentProfile?.portfolio || "",
    linkedin: studentProfile?.linkedin || "",
    resumeUrl: studentProfile?.resumeUrl || "",
    careerInterests: studentProfile?.careerInterests || [],
    preferredIndustry: studentProfile?.preferredIndustry || "",
    preferredJob: studentProfile?.preferredJob || "",
    preferredCountry: studentProfile?.preferredCountry || "South Korea",
    preferredWeeklyPayKrw: studentProfile?.preferredWeeklyPayKrw,
    availability: studentProfile?.availability || "",
    workPreference: studentProfile?.workPreference || "Remote",
    timezone: studentProfile?.timezone || "GMT+9 (Seoul)",
    bio: studentProfile?.bio || "",
    emergencyContact: studentProfile?.emergencyContact || "",
    notificationPreferences: studentProfile?.notificationPreferences || { email: true, push: true, marketing: false },
    privacySettings: studentProfile?.privacySettings || { publicProfile: true, showResume: true }
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [termsAgreement, setTermsAgreement] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // AI analysis state for the very end
  const [aiReport, setAiReport] = useState<AiProfileAnalysis | { status: "pending"; message: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState(false);

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
      if (step === totalSteps) {
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

  const validateStep = (): boolean => {
    const nextErrors: { [key: string]: string } = {};
    if (step === 2) {
      if (!formData.name?.trim()) nextErrors.name = "Legal Name is required.";
      if (!formData.nationality?.trim()) nextErrors.nationality = "Nationality is required.";
      if (!formData.currentCountry?.trim()) nextErrors.currentCountry = "Current country is required.";
      if (!formData.timezone?.trim()) nextErrors.timezone = "TimeZone is required.";
    } else if (step === 3) {
      if (!formData.university?.trim()) nextErrors.university = "University Name is required.";
      if (!formData.degree?.trim()) nextErrors.degree = "Degree level is required.";
      if (!formData.major?.trim()) nextErrors.major = "Academic major is required.";
      if (!formData.graduationYear?.trim()) nextErrors.graduationYear = "Graduation year is required.";
      if (!proofFile && !studentProfile?.identityDocumentPath) nextErrors.identityDocumentPath = "학적 증빙 서류를 업로드해 주세요.";
    } else if (step === 4) {
      if (!formData.englishLevel?.trim()) nextErrors.englishLevel = "English level is required.";
    } else if (step === 5) {
      if (!formData.skills?.length) nextErrors.skills = "At least one skill is required.";
    } else if (step === 6) {
      if (!formData.preferredJob?.trim()) nextErrors.preferredJob = "Preferred role is required.";
      if (!formData.availability?.trim()) nextErrors.availability = "Availability is required.";
      if (!Number.isFinite(formData.preferredWeeklyPayKrw) || Number(formData.preferredWeeklyPayKrw) <= 0) nextErrors.preferredWeeklyPayKrw = "희망 주급을 입력해 주세요.";
    } else if (step === 7) {
      if (!formData.github?.trim() && !formData.portfolio?.trim()) nextErrors.github = "GitHub or a portfolio URL is required.";
      if (!resumeFile && !studentProfile?.resumeUrl) nextErrors.resumeUrl = "PDF 이력서를 업로드해 주세요.";
    } else if (step === 8) {
      if (!formData.bio?.trim()) nextErrors.bio = "Biography pitch is required.";
    } else if (step === 9) {
      if (!termsAgreement) nextErrors.terms = "You must agree to the platform security terms.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      success("학적 서류 선택 완료", "프로필 저장 시 인증된 보안 저장소에 업로드됩니다.");
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      eventSystem.publish("ResumeUploaded", { fileName: file.name });
      success("이력서 선택 완료", "프로필 저장 시 인증된 보안 저장소에 업로드됩니다.");
    }
  };

  const handleFinalize = async () => {
    setIsAiLoading(true);
    let profileSaved = false;

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.");
      const preflightProfile = {
        ...formData,
        identityDocumentPath: studentProfile?.identityDocumentPath || (proofFile ? "pending-upload" : ""),
        resumeUrl: studentProfile?.resumeUrl || (resumeFile ? "pending-upload" : ""),
      };
      const preflightErrors = getStudentCompletionErrors(preflightProfile);
      if (Object.keys(preflightErrors).length > 0) {
        setErrors(preflightErrors);
        throw new Error(firstValidationMessage(preflightErrors));
      }

      const uploadedFields: Record<string, unknown> = {};
      if (proofFile) {
        uploadedFields.identityDocumentPath = await uploadPrivateFile("identity-documents", uid, proofFile);
      }
      if (resumeFile) {
        uploadedFields.resumeUrl = await uploadPrivateFile("resumes", uid, resumeFile);
      }
      // First, save the complete profile fields to local state & database
      const updatedProfile = {
        ...formData,
        ...uploadedFields,
        // Mark onboarding completed!
        onboardingCompleted: true,
        trustScore: studentProfile?.trustScore ?? 0,
        aiAnalysisStatus: "pending"
      } as any;

      const completionErrors = getStudentCompletionErrors(updatedProfile);
      if (Object.keys(completionErrors).length > 0) throw new Error(firstValidationMessage(completionErrors));

      const saved = await updateStudentProfile(updatedProfile);
      if (!saved) throw new Error("프로필 저장을 완료하지 못했습니다. 입력 내용과 업로드 파일을 확인해 주세요.");
      profileSaved = true;
      setAiStep(true);

      // Emit platform synchronization events
      eventSystem.publish("StudentCreated", updatedProfile);
      eventSystem.publish("ProfileCompleted", updatedProfile);
      eventSystem.publish("GitHubConnected", { github: formData.github });
      eventSystem.publish("LanguageUpdated", { languages: formData.languages });
      eventSystem.publish("SkillUpdated", { skills: formData.skills });
      eventSystem.publish("CareerGoalUpdated", { job: formData.preferredJob });

      const healthResponse = await fetch("/api/health");
      const health = healthResponse.ok ? await healthResponse.json() : null;
      if (!health?.configuration?.gemini) {
        setAiReport({ status: "pending", message: "필수정보 등록이 완료되었습니다. AI 점수는 서비스 연결 후 생성됩니다." });
        info("프로필 등록 완료", "AI 점수는 서비스 연결 후 생성됩니다.");
        return;
      }

      // Run server-side Gemini AI Profile Analysis in real-time
      const response = await fetch("/api/gemini/analyze-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: updatedProfile, role: "student" })
      });

      if (!response.ok) {
        throw new Error("AI engine connection issues");
      }

      const analysisResult = await response.json() as AiProfileAnalysis;
      const analysisSaved = await updateStudentProfile({
        aiAnalysisStatus: "completed",
        aiAnalysis: analysisResult,
        aiCareerReadiness: analysisResult.careerReadiness,
        aiEmployabilityScore: analysisResult.employabilityScore,
        aiAnalyzedAt: Date.now(),
      });
      if (!analysisSaved) throw new Error("AI 분석 결과를 프로필에 저장하지 못했습니다.");
      setAiReport(analysisResult);
      eventSystem.publish("AIAnalysisCompleted", analysisResult);
      success("AI Analysis Complete", "Gemini successfully completed your talent vector audits.");
    } catch (err) {
      if (!profileSaved) {
        console.error(err);
        error("필수정보 등록 실패", err instanceof Error ? err.message : "필수정보와 업로드 파일을 확인해 주세요.");
        setIsAiLoading(false);
        return;
      }
      console.warn("[KONEXA] Student profile saved; AI analysis remains pending", err);
      setAiReport({
        status: "pending",
        message: "필수정보 등록이 완료되었습니다. AI 점수는 서비스 연결 후 생성됩니다.",
      });
      info("프로필 등록 완료", "AI 점수는 서비스 연결 후 생성됩니다.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const getEstTime = () => {
    const remaining = totalSteps - step;
    return remaining === 0 ? "Under 30s" : `${remaining * 1} min remaining`;
  };

  return (
    <div className="onboarding-readable min-h-screen bg-neutral-950 text-white flex flex-col justify-center items-center px-5 py-10 sm:px-6 sm:py-14 font-sans relative overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      {!aiStep ? (
        <div className="w-full max-w-2xl space-y-8 relative z-10">
          
          {/* Header */}
          <div className="flex justify-between items-end border-b border-white/10 pb-6">
            <div>
              <span className="text-[10px] font-mono font-extrabold text-neutral-400 uppercase tracking-widest block mb-1">
                KONEXA INTERACTIVE PORTAL
              </span>
              <h2 className="font-display font-extrabold text-2xl tracking-tight text-white">
                Technical Talent Onboarding
              </h2>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="h-3.5 w-3.5 text-neutral-500" />
              <span>마지막 단계에서 저장됩니다</span>
            </div>
          </div>

          {/* Stepper progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400 font-bold">
              <span>Step {step} of {totalSteps}: {
                step === 1 ? "System Welcome" :
                step === 2 ? "Identity Anchors" :
                step === 3 ? "University Path" :
                step === 4 ? "Language Assessment" :
                step === 5 ? "Technical Skill Set" :
                step === 6 ? "Career Vectors" :
                step === 7 ? "Engineering Links" :
                step === 8 ? "Creative Biography" :
                "Security & Privacy"
              }</span>
              <span>{getEstTime()}</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white rounded-full"
                animate={{ width: `${(step / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Content Window */}
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
                {/* STEP 1: WELCOME */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-display font-black text-xl text-white tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-teal-400" />
                        <span>Welcome to your AI Onboarding Journey</span>
                      </h3>
                      <p className="text-neutral-400 text-xs leading-relaxed font-light">
                        At KONEXA, registration is not the end of onboarding — it is the absolute start of your AI journey. We match your real technical submissions directly with international software teams. Complete this 9-step setup to customize your AI recruiter algorithms.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Image/Video slot */}
                      <div className="border border-white/10 rounded-2xl p-5 bg-white/5 flex flex-col items-center justify-center text-center space-y-3">
                        <Cpu className="w-10 h-10 text-teal-400 animate-pulse" />
                        <div>
                          <span className="text-xs font-bold block">Interactive Matchmaker</span>
                          <p className="text-[10px] text-neutral-400 font-light mt-1">Our autonomous engines scan your entries in real-time to locate corporate sponsorships.</p>
                        </div>
                      </div>

                      {/* Interactive checklist */}
                      <div className="border border-white/10 rounded-2xl p-5 bg-white/5 space-y-3">
                        <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">Setup Requirements</span>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-neutral-300">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                            <span>Academic Status Verified</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-300">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                            <span>GitHub Code Repo Connected</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-300">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                            <span>Self-Assessed Language Skill</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PROFILE SETTINGS */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Identity & Localization</h3>
                      <p className="text-neutral-400 text-xs">Let’s secure your official legal name, localization metrics, and contact coordinates.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Full Legal Name *</label>
                        <input
                          type="text"
                          value={formData.name || ""}
                          onChange={(e) => updateField("name", e.target.value)}
                          placeholder="Alex Rivera"
                          className="w-full h-11 bg-white/5 border border-white/10 hover:border-white/20 focus:border-white rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white transition-colors"
                        />
                        {errors.name && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.name}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Preferred Name / Alias</label>
                        <input
                          type="text"
                          value={formData.preferredName || ""}
                          onChange={(e) => updateField("preferredName", e.target.value)}
                          placeholder="Alex"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Nationality</label>
                        <input
                          type="text"
                          value={formData.nationality || ""}
                          onChange={(e) => updateField("nationality", e.target.value)}
                          placeholder="South Korea"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Current Country Location</label>
                        <input
                          type="text"
                          value={formData.currentCountry || ""}
                          onChange={(e) => updateField("currentCountry", e.target.value)}
                          placeholder="Seoul, South Korea"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Time Zone Offset *</label>
                        <input
                          type="text"
                          value={formData.timezone || ""}
                          onChange={(e) => updateField("timezone", e.target.value)}
                          placeholder="GMT+9 (Seoul Standard)"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                        {errors.timezone && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.timezone}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Emergency Contact (Phone/Name)</label>
                        <input
                          type="text"
                          value={formData.emergencyContact || ""}
                          onChange={(e) => updateField("emergencyContact", e.target.value)}
                          placeholder="Mom (+82-10-1234-5678)"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: EDUCATION BACKGROUND */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Academic Integrity Background</h3>
                      <p className="text-neutral-400 text-xs">Verify your academic degree level and field of specialization.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">University / Institution *</label>
                        <input
                          type="text"
                          value={formData.university || ""}
                          onChange={(e) => updateField("university", e.target.value)}
                          placeholder="Seoul National University"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                        {errors.university && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.university}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Academic Major Study Field *</label>
                        <input
                          type="text"
                          value={formData.major || ""}
                          onChange={(e) => updateField("major", e.target.value)}
                          placeholder="Computer Science & Engineering"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                        {errors.major && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.major}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Degree Level</label>
                        <select
                          value={formData.degree || ""}
                          onChange={(e) => updateField("degree", e.target.value)}
                          className="w-full h-11 bg-neutral-800 border border-white/10 rounded-xl px-3 text-xs font-sans focus:outline-hidden text-white"
                        >
                          <option value="Associate Degree">Associate Degree</option>
                          <option value="Bachelor of Science">Bachelor of Science</option>
                          <option value="Master of Science">Master of Science</option>
                          <option value="Ph.D. Candidate">Ph.D. Candidate</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Graduation Year</label>
                        <input
                          type="text"
                          value={formData.graduationYear || ""}
                          onChange={(e) => updateField("graduationYear", e.target.value)}
                          placeholder="2026"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Student ID (Optional)</label>
                        <input
                          type="text"
                          value={formData.studentId || ""}
                          onChange={(e) => updateField("studentId", e.target.value)}
                          placeholder="SNU-2023-1056"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-300 block">Proof of Enrollment / Academic Degree (Required PDF/PNG) *</label>
                      <div className="border border-dashed border-white/10 rounded-2xl p-5 text-center bg-white/5 hover:bg-white/10 transition-colors relative flex flex-col items-center justify-center">
                        <UploadCloud className="w-6 h-6 text-neutral-400 mb-1" />
                        <span className="text-xs font-bold text-white">
                          {proofFile ? `Attached: ${proofFile.name}` : studentProfile?.identityDocumentPath ? "Verified document already uploaded" : "Upload Transcript or Degree Proof"}
                        </span>
                        <input 
                          type="file" 
                          accept=".pdf,image/*" 
                          onChange={handleProofUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </div>
                      {errors.identityDocumentPath && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.identityDocumentPath}</span>}
                    </div>
                  </div>
                )}

                {/* STEP 4: LANGUAGE PROFICIENCIES */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Language Proficiencies</h3>
                      <p className="text-neutral-400 text-xs">Self-assess your multi-lingual capability level to unlock cross-border matches.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-300 block">English Language Level</label>
                        <select
                          value={formData.englishLevel || ""}
                          onChange={(e) => updateField("englishLevel", e.target.value)}
                          className="w-full h-11 bg-neutral-800 border border-white/10 rounded-xl px-3 text-xs font-sans focus:outline-hidden text-white"
                        >
                          <option value="Beginner">Beginner / Limited</option>
                          <option value="Intermediate">Intermediate / Conversational</option>
                          <option value="Fluent">Fluent / Advanced Business</option>
                          <option value="Native / Bilingual">Native / Bilingual Speakers</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-300 block">Korean Language Level</label>
                        <select
                          value={formData.koreanLevel || ""}
                          onChange={(e) => updateField("koreanLevel", e.target.value)}
                          className="w-full h-11 bg-neutral-800 border border-white/10 rounded-xl px-3 text-xs font-sans focus:outline-hidden text-white"
                        >
                          <option value="Beginner">Beginner / Limited</option>
                          <option value="Intermediate">Intermediate / Conversational</option>
                          <option value="Fluent">Fluent / Advanced Business</option>
                          <option value="Native">Native Speakers</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <label className="text-xs font-bold text-neutral-300">Other Languages Spoken (Comma separated)</label>
                      <input
                        type="text"
                        value={formData.languages?.filter(l => l !== "English" && l !== "Korean").join(", ") || ""}
                        onChange={(e) => {
                          const others = e.target.value.split(",").map(l => l.trim()).filter(l => l !== "");
                          updateField("languages", ["English", "Korean", ...others]);
                        }}
                        placeholder="Japanese, Mandarin, Spanish..."
                        className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 5: TECHNICAL SKILLS */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Technical Core Skills</h3>
                      <p className="text-neutral-400 text-xs">Toggle and declare your stack specializations for Gemini indexing.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Skills Vector (Comma-separated list)</label>
                        <input
                          type="text"
                          value={formData.skills?.join(", ") || ""}
                          onChange={(e) => updateField("skills", e.target.value.split(",").map(s => s.trim()).filter(s => s !== ""))}
                          placeholder="React, TypeScript, Tailwind, Node.js, Next.js, Postgres"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.skills?.map(s => (
                          <span key={s} className="text-[10px] font-sans font-bold text-teal-400 bg-teal-950/40 border border-teal-800/40 px-3 py-1 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 block">AI Recruiter Recommended categories</span>
                        <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                          <button type="button" onClick={() => {
                            const cur = formData.skills || [];
                            const updated = Array.from(new Set([...cur, "Next.js", "GraphQL"]));
                            updateField("skills", updated);
                          }} className="p-2 text-left bg-neutral-800 rounded-lg border border-white/5 hover:border-white/20 transition-all">
                            Frontend: Next.js, GraphQL
                          </button>
                          <button type="button" onClick={() => {
                            const cur = formData.skills || [];
                            const updated = Array.from(new Set([...cur, "PostgreSQL", "Prisma"]));
                            updateField("skills", updated);
                          }} className="p-2 text-left bg-neutral-800 rounded-lg border border-white/5 hover:border-white/20 transition-all">
                            Backend: Postgres, Prisma
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: CAREER GOALS */}
                {step === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Career Vector & Expectations</h3>
                      <p className="text-neutral-400 text-xs">희망 직무, 선택형 주급, 근무 환경을 설정합니다.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Preferred Work Setting</label>
                        <select
                          value={formData.workPreference || "Remote"}
                          onChange={(e) => updateField("workPreference", e.target.value)}
                          className="w-full h-11 bg-neutral-800 border border-white/10 rounded-xl px-3 text-xs font-sans focus:outline-hidden text-white"
                        >
                          <option value="Remote">100% Remote Global Workflow</option>
                          <option value="Hybrid">Hybrid Workspace Model</option>
                          <option value="Onsite">Onsite physical physical office</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Employment Availability</label>
                        <input
                          type="text"
                          value={formData.availability || ""}
                          onChange={(e) => updateField("availability", e.target.value)}
                          placeholder="Immediate (Full-time)"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Target Job Title</label>
                        <input
                          type="text"
                          value={formData.preferredJob || ""}
                          onChange={(e) => updateField("preferredJob", e.target.value)}
                          placeholder="Software Engineer"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Target Tech Industry</label>
                        <input
                          type="text"
                          value={formData.preferredIndustry || ""}
                          onChange={(e) => updateField("preferredIndustry", e.target.value)}
                          placeholder="AI, SaaS, DevTools"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">희망 주급 (필수, 원) *</label>
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          inputMode="numeric"
                          value={formData.preferredWeeklyPayKrw ?? ""}
                          onChange={(e) => updateField("preferredWeeklyPayKrw", e.target.value === "" ? undefined : Number(e.target.value))}
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                        <p className="text-[10px] leading-4 text-neutral-500">프로젝트는 주 단위로 정산합니다.</p>
                        {errors.preferredWeeklyPayKrw && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.preferredWeeklyPayKrw}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">Target Corporate Location</label>
                        <input
                          type="text"
                          value={formData.preferredCountry || ""}
                          onChange={(e) => updateField("preferredCountry", e.target.value)}
                          placeholder="South Korea, US, Singapore"
                          className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-sans focus:outline-hidden text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7: RESUME UPLOAD */}
                {step === 7 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Technical Anchors & Artifacts</h3>
                      <p className="text-neutral-400 text-xs">Verify your technical code repos, and attach your latest resume PDF.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-neutral-300">GitHub Profile URL *</label>
                        <div className="relative">
                          <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type="text"
                            value={formData.github || ""}
                            onChange={(e) => updateField("github", e.target.value)}
                            placeholder="https://github.com/your-username"
                            className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 hover:border-white/20 focus:border-white rounded-xl text-xs font-sans focus:outline-hidden text-white transition-colors"
                          />
                        </div>
                        {errors.github && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.github}</span>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-300">LinkedIn Profile URL</label>
                          <div className="relative">
                            <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              type="text"
                              value={formData.linkedin || ""}
                              onChange={(e) => updateField("linkedin", e.target.value)}
                              placeholder="https://linkedin.com/in/username"
                              className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-xs font-sans focus:outline-hidden text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-300">Personal Website Portfolio</label>
                          <div className="relative">
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              type="text"
                              value={formData.portfolio || ""}
                              onChange={(e) => updateField("portfolio", e.target.value)}
                              placeholder="https://yourwebsite.com"
                              className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-xs font-sans focus:outline-hidden text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-neutral-300 block">Professional Engineering Resume (Required PDF) *</label>
                        <div className="border border-dashed border-white/10 rounded-2xl p-6 text-center bg-white/5 hover:bg-white/10 transition-colors relative flex flex-col items-center justify-center">
                          <UploadCloud className="w-8 h-8 text-neutral-400 mb-2" />
                          <span className="text-xs font-bold text-white">
                            {resumeFile ? `Attached Resume: ${resumeFile.name}` : studentProfile?.resumeUrl ? "Resume already uploaded" : "Click to select or drag Resume PDF here"}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono mt-1">Our server-side Gemini system will immediately index this document.</span>
                          <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={handleResumeUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                          />
                        </div>
                        {errors.resumeUrl && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.resumeUrl}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 8: BIOGRAPHY & PITCH */}
                {step === 8 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Interactive Pitch Biography</h3>
                      <p className="text-neutral-400 text-xs">Write a brief biographical profile summary or technical pitch for companies.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-300">Biography Pitch *</label>
                      <textarea
                        value={formData.bio || ""}
                        onChange={(e) => updateField("bio", e.target.value)}
                        rows={6}
                        placeholder="I am a dedicated software engineer specializing in interactive TypeScript applications and real-time backend integrations..."
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-white rounded-2xl p-4 text-xs font-sans focus:outline-hidden text-white leading-relaxed font-light transition-colors"
                      />
                      {errors.bio && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.bio}</span>}
                    </div>
                  </div>
                )}

                {/* STEP 9: PRIVACY & FINALIZATION */}
                {step === 9 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Security & Privacy Guardrails</h3>
                      <p className="text-neutral-400 text-xs">Authorize security constraints, configure visibility toggles, and finalize onboarding.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 text-xs">
                        <span className="text-[10px] font-mono font-bold uppercase text-neutral-400">Security Control Monitors</span>
                        
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="font-bold block">Public Search Catalog Listing</span>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Allow corporate recruiters to locate your verified score average.</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.privacySettings?.publicProfile}
                            onChange={(e) => updateField("privacySettings", { ...formData.privacySettings, publicProfile: e.target.checked })}
                            className="rounded border-white/20 text-teal-500 focus:ring-teal-500 bg-neutral-800 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer border-t border-white/10 pt-3">
                          <div>
                            <span className="font-bold block">1-Click Resume Access</span>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Let verified corporate sponsors fetch your indexed resume file.</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.privacySettings?.showResume}
                            onChange={(e) => updateField("privacySettings", { ...formData.privacySettings, showResume: e.target.checked })}
                            className="rounded border-white/20 text-teal-500 focus:ring-teal-500 bg-neutral-800 cursor-pointer"
                          />
                        </label>
                      </div>

                      <div className="space-y-3 text-xs font-sans text-neutral-400">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={termsAgreement}
                            onChange={(e) => setTermsAgreement(e.target.checked)}
                            className="rounded border-white/20 text-teal-500 focus:ring-teal-500 bg-neutral-800 cursor-pointer mt-0.5"
                          />
                          <span className="leading-tight">
                            I verify that all academic degrees and linked portfolios represent my personal, authentic work. I authorize the <strong>Gemini AI sandbox compiler</strong> to review and score all future code submissions. *
                          </span>
                        </label>
                        {errors.terms && <span className="text-[10px] text-rose-400 font-mono font-bold block">{errors.terms}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Controls Row */}
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
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 h-11 rounded-xl bg-white text-black hover:bg-neutral-200 font-sans text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{step === totalSteps ? "Initiate AI Core Audit" : "Continue"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* AI CORE HANDSHAKE LOADER & COMPREHENSIVE RECOMMENDATIONS DASHBOARD */
        <div className="w-full max-w-3xl space-y-7 relative z-10">
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-950/50 border border-teal-500/30 flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="font-display font-black text-2xl sm:text-[1.75rem] leading-tight tracking-tight text-white">KONEXA AI Onboarding Analytics</h3>
            <p className="text-neutral-400 text-sm leading-6 font-light max-w-lg mx-auto">
              Our server-side Gemini LLM is actively indexing your credentials, portfolio, resume syntax, and work vectors.
            </p>
          </div>

          {isAiLoading ? (
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-6">
              <Cpu className="w-12 h-12 text-teal-400 animate-spin" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">Calibrating Talent Vectors...</span>
                <p className="text-[10px] text-neutral-400 font-mono">Running secure LLM scoring protocols & generating audit roadmap</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-teal-400 bg-teal-950/40 border border-teal-800/40 px-3.5 py-1 rounded-full font-mono font-bold uppercase">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Synchronizing platform engines</span>
              </div>
            </div>
          ) : aiReport?.status === "pending" ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-teal-500/20 bg-neutral-900 p-6 text-center sm:p-8">
              <CheckCircle className="mx-auto h-9 w-9 text-teal-400" />
              <h4 className="mt-5 text-lg font-bold text-white">프로필 등록이 완료되었습니다</h4>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-300">{aiReport.message}</p>
              <button onClick={onComplete} className="mt-7 h-11 rounded-xl bg-white px-6 text-sm font-bold text-black transition hover:bg-neutral-200">대시보드로 이동</button>
            </motion.div>
          ) : (
            aiReport && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                {/* Score panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-neutral-900 border border-white/10 p-5 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Employability Index</span>
                    <div className="text-3xl font-display font-black text-teal-400">{aiReport.employabilityScore}%</div>
                  </div>
                  <div className="bg-neutral-900 border border-white/10 p-5 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Career Readiness</span>
                    <div className="text-3xl font-display font-black text-purple-400">{aiReport.careerReadiness}%</div>
                  </div>
                  <div className="bg-neutral-900 border border-white/10 p-5 rounded-2xl text-center space-y-1">
                    <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Analysis Status</span>
                    <div className="mt-2 text-lg font-display font-black text-amber-400">Completed</div>
                  </div>
                </div>

                {/* Main feedback box */}
                <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Gemini Technical Profile Audit</span>
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500">Server-side Gemini analysis</span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed font-light text-neutral-300">
                    <p className="font-semibold text-white">Strength Summary:</p>
                    <p className="bg-white/5 p-3 rounded-xl border border-white/5">{aiReport.strengthSummary}</p>
                    
                    <p className="font-semibold text-white mt-4">Growth Areas:</p>
                    <p className="bg-white/5 p-3 rounded-xl border border-white/5">{aiReport.weaknessSummary}</p>
                  </div>

                  {/* Multi-column Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">Skill Gaps Identified</span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiReport.skillGap?.map((sg: string) => (
                          <span key={sg} className="text-[10px] bg-rose-950/40 border border-rose-900/40 text-rose-300 px-2.5 py-0.5 rounded-full font-sans">
                            {sg}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">Recommended Skills to Add</span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiReport.recommendedSkills?.map((rs: string) => (
                          <span key={rs} className="text-[10px] bg-teal-950/40 border border-teal-900/40 text-teal-300 px-2.5 py-0.5 rounded-full font-sans">
                            {rs}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Career Learning path */}
                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase block">Recommended Learning Roadmap</span>
                    <div className="space-y-2">
                      {aiReport.recommendedLearningPath?.map((pathItem: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/5 p-2 rounded-xl text-xs font-sans text-neutral-200">
                          <span className="w-5 h-5 rounded-full bg-teal-950 text-teal-400 flex items-center justify-center font-mono font-bold text-[10px] border border-teal-900/40">{idx + 1}</span>
                          <span>{pathItem}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action trigger */}
                <button
                  onClick={onComplete}
                  className="w-full h-12 rounded-xl bg-white text-black hover:bg-neutral-200 font-sans text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <span>Sync Profile to Core Dashboard</span>
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
