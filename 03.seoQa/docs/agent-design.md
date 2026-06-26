# Agent Design

관련 문서: [프롬프트 입력](./prompt-input.md) / [Claude 검토](./claude.md) / [Design System](./genesis-DESIGN.md)

Codex 또는 에이전트가 SEO QA 웹앱을 수정할 때 따를 작업 설계입니다.

## Agent Role

에이전트는 구현된 사이트를 먼저 읽고, 작은 단위로 변경하고, 실행 가능한 상태를 유지하는 개발자 역할을 맡습니다.

- 기존 Next.js App Router 구조를 유지합니다.
- 기존 DB 테이블과 타입을 먼저 확인합니다.
- 보안 정책을 약화시키는 변경은 하지 않습니다.
- 사용자가 프롬프트를 추가로 작성할 수 있도록 `prompt-input.md`는 입력 구역 중심으로 유지합니다.

## 코드 기준 위치

- 홈 화면: `app/page.tsx`
- 점검 상세: `app/audits/[id]/page.tsx`
- 페이지 상세: `app/audits/[id]/pages/[pageId]/page.tsx`
- 점검 API: `app/api/audits/route.ts`
- 상세/삭제 API: `app/api/audits/[id]/route.ts`
- 크롤링/검증: `lib/seo.ts`
- URL 보안 정책: `lib/url-policy.ts`
- DB 연결/스키마: `lib/db.ts`
- 공유 타입: `lib/types.ts`
- 스타일: `app/globals.css`

## 작업 순서

1. 관련 파일을 읽고 현재 동작을 요약합니다.
2. 변경 범위를 화면, API, DB, 크롤링 정책, 스타일 중 어디에 해당하는지 나눕니다.
3. 20~50줄 단위의 작은 변경으로 구현합니다.
4. 타입 검사, 린트, 빌드 또는 가능한 최소 검증을 실행합니다.
5. 변경된 동작과 남은 위험을 짧게 보고합니다.

## Output Contract

에이전트의 최종 보고는 아래 항목을 포함합니다.

- 변경한 파일
- 바뀐 사용자 흐름
- 실행한 검증
- 남은 제한 또는 후속 작업

## Guardrails

- 인증 정보는 DB, 로그, 이벤트, 화면 기록에 저장하지 않습니다.
- 사설 IP, localhost, 내부망, 메타데이터 주소 차단 정책을 유지합니다.
- 크롤링 대상은 같은 도메인으로 제한합니다.
- 제품 상세페이지 제외 정책을 변경하려면 사용자 확인이 필요합니다.
- 삭제 기능은 관련 `page_results`, `check_results`, `audit_events`가 함께 삭제되는지 확인합니다.

