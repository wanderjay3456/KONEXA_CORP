import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, GraduationCap, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLocale } from "../../i18n/LocaleContext";
import { StudentProfile, UserRole } from "../../types";
import { useToast } from "../ui/Toast";

interface StudentRegisterFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const copy = {
  ko: {
    eyebrow: "1분 계정 만들기",
    title: "계정부터 빠르게 만들고, 프로필은 로그인 후 완성하세요.",
    lead: "가입 단계에서는 계정에 필요한 정보만 받습니다. 학교·이력서·희망 주급·증빙 서류는 로그인 직후 안내에 따라 작성합니다.",
    google: "Google로 바로 시작",
    googleHelp: "기존 계정은 바로 로그인됩니다. 처음이라면 Google 인증 후 계정 유형과 필수 동의만 확인합니다.",
    divider: "또는 이메일로 계정 만들기",
    name: "이름",
    namePlaceholder: "이름을 입력해 주세요",
    email: "이메일",
    password: "비밀번호",
    passwordHint: "8자 이상",
    terms: "KONEXA 이용약관과 개인정보처리방침에 동의합니다.",
    transaction: "소개·계약 단계의 플랫폼 외 거래 방지 약정에 동의합니다.",
    privacy: "메시지 안전 분석 및 개인정보 국외이전 고지에 동의합니다.",
    marketing: "새 공고와 커리어 소식을 이메일로 받습니다. (선택)",
    submit: "학생 계정 만들기",
    submitting: "계정을 만들고 있어요",
    googleBusy: "Google로 이동하고 있어요",
    required: "이름, 올바른 이메일, 8자 이상의 비밀번호와 필수 동의를 확인해 주세요.",
    confirmationTitle: "확인 이메일을 보냈습니다.",
    confirmationBody: "이메일의 확인 링크를 누른 뒤 로그인하세요. 그러면 필수 프로필 작성 화면으로 바로 연결됩니다.",
    login: "로그인 화면으로",
    back: "이전",
    next: "가입 후 필수 프로필 작성으로 이어집니다.",
    safety: "미완성 프로필은 대시보드에 진입할 수 없으며, 필요한 항목을 순서대로 안내합니다.",
  },
  en: {
    eyebrow: "Create an account in 1 minute",
    title: "Create your account now, then complete your profile after sign-in.",
    lead: "We only ask for account essentials here. Add your education, resume, preferred weekly pay, and proof documents in the guided profile setup.",
    google: "Start instantly with Google",
    googleHelp: "Existing members sign in immediately. New members confirm their account type and required agreements after Google verification.",
    divider: "or create an account with email",
    name: "Name",
    namePlaceholder: "Enter your name",
    email: "Email",
    password: "Password",
    passwordHint: "At least 8 characters",
    terms: "I agree to the KONEXA Terms and Privacy Policy.",
    transaction: "I agree to the non-circumvention terms for introductions and contracts.",
    privacy: "I agree to the message-safety analysis and cross-border privacy notice.",
    marketing: "Send me new roles and career updates. (Optional)",
    submit: "Create talent account",
    submitting: "Creating your account",
    googleBusy: "Opening Google",
    required: "Check your name, email, 8-character password, and all required agreements.",
    confirmationTitle: "Check your inbox.",
    confirmationBody: "Confirm your email and sign in. We will take you directly to the required profile setup.",
    login: "Go to sign in",
    back: "Back",
    next: "Required profile setup follows sign-up.",
    safety: "Incomplete profiles cannot enter the workspace; the guided setup shows every required item in order.",
  },
  vi: {
    eyebrow: "Tạo tài khoản trong 1 phút",
    title: "Tạo tài khoản trước, rồi hoàn thiện hồ sơ sau khi đăng nhập.",
    lead: "Ở bước này, KONEXA chỉ yêu cầu thông tin tài khoản cần thiết. Bạn sẽ bổ sung trường học, CV, mức lương tuần mong muốn và giấy tờ trong phần thiết lập hồ sơ.",
    google: "Bắt đầu ngay với Google",
    googleHelp: "Thành viên hiện tại sẽ đăng nhập ngay. Thành viên mới chỉ cần xác nhận loại tài khoản và các đồng ý bắt buộc sau khi Google xác minh.",
    divider: "hoặc tạo tài khoản bằng email",
    name: "Họ và tên",
    namePlaceholder: "Nhập họ và tên",
    email: "Email",
    password: "Mật khẩu",
    passwordHint: "Tối thiểu 8 ký tự",
    terms: "Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của KONEXA.",
    transaction: "Tôi đồng ý với điều khoản không giao dịch ngoài nền tảng.",
    privacy: "Tôi đồng ý với phân tích an toàn tin nhắn và thông báo chuyển dữ liệu xuyên biên giới.",
    marketing: "Gửi cho tôi cơ hội mới và tin nghề nghiệp. (Không bắt buộc)",
    submit: "Tạo tài khoản ứng viên",
    submitting: "Đang tạo tài khoản",
    googleBusy: "Đang mở Google",
    required: "Kiểm tra họ tên, email, mật khẩu từ 8 ký tự và các đồng ý bắt buộc.",
    confirmationTitle: "Hãy kiểm tra email.",
    confirmationBody: "Xác nhận email rồi đăng nhập. Bạn sẽ được chuyển thẳng đến phần hồ sơ bắt buộc.",
    login: "Đi đến đăng nhập",
    back: "Quay lại",
    next: "Tiếp theo là phần hồ sơ bắt buộc.",
    safety: "Hồ sơ chưa hoàn thiện không thể vào khu vực làm việc; hệ thống sẽ hướng dẫn lần lượt mọi mục bắt buộc.",
  },
} as const;

export default function StudentRegisterForm({ onCancel, onSuccess }: StudentRegisterFormProps) {
  const { registerUser, googleLogin } = useApp();
  const { locale, setLocale } = useLocale();
  const { error } = useToast();
  const t = copy[locale];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [agreements, setAgreements] = useState({ terms: false, transaction: false, privacy: false, marketing: false });

  const consentBundle = {
    terms: agreements.terms,
    nonCircumvention: agreements.transaction,
    messageAnalysis: agreements.privacy,
    crossBorderPrivacy: agreements.privacy,
    marketing: agreements.marketing,
    documentVersion: "2026-07-27",
  };

  const handleGoogle = async () => {
    if (googleBusy || isSubmitting) return;
    setGoogleBusy(true);
    try {
      // Google authenticates first. New users complete the required role and
      // consent gate after the callback without filling this form twice.
      await googleLogin(UserRole.STUDENT);
    } catch {
      // The shared auth layer presents the error.
    } finally {
      // Also restores the form when the user cancels OAuth with the Back button.
      setGoogleBusy(false);
    }
  };

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    const valid = Boolean(name.trim())
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      && password.length >= 8
      && agreements.terms && agreements.transaction && agreements.privacy;
    if (!valid) {
      error(t.required, t.required);
      return;
    }
    setIsSubmitting(true);
    const profile: Partial<StudentProfile> = {
      name: name.trim(),
      skills: [],
      github: "",
      bio: "",
      notificationPreferences: { email: true, push: true, marketing: agreements.marketing },
      privacySettings: { publicProfile: true, showResume: false },
      onboardingCompleted: false,
    };
    try {
      const result = await registerUser(email.trim(), name.trim(), UserRole.STUDENT, profile, undefined, password, consentBundle);
      if (result.emailConfirmationRequired) setEmailConfirmationRequired(true);
      else onSuccess();
    } catch {
      // The shared auth layer presents a safe, actionable error.
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailConfirmationRequired) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f6f1] px-5">
        <section className="w-full max-w-lg rounded-[2rem] border border-[#17342d]/10 bg-white p-8 text-center shadow-[0_30px_90px_rgba(23,52,45,.1)] sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#dff8ea] text-[#23644e]"><Mail className="h-6 w-6" /></span>
          <h1 className="mt-6 break-keep font-display text-3xl font-bold tracking-[-.04em] text-[#17342d]">{t.confirmationTitle}</h1>
          <p className="mt-4 leading-7 text-[#557069]">{t.confirmationBody}</p>
          <button type="button" onClick={onCancel} className="mt-8 rounded-full bg-[#17342d] px-6 py-3 text-sm font-bold text-white">{t.login}</button>
        </section>
      </main>
    );
  }

  return (
    <main data-no-translate className="min-h-screen bg-[#f7f6f1] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-bold text-[#48645d]"><ArrowLeft className="h-4 w-4" />{t.back}</button>
          <div role="group" aria-label="Language" className="flex rounded-full border border-[#17342d]/10 bg-white p-1">
            {(["ko", "en", "vi"] as const).map((item) => <button key={item} type="button" aria-pressed={locale === item} onClick={() => setLocale(item)} className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase ${locale === item ? "bg-[#17342d] text-white" : "text-[#647a74]"}`}>{item}</button>)}
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-[#17342d]/10 bg-white shadow-[0_30px_90px_rgba(23,52,45,.09)]">
          <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="bg-[#17342d] p-7 text-white sm:p-10">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-[#b9f4d0]"><Sparkles className="h-4 w-4" />{t.eyebrow}</span>
              <h1 className="mt-5 break-keep font-display text-3xl font-bold leading-tight tracking-[-.04em]">{t.title}</h1>
              <p className="mt-5 text-sm leading-7 text-white/75">{t.lead}</p>
              <p className="mt-8 flex items-start gap-2 text-xs leading-5 text-white/65"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#b9f4d0]" />{t.safety}</p>
            </aside>

            <div className="p-6 sm:p-10">
              <button type="button" disabled={googleBusy || isSubmitting} onClick={() => void handleGoogle()} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#4361ee]/30 bg-[#eef1ff] px-4 py-3.5 text-sm font-black text-[#324fc0] disabled:cursor-wait disabled:opacity-60">
                <span aria-hidden="true" className="text-base font-black">G</span>{googleBusy ? t.googleBusy : t.google}
              </button>
              <p className="mt-2 text-center text-xs leading-5 text-[#6e817b]">{t.googleHelp}</p>

              <div className="my-6 flex items-center gap-3 text-xs font-semibold text-[#81918c]"><span className="h-px flex-1 bg-[#17342d]/10" />{t.divider}<span className="h-px flex-1 bg-[#17342d]/10" /></div>

              <form onSubmit={submitEmail} className="space-y-5">
                <label className="block"><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.name} *</span><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t.namePlaceholder} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>
                <label className="block"><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.email} *</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>
                <label className="block"><span className="mb-2 block text-sm font-bold text-[#27483f]">{t.password} *</span><input type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordHint} className="w-full rounded-xl border border-[#17342d]/15 px-4 py-3 outline-none focus:border-[#4361ee]" /></label>

                <div className="space-y-3 rounded-2xl bg-[#f5f7f2] p-4">
                  {([
                    ["terms", t.terms, true],
                    ["transaction", t.transaction, true],
                    ["privacy", t.privacy, true],
                    ["marketing", t.marketing, false],
                  ] as const).map(([key, label, required]) => <label key={key} className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#3f5d55]"><input type="checkbox" checked={agreements[key]} onChange={(event) => setAgreements((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4 accent-[#17342d]" /><span>{label}{required && <strong className="ml-1 text-[#4361ee]">*</strong>}</span></label>)}
                </div>

                <button type="submit" disabled={isSubmitting || googleBusy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17342d] px-5 py-3.5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
                  {isSubmitting ? t.submitting : t.submit}{!isSubmitting && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-[#6b7d78]"><GraduationCap className="h-4 w-4" />{t.next}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
