import { db, schema } from 'hub:db'
import { like, and, eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  const query = getQuery(event)
  const q = (query.q as string || '').trim()
  const filterType = query.type as string

  if (!q || q.length < 1) {
    return { success: true, data: [] }
  }

  try {
    let results: { label: string; value: string }[] = []

    switch (filterType) {
      case 'tag_name': {
        const rows = await db.select({ name: schema.tags.name })
          .from(schema.tags)
          .where(like(schema.tags.name, `%${q}%`))
          .orderBy(schema.tags.name)
          .limit(10)
          .all()
        results = rows.map(r => ({ label: r.name, value: r.name }))
        break
      }
      case 'author_name': {
        const rows = await db.select({ name: schema.authors.name })
          .from(schema.authors)
          .where(like(schema.authors.name, `%${q}%`))
          .orderBy(schema.authors.name)
          .limit(10)
          .all()
        results = rows.map(r => ({ label: r.name, value: r.name }))
        break
      }
      case 'reference_name': {
        const rows = await db.select({ name: schema.quoteReferences.name })
          .from(schema.quoteReferences)
          .where(like(schema.quoteReferences.name, `%${q}%`))
          .orderBy(schema.quoteReferences.name)
          .limit(10)
          .all()
        results = rows.map(r => ({ label: r.name, value: r.name }))
        break
      }
      case 'author_id': {
        const rows = await db.select({ id: schema.authors.id, name: schema.authors.name })
          .from(schema.authors)
          .where(like(schema.authors.name, `%${q}%`))
          .orderBy(schema.authors.name)
          .limit(10)
          .all()
        results = rows.map(r => ({ label: `${r.name} (id: ${r.id})`, value: String(r.id) }))
        break
      }
      case 'reference_id': {
        const rows = await db.select({ id: schema.quoteReferences.id, name: schema.quoteReferences.name })
          .from(schema.quoteReferences)
          .where(like(schema.quoteReferences.name, `%${q}%`))
          .orderBy(schema.quoteReferences.name)
          .limit(10)
          .all()
        results = rows.map(r => ({ label: `${r.name} (id: ${r.id})`, value: String(r.id) }))
        break
      }
      case 'keyword': {
        const rows = await db.select({ name: schema.quotes.name })
          .from(schema.quotes)
          .where(like(schema.quotes.name, `%${q}%`))
          .orderBy(schema.quotes.name)
          .limit(5)
          .all()
        // Show distinct words from matching quote texts
        const words = new Set<string>()
        for (const r of rows) {
          for (const word of r.name.split(/\s+/)) {
            const clean = word.replace(/[^a-zA-ZÀ-ÿ0-9']/g, '')
            if (clean.toLowerCase().includes(q.toLowerCase()) && clean.length > 2) {
              words.add(clean)
            }
          }
        }
        results = Array.from(words).slice(0, 10).map(w => ({ label: w, value: w }))
        break
      }
      case 'featured_quote': {
        const rows = await db.select({ id: schema.quotes.id, name: schema.quotes.name })
          .from(schema.quotes)
          .where(and(
            eq(schema.quotes.status, 'approved'),
            like(schema.quotes.name, `%${q}%`)
          ))
          .orderBy(desc(schema.quotes.likesCount))
          .limit(10)
          .all()
        results = rows.map(r => ({
          label: r.name.length > 80 ? r.name.slice(0, 80) + '…' : r.name,
          value: String(r.id)
        }))
        break
      }
      case 'featured_reference': {
        const rows = await db.select({ id: schema.quoteReferences.id, name: schema.quoteReferences.name })
          .from(schema.quoteReferences)
          .where(like(schema.quoteReferences.name, `%${q}%`))
          .orderBy(desc(schema.quoteReferences.likesCount))
          .limit(10)
          .all()
        results = rows.map(r => ({ label: r.name, value: String(r.id) }))
        break
      }
      case 'language': {
        const languageMap: Record<string, string> = {
          en: 'English', fr: 'French', es: 'Spanish', de: 'German',
          it: 'Italian', pt: 'Portuguese', ru: 'Russian', ja: 'Japanese',
          zh: 'Chinese', la: 'Latin',
        }
        results = Object.entries(languageMap)
          .filter(([code, label]) => code.includes(q.toLowerCase()) || label.toLowerCase().includes(q.toLowerCase()))
          .map(([code, label]) => ({ label: `${label} (${code})`, value: code }))
        break
      }
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('Error searching filter values:', error)
    throwServer(500, 'Failed to search filter values')
  }
})
