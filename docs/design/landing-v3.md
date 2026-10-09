# Landing v3 — short, impact, motion

승인: 대표 Jay Yoo, 2026-10-08 (Claude 디자인 캔버스 "KONEXA 사이트 개편안" 버전 6: 데스크톱 EN + 모바일 KO).
범위: 랜딩(`/`)만. 인증·결제·대시보드·API·DB·환경변수·`vercel.json`은 변경하지 않는다.

## 구성 (5개 섹션)

| # | 섹션 | 배경 | 요점 |
| --- | --- | --- | --- |
| 1 | Hero | deep forest | 워드마크 `KONE[X]A`, 헤더(How it works · For talent · Log in · KO/EN · Post a project), pill "EARLY ACCESS · REMOTE PROJECTS", H1, 부제, CTA 2개, 노트, SVG 지구본 + Project Record 카드(Illustration/예시 라벨) |
| 2 | 운영 현황 티커 | forest | Company accounts / Project posts / Talent profiles — live, Escrow payments — in preparation, No fake listings, No inflated numbers |
| 3 | How it works | cream | "One project ends the hiring gamble." Scope it · See the work · Decide (01·02·03 violet) |
| 4 | 2분할 패널 | cream | For companies / For talent. 높이 540px(모바일 340px), radius 28, 하단 스크림 위 텍스트 |
| 5 | Final CTA + 푸터 | deep forest | "Start with one project." Post a project · Email KONEXA. 푸터 Terms · Privacy · Status · © KONEXA |

모바일: 하단 고정 CTA(프로젝트 등록하기). FAQ·리뷰·얼리버드·파트너·공개 공고 미리보기는 랜딩에서 제외했다(컴포넌트 파일은 유지).

## 연결

- Post a project → `CompanyRegisterForm`, Join as talent → `StudentRegisterForm`(기존 `activeRegisterRole` 흐름).
- Log in → `AuthModal`(`type=recovery` 해시/쿼리 시 자동 오픈 유지). `onEnterApp`은 가입 성공 시 호출.
- KO/EN은 `useLocale`. 문구는 `landingCopy.ts`(KO/EN 구조 동일 — `tests/landingCopy.test.ts`가 검증).
- `<title>`과 meta description/og/twitter는 `LandingHero`가 로케일에 맞춰 갱신한다. `index.html` 정적 값은 KO·EN 병기.
- Status → `/status`(기존 라우트).

## 모션 (`motion/react` + CSS keyframes, transform·opacity만)

| 대상 | 동작 |
| --- | --- |
| 진입 | H1 줄 단위 마스크 슬라이드업(1s, ease `[.22,1,.36,1]`, 0.15s 간격) → 부제·CTA·노트 rise(26px→0). 섹션은 `whileInView` once |
| 지구본 | 자오선 6개 `scaleX 1→0.02→1`(14s, 위상차) · 아크 3개 stroke-dash 드로잉(7s, 2.3s 간격) + 끝점 펄스(2.8s) |
| 카드 | breathe ±12px(7s) · sheen(6s) · 행 4개 순차 체크 + 진행바(8s 주기) |
| 티커 | 36s linear 무한 |
| 사진 | Ken Burns `scale 1→1.07`(16s alternate) — 사진이 있을 때만 |

- 예외: 아크 드로잉은 스펙대로 `stroke-dashoffset`을 쓴다(작은 SVG path 3개).
- `prefers-reduced-motion`: CSS 반복 애니메이션 전부 정지, 진입 애니메이션 생략, 티커는 정지 대신 정적 목록으로 표시.
- 화면 밖 반복 애니메이션은 `usePauseOffscreen`(IntersectionObserver)이 `data-paused="true"`를 달아 일시정지한다.

## 디자인 토큰

`CLAUDE.md` 표 참고. 폰트는 기존 스택 유지(웹폰트 추가 없음 → 성능 영향 없음).

## 사진

`landingPhotos.ts`가 비어 있으면 단색 패널(forest / ink)로 렌더링한다. 추가 절차와 출처 기록은 `photo-credits.md`.

## 수용 기준 확인 방법

- `npm run lint` · `npm test` · `npm run build` · `npx playwright test`
- `tests/browser/landing.spec.ts`: 360·390·768·1440px × EN/KO에서 가로 스크롤 0, 터치 타깃 ≥44px, 콘솔 에러 0, CTA→가입 폼, KO/EN 전환·메타, 모바일 CTA, reduced-motion, 근거 없는 수치 없음.
- 대비 ≥4.5:1(큰 글자 ≥3:1)과 LCP 요소(이미지 아님)는 빌드 결과물을 열어 계산한 값으로 확인했다.
- 배포 후: `/` 와 `/api/health/ready`.

## 알려진 제한

- 사진 미추가(다운로드 불가) — 단색 패널로 배포.
- 공개 Terms/Privacy 페이지가 저장소에 없다. 푸터의 Terms·Privacy는 `konexa.corp@gmail.com` 으로 사본을 요청하는 메일 링크다. 정식 페이지가 생기면 `LandingHero.tsx`의 `legalHref` 를 해당 경로로 교체한다.
