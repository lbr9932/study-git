# AGENTS.md

이 저장소는 개발자 기술 블로그를 위한 정적 사이트 지향 프로젝트다.  
작업 시에는 아래 규칙을 우선한다.

## 1. Context First

- 대상: 개발자 기술 블로그
- 목표: 콘텐츠 소비 경험과 SEO 유입을 최우선으로 하는 블로그
- 기본 언어: 한국어
- UI 번역: 지원하되 콘텐츠 자체는 한국어 기준
- 구현 방향: `Vite + HTML/CSS/Vanilla JS` 기반의 SSG 지향 구조

## 2. Spec Before Code

- 구현 전에 빠진 요구사항과 모호한 부분을 먼저 짚는다.
- 코드 작성은 요구사항이 충분히 정리된 뒤에 진행한다.
- 기능 추가 시에는 영향 범위, 비기능 요구사항, 확장성을 함께 확인한다.

## 3. Output Contract

- 결과물은 가능하면 다음 형식 중 하나로 고정한다.
  - Mermaid Diagram
  - YAML/JSON 스키마
  - 폴더 구조 목록
  - 단계별 구현 계획
  - 함수별 주석이 포함된 코드
- 문서화가 필요한 경우, 용도와 범위를 먼저 명시한다.

## 4. Self Critique

- 결과를 제출하기 전에 최소 1회 이상 스스로 검토한다.
- 특히 아래 항목을 확인한다.
  - 보안 관점에서 누락된 점
  - SEO 메타 누락
  - 접근성 문제
  - 구조 중복
  - 데이터와 뷰의 과도한 결합

## 5. Small Steps

- 작업은 작은 단위로 나눈다.
- 한 번에 하나의 완료 가능한 단계를 구현한다.
- 각 단계는 바로 실행하고 검증 가능한 상태를 유지한다.

---

## 프로젝트 범위

### 콘텐츠 정책

- 콘텐츠는 마크다운 파일로 관리한다.
- 기본 콘텐츠 위치는 `content/posts/*.md`를 기준으로 생각한다.
- frontmatter + 본문 구조를 사용한다.

### 콘텐츠 스키마

```yaml
---
title: string
slug: string
excerpt: string
category: string
tags: string[]
coverImage: string
publishedAt: string
updatedAt: string
author: string
readingTime: number
description: string
canonical: string
draft: boolean
---
```

- `title`, `slug`, `excerpt`, `category`, `publishedAt`, `author`는 핵심 필드로 본다.
- `draft: true`인 글은 빌드 대상에서 제외한다.
- `description`이 없으면 `excerpt`를 SEO 설명으로 사용한다.

### 빌드 파이프라인

- `content/posts/*.md`
  -> `gray-matter`로 frontmatter 파싱
  -> `marked` 또는 `unified`로 마크다운 변환
  -> 빌드 스크립트가 HTML 파일에 주입
  -> `dist/` 정적 파일 출력

### 검색 범위

- 검색은 제목만 대상으로 한다.
- 검색 인덱스는 빌드 타임에 생성한다.
- 검색 인덱스 예시는 `dist/search-index.json` 형태로 둔다.

### 다국어 범위

- 다국어는 UI 번역만 지원한다.
- 콘텐츠 번역은 범위 밖으로 본다.
- 문자열 키는 `content/locales/` 또는 동등한 구조로 분리한다.

### 테마 정책

- 기본은 라이트 모드 전용이다.
- 다크 모드는 현재 구현하지 않는다.
- 다만 CSS 변수 구조는 추후 확장을 고려해 둔다.

### SEO 정책

- 필수 메타는 다음을 포함한다.
  - `title`
  - `description`
  - `canonical`
  - Open Graph
  - Twitter Card
- schema.org 구조화 데이터는 현재 범위 밖으로 본다.
- 모든 페이지에서 메타 누락이 없도록 한다.

### 상세 페이지 구성

- 상세 페이지에는 아래 항목을 포함한다.
  - 제목
  - 작성자
  - 작성일
  - 카테고리
  - 본문
  - 이전 글 / 다음 글
- 현재 범위에서는 TOC, 공유, 관련글을 구현하지 않는다.

### 목표 성능

- Lighthouse 기준을 목표로 한다.
- 기준은 Performance, Accessibility, SEO 각 90+를 목표로 한다.
- 불필요한 JS와 과도한 외부 의존성을 피한다.

---

## 정보 구조

- 기본 라우트 예시
  - `/`
  - `/blog`
  - `/blog/:slug`
  - `/category/:slug`
  - `/tag/:slug`
  - `/search`
  - `/about`
  - `/rss.xml`
  - `/sitemap.xml`

- 기본 탐색 흐름
  - 홈 -> 목록 탐색 -> 상세 페이지
  - 홈 -> 카테고리/태그 필터 -> 상세 페이지
  - 홈 -> 검색 -> 상세 페이지

---

## 디자인 시스템

### Typography

- 기본 UI 서체: `Pretendard Variable`
- 본문 서체: `Pretendard Variable`
- 코드 서체: `IBM Plex Mono`
- 긴 문장의 가독성을 우선한다.
- 줄 길이는 60~80자 내외를 목표로 한다.

### Color System

- `bg`: `#FAFAF8`
- `surface`: `#FFFFFF`
- `surface-alt`: `#F2F2EF`
- `text`: `#1F2328`
- `text-muted`: `#5B6470`
- `border`: `#D9DDE3`
- `accent`: `#2563EB`
- `accent-strong`: `#1D4ED8`
- `success`: `#15803D`
- `warning`: `#B45309`
- `danger`: `#B91C1C`

### Spacing

- 4px 기반 스케일을 사용한다.
- 여백 토큰은 반복 재사용 가능하게 정의한다.

### Grid

- Desktop 최대 콘텐츠 폭은 `1200px`을 기준으로 한다.
- 본문 읽기 폭은 `680px` 내외를 목표로 한다.
- Mobile은 단일 컬럼 또는 4컬럼 기준으로 단순하게 유지한다.

### Breakpoints

- `sm`: 480px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1440px

### Component Rules

- Semantic HTML을 우선한다.
- 버튼은 행동, 링크는 이동에만 사용한다.
- 카드 전체를 무조건 클릭 영역으로 만들지 않는다.
- 이미지에는 `width`와 `height`를 명시한다.
- 상태는 `hover`, `focus-visible`, `active`, `disabled`를 모두 고려한다.
- 아이콘이 장식용이면 `aria-hidden="true"`를 사용한다.
- 검색 UI는 키보드만으로 완결 가능해야 한다.

---

## 폴더 원칙

- 예상 구조는 다음을 기준으로 한다.
  - `src/content/`
  - `src/components/`
  - `src/layouts/`
  - `src/pages/`
  - `src/partials/`
  - `src/scss/`
  - `src/scripts/`
  - `src/assets/`
  - `src/data/`
  - `src/types/`
  - `src/task/`

- 공통 컴포넌트는 중복 생성하지 않는다.
- 데이터와 뷰는 과도하게 결합하지 않는다.
- 기능별 경계가 흐려지면 먼저 구조를 정리한다.

---

## 구현 순서

1. 프로젝트 기본 설정
2. 콘텐츠 스키마 정의 및 마크다운 파이프라인 구성
3. SCSS 구조 분해
4. 디자인 토큰 정의
5. 공통 레이아웃 SCSS 정리
6. 모듈 SCSS 분리
7. 홈 SCSS 분리
8. 언어별 엔트리 연결
9. Base Layout 생성
10. Header 구현
11. Footer 구현
12. Home 구현
13. Blog Card 구현
14. Blog List 페이지 구현
15. Blog Detail 페이지 구현
16. Category 페이지 구현
17. Tag 페이지 구현
18. Search UI 구현
19. SEO 메타 자동화
20. Sitemap 생성
21. RSS Feed 생성
22. Lighthouse 최적화

---

## 실행 규칙

- 구현을 시작할 때는 항상 다음 순서를 따른다.
  1. 구현 목표 설명
  2. 생성 파일 목록
  3. 코드 작성
  4. 검토 포인트
  5. Self Review

- 각 단계 완료 후 검토한다.
  - 폴더 경계가 흐려졌는가
  - 공통 컴포넌트가 중복 생성되었는가
  - 데이터와 뷰가 과도하게 결합되었는가
  - 불필요한 JS가 증가했는가
  - 이미지/폰트 로딩이 과도한가
  - 메타 태그가 모든 페이지에 있는가
  - 헤딩 구조가 명확한가

- 문제를 발견하면 바로 수정 방안을 제시한다.
- 변경 이유는 한 줄로 명시한다.
- 수정 후 다시 검증한다.

