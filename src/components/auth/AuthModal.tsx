import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";
import { updatePassword } from "../../lib/supabaseAuth";
import { authCopy, authErrorMessage } from "../../i18n/authCopy";
import { localeNames, useLocale, type Locale } from "../../i18n/LocaleContext";
interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialTab?: "login" | "register" | "forgot" | "recovery";
    onSwitchToRegister: (role: UserRole) => void;
}
const inputClass = "h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 disabled:bg-neutral-100";
const primaryClass = "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17342d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#284e44] disabled:cursor-wait disabled:opacity-60";
export default function AuthModal({ isOpen, onClose, onSuccess, initialTab = "login", onSwitchToRegister }: AuthModalProps) {
    const { loginUser, googleLogin, resetPassword } = useApp();
    const { locale, setLocale } = useLocale();
    const t = authCopy[locale];
    const reduced = useReducedMotion();
    const panel = useRef<HTMLDivElement>(null);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    const [activeTab, setActiveTab] = useState<"login" | "forgot" | "recovery">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [failure, setFailure] = useState<unknown>(null);
    const [passwordMismatch, setPasswordMismatch] = useState(false);
    const [notice, setNotice] = useState<"resetSent" | "updatedBody" | null>(null);
    useEffect(() => {
        if (!isOpen)
            return;
        const recovery = /type=recovery/.test(window.location.hash + window.location.search);
        setActiveTab(recovery || initialTab === "recovery" ? "recovery" : initialTab === "forgot" ? "forgot" : "login");
        setFailure(null);
        setNotice(null);
        setPassword("");
        setConfirmPassword("");
        setPasswordMismatch(false);
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        panel.current?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeRef.current();
            }
            if (event.key !== "Tab" || !panel.current)
                return;
            const elements = Array.from(panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]')) as HTMLElement[];
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (!first) {
                event.preventDefault();
                return;
            }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKey);
            previousFocus?.focus();
        };
    }, [isOpen, initialTab]);
    if (!isOpen)
        return null;
    const changeTab = (tab: typeof activeTab) => {
        setActiveTab(tab);
        setFailure(null);
        setPasswordMismatch(false);
        setNotice(null);
        setPassword("");
        setConfirmPassword("");
    };
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isSubmitting)
            return;
        setFailure(null);
        setNotice(null);
        setPasswordMismatch(false);
        if (activeTab === "recovery" && (password.length < 8 || password !== confirmPassword)) {
            setPasswordMismatch(true);
            return;
        }
        setIsSubmitting(true);
        try {
            if (activeTab === "login") {
                await loginUser(email.trim(), role, password);
                onSuccess();
                onClose();
            }
            else if (activeTab === "forgot") {
                await resetPassword(email.trim());
                setNotice("resetSent");
            }
            else {
                await updatePassword(password);
                window.history.replaceState({}, document.title, window.location.pathname);
                changeTab("login");
                setNotice("updatedBody");
            }
        }
        catch (cause) {
            setFailure(cause);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleGoogle = async () => {
        if (isSubmitting)
            return;
        setFailure(null);
        setIsSubmitting(true);
        try {
            // OAuth owns navigation. Do not claim success before its callback.
            await googleLogin(role);
        }
        catch (cause) {
            setFailure(cause);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return <div id="auth-modal-overlay" data-no-translate className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5">
    <div className="absolute inset-0 bg-neutral-950/45 backdrop-blur-md" onClick={onClose} aria-hidden="true"/>
    <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-description" tabIndex={-1} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl outline-none sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1" aria-label="Language">
          {(["ko", "en"] as Locale[]).map(value => <button type="button" key={value} onClick={() => setLocale(value)} aria-pressed={value === locale} className={"rounded-lg px-2 py-2 text-xs font-semibold " + (value === locale ? "bg-emerald-50 text-emerald-900" : "text-neutral-600 hover:bg-neutral-100")}>{localeNames[value]}</button>)}
        </div>
        <button type="button" onClick={onClose} aria-label={t.close} className="rounded-full p-2 text-neutral-600 hover:bg-neutral-100"><X className="h-5 w-5"/></button>
      </div>
      <h2 id="auth-title" className="break-keep text-2xl font-bold leading-snug tracking-tight text-neutral-900">{activeTab === "login" ? t.loginTitle : activeTab === "forgot" ? t.forgotTitle : t.recoveryTitle}</h2>
      <p id="auth-description" className="mt-3 text-sm leading-6 text-neutral-600">{activeTab === "login" ? t.loginLead : activeTab === "forgot" ? t.forgotLead : t.recoveryLead}</p>
      {activeTab === "login" && <div className="mt-6 space-y-4">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1" role="group" aria-label={t.roleLabel}>
          {([UserRole.STUDENT, UserRole.COMPANY, UserRole.ADMIN] as const).map(value => <button type="button" key={value} disabled={isSubmitting} aria-pressed={role === value} onClick={() => setRole(value)} className={"rounded-lg px-1 py-2.5 text-sm font-semibold " + (role === value ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900")}>{value === UserRole.STUDENT ? t.student : value === UserRole.COMPANY ? t.company : t.admin}</button>)}
        </div>
        {role === UserRole.ADMIN && <p className="rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">{t.adminNote}</p>}
        <button type="button" onClick={handleGoogle} disabled={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 px-3 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"><span aria-hidden="true" className="text-base font-bold text-blue-700">G</span>{t.google}</button>
        <div className="flex items-center gap-3 text-xs text-neutral-500"><span className="h-px flex-1 bg-neutral-200"/>{t.divider}<span className="h-px flex-1 bg-neutral-200"/></div>
      </div>}
      <form onSubmit={submit} className="mt-5 space-y-4" aria-busy={isSubmitting}>
        {activeTab !== "recovery" && <div>
          <label htmlFor="auth-email" className="mb-2 block text-sm font-semibold text-neutral-700">{t.email}</label>
          <input id="auth-email" name="email" type="email" required autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={isSubmitting} value={email} onChange={event => setEmail(event.target.value)} className={inputClass}/>
        </div>}
        {activeTab !== "forgot" && <div>
          <label htmlFor="auth-password" className="mb-2 block text-sm font-semibold text-neutral-700">{activeTab === "recovery" ? t.newPassword : t.password}</label>
          <input id="auth-password" name="password" type="password" required minLength={activeTab === "recovery" ? 8 : undefined} autoComplete={activeTab === "recovery" ? "new-password" : "current-password"} disabled={isSubmitting} value={password} onChange={event => setPassword(event.target.value)} className={inputClass}/>
        </div>}
        {activeTab === "recovery" && <div>
          <label htmlFor="auth-confirm" className="mb-2 block text-sm font-semibold text-neutral-700">{t.confirmPassword}</label>
          <input id="auth-confirm" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" disabled={isSubmitting} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className={inputClass}/>
        </div>}
        {activeTab === "login" && <button type="button" disabled={isSubmitting} onClick={() => changeTab("forgot")} className="text-sm font-medium text-emerald-800 underline-offset-4 hover:underline">{t.forgot}</button>}
        {(Boolean(failure) || passwordMismatch) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800">{passwordMismatch ? t.invalidPassword : authErrorMessage(failure, locale)}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">{t[notice]}</p>}
        <button type="submit" disabled={isSubmitting} className={primaryClass}>{isSubmitting ? t.busy : activeTab === "login" ? t.submit : activeTab === "forgot" ? t.send : t.update}{!isSubmitting && <ArrowRight className="h-4 w-4"/>}</button>
      </form>
      {activeTab === "login" ? <>
        <p className="mt-4 text-xs leading-5 text-neutral-600">{t.sessionNote}</p>
        {role !== UserRole.ADMIN && <div className="mt-6 border-t border-neutral-200 pt-5 text-center text-sm leading-6"><p className="text-neutral-600">{t.firstTime}</p><button type="button" disabled={isSubmitting} onClick={() => { onClose(); onSwitchToRegister(role); }} className="mt-1 font-semibold text-emerald-800 hover:underline">{role === UserRole.STUDENT ? t.studentJoin : t.companyJoin}</button></div>}
      </> : <button type="button" disabled={isSubmitting} onClick={() => changeTab("login")} className="mt-5 w-full text-center text-sm font-medium text-neutral-700 hover:underline">{t.back}</button>}
    </motion.div>
  </div>;
}
