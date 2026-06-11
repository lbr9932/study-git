const SITE_URL = 'https://example.com'
const SITE_TITLE = '개발 블로그'
const SITE_DESCRIPTION = '개발자를 위한 기술 블로그'

function escXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function generateRSS(posts) {
  const buildDate = new Date().toUTCString()

  const items = posts.slice(0, 20).map(post => {
    const pubDate = new Date(post.publishedAt).toUTCString()
    const link = `${SITE_URL}/blog/${post.slug}/`
    const description = post.excerpt || post.description || ''

    return `  <item>
    <title>${escXml(post.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <description>${escXml(description)}</description>
    <pubDate>${pubDate}</pubDate>
    <category>${escXml(post.category)}</category>
  </item>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`
}
