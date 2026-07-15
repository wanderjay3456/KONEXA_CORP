import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import {
  ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, Check, ChevronDown,
  CircleDollarSign, FileSignature, Globe2, LockKeyhole, LogIn, ShieldCheck,
  Sparkles, Star, UserRoundCheck,
} from "lucide-react";
import { UserRole } from "../../types";
import AuthModal from "../auth/AuthModal";
import StudentRegisterForm from "../auth/StudentRegisterForm";
import CompanyRegisterForm from "../auth/CompanyRegisterForm";
import { db } from "../../config/supabase";
import { addDoc, collection } from "../../lib/supabaseStore";
import { useToast } from "../ui/Toast";

interface LandingHeroProps { onEnterApp: (role: UserRole) => void }
type Locale = "ko" | "en" | "vi";

const copy = {
  ko: {
    nav: ["운영 구조", "진행 방식", "상호 리뷰"], login: "로그인", start: "시작하기",
    badge: "한국 기업 × 글로벌 인재를 위한 신뢰 인프라",
    title: <>실제 프로젝트가<br/><em>다음 커리어를 증명합니다.</em></>,
    lead: "KONEXA는 기업과 글로벌 학생이 실제 결과물을 함께 만들고, 계약·결제·평가 기록을 검증 가능한 경력으로 연결하는 프로젝트 플랫폼입니다.",
    studentCta: "학생으로 프로젝트 시작", companyCta: "기업 프로젝트 등록",
    note: "연락처는 계약·양측 서명·PG 대금 확보 전까지 보호됩니다.",
    ledger: "PROJECT TRUST TRAIL", live: "VERIFIED FLOW", candidate: "글로벌 제품 디자이너",
    stages: [["프로필", "보호됨"], ["계약", "양측 서명"], ["결제", "PG 검증"], ["리뷰", "상호 봉인"]],
    ribbon: ["검증된 업무 범위", "연락처 보호", "상호 봉인 리뷰", "공식 채용 전환"],
    systemEyebrow: "TRUST, BY DESIGN", systemTitle: "좋은 매칭보다 중요한 건,\n좋은 협업이 남는 방식입니다.",
    systemLead: "누구를 만났는지만 보여주지 않습니다. 무엇에 합의했고, 어떻게 일했고, 어떤 결과를 만들었는지 거래의 전 과정을 기록합니다.",
    modules: [
      ["01", "연락처 단계별 공개", "기본계약과 결제 검증 전에는 개인 이메일·전화번호·SNS를 숨겨 무단 접촉을 줄입니다."],
      ["02", "명확한 범위와 계약", "결과물·수정 횟수·검수 기간·추가 업무를 계약 전에 고정하고 전자서명 이력을 남깁니다."],
      ["03", "국내 PG 결제 검증", "KONEXA가 자금을 직접 보관하지 않고 등록 PG·에스크로의 결제 상태를 기준으로 진행합니다."],
      ["04", "경력과 채용 전환", "완료 프로젝트는 Work Passport에 반영되고, 기업은 플랫폼 안에서 공식 채용을 제안할 수 있습니다."],
    ],
    flowEyebrow: "A CLEAR WAY TO WORK", flowTitle: "복잡한 국경 간 협업을\n네 단계로 단순하게.",
    flow: [["01", "찾기", "검증된 기술·전공·언어·수행평가로 후보를 탐색합니다."], ["02", "합의하기", "업무 범위와 주급, 결과물, 검수 기준을 계약에 담습니다."], ["03", "안전하게 실행", "PG 결제 확인 후 협업을 시작하고 마일스톤을 기록합니다."], ["04", "증명하기", "양측 리뷰와 결과물이 경력 및 채용 전환의 근거가 됩니다."]],
    reviewEyebrow: "MUTUAL REVIEW", reviewTitle: "먼저 쓴 사람이\n불리하지 않은 리뷰.",
    reviewLead: "기업과 학생의 평가는 서로 봉인됩니다. 양쪽이 모두 제출한 뒤 동시에 공개되며, 검증된 결제 관계에서만 작성할 수 있습니다.",
    companyReview: "업무 범위가 명확했고 피드백이 빨랐어요.", studentReview: "기대보다 완성도가 높고 소통이 안정적이었어요.", sealed: "상대방 제출 전까지 봉인", revealed: "양측 제출 후 동시 공개",
    safeguards: ["검증 거래만 작성", "종료 전 상대 평가 비공개", "관리자 이의신청", "차별·보복 리뷰 제한"],
    ctaTitle: "국경이 아니라, 실력으로 연결하세요.", ctaLead: "기업에는 검증된 실행력을, 학생에게는 증명 가능한 첫 경력을 만듭니다.",
    email: "업데이트를 받을 이메일", join: "소식 받기", success: "등록되었습니다", successBody: "KONEXA 공개 소식을 이메일로 알려드릴게요.", error: "등록하지 못했습니다",
    faqTitle: "자주 묻는 질문", faq: [
      ["실제 결제와 정산이 가능한가요?", "국내 PG·에스크로 연동을 기준으로 준비 중입니다. 가맹점 계약과 운영 요건이 완료된 기능만 실결제로 활성화합니다."],
      ["연락처는 언제 공개되나요?", "기본계약, 양측 서명, 등록 PG의 대금 확보가 확인된 관계에서 필요한 범위만 공개됩니다."],
      ["리뷰는 서로 볼 수 있나요?", "한쪽이 먼저 제출해도 상대에게 보이지 않습니다. 양측 제출이 끝나면 동시에 공개되며 이의신청 절차를 제공합니다."],
    ],
    footer: "검증된 프로젝트가 국경을 넘어 커리어가 되는 곳.", rights: "KONEXA. All rights reserved.",
  },
  en: {
    nav: ["Trust system", "How it works", "Mutual reviews"], login: "Log in", start: "Get started",
    badge: "Trust infrastructure for Korean teams and global talent",
    title: <>Real work proves<br/><em>what comes next.</em></>,
    lead: "KONEXA connects Korean companies with global students through real projects—and turns contracts, payments and outcomes into verified career evidence.",
    studentCta: "Start as talent", companyCta: "Post a company project",
    note: "Contact details stay protected until contract, signatures and PG payment verification are complete.",
    ledger: "PROJECT TRUST TRAIL", live: "VERIFIED FLOW", candidate: "Global product designer",
    stages: [["Profile", "Protected"], ["Contract", "Two-signed"], ["Payment", "PG verified"], ["Review", "Double-blind"]],
    ribbon: ["Verified scope", "Protected contact", "Mutual reviews", "Direct hiring path"],
    systemEyebrow: "TRUST, BY DESIGN", systemTitle: "A great match matters.\nA trustworthy trail matters more.",
    systemLead: "We go beyond introductions. Every agreement, milestone, payment and outcome becomes part of a clear operating record.",
    modules: [
      ["01", "Progressive contact access", "Personal email, phone and social details stay hidden until the contract and payment gates are met."],
      ["02", "Scope before work", "Deliverables, revisions, review periods and change requests are fixed before execution and signed electronically."],
      ["03", "Domestic PG verification", "Funds are handled through a registered Korean PG or escrow provider—not held directly by KONEXA."],
      ["04", "From proof to hiring", "Completed work builds a Work Passport and gives companies a compliant path to make a direct offer."],
    ],
    flowEyebrow: "A CLEAR WAY TO WORK", flowTitle: "Cross-border collaboration,\nmade clear in four steps.",
    flow: [["01", "Discover", "Search by verified skills, study, language and performance."], ["02", "Agree", "Set weekly pay, scope, deliverables and review terms."], ["03", "Work safely", "Begin after payment verification and trace every milestone."], ["04", "Prove it", "Mutual reviews and outcomes become evidence for the next role."]],
    reviewEyebrow: "MUTUAL REVIEW", reviewTitle: "A review system that\ndoesn't punish honesty.",
    reviewLead: "Company and talent reviews stay sealed. They are revealed simultaneously only after both sides submit, and only for verified paid relationships.",
    companyReview: "The scope was clear and feedback arrived quickly.", studentReview: "The quality exceeded expectations and communication stayed reliable.", sealed: "Sealed until the other side submits", revealed: "Revealed together after both submit",
    safeguards: ["Verified transactions only", "Hidden before both submit", "Admin appeal route", "Anti-bias moderation"],
    ctaTitle: "Connect by capability, not borders.", ctaLead: "Verified execution for companies. Career proof for global talent.",
    email: "Email for launch updates", join: "Keep me posted", success: "You're on the list", successBody: "We'll send KONEXA launch updates to your inbox.", error: "Could not subscribe",
    faqTitle: "Common questions", faq: [
      ["Are real payments supported?", "The product is being prepared around a registered Korean PG and escrow provider. Real payments activate only after merchant and operational requirements are complete."],
      ["When are contact details revealed?", "Only the necessary details are revealed after the base contract, both signatures and verified payment protection are complete."],
      ["Can the other side see my review?", "Not before they submit theirs. Both reviews are revealed at the same time, with an appeal path for contested content."],
    ],
    footer: "Where verified projects become borderless careers.", rights: "KONEXA. All rights reserved.",
  },
  vi: {
    nav: ["Cơ chế tin cậy", "Quy trình", "Đánh giá hai chiều"], login: "Đăng nhập", start: "Bắt đầu",
    badge: "Hạ tầng tin cậy cho doanh nghiệp Hàn Quốc và nhân tài toàn cầu",
    title: <>Dự án thực chứng minh<br/><em>bước tiến tiếp theo.</em></>,
    lead: "KONEXA kết nối doanh nghiệp Hàn Quốc với sinh viên quốc tế qua dự án thật, biến hợp đồng, thanh toán và kết quả thành hồ sơ nghề nghiệp được xác minh.",
    studentCta: "Bắt đầu với vai trò sinh viên", companyCta: "Đăng dự án doanh nghiệp",
    note: "Thông tin liên hệ được bảo vệ cho đến khi hoàn tất hợp đồng, chữ ký hai bên và xác minh thanh toán PG.",
    ledger: "HỒ SƠ TIN CẬY DỰ ÁN", live: "QUY TRÌNH XÁC MINH", candidate: "Nhà thiết kế sản phẩm toàn cầu",
    stages: [["Hồ sơ", "Được bảo vệ"], ["Hợp đồng", "Hai bên ký"], ["Thanh toán", "PG xác minh"], ["Đánh giá", "Niêm phong hai chiều"]],
    ribbon: ["Phạm vi xác minh", "Bảo vệ liên hệ", "Đánh giá hai chiều", "Lộ trình tuyển dụng"],
    systemEyebrow: "TIN CẬY TỪ THIẾT KẾ", systemTitle: "Ghép đúng người là quan trọng.\nDấu vết hợp tác còn quan trọng hơn.",
    systemLead: "Không chỉ giới thiệu. Mọi thỏa thuận, cột mốc, thanh toán và kết quả đều được lưu thành hồ sơ vận hành rõ ràng.",
    modules: [
      ["01", "Mở liên hệ theo từng bước", "Email, số điện thoại và mạng xã hội được ẩn đến khi đủ điều kiện hợp đồng và thanh toán."],
      ["02", "Chốt phạm vi trước", "Sản phẩm bàn giao, số lần sửa, thời gian duyệt và yêu cầu phát sinh được ký trước khi làm."],
      ["03", "Xác minh PG tại Hàn Quốc", "Tiền đi qua nhà cung cấp PG hoặc ký quỹ được cấp phép, không do KONEXA trực tiếp giữ."],
      ["04", "Từ minh chứng đến tuyển dụng", "Dự án hoàn thành xây dựng Work Passport và mở lộ trình đề nghị tuyển dụng chính thức."],
    ],
    flowEyebrow: "QUY TRÌNH RÕ RÀNG", flowTitle: "Hợp tác xuyên biên giới,\nrõ ràng trong bốn bước.",
    flow: [["01", "Khám phá", "Tìm theo kỹ năng, ngành học, ngôn ngữ và kết quả đã xác minh."], ["02", "Thỏa thuận", "Chốt thù lao tuần, phạm vi, sản phẩm và tiêu chí duyệt."], ["03", "Làm việc an toàn", "Bắt đầu sau xác minh thanh toán và ghi lại từng cột mốc."], ["04", "Chứng minh", "Đánh giá hai chiều và kết quả tạo bằng chứng cho cơ hội tiếp theo."]],
    reviewEyebrow: "ĐÁNH GIÁ HAI CHIỀU", reviewTitle: "Trung thực mà không\nsợ bất lợi.",
    reviewLead: "Đánh giá của doanh nghiệp và sinh viên được niêm phong, chỉ mở đồng thời sau khi cả hai bên gửi và chỉ áp dụng cho giao dịch đã xác minh.",
    companyReview: "Phạm vi rõ ràng và phản hồi rất nhanh.", studentReview: "Chất lượng vượt kỳ vọng, giao tiếp ổn định.", sealed: "Niêm phong đến khi bên kia gửi", revealed: "Mở đồng thời sau khi cả hai gửi",
    safeguards: ["Chỉ giao dịch xác minh", "Ẩn trước khi đủ hai bên", "Có quy trình khiếu nại", "Kiểm duyệt chống thiên vị"],
    ctaTitle: "Kết nối bằng năng lực, không phải biên giới.", ctaLead: "Năng lực đã xác minh cho doanh nghiệp. Minh chứng nghề nghiệp cho sinh viên.",
    email: "Email nhận tin ra mắt", join: "Nhận thông tin", success: "Đã đăng ký", successBody: "Chúng tôi sẽ gửi tin ra mắt KONEXA qua email.", error: "Không thể đăng ký",
    faqTitle: "Câu hỏi thường gặp", faq: [
      ["Có hỗ trợ thanh toán thật không?", "Sản phẩm đang được chuẩn bị với PG và dịch vụ ký quỹ được cấp phép tại Hàn Quốc. Chỉ kích hoạt sau khi hoàn tất yêu cầu vận hành."],
      ["Khi nào thông tin liên hệ được mở?", "Chỉ thông tin cần thiết được mở sau hợp đồng cơ bản, chữ ký hai bên và xác minh bảo vệ thanh toán."],
      ["Bên kia có thấy đánh giá của tôi không?", "Không, cho đến khi họ cũng gửi. Hai đánh giá được mở cùng lúc và có quy trình khiếu nại."],
    ],
    footer: "Nơi dự án được xác minh trở thành sự nghiệp không biên giới.", rights: "KONEXA. Bảo lưu mọi quyền.",
  },
} as const;

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number; key?: React.Key }) {
  const reduced = useReducedMotion();
  return <motion.div initial={reduced ? false : { opacity: 0, y: 28 }} whileInView={reduced ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .16 }} transition={{ duration: .72, delay, ease: [.22, 1, .36, 1] }} className={className}>{children}</motion.div>;
}

function Wordmark() {
  return <span className="konexa-wordmark" aria-label="KONEXA"><span>KONE</span><span className="wordmark-x">X</span><span>A</span></span>;
}

export default function LandingHero({ onEnterApp }: LandingHeroProps) {
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const pageProgress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.25 });
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroCopyY = useTransform(heroProgress, [0, 1], [0, reduced ? 0 : 110]);
  const heroCopyOpacity = useTransform(heroProgress, [0, 0.74], [1, reduced ? 1 : 0.2]);
  const heroVisualY = useTransform(heroProgress, [0, 1], [0, reduced ? 0 : -80]);
  const heroVisualRotate = useTransform(heroProgress, [0, 1], [0, reduced ? 0 : -4]);
  const heroVisualScale = useTransform(heroProgress, [0, 1], [1, reduced ? 1 : 0.92]);
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "ko";
    const saved = localStorage.getItem("konexa_locale") as Locale | null;
    if (saved && ["ko", "en", "vi"].includes(saved)) return saved;
    return navigator.language.startsWith("ko") ? "ko" : navigator.language.startsWith("vi") ? "vi" : "en";
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => typeof window !== "undefined" && (location.hash.includes("type=recovery") || location.search.includes("type=recovery")));
  const [activeRegisterRole, setActiveRegisterRole] = useState<UserRole | null>(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const { success, error } = useToast();
  const t = copy[locale];

  useEffect(() => {
    localStorage.setItem("konexa_locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const modules = useMemo(() => [LockKeyhole, FileSignature, CircleDollarSign, UserRoundCheck], []);
  const submitWaitlist = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!waitlistEmail.trim()) return;
    setIsWaitlistSubmitting(true);
    try {
      await addDoc(collection(db, "waitlist"), { email: waitlistEmail.trim(), locale, createdAt: Date.now() });
      setWaitlistEmail(""); success(t.success, t.successBody);
    } catch (cause) {
      error(t.error, cause instanceof Error ? cause.message : "Please try again.");
    } finally { setIsWaitlistSubmitting(false); }
  };

  return <div id="landing-master" className="konexa-light min-h-screen overflow-hidden text-[#17342d] selection:bg-[#b9f4d0] selection:text-[#17342d]">
    <AnimatePresence mode="wait">
      {activeRegisterRole ? <motion.main key="registration" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#f7f6f1] text-neutral-900">
        {activeRegisterRole === UserRole.STUDENT
          ? <StudentRegisterForm onCancel={() => setActiveRegisterRole(null)} onSuccess={() => onEnterApp(UserRole.STUDENT)} />
          : <CompanyRegisterForm onCancel={() => setActiveRegisterRole(null)} onSuccess={() => onEnterApp(UserRole.COMPANY)} />}
      </motion.main> : <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="film-grain-light" aria-hidden="true" />
        <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
          <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-[#17342d]/10 bg-[#fbfaf6]/88 px-4 py-2.5 shadow-[0_12px_40px_rgba(23,52,45,.08)] backdrop-blur-xl sm:px-5" aria-label="Primary navigation">
            <button onClick={() => scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })} className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#17342d] text-xs font-black text-white">K</span><Wordmark /></button>
            <div className="hidden items-center gap-7 text-xs font-bold text-[#47655d] lg:flex"><a href="#system">{t.nav[0]}</a><a href="#workflow">{t.nav[1]}</a><a href="#reviews">{t.nav[2]}</a></div>
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-full bg-[#17342d]/5 p-1" aria-label="Language">
                {(["ko", "en", "vi"] as Locale[]).map((item) => <button key={item} onClick={() => setLocale(item)} aria-pressed={locale === item} className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider transition sm:px-2.5 ${locale === item ? "bg-white text-[#17342d] shadow-sm" : "text-[#6f847f] hover:text-[#17342d]"}`}>{item}</button>)}
              </div>
              <button onClick={() => setIsAuthModalOpen(true)} className="hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-bold sm:flex"><LogIn className="h-3.5 w-3.5" />{t.login}</button>
              <button onClick={() => setActiveRegisterRole(UserRole.STUDENT)} className="rounded-full bg-[#17342d] px-3.5 py-2.5 text-[11px] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#284e44] sm:px-5">{t.start}</button>
            </div>
          </nav>
          <motion.div className="mx-auto mt-2 h-px max-w-7xl origin-left bg-[#4361ee]" style={{ scaleX: pageProgress }} aria-hidden="true" />
        </header>

        <main>
          <section ref={heroRef} className="relative flex min-h-[880px] items-center px-5 pb-24 pt-32 sm:px-8 lg:min-h-screen">
            <div className="kinetic-wash" aria-hidden="true" />
            <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
              <motion.div style={{ y: heroCopyY, opacity: heroCopyOpacity }}>
                <motion.div initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#17342d]/10 bg-white/65 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#365b51]"><Sparkles className="h-3.5 w-3.5 text-[#4361ee]" />{t.badge}</motion.div>
                <motion.h1 initial={reduced ? false : { opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .85, ease: [.22, 1, .36, 1] }} className="max-w-4xl font-display text-[clamp(3.35rem,7.2vw,7.3rem)] font-bold leading-[.91] tracking-[-.072em] text-[#17342d] [&_em]:font-normal [&_em]:not-italic [&_em]:text-[#4361ee]">{t.title}</motion.h1>
                <motion.p initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }} className="mt-8 max-w-xl text-base leading-8 text-[#557069] sm:text-lg">{t.lead}</motion.p>
                <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .26 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <button onClick={() => setActiveRegisterRole(UserRole.STUDENT)} className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#17342d] px-6 text-sm font-black text-white shadow-[0_18px_45px_rgba(23,52,45,.16)] transition hover:-translate-y-1"><UserRoundCheck className="h-4 w-4 text-[#b9f4d0]" />{t.studentCta}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>
                  <button onClick={() => setActiveRegisterRole(UserRole.COMPANY)} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-[#17342d]/14 bg-white/65 px-6 text-sm font-black transition hover:-translate-y-1 hover:bg-white"><Building2 className="h-4 w-4 text-[#4361ee]" />{t.companyCta}</button>
                </motion.div>
                <p className="mt-5 flex max-w-xl items-start gap-2 text-xs leading-5 text-[#718780]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2d8c69]" />{t.note}</p>
              </motion.div>

              <motion.div initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: .18, ease: [.22, 1, .36, 1] }} style={{ y: heroVisualY, rotate: heroVisualRotate, scale: heroVisualScale }} className="relative mx-auto w-full max-w-[560px] will-change-transform">
                <div className="absolute -inset-10 rounded-full bg-[#b9f4d0]/40 blur-3xl" />
                <div className="proof-sheet relative overflow-hidden rounded-[2.2rem] border border-[#17342d]/10 bg-[#fffefb]/92 p-5 shadow-[0_35px_100px_rgba(23,52,45,.16)] sm:p-7">
                  <div className="flex items-center justify-between border-b border-[#17342d]/10 pb-5"><div><div className="font-mono text-[9px] font-bold tracking-[.18em] text-[#6f847f]">{t.ledger}</div><div className="mt-2 font-display text-xl font-bold tracking-[-.03em]">{t.candidate}</div></div><span className="rounded-full bg-[#dff8ea] px-3 py-1.5 text-[9px] font-black text-[#23644e]">{t.live}</span></div>
                  <div className="my-6 rounded-[1.6rem] bg-[#edf0ff] p-5 sm:p-6"><div className="flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-full bg-[#4361ee] text-white"><BadgeCheck className="h-6 w-6" /></div><div className="font-mono text-[10px] font-bold text-[#4361ee]">RELATIONSHIP / KX-084</div></div><div className="mt-8 proof-line"><span /><span /><span /><span /></div></div>
                  <div className="grid grid-cols-2 gap-3">{t.stages.map(([label, value], index) => <motion.div key={label} animate={reduced ? undefined : { y: [0, index % 2 ? -4 : 4, 0] }} transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }} className="rounded-2xl border border-[#17342d]/8 bg-white p-4"><div className="text-[10px] font-bold text-[#80918c]">0{index + 1} / {label}</div><div className="mt-3 flex items-center gap-2 text-xs font-black"><Check className="h-3.5 w-3.5 text-[#2d8c69]" />{value}</div></motion.div>)}</div>
                </div>
              </motion.div>
            </div>
          </section>

          <div className="ticker border-y border-[#17342d]/10 bg-[#17342d] py-4 text-[#f8f5eb]"><div className="ticker-track">{[...t.ribbon, ...t.ribbon].map((item, index) => <span key={`${item}-${index}`}><Sparkles className="h-3 w-3 text-[#b9f4d0]" />{item}</span>)}</div></div>

          <section id="system" className="px-5 py-24 sm:px-8 lg:py-36"><div className="mx-auto max-w-7xl">
            <Reveal className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]"><div className="font-mono text-[10px] font-bold tracking-[.18em] text-[#4361ee]">01 / {t.systemEyebrow}</div><div><h2 className="whitespace-pre-line font-display text-4xl font-bold leading-[1.02] tracking-[-.05em] sm:text-6xl">{t.systemTitle}</h2><p className="mt-6 max-w-2xl text-base leading-8 text-[#617972]">{t.systemLead}</p></div></Reveal>
            <div className="mt-16 grid gap-x-8 gap-y-4 md:grid-cols-2">{t.modules.map(([number, title, body], index) => { const Icon = modules[index]; return <Reveal key={number} delay={index * .05} className={`group border-t border-[#17342d]/15 py-8 ${index % 2 ? "md:translate-y-14" : ""}`}><div className="flex items-start gap-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e9edff] text-[#4361ee]"><Icon className="h-5 w-5" /></span><div><span className="font-mono text-[9px] font-bold text-[#8b9a95]">{number}</span><h3 className="mt-2 font-display text-xl font-bold tracking-[-.025em]">{title}</h3><p className="mt-3 text-sm leading-7 text-[#667c76]">{body}</p></div></div></Reveal>})}</div>
          </div></section>

          <section id="workflow" className="rounded-t-[3rem] bg-[#eaf0ff] px-5 py-24 sm:px-8 lg:py-32"><div className="mx-auto max-w-7xl">
            <Reveal><div className="font-mono text-[10px] font-bold tracking-[.18em] text-[#4361ee]">02 / {t.flowEyebrow}</div><h2 className="mt-5 whitespace-pre-line font-display text-4xl font-bold leading-[1.03] tracking-[-.05em] sm:text-6xl">{t.flowTitle}</h2></Reveal>
            <div className="mt-16 grid gap-3 lg:grid-cols-4">{t.flow.map(([number, title, body], index) => <Reveal key={number} delay={index * .07} className="min-h-[285px] rounded-[1.8rem] bg-[#fffefb] p-6 shadow-[0_12px_36px_rgba(67,97,238,.06)]"><div className="font-display text-5xl font-light tracking-[-.06em] text-[#aab6ef]">{number}</div><h3 className="mt-16 font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#657773]">{body}</p></Reveal>)}</div>
          </div></section>

          <section id="reviews" className="bg-[#17342d] px-5 py-24 text-white sm:px-8 lg:py-36"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <Reveal><div className="font-mono text-[10px] font-bold tracking-[.18em] text-[#b9f4d0]">03 / {t.reviewEyebrow}</div><h2 className="mt-5 whitespace-pre-line font-display text-4xl font-bold leading-[1.03] tracking-[-.05em] sm:text-6xl">{t.reviewTitle}</h2><p className="mt-7 max-w-xl text-base leading-8 text-white/62">{t.reviewLead}</p><div className="mt-8 grid grid-cols-2 gap-2">{t.safeguards.map(item => <div key={item} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[10px] font-bold text-white/70"><Check className="h-3 w-3 text-[#b9f4d0]" />{item}</div>)}</div></Reveal>
            <Reveal className="relative min-h-[470px]" delay={.1}><div className="absolute inset-0 rounded-full bg-[#4361ee]/20 blur-3xl" /><div className="review-card absolute left-0 top-4 w-[82%] -rotate-3 rounded-[2rem] bg-[#f9f5e9] p-6 text-[#17342d] sm:p-8"><div className="flex justify-between"><span className="text-xs font-black">COMPANY REVIEW</span><div className="flex text-[#ff9d5c]">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div></div><p className="mt-10 font-display text-xl font-bold leading-8">“{t.companyReview}”</p><div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-[#748781]"><LockKeyhole className="h-3.5 w-3.5" />{t.sealed}</div></div><div className="review-card absolute bottom-0 right-0 w-[82%] rotate-3 rounded-[2rem] bg-[#dfe6ff] p-6 text-[#17342d] shadow-[0_30px_70px_rgba(0,0,0,.22)] sm:p-8"><div className="flex justify-between"><span className="text-xs font-black">TALENT REVIEW</span><BadgeCheck className="h-5 w-5 text-[#4361ee]" /></div><p className="mt-10 font-display text-xl font-bold leading-8">“{t.studentReview}”</p><div className="mt-8 flex items-center gap-2 text-[10px] font-bold text-[#4361ee]"><Globe2 className="h-3.5 w-3.5" />{t.revealed}</div></div></Reveal>
          </div></section>

          <section className="px-5 py-24 sm:px-8 lg:py-32"><div className="mx-auto max-w-5xl">
            <Reveal><h2 className="text-center font-display text-3xl font-bold tracking-[-.04em] sm:text-5xl">{t.faqTitle}</h2></Reveal><div className="mt-12 border-t border-[#17342d]/15">{t.faq.map(([question, answer], index) => <div key={question} className="border-b border-[#17342d]/15"><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 py-6 text-left font-display text-base font-bold sm:text-lg"><span>{question}</span><ChevronDown className={`h-5 w-5 shrink-0 transition ${openFaq === index ? "rotate-180" : ""}`} /></button><AnimatePresence>{openFaq === index && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-6 pr-10 text-sm leading-7 text-[#617972]">{answer}</motion.p>}</AnimatePresence></div>)}</div>
          </div></section>

          <section className="px-4 pb-4 sm:px-6"><div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#4361ee] px-6 py-16 text-center text-white sm:px-10 lg:py-24"><Reveal><BriefcaseBusiness className="mx-auto h-8 w-8 text-[#cfd6ff]" /><h2 className="mt-5 font-display text-4xl font-bold tracking-[-.05em] sm:text-6xl">{t.ctaTitle}</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">{t.ctaLead}</p><form onSubmit={submitWaitlist} className="mx-auto mt-9 flex max-w-lg flex-col gap-2 rounded-[1.4rem] bg-white p-2 sm:flex-row"><input required type="email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder={t.email} className="h-12 flex-1 bg-transparent px-4 text-sm text-[#17342d] outline-none" /><button disabled={isWaitlistSubmitting} className="h-12 rounded-xl bg-[#17342d] px-6 text-xs font-black text-white disabled:opacity-50">{t.join}</button></form></Reveal></div></section>
        </main>

        <footer className="px-6 py-10"><div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-[#17342d]/10 pt-8 sm:flex-row sm:items-center sm:justify-between"><div><Wordmark /><p className="mt-2 text-xs text-[#71857f]">{t.footer}</p></div><p className="text-[10px] font-bold text-[#8b9a95]">© {new Date().getFullYear()} {t.rights}</p></div></footer>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} onSwitchToRegister={(role) => { setIsAuthModalOpen(false); setActiveRegisterRole(role); }} />
      </motion.div>}
    </AnimatePresence>
  </div>;
}
