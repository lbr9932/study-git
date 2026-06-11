---
title: 블로그를 시작합니다
slug: hello-world
excerpt: Vite와 순수 HTML/CSS/JS로 정적 블로그를 만든 이야기입니다. 외부 프레임워크 없이 빠르고 가벼운 블로그를 구현해 보았습니다.
category: general
tags: [html, seo]
coverImage: "/assets/images/cover-hello-world.svg"
publishedAt: 2024-01-15
author: admin
readingTime: 3
description: Vite와 순수 HTML/CSS/JS로 정적 블로그를 만든 이야기입니다.
canonical: ""
draft: false
---

## 왜 직접 만들었나요?

기존의 블로그 플랫폼은 불필요한 기능이 많고, 성능 최적화에 한계가 있었습니다. 순수 HTML/CSS/Vanilla JS로 직접 만들면 **완전한 제어권**을 가질 수 있습니다.

## 기술 스택

- **빌드**: Node.js 커스텀 SSG 스크립트
- **콘텐츠**: 마크다운 + gray-matter
- **스타일**: 순수 CSS + 디자인 토큰
- **검색**: 클라이언트 사이드 제목 검색
- **배포**: 정적 파일 호스팅

## 핵심 설계 원칙

### 1. 성능 우선

모든 페이지는 빌드 타임에 완성된 HTML로 생성됩니다. 클라이언트 JS는 검색과 언어 전환에만 사용합니다.

### 2. 확장성

폴더 구조와 컴포넌트를 처음부터 역할별로 분리했습니다. 댓글, TOC, 다크모드 같은 기능은 나중에 추가할 수 있는 구조입니다.

### 3. SEO

빌드 타임에 각 페이지의 `title`, `description`, OG 태그, canonical을 자동으로 생성합니다.

## 마무리

이 블로그는 계속 발전할 예정입니다. 불필요한 것은 빼고, 필요한 것만 추가하는 방향으로 유지하겠습니다.
