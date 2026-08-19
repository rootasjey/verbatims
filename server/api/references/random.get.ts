import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { count } = getQuery(event)
  let n = parseInt(count as string, 10)
  if (isNaN(n) || n < 1) n = 4
  if (n > 100) n = 100

  const result = await db.all(sql`
    SELECT r.id, r.name, r.primary_type, r.secondary_type, r.image_url, r.description,
      COALESCE(q.quotes_count, 0) AS quotes_count,
      r.likes_count, r.views_count
    FROM ${schema.quoteReferences} r
    LEFT JOIN (
      SELECT qa.reference_id, COUNT(DISTINCT q.id) AS quotes_count
      FROM ${schema.quoteAttributions} qa
      INNER JOIN ${schema.quotes} q ON q.id = qa.quote_id AND q.status = 'approved'
      GROUP BY qa.reference_id
    ) q ON q.reference_id = r.id
    ORDER BY RANDOM()
    LIMIT ${n}
  `)

  return {
    references: result
  }
})
