const SITE_URL = 'https://example.com'

function urlEntry(loc, lastmod, priority = '0.8', changefreq = 'weekly') {
  return `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export function generateSitemap(posts, categories, tags) {
  const today = new Date().toISOString().split('T')[0]

  const staticUrls = [
    urlEntry('/', today, '1.0', 'daily'),
    urlEntry('/blog/', today, '0.9', 'daily'),
    urlEntry('/category/', today, '0.7', 'weekly'),
    urlEntry('/tag/', today, '0.7', 'weekly'),
    urlEntry('/search/', today, '0.5', 'monthly'),
    urlEntry('/about/', today, '0.5', 'monthly'),
  ]

  const postUrls = posts.map(post =>
    urlEntry(
      `/blog/${post.slug}/`,
      post.updatedAt || post.publishedAt,
      '0.8',
      'monthly'
    )
  )

  const categoryUrls = categories.map(cat =>
    urlEntry(`/category/${cat.slug}/`, today, '0.6', 'weekly')
  )

  const tagUrls = tags.map(tag =>
    urlEntry(`/tag/${tag.slug}/`, today, '0.5', 'weekly')
  )

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...postUrls, ...categoryUrls, ...tagUrls].join('\n')}
</urlset>`
}
