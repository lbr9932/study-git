import { slugify } from './templates.mjs'

export function generateSearchIndex(posts) {
  return posts.map(post => ({
    slug: post.slug,
    title: post.title,
    category: post.category,
    categorySlug: slugify(post.category),
    publishedAt: post.publishedAt,
  }))
}
