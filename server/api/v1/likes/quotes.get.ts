import { db, schema } from 'hub:db'
import { eq, and, desc, count, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'List liked quotes',
    description: 'Returns paginated list of quotes liked by the authenticated user.',
    tags: ['Quotes'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
    ],
    responses: {
      '200': { description: 'Paginated list of liked quotes' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const offset = (page - 1) * limit

  const totalResult = await db.select({ total: count() })
    .from(schema.userLikes)
    .innerJoin(schema.quotes, eq(schema.userLikes.likeableId, schema.quotes.id))
    .where(and(
      eq(schema.userLikes.userId, api.userId),
      eq(schema.userLikes.likeableType, 'quote'),
      eq(schema.quotes.status, 'approved')
    ))

  const total = Number(totalResult[0]?.total) || 0

  const likedQuotes = await db.all(sql`
    SELECT
      q.id, q.name as content, q.language,
      q.views_count, q.likes_count, q.shares_count,
      q.is_featured, q.created_at, q.updated_at,
      a.id as author_id, a.name as author_name, a.is_fictional as author_is_fictional, a.image_url as author_image_url,
      r.name as reference_name, r.primary_type as reference_type,
      ul.created_at as liked_at,
      GROUP_CONCAT(t.name) as tag_names,
      GROUP_CONCAT(t.color) as tag_colors
    FROM ${schema.userLikes} ul
    INNER JOIN ${schema.quotes} q ON ul.likeable_id = q.id
    LEFT JOIN ${schema.authors} a ON q.author_id = a.id
    LEFT JOIN ${schema.quoteReferences} r ON q.reference_id = r.id
    LEFT JOIN ${schema.quoteTags} qt ON q.id = qt.quote_id
    LEFT JOIN ${schema.tags} t ON qt.tag_id = t.id
    WHERE ul.user_id = ${api.userId}
      AND ul.likeable_type = 'quote'
      AND q.status = 'approved'
    GROUP BY q.id
    ORDER BY ul.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `)

  const data = (likedQuotes || []).map((q: any) => ({
    id: q.id,
    content: q.content,
    language: q.language,
    stats: { views: q.views_count, likes: q.likes_count, shares: q.shares_count },
    featured: !!q.is_featured,
    author: q.author_id ? { id: q.author_id, name: q.author_name, fictional: !!q.author_is_fictional, image_url: q.author_image_url } : null,
    reference: q.reference_id ? { id: q.reference_id, name: q.reference_name, type: q.reference_type } : null,
    tags: parseTags(q.tag_names, q.tag_colors),
    liked_at: q.liked_at,
    created_at: q.created_at,
    updated_at: q.updated_at,
  }))

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
})
