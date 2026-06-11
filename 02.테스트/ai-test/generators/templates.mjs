const SITE_TITLE = '개발 블로그'
const SITE_URL = 'https://example.com'

export function renderHead({ title, description, canonical, ogTitle, ogDescription, path = '' }) {
  const fullTitle = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE
  const metaDesc = description || '개발자를 위한 기술 블로그'
  const canonicalUrl = canonical || `${SITE_URL}${path}`
  const ogT = ogTitle || fullTitle
  const ogD = ogDescription || metaDesc

  return `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(fullTitle)}</title>
  <meta name="description" content="${escAttr(metaDesc)}" />
  <link rel="canonical" href="${escAttr(canonicalUrl)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escAttr(ogT)}" />
  <meta property="og:description" content="${escAttr(ogD)}" />
  <meta property="og:url" content="${escAttr(canonicalUrl)}" />
  <meta property="og:site_name" content="${escAttr(SITE_TITLE)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escAttr(ogT)}" />
  <meta name="twitter:description" content="${escAttr(ogD)}" />

  <link rel="alternate" type="application/rss+xml" title="${escAttr(SITE_TITLE)} RSS" href="/rss.xml" />
  <link rel="stylesheet" href="/assets/main.css" />`.trim()
}

export function renderHeader(currentPath = '') {
  const links = [
    { href: '/', label: '홈', i18n: 'nav.home' },
    { href: '/blog/', label: '블로그', i18n: 'nav.blog' },
    { href: '/category/', label: '카테고리', i18n: 'nav.category' },
    { href: '/tag/', label: '태그', i18n: 'nav.tag' },
    { href: '/search/', label: '검색', i18n: 'nav.search' },
    { href: '/about/', label: '소개', i18n: 'nav.about' },
  ]

  const navLinks = links.map(({ href, label, i18n }) => {
    const isActive = href === '/'
      ? currentPath === '/'
      : currentPath.startsWith(href)
    return `<a href="${href}" class="nav-link${isActive ? ' active' : ''}"${isActive ? ' aria-current="page"' : ''} data-i18n="${i18n}">${label}</a>`
  }).join('\n        ')

  return `
  <a href="#main" class="skip-link">본문으로 이동</a>
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="site-logo" data-i18n="site.title">${SITE_TITLE}</a>
      <nav class="site-nav" id="site-nav" aria-label="주 내비게이션">
        ${navLinks}
      </nav>
      <div class="header-actions">
        <button class="lang-btn" aria-label="Switch to English">EN</button>
        <button class="hamburger-btn" aria-label="메뉴 열기" aria-expanded="false" aria-controls="site-nav">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>`.trim()
}

export function renderFooter() {
  return `
  <footer class="site-footer">
    <div class="footer-inner">
      <nav class="footer-nav" aria-label="사이트 이동">
        <div class="footer-col">
          <p class="footer-col-title" data-i18n="footer.col.blog">블로그</p>
          <div class="footer-col-links">
            <a href="/blog/" data-i18n="nav.blog">전체 글</a>
            <a href="/category/" data-i18n="nav.category">카테고리</a>
            <a href="/tag/" data-i18n="nav.tag">태그</a>
          </div>
        </div>
        <div class="footer-col">
          <p class="footer-col-title" data-i18n="footer.col.more">더 보기</p>
          <div class="footer-col-links">
            <a href="/search/" data-i18n="nav.search">검색</a>
            <a href="/about/" data-i18n="nav.about">소개</a>
            <a href="/rss.xml" data-i18n="footer.rss">RSS</a>
            <a href="/sitemap.xml" data-i18n="footer.sitemap">사이트맵</a>
          </div>
        </div>
      </nav>
      <div class="footer-bottom">
        <p class="footer-copy">Copyright &copy; 2024 ${SITE_TITLE}. <span data-i18n="footer.copyright">All rights reserved.</span></p>
      </div>
    </div>
  </footer>
  <script src="/assets/nav.js" defer></script>
  <script src="/assets/i18n.js" defer></script>`.trim()
}

export function renderPage({ head, body, path = '', extraScripts = '' }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  ${head}
</head>
<body>
  ${renderHeader(path)}
  <main id="main">
    ${body}
  </main>
  ${renderFooter()}
  ${extraScripts}
</body>
</html>`
}

export function renderBlogCard(post) {
  const tags = (post.tags || []).map(tag =>
    `<a href="/tag/${slugify(tag)}/" class="tag-pill">${escHtml(tag)}</a>`
  ).join(' ')

  const coverHtml = post.coverImage
    ? `<div class="blog-card-cover">
        <img src="${escAttr(post.coverImage)}" alt="" width="600" height="400" loading="lazy" />
      </div>`
    : ''

  return `
  <article class="blog-card">
    ${coverHtml}
    <div class="blog-card-body">
      <p class="blog-card-category">
        <a href="/category/${slugify(post.category)}/">${escHtml(post.category)}</a>
      </p>
      <h2 class="blog-card-title">
        <a href="/blog/${post.slug}/">${escHtml(post.title)}</a>
      </h2>
      <p class="blog-card-excerpt">${escHtml(post.excerpt)}</p>
      ${tags ? `<div class="tags-list" style="margin-top:var(--space-xs)">${tags}</div>` : ''}
      <div class="blog-card-meta" style="margin-top:auto;padding-top:var(--space-sm)">
        <span>${escHtml(post.author)}</span>
        <span aria-hidden="true">·</span>
        <time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>
        ${post.readingTime ? `<span aria-hidden="true">·</span><span>${post.readingTime}분 읽기</span>` : ''}
      </div>
      <p class="blog-card-cta"><a href="/blog/${post.slug}/" data-i18n="card.readMore">더 읽기 →</a></p>
    </div>
  </article>`.trim()
}

export function renderPostMeta(post) {
  return `
  <div class="post-meta">
    <div class="post-meta-item">
      <span class="u-sr-only" data-i18n="post.author">작성자</span>
      <strong>${escHtml(post.author)}</strong>
    </div>
    <div class="post-meta-item">
      <span class="u-sr-only" data-i18n="post.publishedAt">작성일</span>
      <time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>
    </div>
    <div class="post-meta-item">
      <a href="/category/${slugify(post.category)}/" class="category-pill">${escHtml(post.category)}</a>
    </div>
    ${post.readingTime ? `<div class="post-meta-item"><span>${post.readingTime}분 읽기</span></div>` : ''}
  </div>`.trim()
}

export function renderPrevNext(prev, next) {
  const prevHtml = prev
    ? `<a href="/blog/${prev.slug}/" class="prev-next-item prev">
        <span class="prev-next-label" data-i18n="post.prev">이전 글</span>
        <span class="prev-next-title">${escHtml(prev.title)}</span>
      </a>`
    : `<div class="prev-next-empty"></div>`

  const nextHtml = next
    ? `<a href="/blog/${next.slug}/" class="prev-next-item next">
        <span class="prev-next-label" data-i18n="post.next">다음 글</span>
        <span class="prev-next-title">${escHtml(next.title)}</span>
      </a>`
    : `<div class="prev-next-empty"></div>`

  return `<nav class="prev-next" aria-label="이전/다음 글">${prevHtml}${nextHtml}</nav>`
}

export function renderPagination(currentPage, totalPages, basePath) {
  if (totalPages <= 1) return ''
  const prevHref = currentPage > 1 ? (currentPage === 2 ? basePath : `${basePath}page/${currentPage - 1}/`) : null
  const nextHref = currentPage < totalPages ? `${basePath}page/${currentPage + 1}/` : null
  return `
  <nav class="pagination" aria-label="페이지 이동">
    <a href="${prevHref || '#'}" class="pagination-btn${prevHref ? '' : ' disabled'}"${prevHref ? '' : ' aria-disabled="true"'} data-i18n="pagination.prev">이전</a>
    <span class="pagination-info">${currentPage} / ${totalPages}</span>
    <a href="${nextHref || '#'}" class="pagination-btn${nextHref ? '' : ' disabled'}"${nextHref ? '' : ' aria-disabled="true"'} data-i18n="pagination.next">다음</a>
  </nav>`.trim()
}

export function renderBreadcrumb(items) {
  const parts = items.map(({ href, label }, i) => {
    const isLast = i === items.length - 1
    return isLast
      ? `<span aria-current="page">${escHtml(label)}</span>`
      : `<a href="${href}">${escHtml(label)}</a><span class="breadcrumb-sep" aria-hidden="true"> / </span>`
  }).join('')
  return `<nav class="breadcrumb" aria-label="현재 위치">${parts}</nav>`
}

// ── Page Renderers ──────────────────────────────────────────────

export function renderHomePage(posts) {
  const recentPosts = posts.slice(0, 6)
  const cards = recentPosts.map(p => renderBlogCard(p)).join('\n')

  const head = renderHead({
    title: '',
    description: '개발자를 위한 기술 블로그',
    path: '/',
  })

  const body = `
    <!-- Hero: full-bleed dark tile -->
    <div class="tile tile--dark">
      <div class="container">
        <p class="tile-eyebrow" data-i18n="home.hero.eyebrow">개발 블로그</p>
        <h1 class="tile-headline" data-i18n="home.hero.title">${SITE_TITLE}</h1>
        <p class="tile-tagline" data-i18n="home.hero.description">실용적인 개발 지식과 경험을 공유합니다.</p>
        <div class="tile-cta-group">
          <a href="/blog/" class="btn-primary" data-i18n="home.hero.cta.primary">글 보러 가기</a>
          <a href="/about/" class="btn-secondary btn-secondary--on-dark" data-i18n="home.hero.cta.secondary">소개</a>
        </div>
      </div>
    </div>

    <!-- Recent Posts: light section -->
    <div class="section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title" data-i18n="home.recent.title">최근 글</h2>
          <a href="/blog/" class="section-link" data-i18n="home.viewAll">전체 보기 →</a>
        </div>
        <div class="blog-grid">
          ${cards}
        </div>
      </div>
    </div>`

  return renderPage({ head, body, path: '/' })
}

export function renderBlogListPage(posts, currentPage, totalPages) {
  const cards = posts.map(p => renderBlogCard(p)).join('\n')
  const pageTitle = currentPage > 1 ? `블로그 — ${currentPage}페이지` : '블로그'

  const head = renderHead({
    title: pageTitle,
    description: '모든 블로그 글 목록',
    path: currentPage > 1 ? `/blog/page/${currentPage}/` : '/blog/',
  })

  const breadcrumb = renderBreadcrumb([
    { href: '/', label: '홈' },
    { href: '/blog/', label: '블로그' },
  ])

  const body = `
    <div class="section">
      <div class="container">
        ${breadcrumb}
        <div class="page-header">
          <h1 class="page-title" data-i18n="blog.title">블로그</h1>
        </div>
        <div class="blog-grid">
          ${cards || '<div class="empty-state"><p class="empty-state-title" data-i18n="blog.empty">아직 글이 없습니다.</p></div>'}
        </div>
        ${renderPagination(currentPage, totalPages, '/blog/')}
      </div>
    </div>`

  return renderPage({ head, body, path: '/blog/' })
}

export function renderBlogDetailPage(post, html, prev, next) {
  const description = post.description || post.excerpt
  const canonicalUrl = post.canonical || `${SITE_URL}/blog/${post.slug}/`

  const ogImageMeta = post.coverImage
    ? `\n  <meta property="og:image" content="${SITE_URL}${escAttr(post.coverImage)}" />\n  <meta name="twitter:image" content="${SITE_URL}${escAttr(post.coverImage)}" />\n  <meta name="twitter:card" content="summary_large_image" />`
    : ''

  const head = renderHead({
    title: post.title,
    description,
    canonical: canonicalUrl,
    ogTitle: post.title,
    ogDescription: description,
    path: `/blog/${post.slug}/`,
  }) + `\n  <meta property="og:type" content="article" />` + ogImageMeta

  const breadcrumb = renderBreadcrumb([
    { href: '/', label: '홈' },
    { href: '/blog/', label: '블로그' },
    { href: `/blog/${post.slug}/`, label: post.title },
  ])

  const tags = (post.tags || []).map(tag =>
    `<a href="/tag/${slugify(tag)}/" class="tag-pill">${escHtml(tag)}</a>`
  ).join(' ')

  const body = `
    <div class="article-content-section">
      <div class="container">
        ${breadcrumb}
        <header class="article-header">
          <h1 class="article-title">${escHtml(post.title)}</h1>
          ${renderPostMeta(post)}
          ${tags ? `<div class="tags-list">${tags}</div>` : ''}
        </header>
        <div class="article-body">
          ${html}
        </div>
        ${renderPrevNext(prev, next)}
      </div>
    </div>`

  return renderPage({ head, body, path: `/blog/${post.slug}/` })
}

export function renderCategoryPage(categorySlug, categoryName, posts, currentPage, totalPages) {
  const cards = posts.map(p => renderBlogCard(p)).join('\n')
  const head = renderHead({
    title: `${categoryName} 카테고리`,
    description: `${categoryName} 카테고리의 글 목록`,
    path: `/category/${categorySlug}/`,
  })

  const breadcrumb = renderBreadcrumb([
    { href: '/', label: '홈' },
    { href: '/category/', label: '카테고리' },
    { href: `/category/${categorySlug}/`, label: categoryName },
  ])

  const body = `
    <div class="section">
      <div class="container">
        ${breadcrumb}
        <div class="page-header">
          <h1 class="page-title">${escHtml(categoryName)}</h1>
        </div>
        <div class="blog-grid">
          ${cards || '<div class="empty-state"><p class="empty-state-title">아직 글이 없습니다.</p></div>'}
        </div>
        ${renderPagination(currentPage, totalPages, `/category/${categorySlug}/`)}
      </div>
    </div>`

  return renderPage({ head, body, path: `/category/${categorySlug}/` })
}

export function renderTagPage(tagSlug, tagName, posts) {
  const cards = posts.map(p => renderBlogCard(p)).join('\n')
  const head = renderHead({
    title: `#${tagName}`,
    description: `${tagName} 태그의 글 목록`,
    path: `/tag/${tagSlug}/`,
  })

  const breadcrumb = renderBreadcrumb([
    { href: '/', label: '홈' },
    { href: '/tag/', label: '태그' },
    { href: `/tag/${tagSlug}/`, label: tagName },
  ])

  const body = `
    <div class="section">
      <div class="container">
        ${breadcrumb}
        <div class="page-header">
          <h1 class="page-title">#${escHtml(tagName)}</h1>
        </div>
        <div class="blog-grid">
          ${cards || '<div class="empty-state"><p class="empty-state-title">아직 글이 없습니다.</p></div>'}
        </div>
      </div>
    </div>`

  return renderPage({ head, body, path: `/tag/${tagSlug}/` })
}

export function renderCategoryIndexPage(categories) {
  const head = renderHead({
    title: '카테고리',
    description: '모든 카테고리 목록',
    path: '/category/',
  })

  const items = categories.map(({ slug, name, count }) =>
    `<a href="/category/${slug}/" class="index-card">
      <span class="index-card-name">${escHtml(name)}</span>
      <span class="index-card-count">${count}개의 글</span>
    </a>`
  ).join('\n')

  const body = `
    <div class="section">
      <div class="container">
        ${renderBreadcrumb([{ href: '/', label: '홈' }, { href: '/category/', label: '카테고리' }])}
        <div class="page-header">
          <h1 class="page-title" data-i18n="category.title">카테고리</h1>
        </div>
        <div class="index-grid">${items}</div>
      </div>
    </div>`

  return renderPage({ head, body, path: '/category/' })
}

export function renderTagIndexPage(tags) {
  const head = renderHead({
    title: '태그',
    description: '모든 태그 목록',
    path: '/tag/',
  })

  const items = tags.map(({ slug, name, count }) =>
    `<a href="/tag/${slug}/" class="tag-pill">
      ${escHtml(name)}<span class="u-text-muted" style="margin-left:4px">(${count})</span>
    </a>`
  ).join('\n')

  const body = `
    <div class="section">
      <div class="container">
        ${renderBreadcrumb([{ href: '/', label: '홈' }, { href: '/tag/', label: '태그' }])}
        <div class="page-header">
          <h1 class="page-title" data-i18n="tag.title">태그</h1>
        </div>
        <div class="tags-list" style="padding:var(--space-sm) 0">${items}</div>
      </div>
    </div>`

  return renderPage({ head, body, path: '/tag/' })
}

export function renderSearchPage() {
  const head = renderHead({
    title: '검색',
    description: '블로그 글 제목으로 검색',
    path: '/search/',
  })

  const body = `
    <div class="section">
      <div class="container">
        ${renderBreadcrumb([{ href: '/', label: '홈' }, { href: '/search/', label: '검색' }])}
        <div class="page-header">
          <h1 class="page-title" data-i18n="search.title">검색</h1>
        </div>
        <div class="search-field">
          <svg class="search-icon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            class="search-input"
            placeholder="제목으로 검색..."
            data-i18n-placeholder="search.placeholder"
            aria-label="검색어 입력"
            autocomplete="off"
          />
        </div>
        <p class="search-status" aria-live="polite"></p>
        <div class="search-results" role="region" aria-live="polite" aria-label="검색 결과"></div>
      </div>
    </div>`

  return renderPage({ head, body, path: '/search/', extraScripts: '<script src="/assets/search.js" defer></script>' })
}

export function renderAboutPage() {
  const head = renderHead({
    title: '소개',
    description: '블로그 소개 페이지',
    path: '/about/',
  })

  const body = `
    <div class="section">
      <div class="container">
        ${renderBreadcrumb([{ href: '/', label: '홈' }, { href: '/about/', label: '소개' }])}
        <div class="page-header">
          <h1 class="page-title" data-i18n="about.title">소개</h1>
        </div>
        <div class="about-content">
          <p>개발자를 위한 기술 블로그입니다.</p>
          <p>JavaScript, CSS, 웹 성능, 개발 도구에 관한 실용적인 글을 작성합니다.</p>
        </div>
      </div>
    </div>`

  return renderPage({ head, body, path: '/about/' })
}

// ── Helpers ──────────────────────────────────────────────────────

export function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function escAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function slugify(str) {
  return String(str ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

export function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export { SITE_TITLE, SITE_URL }
