export const COMPLIANCE_VERSION = "2026-07-15";

export const providerPlan = {
  paymentOrchestration: "PortOne V2",
  pgEscrowCandidate: "KG이니시스 에스크로(가맹점 사전계약 및 서비스형 거래 지원 확인 필요)",
  identityVerification: "PortOne V2 본인인증",
  electronicSignature: "모두싸인 API",
  fundCustodyRule: "KONEXA는 고객 자금을 직접 보관하지 않고 PG/에스크로 거래 상태만 기록",
} as const;

export const contactReleaseStages = [
  { label: "탐색", detail: "직무·전공·학년·기술·언어·검증점수·수행평가만 공개", state: "연락처 비공개" },
  { label: "소개 요청", detail: "기업 확인 및 별도 이탈거래 약정 동의", state: "연락처 비공개" },
  { label: "계약·결제", detail: "양측 전자서명과 등록 PG의 대금 확보 확인", state: "공개 자격 확인" },
  { label: "협업", detail: "계약 당사자에게 필요한 범위의 연락처만 공개", state: "감사기록 유지" },
] as const;

export const platformBenefits = [
  "등록 PG/에스크로를 통한 대금보호 및 단계별 정산",
  "표준 프로젝트 계약·NDA·지식재산권 이전 기록",
  "업무범위·변경요청·검수기간 관리",
  "분쟁 접수와 관리자 조정 기록",
  "대체 인재 및 커뮤니케이션 지원",
  "검증된 거래의 상호평가",
  "플랫폼 완료 프로젝트의 Work Passport 반영",
  "채용 후 90일 재추천 크레딧 정책",
  "E-7 직무·전공 사전 적합성 점검",
  "결제·정산·송금 증빙 보관",
] as const;

export const contractDocuments = [
  {
    title: "플랫폼 이용약관",
    purpose: "계정, 금지행위, 메시지 분석, 플랫폼 책임 범위",
    clauses: [
      "회원가입 시 최신 약관 버전과 동의시각을 감사기록으로 보관합니다.",
      "프로젝트 진행 중 플랫폼 밖 계약·결제와 계약 전 연락처 교환을 금지합니다.",
      "연락처 패턴 탐지 목적·범위·보유기록을 고지하고 메시지 원문은 위험기록에 복사하지 않습니다.",
      "본인·학력·사업자 정보의 허위 제출, 평가 조작, 보복 리뷰, 관계회사·제3자를 통한 우회를 금지합니다.",
      "플랫폼 밖 거래에는 대금보호·분쟁조정·대체인재·Work Passport 등 플랫폼 보호가 적용되지 않습니다.",
      "법령상 강행규정, 신고·수사 협조, 개인정보 권리와 분쟁 절차를 우선 적용합니다.",
    ],
  },
  {
    title: "기업용 프로젝트 계약서",
    purpose: "범위, 마일스톤, 선결제, 검수, 변경요청, 지식재산권",
    clauses: [
      "포함 결과물·제외 업무·주당 예상시간·수정 횟수·검수기간을 프로젝트별로 확정합니다.",
      "월 비용은 등록 PG/에스크로로 100% 선결제하고 미확보 시 업무를 시작하거나 계속하지 않습니다.",
      "추가 업무는 변경요청서와 추가금액 승인 후 착수하며 기업 자료 지연만큼 일정이 자동 연장됩니다.",
      "출퇴근·휴가·전속근무 등 인사명령을 금지하고 결과물 중심으로 요청합니다.",
      "NDA와 최소권한을 적용하고 운영서버·민감정보 접근은 별도 승인과 종료 시 회수기록을 남깁니다.",
      "대금 완납 후 새 결과물 권리를 이전하되 기존 저작물·오픈소스·AI 산출물은 별도 목록으로 관리합니다.",
    ],
  },
  {
    title: "인재용 프로젝트 참여계약서",
    purpose: "결과물, 일정, 보안, AI·오픈소스 공개, 중도이탈 절차",
    clauses: [
      "결과물·마일스톤·주간 보고·검수 대응과 합의된 수정 횟수를 준수합니다.",
      "AI 사용 범위, 외부 자료, 오픈소스 라이선스와 기존 포트폴리오 자산을 사전에 공개합니다.",
      "기업정보를 최소 범위로 처리하고 재사용·외부반출을 금지하며 종료 즉시 접근권한과 사본을 정리합니다.",
      "중도이탈 사유를 즉시 통지하고 인수인계에 협조하며 학생에게 정액 거액 위약금을 부과하지 않습니다.",
      "플랫폼 안에서 확인된 결과물 제출·평가만 Work Passport 경력으로 반영합니다.",
      "분쟁·안전·부당지시가 있으면 업무를 확대하지 않고 KONEXA 관리자 절차로 신고합니다.",
    ],
  },
  {
    title: "채용전환·소개요금 약정서",
    purpose: "12개월 전환수수료, 기존 인연 예외, 관계회사·우회계약 신고",
    clauses: [
      "KONEXA 최초 소개일로부터 12개월 이내 채용·용역·프리랜서·우회계약 체결 사실을 기업이 신고합니다.",
      "기업 관계회사·대표자 개인·외주업체·제3자를 통한 계약도 동일한 전환으로 봅니다.",
      "직접채용 소개요금 기준은 연봉의 10%이며 프로젝트 관리수수료 50%, 최대 100만원을 공제합니다.",
      "프리랜서·용역 전환은 실제 정상 플랫폼 수수료 범위에서 계약금액의 15~20% 기준을 개별 견적합니다.",
      "소개 전 기존 인연을 객관적으로 증빙하거나 독립 공개채용 지원으로 확인되면 예외 심사합니다.",
      "소개요금은 근로계약 체결 이후 관련 법령·고시와 확정 계약서에 따라 청구하며 과도한 벌금으로 운영하지 않습니다.",
    ],
  },
] as const;

export const feePolicy = {
  directHireRate: 0.1,
  freelanceRateMin: 0.15,
  freelanceRateMax: 0.2,
  conversionWindowMonths: 12,
  projectFeeCreditRate: 0.5,
  projectFeeCreditCapKrw: 1_000_000,
} as const;

export const legalSources = [
  { label: "민법 제398조", href: "https://www.law.go.kr/lsLinkProc.do?efYd=20151210&joNo=039800&lnkJoNo=undefined&lsClsCd=L&lsId=prec20151210&lsNm=%EB%AF%BC%EB%B2%95&mode=11" },
  { label: "개인정보 보호법 제28조의8", href: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=182205" },
  { label: "직업안정법 제19조", href: "https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1024682579" },
  { label: "전자금융거래법", href: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=1026222563" },
] as const;

export const riskRules = [
  { code: "CONTACT_PATTERN", label: "계약 전 연락처·SNS 패턴", action: "전송 경고 및 최소 메타데이터 감사기록" },
  { code: "RELATIONSHIP_CANCELLED", label: "소개·프로젝트 취소", action: "반복 횟수와 양측 활동일 비교" },
  { code: "DUAL_ACCOUNT_EXIT", label: "취소 직후 양측 계정 종료", action: "관리자 수동 검토" },
  { code: "OUTCOME_CHECK_OVERDUE", label: "채용결과 확인 기한 초과", action: "기업·인재 확인 요청" },
] as const;

export const privacyNotice =
  "KONEXA는 계약 전 연락처 공유를 줄이고 플랫폼 안전을 확보하기 위해 메시지에서 전화번호·이메일·일부 SNS 식별자 패턴을 탐지합니다. 위험기록에는 원문을 복사하지 않고 패턴 종류와 관련 기록 ID만 남깁니다. 한국과 해외 간 개인정보 이전이 발생하는 경우 이전 국가·수탁자·목적·항목·보유기간·거부 방법을 개인정보처리방침과 별도 동의 화면에 표시해야 합니다.";
