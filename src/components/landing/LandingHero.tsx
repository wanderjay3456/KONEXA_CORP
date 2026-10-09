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
    const ref = usePauseOffscreen<HTMLElement>();
    const set = (hidden: boolean) => <ul className="lv3-ticker-set" aria-hidden={hidden || undefined}>
      {copy.items.map((item) => <li key={item.label} className="lv3-ticker-item">
        <span className={`lv3-dot${item.live ? "" : " lv3-dot-off"}`} aria-hidden="true"/>
        <span>{item.label}</span><span className="lv3-ticker-state">— {item.state}</span>
      </li>)}
      {copy.notes.map((note) => <li key={note} className="lv3-ticker-item lv3-ticker-note">{note}</li>)}
    </ul>;
    return <section ref={ref} className="lv3-ticker" aria-label={copy.label}>
      <div className="lv3-ticker-track">{set(false)}{set(true)}</div>
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
    const ref = usePauseOffscreen<HTMLElement>();
    return <article ref={ref} id={id} className={`lv3-panel lv3-panel-${tone}`}>
      {photo && <img className="lv3-photo" src={photo.src1600} srcSet={`${photo.src800} 800w, ${photo.src1600} 1600w`} sizes="(min-width: 800px) 50vw, 100vw" width={photo.width} height={photo.height} alt={photo.alt[locale]} loading="lazy" decoding="async"/>}
      <div className="lv3-scrim" aria-hidden="true"/>
      <span className="lv3-panel-tag">{tag}</span>
      <div className="lv3-panel-body">
        <h3>{title}</h3>
        <button type="button" onClick={onClick} className="lv3-btn lv3-btn-primary">{cta}<ArrowRight aria-hidden="true"/></button>
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
                  <button type="button" onClick={openCompany} className="lv3-btn lv3-btn-primary lv3-header-cta">{t.nav.post}</button>
                </div>
              </header>

              <div className="lv3-hero-grid">
                <div className="lv3-hero-copy">
                  <Rise delay={0} className="lv3-pill-row"><span className="lv3-pill"><i aria-hidden="true"/>{t.hero.pill}</span></Rise>
                  <Headline lines={t.hero.title}/>
                  <Rise delay={afterTitle}><p className="lv3-lead">{t.hero.lead}</p></Rise>
                  <Rise delay={afterTitle + 0.12} className="lv3-cta-row">
                    <button type="button" onClick={openCompany} className="lv3-btn lv3-btn-primary">{t.hero.postCta}<ArrowRight aria-hidden="true"/></button>
                    <button type="button" onClick={openTalent} className="lv3-btn lv3-btn-ghost">{t.hero.talentCta}</button>
                  </Rise>
                  <Rise delay={afterTitle + 0.24}><p className="lv3-note">{t.hero.note}</p></Rise>
                </div>
                <LandingVisual copy={t.record}/>
              </div>
            </div>
          </section>

          <Ticker copy={t.ticker}/>

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
              <Reveal><PhotoPanel tone="company" tag={t.split.company.tag} title={t.split.company.title} cta={t.split.company.cta} onClick={openCompany} photo={landingPhotos.company} locale={locale}/></Reveal>
              <Reveal delay={0.1}><PhotoPanel id="talent" tone="talent" tag={t.split.talent.tag} title={t.split.talent.title} cta={t.split.talent.cta} onClick={openTalent} photo={landingPhotos.talent} locale={locale}/></Reveal>
            </div>
          </section>

          <section className="lv3-final">
            <div className="lv3-wrap">
              <Reveal className="lv3-final-inner">
                <h2 className="lv3-final-title"><FragmentText parts={t.final.title}/></h2>
                <p>{t.final.body}</p>
                <div className="lv3-cta-row lv3-cta-center">
                  <button type="button" onClick={openCompany} className="lv3-btn lv3-btn-primary">{t.final.post}<ArrowRight aria-hidden="true"/></button>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="lv3-btn lv3-btn-ghost">{t.final.email}</a>
                </div>
              </Reveal>
            </div>
          </section>
        </main>

        <footer className="lv3-footer">
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
          <button type="button" onClick={openCompany} className="lv3-btn lv3-btn-primary">{t.mobileCta}<ArrowRight aria-hidden="true"/></button>
        </div>
      </motion.div>}
    </AnimatePresence>
    <div className="konexa-light relative z-[60] text-[#17342d] selection:bg-[#b9f4d0] selection:text-[#17342d]">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} onSwitchToRegister={(role) => { setIsAuthModalOpen(false); setActiveRegisterRole(role); }}/>
    </div>
  </div>;
}
