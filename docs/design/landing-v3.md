# Landing v3.1 — project record

v3 승인: 대표 Jay Yoo, 2026-10-08 (Claude 디자인 캔버스 "KONEXA 사이트 개편안" 버전 6).
v3.1 (2026-11-12): 대표 요청으로 "AI가 만든 템플릿처럼 보이는 요소"를 걷어낸 정리 작업. 문구·흐름·섹션 순서는 v3 그대로이고 표현만 바꿨다.
범위: 랜딩(`/`), 가입 폼, 로그인 모달, `/status`의 화면 표현. 인증·결제·대시보드·API·DB·환경변수·`vercel.json` 로직은 변경하지 않는다.

## 디자인 방향

페이지 전체가 "프로젝트 기록" 한 장처럼 읽히도록 한다. 평평한 면, 가는 구분선, 표처럼 정렬된 행, 강조색 하나(mint). 장식은 정보가 있을 때만 쓴다.

## 구성 (5개 섹션)

| # | 섹션 | 배경 | 요점 |
| --- | --- | --- | --- |
| 1 | Hero | deep forest(단색) | 워드마크 `KONE[X]A`, 헤더(How it works · For talent · Log in · KO/EN · Post a project), 한 줄 라벨 "Early access · Remote projects", H1, 부제, CTA 2개, 노트, Project Record 카드(Illustration/예시 라벨) |
| 2 | 운영 현황 | deep forest | 정적 목록. Company accounts / Project posts / Talent profiles — Live, Escrow payments — In preparation |
| 3 | How it works | cream | 좌측 H2 "One project ends the hiring gamble.", 우측 번호 행 3개(01·02·03, 구분선) |
| 4 | 기업 / 인재 패널 | cream | 7:5 비대칭. 기업 = forest 면 + mint 버튼, 인재 = paper 면 + ink 버튼. 사진이 있으면 사진 + 하단 스크림 패널(높이 540px, 모바일 340px)로 바뀐다 |
| 5 | Final CTA + 푸터 | deep forest | 좌측 "Start with one project.", 우측 본문 + Post a project · Email KONEXA. 푸터 Terms · Privacy · Status · © KONEXA |

모바일: 하단 고정 CTA(프로젝트 등록하기). FAQ·리뷰·얼리버드·파트너·공개 공고 미리보기는 랜딩에서 제외했다(컴포넌트 파일은 유지).

## v3 → v3.1 에서 걷어낸 것

| v3 | v3.1 | 이유 |
| --- | --- | --- |
| 와이어프레임 지구본(자오선 회전·아크 드로잉·펄스) | 삭제. Project Record만 남김 | 정보가 없는 장식. 기록 카드는 제품이 실제로 만드는 결과물이라 남겼다 |
| 히어로 방사형 글로우, 카드 breathe·sheen, 큰 그림자 | 단색 배경, 고정 카드, 얕은 그림자 | 장식용 깊이·무한 모션 |
| 깜빡이는 점이 있는 알약 배지 | 한 줄 텍스트 라벨 | 배지 남용 |
| 무한 스크롤 티커 | 정적 운영 현황 목록 | 움직이는 띠는 읽기 어렵다. "No fake listings · No inflated numbers"는 히어로 노트와 중복이라 띠에서는 뺐다 |
| 01·02·03 동일 3열, violet 숫자 | 좌 제목 + 우 번호 행, 숫자는 success green·mono | 3열 기능 카드 패턴, 한 번만 쓰이는 두 번째 강조색 |
| 높이 540px 동일 패널 2개(사진 없이 빈 면), 알약 태그 | 7:5 비대칭 패널, 텍스트 라벨 | 빈 컨테이너, 중요도가 다른 두 대상의 동일 처리 |
| 가운데 정렬 최종 CTA | 좌 제목 / 우 본문·버튼 | 가운데 정렬 반복 |
| 알약형 버튼(radius 999), hover 시 떠오름 | radius 8px, 색만 변함 | 알약 남용, 불필요한 모션 |
| 스크롤 등장(whileInView) | 삭제 | 스크롤 트리거 효과 |
| cream 위 mint 포커스 링(거의 안 보임) | 밝은 면에서는 ink 링 | 접근성 |

가입 폼·로그인 모달·`/status`: 2rem 모서리와 큰 그림자 → 12px + 1px 테두리, 파란 Google 버튼·파란 필수 표시 → 브랜드 색, Sparkles·ShieldCheck 등 장식 아이콘 삭제, `font-black` 대문자 라벨 → 일반 라벨, 모달 배경 블러 삭제. 가입 폼 라벨의 "1분"(근거 없는 수치)은 "기업 가입 / 인재 가입"으로, "Google로 바로 시작"은 로그인 모달과 같은 "Google로 계속하기"로 맞췄다. 로직은 건드리지 않았다.

## 연결

- Post a project → `CompanyRegisterForm`, Join as talent → `StudentRegisterForm`(기존 `activeRegisterRole` 흐름).
- Log in → `AuthModal`(`type=recovery` 해시/쿼리 시 자동 오픈 유지). `onEnterApp`은 가입 성공 시 호출.
- KO/EN은 `useLocale`. 문구는 `landingCopy.ts`(KO/EN 구조 동일 — `tests/landingCopy.test.ts`가 검증).
- `<title>`과 meta description/og/twitter는 `LandingHero`가 로케일에 맞춰 갱신한다. `index.html` 정적 값은 KO·EN 병기.
- Status → `/status`(기존 라우트).

## 모션 (`motion/react` + CSS keyframes, transform·opacity만)

| 대상 | 동작 |
| --- | --- |
| 진입 | H1 줄 단위 마스크 슬라이드업(0.8s, ease `[.22,1,.36,1]`, 0.15s 간격) → 라벨·부제·CTA·노트 rise(16px→0). 카드는 페이드 + 16px rise |
| 프로젝트 기록 | 행 3개가 순서대로 한 번 체크되고 진행바가 한 번 채워진 뒤 멈춘다. 마지막 행(최종 결정)은 빈 원으로 남는다 |

- 무한 반복 애니메이션은 없다(`tests/browser/landing.spec.ts`가 검증).
- `prefers-reduced-motion`: 진입·기록 애니메이션을 모두 생략하고 완료 상태를 바로 보여준다.

## 디자인 토큰

`CLAUDE.md` 표 참고. 폰트는 기존 스택 유지(웹폰트 추가 없음 → 성능 영향 없음).

## 사진

`landingPhotos.ts`가 비어 있으면 텍스트 패널(forest / paper)로 렌더링한다. 사진을 넣으면 해당 패널만 사진 패널로 바뀐다. 추가 절차와 출처 기록은 `photo-credits.md`.

## 수용 기준 확인 방법

- `npm run lint` · `npm test` · `npm run build` · `npx playwright test`
- `tests/browser/landing.spec.ts`: 360·390·768·1440px × EN/KO에서 가로 스크롤 0, 터치 타깃 ≥44px, 콘솔 에러 0, CTA→가입 폼, KO/EN 전환·메타, 모바일 CTA, reduced-motion, 무한 반복 애니메이션 0, 운영 현황 항목, 근거 없는 수치 없음.
- 배포 후: `/` 와 `/api/health/ready`.

## 알려진 제한

- 사진 미추가 — 이 작업 환경에서 Unsplash/Pexels가 네트워크 정책으로 막혀 있다. 텍스트 패널로 배포.
- 공개 Terms/Privacy 페이지가 저장소에 없다. 푸터의 Terms·Privacy는 `konexa.corp@gmail.com` 으로 사본을 요청하는 메일 링크다. 정식 페이지가 생기면 `LandingHero.tsx`의 `legalHref` 를 해당 경로로 교체한다.
- 대시보드(로그인 후 화면)는 이번 정리 범위가 아니다. `rounded-3xl`·`rounded-2xl` 카드가 많이 남아 있어 별도 작업으로 다룬다.

## 전후 캡처

`docs/design/landing-v3.1/` — `before-en-1440.png`, `before-ko-390.png`, `after-en-1440.png`, `after-ko-390.png`, `after-company-form-en-1440.png`, `after-status-1440.png`.
