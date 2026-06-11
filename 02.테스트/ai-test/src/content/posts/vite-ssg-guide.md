---
title: Vite로 SSG 블로그 만들기
slug: vite-ssg-guide
excerpt: Vite를 사용해 정적 사이트 생성기(SSG)를 직접 구현하는 방법을 설명합니다. gray-matter와 marked를 활용해 마크다운을 HTML로 변환하는 파이프라인을 구축합니다.
category: tooling
tags: [vite, ssg]
coverImage: "/assets/images/cover-vite-ssg.svg"
publishedAt: 2024-01-22
author: admin
readingTime: 8
description: Vite로 커스텀 SSG를 구현하는 단계별 가이드입니다.
canonical: ""
draft: false
---

## SSG란 무엇인가요?

SSG(Static Site Generation)는 빌드 타임에 모든 HTML 파일을 미리 생성하는 방식입니다. 서버가 요청마다 HTML을 생성하는 SSR과 다르게, 이미 완성된 파일을 CDN에서 바로 제공합니다.

## 핵심 라이브러리

### gray-matter

마크다운 파일의 frontmatter를 파싱합니다.

```javascript
import matter from "gray-matter";

const { data, content } = matter(`---
title: 제목
publishedAt: 2024-01-22
---

본문 내용
`);

console.log(data.title); // '제목'
console.log(content); // '\n본문 내용\n'
```

### marked

마크다운 텍스트를 HTML로 변환합니다.

```javascript
import { marked } from "marked";

const html = marked("# 제목\n\n본문입니다.");
// <h1>제목</h1><p>본문입니다.</p>
```

## 빌드 파이프라인

```
src/content/posts/*.md
  → gray-matter (frontmatter 분리)
  → marked (마크다운 → HTML)
  → 템플릿에 주입
  → dist/blog/:slug/index.html 저장
```

## 검색 인덱스 생성

빌드 타임에 제목 정보만 모아서 `search-index.json`을 만듭니다.

```javascript
const index = posts.map((post) => ({
  slug: post.slug,
  title: post.title,
  category: post.category,
  publishedAt: post.publishedAt,
}));

await writeFile("dist/search-index.json", JSON.stringify(index));
```

## Sitemap과 RSS

같은 방식으로 `sitemap.xml`과 `rss.xml`도 빌드 타임에 생성합니다. 런타임 의존성이 없으므로 Lighthouse 성능에 영향을 주지 않습니다.

## 마무리

커스텀 SSG를 직접 구현하면 프레임워크 의존성이 없고, 완전한 제어권을 갖게 됩니다. 이 블로그도 동일한 방식으로 만들어졌습니다.
