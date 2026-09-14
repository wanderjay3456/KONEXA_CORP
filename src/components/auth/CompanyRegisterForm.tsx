import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Building2, Check, Globe2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLocale } from "../../i18n/LocaleContext";
import {
  CAPABILITY_OPTIONS,
  COMPANY_VISA_SUPPORT_OPTIONS,
  COUNTRY_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  optionLabel,
} from "../../lib/talentTaxonomy";
import { CompanyProfile, UserRole } from "../../types";
import { useToast } from "../ui/Toast";
import RoleMultiSelect from "./RoleMultiSelect";

interface CompanyRegisterFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const sizes = [
  { value: "Sole proprietor", ko: "1인 사업자", vi: "Doanh nghiệp cá nhân" },
  { value: "1–10", ko: "1–10명", vi: "1–10 nhân sự" },
  { value: "11–50", ko: "11–50명", vi: "11–50 nhân sự" },
  { value: "51–200", ko: "51–200명", vi: "51–200 nhân sự" },
  { value: "201–500", ko: "201–500명", vi: "201–500 nhân sự" },
  { value: "501+", ko: "501명 이상", vi: "Từ 501 nhân sự" },
];
const workModes = [
  { value: "Remote", ko: "원격", vi: "Từ xa" },
  { value: "Hybrid", ko: "하이브리드", vi: "Kết hợp" },
  { value: "Onsite", ko: "현장·출근", vi: "Tại nơi làm việc" },
];

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
    passwordHint: "8자 이상",
    next: "다음",
    back: "이전",
    needs: "채용하려는 직무",
    needsHint: "한 분야에 한정하지 말고 현재 또는 향후 필요한 직무를 복수로 선택하세요.",
    skills: "우선적으로 필요한 역량",
    skillsHint: "실무에서 필요한 역량을 모두 선택하세요.",
    mode: "선호 협업 방식",
    modeHint: "복수 선택 가능",
    extra: "추가 매칭 조건",
    employment: "검토 중인 계약·채용 방식",
    languages: "필요 언어",
    visaSupport: "외국인 인재 체류·채용 지원 범위",
    visaNotice: "이 선택은 지원 의향을 파악하기 위한 것으로 비자 발급을 보장하지 않습니다. E-7은 세부 직종·학위·경력·임금·기업 요건을 함께 심사하고, D-2·D-10은 활동 허용 범위가 서로 다릅니다. 실제 채용 전 출입국·외국인청 또는 1345의 최종 확인이 필요합니다.",
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
    passwordHint: "At least 8 characters",
    next: "Continue",
    back: "Back",
    needs: "Roles you want to hire",
    needsHint: "Select multiple current or future hiring fields across the organization.",
    skills: "Priority capabilities",
    skillsHint: "Select every practical capability relevant to your needs.",
    mode: "Preferred work mode",
    modeHint: "Multiple selections allowed",
    extra: "Additional matching preferences",
    employment: "Engagement and employment types",
    languages: "Required languages",
    visaSupport: "International talent and visa support",
    visaNotice: "These choices record hiring intent and do not guarantee a visa. E-7 review also considers the detailed occupation, education, experience, pay, and employer requirements. D-2 and D-10 have different permitted scopes. Confirm each case with Korean immigration or 1345 before hiring.",
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
    passwordHint: "Tối thiểu 8 ký tự",
    next: "Tiếp tục",
    back: "Quay lại",
    needs: "Vị trí cần tuyển",
    needsHint: "Chọn nhiều lĩnh vực tuyển dụng hiện tại hoặc trong tương lai.",
    skills: "Năng lực ưu tiên",
    skillsHint: "Chọn tất cả năng lực thực tế phù hợp với nhu cầu.",
    mode: "Hình thức làm việc",
    modeHint: "Có thể chọn nhiều",
    extra: "Điều kiện ghép nối bổ sung",
    employment: "Hình thức hợp tác và tuyển dụng",
    languages: "Ngôn ngữ cần thiết",
    visaSupport: "Hỗ trợ ứng viên quốc tế và visa",
    visaNotice: "Các lựa chọn này chỉ ghi nhận ý định tuyển dụng và không bảo đảm visa. E-7 còn xét nghề cụ thể, bằng cấp, kinh nghiệm, lương và điều kiện doanh nghiệp. D-2 và D-10 có phạm vi hoạt động khác nhau. Cần xác nhận từng trường hợp với cơ quan xuất nhập cảnh Hàn Quốc hoặc số 1345 trước khi tuyển dụng.",
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
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>([]);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState<string[]>([]);
  const [selectedVisaSupport, setSelectedVisaSupport] = useState<string[]>([]);
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
    if (authMethod === "email" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8)) return false;
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
    hiringRoles: selectedNeeds,
    hiringIndustry: selectedNeeds.join(", "),
    employmentTypes: selectedEmploymentTypes,
    visaSupportOptions: selectedVisaSupport,
    remotePolicy: selectedWorkModes.join(", "),
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
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={step === 1 ? onCancel : () => setStep(1)} className="inline-flex items-center gap-2 text-sm font-bold text-[#48645d]"><ArrowLeft className="h-4 w-4" />{t.back}</button>
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
                      <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.country} *</span><select value={formData.country || ""} onChange={(event) => setField("country", event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 bg-white px-4 py-3">{COUNTRY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{optionLabel(item, locale)}</option>)}</select></label>
                      <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.industry} *</span><select value={formData.industry || ""} onChange={(event) => setField("industry", event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 bg-white px-4 py-3"><option value="">—</option>{INDUSTRY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{optionLabel(item, locale)}</option>)}</select></label>
                      <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.size} *</span><select value={formData.companySize || ""} onChange={(event) => setField("companySize", event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 bg-white px-4 py-3"><option value="">—</option>{sizes.map((item) => <option key={item.value} value={item.value}>{locale === "ko" ? item.ko : locale === "vi" ? item.vi : item.value}</option>)}</select></label>
                      {authMethod === "email" && <label><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.email} *</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>}
                      {authMethod === "email" && <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.password} *</span><input type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordHint} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>}
                    </div>
                    <button type="button" onClick={goNext} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17342d] px-5 py-3.5 text-sm font-black text-white">{t.next}<ArrowRight className="h-4 w-4" /></button>
                  </motion.div>
                ) : (
                  <motion.div key="company-hiring" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                    <RoleMultiSelect locale={locale} selected={selectedNeeds} onChange={setSelectedNeeds} legend={t.needs} hint={`${t.needsHint} ${t.optional}`} />
                    <fieldset className="mt-7"><legend className="text-base font-black text-[#17342d]">{t.skills}</legend><p className="mt-1 text-xs leading-5 text-[#738781]">{t.skillsHint} {t.optional}</p><div className="mt-4 max-h-52 overflow-y-auto rounded-2xl border border-[#17342d]/10 bg-[#fbfcf9] p-3"><div className="flex flex-wrap gap-2">{CAPABILITY_OPTIONS.map((item) => <ChoiceChip key={item.value} selected={Boolean(formData.requiredSkills?.includes(item.value))} onClick={() => toggle(formData.requiredSkills || [], item.value, (next) => setField("requiredSkills", next))}>{optionLabel(item, locale)}</ChoiceChip>)}</div></div></fieldset>
                    <fieldset className="mt-7"><legend className="text-base font-black text-[#17342d]">{t.mode}</legend><p className="mt-1 text-xs text-[#738781]">{t.modeHint}</p><div className="mt-4 flex flex-wrap gap-2">{workModes.map((item) => <ChoiceChip key={item.value} selected={selectedWorkModes.includes(item.value)} onClick={() => toggle(selectedWorkModes, item.value, setSelectedWorkModes)}>{locale === "ko" ? item.ko : locale === "vi" ? item.vi : item.value}</ChoiceChip>)}</div></fieldset>
                    <details className="mt-7 rounded-2xl border border-[#17342d]/10 bg-[#fbfcf9] p-4">
                      <summary className="cursor-pointer text-sm font-black text-[#17342d]">{t.extra} <span className="font-semibold text-[#738781]">· {t.optional}</span></summary>
                      <div className="mt-5 space-y-6">
                        <fieldset><legend className="text-sm font-black text-[#27483f]">{t.employment}</legend><div className="mt-3 flex flex-wrap gap-2">{EMPLOYMENT_TYPE_OPTIONS.map((item) => <ChoiceChip key={item.value} selected={selectedEmploymentTypes.includes(item.value)} onClick={() => toggle(selectedEmploymentTypes, item.value, setSelectedEmploymentTypes)}>{optionLabel(item, locale)}</ChoiceChip>)}</div></fieldset>
                        <fieldset><legend className="text-sm font-black text-[#27483f]">{t.languages}</legend><div className="mt-3 flex flex-wrap gap-2">{LANGUAGE_OPTIONS.map((item) => <ChoiceChip key={item.value} selected={Boolean(formData.preferredLanguages?.includes(item.value))} onClick={() => toggle(formData.preferredLanguages || [], item.value, (next) => setField("preferredLanguages", next))}>{optionLabel(item, locale)}</ChoiceChip>)}</div></fieldset>
                        <fieldset><legend className="text-sm font-black text-[#27483f]">{t.visaSupport}</legend><div className="mt-3 flex flex-wrap gap-2">{COMPANY_VISA_SUPPORT_OPTIONS.map((item) => <ChoiceChip key={item.value} selected={selectedVisaSupport.includes(item.value)} onClick={() => toggle(selectedVisaSupport, item.value, setSelectedVisaSupport)}>{optionLabel(item, locale)}</ChoiceChip>)}</div><p className="mt-4 rounded-xl border border-[#4361ee]/15 bg-[#f3f6ff] px-3 py-3 text-xs leading-5 text-[#536b8d]">{t.visaNotice}</p></fieldset>
                      </div>
                    </details>
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
