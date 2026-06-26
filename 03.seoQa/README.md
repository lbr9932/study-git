# SEO QA

Shopify SEO 점검 결과를 수집하고 통과/미통과 평균 점수를 보여주는 내부용 웹앱 MVP입니다.

## 실행

```bash
docker compose up --build
```

웹은 `http://localhost:3000`에서 열립니다.

로컬 개발로 실행하려면 Postgres를 먼저 띄운 뒤 의존성을 설치하고 실행합니다.

```bash
docker compose up -d db
cp .env.example .env
npm install
npm run dev
```

`DATABASE_URL`을 따로 지정하지 않으면 개발 기본값으로 `postgres://seoqa:seoqa@localhost:5432/seoqa`를 사용합니다.

## MVP 범위

- Next.js + Postgres + Docker Compose
- 1020px 중앙 정렬 데스크톱 웹 UI
- 라우트 분리: `/` 신규 점검/히스토리, `/audits/[id]` 점검 상세, `/audits/[id]/pages/[pageId]` 페이지 상세
- 같은 도메인 URL만 탐색
- 제품 상세페이지(`/products/...`) 제외
- query parameter 제거 기준으로 URL 중복 제거
- robots.txt 단순 준수 옵션
- HTML 소스 기준 SEO 항목 점검
- 점검 결과 저장, 이전 점검 리스트, 상세 결과, 삭제
- 인증 정보 입력 다이얼로그 제공

## 현재 제한

- 인증 정보는 저장하지 않으며, MVP에서는 로그인 자동 제출까지 수행하지 않습니다.
- 엑셀 파일은 공통 SEO 항목 기준을 도출하는 참고 자료로 사용했습니다. 실제 엑셀 컬럼 기반 동적 규칙 파싱은 후속 작업입니다.
- 크롤링은 서버 사이드 HTML 소스 기준입니다. 복잡한 JS 렌더링 검증은 후속 작업입니다.
