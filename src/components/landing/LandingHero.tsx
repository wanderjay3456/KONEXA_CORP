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
import "./landing-v3.css";

interface LandingHeroProps {
    onEnterApp: (role: UserRole) => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const LINE_STAGGER = 0.08;

/** There is no public Terms or Privacy page yet. Until one ships, these open an
 * email request instead of pointing at a page that does not exist. */
const legalHref = (subject: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
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
    return <span className="lv3-wordmark" aria-label="KONEXA">KONE<b>X</b>A</span>;
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
    <AnimatePresence mode="wait">
      {activeRegisterRole ? <motion.div key="registration" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="konexa-light min-h-screen overflow-x-clip text-[#17342d] selection:bg-[#b9f4d0] selection:text-[#17342d]">
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

          <section className="lv3-section lv3-pilot" aria-labelledby="pilot-title"><div className="lv3-wrap">
            <h2 id="pilot-title" className="lv3-h2">{t.pilot.title}</h2>
            <p className="lv3-pilot-intro">{t.pilot.intro}</p>
            <dl className="lv3-responsibilities">{t.pilot.roles.map(role => <div key={role.name}><dt>{role.name}</dt><dd>{role.body}</dd></div>)}</dl>
            <p className="lv3-pilot-limit">{t.pilot.participation}</p>
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
              <a href={legalHref("KONEXA Terms of Service request")} title={t.footer.legalRequest}>{t.footer.terms}</a>
              <a href={legalHref("KONEXA Privacy Policy request")} title={t.footer.legalRequest}>{t.footer.privacy}</a>
              <a href="/status">{t.footer.status}</a>
            </nav>
            <p>© {new Date().getFullYear()} {t.footer.rights}</p>
          </div>
        </footer>

        <div className="lv3-mobile-cta">
          <a href={consultationHref(locale)} className="lv3-btn lv3-btn-primary">{t.mobileCta}<ArrowRight aria-hidden="true"/></a>
        </div>
      </motion.div>}
    </AnimatePresence>
    <div className="konexa-light relative z-[60] text-[#17342d] selection:bg-[#b9f4d0] selection:text-[#17342d]">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} onSwitchToRegister={(role) => { setIsAuthModalOpen(false); openRegistration(role); }}/>
    </div>
  </div>;
}
