import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const collectionId = getRouterParam(event, 'id')
    if (!collectionId || isNaN(parseInt(collectionId))) {
      throwServer(400, 'Invalid collection ID')
      return
    }
    
    const session = await getUserSession(event)
    
    // Get collection with user info
    type CollectionRow = {
      id: number
      user_id: number
      is_public: number | boolean
      user_name: string | null
      user_avatar: string | null
      [key: string]: unknown
    }

    const collection = await db.get<CollectionRow>(sql`
      SELECT 
        c.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM ${schema.userCollections} c
      LEFT JOIN ${schema.users} u ON c.user_id = u.id
      WHERE c.id = ${parseInt(collectionId)}
    `)
    
    if (!collection) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Collection not found'
      })
    }
    
    // Check access permissions
    const isPublic = collection.is_public === true || collection.is_public === 1
    const canAccess = isPublic || 
                     (session.user && session.user.id === collection.user_id) ||
                     (session.user && (session.user.role === 'admin' || session.user.role === 'moderator'))
    
    if (!canAccess) { throwServer(403, 'Access denied') }
    
    // Get quotes in collection with pagination
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    
    const quotesResult = await db.all(sql`
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        cq.added_at,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM ${schema.collectionQuotes} cq
      JOIN ${schema.quotes} q ON cq.quote_id = q.id
      LEFT JOIN ${schema.authors} a ON q.author_id = a.id
      LEFT JOIN ${schema.quoteReferences} r ON q.reference_id = r.id
      LEFT JOIN ${schema.users} u ON q.user_id = u.id
      LEFT JOIN ${schema.quoteTags} qt ON q.id = qt.quote_id
      LEFT JOIN ${schema.tags} t ON qt.tag_id = t.id
      WHERE cq.collection_id = ${parseInt(collectionId)} AND q.status = 'approved'
      GROUP BY q.id
      ORDER BY cq.added_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const quotes = quotesResult || []

    // Get total quotes count
    const totalResult = await db.get<{ total: number }>(sql`
      SELECT COUNT(*) as total
      FROM ${schema.collectionQuotes} cq
      JOIN ${schema.quotes} q ON cq.quote_id = q.id
      WHERE cq.collection_id = ${parseInt(collectionId)} AND q.status = 'approved'
    `)

    const total = Number(totalResult?.total) || 0
    const hasMore = offset + quotes.length < total

    // Process quotes data
    const processedQuotes = quotes.map((quote: any) => ({
      ...quote,
      tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
        name,
        color: quote.tag_colors?.split(',')[index] || 'gray'
      })) : []
    }))
    
    return {
      success: true,
      data: {
        ...collection,
        quotes: processedQuotes,
        quotes_count: total,
        pagination: {
          page,
          limit,
          total,
          hasMore,
          totalPages: Math.ceil(total / limit)
        }
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error    
    console.error('Collection fetch error:', error)
    throwServer(500, 'Failed to fetch collection')
  }
})
