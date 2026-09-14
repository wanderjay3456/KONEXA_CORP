import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Globe2, GraduationCap, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLocale } from "../../i18n/LocaleContext";
import { CAPABILITY_OPTIONS, COUNTRY_OPTIONS, optionLabel, VISA_STATUS_OPTIONS } from "../../lib/talentTaxonomy";
import { StudentProfile, UserRole } from "../../types";
import { useToast } from "../ui/Toast";
import RoleMultiSelect from "./RoleMultiSelect";

interface StudentRegisterFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const availability = [
  { value: "Immediately", ko: "즉시", vi: "Ngay lập tức" },
  { value: "Within 2 weeks", ko: "2주 이내", vi: "Trong vòng 2 tuần" },
  { value: "Within 1 month", ko: "1개월 이내", vi: "Trong vòng 1 tháng" },
  { value: "Exploring", ko: "좋은 기회를 탐색 중", vi: "Đang tìm hiểu cơ hội" },
];
const workModes: Array<{ value: NonNullable<StudentProfile["workPreference"]>; ko: string; vi: string }> = [
  { value: "Remote", ko: "원격", vi: "Từ xa" },
  { value: "Hybrid", ko: "하이브리드", vi: "Kết hợp" },
  { value: "Onsite", ko: "현장·출근", vi: "Tại nơi làm việc" },
];

const copy = {
  ko: {
    eyebrow: "약 2분이면 완료",
    title: "필요한 정보만 먼저 알려주세요.",
    lead: "계정을 만든 뒤 이력서, 학교 정보, 포트폴리오와 자기소개 영상은 원할 때 보완할 수 있습니다.",
    account: "기본 정보",
    preference: "매칭 설정",
    google: "Google로 빠르게 시작",
    divider: "또는 이메일로 가입",
    name: "이름",
    namePlaceholder: "이름을 입력해 주세요",
    country: "현재 거주 국가",
    email: "이메일",
    password: "비밀번호",
    passwordHint: "8자 이상",
    next: "다음",
    back: "이전",
    role: "관심 직무",
    roleHint: "관심 있는 분야를 복수로 선택하세요. 선택 결과는 맞춤 공고와 기업 매칭에 사용됩니다.",
    skills: "보유 역량",
    skillsHint: "현재 활용할 수 있는 역량을 모두 선택하세요.",
    optional: "선택 · 나중에 변경 가능",
    availability: "시작 가능 시점",
    workMode: "선호 근무 방식",
    visaStatus: "현재 체류·비자 상태",
    visaHint: "선택 · 한국 취업 또는 프로젝트 참여 가능 범위를 확인하는 데 사용됩니다.",
    visaNotice: "직무 선택만으로 비자 발급 여부가 결정되지는 않습니다. E-7은 세부 직종코드, 학위·경력·임금·고용기업 요건을 함께 심사하며, D-2와 D-10은 각각 유학·구직 체류자격입니다. 실제 활동 가능 범위는 출입국·외국인청 또는 1345에서 최종 확인해야 합니다.",
    terms: "KONEXA 이용약관과 개인정보처리방침에 동의합니다.",
    transaction: "소개·계약 단계의 플랫폼 외 거래 방지 약정에 동의합니다.",
    privacy: "안전한 거래를 위한 메시지 분석 및 개인정보 국외이전 고지에 동의합니다.",
    marketing: "새 공고와 커리어 소식을 이메일로 받습니다. (선택)",
    submit: "학생 계정 만들기",
    submitting: "계정을 만들고 있어요",
    required: "필수 항목을 확인해 주세요.",
    confirmationTitle: "확인 이메일을 보냈습니다.",
    confirmationBody: "이메일의 확인 링크를 누른 뒤 로그인하면 바로 공고를 둘러볼 수 있습니다.",
    login: "로그인 화면으로",
    later: "세부 프로필은 가입 후 작성",
  },
  en: {
    eyebrow: "Takes about 2 minutes",
    title: "Start with only the essentials.",
    lead: "Add your resume, education, portfolio, and intro video later from your profile.",
    account: "Basics",
    preference: "Matching",
    google: "Continue with Google",
    divider: "or sign up with email",
    name: "Name",
    namePlaceholder: "Enter your name",
    country: "Current country",
    email: "Email",
    password: "Password",
    passwordHint: "At least 8 characters",
    next: "Continue",
    back: "Back",
    role: "Roles you are interested in",
    roleHint: "Select multiple fields. We use them to personalize opportunities and company matches.",
    skills: "Your capabilities",
    skillsHint: "Select every capability you can currently use.",
    optional: "Optional · change anytime",
    availability: "When can you start?",
    workMode: "Preferred work mode",
    visaStatus: "Current stay or visa status",
    visaHint: "Optional · helps us assess the type of work or hiring support you may need in Korea.",
    visaNotice: "Selecting a role does not determine visa eligibility. E-7 review also considers the detailed occupation code, education, experience, pay, and employer requirements. D-2 and D-10 are study and job-seeking statuses, not occupation categories. Confirm your individual scope with Korean immigration or 1345.",
    terms: "I agree to the KONEXA Terms and Privacy Policy.",
    transaction: "I agree to the non-circumvention terms for introductions and contracts.",
    privacy: "I agree to the message-safety analysis and cross-border privacy notice.",
    marketing: "Send me new roles and career updates. (Optional)",
    submit: "Create talent account",
    submitting: "Creating your account",
    required: "Please check the required fields.",
    confirmationTitle: "Check your inbox.",
    confirmationBody: "Confirm your email, then sign in to start browsing opportunities.",
    login: "Go to sign in",
    later: "Complete your detailed profile later",
  },
  vi: {
    eyebrow: "Chỉ mất khoảng 2 phút",
    title: "Bắt đầu với những thông tin cần thiết.",
    lead: "Bạn có thể bổ sung CV, trường học, portfolio và video giới thiệu sau khi tạo tài khoản.",
    account: "Thông tin cơ bản",
    preference: "Thiết lập ghép nối",
    google: "Tiếp tục với Google",
    divider: "hoặc đăng ký bằng email",
    name: "Họ và tên",
    namePlaceholder: "Nhập họ và tên",
    country: "Quốc gia đang cư trú",
    email: "Email",
    password: "Mật khẩu",
    passwordHint: "Tối thiểu 8 ký tự",
    next: "Tiếp tục",
    back: "Quay lại",
    role: "Vị trí bạn quan tâm",
    roleHint: "Chọn nhiều lĩnh vực. KONEXA dùng lựa chọn này để đề xuất cơ hội và doanh nghiệp phù hợp.",
    skills: "Năng lực của bạn",
    skillsHint: "Chọn tất cả năng lực bạn có thể sử dụng hiện tại.",
    optional: "Không bắt buộc · có thể thay đổi sau",
    availability: "Khi nào bạn có thể bắt đầu?",
    workMode: "Hình thức làm việc",
    visaStatus: "Tình trạng cư trú hoặc visa hiện tại",
    visaHint: "Không bắt buộc · giúp xác định loại công việc hoặc hỗ trợ tuyển dụng tại Hàn Quốc.",
    visaNotice: "Việc chọn nghề không quyết định khả năng được cấp visa. E-7 còn xét mã nghề cụ thể, bằng cấp, kinh nghiệm, lương và điều kiện của doanh nghiệp. D-2 và D-10 là diện du học và tìm việc, không phải nhóm nghề. Hãy xác nhận trường hợp cụ thể với cơ quan xuất nhập cảnh Hàn Quốc hoặc số 1345.",
    terms: "Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của KONEXA.",
    transaction: "Tôi đồng ý với điều khoản không giao dịch ngoài nền tảng.",
    privacy: "Tôi đồng ý với thông báo phân tích tin nhắn an toàn và chuyển dữ liệu xuyên biên giới.",
    marketing: "Gửi cho tôi cơ hội việc làm và tin nghề nghiệp mới. (Không bắt buộc)",
    submit: "Tạo tài khoản ứng viên",
    submitting: "Đang tạo tài khoản",
    required: "Vui lòng kiểm tra các mục bắt buộc.",
    confirmationTitle: "Hãy kiểm tra email.",
    confirmationBody: "Xác nhận email rồi đăng nhập để xem các cơ hội phù hợp.",
    login: "Đi đến đăng nhập",
    later: "Hoàn thiện hồ sơ chi tiết sau",
  },
} as const;

function ChoiceChip({ selected, onClick, children }: { key?: React.Key; selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
        selected ? "border-[#17342d] bg-[#17342d] text-white" : "border-[#17342d]/15 bg-white text-[#315149] hover:border-[#17342d]/40"
      }`}
    >
      {children}
    </button>
  );
}

export default function StudentRegisterForm({ onCancel, onSuccess }: StudentRegisterFormProps) {
  const { registerUser, googleLogin } = useApp();
  const { locale, setLocale } = useLocale();
  const { error } = useToast();
  const t = copy[locale];
  const [step, setStep] = useState(1);
  const [authMethod, setAuthMethod] = useState<"email" | "google">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [agreements, setAgreements] = useState({ terms: false, transaction: false, privacy: false, marketing: false });
  const [formData, setFormData] = useState<Partial<StudentProfile>>({
    name: "",
    currentCountry: "Vietnam",
    nationality: "",
    preferredJob: "",
    careerInterests: [],
    visaStatus: "",
    skills: [],
    availability: "",
    workPreference: "Remote",
    github: "",
    bio: "",
    notificationPreferences: { email: true, push: true, marketing: false },
    privacySettings: { publicProfile: true, showResume: false },
    onboardingCompleted: false,
  });

  const setField = <K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const toggleSkill = (skill: string) => {
    const current = formData.skills || [];
    setField("skills", current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]);
  };

  const validateAccount = () => {
    if (!formData.name?.trim() || !formData.currentCountry) return false;
    if (authMethod === "email" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8)) return false;
    return true;
  };

  const validateAgreements = () => agreements.terms && agreements.transaction && agreements.privacy;

  const goNext = () => {
    if (!validateAccount()) {
      error(t.required, authMethod === "email" ? `${t.name}, ${t.email}, ${t.passwordHint}` : t.name);
      return;
    }
    setStep(2);
  };

  const consentBundle = {
    terms: agreements.terms,
    nonCircumvention: agreements.transaction,
    messageAnalysis: agreements.privacy,
    crossBorderPrivacy: agreements.privacy,
    marketing: agreements.marketing,
    documentVersion: "2026-07-27",
  };

  const profilePayload = {
    ...formData,
    nationality: formData.nationality || formData.currentCountry,
    preferredJob: formData.careerInterests?.[0] || "",
    notificationPreferences: { email: true, push: true, marketing: agreements.marketing },
  };

  const submitEmail = async () => {
    if (!validateAccount() || !validateAgreements()) {
      error(t.required, t.required);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await registerUser(email, formData.name!.trim(), UserRole.STUDENT, profilePayload, undefined, password, consentBundle);
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
      await googleLogin(UserRole.STUDENT, { mode: "register", profileData: profilePayload, consentBundle });
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
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={step === 1 ? onCancel : () => setStep(1)} className="inline-flex items-center gap-2 text-sm font-bold text-[#48645d]">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </button>
          <div role="group" aria-label="Language" className="flex rounded-full border border-[#17342d]/10 bg-white p-1">
            {(["ko", "en", "vi"] as const).map((item) => <button key={item} type="button" aria-pressed={locale === item} onClick={() => setLocale(item)} className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase ${locale === item ? "bg-[#17342d] text-white" : "text-[#647a74]"}`}>{item}</button>)}
          </div>
        </div>
        <section className="mt-5 overflow-hidden rounded-[2rem] border border-[#17342d]/10 bg-white shadow-[0_30px_90px_rgba(23,52,45,.09)]">
          <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="bg-[#17342d] p-7 text-white sm:p-10">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-[#b9f4d0]"><Sparkles className="h-4 w-4" />{t.eyebrow}</span>
              <h1 className="mt-5 font-display text-3xl font-bold leading-tight tracking-[-.04em] sm:text-4xl">{t.title}</h1>
              <p className="mt-5 text-sm leading-7 text-white/70">{t.lead}</p>
              <div className="mt-8 space-y-3 text-sm font-semibold">
                {[t.account, t.preference].map((label, index) => (
                  <div key={label} className={`flex items-center gap-3 ${step >= index + 1 ? "text-white" : "text-white/40"}`}>
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${step > index + 1 ? "bg-[#b9f4d0] text-[#17342d]" : "border border-white/30"}`}>{step > index + 1 ? <Check className="h-4 w-4" /> : index + 1}</span>
                    {label}
                  </div>
                ))}
              </div>
              <p className="mt-10 flex items-center gap-2 text-xs text-white/60"><ShieldCheck className="h-4 w-4 text-[#b9f4d0]" />{t.later}</p>
            </aside>

            <form onSubmit={(event) => event.preventDefault()} className="p-6 sm:p-10">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div key="student-account" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <button type="button" aria-pressed={authMethod === "google"} onClick={() => setAuthMethod("google")} className={`flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-bold transition ${authMethod === "google" ? "border-[#4361ee] bg-[#eaf0ff] text-[#324fc0]" : "border-[#17342d]/15 text-[#17342d] hover:bg-[#f7f6f1]"}`}>
                      <Globe2 className="h-4 w-4 text-[#4361ee]" />{t.google}
                    </button>
                    <button type="button" onClick={() => setAuthMethod("email")} className="my-6 flex w-full items-center gap-3 text-xs font-semibold text-[#81918c]"><span className="h-px flex-1 bg-[#17342d]/10" /><span className={authMethod === "email" ? "text-[#17342d]" : ""}>{t.divider}</span><span className="h-px flex-1 bg-[#17342d]/10" /></button>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.name} *</span><input autoComplete="name" value={formData.name || ""} onChange={(event) => setField("name", event.target.value)} placeholder={t.namePlaceholder} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>
                      <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.country} *</span><select value={formData.currentCountry || ""} onChange={(event) => setField("currentCountry", event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 bg-white px-4 py-3 outline-none focus:border-[#4361ee]">{COUNTRY_OPTIONS.map((country) => <option key={country.value} value={country.value}>{optionLabel(country, locale)}</option>)}</select></label>
                      {authMethod === "email" && <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.email} *</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>}
                      {authMethod === "email" && <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.password} *</span><input type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordHint} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>}
                    </div>
                    <button type="button" onClick={goNext} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17342d] px-5 py-3.5 text-sm font-black text-white">{t.next}<ArrowRight className="h-4 w-4" /></button>
                  </motion.div>
                ) : (
                  <motion.div key="student-matching" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <RoleMultiSelect locale={locale} selected={formData.careerInterests || []} onChange={(roles) => setField("careerInterests", roles)} legend={t.role} hint={`${t.roleHint} ${t.optional}`} />
                    <fieldset className="mt-7"><legend className="text-base font-black text-[#17342d]">{t.skills}</legend><p className="mt-1 text-xs leading-5 text-[#738781]">{t.skillsHint} {t.optional}</p><div className="mt-4 max-h-52 overflow-y-auto rounded-2xl border border-[#17342d]/10 bg-[#fbfcf9] p-3"><div className="flex flex-wrap gap-2">{CAPABILITY_OPTIONS.map((skill) => <ChoiceChip key={skill.value} selected={Boolean(formData.skills?.includes(skill.value))} onClick={() => toggleSkill(skill.value)}>{optionLabel(skill, locale)}</ChoiceChip>)}</div></div></fieldset>
                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                      <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.availability}</span><select value={formData.availability || ""} onChange={(event) => setField("availability", event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 bg-white px-4 py-3"><option value="">—</option>{availability.map((item) => <option key={item.value} value={item.value}>{locale === "ko" ? item.ko : locale === "vi" ? item.vi : item.value}</option>)}</select></label>
                      <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.workMode}</span><select value={formData.workPreference || "Remote"} onChange={(event) => setField("workPreference", event.target.value as StudentProfile["workPreference"])} className="w-full rounded-xl border border-[#17342d]/15 bg-white px-4 py-3">{workModes.map((item) => <option key={item.value} value={item.value}>{locale === "ko" ? item.ko : locale === "vi" ? item.vi : item.value}</option>)}</select></label>
                      <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.visaStatus}</span><span className="mb-3 block text-xs leading-5 text-[#738781]">{t.visaHint}</span><select value={formData.visaStatus || ""} onChange={(event) => setField("visaStatus", event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 bg-white px-4 py-3"><option value="">—</option>{VISA_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{optionLabel(item, locale)}</option>)}</select></label>
                    </div>
                    <p className="mt-4 rounded-2xl border border-[#4361ee]/15 bg-[#f3f6ff] px-4 py-3 text-xs leading-5 text-[#536b8d]">{t.visaNotice}</p>
                    <div className="mt-7 space-y-3 rounded-2xl bg-[#f5f7f2] p-4">
                      {([
                        ["terms", t.terms],
                        ["transaction", t.transaction],
                        ["privacy", t.privacy],
                        ["marketing", t.marketing],
                      ] as const).map(([key, label]) => (
                        <label key={key} className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#3f5d55]">
                          <input type="checkbox" checked={agreements[key]} onChange={(event) => setAgreements((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4 accent-[#17342d]" />
                          <span>{label}{key !== "marketing" && <strong className="ml-1 text-[#4361ee]">*</strong>}</span>
                        </label>
                      ))}
                    </div>
                    <button type="button" disabled={isSubmitting} onClick={() => void (authMethod === "google" ? submitGoogle() : submitEmail())} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17342d] px-5 py-3.5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
                      {isSubmitting ? t.submitting : t.submit}<GraduationCap className="h-4 w-4" />
                    </button>
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
