export default defineEventHandler(async (event) => {
  const db = hubDatabase()
  const { count } = getQuery(event)
  let n = parseInt(count as string, 10)
  if (isNaN(n) || n < 1) n = 4
  if (n > 100) n = 100

  const result = await db.prepare(`
    SELECT a.id, a.name, a.job, a.description, a.image_url, a.is_fictional, a.birth_date, a.death_date,
      COALESCE(q.quotes_count, 0) AS quotes_count,
      a.likes_count, a.views_count
    FROM authors a
    LEFT JOIN (
      SELECT author_id, COUNT(*) AS quotes_count
      FROM quotes
      GROUP BY author_id
    ) q ON q.author_id = a.id
    ORDER BY RANDOM()
    LIMIT ?
  `).bind(n).all()

  return {
    authors: result.results || []
  }
})
