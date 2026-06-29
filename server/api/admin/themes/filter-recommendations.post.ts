import { db, schema } from 'hub:db'
import { eq, and, ne, desc, count, inArray, like } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const body = await readBody(event)
    const themeName: string = (body?.name || '').trim()
    const existingFilters: { type: string; value: string }[] = body?.filters || []

    const existingValues = new Map<string, Set<string>>()
    for (const f of existingFilters) {
      if (!existingValues.has(f.type)) existingValues.set(f.type, new Set())
      existingValues.get(f.type)!.add(f.value.toLowerCase())
    }

    const alreadyHas = (type: string, value: string) =>
      existingValues.get(type)?.has(value.toLowerCase())

    const candidates: { type: string; value: string; label: string }[] = []

    const pushIfNew = (type: string, value: string, label: string) => {
      if (alreadyHas(type, value)) return false
      if (candidates.some(c => c.type === type && c.value === value)) return false
      candidates.push({ type, value, label })
      return true
    }

    // 1. Co-occurring tags, top authors, and top references for each tag_name filter
    const tagFilters = existingFilters.filter(f => f.type === 'tag_name')
    for (const tf of tagFilters) {
      const tagRow = await db.select({ id: schema.tags.id })
        .from(schema.tags)
        .where(eq(schema.tags.name, tf.value))
        .limit(1)
        .get()
      if (!tagRow) continue

      const filteredQuoteIds = db.select({ id: schema.quoteTags.quoteId })
        .from(schema.quoteTags)
        .where(eq(schema.quoteTags.tagId, tagRow.id))

      // Co-occurring tags (existing)
      const coTags = await db.select({
        name: schema.tags.name,
        count: count(schema.quoteTags.quoteId),
      })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .where(
          and(
            inArray(schema.quoteTags.quoteId, filteredQuoteIds),
            ne(schema.quoteTags.tagId, tagRow.id),
          )
        )
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(2)
        .all()

      for (const ct of coTags) {
        pushIfNew('tag_name', ct.name, ct.name)
      }

      // Top authors for this tag
      const tagAuthors = await db.select({
        name: schema.authors.name,
        count: count(schema.quotes.id),
      })
        .from(schema.quoteTags)
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .innerJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
        .where(
          and(
            eq(schema.quoteTags.tagId, tagRow.id),
            eq(schema.quotes.status, 'approved'),
          )
        )
        .groupBy(schema.authors.id, schema.authors.name)
        .orderBy(desc(count(schema.quotes.id)))
        .limit(2)
        .all()

      for (const ta of tagAuthors) {
        pushIfNew('author_name', ta.name, ta.name)
      }

      // Top references for this tag
      const tagRefs = await db.select({
        name: schema.quoteReferences.name,
        count: count(schema.quotes.id),
      })
        .from(schema.quoteTags)
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .innerJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
        .where(
          and(
            eq(schema.quoteTags.tagId, tagRow.id),
            eq(schema.quotes.status, 'approved'),
          )
        )
        .groupBy(schema.quoteReferences.id, schema.quoteReferences.name)
        .orderBy(desc(count(schema.quotes.id)))
        .limit(2)
        .all()

      for (const tr of tagRefs) {
        pushIfNew('reference_name', tr.name, tr.name)
      }
    }

    // 2. Top tags and top references for each author_name filter
    const authorFilters = existingFilters.filter(f => f.type === 'author_name')
    for (const af of authorFilters) {
      const authorRow = await db.select({ id: schema.authors.id })
        .from(schema.authors)
        .where(like(schema.authors.name, `%${af.value}%`))
        .limit(1)
        .get()
      if (!authorRow) continue

      // Top tags for this author (existing)
      const authorTags = await db.select({
        name: schema.tags.name,
        count: count(schema.quoteTags.quoteId),
      })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .where(
          and(
            eq(schema.quotes.authorId, authorRow.id),
            eq(schema.quotes.status, 'approved'),
          )
        )
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(2)
        .all()

      for (const t of authorTags) {
        pushIfNew('tag_name', t.name, t.name)
      }

      // Top references for this author
      const authorRefs = await db.select({
        name: schema.quoteReferences.name,
        count: count(schema.quotes.id),
      })
        .from(schema.quotes)
        .innerJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
        .where(
          and(
            eq(schema.quotes.authorId, authorRow.id),
            eq(schema.quotes.status, 'approved'),
          )
        )
        .groupBy(schema.quoteReferences.id, schema.quoteReferences.name)
        .orderBy(desc(count(schema.quotes.id)))
        .limit(2)
        .all()

      for (const r of authorRefs) {
        pushIfNew('reference_name', r.name, r.name)
      }
    }

    // 3. Top tags and top authors for each reference_name filter
    const refFilters = existingFilters.filter(f => f.type === 'reference_name')
    for (const rf of refFilters) {
      const refRow = await db.select({ id: schema.quoteReferences.id })
        .from(schema.quoteReferences)
        .where(like(schema.quoteReferences.name, `%${rf.value}%`))
        .limit(1)
        .get()
      if (!refRow) continue

      // Top tags for this reference (existing)
      const refTags = await db.select({
        name: schema.tags.name,
        count: count(schema.quoteTags.quoteId),
      })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
        .where(
          and(
            eq(schema.quotes.referenceId, refRow.id),
            eq(schema.quotes.status, 'approved'),
          )
        )
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(2)
        .all()

      for (const t of refTags) {
        pushIfNew('tag_name', t.name, t.name)
      }

      // Top authors for this reference
      const refAuthors = await db.select({
        name: schema.authors.name,
        count: count(schema.quotes.id),
      })
        .from(schema.quotes)
        .innerJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
        .where(
          and(
            eq(schema.quotes.referenceId, refRow.id),
            eq(schema.quotes.status, 'approved'),
          )
        )
        .groupBy(schema.authors.id, schema.authors.name)
        .orderBy(desc(count(schema.quotes.id)))
        .limit(2)
        .all()

      for (const a of refAuthors) {
        pushIfNew('author_name', a.name, a.name)
      }
    }

    // 4. Keywords from theme name — find matching tags, authors, references
    if (themeName) {
      const words = themeName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)

      for (const word of words) {
        // Suggest the keyword itself
        pushIfNew('keyword', word, word)

        // Matching tags
        const matchingTags = await db.select({ name: schema.tags.name })
          .from(schema.tags)
          .where(like(schema.tags.name, `%${word}%`))
          .limit(1)
          .all()

        for (const mt of matchingTags) {
          pushIfNew('tag_name', mt.name, mt.name)
        }

        // Matching authors
        const matchingAuthors = await db.select({ name: schema.authors.name })
          .from(schema.authors)
          .where(like(schema.authors.name, `%${word}%`))
          .limit(1)
          .all()

        for (const ma of matchingAuthors) {
          pushIfNew('author_name', ma.name, ma.name)
        }

        // Matching references
        const matchingRefs = await db.select({ name: schema.quoteReferences.name })
          .from(schema.quoteReferences)
          .where(like(schema.quoteReferences.name, `%${word}%`))
          .limit(1)
          .all()

        for (const mr of matchingRefs) {
          pushIfNew('reference_name', mr.name, mr.name)
        }
      }
    }

    // Deduplicate and limit
    const seen = new Set<string>()
    const suggestions = candidates
      .filter(c => {
        const key = `${c.type}:${c.value}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 8)

    return { success: true, data: suggestions }
  } catch (error) {
    console.error('Error generating filter recommendations:', error)
    throwServer(500, 'Failed to generate filter recommendations')
  }
})
