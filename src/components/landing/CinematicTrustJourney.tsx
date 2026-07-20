import { useRef } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleDollarSign,
  FileSignature,
  ShieldCheck,
  Star,
  UserRoundCheck,
} from "lucide-react";
import { motion, type MotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Locale } from "../../i18n/LocaleContext";
import "./CinematicTrustJourney.css";

type JourneyStage = {
  step: string;
  eyebrow: string;
  title: string;
  body: string;
  proof: string;
};

const journeyCopy: Record<Locale, { intro: string; stages: JourneyStage[] }> = {
  ko: {
    intro: "채용 전의 불확실성을, 검증 가능한 협업 기록으로 바꿉니다.",
    stages: [
      { step: "01", eyebrow: "MATCH", title: "기업과 글로벌 인재가 만납니다.", body: "연락처가 아닌 검증된 역량과 프로젝트 조건을 먼저 확인합니다.", proof: "검증 프로필 연결" },
      { step: "02", eyebrow: "AGREE", title: "업무 범위를 먼저 합의합니다.", body: "결과물, 주급, 일정, 검수 기준을 한곳에 정리하고 양측이 확인합니다.", proof: "범위·조건 확인" },
      { step: "03", eyebrow: "PROTECT", title: "결제 보호를 확인한 뒤 시작합니다.", body: "등록된 국내 PG·에스크로 연동이 완료되면, 결제 확인 후 프로젝트를 시작합니다.", proof: "PG 연동 준비 중" },
      { step: "04", eyebrow: "BUILD", title: "모든 진행 과정이 기록됩니다.", body: "마일스톤과 결과물, 승인 내역을 남겨 국경을 넘는 협업을 투명하게 만듭니다.", proof: "마일스톤 기록" },
      { step: "05", eyebrow: "PROVE", title: "한 번의 협업이 다음 기회가 됩니다.", body: "상호 리뷰와 프로젝트 이력이 Work Passport에 쌓이고, 채용 전환의 근거가 됩니다.", proof: "경력 검증 완료" },
    ],
  },
  en: {
    intro: "Turn hiring uncertainty into a work record both sides can verify.",
    stages: [
      { step: "01", eyebrow: "MATCH", title: "A company meets global talent.", body: "Both sides see verified capability and project fit before private contact details.", proof: "Verified profiles connected" },
      { step: "02", eyebrow: "AGREE", title: "The scope comes first.", body: "Deliverables, weekly pay, timing, and review criteria are captured in one clear agreement.", proof: "Terms confirmed" },
      { step: "03", eyebrow: "PROTECT", title: "Work begins after payment protection.", body: "Once a licensed Korean PG or escrow integration is ready, projects start only after payment is verified.", proof: "PG integration in preparation" },
      { step: "04", eyebrow: "BUILD", title: "Progress becomes visible proof.", body: "Milestones, deliverables, and approvals create a transparent cross-border work record.", proof: "Milestones recorded" },
      { step: "05", eyebrow: "PROVE", title: "One project opens the next door.", body: "Mutual reviews and project history build a Work Passport and support a confident hiring decision.", proof: "Experience verified" },
    ],
  },
  vi: {
    intro: "Biến sự bất định trong tuyển dụng thành hồ sơ hợp tác mà cả hai bên có thể xác minh.",
    stages: [
      { step: "01", eyebrow: "KẾT NỐI", title: "Doanh nghiệp gặp gỡ nhân tài toàn cầu.", body: "Hai bên xem năng lực đã xác minh và mức độ phù hợp trước khi chia sẻ thông tin liên hệ.", proof: "Hồ sơ đã kết nối" },
      { step: "02", eyebrow: "THỐNG NHẤT", title: "Phạm vi công việc được xác định trước.", body: "Sản phẩm bàn giao, lương tuần, tiến độ và tiêu chí duyệt được ghi rõ tại một nơi.", proof: "Điều khoản đã xác nhận" },
      { step: "03", eyebrow: "BẢO VỆ", title: "Chỉ bắt đầu sau khi thanh toán được bảo vệ.", body: "Khi tích hợp PG hoặc ký quỹ được cấp phép tại Hàn Quốc hoàn tất, dự án chỉ bắt đầu sau khi xác nhận thanh toán.", proof: "Đang chuẩn bị tích hợp PG" },
      { step: "04", eyebrow: "THỰC HIỆN", title: "Tiến độ trở thành bằng chứng rõ ràng.", body: "Các cột mốc, sản phẩm bàn giao và phê duyệt tạo nên hồ sơ hợp tác xuyên biên giới minh bạch.", proof: "Đã ghi nhận cột mốc" },
      { step: "05", eyebrow: "CHỨNG MINH", title: "Một dự án mở ra cơ hội tiếp theo.", body: "Đánh giá hai chiều và lịch sử dự án tạo Work Passport, hỗ trợ quyết định tuyển dụng tự tin hơn.", proof: "Kinh nghiệm đã xác minh" },
    ],
  },
};

const icons = [UserRoundCheck, FileSignature, CircleDollarSign, BriefcaseBusiness, BadgeCheck] as const;
const ranges = [
  [0, 0.23],
  [0.18, 0.43],
  [0.38, 0.63],
  [0.58, 0.83],
  [0.78, 1],
] as const;

function StageCopy({ stage, index, progress }: { stage: JourneyStage; index: number; progress: MotionValue<number>; key?: string }) {
  const [start, end] = ranges[index];
  const fadeOut = index === ranges.length - 1 ? 1 : end;
  const opacity = useTransform(progress, [start, start + 0.055, Math.max(start + 0.06, fadeOut - 0.055), fadeOut], [0, 1, 1, index === ranges.length - 1 ? 1 : 0]);
  const y = useTransform(progress, [start, start + 0.07, fadeOut], [42, 0, index === ranges.length - 1 ? 0 : -34]);
  const Icon = icons[index];

  return (
    <motion.article style={{ opacity, y }} className="cinematic-stage" aria-hidden="true">
      <div className="cinematic-stage-meta"><span>{stage.step}</span><span>{stage.eyebrow}</span></div>
      <span className="cinematic-stage-icon"><Icon aria-hidden="true" /></span>
      <h2>{stage.title}</h2>
      <p>{stage.body}</p>
    </motion.article>
  );
}

function ProofCard({ stage, index, progress }: { stage: JourneyStage; index: number; progress: MotionValue<number>; key?: string }) {
  const [start] = ranges[index];
  const opacity = useTransform(progress, [Math.max(0, start - 0.035), start + 0.07], [0, 1]);
  const y = useTransform(progress, [Math.max(0, start - 0.035), start + 0.08], [34, 0]);
  const scale = useTransform(progress, [Math.max(0, start - 0.035), start + 0.08], [0.88, 1]);
  const Icon = icons[index];

  return (
    <motion.div style={{ opacity, y, scale }} className={`cinematic-proof-card cinematic-proof-card-${index + 1}`}>
      <span><Icon aria-hidden="true" /></span>
      <div><small>{stage.step} / {stage.eyebrow}</small><strong>{stage.proof}</strong></div>
      <Check className="cinematic-proof-check" aria-hidden="true" />
    </motion.div>
  );
}

export default function CinematicTrustJourney({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-20, 205]);
  const orbitRotate = useTransform(scrollYProgress, [0, 1], [10, -150]);
  const objectScale = useTransform(scrollYProgress, [0, 0.2, 0.52, 0.8, 1], [0.72, 0.9, 1.02, 0.94, 0.82]);
  const leftX = useTransform(scrollYProgress, [0, 0.18, 0.42, 0.72, 1], [-110, -72, -28, -10, 0]);
  const rightX = useTransform(scrollYProgress, [0, 0.18, 0.42, 0.72, 1], [110, 72, 28, 10, 0]);
  const bridgeScale = useTransform(scrollYProgress, [0, 0.16, 0.45, 1], [0, 0.15, 1, 1]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.48, 1], [0.25, 0.78, 0.42]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const t = journeyCopy[locale];

  return (
    <section ref={sectionRef} className={`cinematic-journey ${reduced ? "cinematic-journey-reduced" : ""}`} aria-label={t.intro}>
      <div className="sr-only">
        <h2>{t.intro}</h2>
        <ol>{t.stages.map(stage => <li key={stage.step}>{stage.title} {stage.body}</li>)}</ol>
      </div>
      <div className="cinematic-sticky">
        <div className="cinematic-ambient" aria-hidden="true"><span /><span /><span /></div>
        <div className="cinematic-progress" aria-hidden="true"><motion.span style={reduced ? undefined : { scaleX: progressScale }} /></div>
        <div className="cinematic-shell" aria-hidden="true">
          <div className="cinematic-copy-column">
            <p className="cinematic-intro">KONEXA / TRUST JOURNEY</p>
            <p className="cinematic-summary">{t.intro}</p>
            <div className="cinematic-stage-stack">
              {t.stages.map((stage, index) => <StageCopy key={stage.step} stage={stage} index={index} progress={scrollYProgress} />)}
            </div>
          </div>

          <div className="cinematic-visual-column" aria-hidden="true">
            <motion.div className="cinematic-glow" style={reduced ? undefined : { opacity: glowOpacity }} />
            <motion.div className="cinematic-nexus" style={reduced ? undefined : { rotate, scale: objectScale }}>
              <motion.div className="cinematic-orbit cinematic-orbit-outer" style={reduced ? undefined : { rotate: orbitRotate }}><span /><span /></motion.div>
              <div className="cinematic-orbit cinematic-orbit-inner"><span /></div>
              <motion.div className="cinematic-nexus-half cinematic-nexus-left" style={reduced ? undefined : { x: leftX }}><Building2 /></motion.div>
              <motion.div className="cinematic-nexus-half cinematic-nexus-right" style={reduced ? undefined : { x: rightX }}><UserRoundCheck /></motion.div>
              <motion.span className="cinematic-bridge" style={reduced ? undefined : { scaleX: bridgeScale }} />
              <div className="cinematic-nexus-core"><ShieldCheck /><span>KX</span></div>
            </motion.div>
            <div className="cinematic-proof-stack">
              {t.stages.map((stage, index) => <ProofCard key={stage.step} stage={stage} index={index} progress={scrollYProgress} />)}
            </div>
            <div className="cinematic-final-seal"><Star /><span>WORK<br />PASSPORT</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
