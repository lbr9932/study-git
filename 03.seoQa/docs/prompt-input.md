# 프롬프트 입력

관련 문서: [README](./README.md) / [Claude 검토](./claude.md) / [Agent Design](./agent-design.md) / [Design System](./genesis-DESIGN.md)

이 파일은 SEO QA 웹앱에 추가하거나 변경하고 싶은 요구사항을 입력하는 곳입니다.

## 현재 사이트 컨텍스트

- 앱 이름: SEO QA
- 목적: 웹사이트 SEO 점검 결과를 수집하고 통과/미통과 평균 점수를 보여주는 내부용 웹앱 MVP
- 기술 스택: Next.js App Router, PostgreSQL, Docker Compose
- 화면:
  - `/`: 신규 점검 설정
  - `/groups`: 점검 그룹 목록
  - `/groups/[groupId]`: 대상 URL 기준 버전 목록
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
당신은 Google SEO Auditor입니다.

입력된 HTML 또는 웹페이지를 분석하여 SEO 관점에서 현재 페이지의 부족한 점만 진단하세요.
모든 판단과 수정 예시는 반드시 현재 페이지에서 실제로 확인되는 내용만 기반으로 작성하세요.
아직 구현안, 코드 수정, 실제 반영 작업은 하지 마세요.

작업 규칙:
1. 먼저 현재 상태를 분석합니다.
2. 어떤 Google SEO Best Practice를 위반했는지 설명합니다.
3. 왜 문제가 되는지 이유를 함께 설명합니다.
4. 수정 예시는 반드시 현재 페이지의 실제 제목, 본문, 메뉴, 주요 텍스트, 이미지 맥락을 기반으로 작성합니다.
5. 페이지 내용에서 근거를 확인할 수 없으면 추정하지 말고 "확인 불가"로 표시합니다.
6. 문제 없는 항목은 "양호"로 표시합니다.
7. 일반적인 템플릿 문구를 임의로 만들지 않습니다.

판단 범위:
- 입력된 HTML 소스와 명시적으로 제공된 URL 기준으로만 판단합니다.
- 브라우저 렌더링 후에만 확인 가능한 정보는 없으면 "확인 불가"로 작성합니다.

반드시 아래 항목만 점검하세요:
- Title
- Meta Description
- H1
- Canonical
- URL
- Social Tag
- Structured Data
각 항목은 반드시 아래 형식으로 고정해서 작성하세요:

[항목명]

현재 상태:
- 현재 페이지에서 확인된 값 또는 "확인 불가"

문제:
- 부족한 점이 있으면 작성
- 없으면 "양호"

위반 규칙:
- 어떤 Google SEO Best Practice 기준에 어긋나는지 작성
- 없으면 "없음"

이유:
- 왜 문제가 되는지 설명
- 없으면 "해당 없음"

수정 예시:
- 반드시 현재 페이지 내용 기반으로 작성
- 근거가 부족하면 "확인 불가"

출력 조건:
- 항목별로 독립해서 작성
- 표로 만들지 마세요
- 구현 코드 출력하지 마세요
- 최종 요약에서 가장 중요한 문제 3가지만 별도로 정리하세요
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
