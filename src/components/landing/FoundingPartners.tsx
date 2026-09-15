import { ArrowRight, BriefcaseBusiness, GraduationCap } from "lucide-react";
import type { Locale } from "../../i18n/LocaleContext";
const copy = {
    ko: {
        badge: "모두의 창업 프로젝트 2라운드 진출팀",
        title: "첫 프로젝트를 함께할 기업을 찾습니다.",
        lead: "필요한 일부터 알려주세요. 업무 범위와 주차별 결과물을 정리한 뒤, 그 일을 함께할 수 있는 인재를 연결합니다.",
        company: "기업은 필요한 업무를 등록하세요.",
        companyBody: "시장 조사, 콘텐츠, 디자인, 개발 등 맡기고 싶은 업무와 필요한 역량을 공고로 남겨 주세요. KONEXA가 프로젝트 단위로 구체화하는 과정을 함께합니다.",
        companyCta: "기업으로 가입하고 공고 등록하기",
        talent: "처음에는 약 10명의 학생 인재부터.",
        talentBody: "초기에는 학생 인재 약 10명을 모집해 프로젝트를 진행할 계획입니다. 기업 수요와 운영 경험을 바탕으로 모집을 넓혀 갑니다.",
        talentCta: "학생·인재로 참여하기",
        steps: ["업무 범위 정리", "주차별 결과물 설정", "참여 가능한 인재 매칭"],
        notice: "현재는 가입·프로필 작성·공고 등록을 중심으로 초기 파트너를 모집합니다. 결제·에스크로·전자서명은 연동과 운영 요건 확인 후 안내합니다.",
        closed: "8월 5일 마감 얼리버드의 신규 신청은 종료되었습니다. 기존에 확정된 혜택은 해당 약정에 따라 관리합니다.",
    },
    en: {
        badge: "Round 2 team · Modu's Startup Project",
        title: "Build your first project with KONEXA.",
        lead: "Tell us what needs doing. We help define the scope and weekly deliverables, then match talent who can take part.",
        company: "Start with the work your team needs.",
        companyBody: "Post your requirements for market research, content, design, development, or other project work. KONEXA helps turn the brief into a clear project.",
        companyCta: "Create a company account and post a project",
        talent: "Starting with about 10 student talents.",
        talentBody: "We plan to recruit about 10 students for the first projects, then expand recruitment as company demand and our operating experience grow.",
        talentCta: "Join as talent",
        steps: ["Define the scope", "Set weekly deliverables", "Match available talent"],
        notice: "We are currently onboarding early partners through accounts, profiles, and project postings. Payments, escrow, and e-signatures will be announced after integrations and operating requirements are confirmed.",
        closed: "New applications for the August 5 early-bird offer are closed. Previously confirmed benefits remain governed by their agreed terms.",
    }
} as const;
export default function FoundingPartners({ locale, onCompany, onStudent }: {
    locale: Locale;
    onCompany: () => void;
    onStudent: () => void;
}) {
    const t = copy[locale];
    return <section id="early-bird" data-no-translate className="bg-[#f0f3ee] px-5 py-20 sm:px-8 lg:py-28">
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold leading-6 text-[#4361ee]">{t.badge}</p>
      <h2 className="mt-5 max-w-3xl break-keep text-3xl font-bold leading-[1.3] tracking-tight text-[#17342d] sm:text-4xl">{t.title}</h2>
      <p className="mt-6 max-w-2xl text-base leading-8 text-[#405b54]">{t.lead}</p>
      <ol className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
        {t.steps.map((step, index) => <li key={step} className="flex items-center gap-3 text-sm font-semibold text-[#17342d]"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white">{index + 1}</span>{step}</li>)}
      </ol>
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <article className="flex flex-col rounded-3xl bg-[#17342d] p-7 text-white sm:p-9">
          <BriefcaseBusiness className="h-6 w-6 text-[#b9f4d0]" aria-hidden="true"/>
          <h3 className="mt-5 break-keep text-xl font-bold leading-8">{t.company}</h3>
          <p className="mb-7 mt-3 text-base leading-7 text-white/85">{t.companyBody}</p>
          <button onClick={onCompany} className="mt-auto flex min-h-12 items-center justify-between gap-4 rounded-xl bg-white px-5 py-3 text-left text-sm font-semibold leading-6 text-[#17342d]">{t.companyCta}<ArrowRight className="h-4 w-4 shrink-0"/></button>
        </article>
        <article className="flex flex-col rounded-3xl border border-[#17342d]/10 bg-white p-7 text-[#17342d] sm:p-9">
          <GraduationCap className="h-6 w-6 text-[#4361ee]" aria-hidden="true"/>
          <h3 className="mt-5 break-keep text-xl font-bold leading-8">{t.talent}</h3>
          <p className="mb-7 mt-3 text-base leading-7 text-[#405b54]">{t.talentBody}</p>
          <button onClick={onStudent} className="mt-auto flex min-h-12 items-center justify-between gap-4 rounded-xl bg-[#edf0ff] px-5 py-3 text-left text-sm font-semibold leading-6 text-[#17342d]">{t.talentCta}<ArrowRight className="h-4 w-4 shrink-0"/></button>
        </article>
      </div>
      <p className="mt-7 max-w-4xl text-sm leading-7 text-[#405b54]">{t.notice}</p>
      <p className="mt-3 max-w-4xl text-xs leading-6 text-[#536a64]">{t.closed}</p>
    </div>
  </section>;
}
