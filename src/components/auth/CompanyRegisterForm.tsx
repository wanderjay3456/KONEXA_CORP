import { SIGNUP_CONSENT_VERSION, signupTransferNotice } from '../../config/compliancePolicy';
import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Mail, ShieldCheck, Sparkles } from "lucide-react";
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
        eyebrow: "1분 기업 계정 만들기",
        title: "기업 계정부터 만들고, 채용 정보는 로그인 후 완성하세요.",
        lead: "가입 단계에서는 기업명과 로그인 정보만 받습니다. 사업자등록증·담당자 정보·채용 조건은 로그인 직후 안내에 따라 등록합니다.",
        google: "Google로 바로 시작",
        googleHelp: "기존 계정은 바로 로그인됩니다. 처음이라면 Google 인증 후 계정 유형과 필수 동의만 확인합니다.",
        divider: "또는 이메일로 계정 만들기",
        company: "기업명",
        companyPlaceholder: "법인 또는 사업체명을 입력해 주세요",
        email: "업무용 이메일",
        password: "비밀번호",
        passwordHint: "8자 이상",
        terms: "KONEXA 이용약관에 동의합니다.",
        transaction: "인재 소개·계약 단계의 플랫폼 외 거래 방지 약정에 동의합니다.",
        privacy: "개인정보 국외이전 경로·목적·보유기간·거부 방법을 확인하고 동의합니다.",
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
        preparation: "가입 후에는 본사 국가, 현지 기업 등록번호, 기업 등록 증빙 서류와 담당자 정보를 입력합니다. 해외 기업의 서류 요건이 불확실하면 가입 전에 KONEXA에 문의해 주세요.",
        requestAgreements: "정책 공개 검토본 읽기",
    },
    en: {
        eyebrow: "Create a company account in 1 minute",
        title: "Create the company account now, then add hiring details after sign-in.",
        lead: "We only ask for the company name and login details here. Add business documents, contacts, and hiring requirements in the guided company profile.",
        google: "Start instantly with Google",
        googleHelp: "Existing members sign in immediately. New members confirm their account type and required agreements after Google verification.",
        divider: "or create an account with email",
        company: "Company name",
        companyPlaceholder: "Enter the legal or trading name",
        email: "Work email",
        password: "Password",
        passwordHint: "At least 8 characters",
        terms: "I agree to the KONEXA Terms of Use.",
        transaction: "I agree to the non-circumvention terms for talent introductions and contracts.",
        privacy: "I agree to the disclosed international processing, purposes, retention and refusal conditions.",
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
        preparation: "After sign-up, you will need your headquarters country, local business registration number, registration document, and contact details. If you are unsure about documents for an overseas company, contact KONEXA before signing up.",
        requestAgreements: "Read the public policy review editions",
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
    const [agreements, setAgreements] = useState({ collection: false, terms: false, transaction: false, privacy: false, marketing: false });
    const consentBundle = {
        terms: agreements.terms,
        nonCircumvention: agreements.transaction,
        messageAnalysis: agreements.privacy,
        crossBorderPrivacy: agreements.privacy,
        marketing: agreements.marketing,
        dataCollection: agreements.collection,
        consentScope: "signup-no-paid-obligation",
        documentVersion: SIGNUP_CONSENT_VERSION,
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
            && agreements.collection && agreements.terms && agreements.transaction && agreements.privacy;
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
        return (<main className="grid min-h-screen place-items-center bg-[#f7f4ec] px-5">
        <section className="w-full max-w-lg rounded-xl border border-[#20211f]/10 bg-white p-8 text-center shadow-[0_30px_90px_rgba(23,52,45,.1)] sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#dff8ea] text-[#23644e]"><Mail className="h-6 w-6"/></span>
          <h1 className="mt-6 break-keep font-display text-3xl font-bold tracking-[-.04em] text-[#20211f]">{t.confirmationTitle}</h1>
          <p className="mt-4 leading-7 text-[#557069]">{t.confirmationBody}</p>
          <button type="button" onClick={onCancel} className="mt-8 rounded-full bg-[#20211f] px-6 py-3 text-sm font-bold text-white">{t.login}</button>
        </section>
      </main>);
    }
    return (<main data-no-translate className="min-h-screen bg-[#f7f4ec] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-bold text-[#5b5d56]"><ArrowLeft className="h-4 w-4"/>{t.back}</button>
          <div role="group" aria-label="Language" className="flex rounded-full border border-[#20211f]/10 bg-white p-1">
            {(["ko", "en"] as const).map((item) => <button key={item} type="button" aria-pressed={locale === item} onClick={() => setLocale(item)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase ${locale === item ? "bg-[#20211f] text-white" : "text-[#5b5d56]"}`}>{item}</button>)}
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-xl border border-[#20211f]/10 bg-white shadow-[0_30px_90px_rgba(23,52,45,.09)]">
          <div className="grid lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="bg-[#20211f] p-7 text-white sm:p-10">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#dbe3ff]"><Sparkles className="h-4 w-4"/>{t.eyebrow}</span>
              <h1 className="mt-5 break-keep font-display text-3xl font-bold leading-tight tracking-[-.04em]">{t.title}</h1>
              <p className="mt-5 text-sm leading-7 text-white/75">{t.lead}</p>
              <p className="mt-5 text-sm leading-7 text-white/75">{t.preparation}</p>
              <p className="mt-8 flex items-start gap-2 text-xs leading-5 text-white/65"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#dbe3ff]"/>{t.safety}</p>
            </aside>

            <div className="p-6 sm:p-10">
              <button type="button" disabled={googleBusy || isSubmitting} onClick={() => void handleGoogle()} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#253b4e]/30 bg-[#eef1ff] px-4 py-3.5 text-sm font-semibold text-[#253b4e] disabled:cursor-wait disabled:opacity-60">
                <span aria-hidden="true" className="text-base font-semibold">G</span>{googleBusy ? t.googleBusy : t.google}
              </button>
              <p className="mt-2 text-center text-xs leading-5 text-[#5b5d56]">{t.googleHelp}</p>

              <div className="my-6 flex items-center gap-3 text-xs font-semibold text-[#71746a]"><span className="h-px flex-1 bg-[#20211f]/10"/>{t.divider}<span className="h-px flex-1 bg-[#20211f]/10"/></div>

              <form onSubmit={submitEmail} className="space-y-5">
                <label className="block"><span className="mb-2 block text-sm font-bold text-[#20211f]">{t.company} *</span><input autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder={t.companyPlaceholder} className="w-full rounded-xl border border-[#20211f]/15 px-4 py-3 outline-none focus:border-[#253b4e]"/></label>
                <label className="block"><span className="mb-2 block text-sm font-bold text-[#20211f]">{t.email} *</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#20211f]/15 px-4 py-3 outline-none focus:border-[#253b4e]"/></label>
                <label className="block"><span className="mb-2 block text-sm font-bold text-[#20211f]">{t.password} *</span><input type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordHint} className="w-full rounded-xl border border-[#20211f]/15 px-4 py-3 outline-none focus:border-[#253b4e]"/></label>

                <div className="space-y-3 rounded-2xl bg-[#f3f4ee] p-4">
                  {([
            ["terms", t.terms, true],
            ["collection", locale === "ko" ? "계정·프로필·업무 기록의 수집·이용 목적과 보유기간을 확인하고 동의합니다." : "I agree to account, profile and work-record collection and use for the stated purposes and retention periods.", true],
            ["transaction", t.transaction, true],
            ["privacy", t.privacy, true],
            ["marketing", t.marketing, false],
        ] as const).map(([key, label, required]) => <label key={key} className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#41433e]"><input type="checkbox" checked={agreements[key]} onChange={(event) => setAgreements((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4 accent-[#20211f]"/><span>{label}{required && <strong className="ml-1 text-[#253b4e]">*</strong>}</span></label>)}
                  <p className="text-xs leading-6 text-neutral-600">{signupTransferNotice(locale)}</p>
                  <a className="inline-flex min-h-11 items-center text-sm font-semibold text-[#253b4e] underline underline-offset-4" href={`/terms?locale=${locale}`} target="_blank" rel="noreferrer">{t.requestAgreements}</a><div className="flex flex-wrap gap-4 text-xs leading-6"><a href={`/privacy?locale=${locale}`} target="_blank" rel="noreferrer" className="underline">{locale === "ko" ? "개인정보처리방침" : "Privacy policy"}</a><a href={`/project-terms?locale=${locale}`} target="_blank" rel="noreferrer" className="underline">{locale === "ko" ? "계약·결제·환불" : "Contracts & refunds"}</a></div><p className="text-xs leading-6 text-neutral-600">{locale === "ko" ? "공개 검토본입니다. 기존 동의 버전은 자동 변경되지 않으며 정식 시행 전 동의 화면과 국외이전 고지를 확정해야 합니다." : "Review editions. Existing consent versions are not silently changed; consent screens and transfer disclosures must be finalized before formal commencement."}</p>
                </div>

                <button type="submit" disabled={isSubmitting || googleBusy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#20211f] px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">
                  {isSubmitting ? t.submitting : t.submit}{!isSubmitting && <ArrowRight className="h-4 w-4"/>}
                </button>
              </form>
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-[#5b5d56]"><Building2 className="h-4 w-4"/>{t.next}</p>
            </div>
          </div>
        </section>
      </div>
    </main>);
}
