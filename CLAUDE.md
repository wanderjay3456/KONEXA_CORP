# KONEXA — Claude Code 작업 지침

운영 사이트: https://konexa.co.kr (main 머지 시 Vercel 자동 배포). 스택: React 19 · Vite · Express · Supabase.

**사이트 수정은 Claude Code의 `site-engineer` 에이전트로만 한다. 운영 감시는 "KONEXA 11 Site Engineer" 예약 작업(Cowork)이 하며 코드는 수정하지 않는다.**

## 원칙

- **최소 변경**: 요청받은 화면만 바꾼다. 인증·결제(PortOne/Stripe)·대시보드·API·DB·Supabase·환경변수·`vercel.json`은 지시 없이 건드리지 않는다.
- **정직성**: 근거 없는 통계·후기·고객사·인재 수·가격·보장·"Top 1%" 표현을 쓰지 않는다. 예시는 "Illustration / 예시"로 라벨링한다.
- **비밀값**: `.env*`를 읽거나 출력·커밋하지 않는다. 키가 필요하면 멈추고 보고한다.
- **기존 흐름 유지**: `LandingHero`의 `onEnterApp`, `AuthModal`(recovery hash 포함), `CompanyRegisterForm`/`StudentRegisterForm`, `useLocale` KO/EN 전환, `/status` 라우트, `SupportChatbot`.
- **컴포넌트 삭제 금지**: 랜딩에서 빠진 `EarlyBirdCampaign`, `FoundingPartners`, `CinematicTrustJourney`, `PublicOpportunityPreview`는 복원할 수 있도록 파일을 남긴다(일부는 단위 테스트가 직접 import한다).
- **승인 범위**: 디자인·문구·기능 변경은 대표(Jay Yoo) 승인이 필요하다. 원래 동작을 되돌리는 복구(revert/hotfix)는 체크 통과 시 머지할 수 있다.

## 디자인 토큰 (랜딩 v3, `src/components/landing/landing-v3.css`의 `.lv3`)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| ink | `#13201B` | 본문·밝은 면 위 글자 |
| deep forest | `#0F2621` | 히어로·최종 CTA 배경 |
| forest | `#17342D` | 티커·패널 배경 |
| cream | `#F5F3EE` | 밝은 섹션 배경 |
| line | `#E2DED5` | 구분선 |
| mint | `#B9F4D0` | 강조(헤드라인 강조 줄, 주요 버튼) |
| violet | `#5847C9` | 숫자(01·02·03) |
| success | `#1F6B4F` / `#E6F2EC` | 완료 상태 |
| amber chip | `#7A4E0E` / `#FBF1DF` | 준비 중 상태 |

헤드라인은 weight 500, 자간 -0.045em(EN) / -0.04em(KO). 폰트는 기존 스택(`--font-sans`, `--font-display`)을 유지한다. 반복 모션은 transform·opacity만 쓴다(지구본 아크의 stroke-dash 드로잉만 예외).

## 검증 명령

```bash
npm ci
npm run lint            # tsc --noEmit
npm test                # 단위 테스트 (tests/*.test.ts)
npm run build           # vite build + 서버 번들
npx playwright test     # 브라우저 테스트. build 이후에 실행 (랜딩 스펙은 dist CSS를 사용)
```

랜딩 스크린샷은 `LANDING_SHOTS=<폴더> npx playwright test tests/browser/landing.spec.ts`로 360·390·768·1440px × EN/KO를 저장한다.

배포 후에는 `https://konexa.co.kr/` 과 `https://konexa.co.kr/api/health/ready`(`"status":"ready"`)를 확인한다.

## 문서

- `docs/design/landing-v3.md` — 랜딩 v3 스펙 요약
- `docs/design/photo-credits.md` — 랜딩 사진 출처·라이선스 기록
- `ARCHITECTURE.md`, `README.md` — 시스템 구조와 운영 설정
