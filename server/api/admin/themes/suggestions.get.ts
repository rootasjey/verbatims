import { db, schema } from 'hub:db'
import { eq, and, ne, desc, count, inArray } from 'drizzle-orm'

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'theme'
}

const colorPairs = [
  ['indigo', 'amber'],
  ['emerald', 'yellow'],
  ['violet', 'pink'],
  ['blue', 'cyan'],
  ['rose', 'slate'],
  ['teal', 'orange'],
  ['fuchsia', 'lime'],
  ['sky', 'indigo'],
  ['purple', 'emerald'],
  ['amber', 'stone'],
]

const MIN_QUOTES = 5
const MAX_SUGGESTIONS = 6

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const existingRows = await db.select({ slug: schema.themes.slug })
      .from(schema.themes)
      .all()
    const existingSlugs = new Set(existingRows.map(r => r.slug))

    const [topTags, topAuthors, topReferences] = await Promise.all([
      db.select({
        id: schema.tags.id,
        name: schema.tags.name,
        count: count(schema.quoteTags.quoteId),
      })
        .from(schema.tags)
        .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .where(eq(schema.quotes.status, 'approved'))
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(10)
        .all(),

      db.select({
        id: schema.authors.id,
        name: schema.authors.name,
        count: count(schema.quotes.id),
      })
        .from(schema.authors)
        .innerJoin(schema.quotes, eq(schema.authors.id, schema.quotes.authorId))
        .where(eq(schema.quotes.status, 'approved'))
        .groupBy(schema.authors.id, schema.authors.name)
        .orderBy(desc(count(schema.quotes.id)))
        .limit(6)
        .all(),

      db.select({
        id: schema.quoteReferences.id,
        name: schema.quoteReferences.name,
        count: count(schema.quotes.id),
      })
        .from(schema.quoteReferences)
        .innerJoin(schema.quotes, eq(schema.quoteReferences.id, schema.quotes.referenceId))
        .where(eq(schema.quotes.status, 'approved'))
        .groupBy(schema.quoteReferences.id, schema.quoteReferences.name)
        .orderBy(desc(count(schema.quotes.id)))
        .limit(6)
        .all(),
    ])

    const suggestions: any[] = []
    let colorIndex = 0

    const addSuggestion = (type: string, name: string, desc: string, filters: any[]) => {
      if (suggestions.length >= MAX_SUGGESTIONS) return
      const pair = colorPairs[colorIndex % colorPairs.length]
      colorIndex++
      suggestions.push({
        type,
        name,
        slug: slugify(name),
        description: desc,
        color_primary: pair[0],
        color_secondary: pair[1],
        filters,
      })
    }

    // --- Tag suggestions with co-occurring tags ---
    for (const tag of topTags) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      if (existingSlugs.has(slugify(`#${tag.name}`))) continue
      if (tag.count < MIN_QUOTES) continue

      const filters: any[] = [
        { type: 'tag_name', value: tag.name, match_mode: 'any' },
      ]

      const coTags = await db.select({
        name: schema.tags.name,
        count: count(schema.quoteTags.quoteId),
      })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .where(
          and(
            inArray(schema.quoteTags.quoteId,
              db.select({ id: schema.quoteTags.quoteId })
                .from(schema.quoteTags)
                .where(eq(schema.quoteTags.tagId, tag.id))
            ),
            ne(schema.quoteTags.tagId, tag.id),
          )
        )
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(2)
        .all()

      for (const ct of coTags) {
        filters.push({ type: 'tag_name', value: ct.name, match_mode: 'any' })
      }

      addSuggestion(
        'tag',
        `#${tag.name}`,
        `A curated collection of quotes tagged with ${tag.name}`,
        filters,
      )
    }

    // --- Author suggestions with their top tags ---
    for (const author of topAuthors) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      if (existingSlugs.has(slugify(author.name))) continue
      if (author.count < MIN_QUOTES) continue

      const filters: any[] = [
        { type: 'author_name', value: author.name, match_mode: 'any' },
      ]

      const authorTags = await db.select({
        name: schema.tags.name,
        count: count(schema.quoteTags.quoteId),
      })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .where(
          and(
            eq(schema.quotes.authorId, author.id),
            eq(schema.quotes.status, 'approved'),
          )
        )
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(2)
        .all()

      for (const t of authorTags) {
        filters.push({ type: 'tag_name', value: t.name, match_mode: 'any' })
      }

      addSuggestion(
        'author',
        author.name,
        `Featuring quotes by ${author.name}`,
        filters,
      )
    }

    // --- Reference suggestions with their top tags ---
    for (const ref of topReferences) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      if (existingSlugs.has(slugify(ref.name))) continue
      if (ref.count < MIN_QUOTES) continue

      const filters: any[] = [
        { type: 'reference_name', value: ref.name, match_mode: 'any' },
      ]

      const refTags = await db.select({
        name: schema.tags.name,
        count: count(schema.quoteTags.quoteId),
      })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .where(
          and(
            eq(schema.quotes.referenceId, ref.id),
            eq(schema.quotes.status, 'approved'),
          )
        )
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(2)
        .all()

      for (const t of refTags) {
        filters.push({ type: 'tag_name', value: t.name, match_mode: 'any' })
      }

      addSuggestion(
        'reference',
        ref.name,
        `Quotes from ${ref.name}`,
        filters,
      )
    }

    return { success: true, data: suggestions }
  } catch (error) {
    console.error('Error generating theme suggestions:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to generate theme suggestions' })
  }
})
