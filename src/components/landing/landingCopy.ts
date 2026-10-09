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
        note: string;
    };
    record: {
        label: string;
        illustration: string;
        title: string;
        meta: string;
        progress: string;
        rows: Array<[label: string, state: string]>;
        escrowLabel: string;
        escrowState: string;
        globeLabel: string;
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
        company: { tag: string; title: string; cta: string };
        talent: { tag: string; title: string; cta: string };
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
    };
    mobileCta: string;
}

export const landingCopy: Record<Locale, LandingCopy> = {
    en: {
        meta: {
            title: "KONEXA | Hire after one real project",
            description: "Scope one small remote task, review real work every week, and decide with evidence — not a résumé. KONEXA is onboarding its first company partners.",
        },
        nav: { how: "How it works", talent: "For talent", login: "Log in", post: "Post a project", primary: "Primary navigation", language: "Language" },
        hero: {
            pill: "Early access · Remote projects",
            title: [[{ text: "Hire after" }], [{ text: "one real project.", strong: true }]],
            lead: "Scope one small remote task. Review real work every week. Decide with evidence — not a résumé.",
            postCta: "Post a project",
            talentCta: "Join as talent",
            note: "Now onboarding our first company partners. No fake listings. No inflated numbers.",
        },
        record: {
            label: "Project record",
            illustration: "Illustration",
            title: "Launch asset resize",
            meta: "1 set · Remote · 2 weeks · English brief",
            progress: "Project progress",
            rows: [
                ["Scope agreed", "Both sides"],
                ["Week 1 deliverable", "Reviewed"],
                ["Week 2 deliverable", "Reviewed"],
                ["Your decision", "Extend · Hire · Close"],
            ],
            escrowLabel: "Escrow payments",
            escrowState: "In preparation",
            globeLabel: "Illustration of a wireframe globe connecting remote collaborators",
        },
        ticker: {
            label: "Operating status",
            items: [
                { label: "Company accounts", state: "live", live: true },
                { label: "Project posts", state: "live", live: true },
                { label: "Talent profiles", state: "live", live: true },
                { label: "Escrow payments", state: "in preparation", live: false },
            ],
            notes: ["No fake listings", "No inflated numbers"],
        },
        how: {
            title: "One project ends the hiring gamble.",
            steps: [
                ["01", "Scope it", "One task, weekly deliverables, and how you will review them."],
                ["02", "See the work", "Real deliverables each week, checked against what you agreed."],
                ["03", "Decide", "Extend, make a hiring offer, or close — on evidence."],
            ],
        },
        split: {
            company: { tag: "For companies", title: "Get one task done. Meet who did it.", cta: "Post a project" },
            talent: { tag: "For talent", title: "Turn real project work into proof.", cta: "Join as talent" },
        },
        final: {
            title: [{ text: "Start with " }, { text: "one project.", strong: true }],
            body: "Tell us the task. We will help you shape the brief.",
            post: "Post a project",
            email: "Email KONEXA",
        },
        footer: {
            terms: "Terms",
            privacy: "Privacy",
            status: "Status",
            rights: "KONEXA",
            legalRequest: "Request a copy by email",
        },
        mobileCta: "Post a project",
    },
    ko: {
        meta: {
            title: "KONEXA | 프로젝트 하나로 결정하는 채용",
            description: "작은 원격 업무 하나를 맡기고, 매주 실제 결과물을 확인하세요. 채용은 그다음에 결정해도 됩니다. 첫 파트너 기업을 모집 중입니다.",
        },
        nav: { how: "진행 방식", talent: "인재 참여", login: "로그인", post: "프로젝트 등록하기", primary: "주요 메뉴", language: "언어" },
        hero: {
            pill: "얼리 액세스 · 원격 프로젝트",
            title: [[{ text: "이력서 말고," }], [{ text: "프로젝트 하나로", strong: true }], [{ text: "결정하세요." }]],
            lead: "작은 원격 업무 하나를 맡기고, 매주 실제 결과물을 확인하세요. 채용은 그다음에 결정해도 됩니다.",
            postCta: "프로젝트 등록하기",
            talentCta: "인재로 참여하기",
            note: "첫 파트너 기업을 모집 중입니다. 가짜 공고·부풀린 숫자는 없습니다.",
        },
        record: {
            label: "프로젝트 기록",
            illustration: "예시",
            title: "런치 에셋 리사이즈",
            meta: "1세트 · 원격 · 2주 · 영문 브리프",
            progress: "프로젝트 진행률",
            rows: [
                ["범위 합의", "양측 확인"],
                ["1주차 결과물", "검토 완료"],
                ["2주차 결과물", "검토 완료"],
                ["최종 결정", "연장 · 채용 · 종료"],
            ],
            escrowLabel: "에스크로 결제",
            escrowState: "준비 중",
            globeLabel: "원격 협업자를 잇는 와이어프레임 지구본 일러스트",
        },
        ticker: {
            label: "운영 현황",
            items: [
                { label: "기업 계정", state: "운영 중", live: true },
                { label: "프로젝트 등록", state: "운영 중", live: true },
                { label: "인재 프로필", state: "운영 중", live: true },
                { label: "에스크로 결제", state: "준비 중", live: false },
            ],
            notes: ["가짜 공고 없음", "부풀린 숫자 없음"],
        },
        how: {
            title: "프로젝트 하나로 채용 도박을 끝내세요.",
            steps: [
                ["01", "정하기", "작은 업무 하나, 주차별 결과물, 그리고 검토 방식을 먼저 정합니다."],
                ["02", "확인하기", "매주 실제 결과물을 합의한 기준에 맞춰 확인합니다."],
                ["03", "결정하기", "연장할지, 채용을 제안할지, 종료할지 — 근거를 보고 결정합니다."],
            ],
        },
        split: {
            company: { tag: "기업을 위해", title: "업무 하나를 맡기고, 해낸 사람을 만나보세요.", cta: "프로젝트 등록하기" },
            talent: { tag: "인재를 위해", title: "실제 프로젝트 경험을 증거로 바꾸세요.", cta: "인재로 참여하기" },
        },
        final: {
            title: [{ text: "프로젝트 하나로 " }, { text: "시작하세요.", strong: true }],
            body: "맡길 업무를 알려주세요. 브리프 정리를 함께 도와드립니다.",
            post: "프로젝트 등록하기",
            email: "KONEXA에 이메일 보내기",
        },
        footer: {
            terms: "이용약관",
            privacy: "개인정보처리방침",
            status: "서비스 상태",
            rights: "KONEXA",
            legalRequest: "이메일로 사본 요청하기",
        },
        mobileCta: "프로젝트 등록하기",
    },
};
