import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { UserRole } from "../../types";
import AuthModal from "../auth/AuthModal";
import StudentRegisterForm from "../auth/StudentRegisterForm";
import CompanyRegisterForm from "../auth/CompanyRegisterForm";
import { type Locale, useLocale } from "../../i18n/LocaleContext";
import LandingVisual from "./LandingVisual";
import { CONTACT_EMAIL, type Fragment, type LandingCopy, landingCopy } from "./landingCopy";
import { type LandingPhoto, landingPhotos } from "./landingPhotos";
import { usePauseOffscreen } from "./usePauseOffscreen";
import { publicPolicies, POLICY_VERSION, type PolicyKey } from "../../config/compliancePolicy";
import "./landing-v3.css";

interface LandingHeroProps {
    onEnterApp: (role: UserRole) => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const LINE_STAGGER = 0.08;

export const policyHref = (key: PolicyKey, locale: Locale) => `/${key}?locale=${locale}`;
const consultationHref = (locale: Locale) => {
    const subject = locale === "ko" ? "KONEXA 프로젝트 상담" : "KONEXA project enquiry";
    const body = locale === "ko" ? "맡길 업무:\n원하는 결과물:\n마감일:\n예산 범위:\n" : "Task:\nExpected deliverables:\nDeadline:\nBudget range:\n";
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

function registrationRoleFromUrl(): UserRole | null {
    if (typeof window === "undefined") return null;
    // A password recovery link must always open recovery, even if its redirect
    // URL still contains the registration entry point.
    if ((location.hash + location.search).includes("type=recovery")) return null;
    const start = new URLSearchParams(location.search).get("start");
    return start === "company" ? UserRole.COMPANY : start === "talent" ? UserRole.STUDENT : null;
}

function useLandingMeta(meta: LandingCopy["meta"]) {
    useEffect(() => {
        document.title = meta.title;
        const set = (selector: string, value: string) => document.head.querySelector(selector)?.setAttribute("content", value);
        set('meta[name="description"]', meta.description);
        set('meta[property="og:title"]', meta.title);
        set('meta[property="og:description"]', meta.description);
        set('meta[name="twitter:title"]', meta.title);
        set('meta[name="twitter:description"]', meta.description);
    }, [meta]);
}

function Wordmark() {
    return <span className="lv3-wordmark" aria-label="KONEXA"><svg className="lv3-span-mark" viewBox="0 0 40 32" fill="none" aria-hidden="true"><path d="M3 24V15a12 12 0 0 1 24 0v9M13 24v-9a12 12 0 0 1 24 0v9" stroke="currentColor" strokeWidth="4"/><path d="M13 15v9" stroke="var(--cream)" strokeWidth="7"/><path d="M13 15v9" stroke="currentColor" strokeWidth="4"/></svg>KONEXA</span>;
}

/** One document screen shared by all public policies; no separate page files. */
export function PolicyPage({ policy }: { policy: PolicyKey }) {
    const { locale, setLocale } = useLocale();
    const document = publicPolicies[locale][policy];
    useLandingMeta({ title: `${document.title} | KONEXA`, description: document.summary });
    useEffect(() => {
        const language = new URLSearchParams(location.search).get("locale");
        if (language === "ko" || language === "en") setLocale(language);
    }, [setLocale]);
    const home = `/?landing=1&locale=${locale}`;
    return <div className="lv3 lv3-policy" data-no-translate>
      <header className="lv3-wrap lv3-header"><a className="lv3-brand" href={home}><Wordmark /></a><div className="lv3-lang" role="group" aria-label={locale === "ko" ? "언어" : "Language"}>{(["ko", "en"] as const).map(language => <button key={language} aria-pressed={locale === language} onClick={() => { const url = new URL(location.href); url.searchParams.set("locale", language); history.replaceState(history.state, "", url); setLocale(language); }}>{language.toUpperCase()}</button>)}</div></header>
      <main className="lv3-wrap lv3-policy-layout">
        <aside><a className="lv3-policy-back" href={home}>← {locale === "ko" ? "홈으로" : "Back to home"}</a><nav aria-label={locale === "ko" ? "정책 문서" : "Policy documents"}>{(["terms", "privacy", "project-terms"] as const).map(key => <a key={key} href={policyHref(key, locale)} aria-current={policy === key ? "page" : undefined}>{publicPolicies[locale][key].title}</a>)}</nav><nav className="lv3-policy-toc" aria-label={locale === "ko" ? "목차" : "Contents"}>{document.sections.map((section, index) => <a key={section.title} href={`#section-${index + 1}`}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a>)}</nav></aside>
        <article><p className="lv3-policy-version">{locale === "ko" ? "공개 검토본 · 개정일" : "Public review edition · Updated"} {POLICY_VERSION}</p><h1>{document.title}</h1><p className="lv3-policy-summary">{document.summary}</p><div className="lv3-policy-notice"><strong>{locale === "ko" ? "서비스 공개 전 확인사항" : "Before public activation"}</strong><p>{document.notice}</p></div>{document.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.title}><h2><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}</section>)}<p className="lv3-policy-contact">{locale === "ko" ? "정책 문의·권리 행사" : "Policy questions and privacy requests"}: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p></article>
      </main>
    </div>;
}

/** Section content rises once as it scrolls into view. */
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number; key?: React.Key }) {
    const reduced = useReducedMotion();
    if (reduced)
        return <div className={className}>{children}</div>;
    return <motion.div className={className} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.8, delay, ease: EASE }}>{children}</motion.div>;
}

function Headline({ lines }: { lines: Fragment[][] }) {
    const reduced = useReducedMotion();
    return <h1 className="lv3-h1">
      {lines.map((line, index) => <React.Fragment key={index}>
        {index > 0 && " "}
        <span className={`lv3-line${line.some((part) => part.strong) ? " lv3-line-strong" : ""}`}>
          <motion.span className="lv3-line-in" initial={reduced ? false : { y: "115%" }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.1 + index * LINE_STAGGER, ease: EASE }}>
            {line.map((part) => part.text).join("")}
          </motion.span>
        </span>
      </React.Fragment>)}
    </h1>;
}

function Rise({ children, className, delay }: { children: React.ReactNode; className?: string; delay: number }) {
    const reduced = useReducedMotion();
    return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay, ease: EASE }}>{children}</motion.div>;
}

function FragmentText({ parts }: { parts: Fragment[] }) {
    return <>{parts.map((part) => part.strong ? <strong key={part.text}>{part.text}</strong> : <React.Fragment key={part.text}>{part.text}</React.Fragment>)}</>;
}

function Ticker({ copy }: { copy: LandingCopy["ticker"] }) {
    return <section className="lv3-ticker" aria-label={copy.label}>
      <div className="lv3-wrap"><ul className="lv3-ticker-set">
      {copy.items.map((item) => <li key={item.label} className="lv3-ticker-item">
        <span className={`lv3-dot${item.live ? "" : " lv3-dot-off"}`} aria-hidden="true"/>
        <span>{item.label}</span><span className="lv3-ticker-state">{item.state}</span>
      </li>)}
      </ul><p className="lv3-ticker-note">{copy.notes.join(" ")}</p></div>
    </section>;
}

function PhotoPanel({ id, tone, tag, title, body, cta, onClick, href, photo, locale }: {
    id?: string;
    tone: "company" | "talent";
    tag: string;
    title: string;
    body: string;
    cta: string;
    onClick: () => void;
    href?: string;
    photo?: LandingPhoto;
    locale: Locale;
}) {
    const ref = usePauseOffscreen<HTMLElement>();
    return <article ref={ref} id={id} className={`lv3-panel lv3-panel-${tone}`}>
      {photo && <img className="lv3-photo" src={photo.src1600} srcSet={`${photo.src800} 800w, ${photo.src1600} 1600w`} sizes="(min-width: 800px) 50vw, 100vw" width={photo.width} height={photo.height} alt={photo.alt[locale]} loading="lazy" decoding="async"/>}
      <div className="lv3-scrim" aria-hidden="true"/>
      <span className="lv3-panel-tag">{tag}</span>
      <div className="lv3-panel-body">
        <h3>{title}</h3>
        <p>{body}</p>
        {href ? <a href={href} className="lv3-btn lv3-btn-primary">{cta}<ArrowRight aria-hidden="true"/></a> : <button type="button" onClick={onClick} className="lv3-btn lv3-btn-primary">{cta}<ArrowRight aria-hidden="true"/></button>}
      </div>
    </article>;
}

export default function LandingHero({ onEnterApp }: LandingHeroProps) {
    const [previewOnly, setPreviewOnly] = useState(false);
    useEffect(() => {
        const request = new AbortController();
        void fetch('/api/public/runtime-mode', { signal: request.signal }).then(async response => response.ok ? response.json() : null).then(body => { if (!request.signal.aborted) setPreviewOnly(body?.previewOnly === true); }).catch(() => {});
        return () => request.abort();
    }, []);
    const { locale, setLocale } = useLocale();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => typeof window !== "undefined" && (location.hash.includes("type=recovery") || location.search.includes("type=recovery")));
    const [activeRegisterRole, setActiveRegisterRole] = useState<UserRole | null>(registrationRoleFromUrl);
    const t = landingCopy[locale];
    const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | null>(null);
    const copyEmail = async () => {
        try { await navigator.clipboard.writeText(CONTACT_EMAIL); setCopyStatus("copied"); }
        catch { setCopyStatus("failed"); }
    };
    useEffect(() => { setCopyStatus(null); }, [locale]);
    useLandingMeta(t.meta);
    useEffect(() => {
        // The forms replace the page, so a CTA far down it must not leave the form scrolled away.
        if (activeRegisterRole)
            window.scrollTo({ top: 0, behavior: "instant" });
    }, [activeRegisterRole]);
    useEffect(() => {
        const syncRegistration = () => setActiveRegisterRole(registrationRoleFromUrl());
        window.addEventListener("popstate", syncRegistration);
        return () => window.removeEventListener("popstate", syncRegistration);
    }, []);
    const openRegistration = (role: UserRole) => {
        if (role !== UserRole.COMPANY && role !== UserRole.STUDENT) return;
        const url = new URL(window.location.href);
        url.searchParams.set("start", role === UserRole.COMPANY ? "company" : "talent");
        window.history.pushState({ ...window.history.state, konexaRegistration: true }, "", url);
        setActiveRegisterRole(role);
    };
    const clearRegistration = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("start");
        const { konexaRegistration: _registration, ...state } = window.history.state || {};
        window.history.replaceState(state, "", url);
        setActiveRegisterRole(null);
    };
    const cancelRegistration = () => {
        // CTA entries have a landing entry to return to. A shared direct link
        // instead stays on KONEXA rather than sending the visitor off-site.
        if (window.history.state?.konexaRegistration) window.history.back();
        else clearRegistration();
    };
    const finishRegistration = (role: UserRole) => {
        clearRegistration();
        onEnterApp(role);
    };
    const openCompany = () => openRegistration(UserRole.COMPANY);
    const openTalent = () => openRegistration(UserRole.STUDENT);
    const lines = t.hero.title.length;
    const afterTitle = 0.1 + lines * LINE_STAGGER + 0.2;

    return <div id="landing-master">
    {previewOnly && <div role="status" className="bg-[#253b4e] px-5 py-3 text-center text-sm leading-7 text-white">{locale === 'ko' ? '무료 호스팅 이전 미리보기입니다. 실제 가입·회원 데이터·프로젝트 운영은 아직 연결하지 않았습니다.' : 'Free-hosting migration preview. Registration, member data and project operations are not connected yet.'}</div>}
    <AnimatePresence mode="wait">
      {activeRegisterRole ? <motion.div key="registration" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="konexa-light min-h-screen overflow-x-clip text-[#20211f] selection:bg-[#dbe3ff] selection:text-[#20211f]">
        <motion.main data-no-translate className="min-h-screen bg-[#f7f6f1] text-neutral-900">
          {activeRegisterRole === UserRole.STUDENT
                ? <StudentRegisterForm onCancel={cancelRegistration} onSuccess={() => finishRegistration(UserRole.STUDENT)}/>
                : <CompanyRegisterForm onCancel={cancelRegistration} onSuccess={() => finishRegistration(UserRole.COMPANY)}/>}
        </motion.main>
      </motion.div> : <motion.div key="landing" className="lv3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <main>
          <section className="lv3-hero">
            <div className="lv3-wrap">
              <header className="lv3-header">
                <button type="button" onClick={() => window.scrollTo({ top: 0 })} className="lv3-brand" aria-label="KONEXA"><Wordmark /></button>
                <nav className="lv3-nav" aria-label={t.nav.primary}>
                  <a href="#how">{t.nav.how}</a>
                  <a href="#talent">{t.nav.talent}</a>
                </nav>
                <div className="lv3-actions">
                  <button type="button" onClick={() => setIsAuthModalOpen(true)} className="lv3-login">{t.nav.login}</button>
                  <div className="lv3-lang" role="group" aria-label={t.nav.language}>
                    {(["ko", "en"] as Locale[]).map((item) => <button key={item} type="button" onClick={() => setLocale(item)} aria-pressed={locale === item} lang={item}>{item.toUpperCase()}</button>)}
                  </div>
                  <a href={consultationHref(locale)} className="lv3-btn lv3-btn-primary lv3-header-cta">{t.nav.post}</a>
                </div>
              </header>

              <div className="lv3-hero-grid">
                <div className="lv3-hero-copy">
                  <Rise delay={0} className="lv3-pill-row"><span className="lv3-pill">{t.hero.pill}</span></Rise>
                  <Headline lines={t.hero.title}/>
                  <Rise delay={afterTitle}><p className="lv3-lead">{t.hero.lead}</p></Rise>
                  <Rise delay={afterTitle + 0.12} className="lv3-cta-row">
                    <a href={consultationHref(locale)} className="lv3-btn lv3-btn-primary">{t.hero.postCta}<ArrowRight aria-hidden="true"/></a>
                    <button type="button" onClick={openTalent} className="lv3-btn lv3-btn-ghost">{t.hero.talentCta}</button>
                  </Rise>
                  <p className="lv3-contact-note">{t.hero.contactNote}</p>
                  <button type="button" onClick={openCompany} className="lv3-company-entry">{t.hero.companyRegister}<ArrowRight aria-hidden="true"/></button>
                </div>
                <LandingVisual copy={t.record}/>
              </div>
            </div>
          </section>

          <Ticker copy={t.ticker}/>

          <section className="lv3-section lv3-pilot" aria-labelledby="pilot-title"><div className="lv3-wrap lv3-pilot-grid">
            <div>
            <h2 id="pilot-title" className="lv3-h2">{t.pilot.title}</h2>
            <p className="lv3-pilot-intro">{t.pilot.intro}</p>
            </div><div>
            <dl className="lv3-responsibilities">{t.pilot.roles.map(role => <div key={role.name}><dt>{role.name}</dt><dd>{role.body}</dd></div>)}</dl>
            <p className="lv3-pilot-limit">{t.pilot.participation}</p>
            </div>
          </div></section>

          <section id="how" className="lv3-section lv3-how">
            <div className="lv3-wrap">
              <Reveal><h2 className="lv3-h2">{t.how.title}</h2></Reveal>
              <ol className="lv3-steps">
                {t.how.steps.map(([number, title, body], index) => <li key={number}><Reveal delay={index * 0.08} className="lv3-step">
                  <span className="lv3-step-number">{number}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </Reveal></li>)}
              </ol>
            </div>
          </section>

          <section className="lv3-section lv3-split">
            <div className="lv3-wrap lv3-split-grid">
              <Reveal><PhotoPanel tone="company" tag={t.split.company.tag} title={t.split.company.title} body={t.split.company.body} cta={t.split.company.cta} onClick={openCompany} href={consultationHref(locale)} photo={landingPhotos.company} locale={locale}/></Reveal>
              <Reveal delay={0.1}><PhotoPanel id="talent" tone="talent" tag={t.split.talent.tag} title={t.split.talent.title} body={t.split.talent.body} cta={t.split.talent.cta} onClick={openTalent} photo={landingPhotos.talent} locale={locale}/></Reveal>
            </div>
          </section>

          <section className="lv3-section lv3-examples" aria-labelledby="examples-title"><div className="lv3-wrap">
            <h2 id="examples-title" className="lv3-h2">{t.pilot.examplesTitle}</h2>
            <div className="lv3-example-list">{t.pilot.examples.map(example => <article key={example.name}><h3>{example.name}</h3><p>{example.output}</p><p className="lv3-example-materials">{example.materials}</p></article>)}</div>
            <p className="lv3-pilot-limit">{t.pilot.limit}</p>
            <a className="lv3-policy-link" href={policyHref("project-terms", locale)}>{locale === "ko" ? "계약·결제·환불 조건 읽기" : "Read contract, payment and refund conditions"}<ArrowRight aria-hidden="true"/></a>
          </div></section>

          <section className="lv3-final">
            <div className="lv3-wrap">
              <Reveal className="lv3-final-inner">
                <h2 className="lv3-final-title"><FragmentText parts={t.final.title}/></h2>
                <p>{t.final.body}</p>
                <h3 className="lv3-inquiry-title">{t.pilot.inquiryTitle}</h3>
                <ol className="lv3-inquiry-steps">{t.pilot.inquirySteps.map(step => <li key={step}>{step}</li>)}</ol>
                <div className="lv3-cta-row lv3-cta-center">
                  <a href={consultationHref(locale)} className="lv3-btn lv3-btn-primary">{t.final.post}<ArrowRight aria-hidden="true"/></a>
                  <button type="button" onClick={openCompany} className="lv3-btn lv3-btn-ghost">{t.final.email}</button>
                </div>
                <div className="lv3-contact-fallback"><button type="button" onClick={() => void copyEmail()}>{t.pilot.copyEmail}</button><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></div>
                <p className="lv3-copy-status" role="status" aria-live="polite">{copyStatus === "copied" ? t.pilot.copied : copyStatus === "failed" ? t.pilot.copyFailed : ""}</p>
              </Reveal>
            </div>
          </section>
        </main>

        <footer className="lv3-footer">
          <div className="lv3-wrap"><p className="lv3-operator-notice">{t.footer.operatorNotice}</p></div>
          <div className="lv3-wrap lv3-contact-row"><p>{t.footer.founder}</p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></div>
          <div className="lv3-wrap lv3-footer-row">
            <nav aria-label="Legal">
              <a href={policyHref("terms", locale)}>{t.footer.terms}</a>
              <a href={policyHref("privacy", locale)}>{t.footer.privacy}</a>
              <a href={policyHref("project-terms", locale)}>{locale === "ko" ? "계약·결제·환불" : "Contracts & refunds"}</a>
              <a href="/status">{t.footer.status}</a>
            </nav>
            <p>© {new Date().getFullYear()} {t.footer.rights}</p>
          </div>
          <div className="lv3-wrap lv3-footer-signature" aria-hidden="true">KONEXA<span>Work, together.</span></div>
        </footer>

        <div className="lv3-mobile-cta">
          <a href={consultationHref(locale)} className="lv3-btn lv3-btn-primary">{t.mobileCta}<ArrowRight aria-hidden="true"/></a>
        </div>
      </motion.div>}
    </AnimatePresence>
    <div className="konexa-light relative z-[60] text-[#20211f] selection:bg-[#dbe3ff] selection:text-[#20211f]">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} onSwitchToRegister={(role) => { setIsAuthModalOpen(false); openRegistration(role); }}/>
    </div>
  </div>;
}
