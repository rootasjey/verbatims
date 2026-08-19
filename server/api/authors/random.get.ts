import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { count } = getQuery(event)
  let n = parseInt(count as string, 10)
  if (isNaN(n) || n < 1) n = 4
  if (n > 100) n = 100

  const result = await db.all(sql`
    SELECT a.id, a.name, a.job, a.description, a.image_url, a.is_fictional, a.birth_date, a.death_date,
      COALESCE(q.quotes_count, 0) AS quotes_count,
      a.likes_count, a.views_count
    FROM ${schema.authors} a
    LEFT JOIN (
      SELECT qa.author_id, COUNT(DISTINCT q.id) AS quotes_count
      FROM ${schema.quoteAttributions} qa
      INNER JOIN ${schema.quotes} q ON q.id = qa.quote_id AND q.status = 'approved'
      GROUP BY qa.author_id
    ) q ON q.author_id = a.id
    ORDER BY RANDOM()
    LIMIT ${n}
  `)

  return {
    authors: result
  }
})
