import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Building2, Check, Globe2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLocale } from "../../i18n/LocaleContext";
import { CompanyProfile, UserRole } from "../../types";
import { useToast } from "../ui/Toast";

interface CompanyRegisterFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const countries = ["South Korea", "Vietnam", "Other"];
const industries = ["IT / Software", "Manufacturing", "Commerce / Retail", "Content / Media", "Professional Services", "Education", "Other"];
const sizes = ["1–10", "11–50", "51–200", "201–500", "501+"];
const needs = ["Software Development", "Data & AI", "UI / UX", "Marketing", "Business Operations", "Translation"];
const skills = ["JavaScript", "TypeScript", "React", "Python", "AI / ML", "Data Analysis", "Figma", "Digital Marketing", "Korean", "English", "Vietnamese"];
const workModes = ["Remote", "Hybrid", "Onsite"];

const copy = {
  ko: {
    eyebrow: "약 2분이면 완료",
    title: "채용 의도만 먼저 알려주세요.",
    lead: "사업자등록증, 담당자 연락처, 회사 소개와 상세 공고는 가입 후 필요한 시점에 등록할 수 있습니다.",
    account: "기업 정보",
    preference: "채용 설정",
    google: "Google로 빠르게 시작",
    divider: "또는 이메일로 가입",
    company: "기업명",
    country: "본사 국가",
    industry: "업종",
    size: "기업 규모",
    email: "업무용 이메일",
    password: "비밀번호",
    passwordHint: "6자 이상",
    next: "다음",
    back: "이전",
    needs: "채용하려는 직무",
    skills: "우선적으로 필요한 기술",
    mode: "선호 협업 방식",
    optional: "선택 · 나중에 공고에서 구체화 가능",
    terms: "KONEXA 이용약관과 개인정보처리방침에 동의합니다.",
    transaction: "인재 소개·계약 단계의 플랫폼 외 거래 방지 약정에 동의합니다.",
    privacy: "안전한 거래를 위한 메시지 분석 및 개인정보 국외이전 고지에 동의합니다.",
    marketing: "인재풀과 서비스 업데이트를 이메일로 받습니다. (선택)",
    submit: "기업 계정 만들기",
    submitting: "계정을 만들고 있어요",
    required: "필수 항목을 확인해 주세요.",
    confirmationTitle: "확인 이메일을 보냈습니다.",
    confirmationBody: "이메일을 확인한 뒤 로그인하면 바로 구인공고를 작성할 수 있습니다.",
    login: "로그인 화면으로",
    later: "기업 검증은 공고 게시 전에 완료",
  },
  en: {
    eyebrow: "Takes about 2 minutes",
    title: "Start with your hiring intent.",
    lead: "Add business documents, contact details, company background, and a full job post later.",
    account: "Company",
    preference: "Hiring",
    google: "Continue with Google",
    divider: "or sign up with email",
    company: "Company name",
    country: "Headquarters",
    industry: "Industry",
    size: "Company size",
    email: "Work email",
    password: "Password",
    passwordHint: "At least 6 characters",
    next: "Continue",
    back: "Back",
    needs: "Roles you want to hire",
    skills: "Priority skills",
    mode: "Preferred work mode",
    optional: "Optional · refine it in your job post",
    terms: "I agree to the KONEXA Terms and Privacy Policy.",
    transaction: "I agree to the non-circumvention terms for talent introductions and contracts.",
    privacy: "I agree to the message-safety analysis and cross-border privacy notice.",
    marketing: "Send me talent-pool and service updates. (Optional)",
    submit: "Create company account",
    submitting: "Creating your account",
    required: "Please check the required fields.",
    confirmationTitle: "Check your inbox.",
    confirmationBody: "Confirm your email, then sign in to create your first job post.",
    login: "Go to sign in",
    later: "Complete company verification before publishing",
  },
  vi: {
    eyebrow: "Chỉ mất khoảng 2 phút",
    title: "Bắt đầu với nhu cầu tuyển dụng.",
    lead: "Bạn có thể bổ sung giấy tờ doanh nghiệp, liên hệ, giới thiệu công ty và tin tuyển dụng chi tiết sau.",
    account: "Doanh nghiệp",
    preference: "Tuyển dụng",
    google: "Tiếp tục với Google",
    divider: "hoặc đăng ký bằng email",
    company: "Tên doanh nghiệp",
    country: "Trụ sở chính",
    industry: "Lĩnh vực",
    size: "Quy mô công ty",
    email: "Email công việc",
    password: "Mật khẩu",
    passwordHint: "Tối thiểu 6 ký tự",
    next: "Tiếp tục",
    back: "Quay lại",
    needs: "Vị trí cần tuyển",
    skills: "Kỹ năng ưu tiên",
    mode: "Hình thức làm việc",
    optional: "Không bắt buộc · bổ sung trong tin tuyển dụng",
    terms: "Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của KONEXA.",
    transaction: "Tôi đồng ý với điều khoản không giao dịch ngoài nền tảng.",
    privacy: "Tôi đồng ý với thông báo phân tích tin nhắn an toàn và chuyển dữ liệu xuyên biên giới.",
    marketing: "Gửi cho tôi cập nhật về ứng viên và dịch vụ. (Không bắt buộc)",
    submit: "Tạo tài khoản doanh nghiệp",
    submitting: "Đang tạo tài khoản",
    required: "Vui lòng kiểm tra các mục bắt buộc.",
    confirmationTitle: "Hãy kiểm tra email.",
    confirmationBody: "Xác nhận email rồi đăng nhập để tạo tin tuyển dụng đầu tiên.",
    login: "Đi đến đăng nhập",
    later: "Xác minh doanh nghiệp trước khi đăng tin",
  },
} as const;

function ChoiceChip({ selected, onClick, children }: { key?: React.Key; selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${selected ? "border-[#17342d] bg-[#17342d] text-white" : "border-[#17342d]/15 bg-white text-[#315149] hover:border-[#17342d]/40"}`}>{children}</button>;
}

export default function CompanyRegisterForm({ onCancel, onSuccess }: CompanyRegisterFormProps) {
  const { registerUser, googleLogin } = useApp();
  const { locale } = useLocale();
  const { error } = useToast();
  const t = copy[locale];
  const [step, setStep] = useState(1);
  const [authMethod, setAuthMethod] = useState<"email" | "google">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [agreements, setAgreements] = useState({ terms: false, transaction: false, privacy: false, marketing: false });
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [workMode, setWorkMode] = useState("");
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({
    companyName: "",
    country: "South Korea",
    industry: "",
    companySize: "",
    requiredSkills: [],
    preferredLanguages: [],
    recruitmentStatus: "Open",
    website: "",
    description: "",
    verified: false,
    verifiedStatus: "Pending",
    notificationPreferences: { email: true, system: true },
    onboardingCompleted: false,
  });

  const setField = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => setFormData((current) => ({ ...current, [key]: value }));
  const toggle = (list: string[], value: string, setter: (next: string[]) => void) => setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const validateAccount = () => {
    if (!formData.companyName?.trim() || !formData.country || !formData.industry || !formData.companySize) return false;
    if (authMethod === "email" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6)) return false;
    return true;
  };
  const validateAgreements = () => agreements.terms && agreements.transaction && agreements.privacy;

  const goNext = () => {
    if (!validateAccount()) {
      error(t.required, t.required);
      return;
    }
    setStep(2);
  };

  const profilePayload = {
    ...formData,
    hiringIndustry: selectedNeeds.join(", "),
    remotePolicy: workMode,
    corporateEmail: authMethod === "email" ? email : "",
    description: formData.industry ? `${formData.industry} company` : "",
    notificationPreferences: { email: true, system: true },
  };
  const consentBundle = {
    terms: agreements.terms,
    nonCircumvention: agreements.transaction,
    messageAnalysis: agreements.privacy,
    crossBorderPrivacy: agreements.privacy,
    marketing: agreements.marketing,
    documentVersion: "2026-07-27",
  };

  const submitEmail = async () => {
    if (!validateAccount() || !validateAgreements()) {
      error(t.required, t.required);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await registerUser(email, formData.companyName!.trim(), UserRole.COMPANY, undefined, profilePayload, password, consentBundle);
      if (result.emailConfirmationRequired) setEmailConfirmationRequired(true);
      else onSuccess();
    } catch {
      // registerUser reports the actionable error through the shared toast.
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGoogle = async () => {
    if (!validateAccount() || !validateAgreements()) {
      error(t.required, t.required);
      return;
    }
    setIsSubmitting(true);
    try {
      await googleLogin(UserRole.COMPANY, { mode: "register", profileData: profilePayload, consentBundle });
    } catch {
      setIsSubmitting(false);
    }
  };

  if (emailConfirmationRequired) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f6f1] px-5">
        <section className="w-full max-w-lg rounded-[2rem] border border-[#17342d]/10 bg-white p-8 text-center shadow-[0_30px_90px_rgba(23,52,45,.1)] sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#dff8ea] text-[#23644e]"><Mail className="h-6 w-6" /></span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-[-.04em] text-[#17342d]">{t.confirmationTitle}</h1>
          <p className="mt-4 leading-7 text-[#557069]">{t.confirmationBody}</p>
          <button type="button" onClick={onCancel} className="mt-8 rounded-full bg-[#17342d] px-6 py-3 text-sm font-bold text-white">{t.login}</button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={step === 1 ? onCancel : () => setStep(1)} className="inline-flex items-center gap-2 text-sm font-bold text-[#48645d]"><ArrowLeft className="h-4 w-4" />{t.back}</button>
        <section className="mt-5 overflow-hidden rounded-[2rem] border border-[#17342d]/10 bg-white shadow-[0_30px_90px_rgba(23,52,45,.09)]">
          <div className="grid lg:grid-cols-[.72fr_1.28fr]">
            <aside className="bg-[#17342d] p-7 text-white sm:p-10">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-[#b9f4d0]"><Sparkles className="h-4 w-4" />{t.eyebrow}</span>
              <h1 className="mt-5 font-display text-3xl font-bold leading-tight tracking-[-.04em] sm:text-4xl">{t.title}</h1>
              <p className="mt-5 text-sm leading-7 text-white/70">{t.lead}</p>
              <div className="mt-8 space-y-3 text-sm font-semibold">
                {[t.account, t.preference].map((label, index) => <div key={label} className={`flex items-center gap-3 ${step >= index + 1 ? "text-white" : "text-white/40"}`}><span className={`grid h-7 w-7 place-items-center rounded-full ${step > index + 1 ? "bg-[#b9f4d0] text-[#17342d]" : "border border-white/30"}`}>{step > index + 1 ? <Check className="h-4 w-4" /> : index + 1}</span>{label}</div>)}
              </div>
              <p className="mt-10 flex items-center gap-2 text-xs text-white/60"><ShieldCheck className="h-4 w-4 text-[#b9f4d0]" />{t.later}</p>
            </aside>

            <form onSubmit={(event) => event.preventDefault()} className="p-6 sm:p-10">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div key="company-account" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <button type="button" aria-pressed={authMethod === "google"} onClick={() => setAuthMethod("google")} className={`flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-bold transition ${authMethod === "google" ? "border-[#4361ee] bg-[#eaf0ff] text-[#324fc0]" : "border-[#17342d]/15 text-[#17342d] hover:bg-[#f7f6f1]"}`}><Globe2 className="h-4 w-4 text-[#4361ee]" />{t.google}</button>
                    <button type="button" onClick={() => setAuthMethod("email")} className="my-6 flex w-full items-center gap-3 text-xs font-semibold text-[#81918c]"><span className="h-px flex-1 bg-[#17342d]/10" /><span className={authMethod === "email" ? "text-[#17342d]" : ""}>{t.divider}</span><span className="h-px flex-1 bg-[#17342d]/10" /></button>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.company} *</span><input autoComplete="organization" value={formData.companyName || ""} onChange={(event) => setField("companyName", event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>
                      <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.country} *</span><select value={formData.country || ""} onChange={(event) => setField("country", event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 bg-white px-4 py-3">{countries.map((item) => <option key={item}>{item}</option>)}</select></label>
                      <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.industry} *</span><select value={formData.industry || ""} onChange={(event) => setField("industry", event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 bg-white px-4 py-3"><option value="">—</option>{industries.map((item) => <option key={item}>{item}</option>)}</select></label>
                      <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.size} *</span><select value={formData.companySize || ""} onChange={(event) => setField("companySize", event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 bg-white px-4 py-3"><option value="">—</option>{sizes.map((item) => <option key={item}>{item}</option>)}</select></label>
                      {authMethod === "email" && <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.email} *</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>}
                      {authMethod === "email" && <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.password} *</span><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordHint} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>}
                    </div>
                    <button type="button" onClick={goNext} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17342d] px-5 py-3.5 text-sm font-black text-white">{t.next}<ArrowRight className="h-4 w-4" /></button>
                  </motion.div>
                ) : (
                  <motion.div key="company-hiring" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <fieldset><legend className="text-base font-black text-[#17342d]">{t.needs}</legend><p className="mt-1 text-xs text-[#738781]">{t.optional}</p><div className="mt-4 flex flex-wrap gap-2">{needs.map((item) => <ChoiceChip key={item} selected={selectedNeeds.includes(item)} onClick={() => toggle(selectedNeeds, item, setSelectedNeeds)}>{item}</ChoiceChip>)}</div></fieldset>
                    <fieldset className="mt-7"><legend className="text-base font-black text-[#17342d]">{t.skills}</legend><p className="mt-1 text-xs text-[#738781]">{t.optional}</p><div className="mt-4 flex flex-wrap gap-2">{skills.map((item) => <ChoiceChip key={item} selected={Boolean(formData.requiredSkills?.includes(item))} onClick={() => toggle(formData.requiredSkills || [], item, (next) => setField("requiredSkills", next))}>{item}</ChoiceChip>)}</div></fieldset>
                    <fieldset className="mt-7"><legend className="text-base font-black text-[#17342d]">{t.mode}</legend><div className="mt-4 flex flex-wrap gap-2">{workModes.map((item) => <ChoiceChip key={item} selected={workMode === item} onClick={() => setWorkMode(workMode === item ? "" : item)}>{item}</ChoiceChip>)}</div></fieldset>
                    <div className="mt-7 space-y-3 rounded-2xl bg-[#f5f7f2] p-4">
                      {([
                        ["terms", t.terms],
                        ["transaction", t.transaction],
                        ["privacy", t.privacy],
                        ["marketing", t.marketing],
                      ] as const).map(([key, label]) => <label key={key} className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#3f5d55]"><input type="checkbox" checked={agreements[key]} onChange={(event) => setAgreements((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4 accent-[#17342d]" /><span>{label}{key !== "marketing" && <strong className="ml-1 text-[#4361ee]">*</strong>}</span></label>)}
                    </div>
                    <button type="button" disabled={isSubmitting} onClick={() => void (authMethod === "google" ? submitGoogle() : submitEmail())} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17342d] px-5 py-3.5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">{isSubmitting ? t.submitting : t.submit}<Building2 className="h-4 w-4" /></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
