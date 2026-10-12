import type { Locale } from "../../i18n/LocaleContext";

export const CONTACT_EMAIL = "konexa.corp@gmail.com";

/** A run of headline text. `strong` runs are the bold mint emphasis. */
export interface Fragment {
    text: string;
    strong?: boolean;
}

export interface LandingCopy {
    meta: {
        title: string;
        description: string;
    };
    nav: {
        how: string;
        talent: string;
        login: string;
        post: string;
        primary: string;
        language: string;
    };
    hero: {
        pill: string;
        /** One entry per visual line; each line slides up through its own mask. */
        title: Fragment[][];
        lead: string;
        postCta: string;
        talentCta: string;
        companyRegister: string;
        contactNote: string;
    };
    record: {
        label: string;
        illustration: string;
        title: string;
        meta: string;
        brief: string;
        outputLabel: string;
        outputs: string[];
        review: string;
        reviewLabel: string;
        sampleText: string;
        formats: string[];
    };
    ticker: {
        label: string;
        items: Array<{ label: string; state: string; live: boolean }>;
        notes: string[];
    };
    how: {
        title: string;
        steps: Array<[number: string, title: string, body: string]>;
    };
    split: {
        company: { tag: string; title: string; body: string; cta: string };
        talent: { tag: string; title: string; body: string; cta: string };
    };
    final: {
        title: Fragment[];
        body: string;
        post: string;
        email: string;
    };
    footer: {
        terms: string;
        privacy: string;
        status: string;
        rights: string;
        legalRequest: string;
        founder: string;
    };
    mobileCta: string;
}

export const landingCopy: Record<Locale, LandingCopy> = {
    en: {
        meta: {
            title: "KONEXA | Work together before you hire",
            description: "Start with a small remote task, agree on the deliverables and review the work. KONEXA is onboarding its first company partners.",
        },
        nav: { how: "How it works", talent: "For talent", login: "Log in", post: "Discuss a project", primary: "Primary navigation", language: "Language" },
        hero: {
            pill: "Early access · Remote projects",
            title: [[{ text: "Work together." }], [{ text: "Then decide.", strong: true }]],
            lead: "Start with a small paid project. Review the work and collaboration before deciding on the next step.",
            postCta: "Discuss a project",
            talentCta: "Join as talent",
            companyRegister: "Create a company account",
            contactNote: "Opens an email draft. No account required.",
        },
        record: {
            label: "A small project, clearly scoped",
            illustration: "Illustration / Example brief",
            title: "Adapt a campaign for three ad formats",
            meta: "Design · Remote · Two-week example",
            brief: "Adapt one campaign design for square, portrait and landscape placements. Keep the same visual identity across all three.",
            outputLabel: "What gets delivered",
            outputs: ["Three resized assets", "Editable source files", "A short handover note"],
            review: "Keep the headline readable in the portrait version. Leave more room around the call to action.",
            reviewLabel: "Example review note",
            sampleText: "A small start.",
            formats: ["Square", "Portrait", "Landscape"],
        },
        ticker: {
            label: "Operating status",
            items: [
                { label: "Company accounts", state: "registration open", live: true },
                { label: "Project posts", state: "pilot review required", live: false },
                { label: "Talent profiles", state: "registration open", live: true },
                { label: "Escrow payments", state: "in preparation", live: false },
            ],
            notes: ["Early access: contact us before committing to a paid project"],
        },
        how: {
            title: "What working together looks like.",
            steps: [
                ["01", "Agree on the brief", "Set the task, fee, deadline and review criteria before work begins."],
                ["02", "Review the deliverables", "Use the agreed checkpoints to discuss quality, communication and changes."],
                ["03", "Choose what comes next", "Continue the collaboration, discuss a role, or close the project."],
            ],
        },
        split: {
            company: { tag: "For companies", title: "Bring a task you need done.", body: "Tell us the outcome, deadline and budget you have in mind. We will discuss whether the task fits the current pilot.", cta: "Discuss a project" },
            talent: { tag: "For talent", title: "Show how you work.", body: "Build your profile around your skills, availability and work samples. We are onboarding talent for future projects.", cta: "Join as talent" },
        },
        final: {
            title: [{ text: "Start with " }, { text: "one project.", strong: true }],
            body: "Have a task in mind? Send the scope and deadline. We can discuss the next step before you register.",
            post: "Discuss a project",
            email: "Create a company account",
        },
        footer: {
            terms: "Terms",
            privacy: "Privacy",
            status: "Status",
            rights: "KONEXA",
            legalRequest: "Request a copy by email",
            founder: "Jay Yoo · Founder",
        },
        mobileCta: "Discuss a project",
    },
    ko: {
        meta: {
            title: "KONEXA | 채용 전에 먼저 함께 일해보세요",
            description: "작은 원격 업무 하나를 맡기고, 매주 실제 결과물을 확인하세요. 채용은 그다음에 결정해도 됩니다. 첫 파트너 기업을 모집 중입니다.",
        },
        nav: { how: "진행 방식", talent: "인재 참여", login: "로그인", post: "프로젝트 상담하기", primary: "주요 메뉴", language: "언어" },
        hero: {
            pill: "얼리 액세스 · 원격 프로젝트",
            title: [[{ text: "채용 전에," }], [{ text: "먼저 함께", strong: true }], [{ text: "일해보세요." }]],
            lead: "작은 유급 프로젝트의 결과물과 협업 과정을 보고, 다음 협업과 채용을 결정합니다.",
            postCta: "프로젝트 상담하기",
            talentCta: "인재로 참여하기",
            companyRegister: "기업 계정 만들기",
            contactNote: "이메일 초안이 열립니다. 가입 없이 문의할 수 있습니다.",
        },
        record: {
            label: "작게 시작하는 구체적인 업무",
            illustration: "업무 브리프 예시",
            title: "캠페인 이미지를 광고 규격 3종으로 제작",
            meta: "디자인 · 원격 · 2주 프로젝트 예시",
            brief: "캠페인 디자인 하나를 정사각형·세로형·가로형으로 조정합니다. 세 규격에 같은 시각적 정체성을 유지합니다.",
            outputLabel: "전달할 결과물",
            outputs: ["규격별 이미지 3종", "수정 가능한 원본 파일", "간단한 인수인계 안내"],
            review: "세로형에서도 제목이 잘 읽히도록 조정해 주세요. 행동 유도 문구 주변에는 여백을 더 남겨주세요.",
            reviewLabel: "검토 의견 예시",
            sampleText: "작은 시작.",
            formats: ["정사각형", "세로형", "가로형"],
        },
        ticker: {
            label: "운영 현황",
            items: [
                { label: "기업 계정", state: "가입 가능", live: true },
                { label: "프로젝트 등록", state: "파일럿 검토 필요", live: false },
                { label: "인재 프로필", state: "가입 가능", live: true },
                { label: "에스크로 결제", state: "준비 중", live: false },
            ],
            notes: ["초기 운영 단계입니다. 유료 프로젝트 진행 전 먼저 문의해 주세요."],
        },
        how: {
            title: "함께 일하는 과정을 먼저 확인하세요.",
            steps: [
                ["01", "업무 범위 합의", "시작 전에 업무, 보수, 마감일, 검토 기준을 함께 정합니다."],
                ["02", "결과물 검토", "정해진 시점에 결과물을 보고 완성도, 소통 방식, 수정 사항을 이야기합니다."],
                ["03", "다음 단계 결정", "협업을 이어가거나, 채용을 논의하거나, 프로젝트를 마무리합니다."],
            ],
        },
        split: {
            company: { tag: "기업 참여", title: "맡길 업무부터 이야기해 주세요.", body: "원하는 결과물, 마감일, 예산을 알려주세요. 현재 파일럿에 적합한 업무인지 함께 상의합니다.", cta: "프로젝트 상담하기" },
            talent: { tag: "인재 참여", title: "어떻게 일하는지 보여주세요.", body: "보유 기술, 참여 가능한 시간, 작업 사례를 프로필에 담아주세요. 향후 프로젝트를 위한 인재를 모집하고 있습니다.", cta: "인재로 참여하기" },
        },
        final: {
            title: [{ text: "프로젝트 하나로 " }, { text: "시작하세요.", strong: true }],
            body: "맡길 업무와 마감일을 알려주세요. 가입 전에 진행 방향부터 함께 상의할 수 있습니다.",
            post: "프로젝트 상담하기",
            email: "기업 계정 만들기",
        },
        footer: {
            terms: "이용약관",
            privacy: "개인정보처리방침",
            status: "서비스 상태",
            rights: "KONEXA",
            legalRequest: "이메일로 사본 요청하기",
            founder: "유재영 · 대표",
        },
        mobileCta: "프로젝트 상담하기",
    },
};
