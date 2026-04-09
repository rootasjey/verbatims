import { db, schema } from 'hub:db'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const [quotes, authors, references, tags] = await Promise.all([
    db.select({
      id: schema.quotes.id,
      updatedAt: schema.quotes.updatedAt
    })
      .from(schema.quotes)
      .where(eq(schema.quotes.status, 'approved'))
      .orderBy(desc(schema.quotes.updatedAt)),

    db.select({
      id: schema.authors.id,
      updatedAt: schema.authors.updatedAt
    })
      .from(schema.authors)
      .orderBy(desc(schema.authors.updatedAt)),

    db.select({
      id: schema.quoteReferences.id,
      updatedAt: schema.quoteReferences.updatedAt
    })
      .from(schema.quoteReferences)
      .orderBy(desc(schema.quoteReferences.updatedAt)),

    db.select({
      name: schema.tags.name,
      updatedAt: schema.tags.updatedAt
    })
      .from(schema.tags)
      .orderBy(desc(schema.tags.updatedAt))
  ])

  const quoteUrls = quotes.map((q) => ({
    loc: `/quotes/${q.id}`,
    lastmod: q.updatedAt ? new Date(q.updatedAt).toISOString() : undefined,
    changefreq: 'weekly' as const,
    priority: 0.8
  }))

  const authorUrls = authors.map((a) => ({
    loc: `/authors/${a.id}`,
    lastmod: a.updatedAt ? new Date(a.updatedAt).toISOString() : undefined,
    changefreq: 'weekly' as const,
    priority: 0.7
  }))

  const referenceUrls = references.map((r) => ({
    loc: `/references/${r.id}`,
    lastmod: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
    changefreq: 'weekly' as const,
    priority: 0.7
  }))

  const tagUrls = tags.map((t) => ({
    loc: `/tags/${encodeURIComponent(t.name)}`,
    lastmod: t.updatedAt ? new Date(t.updatedAt).toISOString() : undefined,
    changefreq: 'weekly' as const,
    priority: 0.6
  }))

  return [
    { loc: '/', changefreq: 'daily' as const, priority: 1.0 },
    { loc: '/quotes', changefreq: 'daily' as const, priority: 0.9 },
    { loc: '/authors', changefreq: 'daily' as const, priority: 0.8 },
    { loc: '/references', changefreq: 'daily' as const, priority: 0.8 },
    { loc: '/tags', changefreq: 'weekly' as const, priority: 0.7 },
    { loc: '/about', changefreq: 'monthly' as const, priority: 0.5 },
    { loc: '/search', changefreq: 'monthly' as const, priority: 0.6 },
    { loc: '/terms', changefreq: 'yearly' as const, priority: 0.3 },
    { loc: '/privacy', changefreq: 'yearly' as const, priority: 0.3 },
    ...quoteUrls,
    ...authorUrls,
    ...referenceUrls,
    ...tagUrls
  ]
})