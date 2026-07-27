import type { Locale } from "../i18n/LocaleContext";

export interface LocalizedOption {
  value: string;
  ko: string;
  vi: string;
}

export interface RoleGroup {
  id: string;
  label: Record<Locale, string>;
  roles: LocalizedOption[];
}

export function optionLabel(option: LocalizedOption, locale: Locale) {
  if (locale === "ko") return option.ko;
  if (locale === "vi") return option.vi;
  return option.value;
}

export const ROLE_GROUPS: RoleGroup[] = [
  {
    id: "digital",
    label: { ko: "디지털·데이터", en: "Digital & Data", vi: "Số hóa & Dữ liệu" },
    roles: [
      { value: "Software Engineering", ko: "소프트웨어 엔지니어링", vi: "Kỹ thuật phần mềm" },
      { value: "Web & Mobile Development", ko: "웹·모바일 개발", vi: "Phát triển web & di động" },
      { value: "Data Analysis & Business Intelligence", ko: "데이터 분석·BI", vi: "Phân tích dữ liệu & BI" },
      { value: "AI & Machine Learning", ko: "AI·머신러닝", vi: "AI & Học máy" },
      { value: "Cloud, Infrastructure & DevOps", ko: "클라우드·인프라·DevOps", vi: "Đám mây, hạ tầng & DevOps" },
      { value: "Cybersecurity", ko: "정보보안", vi: "An ninh mạng" },
      { value: "Product Management", ko: "프로덕트 매니지먼트", vi: "Quản lý sản phẩm" },
      { value: "QA & Software Testing", ko: "QA·소프트웨어 테스트", vi: "QA & Kiểm thử phần mềm" },
      { value: "Game, XR & Interactive Technology", ko: "게임·XR·인터랙티브 기술", vi: "Game, XR & Công nghệ tương tác" },
    ],
  },
  {
    id: "engineering",
    label: { ko: "공학·제조", en: "Engineering & Manufacturing", vi: "Kỹ thuật & Sản xuất" },
    roles: [
      { value: "Mechanical Engineering", ko: "기계공학", vi: "Kỹ thuật cơ khí" },
      { value: "Electrical & Electronics Engineering", ko: "전기·전자공학", vi: "Kỹ thuật điện & điện tử" },
      { value: "Semiconductor Engineering", ko: "반도체 엔지니어링", vi: "Kỹ thuật bán dẫn" },
      { value: "Robotics & Automation", ko: "로봇·자동화", vi: "Robot & Tự động hóa" },
      { value: "Automotive & Mobility Engineering", ko: "자동차·모빌리티 공학", vi: "Kỹ thuật ô tô & di chuyển" },
      { value: "Shipbuilding & Marine Engineering", ko: "조선·해양공학", vi: "Đóng tàu & Kỹ thuật hàng hải" },
      { value: "Aerospace Engineering", ko: "항공우주공학", vi: "Kỹ thuật hàng không vũ trụ" },
      { value: "Chemical, Battery & Materials Engineering", ko: "화학·배터리·소재공학", vi: "Kỹ thuật hóa, pin & vật liệu" },
      { value: "Industrial, Process & Safety Engineering", ko: "산업·공정·안전공학", vi: "Kỹ thuật công nghiệp, quy trình & an toàn" },
      { value: "Manufacturing, Production & Quality", ko: "생산·제조·품질관리", vi: "Sản xuất & Quản lý chất lượng" },
    ],
  },
  {
    id: "business",
    label: { ko: "비즈니스·무역", en: "Business & Trade", vi: "Kinh doanh & Thương mại" },
    roles: [
      { value: "Strategy & Business Operations", ko: "전략·사업운영", vi: "Chiến lược & Vận hành kinh doanh" },
      { value: "Finance & Accounting", ko: "재무·회계", vi: "Tài chính & Kế toán" },
      { value: "Banking, Investment & Insurance", ko: "금융·투자·보험", vi: "Ngân hàng, đầu tư & bảo hiểm" },
      { value: "Human Resources & Recruiting", ko: "인사·채용", vi: "Nhân sự & Tuyển dụng" },
      { value: "Sales & Business Development", ko: "영업·사업개발", vi: "Kinh doanh & Phát triển đối tác" },
      { value: "Overseas Sales, Trade & Market Entry", ko: "해외영업·무역·시장진출", vi: "Kinh doanh quốc tế, thương mại & gia nhập thị trường" },
      { value: "Procurement & Supply Chain", ko: "구매·공급망", vi: "Thu mua & Chuỗi cung ứng" },
      { value: "Logistics & Transportation", ko: "물류·운송", vi: "Logistics & Vận tải" },
      { value: "Customer Success & Support", ko: "고객성공·고객지원", vi: "Thành công & Hỗ trợ khách hàng" },
      { value: "Legal, Policy & Compliance", ko: "법무·정책·컴플라이언스", vi: "Pháp lý, chính sách & tuân thủ" },
    ],
  },
  {
    id: "creative",
    label: { ko: "디자인·콘텐츠", en: "Design & Content", vi: "Thiết kế & Nội dung" },
    roles: [
      { value: "UI/UX & Service Design", ko: "UI/UX·서비스 디자인", vi: "UI/UX & Thiết kế dịch vụ" },
      { value: "Graphic & Brand Design", ko: "그래픽·브랜드 디자인", vi: "Thiết kế đồ họa & thương hiệu" },
      { value: "Product & Industrial Design", ko: "제품·산업 디자인", vi: "Thiết kế sản phẩm & công nghiệp" },
      { value: "Content, Video & Media Production", ko: "콘텐츠·영상·미디어 제작", vi: "Sản xuất nội dung, video & truyền thông" },
      { value: "Advertising, PR & Digital Marketing", ko: "광고·PR·디지털 마케팅", vi: "Quảng cáo, PR & Marketing số" },
      { value: "Fashion & Textile Design", ko: "패션·섬유 디자인", vi: "Thiết kế thời trang & dệt may" },
      { value: "Culture, Arts & Entertainment", ko: "문화·예술·엔터테인먼트", vi: "Văn hóa, nghệ thuật & giải trí" },
    ],
  },
  {
    id: "science",
    label: { ko: "과학·교육·헬스", en: "Science, Education & Health", vi: "Khoa học, Giáo dục & Sức khỏe" },
    roles: [
      { value: "Biotechnology & Life Science", ko: "바이오·생명과학", vi: "Công nghệ sinh học & Khoa học sự sống" },
      { value: "Food Science & Nutrition", ko: "식품과학·영양", vi: "Khoa học thực phẩm & Dinh dưỡng" },
      { value: "Environment, Energy & Sustainability", ko: "환경·에너지·지속가능성", vi: "Môi trường, năng lượng & phát triển bền vững" },
      { value: "Research & R&D", ko: "연구·R&D", vi: "Nghiên cứu & R&D" },
      { value: "Healthcare Operations & Medical Coordination", ko: "헬스케어 운영·의료 코디네이션", vi: "Vận hành y tế & Điều phối chăm sóc sức khỏe" },
      { value: "Education & Training", ko: "교육·훈련", vi: "Giáo dục & Đào tạo" },
      { value: "Translation, Interpretation & Localization", ko: "번역·통역·현지화", vi: "Biên dịch, phiên dịch & bản địa hóa" },
    ],
  },
  {
    id: "built_service",
    label: { ko: "건설·서비스·숙련기술", en: "Built Environment, Service & Skilled Work", vi: "Xây dựng, Dịch vụ & Kỹ thuật lành nghề" },
    roles: [
      { value: "Architecture & Urban Planning", ko: "건축·도시계획", vi: "Kiến trúc & Quy hoạch đô thị" },
      { value: "Civil & Construction Engineering", ko: "토목·건설공학", vi: "Kỹ thuật xây dựng & dân dụng" },
      { value: "Hospitality & Hotel Operations", ko: "호텔·호스피탈리티 운영", vi: "Vận hành khách sạn & dịch vụ lưu trú" },
      { value: "Tourism & Event Management", ko: "관광·이벤트 운영", vi: "Du lịch & Quản lý sự kiện" },
      { value: "Culinary & Food Service", ko: "조리·외식서비스", vi: "Ẩm thực & Dịch vụ ăn uống" },
      { value: "Agriculture, Fisheries & Smart Farm", ko: "농수산·스마트팜", vi: "Nông nghiệp, thủy sản & trang trại thông minh" },
      { value: "Skilled Manufacturing & Technician", ko: "숙련 제조·기술직", vi: "Kỹ thuật viên & sản xuất lành nghề" },
      { value: "Welding, Metalwork & Mold Technology", ko: "용접·금속·금형 기술", vi: "Hàn, kim loại & công nghệ khuôn mẫu" },
      { value: "Electrical, Facility & Maintenance Technician", ko: "전기·설비·유지보수 기술", vi: "Kỹ thuật điện, cơ sở vật chất & bảo trì" },
      { value: "Care Services & Social Welfare", ko: "돌봄서비스·사회복지", vi: "Dịch vụ chăm sóc & phúc lợi xã hội" },
    ],
  },
];

export const COUNTRY_OPTIONS: LocalizedOption[] = [
  { value: "South Korea", ko: "대한민국", vi: "Hàn Quốc" },
  { value: "Vietnam", ko: "베트남", vi: "Việt Nam" },
  { value: "United States", ko: "미국", vi: "Hoa Kỳ" },
  { value: "Canada", ko: "캐나다", vi: "Canada" },
  { value: "Japan", ko: "일본", vi: "Nhật Bản" },
  { value: "China", ko: "중국", vi: "Trung Quốc" },
  { value: "Singapore", ko: "싱가포르", vi: "Singapore" },
  { value: "Thailand", ko: "태국", vi: "Thái Lan" },
  { value: "Indonesia", ko: "인도네시아", vi: "Indonesia" },
  { value: "Philippines", ko: "필리핀", vi: "Philippines" },
  { value: "India", ko: "인도", vi: "Ấn Độ" },
  { value: "Australia", ko: "호주", vi: "Úc" },
  { value: "Europe", ko: "유럽", vi: "Châu Âu" },
  { value: "Other", ko: "기타", vi: "Khác" },
];

export const INDUSTRY_OPTIONS: LocalizedOption[] = [
  { value: "IT, SaaS & AI", ko: "IT·SaaS·AI", vi: "IT, SaaS & AI" },
  { value: "Semiconductor & Electronics", ko: "반도체·전자", vi: "Bán dẫn & Điện tử" },
  { value: "Automotive & Mobility", ko: "자동차·모빌리티", vi: "Ô tô & Di chuyển" },
  { value: "Robotics & Automation", ko: "로봇·자동화", vi: "Robot & Tự động hóa" },
  { value: "Machinery & Industrial Equipment", ko: "기계·산업장비", vi: "Máy móc & Thiết bị công nghiệp" },
  { value: "Shipbuilding & Marine", ko: "조선·해양", vi: "Đóng tàu & Hàng hải" },
  { value: "Aerospace & Defense", ko: "항공우주·방산", vi: "Hàng không vũ trụ & Quốc phòng" },
  { value: "Chemical, Materials & Battery", ko: "화학·소재·배터리", vi: "Hóa chất, vật liệu & pin" },
  { value: "Bio, Pharma & Healthcare", ko: "바이오·제약·헬스케어", vi: "Sinh học, dược phẩm & y tế" },
  { value: "Food, Foodtech & Nutrition", ko: "식품·푸드테크·영양", vi: "Thực phẩm, foodtech & dinh dưỡng" },
  { value: "Manufacturing", ko: "제조업", vi: "Sản xuất" },
  { value: "Construction, Architecture & Real Estate", ko: "건설·건축·부동산", vi: "Xây dựng, kiến trúc & bất động sản" },
  { value: "Energy, Environment & Climate", ko: "에너지·환경·기후", vi: "Năng lượng, môi trường & khí hậu" },
  { value: "Logistics & Supply Chain", ko: "물류·공급망", vi: "Logistics & Chuỗi cung ứng" },
  { value: "Trade, Export & Import", ko: "무역·수출입", vi: "Thương mại, xuất khẩu & nhập khẩu" },
  { value: "Finance, Fintech & Insurance", ko: "금융·핀테크·보험", vi: "Tài chính, fintech & bảo hiểm" },
  { value: "Commerce, Retail & Consumer", ko: "커머스·유통·소비재", vi: "Thương mại, bán lẻ & tiêu dùng" },
  { value: "Hospitality, Tourism & F&B", ko: "호텔·관광·외식", vi: "Khách sạn, du lịch & F&B" },
  { value: "Media, Content & Games", ko: "미디어·콘텐츠·게임", vi: "Truyền thông, nội dung & game" },
  { value: "Marketing, Advertising & Design", ko: "마케팅·광고·디자인", vi: "Marketing, quảng cáo & thiết kế" },
  { value: "Education, Edtech & Research", ko: "교육·에듀테크·연구", vi: "Giáo dục, edtech & nghiên cứu" },
  { value: "Agriculture, Fisheries & Smart Farm", ko: "농수산·스마트팜", vi: "Nông nghiệp, thủy sản & smart farm" },
  { value: "Professional & Business Services", ko: "전문·비즈니스 서비스", vi: "Dịch vụ chuyên môn & doanh nghiệp" },
  { value: "Care & Social Services", ko: "돌봄·사회서비스", vi: "Chăm sóc & dịch vụ xã hội" },
  { value: "Public, Association & Nonprofit", ko: "공공·협회·비영리", vi: "Công, hiệp hội & phi lợi nhuận" },
  { value: "Other", ko: "기타", vi: "Khác" },
];

export const CAPABILITY_OPTIONS: LocalizedOption[] = [
  { value: "Software Development", ko: "소프트웨어 개발", vi: "Phát triển phần mềm" },
  { value: "Data & AI", ko: "데이터·AI", vi: "Dữ liệu & AI" },
  { value: "Cloud & Cybersecurity", ko: "클라우드·보안", vi: "Đám mây & An ninh mạng" },
  { value: "CAD, CAE & Engineering Tools", ko: "CAD·CAE·공학 도구", vi: "CAD, CAE & Công cụ kỹ thuật" },
  { value: "Electronics & Embedded Systems", ko: "전자·임베디드", vi: "Điện tử & Hệ thống nhúng" },
  { value: "Robotics & Automation", ko: "로봇·자동화", vi: "Robot & Tự động hóa" },
  { value: "Manufacturing & Quality", ko: "생산·품질", vi: "Sản xuất & Chất lượng" },
  { value: "Research & Experiment Design", ko: "연구·실험 설계", vi: "Nghiên cứu & Thiết kế thí nghiệm" },
  { value: "Financial Analysis & Accounting", ko: "재무분석·회계", vi: "Phân tích tài chính & Kế toán" },
  { value: "Sales & Business Development", ko: "영업·사업개발", vi: "Kinh doanh & Phát triển đối tác" },
  { value: "Market Research & Strategy", ko: "시장조사·전략", vi: "Nghiên cứu thị trường & Chiến lược" },
  { value: "Trade & Export Operations", ko: "무역·수출 운영", vi: "Thương mại & Vận hành xuất khẩu" },
  { value: "Procurement & Supply Chain", ko: "구매·공급망", vi: "Thu mua & Chuỗi cung ứng" },
  { value: "Project & Operations Management", ko: "프로젝트·운영 관리", vi: "Quản lý dự án & vận hành" },
  { value: "HR & Recruiting", ko: "인사·채용", vi: "Nhân sự & Tuyển dụng" },
  { value: "UI/UX & Service Design", ko: "UI/UX·서비스 디자인", vi: "UI/UX & Thiết kế dịch vụ" },
  { value: "Graphic & Brand Design", ko: "그래픽·브랜드 디자인", vi: "Thiết kế đồ họa & thương hiệu" },
  { value: "Video & Content Production", ko: "영상·콘텐츠 제작", vi: "Sản xuất video & nội dung" },
  { value: "Digital Marketing & PR", ko: "디지털 마케팅·PR", vi: "Digital marketing & PR" },
  { value: "Writing & Documentation", ko: "문서작성·기술문서", vi: "Viết & tài liệu hóa" },
  { value: "Translation & Localization", ko: "번역·현지화", vi: "Biên dịch & Bản địa hóa" },
  { value: "Customer Support & Success", ko: "고객지원·고객성공", vi: "Hỗ trợ & Thành công khách hàng" },
  { value: "Education & Training", ko: "교육·훈련", vi: "Giáo dục & Đào tạo" },
  { value: "Hospitality & Service Operations", ko: "호텔·서비스 운영", vi: "Vận hành khách sạn & dịch vụ" },
  { value: "Construction & Field Engineering", ko: "건설·현장 엔지니어링", vi: "Xây dựng & Kỹ thuật hiện trường" },
  { value: "Skilled Technical Work", ko: "숙련 기술", vi: "Kỹ thuật lành nghề" },
  { value: "Korean", ko: "한국어", vi: "Tiếng Hàn" },
  { value: "English", ko: "영어", vi: "Tiếng Anh" },
  { value: "Vietnamese", ko: "베트남어", vi: "Tiếng Việt" },
  { value: "Chinese", ko: "중국어", vi: "Tiếng Trung" },
  { value: "Japanese", ko: "일본어", vi: "Tiếng Nhật" },
];

export const LANGUAGE_OPTIONS: LocalizedOption[] = [
  { value: "Korean", ko: "한국어", vi: "Tiếng Hàn" },
  { value: "English", ko: "영어", vi: "Tiếng Anh" },
  { value: "Vietnamese", ko: "베트남어", vi: "Tiếng Việt" },
  { value: "Chinese", ko: "중국어", vi: "Tiếng Trung" },
  { value: "Japanese", ko: "일본어", vi: "Tiếng Nhật" },
  { value: "Thai", ko: "태국어", vi: "Tiếng Thái" },
  { value: "Indonesian", ko: "인도네시아어", vi: "Tiếng Indonesia" },
  { value: "French", ko: "프랑스어", vi: "Tiếng Pháp" },
  { value: "German", ko: "독일어", vi: "Tiếng Đức" },
  { value: "Spanish", ko: "스페인어", vi: "Tiếng Tây Ban Nha" },
];

export const EMPLOYMENT_TYPE_OPTIONS: LocalizedOption[] = [
  { value: "Project / Freelance", ko: "프로젝트·프리랜서", vi: "Dự án / Freelance" },
  { value: "Internship", ko: "인턴십", vi: "Thực tập" },
  { value: "Part-time", ko: "파트타임", vi: "Bán thời gian" },
  { value: "Fixed-term", ko: "기간제", vi: "Hợp đồng có thời hạn" },
  { value: "Full-time", ko: "정규직", vi: "Toàn thời gian" },
  { value: "Trial project to hire", ko: "프로젝트 후 채용", vi: "Dự án thử trước khi tuyển dụng" },
];

export const VISA_STATUS_OPTIONS: LocalizedOption[] = [
  { value: "Overseas - Korean work visa needed", ko: "해외 거주 · 한국 취업비자 필요", vi: "Đang ở nước ngoài · cần visa làm việc tại Hàn Quốc" },
  { value: "D-2 international student", ko: "D-2 유학생", vi: "Du học sinh D-2" },
  { value: "D-10 job seeker", ko: "D-10 구직자", vi: "Người tìm việc D-10" },
  { value: "E-7 holder or extension needed", ko: "E-7 보유·연장 필요", vi: "Đang có hoặc cần gia hạn E-7" },
  { value: "Other Korean residence status", ko: "기타 국내 체류자격 보유", vi: "Đang có diện cư trú khác tại Hàn Quốc" },
  { value: "Not sure yet", ko: "아직 잘 모르겠음", vi: "Chưa chắc chắn" },
];

export const COMPANY_VISA_SUPPORT_OPTIONS: LocalizedOption[] = [
  { value: "D-2 student opportunities", ko: "D-2 유학생 참여 가능 업무 검토", vi: "Xem xét cơ hội phù hợp cho du học sinh D-2" },
  { value: "D-10 job seekers", ko: "D-10 구직자 채용 검토", vi: "Xem xét ứng viên D-10" },
  { value: "E-7 pre-eligibility review", ko: "E-7 사전 적합성 검토", vi: "Đánh giá sơ bộ khả năng E-7" },
  { value: "E-7 sponsorship possible", ko: "요건 충족 시 E-7 고용·체류 지원 검토", vi: "Có thể xem xét hỗ trợ E-7 khi đủ điều kiện" },
  { value: "Korea-based status holders only", ko: "현재 국내 취업 가능자만", vi: "Chỉ ứng viên hiện được phép làm việc tại Hàn Quốc" },
  { value: "Discuss case by case", ko: "지원 방식 개별 협의", vi: "Trao đổi theo từng trường hợp" },
];
