# Astro 개발 블로그 구현 프롬프트

## 프로젝트 개요

**목표**: 콘텐츠 소비 경험과 SEO 유입을 최우선으로 하는 Astro 기반 정적 블로그를 구현한다.

**현재 상태**:
- Astro 4.x 설치 완료
- `src/pages/`, `src/layouts/BaseLayout.astro`, `src/i18n/`, `src/styles/global.css` 기본 구조 존재
- `ko`/`en` 라우팅 구조 초기화됨

---

## 확정된 결정 (변경 금지)

| 항목 | 결정 |
|------|------|
| 콘텐츠 소스 | 마크다운 파일 (`src/content/posts/*.md`), Astro Content Collections 사용 |
| 검색 범위 | 제목만 (`title` 필드), 빌드 타임 JSON 인덱스 |
| 다국어 범위 | UI 번역만 (콘텐츠 번역 없음) |
| SNS 공유 | 없음 |
| 테마 | 라이트 모드 전용 |
| SEO | `title`, `description`, `canonical`, OG, Twitter Card만. schema.org 제외 |
| 상세 페이지 | 제목, 작성자, 작성일, 카테고리, 본문, 이전/다음 글. TOC·관련글 없음 |
| 성능 목표 | Lighthouse Performance / Accessibility / SEO 각 90+ |
| 커버 이미지 | 카드에 표시. 상세 페이지 상단 이미지 영역 없음 |

---

## 콘텐츠 스키마

Astro Content Collections를 사용한다. `src/content/config.ts`에 아래 스키마를 정의한다.

```ts
import { z, defineCollection } from 'astro:content'

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    category: z.string(),
    tags: z.array(z.string()).optional().default([]),
    coverImage: z.string().optional(),
    publishedAt: z.string(), // ISO 8601
    updatedAt: z.string().optional(),
    author: z.string(),
    readingTime: z.number().optional(),
    description: z.string().optional(),
    canonical: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
})

export const collections = { posts }
```

---

## 폴더 구조 (구현 목표)

```
src/
  content/
    config.ts           # Content Collections 스키마
    posts/              # 마크다운 글 파일
  layouts/
    BaseLayout.astro    # html/head/body 공통 골격
    ArticleLayout.astro # 블로그 상세 레이아웃
  components/
    Header.astro
    Footer.astro
    BlogCard.astro
    TagPill.astro
    Pagination.astro
    Breadcrumb.astro
    PostMeta.astro
    PrevNext.astro
    SearchField.astro
  pages/
    index.astro         # 홈 (최근 글 목록)
    blog/
      index.astro       # 전체 글 목록 (페이지네이션)
      [slug].astro      # 글 상세
    category/
      index.astro       # 카테고리 목록
      [slug].astro      # 카테고리별 글 목록
    tag/
      index.astro       # 태그 목록
      [slug].astro      # 태그별 글 목록
    search/
      index.astro       # 검색 UI
    about/
      index.astro
    rss.xml.ts          # RSS 피드
    sitemap.xml.ts      # 사이트맵 (또는 @astrojs/sitemap 사용)
  styles/
    tokens.css          # CSS 변수 (컬러, 타이포, 간격, 반경)
    base.css            # reset, 기본 요소 스타일
    components.css      # 컴포넌트 스타일
    utilities.css       # 헬퍼 클래스
  i18n/
    ko/index.json       # 한국어 UI 번역 키-값
    en/index.json       # 영어 UI 번역 키-값
    utils.ts            # 번역 헬퍼 함수
  scripts/
    search.js           # 클라이언트 제목 검색
    nav.js              # 햄버거 메뉴
    i18n.js             # 언어 전환
public/
  assets/
    images/             # 커버 이미지
```

---

## 디자인 시스템

### 색상 토큰 (CSS 변수)

```css
:root {
  --color-primary: #0066cc;
  --color-on-primary: #ffffff;
  --color-canvas: #ffffff;
  --color-canvas-parchment: #f5f5f7;
  --color-surface-dark: #272729;
  --color-surface-black: #000000;
  --color-ink: #1d1d1f;
  --color-ink-muted: #7a7a7a;
  --color-hairline: #e0e0e0;
}
```

### 타이포그래피

- 서체: `system-ui, -apple-system, 'Pretendard Variable', sans-serif`
- 본문: 17px / line-height 1.47 / letter-spacing -0.374px
- `-webkit-font-smoothing: antialiased`

### 간격 기준

8px base scale: `4 8 12 17 24 32 48 80px`

### 컴포넌트 핵심 규칙

- **Header**: `position: sticky`, `background: #000`, `height: 44px`, 12px 링크
- **BlogCard**: `border-radius: 18px`, 커버 이미지 인셋 마진, `box-shadow: 0 0 0 1px rgba(0,0,0,0.08)`
- **버튼**: `border-radius: 9999px` (pill shape), primary `#0066cc`
- **Footer**: `background: #f5f5f7`, 컬럼 링크 레이아웃
- 커버 이미지: 카드에만 표시. 상세 페이지 상단 커버 타일 없음

---

## 구현 순서

각 단계는 독립 실행 가능하다. 순서를 지킨다.

1. `src/content/config.ts` 스키마 작성
2. `src/content/posts/` 샘플 마크다운 4개 작성 (각기 다른 category/tags)
3. `src/styles/tokens.css`, `base.css`, `components.css`, `utilities.css` 작성
4. `BaseLayout.astro` 작성 (head SEO 메타 포함)
5. `Header.astro`, `Footer.astro` 작성
6. `BlogCard.astro`, `TagPill.astro`, `PostMeta.astro` 작성
7. `pages/index.astro` — 최근 글 6개, 홈 히어로 타일
8. `pages/blog/index.astro` — 전체 목록 + 페이지네이션
9. `pages/blog/[slug].astro` — 상세 + 이전/다음
10. `pages/category/` 인덱스 + 상세
11. `pages/tag/` 인덱스 + 상세
12. `pages/search/index.astro` + `scripts/search.js`
13. `pages/about/index.astro`
14. `rss.xml.ts`, `sitemap.xml.ts`
15. `i18n/` 번역 키 연결, 언어 전환 버튼
16. Lighthouse 최적화 (이미지 width/height, defer JS, 메타 전체 페이지 확인)

---

## SEO 메타 규칙

`BaseLayout.astro`의 `<head>`에 아래를 모든 페이지에 포함한다.

```astro
---
const { title, description, canonical, ogImage } = Astro.props
const fullTitle = title ? `${title} | 개발 블로그` : '개발 블로그'
const metaDesc = description || '개발자를 위한 기술 블로그'
const canonicalUrl = canonical || Astro.url.href
---

<title>{fullTitle}</title>
<meta name="description" content={metaDesc} />
<link rel="canonical" href={canonicalUrl} />
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={metaDesc} />
<meta property="og:url" content={canonicalUrl} />
<meta property="og:type" content="website" />
<meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={metaDesc} />
{ogImage && <meta property="og:image" content={ogImage} />}
```

---

## 검색 구현

빌드 타임에 `public/search-index.json`을 생성한다 (`getStaticPaths` 외부, 빌드 스크립트 또는 `src/pages/search-index.json.ts` endpoint).

```json
[{ "slug": "...", "title": "...", "category": "...", "publishedAt": "..." }]
```

`scripts/search.js`: 200ms debounce, `?q=` URL 파라미터 동기화, title 소문자 포함 검색.

---

## i18n 규칙

- 언어 전환은 `localStorage`에 저장
- `data-i18n="키"` 속성을 HTML에 부여
- `scripts/i18n.js`가 DOMContentLoaded 시 JSON 로드 후 텍스트 교체
- 콘텐츠(글 본문)는 번역하지 않음

---

## 각 단계 완료 후 체크

- 불필요한 클라이언트 JS가 추가되지 않았는가 (`client:` 지시어 최소화)
- 이미지에 `width`/`height` 명시되었는가
- 모든 페이지에 `title`, `description`, `canonical`, OG 태그가 있는가
- `h1`이 페이지당 하나인가
- 키보드 접근성 (`focus-visible`, `aria-label`, `aria-current`) 확인

---

## 금지 사항

- 다크모드 구현 금지 (CSS 토큰 구조만 준비)
- SNS 공유 버튼 구현 금지
- schema.org 구조화 데이터 추가 금지
- 상세 페이지 상단 커버 이미지 타일(full-bleed) 구현 금지
- TOC, 관련 글, 댓글 구현 금지
- 외부 폰트 CDN 사용 금지 (system-ui 우선)
