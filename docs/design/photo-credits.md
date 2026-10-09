# 랜딩 사진 출처

랜딩 v3의 "For companies / For talent" 패널용 사진 기록. 사진은 상업 이용이 가능한 Unsplash 또는 Pexels 이미지만 쓴다.

## 현재 상태 (2026-10-09)

**사진이 아직 추가되지 않았습니다.** 작업 환경의 네트워크 정책이 `unsplash.com`, `images.unsplash.com`, `pexels.com`, `images.pexels.com` 연결을 403으로 차단해 다운로드할 수 없었습니다. 출처를 확인하지 못한 이미지를 쓰지 않기 위해, 두 패널은 스펙에 따라 단색 패널로 배포됩니다(`src/components/landing/landingPhotos.ts`가 비어 있음).

## 사진을 추가하는 방법

1. 아래 요구에 맞는 사진을 고른다.
   - (A) 밝은 사무실에서 노트북으로 결과물을 검토하는 팀 리더, 얕은 심도 → "For companies"
   - (B) 밝은 코워킹 데스크에서 일하는 젊은 전문가, 자연광, 자연스러운 순간 → "For talent"
   - 특정 국적을 강조하거나 빈곤을 연출한 이미지는 쓰지 않는다.
2. `public/images/landing/` 에 WebP 1600w·800w를 넣는다(각 200KB 이하). 예: `company-1600.webp`, `company-800.webp`.
3. `src/components/landing/landingPhotos.ts` 의 `landingPhotos.company` / `landingPhotos.talent` 를 채운다(`width`, `height`, KO/EN `alt`). 이미지는 `loading="lazy"`로 렌더링되고 Ken Burns 모션이 적용된다.
4. 아래 표에 기록한다.

## 기록

| 용도 | 파일 | 원본 URL | 작가 | 라이선스 | 다운로드일 |
| --- | --- | --- | --- | --- | --- |
| For companies | — | — | — | — | — |
| For talent | — | — | — | — | — |
