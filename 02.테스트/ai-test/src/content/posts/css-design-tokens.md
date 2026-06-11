---
title: CSS 디자인 토큰으로 일관된 UI 만들기
slug: css-design-tokens
excerpt: CSS 커스텀 프로퍼티를 디자인 토큰으로 활용하면 색상, 타이포그래피, 간격을 일관되게 관리할 수 있습니다. 유지보수성과 확장성을 높이는 실용적인 방법을 소개합니다.
category: css
tags: [css-variables, design-tokens]
coverImage: "/assets/images/cover-css-tokens.svg"
publishedAt: 2024-02-01
author: admin
readingTime: 6
description: CSS 커스텀 프로퍼티로 디자인 토큰 시스템을 구축하는 방법입니다.
canonical: ""
draft: false
---

## 디자인 토큰이란?

디자인 토큰은 색상, 간격, 타이포그래피 같은 디자인 결정을 **이름이 있는 변수**로 저장한 것입니다. CSS에서는 커스텀 프로퍼티(`--variable-name`)로 구현합니다.

## 색상 토큰

하드코딩된 색상값 대신 역할 기반 토큰을 사용합니다.

```css
:root {
  /* 배경 */
  --color-bg: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F2F2EF;

  /* 텍스트 */
  --color-text: #1F2328;
  --color-text-muted: #5B6470;

  /* 경계선 */
  --color-border: #D9DDE3;

  /* 강조 */
  --color-accent: #2563EB;
}
```

## 간격 토큰

4px 기반의 스케일을 사용하면 일관된 간격을 유지할 수 있습니다.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-16: 64px;
}
```

## 실제 컴포넌트에 적용하기

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

## 다크모드 확장

토큰 기반으로 설계하면 나중에 다크모드를 추가할 때 값만 오버라이드하면 됩니다.

```css
[data-theme="dark"] {
  --color-bg: #0F1115;
  --color-surface: #171A21;
  --color-text: #F3F4F6;
  /* 나머지 토큰들... */
}
```

## 마무리

디자인 토큰은 초기 설정 비용이 있지만, 프로젝트가 커질수록 그 가치를 발휘합니다. 색상 하나를 바꿀 때 모든 파일을 찾아다닐 필요가 없습니다.
