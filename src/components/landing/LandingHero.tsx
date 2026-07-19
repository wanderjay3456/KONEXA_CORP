import React, { useMemo, useRef, useState } from "react";
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
import EarlyBirdCampaign from "./EarlyBirdCampaign";
import NexusMotionField from "./NexusMotionField";
import { db } from "../../config/supabase";
import { addDoc, collection } from "../../lib/supabaseStore";
import { useToast } from "../ui/Toast";
import { type Locale, useLocale } from "../../i18n/LocaleContext";

interface LandingHeroProps { onEnterApp: (role: UserRole) => void }

const copy = {
  ko: {
    nav: ["운영 구조", "진행 방식", "상호 리뷰"], login: "로그인", start: "시작하기",
    badge: "Zero Risk, Top 1% Talent",
    title: <><span className="hero-title-line">해외 인재 채용{" "}</span><span className="hero-title-line"><strong className="hero-keyword hero-keyword-risk">도박</strong>의 마침표</span></>,
    lead: "KONEXA에서는 채용을 결정하기 전에 한국 기업과 글로벌 인재가 실제 프로젝트로 서로의 업무 방식을 확인할 수 있습니다. 계약, 결제, 결과물과 상호 평가는 한곳에 기록되어 다음 프로젝트와 채용 판단의 근거가 됩니다.",
    studentCta: "학생으로 시작하기", companyCta: "기업 공고 등록하기",
    note: "계약 서명과 PG 결제가 모두 확인된 뒤, 협업에 필요한 연락처만 공개됩니다.",
    ledger: "프로젝트 신뢰 기록", live: "검증 완료", relationship: "협업 기록", candidate: "글로벌 제품 디자이너",
    stages: [["프로필", "정보 보호"], ["계약", "양측 서명"], ["결제", "PG 확인"], ["리뷰", "동시 공개"]],
    ribbon: ["명확한 업무 범위", "연락처 보호", "공정한 상호 리뷰", "정식 채용 전환"],
    systemEyebrow: "TRUST, BY DESIGN", systemTitle: "좋은 매칭은 시작입니다. 신뢰할 수 있는 협업 기록까지 남깁니다.",
    systemLead: "업무 범위, 마일스톤, 결제, 결과물을 한곳에 기록해 협업 과정을 투명하게 확인할 수 있습니다.",
    modules: [
      ["01", "연락처는 계약 후 공개", "계약과 결제가 확인되기 전에는 이메일, 전화번호, SNS를 숨겨 무단 접촉을 줄입니다."],
      ["02", "업무 범위를 먼저 합의", "시작 전에 결과물, 수정 횟수, 검수 기간, 추가 업무 기준을 합의하고 서명으로 남깁니다."],
      ["03", "국내 PG 결제 확인 후 시작", "KONEXA가 대금을 보관하지 않습니다. 등록된 국내 PG·에스크로의 결제 확인 후 프로젝트를 시작합니다."],
      ["04", "프로젝트를 채용 기회로 연결", "완료된 프로젝트는 Work Passport에 남고, 기업은 플랫폼 안에서 정식 채용을 제안할 수 있습니다."],
    ],
    flowEyebrow: "A CLEAR WAY TO WORK", flowTitle: "국경을 넘는 협업, 네 단계로 명확해집니다.",
    flow: [["01", "인재 찾기", "검증된 기술, 전공, 언어 능력과 프로젝트 평가로 인재를 찾습니다."], ["02", "조건 합의하기", "주급, 업무 범위, 결과물과 검수 기준을 하나의 계약서에 담습니다."], ["03", "안전하게 협업하기", "결제가 확인되면 시작하고, 마일스톤마다 진행 상황을 기록합니다."], ["04", "경력으로 증명하기", "결과물과 상호 리뷰가 다음 프로젝트와 채용을 위한 경력이 됩니다."]],
    reviewEyebrow: "MUTUAL REVIEW", reviewTitle: "리뷰는 솔직하게, 공개는 공정하게.",
    reviewLead: "한쪽이 먼저 작성해도 상대방은 볼 수 없습니다. 검증된 유료 프로젝트의 리뷰만 받고, 양쪽 제출이 끝나면 동시에 공개합니다.",
    companyReviewLabel: "기업이 남긴 리뷰", talentReviewLabel: "인재가 남긴 리뷰",
    companyReview: "업무 범위가 명확했고 필요한 피드백도 빠르게 받을 수 있었어요.", studentReview: "기대 이상의 결과물을 받았고, 프로젝트 내내 소통도 원활했어요.", sealed: "상대방이 제출할 때까지 비공개", revealed: "양쪽 제출 후 동시에 공개",
    safeguards: ["검증된 프로젝트만 작성", "양쪽 제출 전까지 비공개", "관리자 이의신청 지원", "차별·보복성 리뷰 제한"],
    ctaTitle: "국경보다 실력으로 연결하세요.", ctaLead: "기업은 검증된 실행력을 확인하고, 글로벌 인재는 첫 경력을 증명할 수 있습니다.",
    email: "업데이트를 받을 이메일", join: "소식 받기", success: "등록되었습니다", successBody: "KONEXA 공개 소식을 이메일로 알려드릴게요.", error: "등록하지 못했습니다",
    faqTitle: "자주 묻는 질문", faq: [
      ["실제 결제와 정산도 지원하나요?", "국내 PG·에스크로 연동을 준비하고 있습니다. 가맹점 계약과 운영 요건을 충족한 결제 기능부터 순차적으로 활성화합니다."],
      ["연락처는 언제 공개되나요?", "기본계약에 양측이 서명하고 등록 PG의 결제 보호가 확인된 뒤, 협업에 필요한 정보만 공개됩니다."],
      ["상대방이 제 리뷰를 먼저 볼 수 있나요?", "아니요. 한쪽이 먼저 작성해도 상대방에게 공개되지 않습니다. 양쪽이 모두 제출하면 동시에 공개되며, 이의신청 절차도 마련되어 있습니다."],
    ],
    footer: "검증된 프로젝트가 국경을 넘어 새로운 경력이 되는 곳.", rights: "KONEXA. 모든 권리를 보유합니다.",
  },
  en: {
    nav: ["Trust system", "How it works", "Mutual reviews"], login: "Log in", start: "Get started",
    badge: "Zero Risk, Top 1% Talent",
    title: <><span className="hero-title-line">Top Companies Are Looking{" "}</span><span className="hero-title-line">for the <span className="hero-keep-together">Top <strong className="hero-keyword hero-keyword-percent">1%</strong></span></span></>,
    lead: "Before making a hiring decision, Korean companies and global talent can use KONEXA to see how well they work together on a real project. Contracts, payments, deliverables, and mutual reviews stay in one place as evidence for future projects and hiring decisions.",
    studentCta: "Join as talent", companyCta: "Post a role",
    note: "Contact details remain private until both parties sign the agreement and payment is verified through a registered PG provider.",
    ledger: "PROJECT TRUST RECORD", live: "VERIFIED", relationship: "RELATIONSHIP", candidate: "Global product designer",
    stages: [["Profile", "Protected"], ["Contract", "Both signed"], ["Payment", "Verified"], ["Reviews", "Released together"]],
    ribbon: ["Clear scope", "Private contact details", "Fair mutual reviews", "Direct hiring path"],
    systemEyebrow: "TRUST, BY DESIGN", systemTitle: "A strong match is the start. A trusted work record is what lasts.",
    systemLead: "Scope, milestones, payments, and deliverables stay in one place, so both sides can follow the work with confidence.",
    modules: [
      ["01", "Contact details shared at the right time", "Personal email, phone, and social profiles stay private until the agreement is signed and payment is verified."],
      ["02", "Scope agreed before work begins", "Deliverables, revision limits, review periods, and extra-work terms are agreed first and captured with e-signatures."],
      ["03", "Payments verified by a Korean provider", "A licensed Korean payment or escrow provider handles the funds. KONEXA never holds client money directly."],
      ["04", "Project proof that can lead to hiring", "Completed projects build a Work Passport, and companies can send formal hiring offers through the platform."],
    ],
    flowEyebrow: "A CLEAR WAY TO WORK", flowTitle: "Cross-border collaboration, clear in four steps.",
    flow: [["01", "Find the right talent", "Search by verified skills, field of study, language ability, and project reviews."], ["02", "Agree on the terms", "Put weekly pay, scope, deliverables, and review criteria into one clear agreement."], ["03", "Work with protection", "Start after payment is verified, then record progress at every milestone."], ["04", "Turn the work into proof", "Deliverables and mutual reviews become verified experience for the next project or role."]],
    reviewEyebrow: "MUTUAL REVIEW", reviewTitle: "Write honestly. Publish fairly.",
    reviewLead: "Neither side can see the other review before submitting. Only verified paid projects can be reviewed, and both reviews go live together.",
    companyReviewLabel: "COMPANY REVIEW", talentReviewLabel: "TALENT REVIEW",
    companyReview: "The scope was clear, and I received useful feedback quickly.", studentReview: "The final work exceeded our expectations, and communication stayed smooth throughout.", sealed: "Private until the other side submits", revealed: "Released when both sides submit",
    safeguards: ["Verified projects only", "Private until both submit", "Admin-supported appeals", "Protection from biased or retaliatory reviews"],
    ctaTitle: "Connect through capability, not borders.", ctaLead: "Companies see proven ability. Global talent gains experience they can verify.",
    email: "Email for launch updates", join: "Keep me posted", success: "You're on the list", successBody: "We'll send KONEXA launch updates to your inbox.", error: "Could not subscribe",
    faqTitle: "Common questions", faq: [
      ["Does KONEXA support real payments and payouts?", "KONEXA is preparing integrations with registered Korean payment and escrow providers. Payment features will go live only after the required merchant and operating checks are complete."],
      ["When are contact details shared?", "Only the details needed for collaboration are shared after both parties sign the agreement and payment protection is verified."],
      ["Can the other side see my review first?", "No. Your review remains private until the other side submits theirs. Both reviews are then released together, with an appeal process for disputed content."],
    ],
    footer: "Where verified projects become borderless careers.", rights: "KONEXA. All rights reserved.",
  },
  vi: {
    nav: ["Cơ chế tin cậy", "Quy trình", "Đánh giá hai chiều"], login: "Đăng nhập", start: "Bắt đầu",
    badge: "An tâm kết nối 1% nhân tài hàng đầu.",
    title: <><span className="hero-title-line">Doanh nghiệp hàng đầu đang tìm kiếm{" "}</span><span className="hero-title-line"><strong className="hero-keyword hero-keyword-percent">1%</strong> nhân tài xuất sắc nhất</span></>,
    lead: "Trước khi quyết định tuyển dụng, doanh nghiệp Hàn Quốc và nhân tài quốc tế có thể cùng thực hiện một dự án thực tế trên KONEXA để hiểu cách làm việc của nhau. Hợp đồng, thanh toán, sản phẩm bàn giao và đánh giá hai chiều được lưu tại một nơi để làm căn cứ cho dự án và quyết định tuyển dụng tiếp theo.",
    studentCta: "Tạo hồ sơ ứng viên", companyCta: "Đăng tin tuyển dụng",
    note: "Thông tin liên hệ chỉ được mở sau khi hai bên ký hợp đồng và thanh toán được xác nhận qua đơn vị PG.",
    ledger: "HỒ SƠ DỰ ÁN ĐÃ XÁC THỰC", live: "ĐÃ XÁC THỰC", relationship: "QUAN HỆ HỢP TÁC", candidate: "Nhà thiết kế sản phẩm quốc tế",
    stages: [["Hồ sơ", "Được bảo vệ"], ["Hợp đồng", "Hai bên đã ký"], ["Thanh toán", "Đã xác nhận"], ["Đánh giá", "Công bố cùng lúc"]],
    ribbon: ["Phạm vi rõ ràng", "Bảo mật liên hệ", "Đánh giá công bằng", "Lộ trình tuyển dụng chính thức"],
    systemEyebrow: "TIN CẬY NGAY TỪ THIẾT KẾ", systemTitle: "Tìm đúng người là bước khởi đầu. Hồ sơ hợp tác đáng tin cậy mới là điều còn lại.",
    systemLead: "Phạm vi công việc, cột mốc, thanh toán và sản phẩm bàn giao được lưu tại một nơi để hai bên dễ dàng theo dõi.",
    modules: [
      ["01", "Chỉ chia sẻ liên hệ khi cần thiết", "Email, số điện thoại và tài khoản mạng xã hội được giữ kín cho đến khi hợp đồng và thanh toán được xác nhận."],
      ["02", "Thống nhất phạm vi trước khi bắt đầu", "Sản phẩm bàn giao, số lần chỉnh sửa, thời hạn duyệt và chi phí phát sinh được thống nhất và ký điện tử trước khi làm việc."],
      ["03", "Thanh toán qua đơn vị được cấp phép", "Đơn vị thanh toán hoặc ký quỹ được cấp phép tại Hàn Quốc sẽ xử lý tiền. KONEXA không trực tiếp giữ tiền của khách hàng."],
      ["04", "Biến dự án thành cơ hội tuyển dụng", "Dự án hoàn thành được ghi vào Work Passport. Doanh nghiệp cũng có thể gửi đề nghị tuyển dụng chính thức ngay trên nền tảng."],
    ],
    flowEyebrow: "QUY TRÌNH RÕ RÀNG", flowTitle: "Hợp tác xuyên biên giới chỉ trong bốn bước rõ ràng.",
    flow: [["01", "Tìm đúng ứng viên", "Tìm kiếm dựa trên kỹ năng, ngành học, ngoại ngữ và đánh giá dự án đã được xác thực."], ["02", "Thống nhất điều khoản", "Ghi rõ mức thù lao theo tuần, phạm vi công việc, sản phẩm bàn giao và tiêu chí nghiệm thu trong hợp đồng."], ["03", "Hợp tác an toàn", "Bắt đầu sau khi thanh toán được xác nhận và ghi lại tiến độ ở từng cột mốc."], ["04", "Biến kết quả thành kinh nghiệm", "Sản phẩm bàn giao và đánh giá hai chiều trở thành minh chứng cho dự án hoặc cơ hội việc làm tiếp theo."]],
    reviewEyebrow: "ĐÁNH GIÁ HAI CHIỀU", reviewTitle: "Đánh giá trung thực, công bố công bằng.",
    reviewLead: "Không bên nào xem được đánh giá trước khi tự hoàn tất. Chỉ dự án trả phí đã xác thực mới được đánh giá, và hai nhận xét được công bố cùng lúc.",
    companyReviewLabel: "ĐÁNH GIÁ TỪ DOANH NGHIỆP", talentReviewLabel: "ĐÁNH GIÁ TỪ ỨNG VIÊN",
    companyReview: "Phạm vi công việc rất rõ ràng và tôi luôn nhận được phản hồi kịp thời.", studentReview: "Kết quả vượt mong đợi và quá trình trao đổi luôn suôn sẻ.", sealed: "Giữ kín đến khi bên còn lại hoàn tất", revealed: "Công bố cùng lúc khi cả hai bên hoàn tất",
    safeguards: ["Chỉ dành cho dự án đã xác thực", "Giữ kín đến khi cả hai hoàn tất", "Có quy trình khiếu nại", "Hạn chế đánh giá thiên vị hoặc trả đũa"],
    ctaTitle: "Kết nối bằng năng lực, không bị giới hạn bởi biên giới.", ctaLead: "Doanh nghiệp nhìn thấy năng lực đã được chứng minh. Nhân tài quốc tế có kinh nghiệm có thể xác thực.",
    email: "Email nhận tin ra mắt", join: "Nhận thông tin", success: "Đã đăng ký", successBody: "Chúng tôi sẽ gửi tin ra mắt KONEXA qua email.", error: "Không thể đăng ký",
    faqTitle: "Câu hỏi thường gặp", faq: [
      ["KONEXA có hỗ trợ thanh toán và chi trả thật không?", "KONEXA đang chuẩn bị kết nối với đơn vị thanh toán và ký quỹ được cấp phép tại Hàn Quốc. Tính năng sẽ chỉ được kích hoạt sau khi hoàn tất đầy đủ điều kiện vận hành."],
      ["Khi nào thông tin liên hệ được chia sẻ?", "Chỉ những thông tin cần cho công việc mới được chia sẻ sau khi hai bên ký hợp đồng và thanh toán được bảo vệ."],
      ["Bên kia có thể xem đánh giá của tôi trước không?", "Không. Đánh giá của bạn được giữ kín cho đến khi bên còn lại cũng hoàn tất. Sau đó, hai đánh giá được công bố cùng lúc và có quy trình khiếu nại nếu phát sinh tranh chấp."],
    ],
    footer: "Nơi dự án đã xác thực mở ra cơ hội nghề nghiệp không biên giới.", rights: "KONEXA. Mọi quyền được bảo lưu.",
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
  const { locale, setLocale } = useLocale();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => typeof window !== "undefined" && (location.hash.includes("type=recovery") || location.search.includes("type=recovery")));
  const [activeRegisterRole, setActiveRegisterRole] = useState<UserRole | null>(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const { success, error } = useToast();
  const t = copy[locale];

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
      {activeRegisterRole ? <motion.main data-auto-translate key="registration" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-screen bg-[#f7f6f1] text-neutral-900">
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
                {(["ko", "en", "vi"] as Locale[]).map((item) => <button key={item} onClick={() => setLocale(item)} aria-pressed={locale === item} className={`rounded-full px-2 py-1 text-[11px] font-black uppercase tracking-wide transition sm:px-2.5 ${locale === item ? "bg-white text-[#17342d] shadow-sm" : "text-[#536a64] hover:text-[#17342d]"}`}>{item}</button>)}
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
            <NexusMotionField />
            <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
              <motion.div style={{ y: heroCopyY, opacity: heroCopyOpacity }}>
                <motion.div initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#17342d]/10 bg-white/75 px-3 py-1.5 text-xs font-black uppercase tracking-[.1em] text-[#294d44]"><Sparkles className="h-3.5 w-3.5 text-[#4361ee]" />{t.badge}</motion.div>
                <motion.h1 initial={reduced ? false : { opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .85, ease: [.22, 1, .36, 1] }} className="hero-heading max-w-4xl break-keep font-display font-bold tracking-[-.052em] text-[#17342d]">{t.title}</motion.h1>
                <motion.p initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }} className="mt-10 max-w-2xl text-base leading-8 text-[#557069] sm:text-lg">{t.lead}</motion.p>
                <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .26 }} className="mt-10 flex flex-col gap-3 sm:flex-row">
                  <button onClick={() => setActiveRegisterRole(UserRole.STUDENT)} className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#17342d] px-6 text-sm font-black text-white shadow-[0_18px_45px_rgba(23,52,45,.16)] transition hover:-translate-y-1"><UserRoundCheck className="h-4 w-4 text-[#b9f4d0]" />{t.studentCta}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></button>
                  <button onClick={() => setActiveRegisterRole(UserRole.COMPANY)} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-[#17342d]/14 bg-white/65 px-6 text-sm font-black transition hover:-translate-y-1 hover:bg-white"><Building2 className="h-4 w-4 text-[#4361ee]" />{t.companyCta}</button>
                </motion.div>
                <p className="mt-5 flex max-w-xl items-start gap-2 text-sm font-medium leading-6 text-[#526b64]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2d8c69]" />{t.note}</p>
              </motion.div>

              <motion.div initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: .18, ease: [.22, 1, .36, 1] }} style={{ y: heroVisualY, rotate: heroVisualRotate, scale: heroVisualScale }} className="relative mx-auto w-full max-w-[560px] will-change-transform">
                <div className="absolute -inset-10 rounded-full bg-[#b9f4d0]/40 blur-3xl" />
                <div className="proof-sheet relative overflow-hidden rounded-[2.2rem] border border-[#17342d]/10 bg-[#fffefb]/92 p-5 shadow-[0_35px_100px_rgba(23,52,45,.16)] sm:p-7">
                  <div className="flex items-center justify-between border-b border-[#17342d]/10 pb-5"><div><div className="font-mono text-[11px] font-bold tracking-[.14em] text-[#536a64]">{t.ledger}</div><div className="mt-2 font-display text-xl font-bold tracking-[-.03em]">{t.candidate}</div></div><span className="rounded-full bg-[#dff8ea] px-3 py-1.5 text-[11px] font-black text-[#23644e]">{t.live}</span></div>
                  <div className="my-6 rounded-[1.6rem] bg-[#edf0ff] p-5 sm:p-6"><div className="flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-full bg-[#4361ee] text-white"><BadgeCheck className="h-6 w-6" /></div><div className="font-mono text-[10px] font-bold text-[#4361ee]">{t.relationship} / KX-084</div></div><div className="mt-8 proof-line"><span /><span /><span /><span /></div></div>
                  <div className="grid grid-cols-2 gap-3">{t.stages.map(([label, value], index) => <motion.div key={label} animate={reduced ? undefined : { y: [0, index % 2 ? -4 : 4, 0] }} transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }} className="rounded-2xl border border-[#17342d]/8 bg-white p-4"><div className="text-xs font-bold text-[#5f746e]">0{index + 1} / {label}</div><div className="mt-3 flex items-center gap-2 text-sm font-black"><Check className="h-3.5 w-3.5 text-[#2d8c69]" />{value}</div></motion.div>)}</div>
                </div>
              </motion.div>
            </div>
          </section>

          <div className="ticker border-y border-[#17342d]/10 bg-[#17342d] py-4 text-[#f8f5eb]"><div className="ticker-track">{[...t.ribbon, ...t.ribbon].map((item, index) => <span key={`${item}-${index}`}><Sparkles className="h-3 w-3 text-[#b9f4d0]" />{item}</span>)}</div></div>

          <EarlyBirdCampaign locale={locale} onStudent={() => setActiveRegisterRole(UserRole.STUDENT)} onCompany={() => setActiveRegisterRole(UserRole.COMPANY)} />

          <section id="system" className="px-5 py-24 sm:px-8 lg:py-36"><div className="mx-auto max-w-7xl">
            <Reveal className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-14"><div className="font-mono text-[10px] font-bold tracking-[.18em] text-[#4361ee]">01 / {t.systemEyebrow}</div><div><h2 className="max-w-4xl font-display text-3xl font-bold leading-[1.1] tracking-[-.04em] sm:text-5xl">{t.systemTitle}</h2><p className="mt-6 max-w-2xl text-base font-medium leading-8 text-[#48645d]">{t.systemLead}</p></div></Reveal>
            <div className="mt-14 grid gap-x-8 gap-y-4 md:grid-cols-2">{t.modules.map(([number, title, body], index) => { const Icon = modules[index]; return <Reveal key={number} delay={index * .05} className={`group border-t border-[#17342d]/15 py-8 ${index % 2 ? "md:translate-y-10" : ""}`}><div className="flex items-start gap-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e9edff] text-[#4361ee]"><Icon className="h-5 w-5" /></span><div><span className="font-mono text-[9px] font-bold text-[#748781]">{number}</span><h3 className="mt-2 font-display text-xl font-bold tracking-[-.025em]">{title}</h3><p className="mt-3 text-[15px] leading-7 text-[#506962]">{body}</p></div></div></Reveal>})}</div>
          </div></section>

          <section id="workflow" className="rounded-t-[3rem] bg-[#eaf0ff] px-5 py-24 sm:px-8 lg:py-32"><div className="mx-auto max-w-7xl">
            <Reveal><div className="font-mono text-[10px] font-bold tracking-[.18em] text-[#4361ee]">02 / {t.flowEyebrow}</div><h2 className="mt-6 max-w-5xl font-display text-3xl font-bold leading-[1.1] tracking-[-.04em] sm:text-5xl">{t.flowTitle}</h2></Reveal>
            <div className="nexus-flow mt-14 grid gap-3 lg:grid-cols-4">{t.flow.map(([number, title, body], index) => <Reveal key={number} delay={index * .07} className="nexus-flow-card min-h-[250px] rounded-[1.8rem] bg-[#fffefb] p-6 shadow-[0_12px_36px_rgba(67,97,238,.06)]"><div className="font-display text-4xl font-light tracking-[-.05em] text-[#8f9fe7]">{number}</div><h3 className="mt-10 font-display text-xl font-bold">{title}</h3><p className="mt-4 text-[15px] leading-7 text-[#506962]">{body}</p></Reveal>)}</div>
          </div></section>

          <section id="reviews" className="bg-[#17342d] px-5 py-24 text-white sm:px-8 lg:py-36"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <Reveal><div className="font-mono text-xs font-bold tracking-[.16em] text-[#b9f4d0]">03 / {t.reviewEyebrow}</div><h2 className="mt-6 max-w-xl font-display text-3xl font-bold leading-[1.1] tracking-[-.04em] sm:text-5xl">{t.reviewTitle}</h2><p className="mt-7 max-w-xl text-base font-medium leading-8 text-white/85">{t.reviewLead}</p><div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">{t.safeguards.map(item => <div key={item} className="flex items-center gap-2 rounded-full border border-white/25 px-3 py-2 text-xs font-bold text-white/90"><Check className="h-3 w-3 text-[#b9f4d0]" />{item}</div>)}</div></Reveal>
            <Reveal className="relative grid gap-4 sm:min-h-[470px]" delay={.1}><div className="absolute inset-0 rounded-full bg-[#4361ee]/20 blur-3xl" /><div className="review-card relative w-full -rotate-1 rounded-[2rem] bg-[#f9f5e9] p-6 text-[#17342d] sm:absolute sm:left-0 sm:top-4 sm:w-[82%] sm:-rotate-3 sm:p-8"><div className="flex justify-between"><span className="text-xs font-black">{t.companyReviewLabel}</span><div className="flex text-[#ff9d5c]">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div></div><p className="mt-7 font-display text-lg font-bold leading-7 sm:mt-10 sm:text-xl sm:leading-8">“{t.companyReview}”</p><div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-[#748781] sm:mt-8"><LockKeyhole className="h-3.5 w-3.5" />{t.sealed}</div></div><div className="review-card relative w-full rotate-1 rounded-[2rem] bg-[#dfe6ff] p-6 text-[#17342d] shadow-[0_30px_70px_rgba(0,0,0,.22)] sm:absolute sm:bottom-0 sm:right-0 sm:w-[82%] sm:rotate-3 sm:p-8"><div className="flex justify-between"><span className="text-xs font-black">{t.talentReviewLabel}</span><BadgeCheck className="h-5 w-5 text-[#4361ee]" /></div><p className="mt-7 font-display text-lg font-bold leading-7 sm:mt-10 sm:text-xl sm:leading-8">“{t.studentReview}”</p><div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-[#4361ee] sm:mt-8"><Globe2 className="h-3.5 w-3.5" />{t.revealed}</div></div></Reveal>
          </div></section>

          <section className="px-5 py-24 sm:px-8 lg:py-32"><div className="mx-auto max-w-5xl">
            <Reveal><h2 className="text-center font-display text-3xl font-bold tracking-[-.04em] sm:text-5xl">{t.faqTitle}</h2></Reveal><div className="mt-12 border-t border-[#17342d]/15">{t.faq.map(([question, answer], index) => <div key={question} className="border-b border-[#17342d]/15"><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 py-6 text-left font-display text-base font-bold sm:text-lg"><span>{question}</span><ChevronDown className={`h-5 w-5 shrink-0 transition ${openFaq === index ? "rotate-180" : ""}`} /></button><AnimatePresence>{openFaq === index && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-6 pr-10 text-sm leading-7 text-[#617972]">{answer}</motion.p>}</AnimatePresence></div>)}</div>
          </div></section>

          <section className="px-4 pb-4 sm:px-6"><div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#4361ee] px-6 py-16 text-center text-white sm:px-10 lg:py-20"><Reveal><BriefcaseBusiness className="mx-auto h-8 w-8 text-[#e5e9ff]" /><h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-[-.04em] sm:text-5xl">{t.ctaTitle}</h2><p className="mx-auto mt-7 max-w-xl text-sm font-medium leading-7 text-white/90 sm:text-base">{t.ctaLead}</p><form onSubmit={submitWaitlist} className="mx-auto mt-10 flex max-w-lg flex-col gap-2 rounded-[1.4rem] bg-white p-2 sm:flex-row"><input required type="email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} placeholder={t.email} className="h-12 flex-1 bg-transparent px-4 text-sm text-[#17342d] outline-none placeholder:text-[#617972]" /><button disabled={isWaitlistSubmitting} className="h-12 rounded-xl bg-[#17342d] px-6 text-xs font-black text-white disabled:opacity-50">{t.join}</button></form></Reveal></div></section>
        </main>

        <footer className="px-6 py-10"><div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-[#17342d]/10 pt-8 sm:flex-row sm:items-center sm:justify-between"><div><Wordmark /><p className="mt-2 text-sm text-[#526b64]">{t.footer}</p></div><p className="text-xs font-bold text-[#5f746e]">© {new Date().getFullYear()} {t.rights}</p></div></footer>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setIsAuthModalOpen(false)} onSwitchToRegister={(role) => { setIsAuthModalOpen(false); setActiveRegisterRole(role); }} />
      </motion.div>}
    </AnimatePresence>
  </div>;
}
