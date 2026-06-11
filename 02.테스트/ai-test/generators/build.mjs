import { readdir, readFile, writeFile, mkdir, cp } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { marked } from 'marked'
import {
  renderHomePage,
  renderBlogListPage,
  renderBlogDetailPage,
  renderCategoryPage,
  renderCategoryIndexPage,
  renderTagPage,
  renderTagIndexPage,
  renderSearchPage,
  renderAboutPage,
  slugify,
} from './templates.mjs'
import { generateSitemap } from './sitemap.mjs'
import { generateRSS } from './rss.mjs'
import { generateSearchIndex } from './search-index.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')
const POSTS_PER_PAGE = 10

// Configure marked
marked.setOptions({ gfm: true, breaks: false })

async function ensureDir(path) {
  await mkdir(path, { recursive: true })
}

async function write(path, content) {
  await ensureDir(dirname(path))
  await writeFile(path, content, 'utf8')
}

async function loadPosts() {
  const postsDir = join(SRC, 'content', 'posts')
  const files = (await readdir(postsDir)).filter(f => f.endsWith('.md'))

  const posts = await Promise.all(
    files.map(async file => {
      const raw = await readFile(join(postsDir, file), 'utf8')
      const { data, content } = matter(raw)

      if (data.draft) return null

      const slug = data.slug || file.replace(/\.md$/, '')
      const readingTime = data.readingTime || Math.max(1, Math.ceil(content.split(/\s+/).length / 200))

      const toDateStr = val => {
        if (!val) return ''
        if (val instanceof Date) return val.toISOString().split('T')[0]
        return String(val)
      }

      return {
        slug,
        title: data.title || slug,
        excerpt: data.excerpt || content.slice(0, 160).replace(/[#\n*`]/g, '').trim(),
        category: data.category || 'general',
        tags: Array.isArray(data.tags) ? data.tags : [],
        coverImage: data.coverImage || '',
        publishedAt: toDateStr(data.publishedAt) || new Date().toISOString().split('T')[0],
        updatedAt: toDateStr(data.updatedAt),
        author: data.author || 'admin',
        readingTime,
        description: data.description || data.excerpt || '',
        canonical: data.canonical || '',
        rawContent: content,
      }
    })
  )

  return posts
    .filter(Boolean)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}

async function copyAssets() {
  const assetsDir = join(DIST, 'assets')
  await ensureDir(assetsDir)

  // Concatenate CSS files in order
  const cssFiles = ['tokens.css', 'base.css', 'components.css', 'utilities.css']
  const cssContent = await Promise.all(
    cssFiles.map(f => readFile(join(SRC, 'styles', f), 'utf8'))
  )
  await write(join(assetsDir, 'main.css'), cssContent.join('\n\n'))

  // Copy JS files
  const jsFiles = ['search.js', 'i18n.js', 'nav.js']
  await Promise.all(
    jsFiles.map(async f => {
      const src = join(SRC, 'scripts', f)
      if (existsSync(src)) {
        await cp(src, join(assetsDir, f))
      }
    })
  )

  // Copy locales to dist/locales/
  const localesDir = join(SRC, 'content', 'locales')
  const distLocales = join(DIST, 'locales')
  await ensureDir(distLocales)
  const localeFiles = await readdir(localesDir)
  await Promise.all(
    localeFiles.map(f => cp(join(localesDir, f), join(distLocales, f)))
  )

  // Copy images
  const imagesDir = join(SRC, 'assets', 'images')
  if (existsSync(imagesDir)) {
    const distImages = join(DIST, 'assets', 'images')
    await ensureDir(distImages)
    const imageFiles = await readdir(imagesDir)
    await Promise.all(
      imageFiles.map(f => cp(join(imagesDir, f), join(distImages, f)))
    )
  }
}

async function buildPosts(posts) {
  await Promise.all(
    posts.map(async (post, i) => {
      const html = marked(post.rawContent)
      const prev = posts[i + 1] || null
      const next = posts[i - 1] || null
      const page = renderBlogDetailPage(post, html, prev, next)
      await write(join(DIST, 'blog', post.slug, 'index.html'), page)
    })
  )
}

async function buildBlogList(posts) {
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE) || 1

  for (let page = 1; page <= totalPages; page++) {
    const pagePosts = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)
    const html = renderBlogListPage(pagePosts, page, totalPages)
    if (page === 1) {
      await write(join(DIST, 'blog', 'index.html'), html)
    } else {
      await write(join(DIST, 'blog', 'page', String(page), 'index.html'), html)
    }
  }
}

async function buildCategories(posts) {
  const categoryMap = new Map()
  for (const post of posts) {
    const slug = slugify(post.category)
    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, { slug, name: post.category, posts: [] })
    }
    categoryMap.get(slug).posts.push(post)
  }

  const categories = [...categoryMap.values()].map(c => ({
    ...c,
    count: c.posts.length,
  }))

  // Category index
  await write(
    join(DIST, 'category', 'index.html'),
    renderCategoryIndexPage(categories)
  )

  // Individual category pages
  await Promise.all(
    categories.map(async ({ slug, name, posts: catPosts }) => {
      const totalPages = Math.ceil(catPosts.length / POSTS_PER_PAGE) || 1
      for (let page = 1; page <= totalPages; page++) {
        const pagePosts = catPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)
        const html = renderCategoryPage(slug, name, pagePosts, page, totalPages)
        if (page === 1) {
          await write(join(DIST, 'category', slug, 'index.html'), html)
        } else {
          await write(join(DIST, 'category', slug, 'page', String(page), 'index.html'), html)
        }
      }
    })
  )

  return categories
}

async function buildTags(posts) {
  const tagMap = new Map()
  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = slugify(tag)
      if (!tagMap.has(slug)) {
        tagMap.set(slug, { slug, name: tag, posts: [] })
      }
      tagMap.get(slug).posts.push(post)
    }
  }

  const tags = [...tagMap.values()].map(t => ({ ...t, count: t.posts.length }))

  // Tag index
  await write(join(DIST, 'tag', 'index.html'), renderTagIndexPage(tags))

  // Individual tag pages
  await Promise.all(
    tags.map(async ({ slug, name, posts: tagPosts }) => {
      const html = renderTagPage(slug, name, tagPosts)
      await write(join(DIST, 'tag', slug, 'index.html'), html)
    })
  )

  return tags
}

async function build() {
  const start = Date.now()
  console.log('Building...')

  await ensureDir(DIST)
  await copyAssets()
  console.log('✓ Assets copied')

  const posts = await loadPosts()
  console.log(`✓ Loaded ${posts.length} posts`)

  await Promise.all([
    buildPosts(posts),
    buildBlogList(posts),
  ])
  console.log('✓ Posts and blog list built')

  const [categories, tags] = await Promise.all([
    buildCategories(posts),
    buildTags(posts),
  ])
  console.log(`✓ ${categories.length} categories, ${tags.length} tags built`)

  // Static pages
  await Promise.all([
    write(join(DIST, 'index.html'), renderHomePage(posts)),
    write(join(DIST, 'search', 'index.html'), renderSearchPage()),
    write(join(DIST, 'about', 'index.html'), renderAboutPage()),
  ])
  console.log('✓ Static pages built')

  // Generators
  await Promise.all([
    write(join(DIST, 'sitemap.xml'), generateSitemap(posts, categories, tags)),
    write(join(DIST, 'rss.xml'), generateRSS(posts)),
    write(join(DIST, 'search-index.json'), JSON.stringify(generateSearchIndex(posts))),
  ])
  console.log('✓ Sitemap, RSS, search index generated')

  console.log(`\nBuild complete in ${Date.now() - start}ms → dist/`)
}

build().catch(err => {
  console.error('Build failed:', err)
  process.exit(1)
})
