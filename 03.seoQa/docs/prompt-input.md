# 프롬프트 입력

관련 문서: [README](./README.md) / [Claude 검토](./claude.md) / [Agent Design](./agent-design.md) / [Design System](./genesis-DESIGN.md)

이 파일은 Shopify SEO QA 웹앱에 추가하거나 변경하고 싶은 요구사항을 입력하는 곳입니다.

## 현재 사이트 컨텍스트

- 앱 이름: SEO QA
- 목적: Shopify SEO 점검 결과를 수집하고 통과/미통과 평균 점수를 보여주는 내부용 웹앱 MVP
- 기술 스택: Next.js App Router, PostgreSQL, Docker Compose
- 화면:
  - `/`: 신규 점검 설정, 이전 점검 히스토리
  - `/audits/[id]`: 점검 결과 대시보드
  - `/audits/[id]/pages/[pageId]`: 페이지별 SEO 상세
- 데이터:
  - `audits`: 점검 실행 기록
  - `page_results`: 페이지별 결과
  - `check_results`: 항목별 판정
  - `audit_events`: 실행 이벤트
- 현재 점검 항목:
  - Status Code
  - Title
  - Meta Description
  - H1
  - Canonical
  - Social Tag
  - Schema

## 만들고 싶은 프롬프트

```text
여기에 만들고 싶은 프롬프트를 입력하세요.
```

## 요청 형식 가이드

```text
[Context]
- 현재 구현된 SEO QA 웹앱을 기준으로 작업한다.
- 기술 스택은 Next.js App Router + PostgreSQL + Docker Compose다.
- 기존 화면과 데이터 구조를 유지하면서 필요한 부분만 변경한다.

[요청]
- 변경하고 싶은 기능:
- 변경하고 싶은 화면:
- 유지해야 할 정책:
- 검증 방법:

[Output Contract]
- 먼저 모호한 점을 짚는다.
- 구현이 필요하면 작은 단계로 나눈다.
- 변경 파일과 검증 방법을 명확히 쓴다.
```

