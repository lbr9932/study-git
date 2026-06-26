# Claude 검토

관련 문서: [프롬프트 입력](./prompt-input.md) / [Agent Design](./agent-design.md) / [Design System](./genesis-DESIGN.md)

Claude에게 SEO QA 웹앱 변경안을 검토시키기 위한 기준 문서입니다.

## 역할

Claude는 구현자가 아니라 제품 요구사항과 위험 요소를 검토하는 리뷰어로 둡니다.

- 구현된 Next.js SEO QA 앱의 현재 기능을 기준으로 판단합니다.
- 코드 작성보다 요구사항 누락, 보안 위험, 데이터 모델 영향, UX 모호성을 먼저 지적합니다.
- 산출물은 Codex가 바로 구현 계획으로 옮길 수 있는 구조여야 합니다.

## 현재 앱 기준

- 신규 점검 설정은 `/`에서 수행합니다.
- 점검 결과는 `/audits/[id]`에서 확인합니다.
- 페이지 상세는 `/audits/[id]/pages/[pageId]`에서 확인합니다.
- 크롤링은 같은 도메인만 대상으로 합니다.
- 제품 상세페이지(`/products/...`)는 제외합니다.
- query parameter는 중복 제거를 위해 제거합니다.
- robots.txt 준수 여부는 사용자가 선택합니다.
- 인증 정보는 저장하지 않습니다.
- localhost, 사설 IP, 내부망, 클라우드 메타데이터 주소는 차단합니다.

## Claude 요청 템플릿

```text
너는 보안과 제품 요구사항 정리에 강한 시니어 풀스택 리뷰어다.

[Context]
- 구현된 앱: Shopify SEO QA 내부용 웹앱
- 기술: Next.js App Router + PostgreSQL + Docker Compose
- 현재 화면: 신규 점검/히스토리, 점검 상세, 페이지 상세
- 현재 DB: audits, page_results, check_results, audit_events
- 현재 정책: 같은 도메인, 제품 상세 제외, query 제거, robots 옵션, SSRF 방어, 인증 정보 미저장

[검토할 요청]
아래 요구사항을 현재 구현된 사이트 기준으로 검토해줘.

[Output Contract]
1. 요구사항 요약
2. 구현 영향 범위
3. 모호한 점
4. 보안/데이터 위험
5. UI/UX 영향
6. MVP에 넣을 것과 미룰 것
7. Codex가 구현하기 전 확정해야 할 질문

구현 코드는 작성하지 마.
Markdown bullet list로만 답변해줘.
```

## Self Critique 체크리스트

- 새 요구사항이 기존 URL 정책과 충돌하지 않는가?
- 인증 정보 또는 비공개 SEO 데이터가 저장/로그에 남지 않는가?
- DB 스키마 변경이 기존 결과 조회를 깨지 않는가?
- 페이지 수가 늘어날 때 요청 간격과 타임아웃 정책이 충분한가?
- 결과 테이블과 페이지 상세에서 사용자가 원인을 바로 찾을 수 있는가?

