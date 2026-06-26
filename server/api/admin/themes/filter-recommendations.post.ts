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

    // 1. Co-occurring tags for each tag_name filter
    const tagFilters = existingFilters.filter(f => f.type === 'tag_name')
    for (const tf of tagFilters) {
      const tagRow = await db.select({ id: schema.tags.id })
        .from(schema.tags)
        .where(eq(schema.tags.name, tf.value))
        .limit(1)
        .get()
      if (!tagRow) continue

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
                .where(eq(schema.quoteTags.tagId, tagRow.id))
            ),
            ne(schema.quoteTags.tagId, tagRow.id),
          )
        )
        .groupBy(schema.tags.id, schema.tags.name)
        .orderBy(desc(count(schema.quoteTags.quoteId)))
        .limit(3)
        .all()

      for (const ct of coTags) {
        if (!alreadyHas('tag_name', ct.name) && !candidates.some(c => c.type === 'tag_name' && c.value === ct.name)) {
          candidates.push({ type: 'tag_name', value: ct.name, label: ct.name })
        }
      }
    }

    // 2. Top tags for each author_name filter
    const authorFilters = existingFilters.filter(f => f.type === 'author_name')
    for (const af of authorFilters) {
      const authorRow = await db.select({ id: schema.authors.id })
        .from(schema.authors)
        .where(like(schema.authors.name, `%${af.value}%`))
        .limit(1)
        .get()
      if (!authorRow) continue

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
        .limit(3)
        .all()

      for (const t of authorTags) {
        if (!alreadyHas('tag_name', t.name) && !candidates.some(c => c.type === 'tag_name' && c.value === t.name)) {
          candidates.push({ type: 'tag_name', value: t.name, label: t.name })
        }
      }
    }

    // 3. Top tags for each reference_name filter
    const refFilters = existingFilters.filter(f => f.type === 'reference_name')
    for (const rf of refFilters) {
      const refRow = await db.select({ id: schema.quoteReferences.id })
        .from(schema.quoteReferences)
        .where(like(schema.quoteReferences.name, `%${rf.value}%`))
        .limit(1)
        .get()
      if (!refRow) continue

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
        .limit(3)
        .all()

      for (const t of refTags) {
        if (!alreadyHas('tag_name', t.name) && !candidates.some(c => c.type === 'tag_name' && c.value === t.name)) {
          candidates.push({ type: 'tag_name', value: t.name, label: t.name })
        }
      }
    }

    // 4. Keywords from theme name — find matching tags
    if (themeName) {
      const words = themeName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)

      for (const word of words) {
        if (alreadyHas('keyword', word)) continue
        const matchingTags = await db.select({ name: schema.tags.name })
          .from(schema.tags)
          .where(like(schema.tags.name, `%${word}%`))
          .limit(2)
          .all()

        for (const mt of matchingTags) {
          if (!alreadyHas('tag_name', mt.name) && !candidates.some(c => c.type === 'tag_name' && c.value === mt.name)) {
            candidates.push({ type: 'tag_name', value: mt.name, label: mt.name })
          }
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
      .slice(0, 5)

    return { success: true, data: suggestions }
  } catch (error) {
    console.error('Error generating filter recommendations:', error)
    throwServer(500, 'Failed to generate filter recommendations')
  }
})
