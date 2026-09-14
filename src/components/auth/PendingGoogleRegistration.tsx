import React, { useMemo, useState } from "react";
import { ArrowRight, Building2, GraduationCap, LogOut, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLocale } from "../../i18n/LocaleContext";
import { authErrorMessage } from "../../i18n/authCopy";
import { getPendingGoogleAuthIntent } from "../../lib/supabaseAuth";
import { UserRole } from "../../types";

const copy = {
  ko: {
    eyebrow: "Google 계정 연결 완료",
    title: "계정 유형과 필수 동의만 확인해 주세요.",
    lead: "Google 인증은 정상적으로 완료되었습니다. 아래 내용을 확인하면 계정이 활성화되고, 이어서 필수 프로필을 작성합니다.",
    role: "이 계정을 어떻게 사용하시나요?",
    student: "학생·인재",
    studentHelp: "프로젝트와 채용 기회를 찾습니다.",
    company: "기업",
    companyHelp: "인재를 찾고 프로젝트 공고를 등록합니다.",
    terms: "KONEXA 이용약관과 개인정보처리방침에 동의합니다.",
    transaction: "소개·계약 단계의 플랫폼 외 거래 방지 약정에 동의합니다.",
    privacy: "메시지 안전 분석 및 개인정보 국외이전 고지에 동의합니다.",
    marketing: "새 공고와 서비스 소식을 이메일로 받습니다. (선택)",
    submit: "가입 완료하고 프로필 작성",
    busy: "계정을 활성화하고 있어요",
    required: "필수 동의 세 항목을 모두 확인해 주세요.",
    logout: "다른 계정으로 로그인",
    safety: "동의 기록은 계정과 함께 안전하게 보관됩니다.",
  },
  en: {
    eyebrow: "Google account connected",
    title: "Confirm your account type and required agreements.",
    lead: "Google verification is complete. Confirm the items below to activate your account, then finish your required profile.",
    role: "How will you use KONEXA?",
    student: "Talent",
    studentHelp: "Find projects and hiring opportunities.",
    company: "Company",
    companyHelp: "Find talent and publish project opportunities.",
    terms: "I agree to the KONEXA Terms and Privacy Policy.",
    transaction: "I agree to the non-circumvention terms for introductions and contracts.",
    privacy: "I agree to the message-safety analysis and cross-border privacy notice.",
    marketing: "Send me new opportunities and service updates. (Optional)",
    submit: "Finish sign-up and complete profile",
    busy: "Activating your account",
    required: "Please accept all three required agreements.",
    logout: "Use another account",
    safety: "Your consent receipt is stored securely with your account.",
  },
  vi: {
    eyebrow: "Đã kết nối tài khoản Google",
    title: "Xác nhận loại tài khoản và các đồng ý bắt buộc.",
    lead: "Google đã xác minh thành công. Hãy xác nhận các mục dưới đây để kích hoạt tài khoản rồi hoàn thiện hồ sơ bắt buộc.",
    role: "Bạn sẽ sử dụng KONEXA như thế nào?",
    student: "Ứng viên",
    studentHelp: "Tìm dự án và cơ hội tuyển dụng.",
    company: "Doanh nghiệp",
    companyHelp: "Tìm ứng viên và đăng cơ hội dự án.",
    terms: "Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của KONEXA.",
    transaction: "Tôi đồng ý với điều khoản không giao dịch ngoài nền tảng.",
    privacy: "Tôi đồng ý với phân tích an toàn tin nhắn và thông báo chuyển dữ liệu xuyên biên giới.",
    marketing: "Gửi cho tôi cơ hội mới và cập nhật dịch vụ. (Không bắt buộc)",
    submit: "Hoàn tất đăng ký và tạo hồ sơ",
    busy: "Đang kích hoạt tài khoản",
    required: "Vui lòng chấp nhận cả ba mục bắt buộc.",
    logout: "Dùng tài khoản khác",
    safety: "Biên nhận đồng ý được lưu an toàn cùng tài khoản của bạn.",
  },
} as const;

export default function PendingGoogleRegistration() {
  const { completeGoogleRegistration, currentUser, logoutUser } = useApp();
  const { locale, setLocale } = useLocale();
  const t = copy[locale];
  const suggestedRole = useMemo(() => {
    const intent = getPendingGoogleAuthIntent();
    return intent?.role === "company" ? UserRole.COMPANY : UserRole.STUDENT;
  }, []);
  const [role, setRole] = useState<UserRole>(suggestedRole);
  const [agreements, setAgreements] = useState({ terms: false, transaction: false, privacy: false, marketing: false });
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);

  const requiredAccepted = agreements.terms && agreements.transaction && agreements.privacy;
  const submit = async () => {
    if (!requiredAccepted || busy) {
      if (!requiredAccepted) setFailure(new Error(t.required));
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      await completeGoogleRegistration(role, {
        terms: true,
        nonCircumvention: true,
        messageAnalysis: true,
        crossBorderPrivacy: true,
        marketing: agreements.marketing,
        documentVersion: "2026-07-27",
      });
    } catch (cause) {
      setFailure(cause);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main data-no-translate className="min-h-screen bg-[#f7f6f1] px-4 py-8 text-[#17342d] sm:px-8 sm:py-12">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <button type="button" onClick={() => void logoutUser()} className="inline-flex items-center gap-2 text-sm font-bold text-[#48645d]">
          <LogOut className="h-4 w-4" />{t.logout}
        </button>
        <div role="group" aria-label="Language" className="flex rounded-full border border-[#17342d]/10 bg-white p-1">
          {(["ko", "en", "vi"] as const).map((item) => (
            <button key={item} type="button" aria-pressed={locale === item} onClick={() => setLocale(item)} className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase ${locale === item ? "bg-[#17342d] text-white" : "text-[#647a74]"}`}>{item}</button>
          ))}
        </div>
      </div>

      <section className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-[2rem] border border-[#17342d]/10 bg-white shadow-[0_30px_90px_rgba(23,52,45,.1)]">
        <div className="bg-[#17342d] px-6 py-8 text-white sm:px-10">
          <p className="text-xs font-black uppercase tracking-[.14em] text-[#b9f4d0]">{t.eyebrow}</p>
          <h1 className="mt-4 max-w-2xl break-keep font-display text-3xl font-bold leading-tight tracking-[-.035em] sm:text-4xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">{t.lead}</p>
          {currentUser?.email && <p className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">{currentUser.email}</p>}
        </div>

        <div className="space-y-7 p-6 sm:p-10">
          <fieldset>
            <legend className="text-base font-black">{t.role}</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {([
                [UserRole.STUDENT, GraduationCap, t.student, t.studentHelp],
                [UserRole.COMPANY, Building2, t.company, t.companyHelp],
              ] as const).map(([value, Icon, label, help]) => (
                <button key={value} type="button" aria-pressed={role === value} onClick={() => setRole(value)} className={`rounded-2xl border p-4 text-left transition ${role === value ? "border-[#4361ee] bg-[#eef1ff]" : "border-[#17342d]/12 hover:border-[#17342d]/30"}`}>
                  <Icon className="h-5 w-5 text-[#4361ee]" />
                  <span className="mt-3 block text-sm font-black">{label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#687d77]">{help}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-3 rounded-2xl bg-[#f5f7f2] p-4">
            {([
              ["terms", t.terms, true],
              ["transaction", t.transaction, true],
              ["privacy", t.privacy, true],
              ["marketing", t.marketing, false],
            ] as const).map(([key, label, required]) => (
              <label key={key} className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#3f5d55]">
                <input type="checkbox" checked={agreements[key]} onChange={(event) => setAgreements((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4 accent-[#17342d]" />
                <span>{label}{required && <strong className="ml-1 text-[#4361ee]">*</strong>}</span>
              </label>
            ))}
          </div>

          {failure && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800">{failure instanceof Error && failure.message === t.required ? t.required : authErrorMessage(failure, locale)}</p>}
          <button type="button" disabled={busy} onClick={() => void submit()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17342d] px-5 py-3.5 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
            {busy ? t.busy : t.submit}{!busy && <ArrowRight className="h-4 w-4" />}
          </button>
          <p className="flex items-center justify-center gap-2 text-center text-xs text-[#6b7d78]"><ShieldCheck className="h-4 w-4 text-[#2f6d58]" />{t.safety}</p>
        </div>
      </section>
    </main>
  );
}
