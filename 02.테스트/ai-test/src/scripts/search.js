let index = null

async function loadIndex() {
  if (index) return index
  const res = await fetch('/search-index.json')
  index = await res.json()
  return index
}

function search(query, data) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return data.filter(item => item.title.toLowerCase().includes(q))
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function renderResults(results, container, query) {
  const statusEl = document.querySelector('.search-status')

  if (!query.trim()) {
    container.innerHTML = ''
    if (statusEl) statusEl.textContent = ''
    return
  }

  if (results.length === 0) {
    container.innerHTML = '<p class="empty-state-title">검색 결과가 없습니다.</p>'
    if (statusEl) {
      statusEl.setAttribute('data-i18n', 'search.noResults')
      statusEl.textContent = '검색 결과가 없습니다.'
    }
    return
  }

  if (statusEl) {
    statusEl.textContent = `${results.length}건의 검색 결과`
  }

  container.innerHTML = results.map(item => `
    <article class="search-result-item">
      <h2 class="search-result-title">
        <a href="/blog/${item.slug}/">${item.title}</a>
      </h2>
      <div class="search-result-meta">
        <a href="/category/${item.categorySlug}/" class="category-pill">${item.category}</a>
        <time datetime="${item.publishedAt}">${formatDate(item.publishedAt)}</time>
      </div>
    </article>
  `).join('')
}

async function initSearch() {
  const input = document.querySelector('.search-input')
  const resultsEl = document.querySelector('.search-results')

  if (!input || !resultsEl) return

  // Restore query from URL
  const params = new URLSearchParams(location.search)
  const initialQuery = params.get('q') || ''
  if (initialQuery) {
    input.value = initialQuery
    const data = await loadIndex()
    renderResults(search(initialQuery, data), resultsEl, initialQuery)
  }

  let debounceTimer

  input.addEventListener('input', () => {
    const query = input.value

    // Update URL without reload
    const url = new URL(location.href)
    if (query.trim()) {
      url.searchParams.set('q', query)
    } else {
      url.searchParams.delete('q')
    }
    history.replaceState(null, '', url.toString())

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      const data = await loadIndex()
      renderResults(search(query, data), resultsEl, query)
    }, 200)
  })
}

document.addEventListener('DOMContentLoaded', initSearch)
