---
title: JavaScript ES 모듈 완벽 가이드
slug: javascript-modules
excerpt: ES 모듈(ESM)의 import/export 문법부터 동적 임포트, 트리 셰이킹까지 현대 JavaScript 모듈 시스템을 정리합니다.
category: javascript
tags: [html, seo]
coverImage: "/assets/images/cover-js-modules.svg"
publishedAt: 2024-02-10
author: admin
readingTime: 10
description: ES 모듈 시스템의 핵심 개념과 실용적인 사용법을 정리합니다.
canonical: ""
draft: false
---

## ESM이란?

ES 모듈(ESM)은 JavaScript의 공식 모듈 시스템입니다. `import`와 `export` 키워드를 사용해 코드를 파일 단위로 분리하고 재사용할 수 있습니다.

## 기본 문법

### Named Export

```javascript
// math.js
export function add(a, b) {
  return a + b
}

export const PI = 3.14159
```

```javascript
// main.js
import { add, PI } from './math.js'

console.log(add(1, 2)) // 3
console.log(PI)         // 3.14159
```

### Default Export

```javascript
// logger.js
export default function log(message) {
  console.log(`[LOG] ${message}`)
}
```

```javascript
import log from './logger.js'
log('Hello')
```

## 동적 임포트

필요할 때만 모듈을 로드할 수 있습니다. 성능 최적화에 유용합니다.

```javascript
async function loadSearch() {
  const { initSearch } = await import('./search.js')
  initSearch()
}

document.querySelector('#search-input').addEventListener('focus', loadSearch, { once: true })
```

## 트리 셰이킹

빌드 도구는 사용하지 않는 export를 번들에서 제거합니다. Named export를 선호하는 이유 중 하나입니다.

## 마무리

ESM은 현대 JavaScript 개발의 기반입니다. 브라우저 네이티브 지원도 되므로 소규모 프로젝트에서는 번들러 없이 사용할 수도 있습니다.
