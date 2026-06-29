# SEO QA Docs

SEO QA 웹앱을 기준으로 제품 요구사항, 프롬프트 입력, Claude 검토, 에이전트 작업 설계, 디자인 기준, 참고 자산을 연결한 문서 묶음입니다.

## 구현된 사이트

- 목적: 웹사이트의 SEO 항목을 수집하고 통과/미통과, 평균 점수, 에러 상태를 내부 대시보드에서 확인합니다.
- 기술: Next.js App Router, PostgreSQL, Docker Compose.
- 주요 화면: 신규 점검/히스토리, 점검 상세, 페이지 상세.
- 주요 정책: 같은 도메인만 수집, 제품 상세페이지(`/products/...`) 제외, query parameter 제거, robots.txt 옵션 제공, SSRF 방어.

## 문서 연결

- [프롬프트 입력](./prompt-input.md)
- [Claude 검토](./claude.md)
- [Agent Design](./agent-design.md)
- [Design System](./genesis-DESIGN.md)
- [Assets](./assets.md)

## 현재 앱 흐름

1. 사용자가 `/`에서 사이트 URL, 최대 페이지 수, robots.txt 준수 여부, 인증 필요 여부를 입력합니다.
2. `POST /api/audits`가 점검 기록을 만들고 크롤링/SEO 검증을 실행합니다.
3. 결과는 `audits`, `page_results`, `check_results`, `audit_events`에 저장됩니다.
4. `/groups`에서 점검 그룹 목록과 최신 상태를 확인합니다.
5. `/groups/[groupId]`에서 같은 대상 URL의 버전별 점검 이력을 확인합니다.
6. `/audits/[id]`에서 평균 점수, 통과/미통과, 페이지별 결과, 개선 필요 페이지, 실행 기록을 확인합니다.
7. `/audits/[id]/pages/[pageId]`에서 특정 페이지의 추출 SEO 값과 항목별 판정을 확인합니다.

## 유지 원칙

- 문서는 구현된 코드와 어긋나지 않게 유지합니다.
- 새 기능을 설계할 때는 [프롬프트 입력](./prompt-input.md)에 요청을 먼저 작성합니다.
- Claude 또는 다른 모델 검토는 [Claude 검토](./claude.md)의 출력 계약을 따릅니다.
- Codex 구현 작업은 [Agent Design](./agent-design.md)의 작은 단계 원칙을 따릅니다.
