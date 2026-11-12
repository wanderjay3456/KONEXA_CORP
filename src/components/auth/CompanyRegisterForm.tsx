import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useLocale } from "../../i18n/LocaleContext";
import { CompanyProfile, UserRole } from "../../types";
import { useToast } from "../ui/Toast";
interface CompanyRegisterFormProps {
    onCancel: () => void;
    onSuccess: () => void;
}
const copy = {
    ko: {
        eyebrow: "기업 가입",
        title: "기업 계정부터 만들고, 채용 정보는 로그인 후 완성하세요.",
        lead: "가입 단계에서는 기업명과 로그인 정보만 받습니다. 사업자등록증·담당자 정보·채용 조건은 로그인 직후 안내에 따라 등록합니다.",
        google: "Google로 계속하기",
        googleHelp: "기존 계정은 바로 로그인됩니다. 처음이라면 Google 인증 후 계정 유형과 필수 동의만 확인합니다.",
        divider: "또는 이메일로 계정 만들기",
        company: "기업명",
        companyPlaceholder: "법인 또는 사업체명을 입력해 주세요",
        email: "업무용 이메일",
        password: "비밀번호",
        passwordHint: "8자 이상",
        terms: "KONEXA 이용약관과 개인정보처리방침에 동의합니다.",
        transaction: "인재 소개·계약 단계의 플랫폼 외 거래 방지 약정에 동의합니다.",
        privacy: "메시지 안전 분석 및 개인정보 국외이전 고지에 동의합니다.",
        marketing: "인재풀과 서비스 업데이트를 이메일로 받습니다. (선택)",
        submit: "기업 계정 만들기",
        submitting: "계정을 만들고 있어요",
        googleBusy: "Google로 이동하고 있어요",
        required: "기업명, 올바른 이메일, 8자 이상의 비밀번호와 필수 동의를 확인해 주세요.",
        confirmationTitle: "확인 이메일을 보냈습니다.",
        confirmationBody: "이메일의 확인 링크를 누른 뒤 로그인하세요. 그러면 필수 기업 프로필 작성 화면으로 바로 연결됩니다.",
        login: "로그인 화면으로",
        back: "이전",
        next: "가입 후 기업 검증 프로필 작성으로 이어집니다.",
        safety: "미완성 기업 프로필은 공고를 게시할 수 없으며, 필수 정보와 서류를 순서대로 안내합니다.",
    },
    en: {
        eyebrow: "Company sign-up",
        title: "Create the company account now, then add hiring details after sign-in.",
        lead: "We only ask for the company name and login details here. Add business documents, contacts, and hiring requirements in the guided company profile.",
        google: "Continue with Google",
        googleHelp: "Existing members sign in immediately. New members confirm their account type and required agreements after Google verification.",
        divider: "or create an account with email",
        company: "Company name",
        companyPlaceholder: "Enter the legal or trading name",
        email: "Work email",
        password: "Password",
        passwordHint: "At least 8 characters",
        terms: "I agree to the KONEXA Terms and Privacy Policy.",
        transaction: "I agree to the non-circumvention terms for talent introductions and contracts.",
        privacy: "I agree to the message-safety analysis and cross-border privacy notice.",
        marketing: "Send me talent-pool and service updates. (Optional)",
        submit: "Create company account",
        submitting: "Creating your account",
        googleBusy: "Opening Google",
        required: "Check the company name, email, 8-character password, and all required agreements.",
        confirmationTitle: "Check your inbox.",
        confirmationBody: "Confirm your email and sign in. We will take you directly to the required company profile setup.",
        login: "Go to sign in",
        back: "Back",
        next: "Required company verification follows sign-up.",
        safety: "Incomplete company profiles cannot publish opportunities; the guided setup covers each required detail and document.",
    }
} as const;
export default function CompanyRegisterForm({ onCancel, onSuccess }: CompanyRegisterFormProps) {
    const { registerUser, googleLogin } = useApp();
    const { locale, setLocale } = useLocale();
    const { error } = useToast();
    const t = copy[locale];
    const [companyName, setCompanyName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        if (googleBusy || isSubmitting)
            return;
        setGoogleBusy(true);
        try {
            await googleLogin(UserRole.COMPANY);
        }
        catch {
            // The shared auth layer presents the error.
        }
        finally {
            setGoogleBusy(false);
        }
    };
    const submitEmail = async (event: React.FormEvent) => {
        event.preventDefault();
        const valid = Boolean(companyName.trim())
            && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
            && password.length >= 8
            && agreements.terms && agreements.transaction && agreements.privacy;
        if (!valid) {
            error(t.required, t.required);
            return;
        }
        setIsSubmitting(true);
        const profile: Partial<CompanyProfile> = {
            companyName: companyName.trim(),
            website: "",
            description: "",
            verified: false,
            verifiedStatus: "Pending",
            notificationPreferences: { email: true, system: true },
            onboardingCompleted: false,
        };
        try {
            const result = await registerUser(email.trim(), companyName.trim(), UserRole.COMPANY, undefined, profile, password, consentBundle);
            if (result.emailConfirmationRequired)
                setEmailConfirmationRequired(true);
            else
                onSuccess();
        }
        catch {
            // The shared auth layer presents a safe, actionable error.
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (emailConfirmationRequired) {
        return (<main className="grid min-h-screen place-items-center bg-[#f7f6f1] px-5">
        <section className="w-full max-w-lg rounded-xl border border-[#17342d]/15 bg-white p-8 sm:p-12">
          <Mail aria-hidden="true" className="h-6 w-6 text-[#1f6b4f]"/>
          <h1 className="mt-5 break-keep font-display text-3xl font-medium tracking-[-.04em] text-[#17342d]">{t.confirmationTitle}</h1>
          <p className="mt-4 leading-7 text-[#557069]">{t.confirmationBody}</p>
          <button type="button" onClick={onCancel} className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-[#17342d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#284e44]">{t.login}</button>
        </section>
      </main>);
    }
    return (<main data-no-translate className="min-h-screen bg-[#f7f6f1] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={onCancel} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#48645d] transition hover:text-[#17342d]"><ArrowLeft className="h-4 w-4"/>{t.back}</button>
          <div role="group" aria-label="Language" className="flex">
            {(["ko", "en"] as const).map((item) => <button key={item} type="button" aria-pressed={locale === item} onClick={() => setLocale(item)} className={`min-h-11 min-w-11 border-b-2 text-xs font-semibold uppercase tracking-[.06em] transition ${locale === item ? "border-[#17342d] text-[#17342d]" : "border-transparent text-[#647a74] hover:text-[#17342d]"}`}>{item}</button>)}
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-xl border border-[#17342d]/15 bg-white">
          <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="bg-[#17342d] p-7 text-white sm:p-10">
              <p className="text-sm font-medium text-[#b9f4d0]">{t.eyebrow}</p>
              <h1 className="mt-4 break-keep font-display text-[1.75rem] font-medium leading-tight tracking-[-.04em]">{t.title}</h1>
              <p className="mt-5 text-sm leading-7 text-white/75">{t.lead}</p>
              <p className="mt-8 border-t border-white/15 pt-4 text-xs leading-5 text-white/70">{t.safety}</p>
            </aside>

            <div className="p-6 sm:p-10">
              <button type="button" disabled={googleBusy || isSubmitting} onClick={() => void handleGoogle()} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#17342d]/25 bg-white px-4 py-3.5 text-sm font-semibold text-[#17342d] transition hover:bg-[#f5f3ee] disabled:cursor-wait disabled:opacity-60">
                <span aria-hidden="true" className="text-base font-bold">G</span>{googleBusy ? t.googleBusy : t.google}
              </button>
              <p className="mt-2 text-center text-xs leading-5 text-[#6e817b]">{t.googleHelp}</p>

              <div className="my-6 flex items-center gap-3 text-xs text-[#6e817b]"><span className="h-px flex-1 bg-[#17342d]/10"/>{t.divider}<span className="h-px flex-1 bg-[#17342d]/10"/></div>

              <form onSubmit={submitEmail} className="space-y-5">
                <label className="block"><span className="mb-2 block text-sm font-semibold text-[#27483f]">{t.company} *</span><input autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder={t.companyPlaceholder} className="w-full rounded-lg border border-[#17342d]/25 px-4 py-3 outline-none transition focus:border-[#17342d] focus:ring-2 focus:ring-[#17342d]/15"/></label>
                <label className="block"><span className="mb-2 block text-sm font-semibold text-[#27483f]">{t.email} *</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-[#17342d]/25 px-4 py-3 outline-none transition focus:border-[#17342d] focus:ring-2 focus:ring-[#17342d]/15"/></label>
                <label className="block"><span className="mb-2 block text-sm font-semibold text-[#27483f]">{t.password} *</span><input type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordHint} className="w-full rounded-lg border border-[#17342d]/25 px-4 py-3 outline-none transition focus:border-[#17342d] focus:ring-2 focus:ring-[#17342d]/15"/></label>

                <div className="space-y-3 border-y border-[#17342d]/10 py-4">
                  {([
            ["terms", t.terms, true],
            ["transaction", t.transaction, true],
            ["privacy", t.privacy, true],
            ["marketing", t.marketing, false],
        ] as const).map(([key, label, required]) => <label key={key} className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#3f5d55]"><input type="checkbox" checked={agreements[key]} onChange={(event) => setAgreements((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4 accent-[#17342d]"/><span>{label}{required && <span aria-hidden="true" className="ml-1 font-semibold text-[#17342d]">*</span>}</span></label>)}
                </div>

                <button type="submit" disabled={isSubmitting || googleBusy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#17342d] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#284e44] disabled:cursor-wait disabled:opacity-60">
                  {isSubmitting ? t.submitting : t.submit}{!isSubmitting && <ArrowRight className="h-4 w-4"/>}
                </button>
              </form>
              <p className="mt-4 text-center text-xs text-[#6b7d78]">{t.next}</p>
            </div>
          </div>
        </section>
      </div>
    </main>);
}
