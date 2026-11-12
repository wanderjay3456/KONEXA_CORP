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
import { type LandingPhoto, landingPhotos, photoSrcSet } from "./landingPhotos";
import "./landing-v3.css";

interface LandingHeroProps {
    onEnterApp: (role: UserRole) => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const LINE_STAGGER = 0.15;

/** There is no public Terms or Privacy page yet. Until one ships, these open an
 * email request instead of pointing at a page that does not exist. */
const legalHref = (subject: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

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

function Headline({ lines }: { lines: Fragment[][] }) {
    const reduced = useReducedMotion();
    return <h1 className="lv3-h1">
      {lines.map((line, index) => <React.Fragment key={index}>
        {index > 0 && " "}
        <span className={`lv3-line${line.some((part) => part.strong) ? " lv3-line-strong" : ""}`}>
          <motion.span className="lv3-line-in" initial={reduced ? false : { y: "115%" }} animate={{ y: 0 }} transition={{ duration: 0.8, delay: 0.1 + index * LINE_STAGGER, ease: EASE }}>
            {line.map((part) => part.text).join("")}
          </motion.span>
        </span>
      </React.Fragment>)}
    </h1>;
}

function Rise({ children, className, delay }: { children: React.ReactNode; className?: string; delay: number }) {
    const reduced = useReducedMotion();
    return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease: EASE }}>{children}</motion.div>;
}

function FragmentText({ parts }: { parts: Fragment[] }) {
    return <>{parts.map((part) => part.strong ? <strong key={part.text}>{part.text}</strong> : <React.Fragment key={part.text}>{part.text}</React.Fragment>)}</>;
}

/** What is actually running today, stated once and without motion. */
function StatusStrip({ copy }: { copy: LandingCopy["status"] }) {
    return <section className="lv3-status" aria-label={copy.label}>
      <div className="lv3-wrap lv3-status-row">
        <p className="lv3-status-title">{copy.label}</p>
        <ul className="lv3-status-list">
          {copy.items.map((item) => <li key={item.label} className="lv3-status-item">
            {item.label}
            <span className="lv3-status-state"><span className={`lv3-dot${item.live ? "" : " lv3-dot-off"}`} aria-hidden="true"/>{item.state}</span>
          </li>)}
        </ul>
      </div>
    </section>;
}

function PhotoPanel({ id, tone, tag, title, cta, onClick, photo, locale }: {
    id?: string;
    tone: "company" | "talent";
    tag: string;
    title: string;
    cta: string;
    onClick: () => void;
    photo?: LandingPhoto;
    locale: Locale;
}) {
    return <article id={id} className={`lv3-panel lv3-panel-${tone}${photo ? " lv3-panel-photo" : ""}`}>
      {photo && <>
        <img className="lv3-photo" src={photo.src} srcSet={photoSrcSet(photo)} sizes="(min-width: 800px) 50vw, 100vw" width={photo.width} height={photo.height} alt={photo.alt[locale]} loading="lazy" decoding="async"/>
        <div className="lv3-scrim" aria-hidden="true"/>
      </>}
      <p className="lv3-panel-tag">{tag}</p>
      <div className="lv3-panel-body">
        <h3>{title}</h3>
        <button type="button" onClick={onClick} className={`lv3-btn ${tone === "company" || photo ? "lv3-btn-primary" : "lv3-btn-dark"}`}>{cta}<ArrowRight aria-hidden="true"/></button>
      </div>
    </article>;
}

export default function LandingHero({ onEnterApp }: LandingHeroProps) {
    const { locale, setLocale } = useLocale();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => typeof window !== "undefined" && (location.hash.includes("type=recovery") || location.search.includes("type=recovery")));
    const [activeRegisterRole, setActiveRegisterRole] = useState<UserRole | null>(null);
    const t = landingCopy[locale];
    useLandingMeta(t.meta);
    useEffect(() => {
        // The forms replace the page, so a CTA far down it must not leave the form scrolled away.
        if (activeRegisterRole)
            window.scrollTo({ top: 0, behavior: "instant" });
    }, [activeRegisterRole]);
    const openCompany = () => setActiveRegisterRole(UserRole.COMPANY);
    const openTalent = () => setActiveRegisterRole(UserRole.STUDENT);
    const lines = t.hero.title.length;
    const afterTitle = 0.1 + lines * LINE_STAGGER + 0.2;

    return <div id="landing-master">
    <AnimatePresence mode="wait">
      {activeRegisterRole ? <motion.div key="registration" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="konexa-light min-h-screen overflow-x-clip text-[#17342d] selection:bg-[#b9f4d0] selection:text-[#17342d]">
        <motion.main data-no-translate className="min-h-screen bg-[#f7f6f1] text-neutral-900">
          {activeRegisterRole === UserRole.STUDENT
                ? <StudentRegisterForm onCancel={() => setActiveRegisterRole(null)} onSuccess={() => onEnterApp(UserRole.STUDENT)}/>
                : <CompanyRegisterForm onCancel={() => setActiveRegisterRole(null)} onSuccess={() => onEnterApp(UserRole.COMPANY)}/>}
        </motion.main>
      </motion.div> : <motion.div key="landing" className="lv3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <header className="lv3-top">
          <div className="lv3-wrap lv3-header">
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
              <button type="button" onClick={openCompany} className="lv3-btn lv3-btn-primary lv3-header-cta">{t.nav.post}</button>
            </div>
          </div>
        </header>

        <main>
          <section className="lv3-hero">
            <div className="lv3-wrap">
              <div className="lv3-hero-grid">
                <div className="lv3-hero-copy">
                  <Rise delay={0}><p className="lv3-eyebrow">{t.hero.eyebrow}</p></Rise>
                  <Headline lines={t.hero.title}/>
                  <Rise delay={afterTitle}><p className="lv3-lead">{t.hero.lead}</p></Rise>
                  <Rise delay={afterTitle + 0.12} className="lv3-cta-row">
                    <button type="button" onClick={openCompany} className="lv3-btn lv3-btn-primary">{t.hero.postCta}<ArrowRight aria-hidden="true"/></button>
                    <button type="button" onClick={openTalent} className="lv3-btn lv3-btn-ghost">{t.hero.talentCta}</button>
                  </Rise>
                  <Rise delay={afterTitle + 0.24}><p className="lv3-note">{t.hero.note}</p></Rise>
                </div>
                <LandingVisual copy={t.record} photo={landingPhotos.hero} locale={locale}/>
              </div>
            </div>
          </section>

          <StatusStrip copy={t.status}/>

          <section id="how" className="lv3-section lv3-how">
            <div className="lv3-wrap lv3-how-grid">
              <h2 className="lv3-h2">{t.how.title}</h2>
              <ol className="lv3-steps">
                {t.how.steps.map(([number, title, body]) => <li key={number} className="lv3-step">
                  <span className="lv3-step-number" aria-hidden="true">{number}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>)}
              </ol>
            </div>
          </section>

          <section className="lv3-section lv3-split">
            <div className="lv3-wrap lv3-split-grid">
              <PhotoPanel tone="company" tag={t.split.company.tag} title={t.split.company.title} cta={t.split.company.cta} onClick={openCompany} photo={landingPhotos.company} locale={locale}/>
              <PhotoPanel id="talent" tone="talent" tag={t.split.talent.tag} title={t.split.talent.title} cta={t.split.talent.cta} onClick={openTalent} photo={landingPhotos.talent} locale={locale}/>
            </div>
          </section>

          <section className="lv3-final">
            <div className="lv3-wrap lv3-final-grid">
              <h2 className="lv3-final-title"><FragmentText parts={t.final.title}/></h2>
              <div className="lv3-final-side">
                <p>{t.final.body}</p>
                <div className="lv3-cta-row">
                  <button type="button" onClick={openCompany} className="lv3-btn lv3-btn-primary">{t.final.post}<ArrowRight aria-hidden="true"/></button>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="lv3-btn lv3-btn-ghost">{t.final.email}</a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="lv3-footer">
          <div className="lv3-wrap">
            <div className="lv3-footer-top">
              <div className="lv3-footer-brand">
                <Wordmark />
                <p>{t.hero.title.map((line) => line.map((part) => part.text).join("")).join(" ")}</p>
              </div>
              <nav aria-label={t.nav.primary}>
                <a href="#how">{t.nav.how}</a>
                <a href="#talent">{t.nav.talent}</a>
                <a href="/status">{t.footer.status}</a>
              </nav>
              <div className="lv3-footer-contact">
                <p>{t.footer.contact}</p>
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </div>
            </div>
            <div className="lv3-footer-row">
              <nav aria-label={t.footer.legal}>
                <a href={legalHref("KONEXA Terms of Service request")} title={t.footer.legalRequest}>{t.footer.terms}</a>
                <a href={legalHref("KONEXA Privacy Policy request")} title={t.footer.legalRequest}>{t.footer.privacy}</a>
              </nav>
              <p>© {new Date().getFullYear()} {t.footer.rights}</p>
            </div>
          </div>
        </footer>

        <div className="lv3-mobile-cta">
          <button type="button" onClick={openCompany} className="lv3-btn lv3-btn-primary">{t.mobileCta}<ArrowRight aria-hidden="true"/></button>
        </div>
      </motion.div>}
    </AnimatePresence>
    <div className="konexa-light relative z-[60] text-[#17342d] selection:bg-[#b9f4d0] selection:text-[#17342d]">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} onSwitchToRegister={(role) => { setIsAuthModalOpen(false); setActiveRegisterRole(role); }}/>
    </div>
  </div>;
}
