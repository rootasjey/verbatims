export default defineEventHandler(async (event) => {
  const db = hubDatabase()
  const { count } = getQuery(event)
  let n = parseInt(count as string, 10)
  if (isNaN(n) || n < 1) n = 4
  if (n > 100) n = 100

  const result = await db.prepare(`
    SELECT r.id, r.name, r.primary_type, r.secondary_type, r.image_url, r.description,
      COALESCE(q.quotes_count, 0) AS quotes_count,
      r.likes_count, r.views_count
    FROM quote_references r
    LEFT JOIN (
      SELECT reference_id, COUNT(*) AS quotes_count
      FROM quotes
      GROUP BY reference_id
    ) q ON q.reference_id = r.id
    ORDER BY RANDOM()
    LIMIT ?
  `).bind(n).all()

  return {
    references: result.results || []
  }
})
