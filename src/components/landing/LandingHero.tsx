import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  CircleDollarSign,
  FileSignature,
  Fingerprint,
  Globe2,
  LockKeyhole,
  LogIn,
  MessagesSquare,
  Orbit,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Workflow,
} from "lucide-react";
import { UserRole } from "../../types";
import AuthModal from "../auth/AuthModal";
import StudentRegisterForm from "../auth/StudentRegisterForm";
import CompanyRegisterForm from "../auth/CompanyRegisterForm";
import { db } from "../../config/supabase";
import { addDoc, collection } from "../../lib/supabaseStore";
import { useToast } from "../ui/Toast";

interface LandingHeroProps {
  onEnterApp: (role: UserRole) => void;
}

const TRUST_MODULES = [
  {
    icon: LockKeyhole,
    eyebrow: "CONTROLLED DISCLOSURE",
    title: "계약 전 연락처 보호",
    description: "프로젝트 신청과 기본계약이 완료되기 전까지 직접 식별 가능한 연락처를 단계적으로 가립니다.",
  },
  {
    icon: FileSignature,
    eyebrow: "VERIFIED AGREEMENT",
    title: "전자계약과 동의 기록",
    description: "회원가입, 소개 요청, 프로젝트 계약의 동의를 분리해 남기고 계약 이력을 관계 단위로 관리합니다.",
  },
  {
    icon: CircleDollarSign,
    eyebrow: "PAYMENT EVIDENCE",
    title: "PG 기반 결제 검증",
    description: "국내 PG·에스크로 계약 완료 후 결제기관의 검증 결과를 기준으로 정산 상태를 전환합니다.",
  },
  {
    icon: ScanSearch,
    eyebrow: "SCOPE TRACEABILITY",
    title: "마일스톤과 결과물 기록",
    description: "업무범위, 변경요청, 제출물, 검수 결과를 한 흐름에 남겨 프로젝트 분쟁 가능성을 낮춥니다.",
  },
  {
    icon: MessagesSquare,
    eyebrow: "SAFE COMMUNICATION",
    title: "이탈거래 예방 장치",
    description: "연락처·SNS 공유 시점과 반복 취소 패턴을 필요한 범위에서 점검하도록 설계했습니다.",
  },
  {
    icon: UserRoundCheck,
    eyebrow: "HIRING CONVERSION",
    title: "공식 채용 전환 경로",
    description: "숨길 이유를 줄이도록 채용 제안, 조건 협의, 수수료 견적, 비자 준비도 확인을 연결합니다.",
  },
] as const;

const FLOW = [
  { number: "01", label: "DISCOVER", title: "검증된 정보로 탐색", text: "연락처 대신 기술, 전공, 언어, 수행평가 중심으로 후보를 검토합니다." },
  { number: "02", label: "AGREE", title: "범위와 조건을 합의", text: "결과물, 주당 투입, 수정 횟수, 검수기간을 계약 전에 명확히 고정합니다." },
  { number: "03", label: "PROTECT", title: "계약과 결제를 확인", text: "양측 전자서명과 결제 검증이 충족된 뒤 필요한 정보와 프로젝트 권한을 엽니다." },
  { number: "04", label: "PROVE", title: "경력과 채용으로 전환", text: "완료된 기록은 Work Passport와 공식 채용 제안 흐름의 근거가 됩니다." },
] as const;

const OPERATING_GUARDS = [
  "월 프로젝트 비용 선결제 원칙",
  "결과물 중심 업무범위 관리",
  "최소권한·종료 즉시 접근 회수",
  "AI·오픈소스 사용내역 공개",
  "상호평가 이의신청 절차",
  "E-7 사전 적합성 검토 표기",
] as const;

const FAQ = [
  {
    question: "지금 실제 결제와 정산이 가능한가요?",
    answer: "결제 코드와 검증 구조는 국내 PG 연동을 기준으로 준비 중입니다. 실제 결제·에스크로 표시는 PG 가맹 심사, 운영 키 등록, 실결제 검증이 끝난 뒤에만 활성화됩니다.",
  },
  {
    question: "기업은 학생의 연락처를 언제 볼 수 있나요?",
    answer: "기본적으로 소개 요청, 양측 전자계약, 프로젝트 결제 확인 등 공개 조건을 충족한 관계에서만 필요한 범위의 연락처가 열립니다.",
  },
  {
    question: "AI 평가만으로 채용 여부가 결정되나요?",
    answer: "아닙니다. AI 결과는 보조 근거이며 프로젝트 기록, 결과물, 커뮤니케이션, 사람의 검토를 함께 사용합니다. 자동 점수만으로 최종 채용이나 비자 가능성을 보장하지 않습니다.",
  },
] as const;

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number; key?: React.Key }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingHero({ onEnterApp }: LandingHeroProps) {
  const reduceMotion = useReducedMotion();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(
    () => typeof window !== "undefined" && (window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery")),
  );
  const [activeRegisterRole, setActiveRegisterRole] = useState<UserRole | null>(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleWaitlistSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!waitlistEmail.trim()) return;
    setIsWaitlistSubmitting(true);
    try {
      await addDoc(collection(db, "waitlist"), { email: waitlistEmail.trim(), createdAt: Date.now() });
      setWaitlistEmail("");
      success("등록되었습니다", "KONEXA의 정식 공개 소식을 이메일로 알려드리겠습니다.");
    } catch (submissionError) {
      error("등록하지 못했습니다", submissionError instanceof Error ? submissionError.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

  const enterApp = (role: UserRole) => onEnterApp(role);

  return (
    <div id="landing-master" className="konexa-cinema min-h-screen overflow-hidden bg-[#050706] text-white selection:bg-[#b9ff66] selection:text-[#071006]">
      <AnimatePresence mode="wait">
        {activeRegisterRole ? (
          <motion.main
            key="registration"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className="relative z-20 min-h-screen bg-neutral-50 text-neutral-900"
          >
            {activeRegisterRole === UserRole.STUDENT ? (
              <StudentRegisterForm onCancel={() => setActiveRegisterRole(null)} onSuccess={() => enterApp(UserRole.STUDENT)} />
            ) : (
              <CompanyRegisterForm onCancel={() => setActiveRegisterRole(null)} onSuccess={() => enterApp(UserRole.COMPANY)} />
            )}
          </motion.main>
        ) : (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="cinema-noise" aria-hidden="true" />
            <div className="cinema-aurora cinema-aurora-one" aria-hidden="true" />
            <div className="cinema-aurora cinema-aurora-two" aria-hidden="true" />

            <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
              <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#070a08]/70 px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-xl sm:px-5" aria-label="주요 메뉴">
                <button className="flex items-center gap-3" onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })} aria-label="KONEXA 홈">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-[#b9ff66]/30 bg-[#b9ff66] font-display text-sm font-black text-[#071006] shadow-[0_0_24px_rgba(185,255,102,.16)]">K</span>
                  <span className="font-display text-sm font-bold tracking-[0.18em]">KONEXA</span>
                </button>
                <div className="hidden items-center gap-8 text-xs font-semibold text-white/55 md:flex">
                  <a href="#system" className="transition-colors hover:text-white">운영 구조</a>
                  <a href="#workflow" className="transition-colors hover:text-white">진행 방식</a>
                  <a href="#safety" className="transition-colors hover:text-white">보호 장치</a>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsAuthModalOpen(true)} className="hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/5 hover:text-white sm:flex">
                    <LogIn className="h-4 w-4" /> 로그인
                  </button>
                  <button onClick={() => setActiveRegisterRole(UserRole.STUDENT)} className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-[#b9ff66]">
                    시작하기
                  </button>
                </div>
              </nav>
            </header>

            <main>
              <section className="relative mx-auto flex min-h-[900px] max-w-[1500px] items-center px-5 pb-20 pt-32 sm:px-8 lg:min-h-screen lg:px-12">
                <div className="cinema-grid" aria-hidden="true" />
                <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
                  <div>
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7 }}
                      className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b9ff66]/20 bg-[#b9ff66]/8 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.16em] text-[#d8ff9e]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#b9ff66] shadow-[0_0_10px_#b9ff66]" />
                      VERIFIED PROJECT → TRUST → HIRING
                    </motion.div>
                    <motion.h1
                      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="max-w-4xl font-display text-[clamp(3.2rem,7vw,7.1rem)] font-semibold leading-[.91] tracking-[-0.065em]"
                    >
                      경력이 아니라,
                      <span className="mt-2 block bg-gradient-to-r from-[#b9ff66] via-[#7fffd4] to-[#81a7ff] bg-clip-text text-transparent">증명된 일로.</span>
                    </motion.h1>
                    <motion.p
                      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="mt-8 max-w-xl text-base leading-8 text-white/58 sm:text-lg"
                    >
                      한국 기업과 글로벌 학생 인재가 실제 프로젝트를 통해 역량을 검증하고, 계약·결제·채용 전환 기록을 하나의 신뢰 흐름으로 만드는 워크 플랫폼입니다.
                    </motion.p>
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="mt-10 flex flex-col gap-3 sm:flex-row"
                    >
                      <button onClick={() => setActiveRegisterRole(UserRole.STUDENT)} className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#b9ff66] px-6 text-sm font-black text-[#071006] shadow-[0_18px_50px_rgba(185,255,102,.15)] transition hover:-translate-y-0.5 hover:bg-white">
                        학생으로 프로젝트 시작 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
                      <button onClick={() => setActiveRegisterRole(UserRole.COMPANY)} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-6 text-sm font-bold text-white transition hover:border-white/25 hover:bg-white/9">
                        <Building2 className="h-4 w-4 text-[#7fffd4]" /> 기업 프로젝트 등록
                      </button>
                    </motion.div>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-5 flex items-center gap-2 text-xs text-white/35">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#b9ff66]" /> 국내 PG·에스크로는 가맹 심사와 실결제 검증 후 활성화됩니다.
                    </motion.p>
                  </div>

                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.94, rotateY: -8 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="relative mx-auto w-full max-w-[560px] [perspective:1200px]"
                  >
                    <div className="absolute -inset-12 rounded-full bg-[#33d6a6]/10 blur-[90px]" />
                    <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#0b0f0d]/88 p-3 shadow-[0_50px_120px_rgba(0,0,0,.6)] backdrop-blur-2xl sm:p-5">
                      <div className="flex items-center justify-between border-b border-white/8 px-2 pb-4">
                        <div className="flex items-center gap-2 font-mono text-[9px] tracking-[.15em] text-white/40"><Orbit className="h-3.5 w-3.5 text-[#7fffd4]" /> TRUST RELATIONSHIP / 08A7</div>
                        <span className="rounded-full bg-[#b9ff66]/10 px-2 py-1 text-[9px] font-bold text-[#d8ff9e]">LIVE WORKFLOW</span>
                      </div>
                      <div className="relative my-7 grid place-items-center py-8">
                        <motion.div animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 28, ease: "linear", repeat: Infinity }} className="absolute h-60 w-60 rounded-full border border-dashed border-[#7fffd4]/16" />
                        <motion.div animate={reduceMotion ? undefined : { rotate: -360 }} transition={{ duration: 20, ease: "linear", repeat: Infinity }} className="absolute h-44 w-44 rounded-full border border-[#b9ff66]/14" />
                        <div className="relative z-10 grid h-28 w-28 place-items-center rounded-full border border-[#b9ff66]/25 bg-gradient-to-br from-[#b9ff66]/14 to-[#7fffd4]/5 shadow-[0_0_50px_rgba(185,255,102,.12)]">
                          <div className="text-center"><Fingerprint className="mx-auto h-7 w-7 text-[#b9ff66]" /><div className="mt-2 font-mono text-[9px] font-bold tracking-[.12em] text-white/70">VERIFIED</div></div>
                        </div>
                        <div className="absolute left-3 top-4 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[10px] text-white/55 backdrop-blur"><span className="mr-2 text-[#7fffd4]">01</span>PROFILE</div>
                        <div className="absolute bottom-3 right-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[10px] text-white/55 backdrop-blur"><span className="mr-2 text-[#b9ff66]">04</span>WORK PASSPORT</div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {[
                          ["CONTACT", "LOCKED", LockKeyhole],
                          ["CONTRACT", "2-SIGN", FileSignature],
                          ["PAYMENT", "PG SETUP", CircleDollarSign],
                        ].map(([label, value, Icon]) => (
                          <div key={String(label)} className="rounded-2xl border border-white/8 bg-white/[.035] p-3.5">
                            <Icon className="mb-4 h-4 w-4 text-[#7fffd4]" />
                            <div className="font-mono text-[8px] tracking-[.14em] text-white/30">{label as string}</div>
                            <div className="mt-1 text-xs font-bold text-white/80">{value as string}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-3 font-mono text-[9px] tracking-[.22em] text-white/25 lg:flex"><span className="h-px w-10 bg-white/15" /> SCROLL TO TRACE THE SYSTEM <span className="h-px w-10 bg-white/15" /></div>
              </section>

              <section id="system" className="relative border-y border-white/8 bg-white/[.018] px-5 py-24 sm:px-8 lg:py-32">
                <div className="mx-auto max-w-7xl">
                  <Reveal className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
                    <div className="font-mono text-[10px] font-bold tracking-[.2em] text-[#b9ff66]">01 / TRUST INFRASTRUCTURE</div>
                    <div>
                      <h2 className="font-display text-4xl font-semibold leading-[1.04] tracking-[-.045em] sm:text-6xl">소개부터 채용까지,<br /><span className="text-white/38">신뢰가 끊기지 않도록.</span></h2>
                      <p className="mt-6 max-w-2xl leading-7 text-white/48">단순 매칭 목록이 아니라 누가, 언제, 무엇에 동의했고 어떤 결과를 만들었는지 증명할 수 있는 운영 구조를 설계합니다.</p>
                    </div>
                  </Reveal>
                  <div className="mt-16 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {TRUST_MODULES.map((module, index) => (
                      <Reveal key={module.title} delay={index * 0.05} className="group min-h-[270px] rounded-[1.65rem] border border-white/9 bg-gradient-to-b from-white/[.055] to-white/[.018] p-6 transition duration-500 hover:-translate-y-1 hover:border-[#b9ff66]/25 hover:bg-white/[.065]">
                        <div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-black/25"><module.icon className="h-5 w-5 text-[#7fffd4]" /></span><span className="font-mono text-[9px] text-white/18">0{index + 1}</span></div>
                        <div className="mt-10 font-mono text-[9px] font-bold tracking-[.16em] text-[#b9ff66]/70">{module.eyebrow}</div>
                        <h3 className="mt-2 font-display text-xl font-semibold tracking-[-.025em]">{module.title}</h3>
                        <p className="mt-3 text-sm leading-6 text-white/42">{module.description}</p>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </section>

              <section id="workflow" className="relative px-5 py-24 sm:px-8 lg:py-36">
                <div className="mx-auto max-w-7xl">
                  <Reveal className="max-w-3xl"><div className="font-mono text-[10px] font-bold tracking-[.2em] text-[#7fffd4]">02 / ONE RELATIONSHIP, ONE LEDGER</div><h2 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-.045em] sm:text-6xl">일의 흐름 자체가<br />검증 가능한 경력이 됩니다.</h2></Reveal>
                  <div className="relative mt-16">
                    <div className="absolute left-[19px] top-0 h-full w-px bg-gradient-to-b from-[#b9ff66] via-[#7fffd4]/40 to-transparent md:left-0 md:top-[23px] md:h-px md:w-full" />
                    <div className="grid gap-10 md:grid-cols-4 md:gap-6">
                      {FLOW.map((step, index) => (
                        <Reveal key={step.number} delay={index * 0.08} className="relative pl-14 md:pl-0 md:pt-14">
                          <span className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full border border-[#b9ff66]/35 bg-[#071006] font-mono text-[9px] font-bold text-[#d8ff9e] md:-top-5">{step.number}</span>
                          <div className="font-mono text-[9px] font-bold tracking-[.18em] text-white/28">{step.label}</div>
                          <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
                          <p className="mt-3 text-sm leading-6 text-white/42">{step.text}</p>
                        </Reveal>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section id="safety" className="px-5 pb-24 sm:px-8 lg:pb-36">
                <Reveal className="mx-auto grid max-w-7xl overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0b100d] lg:grid-cols-[1.05fr_.95fr]">
                  <div className="relative p-7 sm:p-10 lg:p-14">
                    <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#b9ff66]/8 blur-[80px]" />
                    <div className="relative"><div className="font-mono text-[10px] font-bold tracking-[.2em] text-[#b9ff66]">03 / OPERATING GUARDRAILS</div><h2 className="mt-6 max-w-xl font-display text-4xl font-semibold leading-[1.05] tracking-[-.045em] sm:text-5xl">좋은 매칭보다 먼저,<br />안전한 운영을 설계합니다.</h2><p className="mt-6 max-w-xl text-sm leading-7 text-white/46">대금 미지급, 범위 확장, 정보 유출, 조기 이탈처럼 실제 프로젝트에서 더 자주 발생하는 위험을 운영 규칙과 시스템 기록으로 줄입니다.</p></div>
                  </div>
                  <div className="border-t border-white/8 bg-black/20 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
                    <div className="space-y-3">{OPERATING_GUARDS.map((guard, index) => <div key={guard} className="flex items-center gap-4 rounded-2xl border border-white/7 bg-white/[.025] px-4 py-3.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#b9ff66]/10 font-mono text-[9px] text-[#b9ff66]">{String(index + 1).padStart(2, "0")}</span><span className="text-sm text-white/66">{guard}</span><Check className="ml-auto h-4 w-4 text-[#7fffd4]/60" /></div>)}</div>
                  </div>
                </Reveal>
              </section>

              <section className="border-y border-white/8 bg-white/[.018] px-5 py-24 sm:px-8">
                <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr]">
                  <Reveal><div className="font-mono text-[10px] font-bold tracking-[.2em] text-[#7fffd4]">04 / CLEAR ANSWERS</div><h2 className="mt-6 font-display text-4xl font-semibold tracking-[-.045em] sm:text-5xl">출시 상태를<br />과장하지 않습니다.</h2><p className="mt-5 max-w-md text-sm leading-7 text-white/42">KONEXA는 구현된 기능과 외부 심사 완료가 필요한 기능을 명확히 구분해 안내합니다.</p></Reveal>
                  <div className="space-y-3">{FAQ.map((item, index) => <Reveal key={item.question} delay={index * 0.05}><div className="overflow-hidden rounded-2xl border border-white/9 bg-white/[.025]"><button className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-bold sm:p-6" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}>{item.question}<ChevronDown className={`h-4 w-4 shrink-0 text-white/35 transition-transform ${openFaq === index ? "rotate-180" : ""}`} /></button><AnimatePresence initial={false}>{openFaq === index && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p className="border-t border-white/7 px-5 py-5 text-sm leading-7 text-white/44 sm:px-6">{item.answer}</p></motion.div>}</AnimatePresence></div></Reveal>)}</div>
                </div>
              </section>

              <section className="relative px-5 py-28 text-center sm:px-8 lg:py-40">
                <div className="absolute left-1/2 top-1/2 h-80 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#33d6a6]/8 blur-[110px]" />
                <Reveal className="relative mx-auto max-w-3xl"><Sparkles className="mx-auto h-6 w-6 text-[#b9ff66]" /><h2 className="mt-7 font-display text-4xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-6xl">프로젝트가 경력이 되고,<br />경력이 채용으로 이어지도록.</h2><p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/45">학생과 기업 중 현재 역할을 선택해 KONEXA의 검증형 워크플로우를 시작하세요.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => setActiveRegisterRole(UserRole.STUDENT)} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#b9ff66] px-7 text-sm font-black text-[#071006] transition hover:bg-white">학생 계정 만들기 <ArrowRight className="h-4 w-4" /></button><button onClick={() => setActiveRegisterRole(UserRole.COMPANY)} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-7 text-sm font-bold transition hover:bg-white/10"><BriefcaseBusiness className="h-4 w-4" /> 기업 계정 만들기</button></div></Reveal>
              </section>

              <section className="border-t border-white/8 px-5 py-16 sm:px-8">
                <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-white/9 bg-white/[.025] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div><div className="flex items-center gap-2 font-mono text-[9px] font-bold tracking-[.18em] text-[#7fffd4]"><Globe2 className="h-4 w-4" /> PRIVATE BETA UPDATE</div><h2 className="mt-3 font-display text-2xl font-semibold">정식 공개 알림 받기</h2><p className="mt-2 text-sm text-white/38">베타 운영과 PG 연동 검증이 완료되면 등록한 이메일로 알려드립니다.</p></div>
                  <form onSubmit={handleWaitlistSubmit} className="flex w-full flex-col gap-2 sm:flex-row lg:w-[430px]"><label className="sr-only" htmlFor="waitlist-email">이메일</label><input id="waitlist-email" type="email" required value={waitlistEmail} onChange={(event) => setWaitlistEmail(event.target.value)} placeholder="name@company.com" className="h-13 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none transition placeholder:text-white/22 focus:border-[#b9ff66]/45" /><button disabled={isWaitlistSubmitting} className="h-13 rounded-xl bg-white px-5 text-sm font-black text-black transition hover:bg-[#b9ff66] disabled:opacity-50">{isWaitlistSubmitting ? "등록 중…" : "알림 신청"}</button></form>
                </div>
              </section>
            </main>

            <footer className="border-t border-white/8 px-5 py-10 text-xs text-white/30 sm:px-8">
              <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#b9ff66] font-display font-black text-black">K</span><span className="font-display font-bold tracking-[.16em] text-white/75">KONEXA</span></div><p>검증된 프로젝트 기록을 연결하는 글로벌 워크 플랫폼</p><div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#7fffd4]" /> BETA / EXTERNAL PROVIDER REVIEW PENDING</div></div>
            </footer>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => enterApp(UserRole.STUDENT)} onSwitchToRegister={setActiveRegisterRole} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
