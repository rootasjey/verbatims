import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    const [quotes, authors, references, tags] = await Promise.all([
      db.select({
        id: schema.quotes.id,
        updatedAt: schema.quotes.updatedAt
      })
        .from(schema.quotes)
        .where(eq(schema.quotes.status, 'approved'))
        .limit(50000),

      db.select({
        id: schema.authors.id,
        updatedAt: schema.authors.updatedAt
      })
        .from(schema.authors)
        .limit(50000),

      db.select({
        id: schema.quoteReferences.id,
        updatedAt: schema.quoteReferences.updatedAt
      })
        .from(schema.quoteReferences)
        .limit(50000),

      db.select({
        name: schema.tags.name,
        updatedAt: schema.tags.updatedAt
      })
        .from(schema.tags)
        .limit(50000)
    ])

    const formatDate = (date: Date | null | undefined): string | undefined => {
      if (!date) return undefined
      try {
        return new Date(date).toISOString()
      } catch {
        return undefined
      }
    }

    const quoteUrls = quotes.map((q) => ({
      loc: `/quotes/${q.id}`,
      lastmod: formatDate(q.updatedAt),
      changefreq: 'weekly',
      priority: 0.8
    }))

    const authorUrls = authors.map((a) => ({
      loc: `/authors/${a.id}`,
      lastmod: formatDate(a.updatedAt),
      changefreq: 'weekly',
      priority: 0.7
    }))

    const referenceUrls = references.map((r) => ({
      loc: `/references/${r.id}`,
      lastmod: formatDate(r.updatedAt),
      changefreq: 'weekly',
      priority: 0.7
    }))

    const tagUrls = tags.map((t) => ({
      loc: `/tags/${encodeURIComponent(t.name)}`,
      lastmod: formatDate(t.updatedAt),
      changefreq: 'weekly',
      priority: 0.6
    }))

    return [
      { loc: '/', changefreq: 'daily', priority: 1.0 },
      { loc: '/quotes', changefreq: 'daily', priority: 0.9 },
      { loc: '/authors', changefreq: 'daily', priority: 0.8 },
      { loc: '/references', changefreq: 'daily', priority: 0.8 },
      { loc: '/tags', changefreq: 'weekly', priority: 0.7 },
      { loc: '/about', changefreq: 'monthly', priority: 0.5 },
      { loc: '/search', changefreq: 'monthly', priority: 0.6 },
      { loc: '/terms', changefreq: 'yearly', priority: 0.3 },
      { loc: '/privacy', changefreq: 'yearly', priority: 0.3 },
      ...quoteUrls,
      ...authorUrls,
      ...referenceUrls,
      ...tagUrls
    ]
  } catch (error) {
    console.error('[Sitemap] Failed to generate sitemap URLs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate sitemap URLs'
    })
  }
})